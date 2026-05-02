import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';

class AdvanceRepository {
  final Dio _dio;
  AdvanceRepository(this._dio);

  Future<List<Map<String, dynamic>>> list({String? status}) async {
    final res = await _dio.get('/salary-advances', queryParameters: {
      'status': ?status,
    });
    final raw = (res.data['data'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  Future<Map<String, dynamic>> create({required num amount, String? reason}) async {
    final res = await _dio.post('/salary-advances', data: {
      'amount': amount,
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
    return Map<String, dynamic>.from(res.data['data'] as Map);
  }

  Future<void> decide(int id, {required bool approve, String? notes}) async {
    final action = approve ? 'approve' : 'reject';
    await _dio.patch('/salary-advances/$id/$action', data: {
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
  }

  Future<void> cancel(int id) async {
    await _dio.patch('/salary-advances/$id/cancel');
  }
}

final advanceRepoProvider = Provider<AdvanceRepository>(
  (ref) => AdvanceRepository(ref.watch(dioProvider)),
);

final advancesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(advanceRepoProvider).list(),
);
