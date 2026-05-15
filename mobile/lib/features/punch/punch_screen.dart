import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_mlkit_face_detection/google_mlkit_face_detection.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/background_location_service.dart';
import '../../services/friendly_error.dart';
import '../../services/location_tracker.dart';
import '../../services/token_store.dart';
import 'punch_repository.dart';

final todayProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(punchRepoProvider).today();
});

class PunchScreen extends ConsumerStatefulWidget {
  const PunchScreen({super.key});

  @override
  ConsumerState<PunchScreen> createState() => _PunchScreenState();
}

class _PunchScreenState extends ConsumerState<PunchScreen> {
  bool _busy = false;
  String? _error;

  Future<Position?> _resolveLocation() async {
    final ok = await Permission.locationWhenInUse.request();
    if (!ok.isGranted) return null;
    final serviceOn = await Geolocator.isLocationServiceEnabled();
    if (!serviceOn) return null;
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  /// Quick face-presence check. Returns true if the photo contains at least
  /// one human face. Fails OPEN (returns true) on ML Kit errors so a model
  /// glitch never blocks legitimate punches.
  Future<bool> _hasFace(String imagePath) async {
    final detector = FaceDetector(
      options: FaceDetectorOptions(
        performanceMode: FaceDetectorMode.fast,
        minFaceSize: 0.15,
      ),
    );
    try {
      final faces = await detector.processImage(InputImage.fromFilePath(imagePath));
      return faces.isNotEmpty;
    } catch (_) {
      return true; // fail-open: don't block work because ML Kit choked
    } finally {
      await detector.close();
    }
  }

  Future<String?> _captureSelfie() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.camera,
      preferredCameraDevice: CameraDevice.front,
      imageQuality: 70,
      maxWidth: 1024,
    );
    if (picked == null) return null;

    // Face-presence gate — block punches where the selfie has no human face
    // (paper photo, wall, eyes-closed silhouette, etc.).
    final hasFace = await _hasFace(picked.path);
    if (!hasFace) {
      if (mounted) {
        setState(() => _error =
            'No face detected in the selfie. Hold the phone in front of your '
            'face with good lighting and try again.');
      }
      return null;
    }

