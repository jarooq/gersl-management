import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

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
      onRefresh: () async => ref.invalidate(announcementsProvider),
      child: feed.when(
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
              Center(child: Text('No announcements.')),
            ]);
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (_, i) {
              final a = rows[i];
              final published = a['publishedAt'] as String?;
              final creator = a['creator'] as Map?;
              return Card(
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a['title']?.toString() ?? '', style: Theme.of(context).textTheme.titleMedium),
                      const SizedBox(height: 4),
                      Text(a['body']?.toString() ?? ''),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          if (creator != null)
                            Text(creator['fullName']?.toString() ?? '', style: Theme.of(context).textTheme.bodySmall),
                          const Spacer(),
                          if (published != null)
                            Text(_fmt(published), style: Theme.of(context).textTheme.bodySmall),
                        ],
                      ),
                    ],
                  ),
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
