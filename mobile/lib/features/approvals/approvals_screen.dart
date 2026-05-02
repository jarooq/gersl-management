import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../advances/advance_repository.dart';
import '../auth/auth_controller.dart';
import '../expenses/expense_repository.dart';
import '../leaves/leave_repository.dart';

const _approverRoles = {
  'Admin', 'CEO', 'HR Manager', 'HR Officer',
  'Finance Manager', 'Programme Manager', 'Manager'
};

// Small wrapper providers so a single Approvals screen can refresh all three
// underlying lists with one swipe-down.
final _pendingLeavesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(leaveRepoProvider).pending(),
);
final _pendingAdvancesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) async {
    final all = await ref.watch(advanceRepoProvider).list(status: 'Pending');
    return all;
  },
);
final _pendingExpensesProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(expenseRepoProvider).pending(),
);

class ApprovalsScreen extends ConsumerWidget {
  const ApprovalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final me = ref.watch(authControllerProvider).value?.user;
    if (!_approverRoles.contains(me?['role'])) {
      return const Padding(
        padding: EdgeInsets.all(24),
        child: Center(child: Text('Approvals queue is visible only to managers / HR / Finance.')),
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
      onRefresh: refreshAll,
      child: ListView(
        padding: const EdgeInsets.all(12),
        children: [
          _SectionHeader(title: 'Leave requests', count: leaves.maybeWhen(data: (d) => d.length, orElse: () => null)),
          leaves.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => _ErrorTile(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending leave requests.')
                : Column(children: [
                    for (final r in rows) _LeaveTile(
                      row: r,
                      onDecide: (approve) async {
                        await ref.read(leaveRepoProvider).decide(r['id'] as int, approve: approve);
                        await refreshAll();
                      },
                    ),
                  ]),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Salary advances', count: advances.maybeWhen(data: (d) => d.length, orElse: () => null)),
          advances.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => _ErrorTile(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending advances.')
                : Column(children: [
                    for (final r in rows) _AdvanceTile(
                      row: r,
                      onDecide: (approve) async {
                        await ref.read(advanceRepoProvider).decide(r['id'] as int, approve: approve);
                        await refreshAll();
                      },
                    ),
                  ]),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Expense claims', count: expenses.maybeWhen(data: (d) => d.length, orElse: () => null)),
          expenses.when(
            loading: () => const _LoadingTile(),
            error:   (e, _) => _ErrorTile(message: e.toString()),
            data:    (rows) => rows.isEmpty
                ? const _EmptyTile(text: 'No pending expense claims.')
                : Column(children: [
                    for (final r in rows) _ExpenseTile(
                      row: r,
                      onDecide: (approve) async {
                        await ref.read(expenseRepoProvider).decide(r['id'] as int, approve: approve);
                        await refreshAll();
                      },
                    ),
                  ]),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int? count;
  const _SectionHeader({required this.title, this.count});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, top: 8, bottom: 8),
      child: Row(
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(width: 8),
          if (count != null) Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(color: Colors.blue.shade50, borderRadius: BorderRadius.circular(10)),
            child: Text('$count', style: TextStyle(fontSize: 12, color: Colors.blue.shade800, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }
}

class _LoadingTile extends StatelessWidget {
  const _LoadingTile();
  @override
  Widget build(BuildContext context) =>
      const Card(child: Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator())));
}

class _ErrorTile extends StatelessWidget {
  final String message;
  const _ErrorTile({required this.message});
  @override
  Widget build(BuildContext context) => Card(
    color: Colors.red.shade50,
    child: Padding(padding: const EdgeInsets.all(12), child: Text(message, style: TextStyle(color: Colors.red.shade900))),
  );
}

class _EmptyTile extends StatelessWidget {
  final String text;
  const _EmptyTile({required this.text});
  @override
  Widget build(BuildContext context) =>
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(text, style: const TextStyle(color: Colors.grey))));
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(r?['fullName']?.toString() ?? 'Staff #${row['userId']}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('${row['leaveType']}  ·  ${_fmt(row['startDate']?.toString())} → ${_fmt(row['endDate']?.toString())}  ·  ${row['daysCount']} days'),
            if (row['reason'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(row['reason'].toString(), style: Theme.of(context).textTheme.bodySmall),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () => onDecide(false),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: () => onDecide(true), child: const Text('Approve')),
              ],
            ),
          ],
        ),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    submitter?['fullName']?.toString() ?? 'Staff #${row['submittedBy']}',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Text('Rs ${row['amount']}', style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 4),
            Text('${row['category']}  ·  ${row['date']}'),
            if (row['description'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(row['description'].toString(), style: Theme.of(context).textTheme.bodySmall),
            ),
            if (row['receiptUrl'] != null) const Padding(
              padding: EdgeInsets.only(top: 4),
              child: Row(children: [Icon(Icons.attachment, size: 14), SizedBox(width: 4), Text('Receipt attached', style: TextStyle(fontSize: 12))]),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () => onDecide(false),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: () => onDecide(true), child: const Text('Approve')),
              ],
            ),
          ],
        ),
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
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(user?['fullName']?.toString() ?? 'Staff #${row['userId']}', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text('Rs ${row['amount']}', style: Theme.of(context).textTheme.titleLarge),
            if (row['reason'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(row['reason'].toString(), style: Theme.of(context).textTheme.bodySmall),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                OutlinedButton(
                  onPressed: () => onDecide(false),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 8),
                FilledButton(onPressed: () => onDecide(true), child: const Text('Approve')),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
