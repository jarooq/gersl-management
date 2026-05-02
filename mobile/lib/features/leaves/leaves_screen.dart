import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'leave_repository.dart';

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaves = ref.watch(myLeavesProvider);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myLeavesProvider),
        child: leaves.when(
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
                Center(child: Text('No leave requests yet.')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _LeaveCard(
                row: rows[i],
                onCancel: () async {
                  await ref.read(leaveRepoProvider).cancel(rows[i]['id'] as int);
                  ref.invalidate(myLeavesProvider);
                },
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/leaves/new'),
        icon: const Icon(Icons.add),
        label: const Text('Request leave'),
      ),
    );
  }
}

class _LeaveCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function() onCancel;
  const _LeaveCard({required this.row, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? 'Pending';
    final type = row['leaveType']?.toString() ?? '';
    final start = row['startDate']?.toString();
    final end = row['endDate']?.toString();
    final days = row['daysCount'];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(type, style: Theme.of(context).textTheme.titleMedium),
                ),
                _StatusChip(status: status),
              ],
            ),
            const SizedBox(height: 4),
            Text('${_fmt(start)} → ${_fmt(end)}  •  $days day${days == 1 ? '' : 's'}'),
            if (row['reason'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(row['reason'].toString()),
            ),
            if (row['rejectionReason'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Rejected: ${row['rejectionReason']}', style: TextStyle(color: Colors.red.shade700)),
            ),
            if (status == 'Pending') Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Align(
                alignment: Alignment.centerRight,
                child: TextButton(onPressed: onCancel, child: const Text('Cancel request')),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(String? d) {
    if (d == null) return '';
    try { return DateFormat('d MMM').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'Approved' => Colors.green,
      'Rejected' => Colors.red,
      'Cancelled' => Colors.grey,
      _ => Colors.orange,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
