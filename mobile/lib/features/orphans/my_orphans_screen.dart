// =============================================================================
// My Orphans — coordinator's assigned orphan list, with search and a tap-to-
// open detail screen. Matches the My Programmes / Visits screen patterns.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'orphan_repository.dart';

final myOrphansProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>(
  (ref) => ref.watch(orphanRepoProvider).myOrphans(),
);

class MyOrphansScreen extends ConsumerStatefulWidget {
  const MyOrphansScreen({super.key});
  @override
  ConsumerState<MyOrphansScreen> createState() => _MyOrphansScreenState();
}

class _MyOrphansScreenState extends ConsumerState<MyOrphansScreen> {
  String _q = '';

  @override
  Widget build(BuildContext context) {
    final async = ref.watch(myOrphansProvider);
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Orphans'),
        backgroundColor: const Color(0xFF0D1D3D),
        foregroundColor: Colors.white,
      ),
      body: async.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Padding(
          padding: const EdgeInsets.all(24),
          child: Text(e.toString(), textAlign: TextAlign.center),
        )),
        data: (rows) {
          final q = _q.trim().toLowerCase();
          final filtered = q.isEmpty ? rows : rows.where((o) {
            final name = (o['fullName'] ?? '').toString().toLowerCase();
            final code = (o['orphanCode'] ?? '').toString().toLowerCase();
            final dist = (o['district'] ?? '').toString().toLowerCase();
            return name.contains(q) || code.contains(q) || dist.contains(q);
          }).toList();
          return RefreshIndicator(
            onRefresh: () => ref.refresh(myOrphansProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(12),
              children: [
                TextField(
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search, size: 18),
                    hintText: 'Search by name, code, or district',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    isDense: true,
                  ),
                  onChanged: (v) => setState(() => _q = v),
                ),
                const SizedBox(height: 12),
                if (filtered.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      rows.isEmpty
                          ? 'No orphans assigned to you yet.'
                          : 'No orphans match "$_q".',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.grey.shade600),
                    ),
                  )
                else
                  ...filtered.map(_buildTile),
                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildTile(Map<String, dynamic> o) {
    final id = (o['id'] as num?)?.toInt();
    final age = o['age'];
    final approval = (o['approvalStatus'] ?? '').toString();
    final approvalColor = approval == 'Approved' ? Colors.green :
                          approval == 'Rejected' ? Colors.red   :
                          Colors.amber;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Material(
        color: Colors.white,
        elevation: 1,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          onTap: id == null ? null : () => context.push('/orphans/$id'),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: Colors.pink.shade50,
                  child: Icon(Icons.child_care, color: Colors.pink.shade700, size: 18),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text((o['fullName'] ?? '—').toString(),
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        [
                          o['orphanCode'],
                          if (age != null) 'Age $age',
                          o['gender'],
                          o['district'],
                        ].where((x) => x != null && x.toString().isNotEmpty).join(' · '),
                        style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                if (approval.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: approvalColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(approval,
                        style: TextStyle(
                            color: approvalColor.shade800,
                            fontWeight: FontWeight.bold, fontSize: 11)),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
