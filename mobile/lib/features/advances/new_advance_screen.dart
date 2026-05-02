import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'advance_repository.dart';

class NewAdvanceScreen extends ConsumerStatefulWidget {
  const NewAdvanceScreen({super.key});

  @override
  ConsumerState<NewAdvanceScreen> createState() => _NewAdvanceScreenState();
}

class _NewAdvanceScreenState extends ConsumerState<NewAdvanceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _reason = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _busy = true; _error = null; });
    try {
      final amount = num.parse(_amount.text.trim());
      await ref.read(advanceRepoProvider).create(amount: amount, reason: _reason.text.trim());
      ref.invalidate(advancesProvider);
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
      appBar: AppBar(title: const Text('Request salary advance')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _amount,
                  decoration: const InputDecoration(labelText: 'Amount (Rs) *', prefixText: 'Rs '),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  validator: (v) {
                    final n = num.tryParse((v ?? '').trim());
                    if (n == null || n <= 0) return 'Enter a positive amount';
                    return null;
                  },
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
