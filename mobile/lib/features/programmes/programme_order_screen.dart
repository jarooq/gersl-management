// =============================================================================
// Programme order screen — view a single WASH/IGP order plus all its items,
// even items not assigned to the current user. Reached by tapping the order
// summary card on the item detail screen. Lets field officers see the
// whole batch (deadline, payment, sibling beneficiaries) and add a new
// item to the order during field survey.
// =============================================================================

import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import 'programme_repository.dart';

class ProgrammeOrderScreen extends ConsumerStatefulWidget {
  final String kind;     // 'wash' or 'igp'
  final int orderId;
  const ProgrammeOrderScreen({super.key, required this.kind, required this.orderId});

  @override
  ConsumerState<ProgrammeOrderScreen> createState() => _ProgrammeOrderScreenState();
}

class _ProgrammeOrderScreenState extends ConsumerState<ProgrammeOrderScreen> {
  Map<String, dynamic>? _order;
  Map<String, dynamic>? _summary;
  List<Map<String, dynamic>> _items = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final repo = ref.read(programmeRepoProvider);
      final orderResp = await repo.getOrder(widget.kind, widget.orderId);
      // Server returns { order, summary } under data.
      final order   = orderResp['order'] is Map ? Map<String, dynamic>.from(orderResp['order'] as Map) : orderResp;
      final summary = orderResp['summary'] is Map ? Map<String, dynamic>.from(orderResp['summary'] as Map) : <String, dynamic>{};
      final items = await repo.listOrderItems(widget.kind, widget.orderId);
      setState(() {
        _order = order;
        _summary = summary;
        _items = items;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWash = widget.kind == 'wash';
    return Scaffold(
      appBar: AppBar(
        title: Text(isWash ? 'WASH order' : 'IGP order'),
      ),
      floatingActionButton: _order == null ? null : FloatingActionButton.extended(
        onPressed: _openAddItemSheet,
        icon: const Icon(Icons.person_add_alt_1),
        label: const Text('Add beneficiary'),
        backgroundColor: kAmber500,
        foregroundColor: kNavy900,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorView(error: _error!, onRetry: _load)
              : _buildBody(),
    );
  }

  Widget _buildBody() {
    final order = _order!;
    final code  = (order['orderCode'] ?? '').toString();
    final title = (order['title'] ?? '').toString();
    final deadline = (order['deadline'] ?? '—').toString();
    final paymentStatus = (order['paymentStatus'] ?? 'Pending').toString();
    final quantity = order['quantity'];
    final budget   = order['totalBudget'];
    final byStage = (_summary?['byStage'] is Map)
        ? Map<String, dynamic>.from(_summary!['byStage'] as Map)
        : <String, dynamic>{};

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kNavy900,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(code, style: const TextStyle(color: kAmber500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
                const SizedBox(height: 4),
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 10),
                Wrap(spacing: 12, runSpacing: 4, children: [
                  _heroChip('Deadline', deadline),
                  if (quantity != null) _heroChip('Qty', '$quantity'),
                  if (budget != null)   _heroChip('Budget', 'LKR $budget'),
                  _heroChip('Payment', paymentStatus),
                ]),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Stage breakdown
          if (byStage.isNotEmpty) ...[
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
                  Text('BY STAGE',
                      style: TextStyle(color: kInk500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, runSpacing: 6, children: byStage.entries.map((e) {
                    final colour = _stageColors[e.key.toString()] ?? kInk500;
                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(color: colour.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                      child: Text('${e.key}: ${e.value}', style: TextStyle(color: colour, fontWeight: FontWeight.bold, fontSize: 12)),
                    );
                  }).toList()),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],

          // Items
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Text('Items (${_items.length})',
                style: TextStyle(color: kInk500, fontWeight: FontWeight.bold)),
          ),
          if (_items.isEmpty)
            Padding(
              padding: const EdgeInsets.all(24),
              child: Text('No items yet. Tap the button to add the first beneficiary.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: kInk500)),
            )
          else
            ..._items.map((it) => _ItemTile(item: it, kind: widget.kind)),
          const SizedBox(height: 80),
        ],
      ),
    );
  }

  Widget _heroChip(String label, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$label: ', style: const TextStyle(color: kAmber500, fontSize: 11)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ]);

  Future<void> _openAddItemSheet() async {
    final created = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _AddItemSheet(kind: widget.kind, orderId: widget.orderId, defaultType: _order?['unitType']?.toString() ?? _order?['assetType']?.toString()),
    );
    if (created == true) _load();
  }
}

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

class _ItemTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final String kind;
  const _ItemTile({required this.item, required this.kind});

