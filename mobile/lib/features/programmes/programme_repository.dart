// =============================================================================
// Programme repository — talks to /api/wash and /api/igp.
//
// Field officers use the mobile app primarily to:
//   1. See items assigned to them (across WASH and IGP)
//   2. Advance an item's stage with photo + GPS evidence
//
// Same Dio instance + extractMap helpers used elsewhere in the app, so the
// defensive _Map cast fix carries across.
// =============================================================================

import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';

class ProgrammeRepository {
  final Dio _dio;
  ProgrammeRepository(this._dio);

  // ---------------------------------------------------------------------------
  // WASH endpoints
  // ---------------------------------------------------------------------------
  Future<List<Map<String, dynamic>>> myWashItems() async {
    final res = await _dio.get('/wash/items/mine');
    return extractMapList(res.data, const []);
  }

  Future<Map<String, dynamic>> getWashItem(int id) async {
    final res = await _dio.get('/wash/items/$id');
    return extractMap(res.data, const []) ?? <String, dynamic>{};
  }

  Future<void> transitionWash(int itemId, {
    required String newStage,
    String? notes,
    int? percentComplete,
    List<String>? photoUrls,
    double? latitude,
    double? longitude,
  }) async {
    await _dio.patch(
      '/wash/items/$itemId/stage',
      data: {
        'newStage': newStage,
        'notes': notes,
        'percentComplete': percentComplete,
        'photoUrls': photoUrls ?? const <String>[],
        'latitude':  latitude,
        'longitude': longitude,
        'source': 'mobile',
      },
      options: Options(headers: {'X-Client': 'mobile'}),
    );
  }

  // ---------------------------------------------------------------------------
  // IGP endpoints
  // ---------------------------------------------------------------------------
  Future<List<Map<String, dynamic>>> myIgpItems() async {
    final res = await _dio.get('/igp/items/mine');
    return extractMapList(res.data, const []);
  }

  Future<Map<String, dynamic>> getIgpItem(int id) async {
    final res = await _dio.get('/igp/items/$id');
    return extractMap(res.data, const []) ?? <String, dynamic>{};
  }

  Future<void> transitionIgp(int itemId, {
    required String newStage,
    String? notes,
    int? percentComplete,
    List<String>? photoUrls,
    double? latitude,
    double? longitude,
  }) async {
    await _dio.patch(
      '/igp/items/$itemId/stage',
      data: {
        'newStage': newStage,
        'notes': notes,
        'percentComplete': percentComplete,
        'photoUrls': photoUrls ?? const <String>[],
        'latitude':  latitude,
        'longitude': longitude,
        'source': 'mobile',
      },
      options: Options(headers: {'X-Client': 'mobile'}),
    );
  }

  // ---------------------------------------------------------------------------
  // Photo upload (reuses the existing /upload/visit endpoint — it just stores
  // a file under uploads/ and returns the URL; not actually visit-specific).
  // ---------------------------------------------------------------------------
  Future<String?> uploadPhoto(File file) async {
    final form = FormData.fromMap({
      'image': await MultipartFile.fromFile(file.path, filename: file.uri.pathSegments.last),
    });
    final res = await _dio.post(
      '/upload/visit',
      data: form,
      options: Options(headers: {'Content-Type': 'multipart/form-data'}),
    );
    final data = res.data['data'] ?? res.data;
    return (data['url'] ?? data['path'])?.toString();
  }
}

final programmeRepoProvider = Provider<ProgrammeRepository>(
  (ref) => ProgrammeRepository(ref.watch(dioProvider)),
);

// Combined feed: WASH and IGP items assigned to me, each tagged with kind.
final myProgrammeItemsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final repo = ref.watch(programmeRepoProvider);
  final results = await Future.wait([
    repo.myWashItems().catchError((_) => <Map<String, dynamic>>[]),
    repo.myIgpItems().catchError((_) => <Map<String, dynamic>>[]),
  ]);
  final combined = <Map<String, dynamic>>[];
  for (final row in results[0]) combined.add({...row, '__kind': 'wash'});
  for (final row in results[1]) combined.add({...row, '__kind': 'igp'});
  // Sort soonest-deadline-first.
  combined.sort((a, b) {
    final ad = (a['plannedCompletion'] ?? a['order']?['deadline'] ?? '9999-12-31').toString();
    final bd = (b['plannedCompletion'] ?? b['order']?['deadline'] ?? '9999-12-31').toString();
    return ad.compareTo(bd);
  });
  return combined;
});
