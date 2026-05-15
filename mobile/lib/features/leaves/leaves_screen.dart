import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import 'leave_repository.dart';

class LeavesScreen extends ConsumerWidget {
  const LeavesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final leaves = ref.watch(myLeavesProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kAmber500,
        onRefresh: () async => ref.invalidate(myLeavesProvider),
        child: leaves.when(
          loading: () => const SkeletonList(),
          error: (e, _) => ListView(
            padding: const EdgeInsets.all(16),
            children: [ErrorBox(message: friendlyError(e))],
          ),
          data: (rows) {
            final pending  = rows.where((r) => r['status'] == 'Pending').length;
            final approved = rows.where((r) => r['status'] == 'Approved').length;
            return ListView(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 96),
              children: [
                _LeaveBanner(pending: pending, approved: approved, total: rows.length),
                const SizedBox(height: 14),
                if (rows.isEmpty)
                  const EmptyState(
                    title: 'No leave requests',
                    message: 'Submit a new leave request from the button below.',
                    icon: Icons.event_busy_outlined,
                  )
                else
                  for (final row in rows) ...[
                    _LeaveCard(
                      row: row,
                      onCancel: () async {
                        final ok = await _confirmCancel(context, 'Cancel this leave request?');
                        if (ok != true) return;
                        await ref.read(leaveRepoProvider).cancel(row['id'] as int);
                        ref.invalidate(myLeavesProvider);
                      },
                    ),
                    const SizedBox(height: 8),
                  ],
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () { Haptics.light(); context.push('/leaves/new'); },
        icon: const Icon(Icons.add),
        label: Text('Request leave',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

// Gradient summary banner — mirrors the Home dashboard's banner language.
class _LeaveBanner extends StatelessWidget {
  final int pending;
  final int approved;
  final int total;
  const _LeaveBanner({required this.pending, required this.approved, required this.total});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      decoration: BoxDecoration(
        gradient: kBrandGradient,
        borderRadius: BorderRadius.circular(22),
        boxShadow: glow(kNavy700, blur: 24, opacity: 0.28),
      ),
      child: Row(
        children: [
          Container(
            width: 44, height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(Icons.event_note_outlined, color: Colors.white, size: 23),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('My Leave',
                    style: GoogleFonts.inter(
                      color: Colors.white, fontSize: 16,
                      fontWeight: FontWeight.w800, letterSpacing: -0.2,
                    )),
                const SizedBox(height: 2),
                Text('$total request${total == 1 ? '' : 's'} this year',
                    style: GoogleFonts.inter(
                      color: Colors.white.withValues(alpha: 0.78), fontSize: 12,
                    )),
              ],
            ),
          ),
          _MiniStat(value: pending,  label: 'Pending',  tone: kAmber300),
          const SizedBox(width: 14),
          _MiniStat(value: approved, label: 'Approved', tone: const Color(0xFF6FE3A8)),
        ],
      ),
    );
  }
}

class _MiniStat extends StatelessWidget {
  final int value;
  final String label;
  final Color tone;
  const _MiniStat({required this.value, required this.label, required this.tone});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text('$value',
            style: GoogleFonts.inter(
              color: tone, fontSize: 20, fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            )),
        Text(label,
            style: GoogleFonts.inter(
              color: Colors.white.withValues(alpha: 0.7), fontSize: 10,
              fontWeight: FontWeight.w600,
            )),
      ],
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

// Shared confirmation helper — uses showDialog so the user has to tap a
// distinct "Yes" button instead of a swipe-away cancel.
Future<bool?> _confirmCancel(BuildContext context, String message) {
  return showDialog<bool>(
    context: context,
    // Use the dialog's own context to pop — with StatefulShellRoute the
    // outer `context` resolves to the branch navigator, so popping with it
    // would dismiss the screen instead of the dialog (black screen).
    builder: (dCtx) => AlertDialog(
      title: const Text('Confirm cancel'),
      content: Text(message),
      actions: [
        TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('No, keep it')),
        FilledButton(
          onPressed: () => Navigator.pop(dCtx, true),
          style: FilledButton.styleFrom(backgroundColor: kDanger600),
          child: const Text('Yes, cancel'),
        ),
      ],
    ),
  );
}
