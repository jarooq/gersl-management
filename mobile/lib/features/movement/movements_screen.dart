import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'movement_repository.dart';

class MovementsScreen extends ConsumerWidget {
  const MovementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final movements = ref.watch(myMovementsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myMovementsProvider),
      child: movements.when(
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
              Center(child: Text('No movements logged.')),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final m = rows[i];
              final status = m['status']?.toString() ?? '';
              return Card(
                child: ListTile(
                  title: Text('${m['fromLocation'] ?? ''} → ${m['toLocation'] ?? ''}'),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (m['purpose'] != null) Text(m['purpose'].toString()),
                      Text(
                        '${_fmt(m['plannedStart'] as String?)} • ${m['distanceKm'] ?? '-'} km',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                  trailing: _Pill(text: status, color: _color(status)),
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
    'Approved' || 'Returned' => Colors.green,
    'Rejected' || 'Cancelled' => Colors.red,
    'InMovement' || 'Arrived' => Colors.blue,
    _ => Colors.orange,
  };
}

class _Pill extends StatelessWidget {
  final String text;
  final Color color;
  const _Pill({required this.text, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
