import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../services/token_store.dart';
import 'payslip_repository.dart';

class PayslipsScreen extends ConsumerWidget {
  const PayslipsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final payslips = ref.watch(myPayslipsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myPayslipsProvider),
      child: payslips.when(
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
              Center(child: Text('No payslips on file yet.')),
            ]);
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

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(code, style: Theme.of(context).textTheme.titleMedium),
                ),
                _StatusChip(status: status),
              ],
            ),
            const SizedBox(height: 4),
            Text('${_fmt(start)} → ${_fmt(end)}'),
            const SizedBox(height: 4),
            Text('Net: Rs $net', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.icon(
                onPressed: onOpenPdf,
                icon: const Icon(Icons.picture_as_pdf, size: 18),
                label: const Text('Open PDF'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _fmt(String? d) {
    if (d == null) return '';
    try { return DateFormat('d MMM yyyy').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }
}

class _StatusChip extends StatelessWidget {
  final String status;
  const _StatusChip({required this.status});
  @override
  Widget build(BuildContext context) {
    final color = switch (status) {
      'Paid' || 'Processed' => Colors.green,
      'Approved' => Colors.blue,
      _ => Colors.orange,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(12)),
      child: Text(status, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600)),
    );
  }
}
