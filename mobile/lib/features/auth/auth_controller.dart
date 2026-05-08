import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/observability.dart';

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
    return AuthState(isAuthenticated: true, user: user);
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
    await tokens.clear();
    clearUserContext();
    state = const AsyncData(AuthState(isAuthenticated: false));
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
