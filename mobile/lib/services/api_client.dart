import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../app/env.dart';
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

  dio.interceptors.add(InterceptorsWrapper(
    onRequest: (options, handler) async {
      final t = await tokens.readAccess();
      if (t != null && t.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $t';
      }
      handler.next(options);
    },
    onError: (e, handler) async {
      // 401 with refresh token → try once.
      if (e.response?.statusCode == 401) {
        final refresh = await tokens.readRefresh();
        if (refresh != null && refresh.isNotEmpty) {
          try {
            final r = await Dio().post(
              '${Env.apiBaseUrl}/auth/refresh',
              data: {'refreshToken': refresh},
              options: Options(headers: {'Content-Type': 'application/json'}),
            );
            final newAccess = r.data['accessToken'] ?? r.data['data']?['accessToken'];
            if (newAccess is String && newAccess.isNotEmpty) {
              await tokens.save(accessToken: newAccess, refreshToken: refresh);
              final retry = await dio.fetch(e.requestOptions
                ..headers['Authorization'] = 'Bearer $newAccess');
              return handler.resolve(retry);
            }
          } catch (_) {
            await tokens.clear();
          }
        }
      }
      handler.next(e);
    },
  ));
  return dio;
});
