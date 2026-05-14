import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../auth/auth_controller.dart';
import '../punch/punch_repository.dart';

// =============================================================================
// AttendanceScreen — light HR Attendance hub matching the mockup.
//   1. Navy hero (greeting + bell + avatar)
//   2. "Weekly Attendance" card — donut with center label + colored legend
//   3. "Attendance" tile grid (My / View / Movements / Fuel / Visits / Punch QR)
// =============================================================================

final _myPunchesProvider = FutureProvider.autoDispose<List>(
  (ref) async {
    try {
      return await ref.watch(punchRepoProvider).myRecent();
    } catch (_) {
      return const [];
    }
  },
);

// Weekly hours per the 45h + 1h auto-lunch rule. Falls back to an empty
// shape so the card renders zeros instead of an error if SMTP is down /
// the user has no punches yet.
final _weeklyHoursProvider = FutureProvider.autoDispose<Map<String, dynamic>>(
  (ref) async {
    try {
      return await ref.watch(punchRepoProvider).weeklyHours();
    } catch (_) {
      return const { 'totalHours': 0, 'targetHours': 45, 'balance': -45, 'daily': [] };
    }
  },
);

class AttendanceScreen extends ConsumerWidget {
  const AttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authControllerProvider).valueOrNull?.user;
    final punches = ref.watch(_myPunchesProvider);

    final fullName = (user?['fullName'] ?? user?['name'] ?? 'Field Officer') as String;
    final firstName = fullName.split(' ').first;
    final initials = _initials(fullName);

    final week = punches.maybeWhen(
      data: (rows) => _summarizeWeek(rows),
      orElse: () => _emptyWeek(),
    );
    final weeklyHours = ref.watch(_weeklyHoursProvider);

    return RefreshIndicator(
      color: kAmber500,
      backgroundColor: kSurfaceLight,
      onRefresh: () async {
        ref.invalidate(_myPunchesProvider);
        ref.invalidate(_weeklyHoursProvider);
      },
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Hero(
            firstName: firstName,
            initials: initials,
            onBell: () => context.go('/notifications'),
          ),
          const SizedBox(height: 20),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: _WeeklyAttendanceCard(week: week),
          ),
          const SizedBox(height: 14),

          // Net work hours toward the 45h weekly target. Pure pulled-data
          // card — server applies the 1h auto lunch and the BreakIn/Out
          // deductions, so the totals here match what HR will see.
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: weeklyHours.maybeWhen(
              data: (d) => _WeeklyHoursCard(data: d),
              orElse: () => _WeeklyHoursCard.skeleton(),
            ),
          ),
          const SizedBox(height: 22),

          const _SectionLabel(title: 'Attendance'),
          const SizedBox(height: 8),
          const _AttendanceGrid(),
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

  static Map<String, int> _emptyWeek() => {
        'present': 0, 'exDelay': 0, 'absent': 0, 'leave': 0,
        'visit':   0, 'weekend': 0, 'delay':  0, 'holiday': 0,
      };

  static Map<String, int> _summarizeWeek(List rows) {
    // Synthesize a 7-day window from the user's recent punches.
    final now = DateTime.now();
    final start = DateTime(now.year, now.month, now.day).subtract(const Duration(days: 6));
    final byDay = <DateTime, List>{};
    for (final r in rows) {
      if (r is! Map) continue;
      final ts = r['createdAt'] ?? r['punchedAt'];
      if (ts is! String) continue;
      try {
        final t = DateTime.parse(ts).toLocal();
        final d = DateTime(t.year, t.month, t.day);
        if (d.isBefore(start)) continue;
        byDay.putIfAbsent(d, () => []).add(r);
      } catch (_) {}
    }
    int present = 0, weekend = 0, absent = 0;
    for (var i = 0; i < 7; i++) {
      final d = start.add(Duration(days: i));
      final isWeekend = d.weekday == DateTime.saturday || d.weekday == DateTime.sunday;
      final hits = byDay[d] ?? const [];
      if (isWeekend) {
        weekend++;
      } else if (hits.isNotEmpty) {
        present++;
      } else {
        absent++;
      }
    }
    return {
      'present': present, 'exDelay': 0, 'absent': absent, 'leave': 0,
      'visit':   0, 'weekend': weekend, 'delay':  0, 'holiday': 0,
    };
  }
}

