import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import 'leave_repository.dart';

const _leaveTypes = ['Annual', 'Casual', 'Sick', 'Maternity', 'Compassionate', 'Unpaid'];

class NewLeaveScreen extends ConsumerStatefulWidget {
  const NewLeaveScreen({super.key});

  @override
  ConsumerState<NewLeaveScreen> createState() => _NewLeaveScreenState();
}

class _NewLeaveScreenState extends ConsumerState<NewLeaveScreen> {
  final _formKey = GlobalKey<FormState>();
  final _reason = TextEditingController();
  String _type = 'Annual';
  DateTime? _start;
  DateTime? _end;
  bool _busy = false;
  String? _error;

  @override
  void dispose() { _reason.dispose(); super.dispose(); }

  Future<void> _pickRange() async {
    // Clamp the picker to a sensible window — backdating supports sick-leave
    // entered after-the-fact, future cap of 1 year prevents the audit case
    // where leave start dates of 2099 made it past approval.
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 1, now.month, now.day),
      initialDateRange: _start != null && _end != null
          ? DateTimeRange(start: _start!, end: _end!)
          : DateTimeRange(start: now, end: now),
    );
    if (picked != null) setState(() { _start = picked.start; _end = picked.end; });
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_start == null || _end == null) {
      setState(() => _error = 'Pick a date range');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(leaveRepoProvider).create(
        leaveType: _type,
        startDate: _start!,
        endDate: _end!,
        reason: _reason.text.trim(),
      );
      ref.invalidate(myLeavesProvider);
      if (mounted) context.pop();
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('d MMM yyyy');
    return Scaffold(
      appBar: AppBar(title: const Text('Request leave')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _type,
                  decoration: const InputDecoration(labelText: 'Leave type'),
                  items: [
                    for (final t in _leaveTypes) DropdownMenuItem(value: t, child: Text(t)),
                  ],
                  onChanged: (v) => setState(() => _type = v ?? 'Annual'),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    title: Text(_start == null ? 'Pick dates' : '${fmt.format(_start!)} → ${fmt.format(_end!)}'),
                    trailing: const Icon(Icons.date_range),
                    onTap: _pickRange,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _reason,
                  decoration: const InputDecoration(labelText: 'Reason'),
                  maxLines: 3,
                ),
                const SizedBox(height: 16),
                if (_error != null)
                  Card(
                    color: kDanger600.withValues(alpha: 0.14),
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Text(_error!, style: TextStyle(color: kDanger600)),
                    ),
                  ),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Submit request'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
