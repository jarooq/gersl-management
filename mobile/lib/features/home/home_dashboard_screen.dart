import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../auth/auth_controller.dart';
import '../leaves/leave_repository.dart';
import '../punch/punch_repository.dart';
import '../tasks/my_tasks_screen.dart';

// =============================================================================
// HomeDashboardScreen — dark theme dashboard inspired by the reference design.
// Sections:
//   1. Header — avatar + name/role + GPS toggle bell
//   2. Overview header + "See all"
//   3. Featured lime-green card — three-column KPI strip (Today Punches /
//      Presence / Late). Punch IN button anchored at the bottom right.
//   4. Two large tiles — Total Tasks (mission-amber) + Pending Leaves
//   5. "Upcoming items" header + "See all"
//   6. Date-chipped task cards
// =============================================================================

final _todayProvider = FutureProvider.autoDispose(
  (ref) => ref.watch(punchRepoProvider).today(),
);

final _myTasksProviderHome =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.read(myTasksProvider.future);
  } catch (_) {
    return [];
  }
});

final _myLeavesProviderHome =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  try {
    return await ref.read(leaveRepoProvider).mine();
  } catch (_) {
    return [];
  }
});

class HomeDashboardScreen extends ConsumerWidget {
  const HomeDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final today = ref.watch(_todayProvider);
    final tasks = ref.watch(_myTasksProviderHome);
    final leaves = ref.watch(_myLeavesProviderHome);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;

    final fullName = (user?['fullName'] ?? user?['name'] ?? 'Field Officer') as String;
    final firstName = fullName.split(' ').first;
    final role = user?['role']?.toString() ?? 'Staff';

