import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import 'visit_repository.dart';

class VisitsScreen extends ConsumerWidget {
  const VisitsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visits = ref.watch(myVisitsProvider);
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(myVisitsProvider),
        child: visits.when(
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
                Center(child: Text('No visits logged yet.')),
              ]);
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _VisitCard(visit: rows[i]),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/visits/new'),
        icon: const Icon(Icons.add),
        label: const Text('Log visit'),
      ),
    );
  }
}

class _VisitCard extends StatelessWidget {
  final Map<String, dynamic> visit;
  const _VisitCard({required this.visit});

  @override
  Widget build(BuildContext context) {
    final occurred = visit['occurredAt'] as String?;
    final beneficiaries = visit['beneficiariesServed'];
    final project = visit['project'] as Map?;
    return Card(
      child: ListTile(
        title: Text(visit['customerName']?.toString() ?? '(no name)'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (visit['purpose'] != null) Text(visit['purpose'].toString()),
            if (project != null) Text(project['name']?.toString() ?? '', style: Theme.of(context).textTheme.bodySmall),
            if (occurred != null) Text(_fmt(occurred), style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
        trailing: beneficiaries != null
            ? Chip(label: Text('$beneficiaries'), avatar: const Icon(Icons.people, size: 16))
            : null,
      ),
    );
  }

  String _fmt(String iso) {
    try { return DateFormat('d MMM, HH:mm').format(DateTime.parse(iso).toLocal()); }
    catch (_) { return iso; }
  }
}
