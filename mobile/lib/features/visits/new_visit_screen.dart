import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import 'visit_repository.dart';

class NewVisitScreen extends ConsumerStatefulWidget {
  const NewVisitScreen({super.key});

  @override
  ConsumerState<NewVisitScreen> createState() => _NewVisitScreenState();
}

class _NewVisitScreenState extends ConsumerState<NewVisitScreen> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  final _purpose = TextEditingController();
  final _beneficiaries = TextEditingController();
  final _notes = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _purpose.dispose();
    _beneficiaries.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<Position?> _getLocation() async {
    final ok = await Permission.locationWhenInUse.request();
    if (!ok.isGranted) return null;
    if (!await Geolocator.isLocationServiceEnabled()) return null;
    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high),
    );
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _busy = true; _error = null; });
    try {
      final pos = await _getLocation();
      await ref.read(visitRepoProvider).create(
        customerName: _name.text.trim(),
        purpose: _purpose.text.trim(),
        latitude: pos?.latitude,
        longitude: pos?.longitude,
        beneficiariesServed: int.tryParse(_beneficiaries.text.trim()),
        notes: _notes.text.trim(),
      );
      ref.invalidate(myVisitsProvider);
      if (mounted) context.pop();
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Log a visit')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _name,
                  decoration: const InputDecoration(labelText: 'Customer / family name *'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _purpose,
                  decoration: const InputDecoration(labelText: 'Purpose *'),
                  maxLines: 2,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _beneficiaries,
                  decoration: const InputDecoration(labelText: 'Beneficiaries served'),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _notes,
                  decoration: const InputDecoration(labelText: 'Notes'),
                  maxLines: 3,
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
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Text('Save visit'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
