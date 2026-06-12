import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/env.dart';
import '../features/auth/auth_controller.dart';
import 'observability.dart';
import 'token_store.dart';

final tokenStoreProvider = Provider<TokenStore>((ref) => TokenStore());

final dioProvider = Provider<Dio>((ref) {
  final tokens = ref.watch(tokenStoreProvider);
  final dio = Dio(BaseOptions(
    baseUrl: Env.apiBaseUrl,
    connectTimeout: const Duration(seconds: 15),
    receiveTimeout: const Duration(seconds: 30),
    headers: {'Content-Type': 'application/json'},
  ));

  // Force-logout helper: clear tokens AND flip the auth state so the router
  // redirect kicks in and shows the login screen.
  Future<void> forceSignOut() async {
    final controller = ref.read(authControllerProvider.notifier);
    await controller.forceLogout();
  }

  // 401 refresh mutex (audit-hardening 2026-05). Previously N concurrent
  // 401s spawned N refresh calls, each writing a different access token to
  // storage; the last one wins, all earlier retries used a token that was
  // overwritten mid-flight. We now share a single in-flight refresh future
  // so concurrent 401s wait for the same result.
  Future<String?>? inFlightRefresh;
  Future<String?> refreshAccessToken() {
    return inFlightRefresh ??= (() async {
      try {
        final refresh = await tokens.readRefresh();
        if (refresh == null || refresh.isEmpty) return null;
        final r = await Dio().post(
          '${Env.apiBaseUrl}/auth/refresh',
          data: {'refreshToken': refresh},
          options: Options(headers: {'Content-Type': 'application/json'}),
        );
        final newAccess = r.data['accessToken'] ?? r.data['data']?['accessToken'];
        // The server ROTATES the refresh token on every refresh — the old
        // one is no longer valid against the DB. Persist the new one or
        // every active user gets force-logged-out on the second refresh
        // cycle (≈ every 48h with the 24h access-token TTL).
        final newRefresh =
            r.data['refreshToken'] ?? r.data['data']?['refreshToken'] ?? refresh;
        if (newAccess is String && newAccess.isNotEmpty) {
          await tokens.save(
            accessToken: newAccess,
            refreshToken: newRefresh is String && newRefresh.isNotEmpty
                ? newRefresh
                : refresh,
          );
          return newAccess;
        }
        return null;
      } catch (_) {
        return null;
      } finally {
        // Release the mutex on the next microtask so any other 401s that
        // were just about to read inFlightRefresh see a non-null future.
        scheduleMicrotask(() { inFlightRefresh = null; });
      }
    })();
  }

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final t = await tokens.readAccess();
      if (t != null && t.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $t';
      }
      handler.next(options);
    },
    onError: (e, handler) async {
      // Forward server-side and network errors to Sentry as breadcrumbs so
      // future captureException calls have request context. 401s are excluded
      // because the refresh flow below handles them silently.
      final status = e.response?.statusCode;
      if (status == null || status >= 500) {
        captureError(e, e.stackTrace, {
          'method':  e.requestOptions.method,
          'url':     e.requestOptions.uri.toString(),
          'status':  status,
          'message': e.message,
        });
      } else if (status >= 400 && status != 401) {
        breadcrumb(
          '${e.requestOptions.method} ${e.requestOptions.path} → $status',
          category: 'http',
          data: { 'status': status },
        );
      }

      // Skip auth handling for the auth endpoints themselves so we don't loop.
      final url = e.requestOptions.uri.toString();
      final isAuthEndpoint = url.contains('/auth/login') ||
                             url.contains('/auth/refresh') ||
                             url.contains('/auth/logout');

      if (e.response?.statusCode == 401 && !isAuthEndpoint) {
        final newAccess = await refreshAccessToken();
        if (newAccess != null) {
          final retry = await dio.fetch(e.requestOptions
            ..headers['Authorization'] = 'Bearer $newAccess');
          return handler.resolve(retry);
        }
        // Refresh failed / no refresh token — force the user back to login.
        await forceSignOut();
      }
      handler.next(e);
    },
  ));
  return dio;
});
