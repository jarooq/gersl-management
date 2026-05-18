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

  /// Browser-launchable URL for the payslip PDF. Token-URL construction is
  /// centralised in [PdfLinks] — see that file for the known `?token=` risk.
  String pdfUrl(int id, String accessToken) => PdfLinks.payslip(id, accessToken);
}

final payslipRepoProvider = Provider<PayslipRepository>(
  (ref) => PayslipRepository(ref.watch(dioProvider)),
);

final myPayslipsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(payslipRepoProvider).mine(),
);
