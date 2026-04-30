import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';
import 'package:permission_handler/permission_handler.dart';

import 'punch_repository.dart';

final todayProvider = FutureProvider.autoDispose((ref) async {
  return ref.watch(punchRepoProvider).today();
});

class PunchScreen extends ConsumerStatefulWidget {
  const PunchScreen({super.key});

  @override
  ConsumerState<PunchScreen> createState() => _PunchScreenState();
}

class _PunchScreenState extends ConsumerState<PunchScreen> {
  bool _busy = false;
  String? _error;

  Future<Position?> _resolveLocation() async {
    final ok = await Permission.locationWhenInUse.request();
    if (!ok.isGranted) return null;
    final serviceOn = await Geolocator.isLocationServiceEnabled();
    if (!serviceOn) return null;
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  Future<void> _punch(String punchType) async {
    setState(() { _busy = true; _error = null; });
    try {
      final pos = await _resolveLocation();
      await ref.read(punchRepoProvider).record(
        punchType: punchType,
        latitude: pos?.latitude,
        longitude: pos?.longitude,
        accuracyM: pos?.accuracy,
      );
      ref.invalidate(todayProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Punched $punchType')),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final today = ref.watch(todayProvider);
    return RefreshIndicator(
      onRefresh: () async { ref.invalidate(todayProvider); },
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          today.when(
            loading: () => const Padding(
              padding: EdgeInsets.all(40),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => _Errored(message: e.toString()),
            data: (d) => _TodaySummary(data: d),
          ),
          const SizedBox(height: 16),
          if (_error != null)
            Card(
              color: Colors.red.shade50,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Text(_error!, style: TextStyle(color: Colors.red.shade900)),
              ),
            ),
          Row(
            children: [
              Expanded(
                child: _BigButton(
                  label: 'Punch IN',
                  color: Colors.green,
                  icon: Icons.login,
                  busy: _busy,
                  onPressed: () => _punch('In'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _BigButton(
                  label: 'Punch OUT',
                  color: Colors.red,
                  icon: Icons.logout,
                  busy: _busy,
                  onPressed: () => _punch('Out'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _busy ? null : () => _punch('BreakIn'),
                  icon: const Icon(Icons.coffee_outlined),
                  label: const Text('Break in'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: _busy ? null : () => _punch('BreakOut'),
                  icon: const Icon(Icons.work_history_outlined),
                  label: const Text('Break out'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text("Today's punches", style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          today.when(
            loading: () => const SizedBox.shrink(),
            error: (_, __) => const SizedBox.shrink(),
            data: (d) {
              final punches = (d['punches'] as List? ?? []).cast<Map>();
              if (punches.isEmpty) {
                return Card(
                  child: const Padding(
                    padding: EdgeInsets.all(16),
                    child: Text('No punches yet today.'),
                  ),
                );
              }
              return Card(
                child: Column(
                  children: [
                    for (var i = 0; i < punches.length; i++) ...[
                      if (i > 0) const Divider(height: 1),
                      _PunchTile(punch: Map<String, dynamic>.from(punches[i])),
                    ]
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _TodaySummary extends StatelessWidget {
  final Map<String, dynamic> data;
  const _TodaySummary({required this.data});

  @override
  Widget build(BuildContext context) {
    final isClockedIn = data['isClockedIn'] == true;
    final last = data['lastPunch'] as Map?;
    final dateStr = data['date'] as String? ?? '';
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 6,
                  backgroundColor: isClockedIn ? Colors.green : Colors.grey,
                ),
                const SizedBox(width: 8),
                Text(isClockedIn ? 'Clocked in' : 'Not clocked in',
                    style: Theme.of(context).textTheme.titleMedium),
              ],
            ),
            const SizedBox(height: 4),
            Text(dateStr, style: Theme.of(context).textTheme.bodySmall),
            if (last != null) ...[
              const SizedBox(height: 8),
              Text('Last: ${last['punchType']} at ${_fmtTime(last['occurredAt'])}'),
            ],
          ],
        ),
      ),
    );
  }
}

class _PunchTile extends StatelessWidget {
  final Map<String, dynamic> punch;
  const _PunchTile({required this.punch});

  @override
  Widget build(BuildContext context) {
    final type = punch['punchType'] as String? ?? '';
    final geo = punch['geofenceMatch'] == true;
    return ListTile(
      dense: true,
      leading: Icon(
        type == 'In' || type == 'BreakIn' ? Icons.login : Icons.logout,
        color: type == 'In' ? Colors.green : type == 'Out' ? Colors.red : Colors.orange,
      ),
      title: Text(type),
      subtitle: Text(_fmtTime(punch['occurredAt'])),
      trailing: geo
          ? const Icon(Icons.place, color: Colors.green, size: 18)
          : (punch['latitude'] != null
              ? const Icon(Icons.location_off, color: Colors.orange, size: 18)
              : null),
    );
  }
}

class _BigButton extends StatelessWidget {
  final String label;
  final Color color;
  final IconData icon;
  final bool busy;
  final VoidCallback onPressed;
  const _BigButton({
    required this.label,
    required this.color,
    required this.icon,
    required this.busy,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 80,
      child: FilledButton(
        style: FilledButton.styleFrom(backgroundColor: color),
        onPressed: busy ? null : onPressed,
        child: busy
            ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(icon, color: Colors.white),
                  const SizedBox(height: 4),
                  Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
      ),
    );
  }
}

class _Errored extends StatelessWidget {
  final String message;
  const _Errored({required this.message});
  @override
  Widget build(BuildContext context) {
    return Card(
      color: Colors.red.shade50,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Text(message, style: TextStyle(color: Colors.red.shade900)),
      ),
    );
  }
}

String _fmtTime(dynamic raw) {
  if (raw == null) return '—';
  try {
    final dt = DateTime.parse(raw.toString()).toLocal();
    return DateFormat('HH:mm').format(dt);
  } catch (_) {
    return raw.toString();
  }
}
