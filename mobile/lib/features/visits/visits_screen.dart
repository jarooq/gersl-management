import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import 'visit_repository.dart';

class VisitsScreen extends ConsumerWidget {
  const VisitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visits = ref.watch(myVisitsProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(myVisitsProvider),
        child: visits.when(
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
                    title: 'No visits yet',
                    message: 'Tap the button below to log your first beneficiary visit.',
                    icon: Icons.location_on_outlined,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _VisitCard(visit: rows[i]),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () => context.push('/visits/new'),
        icon: const Icon(Icons.add),
        label: Text(
          'Log visit',
          style: GoogleFonts.inter(fontWeight: FontWeight.w800),
        ),
      ),
    );
  }
}

class _VisitCard extends StatelessWidget {
  final Map<String, dynamic> visit;
  const _VisitCard({required this.visit});

  @override
  Widget build(BuildContext context) {
    final occurred = visit['occurredAt'] as String?;
    final beneficiaries = visit['beneficiariesServed'];
    final project = visit['project'] as Map?;
    final name = visit['customerName']?.toString() ?? '(no name)';

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: kNavy50,
                  borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(Icons.person_outline,
                    color: kNavy900, size: 18),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  name,
                  style: GoogleFonts.inter(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: kInk900,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              if (beneficiaries != null)
                StatusPill(
                  label: '$beneficiaries served',
                  color: kSuccess600,
                  icon: Icons.people_alt_outlined,
                ),
            ],
          ),
          if (visit['purpose'] != null) ...[
            const SizedBox(height: 10),
            Text(
              visit['purpose'].toString(),
              style: GoogleFonts.inter(
                fontSize: 13, color: kInk700, height: 1.4,
              ),
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              if (project != null) ...[
                const Icon(Icons.folder_outlined, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(
                  project['name']?.toString() ?? '',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
                const SizedBox(width: 12),
              ],
              if (occurred != null) ...[
                const Icon(Icons.schedule, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(
                  _fmt(occurred),
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }

  String _fmt(String iso) {
    try {
      return DateFormat('d MMM, HH:mm').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }
}
