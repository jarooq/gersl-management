import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/api_response.dart';

final _vehicleRequestsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
  final res = await dio.get('/vehicle-requests');
  return extractMapList(res.data, const ['requests', 'vehicleRequests']);
});

class VehicleRequestsScreen extends ConsumerWidget {
  const VehicleRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(_vehicleRequestsProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(_vehicleRequestsProvider),
        child: feed.when(
          loading: () => const SkeletonList(),
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
                    title: 'No vehicle requests',
                    message: 'Tap the button below to request a vehicle for a field trip.',
                    icon: Icons.directions_car_outlined,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _VehicleRequestCard(row: rows[i]),
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: kMission500,
        foregroundColor: kNavy900,
        elevation: 4,
        onPressed: () async {
          final ok = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const _NewVehicleRequestForm()),
          );
          if (ok == true) ref.invalidate(_vehicleRequestsProvider);
        },
        icon: const Icon(Icons.add),
        label: Text('New request',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _VehicleRequestCard extends StatelessWidget {
  final Map<String, dynamic> row;
  const _VehicleRequestCard({required this.row});

  Color _statusColor(String s) {
    switch (s) {
      case 'Approved':
      case 'Completed':
        return kSuccess600;
      case 'Rejected':
      case 'Cancelled':
        return kDanger600;
      case 'In Use':
        return kNavy900;
      default:
        return kMission500;
    }
  }

  String _fmt(String? iso) {
    if (iso == null) return '—';
    try {
      return DateFormat('d MMM, HH:mm').format(DateTime.parse(iso).toLocal());
    } catch (_) {
      return iso;
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = row['status']?.toString() ?? 'Pending';
    return SoftCard(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: kNavy50, borderRadius: BorderRadius.circular(9),
                ),
                child: const Icon(Icons.directions_car_outlined, size: 17, color: kNavy900),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  row['purpose']?.toString() ?? 'Vehicle request',
                  style: GoogleFonts.inter(
                    fontSize: 14, fontWeight: FontWeight.w700, color: kInk900,
                  ),
                ),
              ),
              StatusPill(label: status, color: _statusColor(status)),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.event, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text('${_fmt(row['startDate']?.toString())} → ${_fmt(row['endDate']?.toString())}',
                style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
            ],
          ),
          if (row['pickupLocation'] != null || row['dropoffLocation'] != null) ...[
            const SizedBox(height: 4),
            Text(
              '${row['pickupLocation'] ?? '—'} → ${row['dropoffLocation'] ?? '—'}',
              style: GoogleFonts.inter(fontSize: 12, color: kInk700, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }
}

class _NewVehicleRequestForm extends ConsumerStatefulWidget {
  const _NewVehicleRequestForm();
  @override
  ConsumerState<_NewVehicleRequestForm> createState() => _NewVehicleRequestFormState();
}

class _NewVehicleRequestFormState extends ConsumerState<_NewVehicleRequestForm> {
  final _form = GlobalKey<FormState>();
  final _purpose = TextEditingController();
  final _pickup = TextEditingController();
  final _dropoff = TextEditingController();
  DateTime _start = DateTime.now().add(const Duration(hours: 1));
  DateTime _end = DateTime.now().add(const Duration(hours: 4));
  int _passengers = 1;
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(dioProvider).post('/vehicle-requests', data: {
        'purpose': _purpose.text.trim(),
        'startDate': _start.toIso8601String(),
        'endDate': _end.toIso8601String(),
        'pickupLocation': _pickup.text.trim().isEmpty ? null : _pickup.text.trim(),
        'dropoffLocation': _dropoff.text.trim().isEmpty ? null : _dropoff.text.trim(),
        'passengerCount': _passengers,
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate(bool isStart) async {
    final initial = isStart ? _start : _end;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked == null) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    setState(() {
      final dt = DateTime(picked.year, picked.month, picked.day, time.hour, time.minute);
      if (isStart) _start = dt; else _end = dt;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kInk50,
      appBar: AppBar(title: const Text('Request a vehicle')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 80),
          child: Form(
            key: _form,
            child: SoftCard(
              padding: const EdgeInsets.fromLTRB(16, 18, 16, 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextFormField(
                    controller: _purpose,
                    minLines: 2, maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Purpose of trip'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _pickDate(true),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Start'),
                      child: Text(DateFormat('d MMM yyyy, HH:mm').format(_start)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _pickDate(false),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'End'),
                      child: Text(DateFormat('d MMM yyyy, HH:mm').format(_end)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _pickup,
                    decoration: const InputDecoration(labelText: 'Pickup location (optional)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _dropoff,
                    decoration: const InputDecoration(labelText: 'Drop-off location (optional)'),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('Passengers'),
                      const Spacer(),
                      IconButton(onPressed: () => setState(() => _passengers = (_passengers - 1).clamp(1, 50)),
                        icon: const Icon(Icons.remove_circle_outline)),
                      Text('$_passengers', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 16)),
                      IconButton(onPressed: () => setState(() => _passengers = (_passengers + 1).clamp(1, 50)),
                        icon: const Icon(Icons.add_circle_outline)),
                    ],
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    ErrorBox(message: _error!),
                  ],
                  const SizedBox(height: 16),
                  GlowButton(
                    label: _busy ? 'Submitting…' : 'Submit request',
                    icon: Icons.send_outlined,
                    loading: _busy,
                    onPressed: _submit,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
