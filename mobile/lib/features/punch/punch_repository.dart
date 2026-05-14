import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';

class PunchRepository {
  final Dio _dio;
  PunchRepository(this._dio);

  Future<Map<String, dynamic>> today() async {
    final res = await _dio.get('/attendance/punches/today');
    return (res.data['data'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> record({
    required String punchType,
    double? latitude,
    double? longitude,
    double? accuracyM,
    String? selfieUrl,
    String? deviceId,
    String? notes,
  }) async {
    final res = await _dio.post('/attendance/punches', data: {
      'punchType': punchType,
      'latitude': ?latitude,
      'longitude': ?longitude,
      'accuracyM': ?accuracyM,
      'selfieUrl': ?selfieUrl,
      'deviceId': ?deviceId,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return (res.data['data'] as Map).cast<String, dynamic>();
  }

  Future<List<dynamic>> myRecent() async {
    final res = await _dio.get('/attendance/punches/me');
    return (res.data['data']['punches'] as List? ?? []);
  }

  // Net weekly hours per the 45h + 1h auto-lunch policy. Returns the raw
  // server payload so the screen can read totalHours, targetHours,
  // balance, and the daily breakdown.
  Future<Map<String, dynamic>> weeklyHours({String? weekOf}) async {
    final res = await _dio.get(
      '/attendance/punches/weekly',
      queryParameters: weekOf == null ? null : {'weekOf': weekOf},
    );
    final body = res.data;
    if (body is Map && body['data'] is Map) {
      return Map<String, dynamic>.from(body['data'] as Map);
    }
    return <String, dynamic>{};
  }
}

final punchRepoProvider = Provider<PunchRepository>(
  (ref) => PunchRepository(ref.watch(dioProvider)),
);
