import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../app/swipe_action.dart';
import '../../services/api_client.dart';
import '../../services/api_response.dart';
import '../auth/auth_controller.dart';
import '../leaves/leave_repository.dart';
import '../punch/punch_repository.dart';

// =============================================================================
// HomeDashboardScreen — 2026 redesign.
//
//   1. Indigo hero — avatar, greeting, notification bell
//   2. "Mark Your Attendance" blue banner with a swipe-to-check-in slider
//      (or an on-duty status strip once the user has punched in)
//   3. Quick Actions — pastel tile grid
//   4. Alert card — pending approvals / notices
// =============================================================================

final _todayProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(punchRepoProvider).today(),
);

final _pendingApprovalsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.read(leaveRepoProvider).pending();
  } catch (_) {
    return const [];
  }
});

final _notificationsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  try {
    final dio = ref.watch(dioProvider);
    final res = await dio.get('/notifications', queryParameters: {'limit': 50});
    return extractMapList(res.data, const ['notifications']);
  } catch (_) {
    return const [];
  }
});

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(_todayProvider);
    final approvals = ref.watch(_pendingApprovalsProvider);
    final notifs = ref.watch(_notificationsProvider);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;

    final fullName = (user?['fullName'] ?? user?['name'] ?? 'Field Officer') as String;
    final firstName = fullName.split(' ').first;
    final initials = _initials(fullName);

    final punches = today.maybeWhen(
      data: (d) {
        final p = d['punches'];
        return p is List ? p : const [];
      },
      orElse: () => const [],
    );
    final clockIn = _firstTime(punches, 'IN');
    final clockOut = _firstTime(punches, 'OUT');
    final onDuty = clockIn != null && clockOut == null;

    final pendingCount = approvals.maybeWhen(
      data: (rows) => rows.length, orElse: () => 0);
    final notifCount = notifs.maybeWhen(
      data: (rows) => rows.where((r) => r['readAt'] == null).length,
      orElse: () => 0);

    return RefreshIndicator(
      color: kNavy700,
      backgroundColor: kSurfaceLight,
      onRefresh: () async {
        ref.invalidate(_todayProvider);
        ref.invalidate(_pendingApprovalsProvider);
        ref.invalidate(_notificationsProvider);
      },
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Hero(
            firstName: firstName,
            initials: initials,
            avatarUrl: user?['avatarUrl'] as String?,
            unread: notifCount,
            onBell: () => context.go('/notifications'),
          ),
          const SizedBox(height: 18),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _AttendanceBanner(
              onDuty: onDuty,
              clockIn: clockIn,
              onSwiped: () async {
                await context.push('/punch');
                ref.invalidate(_todayProvider);
              },
            ),
          ),
          const SizedBox(height: 22),
          const _SectionHeader(title: 'Quick Actions', actionLabel: 'View all', actionRoute: '/more'),
          const SizedBox(height: 12),
          const _QuickActionGrid(),
          const SizedBox(height: 20),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _AlertCard(pendingCount: pendingCount),
          ),
          const SizedBox(height: 28),
        ],
      ),
    );
  }

  static String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  static String? _firstTime(List punches, String type) {
    for (final p in punches) {
      if (p is Map && p['type']?.toString().toUpperCase() == type) {
        final ts = p['createdAt'] ?? p['punchedAt'] ?? p['time'];
        if (ts is String) {
          try {
            return DateFormat('h:mm a').format(DateTime.parse(ts).toLocal());
          } catch (_) {}
        }
      }
    }
    return null;
  }
}

// =============================================================================
// Hero — indigo gradient band, avatar + greeting + bell.
// =============================================================================

