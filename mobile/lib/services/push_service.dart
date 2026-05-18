// =============================================================================
// Push notification service — FCM init, permission, token registration,
// foreground / background message handlers.
//
// Wiring:
//   - main.dart calls PushService.init() before runApp
//   - auth_controller calls PushService.registerWithServer() after login
//   - logout calls PushService.unregisterFromServer()
//
// Dormant when google-services.json / GoogleService-Info.plist are missing —
// the Firebase init will throw, we catch and log; the rest of the app keeps
// working without pushes.
// =============================================================================

import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../app/env.dart';
import 'token_store.dart';

// Top-level handler required by the FCM background isolate. Must be a
// top-level function (not a method) because Flutter spins it up in a
// separate isolate that doesn't share state with the main app.
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  // Firebase needs to be initialized in this isolate too. Cheap when the
  // app is already running; no-ops if so. Wrapped in try/catch (like
  // PushService.init) so a missing google-services.json / init failure
  // doesn't crash the background isolate.
  try {
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint('[push] background Firebase init failed: $e');
    return;
  }
  if (kDebugMode) {
    debugPrint('[push] background message: ${message.messageId}');
  }
  // We deliberately don't render UI here — Android displays the
  // notification automatically when there's a `notification` payload, and
  // we keep handler logic minimal to avoid background isolate overhead.
}

class PushService {
  static final _flnp = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static StreamSubscription<String>? _tokenSub;

  /// Initialise Firebase + local-notifications + handlers. Idempotent.
  /// Returns true on success, false on any failure (so the app can boot
  /// without pushes if config files are missing).
  static Future<bool> init() async {
    if (_initialized) return true;
    try {
      await Firebase.initializeApp();
    } catch (e) {
      // Most common cause: google-services.json (Android) or
      // GoogleService-Info.plist (iOS) missing. App should still run.
      debugPrint('[push] Firebase init failed — running without pushes: $e');
      return false;
    }

    // Android channel for our default notification importance + sound.
    const androidChannel = AndroidNotificationChannel(
      'gersl_default',
      'GERSL alerts',
      description: 'Approvals, programme updates, and deadline reminders',
      importance: Importance.high,
    );
    await _flnp
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    // Initialise the local-notifications plugin so we can render foreground
    // messages as proper notifications (FCM only shows the OS notification
    // automatically when the app is backgrounded).
    await _flnp.initialize(const InitializationSettings(
      android: AndroidInitializationSettings('@drawable/ic_stat_notify'),
      iOS: DarwinInitializationSettings(),
    ));

    // Wire the background isolate handler.
    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

    // Foreground messages — show our own notification using flutter_local_notifications.
    FirebaseMessaging.onMessage.listen((message) {
      final n = message.notification;
      if (n != null && n.title != null) {
        _flnp.show(
          n.hashCode,
          n.title,
          n.body,
          const NotificationDetails(
            android: AndroidNotificationDetails(
              'gersl_default', 'GERSL alerts',
              importance: Importance.high,
              priority: Priority.high,
            ),
            iOS: DarwinNotificationDetails(),
          ),
        );
      }
    });

    _initialized = true;
    return true;
  }

  /// Ask the OS for push permission, get the FCM token, send it to the
  /// server so future pushes route to this device. Call after login.
  static Future<void> registerWithServer({String? deviceModel}) async {
    if (!_initialized) {
      final ok = await init();
      if (!ok) return;
    }
    try {
      final settings = await FirebaseMessaging.instance.requestPermission(
        alert: true, badge: true, sound: true,
      );
      // On iOS the user can deny; on Android pre-13 it's auto-granted.
      // We send the token either way — denial just means no banners, the
      // token is still valid for silent data pushes if we use them later.
      debugPrint('[push] permission: ${settings.authorizationStatus}');

      // iOS needs APNs to assign a token first; this can return null on
      // first launch — retry once after a short delay.
      String? apns = await FirebaseMessaging.instance.getAPNSToken();
      if (Platform.isIOS && apns == null) {
        await Future<void>.delayed(const Duration(seconds: 2));
        apns = await FirebaseMessaging.instance.getAPNSToken();
      }

      final token = await FirebaseMessaging.instance.getToken();
      if (token == null) {
        debugPrint('[push] FCM token null — APNs key missing?');
        return;
      }
      await _sendTokenToServer(token, deviceModel);

      // Re-register if the token rotates (FCM does this occasionally).
      await _tokenSub?.cancel();
      _tokenSub = FirebaseMessaging.instance.onTokenRefresh.listen((t) async {
        await _sendTokenToServer(t, deviceModel);
      });
    } catch (e) {
      debugPrint('[push] registerWithServer failed: $e');
    }
  }

  static Future<void> _sendTokenToServer(String token, String? deviceModel) async {
    try {
      final access = await TokenStore().readAccess();
      if (access == null) {
        debugPrint('[push] no access token yet, deferring registration');
        return;
      }
      final dio = Dio(BaseOptions(
        baseUrl: Env.apiBaseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $access',
        },
        connectTimeout: const Duration(seconds: 10),
      ));
      final platform = Platform.isIOS ? 'ios' : Platform.isAndroid ? 'android' : 'other';
      final deviceId = await _deviceIdFor(platform);
      await dio.post('/devices', data: {
        'deviceId':  deviceId,
        'platform':  platform,
        'pushToken': token,
        'appVersion': deviceModel ?? 'gersl-mobile',
      });
      debugPrint('[push] token registered with server');
    } catch (e) {
      debugPrint('[push] _sendTokenToServer failed: $e');
    }
  }

  // The DeviceRegistration table uses (user_id, device_id) unique pair, so
  // we need a stable per-device id. The FCM token itself rotates so it can't
  // be used. We generate an id once (platform + clock) and persist it to
  // secure storage so it stays stable across app restarts — only a reinstall
  // (which wipes secure storage) yields a fresh id.
  static Future<String> _deviceIdFor(String platform) async {
    if (_cachedDeviceId != null) return _cachedDeviceId!;
    final store = TokenStore();
    final existing = await store.readDeviceId();
    if (existing != null && existing.isNotEmpty) {
      _cachedDeviceId = existing;
      return existing;
    }
    final ts = DateTime.now().millisecondsSinceEpoch.toRadixString(36);
    final id = '$platform-$ts';
    await store.saveDeviceId(id);
    _cachedDeviceId = id;
    return id;
  }
  static String? _cachedDeviceId;

  /// Logout cleanup — best-effort.
  static Future<void> unregisterFromServer() async {
    try {
      // Server soft-deactivates on logout via its own auth handler; we just
      // delete the FCM token locally so the next user on this device gets a
      // fresh token.
      await FirebaseMessaging.instance.deleteToken();
      await _tokenSub?.cancel();
      _tokenSub = null;
    } catch (_) {/* best-effort */}
  }
}
