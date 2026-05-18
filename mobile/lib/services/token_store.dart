import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStore {
  static const _accessKey = 'gersl_access_token';
  static const _refreshKey = 'gersl_refresh_token';
  static const _userKey = 'gersl_user_json';
  static const _deviceIdKey = 'gersl_device_id';

  static const _storage = FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );

  Future<String?> readAccess() => _storage.read(key: _accessKey);
  Future<String?> readRefresh() => _storage.read(key: _refreshKey);
  Future<String?> readUserJson() => _storage.read(key: _userKey);

  /// Stable per-install device id used for push-token registration. Persisted
  /// so it survives app restarts (the FCM token rotates, so it can't be used).
  /// Deliberately NOT cleared by [clear] — it identifies the device, not the
  /// session, so it stays stable across logout/login on the same install.
  Future<String?> readDeviceId() => _storage.read(key: _deviceIdKey);
  Future<void> saveDeviceId(String id) =>
      _storage.write(key: _deviceIdKey, value: id);

  Future<void> save({
    required String accessToken,
    String? refreshToken,
    String? userJson,
  }) async {
    await _storage.write(key: _accessKey, value: accessToken);
    if (refreshToken != null) {
      await _storage.write(key: _refreshKey, value: refreshToken);
    }
    if (userJson != null) {
      await _storage.write(key: _userKey, value: userJson);
    }
  }

  Future<void> clear() async {
    await _storage.delete(key: _accessKey);
    await _storage.delete(key: _refreshKey);
    await _storage.delete(key: _userKey);
  }
}
