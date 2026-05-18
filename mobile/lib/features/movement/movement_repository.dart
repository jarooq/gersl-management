import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';
import '../../services/pdf_links.dart';

class MovementRepository {
  final Dio _dio;
  MovementRepository(this._dio);

  Future<List<Map<String, dynamic>>> myMovements() async {
    final res = await _dio.get('/movements');
    return extractMapList(res.data, const ['movements']);
  }

  Future<Map<String, dynamic>> create({
    required String fromLocation,
    required String toLocation,
    String? purpose,
    DateTime? plannedDepartureAt,
    DateTime? plannedReturnAt,
    int? vehicleId,
    int? projectId,
    String? notes,
  }) async {
    final res = await _dio.post('/movements', data: {
      'fromLocation': fromLocation,
      'toLocation': toLocation,
      if (purpose != null && purpose.isNotEmpty) 'purpose': purpose,
      if (plannedDepartureAt != null) 'plannedDepartureAt': plannedDepartureAt.toIso8601String(),
      if (plannedReturnAt    != null) 'plannedReturnAt':    plannedReturnAt.toIso8601String(),
      'vehicleId': ?vehicleId,
      'projectId': ?projectId,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return extractMap(res.data, const ['movement']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> depart(int id) async {
    final res = await _dio.patch('/movements/$id/depart');
    return extractMap(res.data, const ['movement']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> arrive(int id) async {
    final res = await _dio.patch('/movements/$id/arrive');
    return extractMap(res.data, const ['movement']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> returnTrip(int id) async {
    final res = await _dio.patch('/movements/$id/return');
    return extractMap(res.data, const ['movement']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> cancel(int id, {String? reason}) async {
    final res = await _dio.patch('/movements/$id/cancel',
        data: { if (reason != null && reason.isNotEmpty) 'reason': reason });
    return extractMap(res.data, const ['movement']) ?? <String, dynamic>{};
  }

  Future<List<Map<String, dynamic>>> myFuelClaims() async {
    final res = await _dio.get('/fuel-claims');
    return extractMapList(res.data, const ['claims']);
  }

  // -------------------------------------------------------------------------
  // Fuel-claim lifecycle
  // -------------------------------------------------------------------------

  /// Derive a Draft fuel claim from a Returned/Arrived movement.
  Future<Map<String, dynamic>> deriveFuelClaim({
    required int movementId,
    double? distanceKm,
    String? bypassLunchReason,
  }) async {
    final res = await _dio.post('/fuel-claims', data: {
      'movementId': movementId,
      'distanceKm': ?distanceKm,
      if (bypassLunchReason != null && bypassLunchReason.isNotEmpty)
        'bypassLunchReason': bypassLunchReason,
    });
    return extractMap(res.data, const ['claim']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> submitFuelClaim(int id) async {
    final res = await _dio.patch('/fuel-claims/$id/submit');
    return extractMap(res.data, const ['claim']) ?? <String, dynamic>{};
  }

  Future<Map<String, dynamic>> cancelFuelClaim(int id) async {
    final res = await _dio.patch('/fuel-claims/$id/cancel');
    return extractMap(res.data, const ['claim']) ?? <String, dynamic>{};
  }

  /// Browser-launchable URL for the fuel-claim PDF. The URL carries a fresh
  /// short-lived download token (see [PdfLinks]).
  Future<String> fuelClaimPdfUrl(int id) => PdfLinks.fuelClaim(_dio, id);
}

final movementRepoProvider = Provider<MovementRepository>(
  (ref) => MovementRepository(ref.watch(dioProvider)),
);

final myMovementsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(movementRepoProvider).myMovements(),
);

final myFuelClaimsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(movementRepoProvider).myFuelClaims(),
);
