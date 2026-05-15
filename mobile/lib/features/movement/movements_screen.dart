import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import 'movement_repository.dart';

// =============================================================================
// MovementsScreen — staff-facing movement log.
//   - List: status pill, route, planned departure date, distance.
//   - Tap a card → detail sheet with status-driven actions
//     (Depart / Arrive / Return / Cancel).
//   - FAB → /movements/new to plan a new trip.
// =============================================================================

class MovementsScreen extends ConsumerWidget {
  const MovementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movements = ref.watch(myMovementsProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(myMovementsProvider),
        child: movements.when(
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
                    title: 'No movements yet',
                    message: 'Plan your first trip with the button below.',
                    icon: Icons.directions_car_outlined,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 96),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _MovementCard(
                row: rows[i],
                onTap: () => _openDetail(context, ref, rows[i]),
              ),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kAmber500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () { Haptics.light(); context.push('/movements/new'); },
        icon: const Icon(Icons.add),
        label: Text('Plan movement',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
      ),
    );
  }

  void _openDetail(BuildContext context, WidgetRef ref, Map<String, dynamic> row) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _MovementDetailSheet(row: row),
    );
  }
}

// -----------------------------------------------------------------------------

class _MovementCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final VoidCallback onTap;
  const _MovementCard({required this.row, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? '';
    final dist = row['distanceKm'];
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  '${row['fromLocation'] ?? ''} → ${row['toLocation'] ?? ''}',
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700,
                    color: kInk900, height: 1.3,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
          if (row['purpose'] != null) ...[
            const SizedBox(height: 6),
            Text(
              row['purpose'].toString(),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 12.5, color: kInk700, height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.event, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text(_fmtDate(row['plannedDepartureAt'] as String?),
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
              const SizedBox(width: 12),
              const Icon(Icons.straighten, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text('${dist ?? '—'} km',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
            ],
          ),
        ],
      ),
    );
  }
}

String _fmtDate(String? iso) {
  if (iso == null) return '—';
  try { return DateFormat('d MMM, h:mm a').format(DateTime.parse(iso).toLocal()); }
  catch (_) { return iso; }
}

Color _statusColor(String s) => switch (s) {
  'Approved' || 'Returned'   => kSuccess600,
  'Rejected' || 'Cancelled'  => kDanger600,
  'InMovement' || 'Arrived'  => kNavy900,
  _                          => kWarn600,
};

// =============================================================================
// Detail sheet — surfaces full info + status-driven action buttons.
// =============================================================================

class _MovementDetailSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> row;
  const _MovementDetailSheet({required this.row});

  @override
  ConsumerState<_MovementDetailSheet> createState() => _MovementDetailSheetState();
}

