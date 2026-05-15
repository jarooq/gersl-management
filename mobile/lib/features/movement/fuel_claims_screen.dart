import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import '../../services/token_store.dart';
import 'movement_repository.dart';

// =============================================================================
// FuelClaimsScreen — staff-facing fuel-claim list.
//   - Cards show net amount, distance + rate, status, date.
//   - Tap → detail sheet with Submit (Draft → Submitted), Cancel (Draft only),
//     View PDF (any state).
//   - Empty state explains the manual derive flow.
// =============================================================================

class FuelClaimsScreen extends ConsumerWidget {
  const FuelClaimsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(myFuelClaimsProvider);
    return RefreshIndicator(
      color: kAmber500,
      onRefresh: () async => ref.invalidate(myFuelClaimsProvider),
      child: claims.when(
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
                  title: 'No fuel claims',
                  message: 'Open a Returned trip in Movements and tap '
                      '"Claim fuel" to derive a draft claim.',
                  icon: Icons.local_gas_station,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) => _ClaimCard(
              row: rows[i],
              onTap: () => _openDetail(context, ref, rows[i]),
            ),
          );
        },
      ),
    );
  }

  void _openDetail(BuildContext context, WidgetRef ref, Map<String, dynamic> row) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _ClaimDetailSheet(row: row),
    );
  }
}

// -----------------------------------------------------------------------------

