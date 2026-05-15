// =============================================================================
// Programme map — Leaflet/OSM pin map of WASH + IGP items assigned to the
// current user. Mirrors the web BeneficiaryMap layer toggle UX. Tap a pin
// to open the item detail screen.
//
// Uses flutter_map (free, OSM tiles, no API key). Default zoom centres on
// the user's current GPS; if location is denied, falls back to Sri Lanka.
// =============================================================================

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../services/friendly_error.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';

import '../../services/api_client.dart';
import '../../services/api_response.dart';

const _sriLankaCentre = LatLng(7.8731, 80.7718);

const _stageColors = <String, Color>{
  'Ordered':      Color(0xFF94A3B8),
  'Surveyed':     Color(0xFF3B82F6),
  'Materials':    Color(0xFF6366F1),
  'Procured':     Color(0xFF6366F1),
  'Construction': Color(0xFFF59E0B),
  'Training':     Color(0xFFF59E0B),
  'Testing':      Color(0xFFA855F7),
  'Delivered':    Color(0xFF10B981),
  'HandedOver':   Color(0xFF10B981),
  'FollowUp':     Color(0xFFA855F7),
  'Reported':     Color(0xFF059669),
  'Cancelled':    Color(0xFFDC2626),
};

class ProgrammeMapScreen extends ConsumerStatefulWidget {
  const ProgrammeMapScreen({super.key});

  @override
  ConsumerState<ProgrammeMapScreen> createState() => _ProgrammeMapScreenState();
}

class _ProgrammeMapScreenState extends ConsumerState<ProgrammeMapScreen> {
  final _mapController = MapController();
  final Set<String> _layers = {'wash', 'igp'};
  List<_Pin> _pins = [];
  bool _loading = true;
  String? _error;
  LatLng _initialCentre = _sriLankaCentre;

  @override
  void initState() {
    super.initState();
    _initLocationAndLoad();
  }

