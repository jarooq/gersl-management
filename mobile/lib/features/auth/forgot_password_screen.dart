// =============================================================================
// Forgot password — step 1 of 2.
// User enters their email; we POST /api/auth/forgot-password which returns a
// generic success message regardless of whether the address exists (security
// best practice). We always show the same "if an account exists, a link
// has been sent" confirmation so attackers can't enumerate users from this
// screen. The reset link in the email opens the web app's /reset-password
// page where the token is consumed.
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

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _busy = false;
  bool _sent = false;
  String? _error;

  @override
  void dispose() { _email.dispose(); super.dispose(); }

  Future<void> _submit() async {
    final email = _email.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      // Bare Dio — this endpoint is public and we don't want the auth
      // interceptor adding a stale Bearer token.
      final dio = Dio(BaseOptions(
        baseUrl: Env.apiBaseUrl,
        headers: {'Content-Type': 'application/json'},
        connectTimeout: const Duration(seconds: 10),
        receiveTimeout: const Duration(seconds: 20),
      ));
      await dio.post('/auth/forgot-password', data: {'email': email});
      if (!mounted) return;
      setState(() => _sent = true);
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
          onPressed: () => context.pop(),
        ),
        title: Text(
          'Forgot password',
          style: GoogleFonts.inter(
            fontSize: 17, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: _sent ? _buildSent() : _buildForm(),
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
          'Reset your password',
          style: GoogleFonts.inter(
            fontSize: 22, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Enter the email associated with your GERSL account. We\'ll send '
          'you a link to set a new password.',
          style: GoogleFonts.inter(fontSize: 13, color: kInk500, height: 1.4),
        ),
        const SizedBox(height: 24),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          textInputAction: TextInputAction.send,
          autocorrect: false,
          decoration: InputDecoration(
            labelText: 'Email',
            hintText: 'you@example.org',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
            prefixIcon: const Icon(Icons.mail_outline),
          ),
          onSubmitted: (_) => _busy ? null : _submit(),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          ErrorBox(message: _error!),
        ],
        const SizedBox(height: 20),
        GlowButton(
          label: _busy ? 'Sending…' : 'Send reset link',
          icon: Icons.send_outlined,
          loading: _busy,
          onPressed: _busy ? null : _submit,
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: _busy ? null : () => context.pop(),
          child: const Text('Back to sign in'),
        ),
      ],
    );
  }

  Widget _buildSent() {
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
          child: const Icon(Icons.mark_email_read_outlined, color: kSuccess600, size: 32),
        ),
        const SizedBox(height: 16),
        Text(
          'Check your email',
          style: GoogleFonts.inter(
            fontSize: 20, fontWeight: FontWeight.w800, color: kInk900,
          ),
        ),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Text(
            'If an account with that email exists, a password reset link is '
            'on its way. The link expires in one hour.',
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(fontSize: 13, color: kInk500, height: 1.4),
          ),
        ),
        const SizedBox(height: 24),
        GlowButton(
          label: 'Back to sign in',
          icon: Icons.login,
          onPressed: () => context.go('/login'),
        ),
        const SizedBox(height: 10),
        TextButton(
          onPressed: () => setState(() => _sent = false),
          child: const Text('Re-send to a different email'),
        ),
      ],
    );
  }
}
