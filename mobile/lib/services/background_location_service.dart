// Background-isolate GPS tracker. Runs in a foreground service on Android with
// a persistent notification (Android 12+ enforces this); on iOS it relies on
// the app being foreground or in significant-change/background-mode state
// (background mode declared in Info.plist).
//
// Architecture:
//   UI isolate (Riverpod) ──IPC── flutter_background_service ──spawns── _onStart
//   _onStart subscribes to Geolocator stream, batches points, POSTs every
//   60s or 25 points. Auth tokens are read straight from flutter_secure_storage
//   (TokenStore) — that plugin works in background isolates — so tokens are
//   never copied into plaintext SharedPreferences.
//
// Caveats:
//   * The bg isolate refreshes its own access token on 401 (see tryRefresh).
//     If the *refresh* token is rejected, uploads are disabled until the UI
//     re-auths and the service is restarted.
//   * iOS may suspend the isolate when the device is locked unless the
//     significant-location-change API is added separately. For continuous
//     tracking on iOS, plan a v2 using `flutter_background_geolocation` or
//     a custom Swift plugin.

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:ui';

import 'package:dio/dio.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../app/env.dart';
import 'observability.dart';
import 'token_store.dart';

const _notifChannelId = 'gersl_tracking';
const _notifId = 888;

// Non-secret bg-isolate prefs. Auth tokens are NOT stored here — they are
// read from flutter_secure_storage (TokenStore) inside the isolate.
const _prefBaseUrl          = 'bg.baseUrl';
const _prefTracking         = 'bg.tracking';

class BackgroundLocationService {
  static final _service = FlutterBackgroundService();
  static bool _configured = false;

  /// Lazily configures the background-service plugin. Deferred until the
  /// first [start] call — NOT run at app launch.
  ///
  /// Why: configuring at boot (the old `init()` in main()) made iOS pop the
  /// location-permission prompt the moment the app opened, because the iOS
  /// background-service plugin wires up location updates as soon as it is
  /// configured while `location` is in UIBackgroundModes. Configuring only
  /// when the user actually starts tracking (punch in / manual toggle) means
  /// the prompt appears at the right time, in context.
  static Future<void> _ensureConfigured() async {
    if (_configured) return;

    final notif = FlutterLocalNotificationsPlugin();

    // Channel required for Android 8+ foreground services.
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        _notifChannelId,
        'GERSL location tracking',
        description: 'Used while you are punched in to record fuel-claim routes.',
        importance: Importance.low,
      );
      await notif
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }

    await _service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: _onStart,
        autoStart: false,
        isForegroundMode: true,
        notificationChannelId: _notifChannelId,
        initialNotificationTitle: 'GERSL tracking',
        initialNotificationContent: 'Recording your route…',
        foregroundServiceNotificationId: _notifId,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: _onStart,
        onBackground: _onIosBackground,
      ),
    );

    _configured = true;
  }

  /// Starts the foreground service. Caller must have already obtained
  /// location permission and signed in (tokens live in flutter_secure_storage
  /// via TokenStore). The background isolate reads — and refreshes — those
  /// tokens itself; nothing secret is copied into SharedPreferences.
  static Future<bool> start() async {
    await _ensureConfigured();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefBaseUrl, Env.apiBaseUrl);
    // Marks tracking as intended — _onStart bails out unless this is set, so
    // a spurious iOS onForeground callback never subscribes to GPS.
    await prefs.setBool(_prefTracking, true);
    return _service.startService();
  }

  static Future<void> stop() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefTracking, false);
    if (!_configured) return;
    final running = await _service.isRunning();
    if (running) _service.invoke('stop');
  }

  static Future<bool> isRunning() async {
    if (!_configured) return false;
    return _service.isRunning();
  }
}

