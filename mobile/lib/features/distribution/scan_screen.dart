// =============================================================================
// ScanScreen — QR check-in at distribution events.
//
// Flow: pick the active event → camera opens → each beneficiary card QR is
// scanned → POST /distribution-scans. When the site has no signal the scan
// is parked in the local sqflite queue (ScanQueue) and replayed by "Sync
// now" or the app-resume hook. The clientUuid generated here is reused for
// both the live POST and the queued row, so retries can never double-count.
//
// Lost-card fallback: "Manual entry" opens a sheet that searches
// /beneficiaries by name (or accepts a raw token typed in) and submits the
// selection through the exact same path as a camera scan.
// =============================================================================

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';

import '../../app/theme.dart';
import '../../services/api_client.dart';
import '../../services/api_response.dart';
import '../../services/friendly_error.dart';
import '../../services/scan_queue.dart';
import 'distribution_repository.dart';

const _kPrefLastEventId = 'distribution.lastEventId';
const _kPrefCountDate = 'distribution.scanCountDate';
const _kPrefCount = 'distribution.scanCount';

class ScanScreen extends ConsumerStatefulWidget {
  const ScanScreen({super.key});

  @override
  ConsumerState<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends ConsumerState<ScanScreen> {
  static const _uuid = Uuid();

  // Events
  List<Map<String, dynamic>> _events = [];
  bool _loadingEvents = true;
  Object? _eventsError;
  int? _selectedEventId;

  // Camera
  MobileScannerController? _controller;

  // Counters
  int _scannedToday = 0;
  int _pendingCount = 0;

  // Submission guard — one scan at a time; debounce repeated frames of the
  // same QR while the card is still in front of the lens.
  bool _processing = false;
  bool _syncing = false;
  String? _lastToken;
  DateTime _lastTokenAt = DateTime.fromMillisecondsSinceEpoch(0);

  @override
  void initState() {
    super.initState();
    _restoreCounter();
    _loadEvents();
    _refreshPending();
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  String _todayKey() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }

  Future<void> _restoreCounter() async {
    final prefs = await SharedPreferences.getInstance();
    final date = prefs.getString(_kPrefCountDate);
    final count = (date == _todayKey()) ? (prefs.getInt(_kPrefCount) ?? 0) : 0;
    if (mounted) setState(() => _scannedToday = count);
  }

  Future<void> _bumpCounter() async {
    final prefs = await SharedPreferences.getInstance();
    final next = _scannedToday + 1;
    await prefs.setString(_kPrefCountDate, _todayKey());
    await prefs.setInt(_kPrefCount, next);
    if (mounted) setState(() => _scannedToday = next);
  }

  Future<void> _refreshPending() async {
    final n = await ref.read(scanQueueProvider).count();
    if (mounted) setState(() => _pendingCount = n);
  }

  Future<void> _loadEvents() async {
    setState(() {
      _loadingEvents = true;
      _eventsError = null;
    });
    try {
      final events = await ref.read(distributionRepoProvider).listEvents();
      final prefs = await SharedPreferences.getInstance();
      final lastId = prefs.getInt(_kPrefLastEventId);
      if (!mounted) return;
      setState(() {
        _events = events;
        _loadingEvents = false;
        // Re-select the last-used event if it's still active.
        if (lastId != null && events.any((e) => e['id'] == lastId)) {
          _selectEvent(lastId, persist: false);
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _eventsError = e;
        _loadingEvents = false;
      });
    }
  }

  void _selectEvent(int? id, {bool persist = true}) {
    setState(() => _selectedEventId = id);
    if (id != null) {
      if (persist) {
        // ignore: discarded_futures
        SharedPreferences.getInstance()
            .then((p) => p.setInt(_kPrefLastEventId, id));
      }
      // (Re)create the camera controller when an event is picked.
      _controller ??= MobileScannerController(
        detectionSpeed: DetectionSpeed.normal,
        facing: CameraFacing.back,
      );
    }
  }

  Map<String, dynamic>? get _selectedEvent {
    for (final e in _events) {
      if (e['id'] == _selectedEventId) return e;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Scan handling
  // ---------------------------------------------------------------------------

  void _onDetect(BarcodeCapture capture) {
    if (_processing || _selectedEventId == null) return;
    String? token;
    for (final b in capture.barcodes) {
      final v = b.rawValue;
      if (v != null && v.trim().isNotEmpty) {
        token = v.trim();
        break;
      }
    }
    if (token == null) return;
    // Same card still in frame? Ignore re-detections for a few seconds.
    final now = DateTime.now();
    if (token == _lastToken &&
        now.difference(_lastTokenAt) < const Duration(seconds: 3)) {
      return;
    }
    _lastToken = token;
    _lastTokenAt = now;
    // ignore: discarded_futures
    _recordScan(token);
  }

  /// Shared submit path for camera scans AND manual entry.
  Future<void> _recordScan(String token) async {
    final eventId = _selectedEventId;
    if (eventId == null || _processing) return;
    setState(() => _processing = true);
    try {
      await _controller?.stop();
    } catch (_) {/* camera may already be stopped */}

    final clientUuid = _uuid.v4();
    final pos = await _resolveLocation();

    try {
      final scan = await ref.read(distributionRepoProvider).submitScan(
            token: token,
            eventId: eventId,
            lat: pos?.latitude,
            lng: pos?.longitude,
            clientUuid: clientUuid,
          );
      await _bumpCounter();
      final who = (scan['beneficiaryName'] ?? scan['fullName'] ?? '').toString();
      _toast(
        who.isEmpty ? 'Recorded' : 'Recorded — $who',
        color: kSuccess600,
        icon: Icons.check_circle_outline,
      );
    } on ScanException catch (e) {
      switch (e.reason) {
        case ScanFailure.duplicate:
          _toast(e.message, color: kWarn600, icon: Icons.repeat_rounded);
        case ScanFailure.network:
        case ScanFailure.server:
          // Offline (or backend down) — park the scan locally with the SAME
          // clientUuid so a half-delivered request can't double-count.
          await ref.read(scanQueueProvider).enqueue(
                token: token,
                eventId: eventId,
                latitude: pos?.latitude,
                longitude: pos?.longitude,
                clientUuid: clientUuid,
              );
          await _bumpCounter();
          await _refreshPending();
          _toast('Saved — will sync when online.',
              color: kNavy700, icon: Icons.cloud_off_rounded);
        case ScanFailure.auth:
        case ScanFailure.invalid:
          _toast(e.message, color: kDanger600, icon: Icons.error_outline);
      }
    } catch (e) {
      _toast(friendlyError(e), color: kDanger600, icon: Icons.error_outline);
    } finally {
      // Brief pause so staff sees the toast, then resume scanning.
      await Future.delayed(const Duration(milliseconds: 700));
      if (mounted && _selectedEventId != null) {
        try {
          await _controller?.start();
        } catch (_) {/* surface via errorBuilder on next frame */}
      }
      if (mounted) setState(() => _processing = false);
    }
  }

  /// Best-effort GPS fix — mirrors the punch screen pattern, but with a hard
  /// time cap so a slow fix never stalls the scan line. Returns null when
  /// permission is denied or no fix arrives in time (scan proceeds without
  /// coordinates).
  Future<Position?> _resolveLocation() async {
    try {
      final ok = await Permission.locationWhenInUse.request();
      if (!ok.isGranted) return null;
      final serviceOn = await Geolocator.isLocationServiceEnabled();
      if (!serviceOn) return null;
      return await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 5),
        ),
      );
    } on TimeoutException {
      try {
        return await Geolocator.getLastKnownPosition();
      } catch (_) {
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Sync
  // ---------------------------------------------------------------------------

  Future<void> _syncNow() async {
    if (_syncing) return;
    setState(() => _syncing = true);
    try {
      final result = await ref.read(distributionRepoProvider).flushQueue();
      await _refreshPending();
      if (!mounted) return;
      if (result.synced == 0 && result.failed == 0) {
        _toast('Nothing to sync.', color: kInk500, icon: Icons.cloud_done_outlined);
      } else if (result.failed == 0) {
        _toast('Synced ${result.synced} scan${result.synced == 1 ? '' : 's'}.',
            color: kSuccess600, icon: Icons.cloud_done_outlined);
      } else {
        _toast(
          'Synced ${result.synced}, ${result.failed} still pending.',
          color: kWarn600,
          icon: Icons.cloud_sync_outlined,
        );
      }
    } catch (e) {
      _toast(friendlyError(e), color: kDanger600, icon: Icons.error_outline);
    } finally {
      if (mounted) setState(() => _syncing = false);
    }
  }

  // ---------------------------------------------------------------------------
  // Manual entry (lost card)
  // ---------------------------------------------------------------------------

  Future<void> _openManualEntry() async {
    final token = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => const _ManualEntrySheet(),
    );
    if (token != null && token.trim().isNotEmpty) {
      await _recordScan(token.trim());
    }
  }

  void _toast(String msg, {required Color color, required IconData icon}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        behavior: SnackBarBehavior.floating,
        duration: const Duration(milliseconds: 1600),
        backgroundColor: color,
        content: Row(children: [
          Icon(icon, color: Colors.white, size: 18),
          const SizedBox(width: 10),
          Expanded(child: Text(msg, maxLines: 2, overflow: TextOverflow.ellipsis)),
        ]),
      ));
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  @override
  Widget build(BuildContext context) {
    final event = _selectedEvent;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Distribution'),
        actions: [
          _PendingBadge(count: _pendingCount),
          IconButton(
            tooltip: 'Sync now',
            onPressed: _syncing ? null : _syncNow,
            icon: _syncing
                ? const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.sync_rounded),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: Column(
        children: [
          // ---- Header: event picker + counters ------------------------------
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (_loadingEvents)
                  const LinearProgressIndicator(minHeight: 2)
                else if (_eventsError != null)
                  ErrorView(error: _eventsError, onRetry: _loadEvents,
                      padding: const EdgeInsets.all(8))
                else if (_events.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: kAmber50,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      'No active distribution events right now.',
                      style: GoogleFonts.inter(fontSize: 13, color: kInk700),
                    ),
                  )
                else
                  DropdownButtonFormField<int>(
                    initialValue: _selectedEventId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: 'Distribution event',
                      isDense: true,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10)),
                    ),
                    items: [
                      for (final e in _events)
                        DropdownMenuItem<int>(
                          value: (e['id'] as num).toInt(),
                          child: Text(
                            [
                              (e['name'] ?? 'Event ${e['id']}').toString(),
                              if ((e['location'] ?? '').toString().isNotEmpty)
                                e['location'].toString(),
                            ].join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                    ],
                    onChanged: (v) => _selectEvent(v),
                  ),
                if (event != null) ...[
                  const SizedBox(height: 10),
                  Row(children: [
                    Expanded(
                      child: Text(
                        (event['name'] ?? '').toString(),
                        style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.w800,
                          color: kInk900,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: kKpiMintBg,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        'Scanned today: $_scannedToday',
                        style: GoogleFonts.inter(
                          fontSize: 12, fontWeight: FontWeight.w700,
                          color: kKpiMintInk,
                        ),
                      ),
                    ),
                  ]),
                ],
              ],
            ),
          ),

          // ---- Camera --------------------------------------------------------
          Expanded(
            child: _selectedEventId == null
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.qr_code_scanner_rounded,
                              size: 56, color: kInk400),
                          const SizedBox(height: 12),
                          Text(
                            'Choose a distribution event to start scanning.',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.inter(
                                fontSize: 13.5, color: kInk500),
                          ),
                        ],
                      ),
                    ),
                  )
                : Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          MobileScanner(
                            controller: _controller,
                            onDetect: _onDetect,
                            errorBuilder: (context, error, child) =>
                                _CameraError(error: error),
                          ),
                          // Viewfinder overlay
                          IgnorePointer(
                            child: Center(
                              child: Container(
                                width: 230,
                                height: 230,
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: _processing
                                        ? kAmber500
                                        : Colors.white.withValues(alpha: 0.9),
                                    width: 3,
                                  ),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                              ),
                            ),
                          ),
                          if (_processing)
                            Positioned(
                              left: 0, right: 0, bottom: 14,
                              child: Center(
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 14, vertical: 7),
                                  decoration: BoxDecoration(
                                    color: kNavy900.withValues(alpha: 0.78),
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'Recording…',
                                    style: GoogleFonts.inter(
                                      color: Colors.white, fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
          ),

          // ---- Manual fallback ----------------------------------------------
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: _selectedEventId == null || _processing
                      ? null
                      : _openManualEntry,
                  icon: const Icon(Icons.person_search_outlined, size: 19),
                  label: const Text('Manual entry (lost card)'),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _PendingBadge extends StatelessWidget {
  final int count;
  const _PendingBadge({required this.count});

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox.shrink();
    return Center(
      child: Container(
        margin: const EdgeInsets.only(right: 2),
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
        decoration: BoxDecoration(
          color: kAmber50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: kAmber500),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.cloud_upload_outlined, size: 14, color: kAmber600),
          const SizedBox(width: 4),
          Text(
            '$count',
            style: GoogleFonts.inter(
              fontSize: 12, fontWeight: FontWeight.w800, color: kAmber600,
            ),
          ),
        ]),
      ),
    );
  }
}

