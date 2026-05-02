import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';

class ExpenseRepository {
  final Dio _dio;
  ExpenseRepository(this._dio);

  Future<List<Map<String, dynamic>>> mine() async {
    final res = await _dio.get('/me/expenses');
    final raw = (res.data['data'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  Future<List<Map<String, dynamic>>> pending() async {
    final res = await _dio.get('/me/expenses/pending');
    final raw = (res.data['data'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  Future<void> decide(int id, {required bool approve}) async {
    final action = approve ? 'approve' : 'reject';
    await _dio.patch('/me/expenses/$id/$action');
  }

  Future<Map<String, dynamic>> create({
    required DateTime date,
    required String category,
    required String description,
    required num amount,
    String? receiptUrl,
    int? projectId,
    String? paymentMethod,
  }) async {
    final res = await _dio.post('/me/expenses', data: {
      'date': _ymd(date),
      'category': category,
      'description': description,
      'amount': amount,
      'receiptUrl': ?receiptUrl,
      'projectId': ?projectId,
      'paymentMethod': ?paymentMethod,
    });
    return Map<String, dynamic>.from(res.data['data'] as Map);
  }

  Future<void> cancel(int id) async {
    await _dio.patch('/me/expenses/$id/cancel');
  }

  // Upload a receipt image and return the stored URL.
  Future<String?> uploadReceipt(File file) async {
    final form = FormData.fromMap({
      'image': await MultipartFile.fromFile(file.path, filename: file.uri.pathSegments.last),
    });
    final res = await _dio.post('/upload/visit',
      data: form,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
    );
    final data = res.data['data'] ?? res.data;
    return (data['url'] ?? data['path'])?.toString();
  }
}

String _ymd(DateTime d) =>
    '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

final expenseRepoProvider = Provider<ExpenseRepository>(
  (ref) => ExpenseRepository(ref.watch(dioProvider)),
);

final myExpensesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(expenseRepoProvider).mine(),
);
