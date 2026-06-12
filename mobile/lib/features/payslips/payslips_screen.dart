import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import 'payslip_repository.dart';

class PayslipsScreen extends ConsumerWidget {
  const PayslipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payslips = ref.watch(myPayslipsProvider);
    return RefreshIndicator(
      color: kAmber500,
      onRefresh: () async => ref.invalidate(myPayslipsProvider),
      child: payslips.when(
        loading: () => const SkeletonList(),
        error: (e, _) => ListView(
          padding: const EdgeInsets.all(16),
          children: [ErrorBox(message: friendlyError(e))],
        ),
        data: (rows) {
          final latestNet = rows.isEmpty ? null : rows.first['netPay'];
          return ListView(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 28),
            children: [
              _PayrollBanner(latestNet: latestNet, count: rows.length),
              const SizedBox(height: 14),
              if (rows.isEmpty)
                const EmptyState(
                  title: 'No payslips yet',
                  message: 'Once your payroll is processed, payslips appear here for download.',
                  icon: Icons.payments_outlined,
                )
              else
                for (final row in rows) ...[
                  _PayslipCard(
                    row: row,
                    onOpenPdf: () async {
                      try {
                        final url = await ref.read(payslipRepoProvider).pdfUrl(row['id'] as int);
                        final uri = Uri.parse(url);
                        if (await canLaunchUrl(uri)) {
                          await launchUrl(uri, mode: LaunchMode.externalApplication);
                        }
                      } catch (_) {
                        // PDF open failed — token fetch or launch error; ignore.
                      }
                    },
                  ),
                  const SizedBox(height: 8),
                ],
            ],
          );
        },
      ),
    );
  }
}

// Blue gradient banner — shows the most-recent net pay at a glance.
class _PayrollBanner extends StatelessWidget {
  final Object? latestNet;
  final int count;
  const _PayrollBanner({required this.latestNet, required this.count});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 18),
      decoration: BoxDecoration(
        gradient: kBlueBanner,
        borderRadius: BorderRadius.circular(22),
        boxShadow: glow(kNavy700, blur: 24, opacity: 0.30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 40, height: 40,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.account_balance_wallet_outlined,
                    color: Colors.white, size: 21),
              ),
              const SizedBox(width: 12),
              Text('Payroll',
                  style: GoogleFonts.inter(
                    color: Colors.white, fontSize: 16,
                    fontWeight: FontWeight.w800, letterSpacing: -0.2,
                  )),
              const Spacer(),
              Text('$count payslip${count == 1 ? '' : 's'}',
                  style: GoogleFonts.inter(
                    color: Colors.white.withValues(alpha: 0.78), fontSize: 12,
                  )),
            ],
          ),
          const SizedBox(height: 14),
          Text('LATEST NET PAY',
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.7),
                fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 1.1,
              )),
          const SizedBox(height: 2),
          Text(
            latestNet == null ? '—' : 'LKR $latestNet',
            style: GoogleFonts.inter(
              color: Colors.white, fontSize: 26,
              fontWeight: FontWeight.w900, letterSpacing: -0.6,
            ),
          ),
        ],
      ),
    );
  }
}

class _PayslipCard extends StatelessWidget {
  final Map<String, dynamic> row;
  final Future<void> Function() onOpenPdf;
  const _PayslipCard({required this.row, required this.onOpenPdf});

  @override
  Widget build(BuildContext context) {
    final code = row['payrollCode']?.toString() ?? '';
    final start = row['payPeriodStart']?.toString();
    final end = row['payPeriodEnd']?.toString();
    final net = row['netPay'];
    final status = row['status']?.toString() ?? 'Pending';

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 12),
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
                      code,
                      style: GoogleFonts.inter(
                        fontSize: 13.5,
                        fontWeight: FontWeight.w700,
                        color: kInk900,
                      ),
                    ),
                    Text(
                      '${_fmt(start)} → ${_fmt(end)}',
                      style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                    ),
                  ],
                ),
              ),
              StatusPill(label: status, color: _color(status)),
            ],
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(
              color: kNavy900,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Text(
                  'NET PAY',
                  style: GoogleFonts.inter(
                    color: kAmber300,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.0,
                  ),
                ),
                const Spacer(),
                Text(
                  'LKR $net',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.3,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: onOpenPdf,
              icon: const Icon(Icons.picture_as_pdf, size: 16),
              label: const Text('Open PDF'),
            ),
          ),
        ],
      ),
    );
  }

  Color _color(String s) => switch (s) {
    'Paid' || 'Processed' => kSuccess600,
    'Approved'            => kNavy900,
    _                     => kMission500,
  };

  String _fmt(String? d) {
    if (d == null) return '';
    try { return DateFormat('d MMM yyyy').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}
