import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import 'expense_repository.dart';

class ExpensesScreen extends ConsumerWidget {
  const ExpensesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final expenses = ref.watch(myExpensesProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(myExpensesProvider),
        child: expenses.when(
          loading: () => const SkeletonList(),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [ErrorBox(message: friendlyError(e))],
          ),
          data: (rows) {
            if (rows.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: const [
                  EmptyState(
                    title: 'No expense claims',
                    message: 'Submit out-of-pocket expenses for reimbursement.',
                    icon: Icons.receipt_long_outlined,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _ExpenseCard(
                row: rows[i],
                onCancel: () async {
                  final ok = await showDialog<bool>(
                    context: context,
                    builder: (_) => AlertDialog(
                      title: const Text('Cancel claim?'),
                      content: const Text('This withdraws your expense claim. You can submit a new one later.'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Keep it')),
                        FilledButton(
                          onPressed: () => Navigator.pop(context, true),
                          style: FilledButton.styleFrom(backgroundColor: kDanger600),
                          child: const Text('Yes, cancel'),
                        ),
                      ],
                    ),
                  );
                  if (ok != true) return;
                  await ref.read(expenseRepoProvider).cancel(rows[i]['id'] as int);
                  ref.invalidate(myExpensesProvider);
                },
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () { Haptics.light(); context.push('/expenses/new'); },
        icon: const Icon(Icons.add),
        label: Text('Submit claim',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
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

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      category,
                      style: GoogleFonts.inter(
                        fontSize: 14.5,
                        fontWeight: FontWeight.w700,
                        color: kInk900,
                      ),
                    ),
                    Text(
                      'LKR $amount',
                      style: GoogleFonts.inter(
                        fontSize: 13, color: kInk500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
          if (description.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              description,
              style: GoogleFonts.inter(fontSize: 13, color: kInk700, height: 1.4),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              if (date != null) ...[
                const Icon(Icons.event, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(_fmt(date),
                    style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
              ],
              const SizedBox(width: 12),
              if (row['receiptUrl'] != null) ...[
                const Icon(Icons.attach_file, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text('Receipt',
                    style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
              ],
            ],
          ),
          if (status == 'Pending') ...[
            const SizedBox(height: 4),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(onPressed: onCancel, child: const Text('Cancel')),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'Approved': case 'Paid':  return kSuccess600;
      case 'Rejected':                return kDanger600;
      case 'Cancelled':               return kInk500;
      default:                         return kMission500;
    }
  }

  String _fmt(String d) {
    try { return DateFormat('d MMM yyyy').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}
