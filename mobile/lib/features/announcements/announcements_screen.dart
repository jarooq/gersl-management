import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';

final announcementsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
  final res = await dio.get('/announcements');
  final raw = (res.data['data'] as List?) ?? [];
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class AnnouncementsScreen extends ConsumerWidget {
  const AnnouncementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(announcementsProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async => ref.invalidate(announcementsProvider),
      child: feed.when(
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
                  title: 'No announcements',
                  message: 'New announcements from the team will appear here.',
                  icon: Icons.campaign_outlined,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final a = rows[i];
              final published = a['publishedAt'] as String?;
              final creator = a['creator'] as Map?;
              return SoftCard(
                padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            color: kMission50,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.campaign_outlined,
                              color: kMission600, size: 17),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            a['title']?.toString() ?? '',
                            style: GoogleFonts.inter(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              color: kInk900,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      a['body']?.toString() ?? '',
                      style: GoogleFonts.inter(
                        fontSize: 13, color: kInk700, height: 1.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        if (creator != null)
                          Text(
                            creator['fullName']?.toString() ?? '',
                            style: GoogleFonts.inter(
                              fontSize: 11.5, color: kInk500,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        const Spacer(),
                        if (published != null)
                          Text(
                            _fmt(published),
                            style: GoogleFonts.inter(fontSize: 11.5, color: kInk400),
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

  String _fmt(String iso) {
    try { return DateFormat('d MMM, HH:mm').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }
}
