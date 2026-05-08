import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/api_client.dart';
import '../../services/api_response.dart';

final _accommodationRequestsProvider =
    FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final Dio dio = ref.watch(dioProvider);
  final res = await dio.get('/accommodation-requests');
  return extractMapList(res.data, const ['requests', 'accommodationRequests']);
});

class AccommodationRequestsScreen extends ConsumerWidget {
  const AccommodationRequestsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(_accommodationRequestsProvider);
    return Scaffold(
      body: RefreshIndicator(
        color: kNavy900,
        onRefresh: () async => ref.invalidate(_accommodationRequestsProvider),
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
                    title: 'No accommodation requests',
                    message: 'Tap the button below to request lodging for a field trip.',
                    icon: Icons.hotel_outlined,
                  ),
                ],
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(12),
              separatorBuilder: (_, _) => const SizedBox(height: 8),
              itemCount: rows.length,
              itemBuilder: (_, i) => _AccommodationCard(row: rows[i]),
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
            MaterialPageRoute(builder: (_) => const _NewAccommodationForm()),
          );
          if (ok == true) ref.invalidate(_accommodationRequestsProvider);
        },
        icon: const Icon(Icons.add),
        label: Text('New request',
            style: GoogleFonts.inter(fontWeight: FontWeight.w800)),
      ),
    );
  }
}

class _AccommodationCard extends StatelessWidget {
  final Map<String, dynamic> row;
  const _AccommodationCard({required this.row});

  Color _statusColor(String s) {
    switch (s) {
      case 'Approved': case 'Booked': case 'Completed': return kSuccess600;
      case 'Rejected': case 'Cancelled':                return kDanger600;
      default:                                          return kMission500;
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
                decoration: BoxDecoration(color: kMission50, borderRadius: BorderRadius.circular(9)),
                child: const Icon(Icons.hotel_outlined, size: 17, color: kMission600),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  row['location']?.toString() ?? 'Accommodation',
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
              Text('${row['checkInDate'] ?? '—'} → ${row['checkOutDate'] ?? '—'}',
                style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
              const SizedBox(width: 12),
              const Icon(Icons.person_outline, size: 13, color: kInk400),
              const SizedBox(width: 4),
              Text('${row['guestCount'] ?? 1} guest${(row['guestCount'] ?? 1) == 1 ? '' : 's'}',
                style: GoogleFonts.inter(fontSize: 11.5, color: kInk500)),
            ],
          ),
          if (row['purpose'] != null) ...[
            const SizedBox(height: 6),
            Text(
              row['purpose'].toString(),
              style: GoogleFonts.inter(fontSize: 12.5, color: kInk700, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }
}

class _NewAccommodationForm extends ConsumerStatefulWidget {
  const _NewAccommodationForm();
  @override
  ConsumerState<_NewAccommodationForm> createState() => _NewAccommodationFormState();
}

class _NewAccommodationFormState extends ConsumerState<_NewAccommodationForm> {
  final _form = GlobalKey<FormState>();
  final _location = TextEditingController();
  final _purpose = TextEditingController();
  final _cost = TextEditingController();
  DateTime _checkIn = DateTime.now();
  DateTime _checkOut = DateTime.now().add(const Duration(days: 1));
  int _guests = 1;
  bool _busy = false;
  String? _error;

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(dioProvider).post('/accommodation-requests', data: {
        'location': _location.text.trim(),
        'checkInDate': DateFormat('yyyy-MM-dd').format(_checkIn),
        'checkOutDate': DateFormat('yyyy-MM-dd').format(_checkOut),
        'purpose': _purpose.text.trim(),
        'estimatedCost': _cost.text.trim().isEmpty ? null : double.tryParse(_cost.text.trim()),
        'guestCount': _guests,
      });
      if (mounted) Navigator.of(context).pop(true);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickDate(bool isCheckIn) async {
    final initial = isCheckIn ? _checkIn : _checkOut;
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime.now().subtract(const Duration(days: 1)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) setState(() {
      if (isCheckIn) _checkIn = picked; else _checkOut = picked;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kInk50,
      appBar: AppBar(title: const Text('Request accommodation')),
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
                    controller: _location,
                    decoration: const InputDecoration(labelText: 'Location'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _pickDate(true),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Check-in'),
                      child: Text(DateFormat('d MMM yyyy').format(_checkIn)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  InkWell(
                    onTap: () => _pickDate(false),
                    child: InputDecorator(
                      decoration: const InputDecoration(labelText: 'Check-out'),
                      child: Text(DateFormat('d MMM yyyy').format(_checkOut)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Text('Guests'),
                      const Spacer(),
                      IconButton(onPressed: () => setState(() => _guests = (_guests - 1).clamp(1, 20)),
                        icon: const Icon(Icons.remove_circle_outline)),
                      Text('$_guests', style: GoogleFonts.inter(fontWeight: FontWeight.w800, fontSize: 16)),
                      IconButton(onPressed: () => setState(() => _guests = (_guests + 1).clamp(1, 20)),
                        icon: const Icon(Icons.add_circle_outline)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _cost,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Estimated cost (LKR, optional)'),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: _purpose,
                    minLines: 2, maxLines: 4,
                    decoration: const InputDecoration(labelText: 'Purpose'),
                    validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
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
