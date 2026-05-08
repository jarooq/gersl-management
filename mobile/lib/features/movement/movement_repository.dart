import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../services/api_client.dart';

class MovementRepository {
  final Dio _dio;
  MovementRepository(this._dio);

  Future<List<Map<String, dynamic>>> myMovements() async {
    final res = await _dio.get('/movements');
    final raw = (res.data['data'] as List?) ??
                (res.data['movements'] as List?) ??
                (res.data['data']?['movements'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
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
      if (vehicleId != null) 'vehicleId': vehicleId,
      if (projectId != null) 'projectId': projectId,
      if (notes != null && notes.isNotEmpty) 'notes': notes,
    });
    return (res.data['data']?['movement'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> depart(int id) async {
    final res = await _dio.patch('/movements/$id/depart');
    return (res.data['data']?['movement'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> arrive(int id) async {
    final res = await _dio.patch('/movements/$id/arrive');
    return (res.data['data']?['movement'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> returnTrip(int id) async {
    final res = await _dio.patch('/movements/$id/return');
    return (res.data['data']?['movement'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> cancel(int id, {String? reason}) async {
    final res = await _dio.patch('/movements/$id/cancel',
        data: { if (reason != null && reason.isNotEmpty) 'reason': reason });
    return (res.data['data']?['movement'] as Map).cast<String, dynamic>();
  }

  Future<List<Map<String, dynamic>>> myFuelClaims() async {
    final res = await _dio.get('/fuel-claims');
    final raw = (res.data['data'] as List?) ??
                (res.data['claims'] as List?) ??
                (res.data['data']?['claims'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
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
      if (distanceKm != null) 'distanceKm': distanceKm,
      if (bypassLunchReason != null && bypassLunchReason.isNotEmpty)
        'bypassLunchReason': bypassLunchReason,
    });
    return (res.data['data']?['claim'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> submitFuelClaim(int id) async {
    final res = await _dio.patch('/fuel-claims/$id/submit');
    return (res.data['data']?['claim'] as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> cancelFuelClaim(int id) async {
    final res = await _dio.patch('/fuel-claims/$id/cancel');
    return (res.data['data']?['claim'] as Map).cast<String, dynamic>();
  }

  /// PDF URL with token in query string — auth middleware accepts ?token= for
  /// this endpoint so an external viewer (Chrome / system PDF reader) can
  /// open it without a Bearer header.
  String fuelClaimPdfUrl(int id, String accessToken) =>
      '${_dio.options.baseUrl}/fuel-claims/$id/pdf?token=$accessToken';
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
