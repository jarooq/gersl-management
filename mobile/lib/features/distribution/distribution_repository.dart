// =============================================================================
// DistributionRepository — QR-code beneficiary distribution check-in.
//
//   GET  /distribution-events?status=Active   → active events for the picker
//   POST /distribution-scans                  → record one scan
//        body { token, eventId, latitude, longitude, notes, clientUuid }
//        201 new · 200 existing (clientUuid replay) · 409 already-scanned
//
// Failures are surfaced as ScanException with a typed reason so the screen
// and the offline-queue flusher can branch on category instead of parsing
// status codes everywhere.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';
import '../../services/scan_queue.dart';

/// Why a scan submission failed.
enum ScanFailure {
  /// 401/403 — token rejected. Stop flushing; the user must re-auth.
  auth,

  /// 409 — this beneficiary is already recorded for this event. Permanent
  /// for the row, but harmless: the distribution is captured server-side.
  duplicate,

  /// Connection error / timeout — transient, retry when back online.
  network,

  /// 5xx — server-side fault, transient.
  server,

  /// 4xx other than auth/duplicate (e.g. unknown token, closed event) —
  /// permanent: retrying the same payload can never succeed.
  invalid,
}

class ScanException implements Exception {
  final ScanFailure reason;
  final String message;
  final int? statusCode;
  const ScanException(this.reason, this.message, {this.statusCode});

  bool get isTransient =>
      reason == ScanFailure.network || reason == ScanFailure.server;

  @override
  String toString() => 'ScanException(${reason.name}): $message';
}

/// Result of a queue flush — what the "Sync now" toast reports.
class FlushResult {
  final int synced;
  final int failed;
  final ScanFailure? stoppedOn; // non-null when flush aborted early
  const FlushResult({required this.synced, required this.failed, this.stoppedOn});
}

class DistributionRepository {
  final Dio _dio;
  final ScanQueue _queue;
  DistributionRepository(this._dio, this._queue);

  /// Active distribution events for the event picker.
  Future<List<Map<String, dynamic>>> listEvents() async {
    final res = await _dio.get(
      '/distribution-events',
      queryParameters: {'status': 'Active'},
    );
    return extractMapList(res.data, const ['events', 'rows']);
  }

  /// Submit one scan. Returns the parsed scan record on 2xx (201 = newly
  /// recorded, 200 = idempotent replay of an already-synced clientUuid).
  /// Throws [ScanException] on everything else.
  Future<Map<String, dynamic>> submitScan({
    required String token,
    required int eventId,
    double? lat,
    double? lng,
    String? notes,
    required String clientUuid,
  }) async {
    try {
      final res = await _dio.post('/distribution-scans', data: {
        'token': token,
        'eventId': eventId,
        'latitude': ?lat,
        'longitude': ?lng,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        'clientUuid': clientUuid,
      });
      // The server puts the beneficiary name at different paths depending on
      // whether this is a fresh 201 (sibling of `scan`) or a 200 replay
      // (nested at scan.enrolment.beneficiary.fullName). Promote it onto
      // the returned scan map so the UI can show a "Recorded — Name" toast
      // for both cases.
      final scan = extractMap(res.data, const ['scan']) ?? <String, dynamic>{};
      final outer = res.data is Map ? (res.data as Map) : const {};
      final outerData = outer['data'] is Map ? outer['data'] as Map : const {};
      final nestedBen = scan['enrolment'] is Map
          ? ((scan['enrolment'] as Map)['beneficiary'] is Map
              ? (scan['enrolment'] as Map)['beneficiary'] as Map
              : null)
          : null;
      final beneficiaryName = outerData['beneficiaryName']
          ?? outer['beneficiaryName']
          ?? nestedBen?['fullName'];
      if (beneficiaryName is String && beneficiaryName.isNotEmpty) {
        scan['beneficiaryName'] = beneficiaryName;
      }
      return scan;
    } on DioException catch (e) {
      throw _classify(e);
    }
  }

