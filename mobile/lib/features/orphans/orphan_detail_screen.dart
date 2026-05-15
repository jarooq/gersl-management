// =============================================================================
// Orphan detail — dossier view + visit history + Log Visit bottom sheet.
// =============================================================================

import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import '../programmes/programme_repository.dart' show programmeRepoProvider;
import 'orphan_repository.dart';

class OrphanDetailScreen extends ConsumerStatefulWidget {
  final int orphanId;
  const OrphanDetailScreen({super.key, required this.orphanId});

  @override
  ConsumerState<OrphanDetailScreen> createState() => _OrphanDetailScreenState();
}

class _OrphanDetailScreenState extends ConsumerState<OrphanDetailScreen> {
  Map<String, dynamic>? _orphan;
  List<Map<String, dynamic>> _visits = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final repo = ref.read(orphanRepoProvider);
      final orphan = await repo.getOne(widget.orphanId);
      final visits = await repo.visitsFor(widget.orphanId).catchError((_) => <Map<String, dynamic>>[]);
      if (!mounted) return;
      setState(() {
        _orphan  = orphan;
        _visits  = visits;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Orphan')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorView(error: _error!, onRetry: _load)
              : _buildBody(),
      floatingActionButton: (_loading || _error != null) ? null : FloatingActionButton.extended(
        onPressed: _openLogVisit,
        icon: const Icon(Icons.add_a_photo_outlined),
        label: const Text('Log visit'),
        backgroundColor: kAmber500,
        foregroundColor: kNavy900,
      ),
    );
  }

  Widget _buildBody() {
    final o = _orphan!;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kSurfaceLift,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((o['orphanCode'] ?? '').toString(),
                    style: const TextStyle(color: kAmber500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 4),
                Text((o['fullName'] ?? '—').toString(),
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(spacing: 12, runSpacing: 4, children: [
                  if (o['age'] != null)    _chip('Age', '${o['age']}'),
                  if (o['gender'] != null) _chip('Gender', '${o['gender']}'),
                  if (o['district'] != null) _chip('District', '${o['district']}'),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 12),

          _Card(title: 'Guardian', rows: [
            ['Name',         o['guardianName']],
            ['Relationship', o['guardianRelationship']],
            ['Contact',      o['guardianContact']],
          ]),
          const SizedBox(height: 12),

          _Card(title: 'Location', rows: [
            ['District',     o['district']],
            ['DS division',  o['dsDivision']],
            ['GN division',  o['gnDivision']],
            ['Address',      o['address']],
          ]),
          const SizedBox(height: 12),

          _Card(title: 'Education', rows: [
            ['School',     o['school']],
            ['Grade',      o['gradeLevel']],
            ['Performance', o['academicPerformance']],
          ]),
          const SizedBox(height: 16),

          // Visit history
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: kSurfaceLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: kInk400),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('VISIT HISTORY',
                    style: TextStyle(color: kInk500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
                const SizedBox(height: 8),
                if (_visits.isEmpty)
                  Text('No visits recorded yet.',
                      style: TextStyle(color: kInk500, fontSize: 13))
                else
                  ..._visits.take(20).map(_visitTile),
              ],
            ),
          ),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _chip(String label, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$label: ', style: const TextStyle(color: kAmber500, fontSize: 11)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ]);

  Widget _visitTile(Map<String, dynamic> v) {
    final at = (v['visitDate'] ?? v['occurredAt'] ?? v['createdAt'] ?? '').toString();
    final source = (v['source'] ?? '').toString();
    final notes = (v['notes'] ?? v['purpose'] ?? '').toString();
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(width: 8, height: 8,
          margin: const EdgeInsets.only(top: 6),
          decoration: BoxDecoration(color: kKpiPinkInk, shape: BoxShape.circle)),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(_formatDate(at), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          if (notes.isNotEmpty)
            Text(notes, style: const TextStyle(fontSize: 12)),
          if (source.isNotEmpty)
            Text('source: $source', style: TextStyle(fontSize: 10, color: kInk400)),
        ])),
      ]),
    );
  }

  String _formatDate(String iso) {
    try {
      final t = DateTime.parse(iso).toLocal();
      return '${t.year}-${t.month.toString().padLeft(2,'0')}-${t.day.toString().padLeft(2,'0')}';
    } catch (_) { return iso; }
  }

  Future<void> _openLogVisit() async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _LogVisitSheet(
        orphanId: widget.orphanId,
        defaultName: (_orphan?['fullName'] ?? '').toString(),
      ),
    );
    if (ok == true) _load();
  }
}