// -----------------------------------------------------------------------------
// Hero — navy gradient header
// -----------------------------------------------------------------------------

class _Hero extends StatelessWidget {
  final String firstName;
  final String initials;
  final VoidCallback onBell;
  const _Hero({required this.firstName, required this.initials, required this.onBell});

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
                  style: GoogleFonts.inter(
                    color: Colors.white.withValues(alpha: 0.70),
                    fontSize: 12, fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onBell,
            child: Container(
              width: 38, height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.notifications_none_rounded,
                  color: Colors.white, size: 20),
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

// -----------------------------------------------------------------------------
// Weekly attendance donut card with legend.
// -----------------------------------------------------------------------------

class _WeeklyAttendanceCard extends StatelessWidget {
  final Map<String, int> week;
  const _WeeklyAttendanceCard({required this.week});

  @override
  Widget build(BuildContext context) {
    final today = DateFormat('d/M/yyyy').format(DateTime.now());
    final present = week['present'] ?? 0;
    final segments = <_DonutSeg>[
      _DonutSeg('Present',   week['present'] ?? 0, kDotPresent),
      _DonutSeg('Ex. Delay', week['exDelay'] ?? 0, kDotExDelay),
      _DonutSeg('Absent',    week['absent']  ?? 0, kDotAbsent),
      _DonutSeg('Leave',     week['leave']   ?? 0, kDotLeave),
      _DonutSeg('Visit',     week['visit']   ?? 0, kDotVisit),
      _DonutSeg('Weekend',   week['weekend'] ?? 0, kDotWeekend),
      _DonutSeg('Delay',     week['delay']   ?? 0, kDotDelay),
      _DonutSeg('Holiday',   week['holiday'] ?? 0, kDotHoliday),
    ];
    final total = segments.fold<int>(0, (s, e) => s + e.value);
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(16, 16, 14, 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Weekly Attendance',
            style: GoogleFonts.inter(
              fontSize: 15, fontWeight: FontWeight.w800,
              color: kInk900, letterSpacing: -0.2,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            children: [
              SizedBox(
                width: 130, height: 130,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    PieChart(PieChartData(
                      sectionsSpace: 1.5,
                      centerSpaceRadius: 38,
                      startDegreeOffset: -90,
                      sections: total == 0
                          ? [
                              PieChartSectionData(
                                value: 1,
                                color: kInk100,
                                radius: 22,
                                showTitle: false,
                              )
                            ]
                          : [
                              for (final s in segments)
                                if (s.value > 0)
                                  PieChartSectionData(
                                    value: s.value.toDouble(),
                                    color: s.color,
                                    radius: 22,
                                    showTitle: false,
                                  ),
                            ],
                    )),
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Present',
                          style: GoogleFonts.inter(
                            fontSize: 13, fontWeight: FontWeight.w800,
                            color: kInk900, letterSpacing: -0.2,
                          ),
                        ),
                        Text(
                          '$present/$today',
                          style: GoogleFonts.inter(
                            fontSize: 9.5, fontWeight: FontWeight.w600,
                            color: kInk500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final s in segments)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 2),
                        child: Row(
                          children: [
                            Container(
                              width: 9, height: 9,
                              decoration: BoxDecoration(
                                color: s.color, shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: 7),
                            Text(
                              s.label,
                              style: GoogleFonts.inter(
                                fontSize: 11.5, fontWeight: FontWeight.w600,
                                color: kInk700,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DonutSeg {
  final String label;
  final int value;
  final Color color;
  const _DonutSeg(this.label, this.value, this.color);
}

// -----------------------------------------------------------------------------

class _SectionLabel extends StatelessWidget {
  final String title;
  const _SectionLabel({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 16, fontWeight: FontWeight.w800,
              color: kInk900, letterSpacing: -0.2,
            ),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// 6-tile attendance module grid
// -----------------------------------------------------------------------------

class _AttendanceGrid extends StatelessWidget {
  const _AttendanceGrid();

  @override
  Widget build(BuildContext context) {
    final tiles = const [
      _AttTile('My\nAttendance',   Icons.person_outline,            '/punch'),
      _AttTile('Punch\nIn / Out',  Icons.qr_code_scanner_rounded,   '/punch'),
      _AttTile('Movements',        Icons.directions_car_outlined,   '/movements'),
      _AttTile('Fuel\nClaims',     Icons.local_gas_station_outlined,'/fuel-claims'),
      _AttTile('Visits',           Icons.location_on_outlined,      '/visits'),
      _AttTile('Approvals',        Icons.fact_check_outlined,       '/approvals'),
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
        children: [for (final t in tiles) t],
      ),
    );
  }
}

class _AttTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final String route;
  const _AttTile(this.label, this.icon, this.route);

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
                decoration: const BoxDecoration(
                  color: kKpiSkyBg, shape: BoxShape.circle,
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

// -----------------------------------------------------------------------------
// _WeeklyHoursCard — net work hours toward the 45h weekly target. Shows a
// progress bar with the totals overlay, plus a 7-day strip so the staff
// member can see which days are short / OT.
// -----------------------------------------------------------------------------
class _WeeklyHoursCard extends StatelessWidget {
  final Map<String, dynamic> data;
  const _WeeklyHoursCard({required this.data});

  factory _WeeklyHoursCard.skeleton() => const _WeeklyHoursCard(data: {
    'totalHours': 0, 'targetHours': 45, 'balance': -45, 'daily': []
  });

  @override
  Widget build(BuildContext context) {
    final total  = (data['totalHours']  ?? 0).toDouble();
    final target = (data['targetHours'] ?? 45).toDouble();
    final balance = total - target;
    final pct = target > 0 ? (total / target).clamp(0.0, 1.2) : 0.0;
    final isOver  = total > target;
    final daily   = data['daily'] is List ? (data['daily'] as List) : const [];

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('Hours This Week',
                  style: GoogleFonts.inter(fontSize: 14.5, fontWeight: FontWeight.w700, color: kInk900)),
              const Spacer(),
              Text(
                isOver
                    ? '+${balance.toStringAsFixed(1)}h overtime'
                    : '${(-balance).toStringAsFixed(1)}h to target',
                style: GoogleFonts.inter(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: isOver ? kSuccess600 : kInk500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          // Progress bar with target line at 45h.
          Stack(
            children: [
              Container(
                height: 12,
                decoration: BoxDecoration(
                  color: kInk100,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              FractionallySizedBox(
                widthFactor: pct.clamp(0.0, 1.0),
                child: Container(
                  height: 12,
                  decoration: BoxDecoration(
                    color: isOver ? kSuccess600 : kNavy900,
                    borderRadius: BorderRadius.circular(6),
                  ),
                ),
              ),
              if (pct > 1.0)
                Positioned(
                  left: MediaQuery.of(context).size.width * 0.0,
                  child: const SizedBox.shrink(),
                ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${total.toStringAsFixed(1)}h worked / ${target.toStringAsFixed(0)}h target  •  1h lunch auto-deducted past 5h',
            style: GoogleFonts.inter(fontSize: 10.5, color: kInk500),
          ),
          if (daily.isNotEmpty) ...[
            const SizedBox(height: 10),
            Row(children: daily.map<Widget>((d) {
              final dStr = (d is Map ? d['date'] : '').toString();
              final h = (d is Map ? (d['netHours'] ?? 0) : 0).toDouble();
              final missing = d is Map ? d['missing'] : null;
              final dayChar = dStr.length >= 10
                  ? _weekdayChar(DateTime.tryParse(dStr))
                  : '';
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 1.5),
                  child: Column(
                    children: [
                      Text(dayChar,
                          style: GoogleFonts.inter(fontSize: 10, color: kInk500)),
                      const SizedBox(height: 4),
                      Container(
                        height: 28,
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          height: (h / 10 * 28).clamp(2, 28).toDouble(),
                          decoration: BoxDecoration(
                            color: missing != null ? kDanger600.withValues(alpha: 0.35)
                                                    : kNavy900,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        missing == null ? h.toStringAsFixed(1) : '!',
                        style: GoogleFonts.inter(
                          fontSize: 9,
                          color: missing != null ? kDanger600 : kInk500,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }).toList()),
          ],
        ],
      ),
    );
  }

  static String _weekdayChar(DateTime? d) {
    if (d == null) return '';
    return const ['M', 'T', 'W', 'T', 'F', 'S', 'S'][d.weekday - 1];
  }
}