    try {
      final dio = ref.read(dioProvider);
      // Explicit image/jpeg content type — image_picker re-encodes to JPEG
      // when imageQuality is set, but without this the multipart part can
      // arrive as application/octet-stream, which the server's upload
      // file-type filter rejects with a 400. Dio sets the multipart
      // boundary itself, so we no longer pass a manual Content-Type header.
      final form = FormData.fromMap({
        'image': await MultipartFile.fromFile(
          picked.path,
          filename: 'selfie.jpg',
          contentType: DioMediaType('image', 'jpeg'),
        ),
      });
      final res = await dio.post('/upload/punch', data: form);
      final data = res.data['data'] ?? res.data;
      return (data['url'] ?? data['path'])?.toString();
    } catch (e) {
      if (mounted) {
        setState(() => _error = 'Selfie upload failed: ${friendlyError(e)}');
      }
      return null;
    }
  }

  Future<void> _punch(String punchType, {bool withSelfie = false}) async {
    setState(() { _busy = true; _error = null; });
    try {
      final pos = await _resolveLocation();
      String? selfieUrl;
      if (withSelfie) {
        selfieUrl = await _captureSelfie();
        // If the face check or upload failed, abort the punch — _error is
        // already set by _captureSelfie, so just stop here.
        if (selfieUrl == null) {
          if (mounted) setState(() => _busy = false);
          return;
        }
      }
      await ref.read(punchRepoProvider).record(
        punchType: punchType,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
        accuracyM: pos?.accuracy,
        selfieUrl: selfieUrl,
      );
      ref.invalidate(todayProvider);

      // Attendance drives GPS tracking: punching In auto-starts background
      // location tracking, punching Out stops it. Best-effort — wrapped so a
      // tracking hiccup never fails the punch itself.
      if (punchType == 'In') {
        await _autoStartTracking();
      } else if (punchType == 'Out') {
        await _autoStopTracking();
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Punched $punchType')),
        );
      }
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Start background GPS tracking after a Punch In. Silent on failure
  /// (denied permission etc.) — the punch already succeeded, we never want
  /// a tracking problem to look like a punch problem.
  Future<void> _autoStartTracking() async {
    try {
      if (await BackgroundLocationService.isRunning()) {
        if (mounted) ref.read(isTrackingProvider.notifier).state = true;
        return;
      }
      final foregroundOk = await ref.read(locationTrackerProvider).start();
      if (!foregroundOk) return; // location permission denied
      final access = await TokenStore().readAccess();
      if (access == null) return;
      final refresh = await TokenStore().readRefresh();
      final ok = await BackgroundLocationService.start(
        accessToken: access,
        refreshToken: refresh,
      );
      if (mounted) ref.read(isTrackingProvider.notifier).state = ok;
    } catch (_) { /* best-effort */ }
  }

  /// Stop background GPS tracking after a Punch Out.
  Future<void> _autoStopTracking() async {
    try {
      await BackgroundLocationService.stop();
      await ref.read(locationTrackerProvider).stop();
      if (mounted) ref.read(isTrackingProvider.notifier).state = false;
    } catch (_) { /* best-effort */ }
  }

  @override
  Widget build(BuildContext context) {
    final today = ref.watch(todayProvider);
    // SafeArea here so the navy header card always clears the status bar,
    // regardless of how /punch was reached (swipe-to-check-in from Home, or
    // the Attendance tile). SafeArea is idempotent — if the shell already
    // applied one, this inner SafeArea simply adds nothing.
    return SafeArea(
      bottom: false,
      child: RefreshIndicator(
        color: kAmber500,
        onRefresh: () async { ref.invalidate(todayProvider); },
        child: ListView(
          padding: const EdgeInsets.all(16),
        children: [
          today.when(
            loading: () => SoftCard(
              padding: const EdgeInsets.all(28),
              child: const Center(
                child: CircularProgressIndicator(color: kAmber500),
              ),
            ),
            error: (e, _) => _ErrorBox(message: friendlyError(e)),
            data: (d) => _TodayCard(data: d),
          ),

          if (_error != null) ...[
            const SizedBox(height: 12),
            _ErrorBox(message: _error!),
          ],

          const SizedBox(height: 16),

          // Primary punch buttons
          Row(
            children: [
              Expanded(
                child: _ActionTile(
                  label: 'Punch IN',
                  icon: Icons.login_rounded,
                  filled: true,
                  busy: _busy,
                  onPressed: () => _punch('In', withSelfie: true),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _ActionTile(
                  label: 'Punch OUT',
                  icon: Icons.logout_rounded,
                  filled: false,
                  busy: _busy,
                  onPressed: () => _punch('Out'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Break controls
          Row(
            children: [
              Expanded(
                child: _BreakButton(
                  label: 'Break in',
                  icon: Icons.coffee_outlined,
                  busy: _busy,
                  onPressed: () => _punch('BreakIn'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _BreakButton(
                  label: 'Break out',
                  icon: Icons.work_history_outlined,
                  busy: _busy,
                  onPressed: () => _punch('BreakOut'),
                ),
              ),
            ],
          ),

          const SizedBox(height: 22),
          const SectionHeader(label: "Today's punches"),

          today.when(
            loading: () => const SizedBox.shrink(),
            error: (_, _) => const SizedBox.shrink(),
            data: (d) {
              final punches = (d['punches'] as List? ?? []).cast<Map>();
              if (punches.isEmpty) {
                return SoftCard(
                  child: Row(
                    children: [
                      const Icon(Icons.history_toggle_off,
                          color: kInk400, size: 20),
                      const SizedBox(width: 10),
                      Text(
                        'No punches yet today.',
                        style: GoogleFonts.inter(
                          fontSize: 13.5, color: kInk500,
                        ),
                      ),
                    ],
                  ),
                );
              }
              return SoftCard(
                padding: EdgeInsets.zero,
                child: Column(
                  children: [
                    for (var i = 0; i < punches.length; i++) ...[
                      if (i > 0)
                        const Divider(height: 1, color: kInk100),
                      _PunchRow(punch: Map<String, dynamic>.from(punches[i])),
                    ],
                  ],
                ),
              );
            },
          ),
        ],
      ),
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _TodayCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TodayCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final isClockedIn = data['isClockedIn'] == true;
    final last = data['lastPunch'] as Map?;
    final dateStr = data['date'] as String? ?? '';

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      decoration: BoxDecoration(
        color: kNavy900,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.18),
            blurRadius: 14, offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              StatusPill(
                label: isClockedIn ? 'CLOCKED IN' : 'NOT CLOCKED IN',
                color: isClockedIn ? kSuccess600 : kInk400,
                icon: isClockedIn ? Icons.circle : Icons.circle_outlined,
              ),
              const Spacer(),
              Text(
                dateStr,
                style: GoogleFonts.inter(
                  color: kInk200,
                  fontSize: 11.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            isClockedIn ? "You're on duty" : 'Ready to start your day',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.4,
            ),
          ),
          if (last != null) ...[
            const SizedBox(height: 4),
            Text(
              'Last punch: ${last['punchType']} · ${_fmtTime(last['occurredAt'])}',
              style: GoogleFonts.inter(
                color: kInk200,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PunchRow extends StatelessWidget {
  final Map<String, dynamic> punch;
  const _PunchRow({required this.punch});

  @override
  Widget build(BuildContext context) {
    final type = punch['punchType'] as String? ?? '';
    final geo = punch['geofenceMatch'] == true;
    final isIn = type == 'In' || type == 'BreakIn';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      child: Row(
        children: [
          Container(
            width: 34, height: 34,
            decoration: BoxDecoration(
              color: (isIn ? kSuccess600 : kDanger600).withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(
              isIn ? Icons.login : Icons.logout,
              size: 17,
              color: isIn ? kSuccess600 : kDanger600,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  type,
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: kInk900,
                  ),
                ),
                Text(
                  _fmtTime(punch['occurredAt']),
                  style: GoogleFonts.inter(fontSize: 12, color: kInk500),
                ),
              ],
            ),
          ),
          if (geo)
            const Icon(Icons.place, color: kSuccess600, size: 17)
          else if (punch['latitude'] != null)
            const Icon(Icons.location_off, color: kMission600, size: 17),
        ],
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool filled;
  final bool busy;
  final VoidCallback onPressed;
  const _ActionTile({
    required this.label,
    required this.icon,
    required this.filled,
    required this.busy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final bg = filled ? kMission500 : kSurfaceLight;
    final fg = filled ? kNavy900 : kNavy900;
    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: busy ? null : onPressed,
        child: Container(
          height: 92,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: filled
                ? null
                : Border.all(color: kInk200, width: 1.2),
            boxShadow: filled
                ? [
                    BoxShadow(
                      color: kMission500.withValues(alpha: 0.25),
                      blurRadius: 14, offset: const Offset(0, 6),
                    ),
                  ]
                : null,
          ),
          child: busy
              ? Center(
                  child: SizedBox(
                    width: 22, height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2.4, color: fg),
                  ),
                )
              : Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(icon, color: fg, size: 24),
                    const SizedBox(height: 4),
                    Text(
                      label,
                      style: GoogleFonts.inter(
                        color: fg,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.2,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _BreakButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool busy;
  final VoidCallback onPressed;
  const _BreakButton({
    required this.label,
    required this.icon,
    required this.busy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return OutlinedButton.icon(
      onPressed: busy ? null : onPressed,
      icon: Icon(icon, size: 16),
      label: Text(label),
    );
  }
}

class _ErrorBox extends StatelessWidget {
  final String message;
  const _ErrorBox({required this.message});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kDanger600.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: kDanger600.withValues(alpha: 0.25)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: kDanger600, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: 12.5,
                color: kDanger600,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _fmtTime(dynamic raw) {
  if (raw == null) return '—';
  try {
    final dt = DateTime.parse(raw.toString()).toLocal();
    return DateFormat('HH:mm').format(dt);
  } catch (_) {
    return raw.toString();
  }
}