  Future<void> _initLocationAndLoad() async {
    // Try to capture user GPS for a useful initial centre. Falls back to
    // Sri Lanka if denied.
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm != LocationPermission.denied && perm != LocationPermission.deniedForever) {
        final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, timeLimit: Duration(seconds: 8)),
        ).timeout(const Duration(seconds: 10));
        _initialCentre = LatLng(pos.latitude, pos.longitude);
      }
    } catch (_) {/* fall back to default centre */}
    await _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      // Fetch pins from each enabled layer's /items/mine endpoint and unify.
      // We deliberately don't call /map/pins here because it returns the
      // org-wide set; this screen is "my assigned items only".
      final pins = <_Pin>[];
      if (_layers.contains('wash')) {
        final res = await dio.get('/wash/items/mine');
        for (final row in extractList(res.data)) {
          if (row is! Map) continue;
          final m = Map<String, dynamic>.from(row);
          final lat = m['installationLat'];
          final lng = m['installationLng'];
          if (lat is num && lng is num) {
            pins.add(_Pin(
              id: (m['id'] as num).toInt(),
              kind: 'wash',
              label: (m['beneficiaryName'] ?? m['itemCode'] ?? '').toString(),
              sublabel: '${m['unitType'] ?? ''}${m['district'] != null ? ' · ${m['district']}' : ''}',
              stage: (m['stage'] ?? '').toString(),
              lat: lat.toDouble(),
              lng: lng.toDouble(),
            ));
          }
        }
      }
      if (_layers.contains('igp')) {
        final res = await dio.get('/igp/items/mine');
        for (final row in extractList(res.data)) {
          if (row is! Map) continue;
          final m = Map<String, dynamic>.from(row);
          final lat = m['deliveryLat'];
          final lng = m['deliveryLng'];
          if (lat is num && lng is num) {
            pins.add(_Pin(
              id: (m['id'] as num).toInt(),
              kind: 'igp',
              label: (m['beneficiaryName'] ?? m['itemCode'] ?? '').toString(),
              sublabel: '${m['assetType'] ?? ''}${m['district'] != null ? ' · ${m['district']}' : ''}',
              stage: (m['stage'] ?? '').toString(),
              lat: lat.toDouble(),
              lng: lng.toDouble(),
            ));
          }
        }
      }
      setState(() { _pins = pins; _loading = false; });

      // Fit bounds to the pins (if we have any) so the user sees the whole
      // cluster immediately. Pad slightly so pins aren't right on the edge.
      if (pins.length > 1) {
        final bounds = LatLngBounds.fromPoints(pins.map((p) => LatLng(p.lat, p.lng)).toList());
        Future.delayed(const Duration(milliseconds: 200), () {
          if (!mounted) return;
          _mapController.fitCamera(CameraFit.bounds(bounds: bounds, padding: const EdgeInsets.all(40)));
        });
      } else if (pins.length == 1) {
        _mapController.move(LatLng(pins.first.lat, pins.first.lng), 14);
      } else {
        // Empty result — reset to user's GPS centre or Sri Lanka so the map
        // doesn't get stuck at whatever the previous filter showed.
        _mapController.move(_initialCentre, 9);
      }
    } catch (e) {
      if (mounted) setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  void _toggleLayer(String layer) {
    setState(() {
      if (_layers.contains(layer)) {
        _layers.remove(layer);
      } else {
        _layers.add(layer);
      }
    });
    _load();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Items Map'),
        backgroundColor: const Color(0xFF0D1D3D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh',
            onPressed: _load,
          ),
        ],
      ),
      body: Column(
        children: [
          // Layer toggle bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                Text('Layers', style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(width: 8),
                _layerChip('wash', 'WASH', const Color(0xFF0EA5E9), Icons.water_drop_outlined),
                const SizedBox(width: 6),
                _layerChip('igp', 'IGP', const Color(0xFF10B981), Icons.work_outline),
                const Spacer(),
                if (_loading)
                  const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                else
                  Text('${_pins.length} pins', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              ],
            ),
          ),
          if (_error != null)
            Container(
              color: Colors.red.shade50,
              padding: const EdgeInsets.all(8),
              child: Text(_error!, style: TextStyle(color: Colors.red.shade800, fontSize: 12)),
            ),
          // Map
          Expanded(
            child: FlutterMap(
              mapController: _mapController,
              options: MapOptions(
                initialCenter: _initialCentre,
                initialZoom: 9,
                maxZoom: 18,
                minZoom: 5,
              ),
              children: [
                TileLayer(
                  urlTemplate: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  subdomains: const ['a', 'b', 'c'],
                  userAgentPackageName: 'org.gersl.mobile',
                ),
                MarkerLayer(
                  markers: _pins.map((p) {
                    final colour = _stageColors[p.stage] ?? Colors.grey;
                    return Marker(
                      point: LatLng(p.lat, p.lng),
                      width: 36,
                      height: 36,
                      child: GestureDetector(
                        onTap: () => _openPinSheet(p),
                        child: Container(
                          decoration: BoxDecoration(
                            color: colour,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: const [BoxShadow(color: Colors.black26, blurRadius: 3, offset: Offset(0, 1))],
                          ),
                          child: Icon(
                            p.kind == 'wash' ? Icons.water_drop : Icons.work,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
                const RichAttributionWidget(
                  attributions: [
                    TextSourceAttribution('OpenStreetMap contributors'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _layerChip(String key, String label, Color colour, IconData icon) {
    final on = _layers.contains(key);
    return InkWell(
      borderRadius: BorderRadius.circular(20),
      onTap: () => _toggleLayer(key),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: on ? colour : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 13, color: on ? Colors.white : Colors.grey.shade600),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(
            color: on ? Colors.white : Colors.grey.shade600,
            fontWeight: FontWeight.bold, fontSize: 11,
          )),
        ]),
      ),
    );
  }

  void _openPinSheet(_Pin p) {
    final colour = _stageColors[p.stage] ?? Colors.grey;
    showModalBottomSheet(
      context: context,
      builder: (_) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Icon(p.kind == 'wash' ? Icons.water_drop : Icons.work, color: colour),
              const SizedBox(width: 8),
              Expanded(child: Text(p.label, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(color: colour.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                child: Text(p.stage, style: TextStyle(color: colour, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
            ]),
            const SizedBox(height: 8),
            Text(p.sublabel, style: TextStyle(color: Colors.grey.shade700)),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                context.push('/programmes/${p.kind}/${p.id}');
              },
              icon: const Icon(Icons.arrow_forward),
              label: const Text('Open item'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFa4f056),
                foregroundColor: const Color(0xFF0D1D3D),
                minimumSize: const Size.fromHeight(44),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _Pin {
  final int id;
  final String kind;
  final String label;
  final String sublabel;
  final String stage;
  final double lat;
  final double lng;
  const _Pin({
    required this.id, required this.kind, required this.label,
    required this.sublabel, required this.stage,
    required this.lat, required this.lng,
  });
}
