// =============================================================================
// Programme item detail — view the assigned WASH/IGP item and advance its
// stage with photo + GPS evidence. Works for both modules; the only thing
// that differs is the stage list.
// =============================================================================

import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/env.dart';
import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import '../../services/token_store.dart';
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
      setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isWash = widget.kind == 'wash';
    return Scaffold(
      appBar: AppBar(
        title: Text(isWash ? 'WASH item' : 'IGP item'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? ErrorView(error: _error!, onRetry: _load)
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

    // Payment + funds-gate evaluation off the embedded order.
    final order = (item['order'] is Map) ? Map<String, dynamic>.from(item['order'] as Map) : null;
    final paymentStatus = (order?['paymentStatus'] ?? 'Pending').toString();
    final workStartCondition = (order?['workStartCondition'] ?? 'OnAcceptance').toString();
    final fundsGateBlocked = workStartCondition == 'OnFundsReceived' && paymentStatus != 'Paid';

    // Stage updates list — newest first (server already returns desc).
    final stageUpdatesRaw = item['stageUpdates'];
    final stageUpdates = stageUpdatesRaw is List
        ? stageUpdatesRaw.whereType<Map>().map((m) => Map<String, dynamic>.from(m)).toList()
        : <Map<String, dynamic>>[];

    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Hero card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: kNavy900,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text((item['itemCode'] ?? '').toString(), style: const TextStyle(color: kAmber500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
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
          const SizedBox(height: 12),

          // Order summary card — order code, deadline, payment status. Tap to
          // open the sibling-items screen.
          if (order != null) ...[
            _OrderSummaryCard(
              order: order,
              kind: widget.kind,
              fundsGateBlocked: fundsGateBlocked,
            ),
            const SizedBox(height: 12),
          ],

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
          const SizedBox(height: 12),

          // IGP-specific: income tracking summary
          if (!isWash && (item['incomeBaseline'] != null || item['incomeFollowup'] != null)) ...[
            _SectionCard(title: 'Income tracking', children: [
              if (item['incomeBaseline'] != null) _row('Baseline',  'LKR ${item['incomeBaseline']}'),
              if (item['incomeFollowup'] != null) _row('Follow-up', 'LKR ${item['incomeFollowup']}'),
              if (item['incomeBaseline'] != null && item['incomeFollowup'] != null)
                _row('Uplift',
                    'LKR ${(num.parse(item['incomeFollowup'].toString()) - num.parse(item['incomeBaseline'].toString())).toStringAsFixed(0)}'),
            ]),
            const SizedBox(height: 12),
          ],

          // Stage timeline — append-only history with photos + GPS.
          _StageTimeline(updates: stageUpdates),
          const SizedBox(height: 24),

          // Actions — stage advance + IGP follow-up + PDF view.
          if (nextStage != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: FilledButton.icon(
                onPressed: fundsGateBlocked
                    ? () => _confirmFundsGateOverride(nextStage)
                    : () => _openTransition(nextStage),
                icon: Icon(fundsGateBlocked ? Icons.warning_amber_rounded : Icons.arrow_forward),
                label: Text(fundsGateBlocked
                    ? 'Advance anyway (funds not received)'
                    : 'Advance to $nextStage'),
                style: FilledButton.styleFrom(
                  backgroundColor: fundsGateBlocked ? kAmber600 : kAmber500,
                  foregroundColor: fundsGateBlocked ? Colors.white : kNavy900,
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
          if (!isWash && stage == 'Delivered')
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: OutlinedButton.icon(
                onPressed: _openFollowUp,
                icon: const Icon(Icons.trending_up),
                label: const Text('Record income follow-up'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: kKpiPurpleInk,
                  side: BorderSide(color: kKpiPurpleInk),
                  minimumSize: const Size.fromHeight(48),
                ),
              ),
            ),
          OutlinedButton.icon(
            onPressed: _openPdf,
            icon: const Icon(Icons.picture_as_pdf_outlined),
            label: const Text('Open item report (PDF)'),
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
            ),
          ),
        ],
      ),
    );
  }

  // Opens the server-rendered PDF in an external browser. Uses the existing
  // `?token=` query whitelist on /api/{wash,igp}/items/:id/report.
  Future<void> _openPdf() async {
    final token = await TokenStore().readAccess();
    if (!mounted) return;
    if (token == null) {
      _toast('Not signed in — cannot open report');
      return;
    }
    final url = '${Env.apiBaseUrl}/${widget.kind}/items/${widget.itemId}/report?token=$token';
    final ok = await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
    if (!mounted) return;
    if (!ok) _toast('Could not open PDF viewer');
  }

  // Funds-gate confirmation — proceed only after the user explicitly accepts
  // that funds haven't arrived. Server still records the transition; this
  // captures intent client-side so audit trails make sense.
  Future<void> _confirmFundsGateOverride(String newStage) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Funds not received'),
        content: const Text(
          'This order is configured to start work only after donor funds arrive. '
          'Advancing now means you are working on credit. Continue anyway?',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: kAmber600),
            child: const Text('Advance anyway'),
          ),
        ],
      ),
    );
    if (ok == true) _openTransition(newStage);
  }

  Future<void> _openFollowUp() async {
    final ok = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _IgpFollowUpSheet(itemId: widget.itemId, baseline: _item?['incomeBaseline']),
    );
    if (ok == true) _load();
  }

  void _toast(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Widget _heroChip(String label, String value) => Row(mainAxisSize: MainAxisSize.min, children: [
        Text('$label: ', style: const TextStyle(color: kAmber500, fontSize: 11)),
        Text(value, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
      ]);

  Widget _row(String label, String value) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(color: kInk500, fontSize: 12)),
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
        color: kSurfaceLight,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kInk400),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: TextStyle(color: kInk500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
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

  @override
  void dispose() {
    _notes.dispose();
    super.dispose();
  }

  Future<void> _captureGps() async {
    setState(() { _error = null; });
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        setState(() => _error = 'Location permission denied');
        return;
      }
      // Outer timeout in case the platform layer hangs past the inner
      // Geolocator timeLimit (rare but possible on weak signal).
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
              const Icon(Icons.arrow_forward, color: kNavy900),
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
                  : Text('Advance to ${widget.newStage}', style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// Order summary card — surfaces order deadline, payment status, and a
// funds-gate warning. Tapping opens the order screen with sibling items.
// ----------------------------------------------------------------------------
class _OrderSummaryCard extends StatelessWidget {
  final Map<String, dynamic> order;
  final String kind;
  final bool fundsGateBlocked;
  const _OrderSummaryCard({required this.order, required this.kind, required this.fundsGateBlocked});

  static const _paymentColors = <String, Color>{
    'Paid':           Color(0xFF16A34A),
    'PartiallyPaid':  Color(0xFFEA580C),
    'Pending':        Color(0xFFCA8A04),
    'Overdue':        Color(0xFFDC2626),
  };

  @override
  Widget build(BuildContext context) {
    final code = (order['orderCode'] ?? '').toString();
    final title = (order['title'] ?? '').toString();
    final deadline = (order['deadline'] ?? '—').toString();
    final paymentStatus = (order['paymentStatus'] ?? 'Pending').toString();
    final color = _paymentColors[paymentStatus] ?? kInk500;

    return Material(
      color: kSurfaceLight,
      borderRadius: BorderRadius.circular(12),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          final id = order['id'];
          if (id is num) {
            context.push('/programmes/$kind/order/${id.toInt()}');
          }
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.folder_outlined, size: 16, color: kInk500),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(code, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, fontFamily: 'monospace')),
                  ),
                  Icon(Icons.chevron_right, size: 18, color: kInk400),
                ],
              ),
              const SizedBox(height: 4),
              Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 13)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.event_outlined, size: 12, color: kInk500),
                  const SizedBox(width: 4),
                  Text('Deadline $deadline', style: TextStyle(color: kInk500, fontSize: 12)),
                  const SizedBox(width: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
                    child: Text(paymentStatus, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
                ],
              ),
              if (fundsGateBlocked) ...[
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: kKpiCreamBg,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: kAmber300),
                  ),
                  child: Row(children: [
                    Icon(Icons.warning_amber_rounded, color: kAmber600, size: 16),
                    const SizedBox(width: 8),
                    const Expanded(child: Text(
                      'Funds not received yet — work should not start until donor pays.',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    )),
                  ]),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

