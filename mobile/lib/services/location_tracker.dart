import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

import 'api_client.dart';

/// Foreground GPS sampler. Streams `Position` events from the OS, buffers them,
/// and POSTs batches to /api/locations/batch every [flushInterval] or every
/// [batchSize] points (whichever first).
///
/// True background tracking (process alive when app suspended) requires
/// `flutter_background_service` + a foreground notification. That's a follow-up
/// — this class is the data plane and is reusable from a background isolate.
class LocationTracker {
  LocationTracker(this._dio);

  final Dio _dio;
  final List<Map<String, dynamic>> _buffer = [];

  StreamSubscription<Position>? _sub;
  Timer? _flushTimer;

  static const _batchSize = 25;
  static const _flushInterval = Duration(minutes: 1);
  static const _minDistanceMeters = 10; // ignore jitter

  bool get isRunning => _sub != null;

  Future<bool> _ensurePermission() async {
    final status = await Permission.locationWhenInUse.request();
    if (!status.isGranted) return false;
    return Geolocator.isLocationServiceEnabled();
  }

  Future<bool> start() async {
    if (_sub != null) return true;
    if (!await _ensurePermission()) return false;

    _sub = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: _minDistanceMeters,
      ),
    ).listen(_onPosition, onError: (_) {});

    _flushTimer = Timer.periodic(_flushInterval, (_) => _flush());
    return true;
  }

  Future<void> stop() async {
    await _sub?.cancel();
    _sub = null;
    _flushTimer?.cancel();
    _flushTimer = null;
    await _flush();
  }

  void _onPosition(Position p) {
    _buffer.add({
      'recordedAt': DateTime.now().toUtc().toIso8601String(),
      'latitude':   p.latitude,
      'longitude':  p.longitude,
      'accuracyM':  p.accuracy,
      'speedKmh':   (p.speed) * 3.6,
    });
    if (_buffer.length >= _batchSize) {
      // Fire and forget — losing a batch is acceptable.
      _flush();
    }
  }

  Future<void> _flush() async {
    if (_buffer.isEmpty) return;
    final payload = List<Map<String, dynamic>>.from(_buffer);
    _buffer.clear();
    try {
      await _dio.post('/locations/batch', data: {'points': payload});
    } catch (_) {
      // On failure, requeue so the next flush retries.
      _buffer.insertAll(0, payload);
    }
  }
}

final locationTrackerProvider = Provider<LocationTracker>((ref) {
  final tracker = LocationTracker(ref.watch(dioProvider));
  ref.onDispose(tracker.stop);
  return tracker;
});

/// Boolean flag mirrored from [LocationTracker.isRunning] so the UI can
/// react. Set explicitly by callers when start()/stop() succeeds.
final isTrackingProvider = StateProvider<bool>((ref) => false);
