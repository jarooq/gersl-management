import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';

class LeaveRepository {
  final Dio _dio;
  LeaveRepository(this._dio);

  Future<List<Map<String, dynamic>>> mine() async {
    final res = await _dio.get('/me/leave-requests');
    return extractMapList(res.data, const ['leaveRequests', 'leaves']);
  }

  Future<List<Map<String, dynamic>>> pending() async {
    final res = await _dio.get('/me/leave-requests/pending');
    return extractMapList(res.data, const ['leaveRequests', 'leaves']);
  }

  Future<Map<String, dynamic>> create({
    required String leaveType,
    required DateTime startDate,
    required DateTime endDate,
    String? reason,
  }) async {
    final res = await _dio.post('/me/leave-requests', data: {
      'leaveType': leaveType,
      'startDate': _ymd(startDate),
      'endDate':   _ymd(endDate),
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
    return Map<String, dynamic>.from(res.data['data'] as Map);
  }

  Future<void> cancel(int id) async {
    await _dio.patch('/me/leave-requests/$id/cancel');
  }

  Future<void> decide(int id, {required bool approve, String? reason}) async {
    final action = approve ? 'approve' : 'reject';
    await _dio.patch('/me/leave-requests/$id/$action', data: {
      if (reason != null && reason.isNotEmpty) 'reason': reason,
    });
  }
}

String _ymd(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

final leaveRepoProvider = Provider<LeaveRepository>(
  (ref) => LeaveRepository(ref.watch(dioProvider)),
);

final myLeavesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(leaveRepoProvider).mine(),
);
