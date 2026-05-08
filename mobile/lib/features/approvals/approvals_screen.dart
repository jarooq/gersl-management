import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../advances/advance_repository.dart';
import '../auth/auth_controller.dart';
import '../expenses/expense_repository.dart';
import '../leaves/leave_repository.dart';

// Replaces the hard-coded role allowlist with a permission-based check on the
// user's permissions list. Mirrors the admin-web `hasPermission(...)` model.
const _approverPermissions = <String>[
  'hr:approve_leave',
  'hr:manager_approve_leave',
  'finance:approve_expense',
  'finance:manager_approve',
  'hr:salary_advance_approve',
];

bool _canApprove(Map<String, dynamic>? user) {
  if (user == null) return false;
  // Wildcard super-admin
  final perms = user['permissions'];
  if (perms is List) {
    final keys = perms.map((p) => p is Map ? p['permissionKey']?.toString() : p.toString()).toSet();
    if (keys.contains('*')) return true;
    for (final p in _approverPermissions) {
      if (keys.contains(p)) return true;
    }
  }
  // Fallback: legacy role allowlist (until every deployment has the new permissions seeded)
  const fallback = {
    'Admin', 'CEO', 'HR Manager', 'HR Officer',
    'Finance Manager', 'Programme Manager', 'Manager',
  };
  return fallback.contains(user['role']);
}

final _pendingLeavesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(leaveRepoProvider).pending(),
);
final _pendingAdvancesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) async => ref.watch(advanceRepoProvider).list(status: 'Pending'),
);
final _pendingExpensesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(expenseRepoProvider).pending(),
);

class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(authControllerProvider).value?.user;
    if (!_canApprove(me)) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(
          child: EmptyState(
            title: 'Approvals queue',
            message: 'This view is for managers, HR and Finance staff only.',
            icon: Icons.lock_outline,
          ),
        ),
      );
    }
    final leaves = ref.watch(_pendingLeavesProvider);
    final advances = ref.watch(_pendingAdvancesProvider);
    final expenses = ref.watch(_pendingExpensesProvider);

    Future<void> refreshAll() async {
      ref.invalidate(_pendingLeavesProvider);
      ref.invalidate(_pendingAdvancesProvider);
      ref.invalidate(_pendingExpensesProvider);
    }

    return RefreshIndicator(
      color: kNavy900,
      onRefresh: refreshAll,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _Section(
            title: 'Leave requests',
            count: leaves.maybeWhen(data: (d) => d.length, orElse: () => null),
          ),
          leaves.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => ErrorBox(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending leave requests.')
                : Column(children: [
                    for (final r in rows)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _LeaveTile(
                          row: r,
                          onDecide: (approve) async {
                            await ref.read(leaveRepoProvider).decide(r['id'] as int, approve: approve);
                            await refreshAll();
                          },
                        ),
                      ),
                  ]),
          ),
          const SizedBox(height: 18),
          _Section(
            title: 'Salary advances',
            count: advances.maybeWhen(data: (d) => d.length, orElse: () => null),
          ),
          advances.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => ErrorBox(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending advances.')
                : Column(children: [
                    for (final r in rows)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _AdvanceTile(
                          row: r,
                          onDecide: (approve) async {
                            await ref.read(advanceRepoProvider).decide(r['id'] as int, approve: approve);
                            await refreshAll();
                          },
                        ),
                      ),
                  ]),
          ),
          const SizedBox(height: 18),
          _Section(
            title: 'Expense claims',
            count: expenses.maybeWhen(data: (d) => d.length, orElse: () => null),
          ),
          expenses.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => ErrorBox(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending expense claims.')
                : Column(children: [
                    for (final r in rows)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _ExpenseTile(
                          row: r,
                          onDecide: (approve) async {
                            await ref.read(expenseRepoProvider).decide(r['id'] as int, approve: approve);
                            await refreshAll();
                          },
                        ),
                      ),
                  ]),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final int? count;
  const _Section({required this.title, this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, top: 4, bottom: 10),
      child: Row(
        children: [
          Text(
            title.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.0,
              color: kInk500,
            ),
          ),
          const SizedBox(width: 8),
          if (count != null && count! > 0)
            StatusPill(label: '$count pending', color: kWarn600),
        ],
      ),
    );
  }
}

