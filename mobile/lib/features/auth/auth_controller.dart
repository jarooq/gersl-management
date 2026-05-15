import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/observability.dart';
import '../../services/push_service.dart';

class AuthState {
  final bool isAuthenticated;
  final Map<String, dynamic>? user;
  const AuthState({required this.isAuthenticated, this.user});

  AuthState copy({bool? isAuthenticated, Map<String, dynamic>? user}) =>
      AuthState(
        isAuthenticated: isAuthenticated ?? this.isAuthenticated,
        user: user ?? this.user,
      );
}

class AuthController extends AsyncNotifier<AuthState> {
  @override
  Future<AuthState> build() async {
    final tokens = ref.read(tokenStoreProvider);
    final access = await tokens.readAccess();
    if (access == null || access.isEmpty) {
      return const AuthState(isAuthenticated: false);
    }
    final userJson = await tokens.readUserJson();
    final user = userJson == null ? null : jsonDecode(userJson) as Map<String, dynamic>;
    _tagSentryUser(user);
    // Refresh the profile from the server in the background so changes made
    // on another device (e.g. a profile photo uploaded from a different
    // phone) appear without a re-login. The cached copy is returned now so
    // app startup isn't blocked on the network.
    // ignore: discarded_futures
    Future.microtask(refreshUser);
    return AuthState(isAuthenticated: true, user: user);
  }

  /// Re-fetch the signed-in user from the server and replace the cached
  /// copy. Lets cross-device profile changes (photo, name, role) propagate
  /// without a re-login. Silent on failure — the cached user is kept, so an
  /// offline launch never signs the user out.
  Future<void> refreshUser() async {
    try {
      final res = await ref.read(dioProvider).get('/auth/me');
      final body = res.data as Map<String, dynamic>;
      final user = (body['user'] ?? body['data']?['user']) as Map<String, dynamic>?;
      if (user == null) return;
      final cur = state.valueOrNull;
      if (cur == null || !cur.isAuthenticated) return;
      final tokens = ref.read(tokenStoreProvider);
      final access = await tokens.readAccess();
      final refresh = await tokens.readRefresh();
      if (access != null) {
        await tokens.save(
          accessToken: access,
          refreshToken: refresh,
          userJson: jsonEncode(user),
        );
      }
      _tagSentryUser(user);
      state = AsyncData(AuthState(isAuthenticated: true, user: user));
    } catch (_) {
      // Keep the cached user — transient / offline errors must not sign out.
    }
  }

  void _tagSentryUser(Map<String, dynamic>? user) {
    if (user == null) return;
    setUserContext(
      id:    user['id'] is int ? user['id'] as int : null,
      email: user['email'] as String?,
      role:  user['role'] as String?,
    );
  }

  Future<void> login(String username, String password) async {
    final dio = ref.read(dioProvider);
    final tokens = ref.read(tokenStoreProvider);
    state = const AsyncLoading();
    try {
      final res = await dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });
      final body = res.data as Map<String, dynamic>;
      final accessToken = body['accessToken'] as String?;
      final refreshToken = body['refreshToken'] as String?;
      final user = (body['user'] ?? body['data']?['user']) as Map<String, dynamic>?;
      if (accessToken == null) {
        throw Exception('Login response missing accessToken');
      }
      await tokens.save(
        accessToken: accessToken,
        refreshToken: refreshToken,
        userJson: user == null ? null : jsonEncode(user),
      );
      _tagSentryUser(user);
      state = AsyncData(AuthState(isAuthenticated: true, user: user));
      // Register this device for push after login. Fire-and-forget — never
      // blocks the auth flow.
      // ignore: discarded_futures
      PushService.registerWithServer();
    } catch (err, st) {
      state = AsyncError(err, st);
      rethrow;
    }
  }

  Future<void> logout() async {
    final tokens = ref.read(tokenStoreProvider);
    try {
      await ref.read(dioProvider).post('/auth/logout');
    } catch (_) {/* ignore network errors on logout */}
    // Drop the FCM token + stop listening for refreshes before clearing
    // local tokens. Best-effort.
    await PushService.unregisterFromServer();
    await tokens.clear();
    clearUserContext();
    state = const AsyncData(AuthState(isAuthenticated: false));
  }

  /// Merge a new profile-photo URL into the cached user, persist it, and
  /// push the updated state so every avatar in the app refreshes. Called
  /// after a successful avatar upload.
  Future<void> updateAvatar(String? url) async {
    final cur = state.valueOrNull;
    if (cur == null || cur.user == null) return;
    final updated = {...cur.user!, 'avatarUrl': url};
    final tokens = ref.read(tokenStoreProvider);
    final access = await tokens.readAccess();
    final refresh = await tokens.readRefresh();
    if (access != null) {
      await tokens.save(
        accessToken: access,
        refreshToken: refresh,
        userJson: jsonEncode(updated),
      );
    }
    state = AsyncData(cur.copy(user: updated));
  }

  /// Local-only logout — clears tokens and flips auth state without
  /// hitting the network. Called from the dio 401 interceptor when the
  /// stored token is no longer accepted by the backend (e.g. issued by
  /// a different environment, or expired beyond refresh).
  Future<void> forceLogout() async {
    final tokens = ref.read(tokenStoreProvider);
    await tokens.clear();
    clearUserContext();
    state = const AsyncData(AuthState(isAuthenticated: false));
  }
}

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthState>(AuthController.new);
