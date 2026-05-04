import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import 'movement_repository.dart';

class MovementsScreen extends ConsumerWidget {
  const MovementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movements = ref.watch(myMovementsProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async => ref.invalidate(myMovementsProvider),
      child: movements.when(
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
                  title: 'No movements yet',
                  message: 'Field-trip movements will appear here once logged.',
                  icon: Icons.directions_car_outlined,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final m = rows[i];
              final status = m['status']?.toString() ?? '';
              return SoftCard(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${m['fromLocation'] ?? ''} → ${m['toLocation'] ?? ''}',
                            style: GoogleFonts.inter(
                              fontSize: 14, fontWeight: FontWeight.w700,
                              color: kInk900,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        StatusPill(label: status, color: _color(status)),
                      ],
                    ),
                    if (m['purpose'] != null) ...[
                      const SizedBox(height: 6),
                      Text(
                        m['purpose'].toString(),
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
                        Text(_fmt(m['plannedStart'] as String?),
                            style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
                        const SizedBox(width: 12),
                        const Icon(Icons.straighten, size: 13, color: kInk400),
                        const SizedBox(width: 4),
                        Text('${m['distanceKm'] ?? '—'} km',
                            style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
                      ],
                    ),
                  ],
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _fmt(String? iso) {
    if (iso == null) return '';
    try { return DateFormat('d MMM').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }

  Color _color(String s) => switch (s) {
    'Approved' || 'Returned'   => kSuccess600,
    'Rejected' || 'Cancelled'  => kDanger600,
    'InMovement' || 'Arrived'  => kNavy900,
    _                          => kMission500,
  };
}