class _Hero extends StatelessWidget {
  final String firstName;
  final String initials;
  final String? avatarUrl;
  final int unread;
  final VoidCallback onBell;
  const _Hero({
    required this.firstName,
    required this.initials,
    required this.avatarUrl,
    required this.unread,
    required this.onBell,
  });

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, topPad + 20, 20, 30),
      decoration: const BoxDecoration(
        gradient: kBrandGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Row(
        children: [
          Avatar(
            imageUrl: avatarUrl,
            initials: initials,
            size: 48,
            background: Colors.white.withValues(alpha: 0.16),
            foreground: Colors.white,
            borderColor: Colors.white.withValues(alpha: 0.30),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Hi, $firstName',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    color: Colors.white.withValues(alpha: 0.78),
                    fontSize: 13, fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _greeting,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 23,
                    fontWeight: FontWeight.w800, letterSpacing: -0.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () { Haptics.light(); onBell(); },
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 44, height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.16),
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white.withValues(alpha: 0.24)),
                  ),
                  child: const Icon(Icons.notifications_none_rounded,
                      color: Colors.white, size: 21),
                ),
                if (unread > 0)
                  Positioned(
                    top: 0, right: 0,
                    child: Container(
                      width: 12, height: 12,
                      decoration: BoxDecoration(
                        color: kAmber500,
                        shape: BoxShape.circle,
                        border: Border.all(color: kNavy800, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Attendance banner — blue gradient card with swipe-to-check-in.
// =============================================================================

class _AttendanceBanner extends StatelessWidget {
  final bool onDuty;
  final String? clockIn;
  final Future<void> Function() onSwiped;
  const _AttendanceBanner({
    required this.onDuty,
    required this.clockIn,
    required this.onSwiped,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        gradient: kBlueBanner,
        borderRadius: BorderRadius.circular(22),
        boxShadow: glow(kNavy700, blur: 26, opacity: 0.32),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  onDuty ? Icons.verified_outlined : Icons.fingerprint,
                  color: Colors.white, size: 22,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      onDuty ? "You're on duty" : 'Mark Your Attendance',
                      style: GoogleFonts.inter(
                        color: Colors.white, fontSize: 16.5,
                        fontWeight: FontWeight.w800, letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      onDuty
                          ? 'Checked in at ${clockIn ?? '—'}'
                          : 'Log your start time & stay on track today.',
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 12, height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (onDuty)
            // Already punched in — show a static status strip + a tap target
            // to open the punch screen for break / check-out.
            Material(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(29),
              child: InkWell(
                borderRadius: BorderRadius.circular(29),
                onTap: () { Haptics.light(); onSwiped(); },
                child: Container(
                  height: 52,
                  alignment: Alignment.center,
                  child: Text(
                    'Open attendance  →',
                    style: GoogleFonts.inter(
                      color: Colors.white, fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            )
          else
            SwipeToConfirm(
              label: 'Swipe to check in',
              thumbIcon: Icons.fingerprint,
              onConfirmed: onSwiped,
            ),
        ],
      ),
    );
  }
}

// =============================================================================
// Section header — title + optional "View all" action.
// =============================================================================

class _SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final String? actionRoute;
  const _SectionHeader({required this.title, this.actionLabel, this.actionRoute});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 18),
      child: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 17, fontWeight: FontWeight.w800,
              color: kInk900, letterSpacing: -0.3,
            ),
          ),
          const Spacer(),
          if (actionLabel != null && actionRoute != null)
            GestureDetector(
              onTap: () { Haptics.light(); context.go(actionRoute!); },
              child: Text(
                actionLabel!,
                style: GoogleFonts.inter(
                  fontSize: 13, fontWeight: FontWeight.w700, color: kNavy700,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// =============================================================================
// Quick-action grid — pastel tinted tiles.
// =============================================================================

class _QuickActionGrid extends StatelessWidget {
  const _QuickActionGrid();

  @override
  Widget build(BuildContext context) {
    const tiles = <_Qa>[
      _Qa('Leave',      Icons.event_note_outlined,    '/leaves',     kKpiPurpleBg, kKpiPurpleInk),
      _Qa('Attendance', Icons.fingerprint,            '/punch',      kKpiSkyBg,    kKpiSkyInk),
      _Qa('Payslip',    Icons.account_balance_wallet_outlined, '/payslips', kKpiCreamBg, kKpiCreamInk),
      _Qa('Tasks',      Icons.check_box_outlined,     '/tasks',      kKpiMintBg,   kKpiMintInk),
      _Qa('Visits',     Icons.location_on_outlined,   '/visits',     kKpiPinkBg,   kKpiPinkInk),
      _Qa('Programmes', Icons.water_drop_outlined,    '/programmes', kKpiSkyBg,    kKpiSkyInk),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.96,
        children: [for (final t in tiles) _QaTile(t)],
      ),
    );
  }
}

class _Qa {
  final String label;
  final IconData icon;
  final String route;
  final Color tint;
  final Color ink;
  const _Qa(this.label, this.icon, this.route, this.tint, this.ink);
}

class _QaTile extends StatelessWidget {
  final _Qa qa;
  const _QaTile(this.qa);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: kSurfaceLight,
      borderRadius: BorderRadius.circular(20),
      child: InkWell(
        onTap: () { Haptics.select(); context.go(qa.route); },
        borderRadius: BorderRadius.circular(20),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: kBorderLight),
            boxShadow: [
              BoxShadow(
                color: kNavy900.withValues(alpha: 0.04),
                blurRadius: 12, offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 52, height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: qa.tint,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(qa.icon, color: qa.ink, size: 25),
              ),
              const SizedBox(height: 10),
              Text(
                qa.label,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 12, fontWeight: FontWeight.w700, color: kInk900,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Alert card — pending approvals nudge (peach/amber), or an all-clear note.
// =============================================================================

class _AlertCard extends StatelessWidget {
  final int pendingCount;
  const _AlertCard({required this.pendingCount});

  @override
  Widget build(BuildContext context) {
    final has = pendingCount > 0;
    return Material(
      color: has ? kAmber50 : kKpiMintBg,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: has ? () { Haptics.light(); context.go('/approvals'); } : null,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: (has ? kAmber500 : kKpiMintInk).withValues(alpha: 0.35),
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: (has ? kAmber500 : kKpiMintInk).withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  has ? Icons.fact_check_outlined : Icons.check_circle_outline,
                  color: has ? kAmber600 : kKpiMintInk, size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      has ? 'Approvals waiting' : "You're all caught up",
                      style: GoogleFonts.inter(
                        fontSize: 14.5, fontWeight: FontWeight.w800,
                        color: kInk900,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      has
                          ? '$pendingCount item${pendingCount == 1 ? '' : 's'} need your decision.'
                          : 'No pending approvals right now.',
                      style: GoogleFonts.inter(
                        fontSize: 12, color: kInk500, height: 1.35,
                      ),
                    ),
                  ],
                ),
              ),
              if (has)
                const Icon(Icons.chevron_right_rounded, color: kInk400),
            ],
          ),
        ),
      ),
    );
  }
}
