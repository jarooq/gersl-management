// =============================================================================
// Reset password — step 2 of 2.
// Reached when the user opens the link from the reset email on their phone.
// Token comes in via the route's query parameter (?token=…). User picks a new
// password and we POST /api/auth/reset-password. On success we route back to
// /login so the user signs in with the new password.
// =============================================================================

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/env.dart';
import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/friendly_error.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String? token;
  const ResetPasswordScreen({super.key, this.token});

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  late final TextEditingController _token;
  final _password = TextEditingController();
  final _confirm  = TextEditingController();
  bool _busy = false;
  bool _done = false;
  bool _showPw = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _token = TextEditingController(text: widget.token ?? '');
  }

  @override
  void dispose() {
    _token.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  String? _validate() {
    if (_token.text.trim().isEmpty) return 'Reset token is required.';
    if (_password.text.length < 8)  return 'Password must be at least 8 characters.';
    if (!RegExp(r'[A-Z]').hasMatch(_password.text)) return 'Include an uppercase letter.';
    if (!RegExp(r'[a-z]').hasMatch(_password.text)) return 'Include a lowercase letter.';
    if (!RegExp(r'[0-9]').hasMatch(_password.text)) return 'Include a number.';
    if (!RegExp(r'[!@#$%^&*]').hasMatch(_password.text)) return 'Include a special character (!@#\$%^&*).';
    if (_password.text != _confirm.text) return 'Passwords do not match.';
    return null;
  }

  Future<void> _submit() async {
    final v = _validate();
    if (v != null) { setState(() => _error = v); return; }
    setState(() { _busy = true; _error = null; });
    try {
      final dio = Dio(BaseOptions(
        baseUrl: Env.apiBaseUrl,
        headers: {'Content-Type': 'application/json'},
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 20),
      ));
      await dio.post('/auth/reset-password', data: {
        'token': _token.text.trim(),
        'newPassword': _password.text,
      });
      if (!mounted) return;
      setState(() => _done = true);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBgLight,
      appBar: AppBar(
        backgroundColor: kBgLight,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: kInk900),
          onPressed: () => context.go('/login'),
        ),
        title: Text(
          'Set new password',
          style: GoogleFonts.inter(
            fontSize: 17, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: _done ? _buildDone() : _buildForm(),
        ),
      ),
    );
  }

  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 8),
        Text(
          'Choose a new password',
          style: GoogleFonts.inter(
            fontSize: 22, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Min 8 characters with uppercase, lowercase, number, and one of !@#\$%^&*.',
          style: GoogleFonts.inter(fontSize: 12.5, color: kInk500, height: 1.4),
        ),
        const SizedBox(height: 20),
        // Token field — pre-filled from query param, editable so the user
        // can paste it manually if their email client mangled the deep link.
        TextField(
          controller: _token,
          decoration: InputDecoration(
            labelText: 'Reset token',
            hintText: 'Paste from email',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            prefixIcon: const Icon(Icons.key_outlined),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _password,
          obscureText: !_showPw,
          textInputAction: TextInputAction.next,
          decoration: InputDecoration(
            labelText: 'New password',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            prefixIcon: const Icon(Icons.lock_outline),
            suffixIcon: IconButton(
              icon: Icon(_showPw ? Icons.visibility_off : Icons.visibility),
              onPressed: () => setState(() => _showPw = !_showPw),
            ),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _confirm,
          obscureText: !_showPw,
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            labelText: 'Confirm password',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            prefixIcon: const Icon(Icons.lock_outline),
          ),
          onSubmitted: (_) => _busy ? null : _submit(),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          ErrorBox(message: _error!),
        ],
        const SizedBox(height: 20),
        GlowButton(
          label: _busy ? 'Updating…' : 'Update password',
          icon: Icons.check_circle_outline,
          loading: _busy,
          onPressed: _busy ? null : _submit,
        ),
      ],
    );
  }

  Widget _buildDone() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        const SizedBox(height: 24),
        Container(
          width: 64, height: 64,
          decoration: BoxDecoration(
            color: kSuccess600.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle_outline, color: kSuccess600, size: 32),
        ),
        const SizedBox(height: 16),
        Text(
          'Password updated',
          style: GoogleFonts.inter(
            fontSize: 20, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'You can now sign in with your new password.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: kInk500, height: 1.4),
          ),
        ),
        const SizedBox(height: 24),
        GlowButton(
          label: 'Sign in',
          icon: Icons.login,
          onPressed: () => context.go('/login'),
        ),
      ],
    );
  }
}