class _Card extends StatelessWidget {
  final String title;
  final List<List<dynamic>> rows;
  const _Card({required this.title, required this.rows});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: kSurfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kInk400),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(),
              style: TextStyle(color: kInk500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
          const SizedBox(height: 8),
          ...rows.map((r) {
            final value = (r[1] ?? '').toString();
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 3),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                SizedBox(width: 100, child: Text(r[0].toString(),
                  style: TextStyle(color: kInk500, fontSize: 12))),
                Expanded(child: Text(
                  value.isEmpty ? '—' : value,
                  style: TextStyle(color: value.isEmpty ? kInk400 : Colors.black87, fontSize: 13),
                )),
              ]),
            );
          }),
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// Log Visit bottom sheet — captures notes + photo + GPS, posts to /visits
// with orphanId + visitType='orphan' so it appears on the web dossier.
// ----------------------------------------------------------------------------
class _LogVisitSheet extends ConsumerStatefulWidget {
  final int orphanId;
  final String defaultName;
  const _LogVisitSheet({required this.orphanId, required this.defaultName});

  @override
  ConsumerState<_LogVisitSheet> createState() => _LogVisitSheetState();
}

class _LogVisitSheetState extends ConsumerState<_LogVisitSheet> {
  final _purpose = TextEditingController();
  final _notes = TextEditingController();
  double? _lat;
  double? _lng;
  File? _photo;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _purpose.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _captureGps() async {
    setState(() => _error = null);
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission denied');
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)),
      ).timeout(const Duration(seconds: 15), onTimeout: () {
        throw TimeoutException('GPS lock timed out');
      });
      if (!mounted) return;
      setState(() { _lat = pos.latitude; _lng = pos.longitude; });
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = 'GPS failed: $e');
    }
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
    if (file != null && mounted) setState(() => _photo = File(file.path));
  }

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    try {
      // Photo upload reuses the existing visit/photo upload helper. We pull
      // it from the programmes repo since both modules go through the same
      // POST /upload/visit endpoint.
      final progRepo = ref.read(programmeRepoProvider);
      String? photoUrl;
      if (_photo != null) photoUrl = await progRepo.uploadPhoto(_photo!);

      final orphanRepo = ref.read(orphanRepoProvider);
      await orphanRepo.logVisit(
        orphanId: widget.orphanId,
        customerName: widget.defaultName.isEmpty ? 'Orphan visit' : widget.defaultName,
        purpose: _purpose.text.trim(),
        notes: _notes.text.trim(),
        photoUrl: photoUrl,
        latitude: _lat,
        longitude: _lng,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      if (mounted) setState(() => _error = 'Save failed: $e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 16,
        bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(children: [
              Icon(Icons.child_care, color: kNavy900),
              SizedBox(width: 8),
              Expanded(child: Text('Log orphan visit',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ]),
            const SizedBox(height: 12),
            TextField(controller: _purpose,
              decoration: const InputDecoration(labelText: 'Purpose', border: OutlineInputBorder()),
              maxLines: 1),
            const SizedBox(height: 8),
            TextField(controller: _notes,
              decoration: const InputDecoration(labelText: 'Observations / notes', border: OutlineInputBorder()),
              maxLines: 3),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _captureGps,
              icon: const Icon(Icons.my_location),
              label: Text(_lat != null && _lng != null
                  ? '${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                  : 'Capture GPS'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickPhoto,
              icon: const Icon(Icons.camera_alt_outlined),
              label: Text(_photo == null ? 'Take photo' : 'Photo captured'),
            ),
            if (_photo != null) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(_photo!, height: 120, width: double.infinity, fit: BoxFit.cover),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: kDanger600.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: kDanger600)),
                child: Text(_error!, style: TextStyle(color: kDanger600, fontSize: 12)),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: kAmber500,
                foregroundColor: kNavy900,
                minimumSize: const Size.fromHeight(48),
              ),
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: kNavy900))
                  : const Text('Save visit', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