class _MovementDetailSheetState extends ConsumerState<_MovementDetailSheet> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action, String successMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      ref.invalidate(myMovementsProvider);
      if (mounted) {
        Haptics.success();
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(successMsg)));
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(friendlyError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _confirmCancel() async {
    final reason = TextEditingController();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel movement?'),
        content: TextField(
          controller: reason,
          decoration: const InputDecoration(labelText: 'Reason (optional)'),
          maxLines: 2,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Keep')),
          TextButton(onPressed: () => Navigator.pop(ctx, true),  child: const Text('Cancel trip')),
        ],
      ),
    );
    if (ok != true) return;
    final id = widget.row['id'] as int;
    await _run(
      () async => ref.read(movementRepoProvider).cancel(id, reason: reason.text.trim()),
      'Movement cancelled',
    );
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.row;
    final status = r['status']?.toString() ?? '';
    final id = r['id'] as int;
    final canDepart = status == 'Approved';
    final canArrive = status == 'InMovement';
    final canReturn = status == 'Arrived';
    final canCancel = status == 'Planned' || status == 'Approved';
    final isPassenger = r['isPassenger'] == true;
    final canClaimFuel =
        !isPassenger && (status == 'Returned' || status == 'Arrived');
    final repo = ref.read(movementRepoProvider);

    return Container(
      decoration: const BoxDecoration(
        color: kSurfaceLight,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(22),
          topRight: Radius.circular(22),
        ),
      ),
      padding: EdgeInsets.fromLTRB(
        20, 12, 20, 20 + MediaQuery.of(context).padding.bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36, height: 4,
              decoration: BoxDecoration(
                color: kInk200, borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),

          Row(
            children: [
              Expanded(
                child: Text(
                  '${r['fromLocation'] ?? ''} → ${r['toLocation'] ?? ''}',
                  style: GoogleFonts.inter(
                    fontSize: 17, fontWeight: FontWeight.w800,
                    color: kInk900, height: 1.25,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
          if (r['purpose'] != null) ...[
            const SizedBox(height: 10),
            Text(
              r['purpose'].toString(),
              style: GoogleFonts.inter(fontSize: 13.5, color: kInk700, height: 1.4),
            ),
          ],

          const SizedBox(height: 16),
          _MetaRow(
            icon: Icons.event,
            label: 'Planned departure',
            value: _fmtDate(r['plannedDepartureAt'] as String?),
          ),
          _MetaRow(
            icon: Icons.event_available,
            label: 'Planned return',
            value: _fmtDate(r['plannedReturnAt'] as String?),
          ),
          if (r['departureAt'] != null)
            _MetaRow(
              icon: Icons.flight_takeoff,
              label: 'Departed',
              value: _fmtDate(r['departureAt'] as String?),
            ),
          if (r['arrivalAt'] != null)
            _MetaRow(
              icon: Icons.flag_outlined,
              label: 'Arrived',
              value: _fmtDate(r['arrivalAt'] as String?),
            ),
          if (r['returnAt'] != null)
            _MetaRow(
              icon: Icons.home_outlined,
              label: 'Returned',
              value: _fmtDate(r['returnAt'] as String?),
            ),
          if (r['distanceKm'] != null)
            _MetaRow(
              icon: Icons.straighten,
              label: 'Distance',
              value: '${r['distanceKm']} km',
            ),
          if (r['rejectionReason'] != null)
            _MetaRow(
              icon: Icons.error_outline,
              label: 'Rejection reason',
              value: r['rejectionReason'].toString(),
              valueColor: kDanger600,
            ),

          const SizedBox(height: 18),

          if (_busy)
            const Center(child: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: CircularProgressIndicator(color: kNavy900),
            ))
          else if (canDepart || canArrive || canReturn || canCancel || canClaimFuel) ...[
            if (canDepart)
              _ActionButton(
                icon: Icons.flight_takeoff,
                label: 'I\'ve departed',
                onTap: () => _run(() async => repo.depart(id), 'Marked as departed'),
              ),
            if (canArrive)
              _ActionButton(
                icon: Icons.flag,
                label: 'I\'ve arrived',
                onTap: () => _run(() async => repo.arrive(id), 'Marked as arrived'),
              ),
            if (canReturn)
              _ActionButton(
                icon: Icons.home_filled,
                label: 'Trip returned',
                onTap: () => _run(() async => repo.returnTrip(id), 'Trip closed'),
              ),
            if (canClaimFuel)
              _ActionButton(
                icon: Icons.local_gas_station,
                label: 'Claim fuel',
                onTap: () => _run(
                  () async => repo.deriveFuelClaim(movementId: id),
                  'Draft fuel claim created',
                ),
              ),
            if (canCancel)
              _ActionButton(
                icon: Icons.close,
                label: 'Cancel trip',
                color: kDanger600,
                onTap: _confirmCancel,
              ),
          ] else
            Center(
              child: Text(
                isPassenger
                    ? 'Passenger trip — fuel is claimed by the rider.'
                    : 'No actions available for status "$status".',
                style: GoogleFonts.inter(fontSize: 12.5, color: kInk500),
              ),
            ),
        ],
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  const _MetaRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 16, color: kInk400),
          const SizedBox(width: 10),
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk500),
            ),
          ),
          Expanded(
            flex: 6,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: GoogleFonts.inter(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: valueColor ?? kInk900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? kAmber500;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: SizedBox(
        height: 48,
        width: double.infinity,
        child: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: c,
            foregroundColor: c == kAmber500 ? kNavy900 : Colors.white,
            elevation: 0,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: Icon(icon, size: 18),
          label: Text(label,
              style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800)),
          onPressed: onTap,
        ),
      ),
    );
  }
}
