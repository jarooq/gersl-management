import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';

final myTasksProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/tasks/my-tasks');
  final raw = (res.data['tasks'] ?? res.data['data']?['tasks']) as List? ?? [];
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(myTasksProvider);
    return RefreshIndicator(
      color: kNavy900,
      onRefresh: () async { ref.invalidate(myTasksProvider); },
      child: tasks.when(
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
                  title: 'Nothing assigned',
                  message: 'Tasks assigned to you by your supervisor will appear here.',
                  icon: Icons.checklist_outlined,
                ),
              ],
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.all(12),
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemCount: rows.length,
            itemBuilder: (context, i) => _TaskCard(task: rows[i]),
          );
        },
      ),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final Map<String, dynamic> task;
  const _TaskCard({required this.task});

  @override
  Widget build(BuildContext context) {
    final due = task['dueDate'] as String?;
    final priority = task['priority']?.toString() ?? '';
    final status = task['status']?.toString() ?? '';
    final project = task['project'] as Map?;
    final title = task['title']?.toString() ?? 'Untitled';

    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w700,
                    color: kInk900,
                    height: 1.3,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              if (priority.isNotEmpty)
                StatusPill(label: priority.toUpperCase(), color: _priorityColor(priority)),
            ],
          ),
          if (project != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.folder_outlined, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    (project['projectName'] ?? project['name'] ?? '').toString(),
                    style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: 10),
          Row(
            children: [
              if (due != null) ...[
                const Icon(Icons.event, size: 13, color: kInk400),
                const SizedBox(width: 4),
                Text(
                  'Due ${_fmtDate(due)}',
                  style: GoogleFonts.inter(fontSize: 11.5, color: kInk500),
                ),
              ],
              const Spacer(),
              if (status.isNotEmpty)
                StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
        ],
      ),
    );
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'Urgent': return kDanger600;
      case 'High':   return kMission500;
      case 'Medium': return kNavy900;
      default:       return kInk500;
    }
  }

  Color _statusColor(String s) {
    switch (s) {
      case 'Completed': case 'Done':       return kSuccess600;
      case 'In Progress': case 'Active':   return kNavy900;
      case 'Blocked': case 'Cancelled':    return kDanger600;
      case 'Pending':                       return kMission500;
      default:                              return kInk500;
    }
  }
}

String _fmtDate(String iso) {
  try {
    return DateFormat('d MMM').format(DateTime.parse(iso).toLocal());
  } catch (_) { return iso; }
}
