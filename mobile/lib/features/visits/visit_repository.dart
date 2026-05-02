import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';

class VisitRepository {
  final Dio _dio;
  VisitRepository(this._dio);

  Future<List<Map<String, dynamic>>> list({DateTime? from, DateTime? to}) async {
    final res = await _dio.get('/visits', queryParameters: {
      if (from != null) 'from': from.toIso8601String(),
      if (to != null) 'to': to.toIso8601String(),
    });
    final raw = (res.data['data'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  Future<Map<String, dynamic>> create({
    required String customerName,
    required String purpose,
    double? latitude,
    double? longitude,
    int? beneficiariesServed,
    int? projectId,
    int? taskId,
    String? photoUrl,
    String? notes,
  }) async {
    final res = await _dio.post('/visits', data: {
      'customerName': customerName,
      'purpose': purpose,
      'occurredAt': DateTime.now().toUtc().toIso8601String(),
      'latitude': ?latitude,
      'longitude': ?longitude,
      'beneficiariesServed': ?beneficiariesServed,
      'projectId': ?projectId,
      'taskId': ?taskId,
      'photoUrl': ?photoUrl,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return Map<String, dynamic>.from(res.data['data'] as Map);
  }
}

final visitRepoProvider = Provider<VisitRepository>(
  (ref) => VisitRepository(ref.watch(dioProvider)),
);

final myVisitsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(visitRepoProvider).list(),
);
