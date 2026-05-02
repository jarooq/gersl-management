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

  Future<List<Map<String, dynamic>>> myFuelClaims() async {
    final res = await _dio.get('/fuel-claims');
    final raw = (res.data['data'] as List?) ??
                (res.data['claims'] as List?) ??
                (res.data['data']?['claims'] as List?) ?? [];
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  }
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