// Top-level entry point — runs in a separate isolate.
@pragma('vm:entry-point')
void _onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();

  // On iOS, onForeground runs _onStart whenever the app foregrounds. Bail
  // out unless tracking was explicitly requested — otherwise we'd subscribe
  // to the GPS stream (and trigger a location prompt) when the user never
  // started tracking at all.
  if (prefs.getBool(_prefTracking) != true) {
    service.stopSelf();
    return;
  }

  // Tokens come straight from flutter_secure_storage — the same store the UI
  // isolate writes on login/refresh. The plugin works in background isolates,
  // so nothing secret is ever copied into plaintext SharedPreferences.
  final tokenStore = TokenStore();
  var accessToken  = await tokenStore.readAccess() ?? '';
  var refreshToken = await tokenStore.readRefresh() ?? '';
  final baseUrl = prefs.getString(_prefBaseUrl) ?? Env.apiBaseUrl;

  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $accessToken'},
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
  ));

  // 401 recovery in the isolate. The main app's Dio interceptor doesn't run
  // here, so without this the service silently drops GPS points the moment
  // the access token expires. Try the refresh token; if that also fails,
  // surface a notification and stop the buffer flush loop so we don't
  // hammer /locations/batch with 401s forever.
  // `refreshDisabled` is only set when the refresh token itself is genuinely
  // rejected (a 401/invalid-token response, or the server returning no new
  // access token). Transient failures — network timeouts, 5xx, no
  // connectivity — leave it false so a later flush cycle can retry.
  var refreshDisabled = false;
  Future<bool> tryRefresh() async {
    if (refreshDisabled || refreshToken.isEmpty) return false;
    try {
      final r = await Dio().post(
        '$baseUrl/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Content-Type': 'application/json'}),
      );
      final body = r.data is Map ? Map<String, dynamic>.from(r.data as Map) : <String, dynamic>{};
      final newAccess  = (body['accessToken']  ?? body['data']?['accessToken'])?.toString();
      final newRefresh = (body['refreshToken'] ?? body['data']?['refreshToken'])?.toString();
      if (newAccess == null || newAccess.isEmpty) {
        // Server accepted the call but issued no token — the refresh token is
        // no longer usable. Disable permanently to avoid hammering /refresh.
        refreshDisabled = true;
        breadcrumb(
          'bg-location: refresh disabled — server returned no accessToken',
          category: 'bg-location',
        );
        return false;
      }
      accessToken = newAccess;
      if (newRefresh != null && newRefresh.isNotEmpty) refreshToken = newRefresh;
      // Persist the rotated tokens back to secure storage so the UI isolate
      // and any future bg restart pick them up.
      await tokenStore.save(accessToken: accessToken, refreshToken: refreshToken);
      dio.options.headers['Authorization'] = 'Bearer $accessToken';
      return true;
    } on DioException catch (e) {
      // A 401/403 means the refresh token is invalid — disable permanently.
      // Anything else (timeout, connection error, 5xx) is transient: keep
      // refreshDisabled false so the next flush cycle retries.
      final status = e.response?.statusCode;
      final invalidToken = status == 401 || status == 403;
      if (invalidToken) {
        refreshDisabled = true;
        breadcrumb(
          'bg-location: refresh disabled — refresh token rejected ($status)',
          category: 'bg-location',
        );
      } else {
        breadcrumb(
          'bg-location: refresh failed (transient, will retry): '
          '${e.type} ${status ?? ''}',
          category: 'bg-location',
        );
      }
      return false;
    } catch (e, st) {
      // Unexpected non-Dio error — treat as transient, don't disable.
      captureError(e, st, {'where': 'bg-location.tryRefresh'});
      return false;
    }
  }

  final buffer = <Map<String, dynamic>>[];
  Timer? flushTimer;

  Future<void> flush() async {
    if (buffer.isEmpty || refreshDisabled) return;
    final payload = List<Map<String, dynamic>>.from(buffer);
    buffer.clear();
    try {
      await dio.post('/locations/batch', data: jsonEncode({'points': payload}));
    } catch (e) {
      // On 401 try a single refresh + retry. Other errors push points back
      // onto the buffer for the next flush cycle. Log so we can spot
      // chronic flush failures in device logs.
      final isAuthError = e is DioException && e.response?.statusCode == 401;
      if (isAuthError && await tryRefresh()) {
        try {
          await dio.post('/locations/batch', data: jsonEncode({'points': payload}));
          return;
        } catch (e2, st2) {
          captureError(e2, st2, {'where': 'bg-location.flush.retryAfterRefresh'});
        }
      } else if (!isAuthError) {
        breadcrumb(
          'bg-location: flush failed, re-buffering ${payload.length} pts — '
          '${e.runtimeType}',
          category: 'bg-location',
        );
      }
      buffer.insertAll(0, payload);
    }
  }

  final posSub = Geolocator.getPositionStream(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: 10,
    ),
  ).listen((p) {
    buffer.add({
      'recordedAt': DateTime.now().toUtc().toIso8601String(),
      'latitude':   p.latitude,
      'longitude':  p.longitude,
      'accuracyM':  p.accuracy,
      'speedKmh':   p.speed * 3.6,
    });
    if (buffer.length >= 25) flush();

    if (service is AndroidServiceInstance) {
      service.setForegroundNotificationInfo(
        title: 'GERSL tracking',
        content: 'Recorded ${buffer.length} unsent point${buffer.length == 1 ? '' : 's'}',
      );
    }
  });

  flushTimer = Timer.periodic(const Duration(minutes: 1), (_) => flush());

  service.on('stop').listen((_) async {
    await posSub.cancel();
    flushTimer?.cancel();
    await flush();
    service.stopSelf();
  });
}

@pragma('vm:entry-point')
Future<bool> _onIosBackground(ServiceInstance service) async {
  // Required by the plugin even if we don't keep the iOS isolate alive.
  return true;
}