// ----------------------------------------------------------------------------
// Stage timeline widget — renders the append-only stage_updates rows.
// Photos shown as small thumbnails (tap to open in browser).
// ----------------------------------------------------------------------------
class _StageTimeline extends StatelessWidget {
  final List<Map<String, dynamic>> updates;
  const _StageTimeline({required this.updates});

  static const _stageColors = <String, Color>{
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
          Text('PROGRESS TIMELINE',
              style: TextStyle(color: kInk500, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.0)),
          const SizedBox(height: 12),
          if (updates.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Text('No stage updates yet.', style: TextStyle(color: kInk500, fontSize: 13)),
            )
          else
            ...updates.map((u) {
              final stage  = (u['stage'] ?? '').toString();
              final colour = _stageColors[stage] ?? kInk500;
              final notes  = (u['notes'] ?? '').toString();
              final percent = u['percentComplete'];
              final updater = u['updater']?['fullName']?.toString() ?? 'system';
              final createdAt = (u['createdAt'] ?? '').toString();
              final lat = u['latitude'];
              final lng = u['longitude'];
              final photos = u['photoUrls'];
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(width: 8, height: 8, margin: const EdgeInsets.only(top: 6), decoration: BoxDecoration(color: colour, shape: BoxShape.circle)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(spacing: 8, crossAxisAlignment: WrapCrossAlignment.center, children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(color: colour.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(4)),
                              child: Text(stage, style: TextStyle(color: colour, fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                            if (percent != null)
                              Text('$percent%', style: TextStyle(color: kInk500, fontSize: 11)),
                            Text(_relativeTime(createdAt), style: TextStyle(color: kInk400, fontSize: 11)),
                          ]),
                          Text(updater, style: TextStyle(color: kInk500, fontSize: 11)),
                          if (notes.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(notes, style: const TextStyle(fontSize: 13)),
                          ],
                          if (lat != null && lng != null) ...[
                            const SizedBox(height: 4),
                            Row(children: [
                              Icon(Icons.location_on_outlined, size: 11, color: kInk400),
                              const SizedBox(width: 2),
                              Text('${(lat as num).toStringAsFixed(5)}, ${(lng as num).toStringAsFixed(5)}',
                                  style: TextStyle(color: kInk400, fontSize: 11)),
                            ]),
                          ],
                          if (photos is List && photos.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Row(children: [
                              Icon(Icons.image_outlined, size: 12, color: kInk400),
                              const SizedBox(width: 4),
                              Text('${photos.length} photo${photos.length == 1 ? '' : 's'}',
                                  style: TextStyle(color: kInk400, fontSize: 11)),
                            ]),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }

  // Human-readable "2h ago" style for the timeline. Falls back to the raw
  // ISO date if parsing fails.
  String _relativeTime(String iso) {
    try {
      final t = DateTime.parse(iso).toLocal();
      final diff = DateTime.now().difference(t);
      if (diff.inMinutes < 1)  return 'just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours   < 24) return '${diff.inHours}h ago';
      if (diff.inDays    < 7)  return '${diff.inDays}d ago';
      return '${t.year}-${t.month.toString().padLeft(2,'0')}-${t.day.toString().padLeft(2,'0')}';
    } catch (_) {
      return iso;
    }
  }
}

// ----------------------------------------------------------------------------
// IGP income follow-up sheet — captures the post-asset monthly income
// figure so MEAL can compute the uplift. Photo + GPS optional but encouraged.
// ----------------------------------------------------------------------------
class _IgpFollowUpSheet extends ConsumerStatefulWidget {
  final int itemId;
  final dynamic baseline;
  const _IgpFollowUpSheet({required this.itemId, this.baseline});

  @override
  ConsumerState<_IgpFollowUpSheet> createState() => _IgpFollowUpSheetState();
}

class _IgpFollowUpSheetState extends ConsumerState<_IgpFollowUpSheet> {
  final _income = TextEditingController();
  final _notes  = TextEditingController();
  double? _lat;
  double? _lng;
  File? _photo;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _income.dispose();
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
      // Outer timeout in case the platform layer hangs past the inner
      // Geolocator timeLimit (rare but possible on weak signal).
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
    final income = num.tryParse(_income.text.trim());
    if (income == null || income < 0) {
      setState(() => _error = 'Enter the new monthly income (LKR)');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      final repo = ref.read(programmeRepoProvider);
      String? photoUrl;
      if (_photo != null) photoUrl = await repo.uploadPhoto(_photo!);
      await repo.recordIgpFollowUp(
        widget.itemId,
        incomeFollowup: income,
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
        photoUrls: photoUrl != null ? [photoUrl] : <String>[],
        latitude:  _lat,
        longitude: _lng,
      );
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = 'Failed: $e');
    } finally {
      setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final baseline = widget.baseline;
    final income = num.tryParse(_income.text.trim());
    num? delta;
    if (income != null && baseline != null) {
      final b = num.tryParse(baseline.toString());
      if (b != null) delta = income - b;
    }

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
              Icon(Icons.trending_up, color: kKpiPurpleInk),
              const SizedBox(width: 8),
              const Expanded(child: Text('Income follow-up',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold))),
            ]),
            const SizedBox(height: 6),
            Text(
              baseline != null
                  ? 'Baseline (pre-asset): LKR $baseline'
                  : 'No baseline recorded yet — uplift cannot be calculated.',
              style: TextStyle(color: kInk500, fontSize: 13),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _income,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              onChanged: (_) => setState(() {}),
              decoration: const InputDecoration(
                labelText: 'Current monthly income (LKR)',
                border: OutlineInputBorder(),
              ),
            ),
            if (delta != null) ...[
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (delta >= 0 ? kSuccess600 : kDanger600).withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: (delta >= 0 ? kSuccess600 : kDanger600).withValues(alpha: 0.4)),
                ),
                child: Text(
                  'Change: ${delta >= 0 ? '+' : ''}LKR ${delta.abs().toStringAsFixed(0)}',
                  style: TextStyle(
                    color: (delta >= 0 ? kSuccess600 : kDanger600),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
            const SizedBox(height: 12),
            TextField(
              controller: _notes,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                border: OutlineInputBorder(),
                hintText: 'Observations, livelihood changes, challenges…',
              ),
            ),
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
                child: Image.file(_photo!, height: 140, width: double.infinity, fit: BoxFit.cover),
              ),
            ],
            if (_error != null) ...[
              const SizedBox(height: 12),
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
                backgroundColor: kKpiPurpleInk,
                minimumSize: const Size.fromHeight(48),
              ),
              child: _busy
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save follow-up', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