class _ClaimCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final VoidCallback onTap;
  const _ClaimCard({required this.row, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? 'Draft';
    final amount = row['netAmount'] ?? row['grossAmount'];
    final currency = row['currency']?.toString() ?? 'LKR';
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: kAmber50,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(Icons.local_gas_station,
                    size: 18, color: kAmber600),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '$currency ${_money(amount)}',
                      style: GoogleFonts.inter(
                        fontSize: 15, fontWeight: FontWeight.w800,
                        color: kInk900,
                      ),
                    ),
                    Text(
                      '${row['distanceKm'] ?? '—'} km · $currency ${row['ratePerKm'] ?? '—'}/km',
                      style: GoogleFonts.inter(
                        fontSize: 12, color: kInk500,
                      ),
                    ),
                  ],
                ),
              ),
              StatusPill(label: status, color: _claimColor(status)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.event, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text(
                _fmtShort((row['createdAt']) as String?),
                style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
              ),
              if (row['lunchDeduction'] != null &&
                  (num.tryParse('${row['lunchDeduction']}') ?? 0) > 0) ...[
                const SizedBox(width: 12),
                const Icon(Icons.restaurant, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(
                  '−$currency ${row['lunchDeduction']} lunch',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}

String _fmtShort(String? iso) {
  if (iso == null) return '—';
  try { return DateFormat('d MMM').format(DateTime.parse(iso).toLocal()); }
  catch (_) { return iso; }
}

String _fmtFull(String? iso) {
  if (iso == null) return '—';
  try { return DateFormat('d MMM y · h:mm a').format(DateTime.parse(iso).toLocal()); }
  catch (_) { return iso; }
}

String _money(dynamic v) {
  if (v == null) return '—';
  final n = num.tryParse('$v');
  if (n == null) return v.toString();
  return NumberFormat('#,##0.00').format(n);
}

Color _claimColor(String s) => switch (s) {
  'Approved' || 'Paid'    => kSuccess600,
  'Rejected' || 'Cancelled' => kDanger600,
  'Submitted'             => kNavy900,
  'Merged'                => kInk500,
  _                       => kWarn600,
};

// =============================================================================
// Detail sheet — Submit / Cancel / View PDF + full breakdown.
// =============================================================================

class _ClaimDetailSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> row;
  const _ClaimDetailSheet({required this.row});

  @override
  ConsumerState<_ClaimDetailSheet> createState() => _ClaimDetailSheetState();
}

class _ClaimDetailSheetState extends ConsumerState<_ClaimDetailSheet> {
  bool _busy = false;

  Future<void> _run(Future<void> Function() action, String successMsg) async {
    setState(() => _busy = true);
    try {
      await action();
      ref.invalidate(myFuelClaimsProvider);
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

  Future<void> _openPdf() async {
    final id = widget.row['id'] as int;
    final token = await TokenStore().readAccess();
    if (token == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sign in expired — please log in again')),
      );
      return;
    }
    final url = ref.read(movementRepoProvider).fuelClaimPdfUrl(id, token);
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open PDF viewer')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.row;
    final id = r['id'] as int;
    final status = r['status']?.toString() ?? 'Draft';
    final canSubmit = status == 'Draft';
    final canCancel = status == 'Draft';
    final repo = ref.read(movementRepoProvider);
    final currency = r['currency']?.toString() ?? 'LKR';
    final movement = r['movement'] as Map?;

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
              Container(
                width: 40, height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kAmber50, borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.local_gas_station,
                    size: 20, color: kAmber600),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Fuel claim #$id',
                      style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.w600,
                        color: kInk500,
                      ),
                    ),
                    Text(
                      '$currency ${_money(r['netAmount'] ?? r['grossAmount'])}',
                      style: GoogleFonts.inter(
                        fontSize: 22, fontWeight: FontWeight.w900,
                        color: kInk900, letterSpacing: -0.4, height: 1.1,
                      ),
                    ),
                  ],
                ),
              ),
              StatusPill(label: status, color: _claimColor(status)),
            ],
          ),

          if (movement != null) ...[
            const SizedBox(height: 14),
            _DetailRow(
              icon: Icons.alt_route,
              label: 'Movement',
              value: '${movement['fromLocation'] ?? '?'} → ${movement['toLocation'] ?? '?'}',
            ),
          ],
          const SizedBox(height: 4),
          _DetailRow(
            icon: Icons.straighten,
            label: 'Distance',
            value: '${r['distanceKm'] ?? '—'} km',
          ),
          _DetailRow(
            icon: Icons.attach_money,
            label: 'Rate',
            value: '$currency ${r['ratePerKm'] ?? '—'}/km',
          ),
          if (r['grossAmount'] != null)
            _DetailRow(
              icon: Icons.calculate_outlined,
              label: 'Gross',
              value: '$currency ${_money(r['grossAmount'])}',
            ),
          if (r['lunchDeduction'] != null &&
              (num.tryParse('${r['lunchDeduction']}') ?? 0) > 0)
            _DetailRow(
              icon: Icons.restaurant,
              label: 'Lunch deduction',
              value: '−$currency ${_money(r['lunchDeduction'])}',
            ),
          if (r['netAmount'] != null)
            _DetailRow(
              icon: Icons.payments_outlined,
              label: 'Net',
              value: '$currency ${_money(r['netAmount'])}',
              valueBold: true,
            ),
          _DetailRow(
            icon: Icons.event,
            label: 'Created',
            value: _fmtFull(r['createdAt'] as String?),
          ),
          if (r['paidAt'] != null)
            _DetailRow(
              icon: Icons.check_circle_outline,
              label: 'Paid',
              value: _fmtFull(r['paidAt'] as String?),
              valueColor: kSuccess600,
            ),
          if (r['rejectionReason'] != null)
            _DetailRow(
              icon: Icons.error_outline,
              label: 'Rejection reason',
              value: r['rejectionReason'].toString(),
              valueColor: kDanger600,
            ),

          const SizedBox(height: 18),

          if (_busy)
            const Center(child: Padding(
              padding: EdgeInsets.symmetric(vertical: 12),
              child: CircularProgressIndicator(color: kAmber500),
            ))
          else ...[
            if (canSubmit)
              _SheetActionButton(
                icon: Icons.send_rounded,
                label: 'Submit for approval',
                onTap: () => _run(
                  () async => repo.submitFuelClaim(id),
                  'Submitted to approver',
                ),
              ),
            if (canCancel)
              _SheetActionButton(
                icon: Icons.close,
                label: 'Cancel claim',
                color: kDanger600,
                onTap: () => _run(
                  () async => repo.cancelFuelClaim(id),
                  'Claim cancelled',
                ),
              ),
            _SheetActionButton(
              icon: Icons.picture_as_pdf_outlined,
              label: 'View PDF',
              outlined: true,
              onTap: _openPdf,
            ),
          ],
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;
  final bool valueBold;
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
    this.valueColor,
    this.valueBold = false,
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
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontSize: 13,
                fontWeight: valueBold ? FontWeight.w800 : FontWeight.w600,
                color: valueColor ?? kInk900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SheetActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? color;
  final bool outlined;
  const _SheetActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color,
    this.outlined = false,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? kAmber500;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: SizedBox(
        height: 48,
        width: double.infinity,
        child: outlined
            ? OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: kNavy900,
                  side: const BorderSide(color: kBorderLight, width: 1.4),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: Icon(icon, size: 18),
                label: Text(label,
                    style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w800)),
                onPressed: onTap,
              )
            : ElevatedButton.icon(
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
