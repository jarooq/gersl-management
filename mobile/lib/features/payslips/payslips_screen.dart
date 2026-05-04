import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/token_store.dart';
import 'payslip_repository.dart';

class PayslipsScreen extends ConsumerWidget {
  const PayslipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payslips = ref.watch(myPayslipsProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async => ref.invalidate(myPayslipsProvider),
      child: payslips.when(
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
                  title: 'No payslips yet',
                  message: 'Once your payroll is processed, payslips appear here for download.',
                  icon: Icons.payments_outlined,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) => _PayslipCard(
              row: rows[i],
              onOpenPdf: () async {
                final token = await TokenStore().readAccess();
                if (token == null) return;
                final url = ref.read(payslipRepoProvider).pdfUrl(rows[i]['id'] as int, token);
                final uri = Uri.parse(url);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                }
              },
            ),
          );
        },
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
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              children: [
                Text(
                  'NET PAY',
                  style: GoogleFonts.inter(
                    color: kMission300,
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
