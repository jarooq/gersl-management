import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../auth/auth_controller.dart';
import 'advance_repository.dart';

const _approverRoles = {'Admin', 'CEO', 'HR Manager', 'Finance Manager'};

class AdvancesScreen extends ConsumerWidget {
  const AdvancesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advances = ref.watch(advancesProvider);
    final me = ref.watch(authControllerProvider).value?.user;
    final canApprove = _approverRoles.contains(me?['role']);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(advancesProvider),
        child: advances.when(
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
                Center(child: Text('No salary advances yet.')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _AdvanceCard(
                row: rows[i],
                canApprove: canApprove,
                onDecide: (approve) async {
                  await ref.read(advanceRepoProvider).decide(
                    rows[i]['id'] as int,
                    approve: approve,
                  );
                  ref.invalidate(advancesProvider);
                },
                onCancel: () async {
                  await ref.read(advanceRepoProvider).cancel(rows[i]['id'] as int);
                  ref.invalidate(advancesProvider);
                },
                isMine: rows[i]['userId'] == me?['id'],
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/advances/new'),
        icon: const Icon(Icons.add),
        label: const Text('Request advance'),
      ),
    );
  }
}

class _AdvanceCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final bool canApprove;
  final bool isMine;
  final Future<void> Function(bool approve) onDecide;
  final Future<void> Function() onCancel;

  const _AdvanceCard({
    required this.row,
    required this.canApprove,
    required this.isMine,
    required this.onDecide,
    required this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? 'Pending';
    final amount = row['amount'];
    final user = row['user'] as Map?;
    final created = row['createdAt'] as String?;

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
                    user?['fullName']?.toString() ?? 'You',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                _StatusChip(status: status),
              ],
            ),
            const SizedBox(height: 4),
            Text('Rs ${amount ?? 0}', style: Theme.of(context).textTheme.titleLarge),
            if (row['reason'] != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text(row['reason'].toString()),
            ),
            if (created != null) Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Submitted ${_fmt(created)}', style: Theme.of(context).textTheme.bodySmall),
            ),
            if (status == 'Pending') Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Row(
                children: [
                  if (canApprove) ...[
                    OutlinedButton(
                      onPressed: () => onDecide(false),
                      style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                      child: const Text('Reject'),
                    ),
                    const SizedBox(width: 8),
                    FilledButton(
                      onPressed: () => onDecide(true),
                      child: const Text('Approve'),
                    ),
                    const Spacer(),
                  ],
                  if (isMine) TextButton(
                    onPressed: onCancel,
                    child: const Text('Cancel request'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(String iso) {
    try { return DateFormat('d MMM').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
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
      'Deducted' => Colors.blue,
      _ => Colors.orange,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
