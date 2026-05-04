import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import 'leave_repository.dart';

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaves = ref.watch(myLeavesProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(myLeavesProvider),
        child: leaves.when(
          loading: () => const LoadingPanel(),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [ErrorBox(message: e.toString())],
          ),
          data: (rows) {
            if (rows.isEmpty) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: const [
                  EmptyState(
                    title: 'No leave requests',
                    message: 'Submit a new leave request from the button below.',
                    icon: Icons.event_busy_outlined,
                  ),
                ],
              );
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
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () => context.push('/leaves/new'),
        icon: const Icon(Icons.add),
        label: Text('Request leave',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
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

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  type,
                  style: GoogleFonts.inter(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: kInk900,
                  ),
                ),
              ),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.event, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text(
                '${_fmt(start)} → ${_fmt(end)}  ·  $days day${days == 1 ? '' : 's'}',
                style: GoogleFonts.inter(fontSize: 12, color: kInk500),
              ),
            ],
          ),
          if (row['reason'] != null) ...[
            const SizedBox(height: 8),
            Text(
              row['reason'].toString(),
              style: GoogleFonts.inter(fontSize: 13, color: kInk700, height: 1.4),
            ),
          ],
          if (row['rejectionReason'] != null) ...[
            const SizedBox(height: 6),
            Text(
              'Rejected: ${row['rejectionReason']}',
              style: GoogleFonts.inter(
                fontSize: 12, color: kDanger600, fontWeight: FontWeight.w600,
              ),
            ),
          ],
          if (status == 'Pending') ...[
            const SizedBox(height: 6),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton(
                onPressed: onCancel,
                child: const Text('Cancel request'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'Approved':  return kSuccess600;
      case 'Rejected':  return kDanger600;
      case 'Cancelled': return kInk500;
      default:          return kMission500; // Pending
    }
  }

  String _fmt(String? d) {
    if (d == null) return '';
    try { return DateFormat('d MMM').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}
