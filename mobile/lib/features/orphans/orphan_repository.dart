// =============================================================================
// Orphan repository — talks to /api/orphans/* for the mobile orphan-care UI.
// Field coordinators use this to see their assigned orphans, view dossier
// details, and log visits with photos + GPS.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';

class OrphanRepository {
  final Dio _dio;
  OrphanRepository(this._dio);

  // Coordinator's assigned orphans.
  Future<List<Map<String, dynamic>>> myOrphans() async {
    final res = await _dio.get('/orphans/mine');
    return extractMapList(res.data);
  }

  // Full dossier for one orphan.
  Future<Map<String, dynamic>> getOne(int id) async {
    final res = await _dio.get('/orphans/$id');
    final body = res.data;
    if (body is Map && body['data'] is Map) {
      final data = Map<String, dynamic>.from(body['data'] as Map);
      // Some endpoints nest under data.orphan, some flatten — handle both.
      if (data['orphan'] is Map) return Map<String, dynamic>.from(data['orphan'] as Map);
      return data;
    }
    return <String, dynamic>{};
  }

  // Visit history for one orphan — pulls from the unified visit-log endpoint.
  // Endpoint path corrected 2026-05-15: server route is /visit-logs/orphan/:id
  // (see visitLog.routes.js). Mobile previously hit /visit-logs/by-orphan/:id
  // which always 404'd silently → empty visit history in the dossier.
  Future<List<Map<String, dynamic>>> visitsFor(int orphanId) async {
    final res = await _dio.get('/visit-logs/orphan/$orphanId',
        queryParameters: {'limit': 50});
    return extractMapList(res.data, const ['logs', 'visits']);
  }

  // Log an orphan visit through the generic /visits endpoint. The visit
  // model already carries orphanId + visitType so this writes into the
  // same table the web dossier reads from.
  Future<void> logVisit({
    required int orphanId,
    required String customerName,
    String? purpose,
    String? notes,
    int? beneficiariesServed,
    String? photoUrl,
    double? latitude,
    double? longitude,
    int? projectId,
  }) async {
    await _dio.post(
      '/visits',
      data: {
        'orphanId': orphanId,
        'visitType': 'orphan',
        'customerName': customerName,
        if (purpose != null && purpose.isNotEmpty)  'purpose': purpose,
        if (notes != null && notes.isNotEmpty)      'notes': notes,
        if (beneficiariesServed != null)            'beneficiariesServed': beneficiariesServed,
        if (photoUrl != null)                       'photoUrl': photoUrl,
        if (latitude != null)                       'latitude': latitude,
        if (longitude != null)                      'longitude': longitude,
        if (projectId != null)                      'projectId': projectId,
      },
      options: Options(headers: {'X-Client': 'mobile'}),
    );
  }
}

final orphanRepoProvider = Provider<OrphanRepository>(
  (ref) => OrphanRepository(ref.watch(dioProvider)),
);
