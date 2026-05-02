import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../services/api_client.dart';

final myTasksProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final dio = ref.watch(dioProvider);
  final res = await dio.get('/tasks/my-tasks');
  // Existing API returns { success: true, tasks: [...] }
  final raw = (res.data['tasks'] ?? res.data['data']?['tasks']) as List? ?? [];
  return raw.cast<Map>().map((m) => Map<String, dynamic>.from(m)).toList();
});

class MyTasksScreen extends ConsumerWidget {
  const MyTasksScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasks = ref.watch(myTasksProvider);
    return RefreshIndicator(
      onRefresh: () async { ref.invalidate(myTasksProvider); },
      child: tasks.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ListView(children: [
          Padding(
            padding: const EdgeInsets.all(24),
            child: Card(
              color: Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(
                  e.toString(),
                  style: TextStyle(color: Colors.red.shade900),
                ),
              ),
            ),
          ),
        ]),
        data: (rows) {
          if (rows.isEmpty) {
            return ListView(children: const [
              SizedBox(height: 80),
              Center(child: Text('No tasks assigned to you yet.')),
            ]);
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
    final priority = task['priority'] as String? ?? '';
    return Card(
      child: ListTile(
        title: Text(task['title']?.toString() ?? 'Untitled'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (task['project'] != null)
              Text(
                (task['project']['projectName'] ?? task['project']['name'] ?? '').toString(),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            if (due != null) Text('Due ${_fmtDate(due)}'),
          ],
        ),
        trailing: _StatusPill(status: task['status']?.toString() ?? '', priority: priority),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  final String status;
  final String priority;
  const _StatusPill({required this.status, required this.priority});

  Color _color() {
    switch (priority) {
      case 'Urgent': return Colors.red;
      case 'High':   return Colors.orange;
      case 'Medium': return Colors.blue;
      default:       return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: _color().withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(priority, style: TextStyle(color: _color(), fontSize: 11, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 4),
        Text(status, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

String _fmtDate(String iso) {
  try {
    return DateFormat('d MMM').format(DateTime.parse(iso).toLocal());
  } catch (_) { return iso; }
}
