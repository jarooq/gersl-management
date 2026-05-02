import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'movement_repository.dart';

class FuelClaimsScreen extends ConsumerWidget {
  const FuelClaimsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final claims = ref.watch(myFuelClaimsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myFuelClaimsProvider),
      child: claims.when(
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
              Center(child: Text('No fuel claims yet.')),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final c = rows[i];
              return Card(
                child: ListTile(
                  title: Text('Rs ${c['claimAmount'] ?? c['amount'] ?? '-'}'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${c['distanceKm'] ?? '-'} km @ Rs ${c['ratePerKm'] ?? '-'}/km'),
                      Text(
                        _fmt((c['createdAt'] ?? c['claimDate']) as String?),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  trailing: _Pill(text: c['status']?.toString() ?? 'Pending'),
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
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill({required this.text});

  @override
  Widget build(BuildContext context) {
    final color = switch (text) {
      'Approved' || 'Paid' => Colors.green,
      'Rejected' => Colors.red,
      'Submitted' => Colors.blue,
      _ => Colors.orange,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
