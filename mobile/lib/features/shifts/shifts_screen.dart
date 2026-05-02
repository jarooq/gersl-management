import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';

final myShiftsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
  // Show next 60 days of scheduled shifts.
  final now = DateTime.now();
  final to = now.add(const Duration(days: 60));
  String ymd(DateTime d) =>
      '${d.year.toString().padLeft(4, '0')}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  final res = await dio.get('/shifts', queryParameters: {
    'from': ymd(now.subtract(const Duration(days: 1))),
    'to':   ymd(to),
  });
  final raw = (res.data['data'] as List?) ?? [];
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class ShiftsScreen extends ConsumerWidget {
  const ShiftsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shifts = ref.watch(myShiftsProvider);
    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(myShiftsProvider),
      child: shifts.when(
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
              Center(child: Text('No shifts scheduled.')),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final s = rows[i];
              final status = s['status']?.toString() ?? '';
              final date = s['date']?.toString();
              return Card(
                child: ListTile(
                  leading: CircleAvatar(child: Text(_dayLabel(date))),
                  title: Text(_fmtDate(date)),
                  subtitle: Text('${s['startTime']} → ${s['endTime']}  •  break ${s['breakMinutes'] ?? 0} min'),
                  trailing: _Pill(text: status),
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _fmtDate(String? d) {
    if (d == null) return '';
    try { return DateFormat('EEE, d MMM').format(DateTime.parse(d)); }
    catch (_) { return d; }
  }

  String _dayLabel(String? d) {
    if (d == null) return '?';
    try { return DateFormat('d').format(DateTime.parse(d)); }
    catch (_) { return '?'; }
  }
}

class _Pill extends StatelessWidget {
  final String text;
  const _Pill({required this.text});
  @override
  Widget build(BuildContext context) {
    final color = switch (text) {
      'Completed' => Colors.green,
      'Missed' => Colors.red,
      'Cancelled' => Colors.grey,
      _ => Colors.blue,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
