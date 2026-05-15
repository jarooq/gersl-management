import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';
import 'movement_repository.dart';

// =============================================================================
// NewMovementScreen — staff plans a trip from their phone.
// Fields: fromLocation, toLocation, purpose, plannedDepartureAt, plannedReturnAt
// =============================================================================

class NewMovementScreen extends ConsumerStatefulWidget {
  const NewMovementScreen({super.key});

  @override
  ConsumerState<NewMovementScreen> createState() => _NewMovementScreenState();
}

class _NewMovementScreenState extends ConsumerState<NewMovementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _from = TextEditingController();
  final _to = TextEditingController();
  final _purpose = TextEditingController();
  final _notes = TextEditingController();
  DateTime? _depart;
  DateTime? _return;
  bool _busy = false;

  @override
  void dispose() {
    _from.dispose();
    _to.dispose();
    _purpose.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _pickDate({required bool departure}) async {
    final now = DateTime.now();
    final initial = (departure ? _depart : _return) ?? now;
    final date = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 2),
    );
    if (date == null) return;
    if (!mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(initial),
    );
    if (time == null) return;
    final dt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    setState(() {
      if (departure) {
        _depart = dt;
      } else {
        _return = dt;
      }
    });
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_depart != null && _return != null && !_return!.isAfter(_depart!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Planned return must be after departure')),
      );
      return;
    }
    setState(() => _busy = true);
    try {
      await ref.read(movementRepoProvider).create(
        fromLocation: _from.text.trim(),
        toLocation: _to.text.trim(),
        purpose: _purpose.text.trim().isEmpty ? null : _purpose.text.trim(),
        plannedDepartureAt: _depart,
        plannedReturnAt: _return,
        notes: _notes.text.trim().isEmpty ? null : _notes.text.trim(),
      );
      ref.invalidate(myMovementsProvider);
      if (mounted) {
        Haptics.success();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Movement planned')),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(friendlyError(e))),
        );
      }
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Plan a movement'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
          children: [
            TextFormField(
              controller: _from,
              decoration: const InputDecoration(
                labelText: 'From',
                prefixIcon: Icon(Icons.trip_origin, size: 18),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _to,
              decoration: const InputDecoration(
                labelText: 'To',
                prefixIcon: Icon(Icons.location_on_outlined, size: 18),
              ),
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _purpose,
              decoration: const InputDecoration(
                labelText: 'Purpose',
                prefixIcon: Icon(Icons.notes_outlined, size: 18),
              ),
              maxLines: 2,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 16),
            _DatePickerField(
              label: 'Planned departure',
              icon: Icons.event,
              value: _depart,
              onTap: () => _pickDate(departure: true),
            ),
            const SizedBox(height: 12),
            _DatePickerField(
              label: 'Planned return',
              icon: Icons.event_available,
              value: _return,
              onTap: () => _pickDate(departure: false),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notes,
              decoration: const InputDecoration(
                labelText: 'Notes (optional)',
                prefixIcon: Icon(Icons.sticky_note_2_outlined, size: 18),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 22),
            ElevatedButton.icon(
              onPressed: _busy ? null : _submit,
              icon: _busy
                  ? const SizedBox(
                      width: 18, height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2.4, color: kNavy900,
                      ),
                    )
                  : const Icon(Icons.send_rounded, size: 18),
              label: Text(_busy ? 'Submitting…' : 'Plan movement'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DatePickerField extends StatelessWidget {
  final String label;
  final IconData icon;
  final DateTime? value;
  final VoidCallback onTap;
  const _DatePickerField({
    required this.label,
    required this.icon,
    required this.value,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM y · h:mm a');
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: kSurfaceLight,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: kBorderLight),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: kInk500),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: GoogleFonts.inter(
                      fontSize: 11.5, fontWeight: FontWeight.w600,
                      color: kInk500, letterSpacing: 0.2,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value == null ? 'Tap to pick' : fmt.format(value!),
                    style: GoogleFonts.inter(
                      fontSize: 14, fontWeight: FontWeight.w700,
                      color: value == null ? kInk400 : kInk900,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: kInk400, size: 20),
          ],
        ),
      ),
    );
  }
}
