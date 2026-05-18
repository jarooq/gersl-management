// =============================================================================
// Centralised builder for server-rendered PDF URLs.
//
// SECURITY NOTE — KNOWN RISK (audited 2026-05):
// These URLs carry the raw access token as a `?token=` query parameter so the
// device's *external* PDF viewer (Chrome / system reader) can fetch the file
// without an Authorization header. The backend deliberately whitelists
// `?token=` for these specific report endpoints.
//
// Risks of the query-param token:
//   * It can land in browser history, server access logs, and proxy logs.
//   * It is visible in the OS "recent apps" / share sheet.
//
// Preferred long-term fix (requires no backend change): download the PDF
// in-app via an authenticated Dio GET (the api client already attaches the
// auth header), write it to a temp file, and open the *local* file with
// open_filex / url_launcher. That needs the `open_filex` + `path_provider`
// packages and native config, so it is deferred — every call site funnels
// through this one file so the migration is a single edit.
//
// Until then: keep token-URL construction HERE ONLY. Do not inline
// `?token=` strings elsewhere.
// =============================================================================

import '../app/env.dart';

class PdfLinks {
  const PdfLinks._();

  /// Payslip PDF — `/me/payslips/:id/pdf?token=…`.
  static String payslip(int id, String accessToken) =>
      '${Env.apiBaseUrl}/me/payslips/$id/pdf?token=$accessToken';

  /// Fuel-claim PDF — `/fuel-claims/:id/pdf?token=…`.
  static String fuelClaim(int id, String accessToken) =>
      '${Env.apiBaseUrl}/fuel-claims/$id/pdf?token=$accessToken';

  /// Programme item report PDF — `/{wash|igp}/items/:id/report?token=…`.
  static String programmeItemReport(String kind, int itemId, String accessToken) =>
      '${Env.apiBaseUrl}/$kind/items/$itemId/report?token=$accessToken';
}