class _LoadingTile extends StatelessWidget {
  const _LoadingTile();
  @override
  Widget build(BuildContext context) => const SoftCard(
        padding: EdgeInsets.all(20),
        child: Center(child: CircularProgressIndicator(color: kNavy900)),
      );
}

class _EmptyTile extends StatelessWidget {
  final String text;
  const _EmptyTile({required this.text});
  @override
  Widget build(BuildContext context) => SoftCard(
        child: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: kSuccess600, size: 18),
            const SizedBox(width: 8),
            Text(
              text,
              style: GoogleFonts.inter(fontSize: 13, color: kInk500),
            ),
          ],
        ),
      );
}

class _DecideButtons extends StatelessWidget {
  final Future<void> Function(bool approve) onDecide;
  const _DecideButtons({required this.onDecide});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: () { Haptics.medium(); onDecide(false); },
            style: OutlinedButton.styleFrom(
              foregroundColor: kDanger600,
              minimumSize: const Size(0, 38),
              side: const BorderSide(color: kInk200, width: 1.2),
            ),
            child: const Text('Reject'),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: FilledButton(
            onPressed: () { Haptics.medium(); onDecide(true); },
            style: FilledButton.styleFrom(
              backgroundColor: kSuccess600,
              foregroundColor: Colors.white,
              minimumSize: const Size(0, 38),
            ),
            child: const Text('Approve'),
          ),
        ),
      ],
    );
  }
}

class _LeaveTile extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function(bool approve) onDecide;
  const _LeaveTile({required this.row, required this.onDecide});

  String _fmt(String? d) {
    if (d == null) return '';
    try { return DateFormat('d MMM').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }

  @override
  Widget build(BuildContext context) {
    final r = row['requester'] as Map?;
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            r?['fullName']?.toString() ?? 'Staff #${row['userId']}',
            style: GoogleFonts.inter(
              fontSize: 14, fontWeight: FontWeight.w700, color: kInk900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${row['leaveType']}  ·  ${_fmt(row['startDate']?.toString())} → ${_fmt(row['endDate']?.toString())}  ·  ${row['daysCount']} days',
            style: GoogleFonts.inter(fontSize: 12, color: kInk500),
          ),
          if (row['reason'] != null) ...[
            const SizedBox(height: 6),
            Text(
              row['reason'].toString(),
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          _DecideButtons(onDecide: onDecide),
        ],
      ),
    );
  }
}

class _ExpenseTile extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function(bool approve) onDecide;
  const _ExpenseTile({required this.row, required this.onDecide});

  @override
  Widget build(BuildContext context) {
    final submitter = row['submitter'] as Map?;
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  submitter?['fullName']?.toString() ?? 'Staff #${row['submittedBy']}',
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700, color: kInk900,
                  ),
                ),
              ),
              Text(
                'LKR ${row['amount']}',
                style: GoogleFonts.inter(
                  fontSize: 14.5, fontWeight: FontWeight.w800, color: kInk900,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            '${row['category']}  ·  ${row['date']}',
            style: GoogleFonts.inter(fontSize: 12, color: kInk500),
          ),
          if (row['description'] != null) ...[
            const SizedBox(height: 6),
            Text(
              row['description'].toString(),
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
            ),
          ],
          if (row['receiptUrl'] != null) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.attach_file, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text('Receipt attached',
                    style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
              ],
            ),
          ],
          const SizedBox(height: 12),
          _DecideButtons(onDecide: onDecide),
        ],
      ),
    );
  }
}

class _AdvanceTile extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function(bool approve) onDecide;
  const _AdvanceTile({required this.row, required this.onDecide});

  @override
  Widget build(BuildContext context) {
    final user = row['user'] as Map?;
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            user?['fullName']?.toString() ?? 'Staff #${row['userId']}',
            style: GoogleFonts.inter(
              fontSize: 14, fontWeight: FontWeight.w700, color: kInk900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'LKR ${row['amount']}',
            style: GoogleFonts.inter(
              fontSize: 18, fontWeight: FontWeight.w800,
              color: kInk900, letterSpacing: -0.3,
            ),
          ),
          if (row['reason'] != null) ...[
            const SizedBox(height: 6),
            Text(
              row['reason'].toString(),
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
            ),
          ],
          const SizedBox(height: 12),
          _DecideButtons(onDecide: onDecide),
        ],
      ),
    );
  }
}
