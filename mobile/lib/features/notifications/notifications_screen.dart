import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/friendly_error.dart';

final _notificationsProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
  final res = await dio.get('/notifications', queryParameters: {'limit': 50});
  final raw = (res.data['data']?['notifications'] ?? res.data['notifications'] ?? res.data['data'] ?? []) as List;
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(_notificationsProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async => ref.invalidate(_notificationsProvider),
      child: feed.when(
        loading: () => const SkeletonList(),
        error: (e, _) => ListView(
          padding: const EdgeInsets.all(16),
          children: [ErrorBox(message: friendlyError(e))],
        ),
        data: (rows) {
          if (rows.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(16),
              children: const [
                EmptyState(
                  title: 'No notifications',
                  message: 'You\'re all caught up. New alerts will appear here.',
                  icon: Icons.notifications_off_outlined,
                ),
              ],
            );
          }
          return Column(
            children: [
              if (rows.any((r) => r['isRead'] == false))
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      icon: const Icon(Icons.done_all, size: 16),
                      label: const Text('Mark all as read'),
                      onPressed: () async {
                        try {
                          await ref.read(dioProvider).patch('/notifications/read-all');
                          ref.invalidate(_notificationsProvider);
                        } catch (_) {}
                      },
                    ),
                  ),
                ),
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(12),
                  separatorBuilder: (_, _) => const SizedBox(height: 8),
                  itemCount: rows.length,
                  itemBuilder: (_, i) => _NotificationCard(
                    n: rows[i],
                    onMarkRead: () async {
                      try {
                        await ref.read(dioProvider).patch('/notifications/${rows[i]['id']}/read');
                        ref.invalidate(_notificationsProvider);
                      } catch (_) {}
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  final Map<String, dynamic> n;
  final VoidCallback onMarkRead;
  const _NotificationCard({required this.n, required this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    final unread = n['isRead'] == false;
    final type   = n['type']?.toString() ?? 'info';
    final created = n['createdAt']?.toString();

    final tone = _toneFor(type);

    return SoftCard(
      onTap: unread ? onMarkRead : null,
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: tone.bg, borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(tone.icon, size: 17, color: tone.fg),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        n['title']?.toString() ?? 'Notification',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: unread ? FontWeight.w800 : FontWeight.w600,
                          color: kInk900,
                        ),
                      ),
                    ),
                    if (unread)
                      Container(
                        width: 8, height: 8,
                        decoration: const BoxDecoration(
                          color: kMission500, shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  n['message']?.toString() ?? '',
                  style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
                ),
                if (created != null) ...[
                  const SizedBox(height: 6),
                  Text(
                    _fmt(created),
                    style: GoogleFonts.inter(fontSize: 11, color: kInk400),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  _ToneSpec _toneFor(String type) {
    switch (type.toLowerCase()) {
      case 'success': case 'approved':
        return const _ToneSpec(Icons.check_circle, kSuccess600, Color(0xFFE6F4EA));
      case 'error': case 'rejected': case 'danger':
        return const _ToneSpec(Icons.error_outline, kDanger600, Color(0xFFFCE8E8));
      case 'warning': case 'pending':
        return const _ToneSpec(Icons.warning_amber, kMission600, kMission50);
      default:
        return const _ToneSpec(Icons.notifications_outlined, kNavy900, kNavy50);
    }
  }

  String _fmt(String iso) {
    try { return DateFormat('d MMM, HH:mm').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }
}

class _ToneSpec {
  final IconData icon;
  final Color fg;
  final Color bg;
  const _ToneSpec(this.icon, this.fg, this.bg);
}
