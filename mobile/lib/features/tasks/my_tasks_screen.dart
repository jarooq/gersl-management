import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/friendly_error.dart';

// Update task status via the existing /tasks/:id/status endpoint. Field staff
// use this from mobile to close out their auto-generated WASH/IGP stage
// tasks ("Conduct site survey for WI-2026-00042", etc.).
Future<void> _updateTaskStatus(WidgetRef ref, int taskId, String status, {int? progress}) async {
  final dio = ref.read(dioProvider);
  await dio.put('/tasks/$taskId/status', data: {
    'status': status,
    if (progress != null) 'progress': progress,
  });
}

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
            itemBuilder: (context, i) => _TaskCard(
              task: rows[i],
              onChanged: () => ref.invalidate(myTasksProvider),
            ),
          );
        },
      ),
    );
  }
}

class _TaskCard extends ConsumerWidget {
  final Map<String, dynamic> task;
  final VoidCallback onChanged;
  const _TaskCard({required this.task, required this.onChanged});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final due = task['dueDate'] as String?;
    final priority = task['priority']?.toString() ?? '';
    final status = task['status']?.toString() ?? '';
    final project = task['project'] as Map?;
    final title = task['title']?.toString() ?? 'Untitled';
    final taskId = task['id'] is num ? (task['id'] as num).toInt() : null;
    final isClosed = status == 'Completed' || status == 'Cancelled';

    return InkWell(
      borderRadius: BorderRadius.circular(12),
      onTap: taskId == null || isClosed
          ? null
          : () => _showActions(context, ref, taskId, status),
      child: SoftCard(
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
                    style: GoogleFonts.inter(fontSize: 11.5, color: kInk500, height: 1.35),
                    maxLines: 2,
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
          if (taskId != null && !isClosed) ...[
            const SizedBox(height: 10),
            Row(children: [
              Expanded(child: OutlinedButton.icon(
                onPressed: () => _quickUpdate(context, ref, taskId, 'In Progress', 50),
                icon: const Icon(Icons.play_arrow, size: 16),
                label: const Text('In Progress', style: TextStyle(fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  minimumSize: Size.zero,
                ),
              )),
              const SizedBox(width: 8),
              Expanded(child: FilledButton.icon(
                onPressed: () => _quickUpdate(context, ref, taskId, 'Completed', 100),
                icon: const Icon(Icons.check, size: 16),
                label: const Text('Complete', style: TextStyle(fontSize: 12)),
                style: FilledButton.styleFrom(
                  backgroundColor: kSuccess600,
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  minimumSize: Size.zero,
                ),
              )),
            ]),
          ],
        ],
      ),
    ),);
  }

  void _showActions(BuildContext context, WidgetRef ref, int taskId, String current) {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(child: Wrap(children: [
        ListTile(
          leading: const Icon(Icons.play_arrow, color: kNavy900),
          title: const Text('Mark as In Progress'),
          onTap: () { Navigator.pop(context); _quickUpdate(context, ref, taskId, 'In Progress', 50); },
        ),
        ListTile(
          leading: const Icon(Icons.pause, color: kMission500),
          title: const Text('Mark as On Hold'),
          onTap: () { Navigator.pop(context); _quickUpdate(context, ref, taskId, 'On Hold', null); },
        ),
        ListTile(
          leading: const Icon(Icons.check_circle, color: kSuccess600),
          title: const Text('Mark as Completed'),
          onTap: () { Navigator.pop(context); _quickUpdate(context, ref, taskId, 'Completed', 100); },
        ),
        ListTile(
          leading: const Icon(Icons.cancel, color: kDanger600),
          title: const Text('Cancel task'),
          onTap: () { Navigator.pop(context); _confirmCancel(context, ref, taskId); },
        ),
      ])),
    );
  }

  Future<void> _confirmCancel(BuildContext context, WidgetRef ref, int taskId) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cancel task?'),
        content: const Text('This marks the task as Cancelled. Cannot be undone from mobile.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: kDanger600),
            child: const Text('Cancel task'),
          ),
        ],
      ),
    );
    if (ok == true && context.mounted) {
      await _quickUpdate(context, ref, taskId, 'Cancelled', null);
    }
  }

  Future<void> _quickUpdate(BuildContext context, WidgetRef ref, int taskId, String newStatus, int? progress) async {
    try {
      await _updateTaskStatus(ref, taskId, newStatus, progress: progress);
      onChanged();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Task marked as $newStatus'),
          duration: const Duration(seconds: 2),
        ));
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed: $e'),
          backgroundColor: kDanger600,
        ));
      }
    }
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
