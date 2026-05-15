import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import 'expense_repository.dart';

const _categories = ['Travel', 'Meal', 'Communication', 'Stationery', 'Fuel', 'Other'];

class NewExpenseScreen extends ConsumerStatefulWidget {
  const NewExpenseScreen({super.key});

  @override
  ConsumerState<NewExpenseScreen> createState() => _NewExpenseScreenState();
}

class _NewExpenseScreenState extends ConsumerState<NewExpenseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _amount = TextEditingController();
  final _description = TextEditingController();
  String _category = 'Travel';
  DateTime _date = DateTime.now();
  File? _receipt;
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 1),
    );
    if (picked != null) setState(() => _date = picked);
  }

  Future<void> _pickReceipt() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera, imageQuality: 70);
    if (picked != null) setState(() => _receipt = File(picked.path));
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() { _busy = true; _error = null; });
    try {
      String? receiptUrl;
      if (_receipt != null) {
        receiptUrl = await ref.read(expenseRepoProvider).uploadReceipt(_receipt!);
      }
      await ref.read(expenseRepoProvider).create(
        date: _date,
        category: _category,
        description: _description.text.trim(),
        amount: num.parse(_amount.text.trim()),
        receiptUrl: receiptUrl,
      );
      ref.invalidate(myExpensesProvider);
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
      appBar: AppBar(title: const Text('Submit expense claim')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                DropdownButtonFormField<String>(
                  initialValue: _category,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: [
                    for (final c in _categories) DropdownMenuItem(value: c, child: Text(c)),
                  ],
                  onChanged: (v) => setState(() => _category = v ?? 'Travel'),
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    title: Text(fmt.format(_date)),
                    trailing: const Icon(Icons.event),
                    onTap: _pickDate,
                  ),
                ),
                const SizedBox(height: 12),
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
                  controller: _description,
                  decoration: const InputDecoration(labelText: 'Description *'),
                  maxLines: 3,
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
                ),
                const SizedBox(height: 12),
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.attachment),
                    title: Text(_receipt == null ? 'Attach receipt photo' : 'Receipt captured'),
                    subtitle: _receipt != null ? Text(_receipt!.uri.pathSegments.last) : null,
                    trailing: const Icon(Icons.camera_alt),
                    onTap: _pickReceipt,
                  ),
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
                      : const Text('Submit claim'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
