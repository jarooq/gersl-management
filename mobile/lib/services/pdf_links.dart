// =============================================================================
// Centralised builder for server-rendered PDF URLs.
//
// The device's *external* PDF viewer (Chrome / system reader) fetches the file
// without an Authorization header, so the token has to travel in the URL as a
// `?token=` query parameter — which can land in browser history and server /
// proxy access logs.
//
// To keep that exposure minimal we do NOT put the long-lived session JWT in
// the URL. Each call mints a fresh, short-lived (~2 minute) *download token*
// from `GET /api/auth/download-token`; even if it leaks into a log it is
// useless within minutes. verifyToken on the backend accepts it like any
// other JWT.
//
// Keep all `?token=` URL construction HERE — do not inline it elsewhere.
// =============================================================================

import 'package:dio/dio.dart';

import '../app/env.dart';

class PdfLinks {
  const PdfLinks._();

  /// Fetch a short-lived download token. `dio` already attaches the session
  /// auth header via its interceptor, so this call itself is authenticated.
  static Future<String> _downloadToken(Dio dio) async {
    final res = await dio.get('/auth/download-token');
    final data = res.data is Map ? res.data['data'] : null;
    final token = data is Map ? data['token'] : null;
    if (token is! String || token.isEmpty) {
      throw Exception('Could not obtain a download token');
    }
    return token;
  }

  /// Payslip PDF — `/me/payslips/:id/pdf?token=<short-lived>`.
  static Future<String> payslip(Dio dio, int id) async =>
      '${Env.apiBaseUrl}/me/payslips/$id/pdf?token=${await _downloadToken(dio)}';

  /// Fuel-claim PDF — `/fuel-claims/:id/pdf?token=<short-lived>`.
  static Future<String> fuelClaim(Dio dio, int id) async =>
      '${Env.apiBaseUrl}/fuel-claims/$id/pdf?token=${await _downloadToken(dio)}';

  /// Programme item report PDF — `/{wash|igp}/items/:id/report?token=<short-lived>`.
  static Future<String> programmeItemReport(Dio dio, String kind, int itemId) async =>
      '${Env.apiBaseUrl}/$kind/items/$itemId/report?token=${await _downloadToken(dio)}';
}
