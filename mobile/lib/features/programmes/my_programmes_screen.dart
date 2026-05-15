// =============================================================================
// "My Programmes" — list of WASH + IGP items assigned to the current field
// officer / supervisor. Tap an item to open the detail screen and advance
// its stage with a photo + GPS update.
// =============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../services/friendly_error.dart';
import 'programme_repository.dart';

class MyProgrammesScreen extends ConsumerWidget {
  const MyProgrammesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(myProgrammeItemsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Programmes'),
        elevation: 0,
        backgroundColor: const Color(0xFF0D1D3D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.map_outlined),
            tooltip: 'Map view',
            onPressed: () => context.push('/programmes/map'),
          ),
        ],
      ),
      body: feed.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => ErrorView(error: e, onRetry: () => ref.invalidate(myProgrammeItemsProvider)),
        data: (items) {
          if (items.isEmpty) return const _EmptyState();
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(myProgrammeItemsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, i) => _ItemCard(item: items[i]),
            ),
          );
        },
      ),
    );
  }
}

class _ItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  const _ItemCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final kind  = (item['__kind'] ?? 'wash').toString();
    final isWash = kind == 'wash';
    final stage = (item['stage'] ?? 'Ordered').toString();
    final beneficiary = (item['beneficiaryName'] ?? item['beneficiary']?['fullName'] ?? '—').toString();
    final district = (item['district'] ?? '').toString();
    final typeLabel = isWash ? (item['unitType'] ?? '').toString() : (item['assetType'] ?? '').toString();
    final itemCode = (item['itemCode'] ?? '').toString();
    final deadline = (item['plannedCompletion'] ?? item['order']?['deadline'] ?? '').toString();

    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      elevation: 1,
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => context.push('/programmes/${kind}/${item['id']}'),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: isWash ? const Color(0xFF0EA5E9).withValues(alpha: 0.12) : const Color(0xFF10B981).withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isWash ? Icons.water_drop_outlined : Icons.work_outline,
                  color: isWash ? const Color(0xFF0EA5E9) : const Color(0xFF10B981),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(beneficiary, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 2),
                    Text(
                      '$typeLabel${district.isNotEmpty ? ' · $district' : ''}',
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Text(itemCode, style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontFamily: 'monospace')),
                        if (deadline.isNotEmpty) ...[
                          const SizedBox(width: 8),
                          Icon(Icons.event_outlined, size: 12, color: Colors.grey.shade500),
                          const SizedBox(width: 2),
                          Text(deadline, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              _StageBadge(stage: stage),
            ],
          ),
        ),
      ),
    );
  }
}

class _StageBadge extends StatelessWidget {
  final String stage;
  const _StageBadge({required this.stage});

  static const _colors = <String, Color>{
    'Ordered':      Color(0xFF94A3B8),
    'Surveyed':     Color(0xFF3B82F6),
    'Materials':    Color(0xFF6366F1),
    'Procured':     Color(0xFF6366F1),
    'Construction': Color(0xFFF59E0B),
    'Training':     Color(0xFFF59E0B),
    'Testing':      Color(0xFFA855F7),
    'Delivered':    Color(0xFF10B981),
    'HandedOver':   Color(0xFF10B981),
    'FollowUp':     Color(0xFFA855F7),
    'Reported':     Color(0xFF059669),
    'Cancelled':    Color(0xFFDC2626),
  };

  @override
  Widget build(BuildContext context) {
    final c = _colors[stage] ?? Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(6)),
      child: Text(stage, style: TextStyle(color: c, fontWeight: FontWeight.bold, fontSize: 11)),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.event_available_outlined, size: 56, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            const Text('No programme items assigned to you',
              style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(
              'When a programme officer assigns you to a WASH installation or an IGP delivery, it will appear here with a deadline.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
            ),
          ],
        ),
      ),
    );
  }
}

// _ErrorView removed — replaced by the shared ErrorView from
// services/friendly_error.dart so error UI stays consistent across screens.