  @override
  Widget build(BuildContext context) {
    final isWash = kind == 'wash';
    final stage = (item['stage'] ?? 'Ordered').toString();
    final ben = (item['beneficiaryName'] ?? item['beneficiary']?['fullName'] ?? '—').toString();
    final type = isWash ? (item['unitType'] ?? '').toString() : (item['assetType'] ?? '').toString();
    final colour = _stageColors[stage] ?? kInk500;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: kSurfaceLight,
        borderRadius: BorderRadius.circular(10),
        elevation: 1,
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: () {
            final id = item['id'];
            if (id is num) context.push('/programmes/$kind/${id.toInt()}');
          },
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Expanded(child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(ben, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text('${item['itemCode'] ?? ''}${type.isNotEmpty ? ' · $type' : ''}',
                        style: TextStyle(color: kInk500, fontSize: 12)),
                  ],
                )),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: colour.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
                  child: Text(stage, style: TextStyle(color: colour, fontWeight: FontWeight.bold, fontSize: 11)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// Add Beneficiary sheet — captures the minimum needed to create an item:
// name, NIC, phone, district, GPS (auto-captured if possible), and an
// optional photo. The server fills in defaults from the order.
// ----------------------------------------------------------------------------
class _AddItemSheet extends ConsumerStatefulWidget {
  final String kind;
  final int orderId;
  final String? defaultType;
  const _AddItemSheet({required this.kind, required this.orderId, this.defaultType});

  @override
  ConsumerState<_AddItemSheet> createState() => _AddItemSheetState();
}

class _AddItemSheetState extends ConsumerState<_AddItemSheet> {
  final _name = TextEditingController();
  final _nic = TextEditingController();
  final _phone = TextEditingController();
  final _district = TextEditingController();
  final _gn = TextEditingController();
  final _address = TextEditingController();
  double? _lat;
  double? _lng;
  File? _photo;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _nic.dispose();
    _phone.dispose();
    _district.dispose();
    _gn.dispose();
    _address.dispose();
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
      setState(() => _error = 'GPS failed: $e');
    }
  }

  Future<void> _pickPhoto() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 80, maxWidth: 1600);
    if (file != null) setState(() => _photo = File(file.path));
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      setState(() => _error = 'Beneficiary name is required');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(programmeRepoProvider);
      String? photoUrl;
      if (_photo != null) photoUrl = await repo.uploadPhoto(_photo!);

      final isWash = widget.kind == 'wash';
      final body = <String, dynamic>{
        'beneficiaryName': _name.text.trim(),
        if (_nic.text.trim().isNotEmpty)      'beneficiaryNic':   _nic.text.trim(),
        if (_phone.text.trim().isNotEmpty)    'beneficiaryPhone': _phone.text.trim(),
        if (_district.text.trim().isNotEmpty) 'district':         _district.text.trim(),
        if (_gn.text.trim().isNotEmpty)       'gnDivision':       _gn.text.trim(),
        if (_address.text.trim().isNotEmpty)  'address':          _address.text.trim(),
        if (_lat != null) (isWash ? 'installationLat' : 'deliveryLat'): _lat,
        if (_lng != null) (isWash ? 'installationLng' : 'deliveryLng'): _lng,
        if (widget.defaultType != null && widget.defaultType!.isNotEmpty)
          (isWash ? 'unitType' : 'assetType'): widget.defaultType,
        // Stash the registration photo URL in notes — Item model has no
        // photo field; stage_updates is where photos live. We'll surface
        // this as a "household photo" hint in the timeline view.
        if (photoUrl != null) 'notes': 'Registration photo: $photoUrl',
      };
      await repo.addItemToOrder(widget.kind, widget.orderId, body);
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
            const Row(children: [
              Icon(Icons.person_add_alt_1, color: kNavy900),
              SizedBox(width: 8),
              Expanded(child: Text('Add beneficiary',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ]),
            const SizedBox(height: 12),
            TextField(controller: _name, decoration: const InputDecoration(labelText: 'Name *', border: OutlineInputBorder())),
            const SizedBox(height: 8),
            TextField(controller: _nic,   decoration: const InputDecoration(labelText: 'NIC',   border: OutlineInputBorder())),
            const SizedBox(height: 8),
            TextField(controller: _phone, decoration: const InputDecoration(labelText: 'Phone', border: OutlineInputBorder()), keyboardType: TextInputType.phone),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(child: TextField(controller: _district, decoration: const InputDecoration(labelText: 'District', border: OutlineInputBorder()))),
              const SizedBox(width: 8),
              Expanded(child: TextField(controller: _gn, decoration: const InputDecoration(labelText: 'GN division', border: OutlineInputBorder()))),
            ]),
            const SizedBox(height: 8),
            TextField(controller: _address, decoration: const InputDecoration(labelText: 'Address', border: OutlineInputBorder()), maxLines: 2),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _captureGps,
              icon: const Icon(Icons.my_location),
              label: Text(_lat != null && _lng != null
                  ? '${_lat!.toStringAsFixed(4)}, ${_lng!.toStringAsFixed(4)}'
                  : 'Capture GPS at household'),
            ),
            const SizedBox(height: 8),
            OutlinedButton.icon(
              onPressed: _pickPhoto,
              icon: const Icon(Icons.camera_alt_outlined),
              label: Text(_photo == null ? 'Take household photo (optional)' : 'Photo captured'),
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
                decoration: BoxDecoration(color: kDanger600.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(6), border: Border.all(color: kDanger600)),
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
                  : const Text('Add beneficiary', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
