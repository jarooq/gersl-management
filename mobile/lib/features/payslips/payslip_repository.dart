import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../app/env.dart';
import '../../services/api_client.dart';

class PayslipRepository {
  final Dio _dio;
  PayslipRepository(this._dio);

  Future<List<Map<String, dynamic>>> mine() async {
    final res = await _dio.get('/me/payslips');
    final raw = (res.data['data'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }

  /// The browser-launchable URL for the PDF, including the access token as a
  /// query param so the device's external PDF viewer can fetch it.
  /// (We don't ship the token via Authorization header to launchUrl.)
  String pdfUrl(int id, String accessToken) =>
      '${Env.apiBaseUrl}/me/payslips/$id/pdf?token=$accessToken';
}

final payslipRepoProvider = Provider<PayslipRepository>(
  (ref) => PayslipRepository(ref.watch(dioProvider)),
);

final myPayslipsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(payslipRepoProvider).mine(),
);
