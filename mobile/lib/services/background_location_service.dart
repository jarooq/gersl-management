// Background-isolate GPS tracker. Runs in a foreground service on Android with
// a persistent notification (Android 12+ enforces this); on iOS it relies on
// the app being foreground or in significant-change/background-mode state
// (background mode declared in Info.plist).
//
// Architecture:
//   UI isolate (Riverpod) ──IPC── flutter_background_service ──spawns── _onStart
//   _onStart subscribes to Geolocator stream, batches points, POSTs every
//   60s or 25 points, persists access token via SharedPreferences (pulled
//   from secure-storage at start time and copied so the bg isolate can read).
//
// Caveats:
//   * Refresh-on-401 isn't implemented in the bg isolate — if the access
//     token expires mid-track, batches will fail until UI re-auths and the
//     service is restarted.
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

const _notifChannelId = 'gersl_tracking';
const _notifId = 888;

const _prefAccessToken = 'bg.accessToken';
const _prefBaseUrl     = 'bg.baseUrl';

class BackgroundLocationService {
  static final _service = FlutterBackgroundService();

  /// One-time initialization. Call from main() before runApp.
  static Future<void> init() async {
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
  }

  /// Starts the foreground service. Caller must have already obtained
  /// location permission and stored the access token.
  static Future<bool> start({required String accessToken}) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_prefAccessToken, accessToken);
    await prefs.setString(_prefBaseUrl, Env.apiBaseUrl);
    return _service.startService();
  }

  static Future<void> stop() async {
    final running = await _service.isRunning();
    if (running) _service.invoke('stop');
  }

  static Future<bool> isRunning() => _service.isRunning();
}

// Top-level entry point — runs in a separate isolate.
@pragma('vm:entry-point')
void _onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString(_prefAccessToken) ?? '';
  final baseUrl = prefs.getString(_prefBaseUrl) ?? Env.apiBaseUrl;

  final dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    headers: {'Content-Type': 'application/json', 'Authorization': 'Bearer $token'},
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
  ));

  final buffer = <Map<String, dynamic>>[];
  Timer? flushTimer;

  Future<void> flush() async {
    if (buffer.isEmpty) return;
    final payload = List<Map<String, dynamic>>.from(buffer);
    buffer.clear();
    try {
      await dio.post('/locations/batch', data: jsonEncode({'points': payload}));
    } catch (_) {
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