    return RefreshIndicator(
      color: kLime500,
      backgroundColor: kSurfaceCardDk,
      onRefresh: () async {
        ref.invalidate(_todayProvider);
        ref.invalidate(_myTasksProviderHome);
        ref.invalidate(_myLeavesProviderHome);
      },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
        children: [
          _Header(name: firstName, role: role, fullName: fullName),
          const SizedBox(height: 18),

          // Overview header
          Row(
            children: [
              Text('Overview',
                style: GoogleFonts.inter(
                  fontSize: 20, fontWeight: FontWeight.w800, color: kTextDk,
                  letterSpacing: -0.3,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => context.go('/today'),
                child: Text('See all',
                  style: GoogleFonts.inter(
                    fontSize: 13, fontWeight: FontWeight.w600,
                    color: kTextDkMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Featured lime-green KPI strip
          today.when(
            loading: () => const SkeletonBox(height: 110, radius: 22),
            error: (_, _) => const _OverviewCard(present: 0, today: 0, late: 0),
            data: (d) => _OverviewCard(
              present:    d['isClockedIn'] == true ? 1 : 0,
              today:      (d['punches'] as List? ?? []).length,
              late:       0,
            ),
          ),
          const SizedBox(height: 12),

          // Two larger feature tiles
          Row(
            children: [
              Expanded(
                child: _FeatureTile(
                  icon: Icons.task_alt,
                  iconBg: const Color(0xFF18374C),
                  iconFg: kLime500,
                  title: tasks.maybeWhen(
                    data: (rows) => '${rows.length}',
                    orElse: () => '—',
                  ),
                  caption: 'My tasks',
                  onTap: () => context.go('/tasks'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _FeatureTile(
                  icon: Icons.event_available,
                  iconBg: const Color(0xFF3A2638),
                  iconFg: kPillPink,
                  title: leaves.maybeWhen(
                    data: (rows) => '${rows.where((r) => r['status'] == 'Pending').length}',
                    orElse: () => '—',
                  ),
                  caption: 'Pending leaves',
                  onTap: () => context.go('/more'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),

          // Upcoming items header
          Row(
            children: [
              Text('Upcoming tasks',
                style: GoogleFonts.inter(
                  fontSize: 18, fontWeight: FontWeight.w800, color: kTextDk,
                  letterSpacing: -0.3,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: () => context.go('/tasks'),
                child: Text('See all',
                  style: GoogleFonts.inter(
                    fontSize: 13, fontWeight: FontWeight.w600,
                    color: kTextDkMuted,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Tasks as date-chip cards
          tasks.when(
            loading: () => Column(
              children: const [
                SkeletonBox(height: 86, radius: 18),
                SizedBox(height: 8),
                SkeletonBox(height: 86, radius: 18),
              ],
            ),
            error: (e, _) => ErrorBox(message: e.toString()),
            data: (rows) {
              if (rows.isEmpty) {
                return const EmptyState(
                  title: 'No upcoming tasks',
                  message: 'When tasks are assigned to you, they\'ll appear here.',
                  icon: Icons.checklist_outlined,
                );
              }
              final upcoming = rows.take(4).toList();
              return Column(
                children: [
                  for (final t in upcoming) ...[
                    _UpcomingTaskCard(task: t, onTap: () => context.go('/tasks')),
                    const SizedBox(height: 8),
                  ],
                ],
              );
            },
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------

class _Header extends StatelessWidget {
  final String name;
  final String role;
  final String fullName;
  const _Header({required this.name, required this.role, required this.fullName});

  String _initials(String n) {
    final parts = n.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: kSurfaceCardDk,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: kBorderDk),
          ),
          alignment: Alignment.center,
          child: Text(
            _initials(fullName),
            style: GoogleFonts.inter(
              color: kLime500, fontWeight: FontWeight.w800, fontSize: 16,
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: GoogleFonts.inter(
                  color: kTextDk, fontSize: 16,
                  fontWeight: FontWeight.w800, height: 1.1,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                role,
                style: GoogleFonts.inter(
                  color: kTextDkMuted, fontSize: 12.5,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// -----------------------------------------------------------------------------
// Overview card — lime green featured strip with three KPIs.

class _OverviewCard extends StatelessWidget {
  final int present;
  final int today;
  final int late;
  const _OverviewCard({
    required this.present,
    required this.today,
    required this.late,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFB7F25C), Color(0xFF7BD63B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: kLime500.withValues(alpha: 0.20),
            blurRadius: 20, offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          _OverviewMetric(
            label: 'Presence',
            value: '$present',
          ),
          _OverviewDivider(),
          _OverviewMetric(
            label: 'Punches',
            value: '$today',
          ),
          _OverviewDivider(),
          _OverviewMetric(
            label: 'Late',
            value: late == 0 ? '0h' : '${late}h',
          ),
        ],
      ),
    );
  }
}

class _OverviewMetric extends StatelessWidget {
  final String label;
  final String value;
  const _OverviewMetric({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12, color: const Color(0xFF15411D),
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.inter(
              fontSize: 24, fontWeight: FontWeight.w800,
              color: const Color(0xFF0E2C13), letterSpacing: -0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _OverviewDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: 1, height: 40,
      color: const Color(0xFF15411D).withValues(alpha: 0.18),
    );
  }
}

// -----------------------------------------------------------------------------
// Feature tile — large dark card with icon-bg + value + caption.

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconFg;
  final String title;
  final String caption;
  final VoidCallback onTap;

  const _FeatureTile({
    required this.icon,
    required this.iconBg,
    required this.iconFg,
    required this.title,
    required this.caption,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: kSurfaceCardDk,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: kBorderDk),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(14),
                ),
                alignment: Alignment.center,
                child: Icon(icon, color: iconFg, size: 22),
              ),
              const SizedBox(height: 14),
              Text(
                title,
                style: GoogleFonts.inter(
                  fontSize: 28, fontWeight: FontWeight.w800,
                  color: kTextDk, letterSpacing: -0.6, height: 1.0,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                caption,
                style: GoogleFonts.inter(
                  fontSize: 12.5, color: kTextDkMuted,
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
// Date-chip task card — left date stack + title + time + Get Details link.

class _UpcomingTaskCard extends StatelessWidget {
  final Map<String, dynamic> task;
  final VoidCallback onTap;
  const _UpcomingTaskCard({required this.task, required this.onTap});

  ({String day, String month}) _date() {
    final raw = task['dueDate']?.toString() ?? task['date']?.toString();
    if (raw != null) {
      try {
        final d = DateTime.parse(raw).toLocal();
        return (
          day: DateFormat('d').format(d),
          month: DateFormat('MMM').format(d),
        );
      } catch (_) {}
    }
    return (day: '—', month: '');
  }

  @override
  Widget build(BuildContext context) {
    final d = _date();
    final priority = task['priority']?.toString() ?? '';
    final priorityTone = priority == 'Urgent' ? kDanger600
                       : priority == 'High'   ? kPillPink
                       : priority == 'Medium' ? kPillSky
                       : kPillPurple;

    return Material(
      color: kSurfaceCardDk,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        borderRadius: BorderRadius.circular(22),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.fromLTRB(14, 14, 16, 14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(22),
            border: Border.all(color: kBorderDk),
          ),
          child: Row(
            children: [
              // Date stack
              Container(
                width: 48, height: 56,
                decoration: BoxDecoration(
                  color: kSurfaceLiftDk,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(d.day,
                      style: GoogleFonts.inter(
                        fontSize: 18, fontWeight: FontWeight.w800,
                        color: kTextDk, height: 1.0,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(d.month,
                      style: GoogleFonts.inter(
                        fontSize: 10, color: kTextDkMuted,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task['title']?.toString() ?? 'Task',
                      style: GoogleFonts.inter(
                        fontSize: 14, fontWeight: FontWeight.w800,
                        color: kTextDk, letterSpacing: -0.2, height: 1.2,
                      ),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        if (priority.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: priorityTone.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(999),
                            ),
                            child: Text(priority,
                              style: GoogleFonts.inter(
                                fontSize: 10, fontWeight: FontWeight.w800,
                                color: priorityTone,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                        if (priority.isNotEmpty) const SizedBox(width: 8),
                        Text(
                          (task['project']?['projectName'] ??
                            task['project']?['name'] ?? '—').toString(),
                          style: GoogleFonts.inter(
                            fontSize: 11.5, color: kTextDkMuted,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text('Get Details',
                      style: GoogleFonts.inter(
                        fontSize: 11.5, fontWeight: FontWeight.w700,
                        color: kLime500,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
