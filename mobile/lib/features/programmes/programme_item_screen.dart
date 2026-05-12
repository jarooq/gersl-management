// =============================================================================
// Programme item detail — view the assigned WASH/IGP item and advance its
// stage with photo + GPS evidence. Works for both modules; the only thing
// that differs is the stage list.
// =============================================================================

import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';

import 'programme_repository.dart';

const _washStages = ['Ordered','Surveyed','Materials','Construction','Testing','HandedOver','Reported'];
const _igpStages  = ['Ordered','Surveyed','Procured','Training','Delivered','FollowUp','Reported'];

class ProgrammeItemScreen extends ConsumerStatefulWidget {
  final String kind;          // 'wash' or 'igp'
  final int itemId;
  const ProgrammeItemScreen({super.key, required this.kind, required this.itemId});

  @override
  ConsumerState<ProgrammeItemScreen> createState() => _ProgrammeItemScreenState();
}

class _ProgrammeItemScreenState extends ConsumerState<ProgrammeItemScreen> {
  Map<String, dynamic>? _item;
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
      final repo = ref.read(programmeRepoProvider);
      final item = widget.kind == 'wash'
          ? await repo.getWashItem(widget.itemId)
          : await repo.getIgpItem(widget.itemId);
      setState(() { _item = item; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWash = widget.kind == 'wash';
    return Scaffold(
      appBar: AppBar(
        title: Text(isWash ? 'WASH item' : 'IGP item'),
        backgroundColor: const Color(0xFF0D1D3D),
        foregroundColor: Colors.white,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Text(_error!, textAlign: TextAlign.center)))
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final item = _item!;
    final isWash = widget.kind == 'wash';
    final stage = (item['stage'] ?? 'Ordered').toString();
    final stages = isWash ? _washStages : _igpStages;
    final idx = stages.indexOf(stage);
    final nextStage = (idx >= 0 && idx < stages.length - 1) ? stages[idx + 1] : null;
    final ben = (item['beneficiaryName'] ?? item['beneficiary']?['fullName'] ?? '—').toString();
    final lat = item[isWash ? 'installationLat' : 'deliveryLat'];
    final lng = item[isWash ? 'installationLng' : 'deliveryLng'];
    final typeLabel = isWash ? (item['unitType'] ?? '').toString() : (item['assetType'] ?? '').toString();

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF0D1D3D),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((item['itemCode'] ?? '').toString(), style: const TextStyle(color: Color(0xFFa4f056), fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 4),
                Text(ben, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Wrap(spacing: 12, runSpacing: 4, children: [
                  _heroChip('Type', typeLabel),
                  _heroChip('District', (item['district'] ?? '—').toString()),
                  _heroChip('Stage', stage),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Beneficiary card
          _SectionCard(title: 'Beneficiary', children: [
            _row('Name',  ben),
            _row('NIC',   (item['beneficiaryNic'] ?? '—').toString()),
            _row('Phone', (item['beneficiaryPhone'] ?? '—').toString()),
            if (item['householdSize'] != null) _row('Household size', '${item['householdSize']}'),
          ]),
          const SizedBox(height: 12),

          // Location card
          _SectionCard(title: 'Location', children: [
            _row('District',    (item['district'] ?? '—').toString()),
            _row('DS division', (item['dsDivision'] ?? '—').toString()),
            _row('GN division', (item['gnDivision'] ?? '—').toString()),
            if (lat != null && lng != null)
              _row('GPS', '${(lat as num).toStringAsFixed(5)}, ${(lng as num).toStringAsFixed(5)}'),
            if (item['address'] != null && (item['address'] as String).isNotEmpty)
              _row('Address',   item['address'].toString()),
          ]),
          const SizedBox(height: 24),

          if (nextStage != null)
            FilledButton.icon(
              onPressed: () => _openTransition(nextStage),
              icon: const Icon(Icons.arrow_forward),
              label: Text('Advance to $nextStage'),
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFa4f056),
                foregroundColor: const Color(0xFF0D1D3D),
                minimumSize: const Size.fromHeight(48),
              ),
            ),
        ],
      ),
    );
  }

  Widget _heroChip(String label, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$label: ', style: const TextStyle(color: Color(0xFFa4f056), fontSize: 11)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ]);

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            const SizedBox(width: 8),
            Flexible(child: Text(value, textAlign: TextAlign.right, style: const TextStyle(fontWeight: FontWeight.w600))),
          ],
        ),
      );

  Future<void> _openTransition(String newStage) async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _TransitionSheet(
        kind: widget.kind,
        itemId: widget.itemId,
        newStage: newStage,
      ),
    );
    if (ok == true) _load();
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const _SectionCard({required this.title, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
          const SizedBox(height: 8),
          ...children,
        ],
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// Stage transition sheet — captures notes, GPS, photo, then posts to /stage.
// ----------------------------------------------------------------------------
class _TransitionSheet extends ConsumerStatefulWidget {
  final String kind;
  final int itemId;
  final String newStage;
  const _TransitionSheet({required this.kind, required this.itemId, required this.newStage});

  @override
  ConsumerState<_TransitionSheet> createState() => _TransitionSheetState();
}

class _TransitionSheetState extends ConsumerState<_TransitionSheet> {
  final _notes = TextEditingController();
  double? _lat;
  double? _lng;
  File? _photo;
  bool _busy = false;
  String? _error;

  Future<void> _captureGps() async {
    setState(() { _error = null; });
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission denied');
        return;
      }
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)),
      );
      setState(() { _lat = pos.latitude; _lng = pos.longitude; });
    } catch (e) {
      setState(() => _error = 'GPS failed: $e');
    }
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
    if (file != null) setState(() => _photo = File(file.path));
  }

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(programmeRepoProvider);
      // Upload photo first (if any) so we can include its URL in the transition body.
      String? photoUrl;
      if (_photo != null) {
        photoUrl = await repo.uploadPhoto(_photo!);
      }
      final transitionArgs = <String, dynamic>{
        'newStage': widget.newStage,
        'notes':    _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        'percentComplete': 100,
        'photoUrls': photoUrl != null ? [photoUrl] : <String>[],
        'latitude':  _lat,
        'longitude': _lng,
      };
      if (widget.kind == 'wash') {
        await repo.transitionWash(widget.itemId,
          newStage: transitionArgs['newStage'],
          notes: transitionArgs['notes'],
          percentComplete: transitionArgs['percentComplete'],
          photoUrls: List<String>.from(transitionArgs['photoUrls']),
          latitude: _lat, longitude: _lng,
        );
      } else {
        await repo.transitionIgp(widget.itemId,
          newStage: transitionArgs['newStage'],
          notes: transitionArgs['notes'],
          percentComplete: transitionArgs['percentComplete'],
          photoUrls: List<String>.from(transitionArgs['photoUrls']),
          latitude: _lat, longitude: _lng,
        );
      }
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = 'Failed: $e');
    } finally {
      setState(() => _busy = false);
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
            Row(children: [
              const Icon(Icons.arrow_forward, color: Color(0xFF0D1D3D)),
              const SizedBox(width: 8),
              Expanded(child: Text('Advance to ${widget.newStage}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ]),
            const SizedBox(height: 16),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes',
                border: OutlineInputBorder(),
                hintText: 'Optional context for this transition',
              ),
            ),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _captureGps,
                  icon: const Icon(Icons.my_location),
                  label: Text(_lat != null && _lng != null
                      ? '${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                      : 'Capture GPS'),
                ),
              ),
            ]),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _pickPhoto,
                  icon: const Icon(Icons.camera_alt_outlined),
                  label: Text(_photo == null ? 'Take photo' : 'Photo captured'),
                ),
              ),
            ]),
            if (_photo != null) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.file(_photo!, height: 140, width: double.infinity, fit: BoxFit.cover),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.red.shade50, borderRadius: BorderRadius.circular(6), border: Border.all(color: Colors.red.shade200)),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade800, fontSize: 12)),
              ),
            ],
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _busy ? null : _submit,
              style: FilledButton.styleFrom(
                backgroundColor: const Color(0xFFa4f056),
                foregroundColor: const Color(0xFF0D1D3D),
                minimumSize: const Size.fromHeight(48),
              ),
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0D1D3D)))
                  : Text('Advance to ${widget.newStage}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
