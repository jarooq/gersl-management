import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'expense_repository.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenses = ref.watch(myExpensesProvider);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myExpensesProvider),
        child: expenses.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => ListView(children: [
            Padding(
              padding: const EdgeInsets.all(24),
              child: Card(
                color: Colors.red.shade50,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(e.toString(), style: TextStyle(color: Colors.red.shade900)),
                ),
              ),
            ),
          ]),
          data: (rows) {
            if (rows.isEmpty) {
              return ListView(children: const [
                SizedBox(height: 100),
                Center(child: Text('No expense claims yet.')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _ExpenseCard(
                row: rows[i],
                onCancel: () async {
                  await ref.read(expenseRepoProvider).cancel(rows[i]['id'] as int);
                  ref.invalidate(myExpensesProvider);
                },
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/expenses/new'),
        icon: const Icon(Icons.add),
        label: const Text('Submit claim'),
      ),
    );
  }
}

class _ExpenseCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function() onCancel;
  const _ExpenseCard({required this.row, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? 'Pending';
    final amount = row['amount'];
    final category = row['category']?.toString() ?? '';
    final description = row['description']?.toString() ?? '';
    final date = row['date']?.toString();

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
                    '$category  •  Rs $amount',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _StatusChip(status: status),
              ],
            ),
            const SizedBox(height: 4),
            Text(description),
            if (date != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(_fmt(date), style: Theme.of(context).textTheme.bodySmall),
            ),
            if (row['receiptUrl'] != null) const Padding(
              padding: EdgeInsets.only(top: 4),
              child: Row(children: [Icon(Icons.attachment, size: 14), SizedBox(width: 4), Text('Receipt attached', style: TextStyle(fontSize: 12))]),
            ),
            if (status == 'Pending') Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: onCancel, child: const Text('Cancel')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(String d) {
    try { return DateFormat('d MMM yyyy').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'Approved' || 'Paid' => Colors.green,
      'Rejected' => Colors.red,
      _ => Colors.orange,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
