import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../auth/auth_controller.dart';
import '../leaves/leave_repository.dart';
import '../punch/punch_repository.dart';

// =============================================================================
// HomeDashboardScreen — light HR dashboard matching the supplied mockup.
//
// Layout:
//   1. Navy gradient hero (greeting, sub-title, bell, avatar)
//      + clock-in / clock-out pill row floating over the bottom edge
//   2. "Summary" — three pastel KPI cards (Missed / Pending Approval / New)
//   3. "Modules" — 6-tile grid (Punch, Tasks, Visits, Movements, Expenses,
//      Directory) with pastel-blue circular icon containers
// =============================================================================

final _todayProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(punchRepoProvider).today(),
);

final _myLeavesProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.read(leaveRepoProvider).mine();
  } catch (_) {
    return const [];
  }
});

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
    final raw = (res.data['data']?['notifications'] ??
            res.data['notifications'] ??
            res.data['data'] ??
            []) as List;
    return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
  } catch (_) {
    return const [];
  }
});

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(_todayProvider);
    final leaves = ref.watch(_myLeavesProvider);
    final approvals = ref.watch(_pendingApprovalsProvider);
    final notifs = ref.watch(_notificationsProvider);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;

    final fullName = (user?['fullName'] ?? user?['name'] ?? 'Field Officer') as String;
    final firstName = fullName.split(' ').first;
    final initials = _initials(fullName);

    final punches = today.maybeWhen(
      data: (d) => (d['punches'] as List?) ?? const [],
      orElse: () => const [],
    );
    final clockIn = _firstTime(punches, 'IN');
    final clockOut = _firstTime(punches, 'OUT');

    final missed = leaves.maybeWhen(
      data: (rows) => rows.where((r) => r['status'] == 'rejected').length,
      orElse: () => 0,
    );
    final pendingCount = approvals.maybeWhen(
      data: (rows) => rows.length,
      orElse: () => 0,
    );
    final notifCount = notifs.maybeWhen(
      data: (rows) => rows.where((r) => r['readAt'] == null).length,
      orElse: () => 0,
    );

    return RefreshIndicator(
      color: kAmber500,
      backgroundColor: kSurfaceLight,
      onRefresh: () async {
        ref.invalidate(_todayProvider);
        ref.invalidate(_myLeavesProvider);
        ref.invalidate(_pendingApprovalsProvider);
        ref.invalidate(_notificationsProvider);
      },
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _HeroHeader(
            firstName: firstName,
            initials: initials,
            unreadNotifs: notifCount,
            onBell: () => context.go('/notifications'),
          ),
          const SizedBox(height: 14),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: _ClockPill(
                    icon: Icons.login_rounded,
                    label: clockIn ?? '— : —',
                    sub: 'Clock in',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _ClockPill(
                    icon: Icons.logout_rounded,
                    label: clockOut ?? '— : —',
                    sub: 'Clock out',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // ----- Summary --------------------------------------------------
          const _SectionLabel(title: 'Summary'),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: Row(
              children: [
                Expanded(
                  child: _KpiCard(
                    icon: Icons.event_busy_outlined,
                    bg: kKpiPinkBg,
                    fg: kKpiPinkInk,
                    value: _two(missed),
                    label: 'Missed\nAttendance',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _KpiCard(
                    icon: Icons.fact_check_outlined,
                    bg: kKpiCreamBg,
                    fg: kKpiCreamInk,
                    value: _two(pendingCount),
                    label: 'Pending\nApproval',
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: _KpiCard(
                    icon: Icons.campaign_outlined,
                    bg: kKpiMintBg,
                    fg: kKpiMintInk,
                    value: _two(notifCount),
                    label: 'New\nNotices',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),

          // ----- Modules --------------------------------------------------
          const _SectionLabel(title: 'Modules'),
          const SizedBox(height: 8),
          const _ModulesGrid(),
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

  static String _two(int n) => n.toString().padLeft(2, '0');

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

// -----------------------------------------------------------------------------
// Hero header — navy gradient with greeting, bell, avatar, and floating
// "Clock-in / Clock-out" pill cards anchored on the bottom edge.
// -----------------------------------------------------------------------------

class _HeroHeader extends StatelessWidget {
  final String firstName;
  final String initials;
  final int unreadNotifs;
  final VoidCallback onBell;
  const _HeroHeader({
    required this.firstName,
    required this.initials,
    required this.unreadNotifs,
    required this.onBell,
  });

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, topPad + 18, 20, 22),
      decoration: const BoxDecoration(
        gradient: kBrandGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(28),
          bottomRight: Radius.circular(28),
        ),
      ),
      child: Row(
        children: [
              Container(
                width: 38, height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.menu_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Hi, $firstName!',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: Colors.white, fontSize: 18,
                        fontWeight: FontWeight.w800, letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      'Explore the dashboard',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: Colors.white.withValues(alpha: 0.70),
                        fontSize: 12, fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              GestureDetector(
                onTap: onBell,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Container(
                      width: 38, height: 38,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.10),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.notifications_none_rounded,
                          color: Colors.white, size: 20),
                    ),
                    if (unreadNotifs > 0)
                      Positioned(
                        top: -2, right: -2,
                        child: Container(
                          width: 10, height: 10,
                          decoration: BoxDecoration(
                            color: kAmber500,
                            shape: BoxShape.circle,
                            border: Border.all(color: kNavy900, width: 1.5),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                width: 38, height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kAmber500,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  initials,
                  style: GoogleFonts.inter(
                    color: kNavy900, fontSize: 13, fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        );
  }
}

class _ClockPill extends StatelessWidget {
  final IconData icon;
  final String label;
  final String sub;
  const _ClockPill({required this.icon, required this.label, required this.sub});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: kSurfaceLight,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.10),
            blurRadius: 18, offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 30, height: 30,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: kKpiSkyBg,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 16, color: kKpiSkyInk),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 13.5, fontWeight: FontWeight.w800,
                    color: kInk900,
                  ),
                ),
                Text(
                  sub,
                  style: GoogleFonts.inter(
                    fontSize: 10.5, fontWeight: FontWeight.w600,
                    color: kInk500, letterSpacing: 0.2,
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

// -----------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  final String title;
  const _SectionLabel({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
      child: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16, fontWeight: FontWeight.w800,
              color: kInk900, letterSpacing: -0.2,
            ),
          ),
          const Spacer(),
          Icon(Icons.tune_rounded, size: 16, color: kInk400),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _KpiCard extends StatelessWidget {
  final IconData icon;
  final Color bg;
  final Color fg;
  final String value;
  final String label;
  const _KpiCard({
    required this.icon,
    required this.bg,
    required this.fg,
    required this.value,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 14),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 28, height: 28,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kSurfaceLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: fg),
              ),
              const Spacer(),
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 22, fontWeight: FontWeight.w900,
                  color: fg, letterSpacing: -0.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            label,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11.5, fontWeight: FontWeight.w700,
              color: kInk900, height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// Module grid — 6 tiles with pastel-blue circular icon container + label.
// -----------------------------------------------------------------------------

class _ModulesGrid extends StatelessWidget {
  const _ModulesGrid();

  @override
  Widget build(BuildContext context) {
    final modules = const [
      _ModuleTile('Break Time', Icons.coffee_outlined,           '/punch'),
      _ModuleTile('Task',       Icons.check_box_outlined,        '/tasks'),
      _ModuleTile('Check\nIn/Out', Icons.qr_code_scanner_rounded,'/punch'),
      _ModuleTile('Claim',      Icons.payments_outlined,         '/expenses'),
      _ModuleTile('Visits',     Icons.location_on_outlined,      '/visits'),
      _ModuleTile('Approvals',  Icons.fact_check_outlined,       '/approvals'),
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.count(
        crossAxisCount: 3,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.92,
        children: [for (final m in modules) m],
      ),
    );
  }
}

class _ModuleTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final String route;
  const _ModuleTile(this.label, this.icon, this.route);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: kSurfaceLight,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: () { Haptics.select(); context.go(route); },
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
          decoration: BoxDecoration(
            color: kSurfaceLight,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: kBorderLight),
            boxShadow: [
              BoxShadow(
                color: kNavy900.withValues(alpha: 0.04),
                blurRadius: 14, offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 46, height: 46,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kKpiSkyBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 22, color: kNavy900),
              ),
              const SizedBox(height: 10),
              Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 12, fontWeight: FontWeight.w700,
                  color: kInk900, height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