class _CameraError extends StatelessWidget {
  final MobileScannerException error;
  const _CameraError({required this.error});

  @override
  Widget build(BuildContext context) {
    final denied =
        error.errorCode == MobileScannerErrorCode.permissionDenied;
    return Container(
      color: kInk900,
      alignment: Alignment.center,
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(denied ? Icons.no_photography_outlined : Icons.videocam_off_outlined,
              color: Colors.white70, size: 42),
          const SizedBox(height: 12),
          Text(
            denied
                ? 'Camera permission denied. Enable it in Settings to scan QR codes.'
                : 'Camera unavailable. Use Manual entry below.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
          ),
          if (denied) ...[
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: openAppSettings,
              style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
              child: const Text('Open settings'),
            ),
          ],
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// Manual entry sheet — search /beneficiaries by name OR type a raw token.
// Pops with the token string to submit through the normal scan path.
//
// Token derivation for a search hit: prefer an explicit QR-token field if the
// API exposes one; otherwise fall back to "beneficiary:<id>" which the
// backend can resolve as a manual-entry token.
// -----------------------------------------------------------------------------

class _ManualEntrySheet extends ConsumerStatefulWidget {
  const _ManualEntrySheet();

  @override
  ConsumerState<_ManualEntrySheet> createState() => _ManualEntrySheetState();
}

class _ManualEntrySheetState extends ConsumerState<_ManualEntrySheet> {
  final _searchCtrl = TextEditingController();
  final _tokenCtrl = TextEditingController();
  Timer? _debounce;
  List<Map<String, dynamic>> _rows = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _searchCtrl.dispose();
    _tokenCtrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String q) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () => _search(q));
  }

  Future<void> _search(String q) async {
    final term = q.trim();
    if (term.length < 2) {
      if (mounted) setState(() { _rows = []; _error = null; });
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      final dio = ref.read(dioProvider);
      final res = await dio.get('/beneficiaries', queryParameters: {
        'search': term, 'limit': 25,
      });
      final list = extractMapList(res.data, const ['beneficiaries', 'rows']);
      if (!mounted) return;
      setState(() { _rows = list; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _error = friendlyError(e); _loading = false; });
    }
  }

  String _tokenFor(Map<String, dynamic> b) {
    final explicit =
        b['qrToken'] ?? b['distributionToken'] ?? b['scanToken'] ?? b['token'];
    if (explicit is String && explicit.trim().isNotEmpty) {
      return explicit.trim();
    }
    return 'beneficiary:${b['id']}';
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.72,
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: kInk200, borderRadius: BorderRadius.circular(4),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 4),
              child: Row(children: [
                Expanded(
                  child: Text(
                    'Manual entry',
                    style: GoogleFonts.inter(
                      fontSize: 16, fontWeight: FontWeight.w800, color: kInk900,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.of(context).pop(),
                ),
              ]),
            ),
            // Raw token input — covers cards whose QR text is known/written.
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
              child: TextField(
                controller: _tokenCtrl,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.qr_code_2, size: 20),
                  hintText: 'Type card token, then press ✓',
                  isDense: true,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.check_rounded),
                    onPressed: () {
                      final t = _tokenCtrl.text.trim();
                      if (t.isNotEmpty) Navigator.of(context).pop(t);
                    },
                  ),
                ),
                onSubmitted: (v) {
                  final t = v.trim();
                  if (t.isNotEmpty) Navigator.of(context).pop(t);
                },
              ),
            ),
            const Divider(height: 1),
            // Name search
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
              child: TextField(
                controller: _searchCtrl,
                autofocus: true,
                decoration: InputDecoration(
                  prefixIcon: const Icon(Icons.search),
                  hintText: 'Search beneficiary by name, NIC, or phone',
                  isDense: true,
                  border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                onChanged: _onChanged,
              ),
            ),
            if (_loading) const LinearProgressIndicator(minHeight: 2),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_error!,
                    style: TextStyle(color: kDanger600, fontSize: 12)),
              ),
            Expanded(
              child: _rows.isEmpty
                  ? Center(
                      child: Text(
                        _searchCtrl.text.trim().length < 2
                            ? 'Type at least 2 characters to search.'
                            : (_loading ? 'Searching…' : 'No matches.'),
                        style: TextStyle(color: kInk500, fontSize: 13),
                      ),
                    )
                  : ListView.separated(
                      itemCount: _rows.length,
                      separatorBuilder: (_, _) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final b = _rows[i];
                        final name = (b['fullName'] ?? '—').toString();
                        final nic = (b['nic'] ?? '').toString();
                        final district = (b['district'] ?? '').toString();
                        return ListTile(
                          leading: CircleAvatar(
                            backgroundColor: kKpiPurpleBg,
                            child: Icon(Icons.person_outline,
                                color: kKpiPurpleInk),
                          ),
                          title: Text(name,
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                          subtitle: Text(
                            [
                              if (nic.isNotEmpty) 'NIC $nic',
                              if (district.isNotEmpty) district,
                            ].join(' · '),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing:
                              const Icon(Icons.chevron_right_rounded, size: 20),
                          onTap: () =>
                              Navigator.of(context).pop(_tokenFor(b)),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
