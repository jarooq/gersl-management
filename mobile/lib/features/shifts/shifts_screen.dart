import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';

final myShiftsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
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
      color: kNavy900,
      onRefresh: () async => ref.invalidate(myShiftsProvider),
      child: shifts.when(
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
                  title: 'No shifts scheduled',
                  message: 'Upcoming roster shifts will appear here.',
                  icon: Icons.calendar_view_week,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final s = rows[i];
              final status = s['status']?.toString() ?? '';
              final date = s['date']?.toString();
              return SoftCard(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Row(
                  children: [
                    // Date chip
                    Container(
                      width: 46, height: 46,
                      decoration: BoxDecoration(
                        color: kNavy900,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        _dayLabel(date),
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 18, fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _fmtDate(date),
                            style: GoogleFonts.inter(
                              fontSize: 13.5,
                              fontWeight: FontWeight.w700,
                              color: kInk900,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${s['startTime']} → ${s['endTime']}   ·   break ${s['breakMinutes'] ?? 0} min',
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

  Color _color(String s) => switch (s) {
    'Completed' => kSuccess600,
    'Missed'    => kDanger600,
    'Cancelled' => kInk500,
    _           => kNavy900,
  };
}
