import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/background_location_service.dart';
import '../../services/location_tracker.dart';
import '../../services/token_store.dart';
import '../auth/auth_controller.dart';

// =============================================================================
// MoreScreen — card-grid hub replacing the legacy navigation drawer.
//
// Sections:
//   1. Identity strip (avatar + name + role + sign-out)
//   2. Field work     (Movements, Fuel claims, Shifts)
//   3. HR & finance   (Leave, Expenses, Salary advances, Payslips)
//   4. Updates        (Announcements)
//   5. Tracking toggle (foreground GPS)
// =============================================================================

class _Tile {
  final String label;
  final IconData icon;
  final String route;
  final Color tone;
  const _Tile(this.label, this.icon, this.route, this.tone);
}

class MoreScreen extends ConsumerWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull?.user;
    final tracking = ref.watch(isTrackingProvider);

    final fieldWork = const [
      _Tile('Movements',         Icons.directions_car_outlined, '/movements',             kNavy900),
      _Tile('Vehicle requests',  Icons.airport_shuttle_outlined, '/vehicle-requests',     kNavy900),
      _Tile('Accommodation',     Icons.hotel_outlined,            '/accommodation-requests', kMission600),
      _Tile('Fuel claims',       Icons.local_gas_station,         '/fuel-claims',          kMission600),
    ];
    final hrFinance = const [
      _Tile('Leave',           Icons.event_busy_outlined,    '/leaves',    kNavy900),
      _Tile('Expenses',        Icons.receipt_long_outlined,  '/expenses',  kMission600),
      _Tile('Salary advances', Icons.attach_money,           '/advances',  kSuccess600),
      _Tile('Payslips',        Icons.payments_outlined,      '/payslips',  kNavy900),
    ];
    final updates = const [
      _Tile('Notifications', Icons.notifications_outlined, '/notifications', kNavy900),
      _Tile('Announcements', Icons.campaign_outlined,      '/announcements', kMission600),
    ];

    final safety = const [
      _Tile('Report incident', Icons.shield_outlined, '/incidents', kDanger600),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 22),
      children: [
        _IdentityCard(user: user, ref: ref),
        const SizedBox(height: 18),
        _TrackingTile(
          tracking: tracking,
          onToggle: () => _toggleTracking(context, ref, tracking),
        ),
        const SizedBox(height: 18),

        _GridSection(title: 'Field work', tiles: fieldWork),
        const SizedBox(height: 18),
        _GridSection(title: 'HR & Finance', tiles: hrFinance),
        const SizedBox(height: 18),
        _GridSection(title: 'Updates', tiles: updates),
        const SizedBox(height: 18),
        _GridSection(title: 'Safety & Compliance', tiles: safety),
      ],
    );
  }

  Future<void> _toggleTracking(
      BuildContext context, WidgetRef ref, bool tracking) async {
    final running = await BackgroundLocationService.isRunning();
    if (running) {
      await BackgroundLocationService.stop();
      await ref.read(locationTrackerProvider).stop();
      ref.read(isTrackingProvider.notifier).state = false;
      return;
    }
    final foregroundOk = await ref.read(locationTrackerProvider).start();
    if (!foregroundOk) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission denied')),
        );
      }
      return;
    }
    final access = await TokenStore().readAccess();
    if (access == null) {
      ref.read(isTrackingProvider.notifier).state = false;
      return;
    }
    final ok = await BackgroundLocationService.start(accessToken: access);
    ref.read(isTrackingProvider.notifier).state = ok;
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not start background tracking')),
      );
    }
  }
}

// -----------------------------------------------------------------------------

class _IdentityCard extends StatelessWidget {
  final Map<String, dynamic>? user;
  final WidgetRef ref;
  const _IdentityCard({required this.user, required this.ref});

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    final name = (user?['fullName'] ?? user?['name'] ?? '?') as String;
    final role = user?['role'] as String?;
    final initials = _initials(name);

    return Container(
      padding: const EdgeInsets.fromLTRB(18, 18, 14, 18),
      decoration: BoxDecoration(
        color: kNavy900,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.20),
            blurRadius: 18, offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56, height: 56,
            decoration: BoxDecoration(
              color: kMission500.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: kMission500.withValues(alpha: 0.30)),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.inter(
                color: kMission300,
                fontWeight: FontWeight.w800,
                fontSize: 20, letterSpacing: -0.3,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Hi, ${name.split(' ').first}',
                  style: GoogleFonts.inter(
                    color: kMission300, fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 17,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                    height: 1.25,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (role != null)
                  Text(
                    role,
                    style: GoogleFonts.inter(
                      color: kInk200, fontSize: 12.5, height: 1.4,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout_rounded, color: Colors.white),
            onPressed: () async {
              await BackgroundLocationService.stop();
              await ref.read(locationTrackerProvider).stop();
              ref.read(isTrackingProvider.notifier).state = false;
              await ref.read(authControllerProvider.notifier).logout();
            },
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _TrackingTile extends StatelessWidget {
  final bool tracking;
  final VoidCallback onToggle;
  const _TrackingTile({required this.tracking, required this.onToggle});

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
      onTap: onToggle,
      child: Row(
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: tracking
                  ? kSuccess600.withValues(alpha: 0.10)
                  : kInk100,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              tracking ? Icons.gps_fixed : Icons.gps_off,
              color: tracking ? kSuccess600 : kInk500,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tracking ? 'GPS tracking is on' : 'GPS tracking is off',
                  style: GoogleFonts.inter(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700,
                    color: kInk900,
                  ),
                ),
                Text(
                  tracking
                      ? 'Field movements are being recorded.'
                      : 'Tap to enable background location.',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500, height: 1.35),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Switch(
            value: tracking,
            activeThumbColor: kSuccess600,
            onChanged: (_) => onToggle(),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _GridSection extends StatelessWidget {
  final String title;
  final List<_Tile> tiles;
  const _GridSection({required this.title, required this.tiles});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 10),
          child: Text(
            title.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
              color: kInk500,
            ),
          ),
        ),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 10,
          crossAxisSpacing: 10,
          childAspectRatio: 1.5,
          children: [
            for (final t in tiles) _GridTile(tile: t),
          ],
        ),
      ],
    );
  }
}

class _GridTile extends StatelessWidget {
  final _Tile tile;
  const _GridTile({required this.tile});

  @override
  Widget build(BuildContext context) {
    return SoftCard(
      padding: const EdgeInsets.all(14),
      onTap: () => context.go(tile.route),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: tile.tone.withValues(alpha: 0.10),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(tile.icon, size: 20, color: tile.tone),
          ),
          Text(
            tile.label,
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: kInk900,
              height: 1.2,
            ),
          ),
        ],
      ),
    );
  }
}
