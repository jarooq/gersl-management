import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import 'movement_repository.dart';

class FuelClaimsScreen extends ConsumerWidget {
  const FuelClaimsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(myFuelClaimsProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async => ref.invalidate(myFuelClaimsProvider),
      child: claims.when(
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
                  title: 'No fuel claims',
                  message: 'Auto-derived from your returned movements.',
                  icon: Icons.local_gas_station,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final c = rows[i];
              final status = c['status']?.toString() ?? 'Pending';
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
                            color: kMission50,
                            borderRadius: BorderRadius.circular(9),
                          ),
                          child: const Icon(Icons.local_gas_station,
                              size: 18, color: kMission600),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'LKR ${c['claimAmount'] ?? c['amount'] ?? '—'}',
                                style: GoogleFonts.inter(
                                  fontSize: 15, fontWeight: FontWeight.w800,
                                  color: kInk900,
                                ),
                              ),
                              Text(
                                '${c['distanceKm'] ?? '—'} km · LKR ${c['ratePerKm'] ?? '—'}/km',
                                style: GoogleFonts.inter(
                                  fontSize: 12, color: kInk500,
                                ),
                              ),
                            ],
                          ),
                        ),
                        StatusPill(label: status, color: _color(status)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.event, size: 13, color: kInk400),
                        const SizedBox(width: 4),
                        Text(
                          _fmt((c['createdAt'] ?? c['claimDate']) as String?),
                          style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                        ),
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
    'Approved' || 'Paid' => kSuccess600,
    'Rejected'           => kDanger600,
    'Submitted'          => kNavy900,
    _                    => kMission500,
  };
}
