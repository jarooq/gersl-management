import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../auth/auth_controller.dart';
import 'advance_repository.dart';

// Permission-driven approver check (same shape as approvals_screen).
const _approverPermissions = <String>[
  'hr:salary_advance_approve',
  'finance:manager_approve',
];

bool _canApprove(Map<String, dynamic>? user) {
  if (user == null) return false;
  final perms = user['permissions'];
  if (perms is List) {
    final keys = perms.map((p) => p is Map ? p['permissionKey']?.toString() : p.toString()).toSet();
    if (keys.contains('*')) return true;
    for (final p in _approverPermissions) {
      if (keys.contains(p)) return true;
    }
  }
  return const {'Admin', 'CEO', 'HR Manager', 'Finance Manager'}.contains(user['role']);
}

class AdvancesScreen extends ConsumerWidget {
  const AdvancesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final advances = ref.watch(advancesProvider);
    final me = ref.watch(authControllerProvider).value?.user;
    final canApprove = _canApprove(me);

    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(advancesProvider),
        child: advances.when(
          loading: () => const SkeletonList(),
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
                    title: 'No salary advances',
                    message: 'Submit an advance request from the button below.',
                    icon: Icons.attach_money,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _AdvanceCard(
                row: rows[i],
                canApprove: canApprove,
                isMine: rows[i]['userId'] == me?['id'],
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
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () { Haptics.light(); context.push('/advances/new'); },
        icon: const Icon(Icons.add),
        label: Text('Request advance',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
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
                      user?['fullName']?.toString() ?? 'You',
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: kInk900,
                      ),
                    ),
                    Text(
                      'LKR ${amount ?? 0}',
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        color: kInk900,
                        letterSpacing: -0.2,
                      ),
                    ),
                  ],
                ),
              ),
              StatusPill(label: status, color: _color(status)),
            ],
          ),
          if (row['reason'] != null) ...[
            const SizedBox(height: 8),
            Text(
              row['reason'].toString(),
              style: GoogleFonts.inter(fontSize: 13, color: kInk700, height: 1.4),
            ),
          ],
          if (created != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.event, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(
                  'Submitted ${_fmt(created)}',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
              ],
            ),
          ],
          if (status == 'Pending') ...[
            const SizedBox(height: 10),
            Row(
              children: [
                if (canApprove) ...[
                  OutlinedButton(
                    onPressed: () { Haptics.medium(); onDecide(false); },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: kDanger600,
                      minimumSize: const Size(0, 38),
                    ),
                    child: const Text('Reject'),
                  ),
                  const SizedBox(width: 8),
                  FilledButton(
                    onPressed: () { Haptics.medium(); onDecide(true); },
                    style: FilledButton.styleFrom(
                      backgroundColor: kSuccess600,
                      foregroundColor: Colors.white,
                      minimumSize: const Size(0, 38),
                    ),
                    child: const Text('Approve'),
                  ),
                  const Spacer(),
                ],
                if (isMine)
                  TextButton(
                    onPressed: onCancel,
                    child: const Text('Cancel'),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Color _color(String s) => switch (s) {
    'Approved'  => kSuccess600,
    'Rejected'  => kDanger600,
    'Cancelled' => kInk500,
    'Deducted'  => kNavy900,
    _           => kMission500,
  };

  String _fmt(String iso) {
    try { return DateFormat('d MMM').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }
}
