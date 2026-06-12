import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';
import '../../services/pdf_links.dart';

class PayslipRepository {
  final Dio _dio;
  PayslipRepository(this._dio);

  Future<List<Map<String, dynamic>>> mine() async {
    final res = await _dio.get('/me/payslips');
    return extractMapList(res.data, const ['payslips']);
  }

  /// Browser-launchable URL for the payslip PDF. The URL carries a fresh
  /// short-lived download token (see [PdfLinks]).
  Future<String> pdfUrl(int id) => PdfLinks.payslip(_dio, id);
}

final payslipRepoProvider = Provider<PayslipRepository>(
  (ref) => PayslipRepository(ref.watch(dioProvider)),
);

final myPayslipsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(payslipRepoProvider).mine(),
);