  ScanException _classify(DioException e) {
    final status = e.response?.statusCode;
    final serverMsg = _serverMessage(e.response?.data);

    if (status == null) {
      // No response at all → connection error / timeout / cancelled.
      return ScanException(
        ScanFailure.network,
        serverMsg ?? 'No connection to the server.',
      );
    }
    if (status == 401) {
      return ScanException(
        ScanFailure.auth,
        serverMsg ?? 'Your session has expired. Please sign in again.',
        statusCode: status,
      );
    }
    if (status == 403) {
      // 403 is permission, not expiry — telling the user to "sign in again"
      // when they're already signed in is misleading.
      return ScanException(
        ScanFailure.auth,
        serverMsg ?? 'You do not have permission to record distribution scans.',
        statusCode: status,
      );
    }
    if (status == 409) {
      return ScanException(
        ScanFailure.duplicate,
        serverMsg ?? 'Already scanned for this event.',
        statusCode: status,
      );
    }
    if (status >= 500) {
      return ScanException(
        ScanFailure.server,
        serverMsg ?? 'Server error. Please try again.',
        statusCode: status,
      );
    }
    return ScanException(
      ScanFailure.invalid,
      serverMsg ?? 'The scan was rejected (HTTP $status).',
      statusCode: status,
    );
  }

  String? _serverMessage(dynamic data) {
    if (data is Map) {
      final m = data['message'];
      if (m is String && m.trim().isNotEmpty) return m;
      final e = data['error'];
      if (e is String && e.trim().isNotEmpty) return e;
    }
    return null;
  }

  /// Replay the offline queue.
  ///   • 2xx            → markSynced (row removed)
  ///   • 409 duplicate  → markSynced too — the beneficiary IS recorded
  ///                      server-side, keeping the row would retry forever
  ///   • network/server → markFailed (retry_count++). A network error also
  ///                      aborts the rest of the flush: if this row couldn't
  ///                      reach the server, none of the others will either,
  ///                      and each attempt burns a 15 s connect timeout.
  ///   • auth/invalid   → stop flushing (auth: retry after re-login;
  ///                      invalid: markFailed so the bad payload is visible,
  ///                      then stop so we don't churn).
  Future<FlushResult> flushQueue() async {
    var synced = 0;
    var failed = 0;
    final rows = await _queue.pending();
    for (final row in rows) {
      final clientUuid = row['client_uuid'] as String;
      try {
        await submitScan(
          token: row['token'] as String,
          eventId: (row['event_id'] as num).toInt(),
          lat: (row['latitude'] as num?)?.toDouble(),
          lng: (row['longitude'] as num?)?.toDouble(),
          notes: row['notes'] as String?,
          clientUuid: clientUuid,
        );
        await _queue.markSynced(clientUuid);
        synced++;
      } on ScanException catch (e) {
        switch (e.reason) {
          case ScanFailure.duplicate:
            // Already recorded for the event — dequeue, count as synced.
            await _queue.markSynced(clientUuid);
            synced++;
          case ScanFailure.network:
          case ScanFailure.server:
            await _queue.markFailed(clientUuid, e.message);
            failed++;
            if (e.reason == ScanFailure.network) {
              return FlushResult(
                  synced: synced, failed: failed, stoppedOn: e.reason);
            }
          case ScanFailure.auth:
            return FlushResult(
                synced: synced, failed: failed, stoppedOn: e.reason);
          case ScanFailure.invalid:
            // Permanent server-side rejection (closed event, bad token,
            // wrong project, …). Dequeue the poison row and CONTINUE — if
            // we return here, every later flush hits the same dead row
            // first and the rest of the queue is wedged forever.
            await _queue.markSynced(clientUuid);
            failed++;
        }
      }
    }
    return FlushResult(synced: synced, failed: failed);
  }
}

final distributionRepoProvider = Provider<DistributionRepository>(
  (ref) => DistributionRepository(
    ref.watch(dioProvider),
    ref.watch(scanQueueProvider),
  ),
);
