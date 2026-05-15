import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import 'auth_controller.dart';

// =============================================================================
// LoginScreen — "Mission Hero" redesign (2026-05-15).
//
// Full-screen navy gradient with the brand mark + mission tagline, then a
// frosted-glass form card. Matches the visual language of the web admin's
// left mission panel (Login.jsx) so staff who use both surfaces feel they're
// in the same product.
//
// Decorative blurred amber + sky "blobs" in the corners create depth on the
// flat navy without shipping an asset. Form lives in a translucent white
// glass card with a backdrop blur — looks premium on iOS and Android.
// =============================================================================

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _username = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  bool _showPassword = false;
  bool _remember = true;
  String? _error;

  @override
  void dispose() {
    _username.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_username.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Enter your username and password.');
      return;
    }
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(authControllerProvider.notifier)
          .login(_username.text.trim(), _password.text);
    } catch (e) {
      if (mounted) setState(() => _error = friendlyError(e));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final loading = auth.isLoading || _busy;
    final viewInsets = MediaQuery.of(context).viewInsets.bottom;

    return Scaffold(
      backgroundColor: kNavy900,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // -- Navy gradient base + decorative blurred colour blobs --
          const _MissionBackdrop(),

          // -- Scrolling foreground content --
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + viewInsets),
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.vertical -
                      48 -
                      viewInsets,
                ),
                // IntrinsicHeight lets the Spacers below actually expand —
                // without it a Column inside a scroll view gets unbounded
                // height and Spacer collapses to zero, pinning everything to
                // the top (the previous build had this bug). The two Spacers
                // (2 : 3 weighting) centre the brand+form+footer cluster a
                // touch above the optical centre.
                child: IntrinsicHeight(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Spacer(flex: 2),
                      _BrandLockup(),
                      const SizedBox(height: 22),
                      _GlassFormCard(
                        username: _username,
                        password: _password,
                        showPassword: _showPassword,
                        onTogglePassword: () =>
                            setState(() => _showPassword = !_showPassword),
                        remember: _remember,
                        onToggleRemember: () =>
                            setState(() => _remember = !_remember),
                        error: _error,
                        loading: loading,
                        onSubmit: loading ? null : _submit,
                      ),
                      const SizedBox(height: 16),
                      _AddressFooter(),
                      const Spacer(flex: 3),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Navy gradient + blurred decorative blobs.
// =============================================================================

class _MissionBackdrop extends StatelessWidget {
  const _MissionBackdrop();

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Stack(
        children: [
          // Gradient base — slightly lighter at top so the brand mark pops.
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [kNavy800, kNavy900, Color(0xFF0A1428)],
                stops: [0.0, 0.55, 1.0],
              ),
            ),
          ),
          // Amber glow top-right — the brand accent. Heavy blur so it reads
          // as ambient light rather than a hard shape.
          Positioned(
            top: -120,
            right: -90,
            child: _Blob(
              size: 320,
              colors: [
                kAmber500.withValues(alpha: 0.32),
                kAmber500.withValues(alpha: 0.0),
              ],
            ),
          ),
          // Cool sky glow bottom-left — counterweight in a complementary tone.
          Positioned(
            bottom: -120,
            left: -90,
            child: _Blob(
              size: 360,
              colors: [
                const Color(0xFF2A6BD8).withValues(alpha: 0.28),
                const Color(0xFF2A6BD8).withValues(alpha: 0.0),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Blob extends StatelessWidget {
  final double size;
  final List<Color> colors;
  const _Blob({required this.size, required this.colors});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: ImageFiltered(
        imageFilter: ImageFilter.blur(sigmaX: 80, sigmaY: 80),
        child: Container(
          width: size, height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: RadialGradient(colors: colors, stops: const [0.0, 1.0]),
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Brand lockup — logo tile + organisation name.
// =============================================================================

class _BrandLockup extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 54, height: 54,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.10),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.18)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Image.asset(
              'assets/icon/icon_foreground.png',
              fit: BoxFit.contain,
              // Fallback if the asset is missing in dev — still renders
              // something instead of throwing.
              errorBuilder: (_, _, _) => const Icon(
                Icons.volunteer_activism, color: Colors.white, size: 24,
              ),
            ),
          ),
        ),
        const SizedBox(width: 14),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'GERSL',
              style: GoogleFonts.inter(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w800,
                letterSpacing: 1.4,
              ),
            ),
            Text(
              'Global Ehsan Relief · Sri Lanka',
              style: GoogleFonts.inter(
                color: Colors.white.withValues(alpha: 0.70),
                fontSize: 11.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// =============================================================================
// Frosted-glass form card.
// =============================================================================

class _GlassFormCard extends StatelessWidget {
  final TextEditingController username;
  final TextEditingController password;
  final bool showPassword;
  final VoidCallback onTogglePassword;
  final bool remember;
  final VoidCallback onToggleRemember;
  final String? error;
  final bool loading;
  final VoidCallback? onSubmit;
  const _GlassFormCard({
    required this.username,
    required this.password,
    required this.showPassword,
    required this.onTogglePassword,
    required this.remember,
    required this.onToggleRemember,
    required this.error,
    required this.loading,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(22),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(22),
            border: Border.all(
              color: Colors.white.withValues(alpha: 0.18),
              width: 1,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Welcome back',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 16),
              _GlassField(
                controller: username,
                hint: 'Username',
                icon: Icons.person_outline,
                autofillHints: const [AutofillHints.username],
              ),
              const SizedBox(height: 10),
              _GlassField(
                controller: password,
                hint: 'Password',
                icon: Icons.lock_outline,
                obscure: !showPassword,
                autofillHints: const [AutofillHints.password],
                onSubmitted: (_) => loading ? null : onSubmit?.call(),
                suffix: GestureDetector(
                  onTap: onTogglePassword,
                  behavior: HitTestBehavior.opaque,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Icon(
                      showPassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: Colors.white.withValues(alpha: 0.55),
                      size: 18,
                    ),
                  ),
                ),
              ),
              if (error != null) ...[
                const SizedBox(height: 12),
                _InlineError(message: error!),
              ],
              const SizedBox(height: 16),
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: kAmber500,
                    foregroundColor: kNavy900,
                    elevation: 0,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  onPressed: loading ? null : onSubmit,
                  child: loading
                      ? const SizedBox(
                          width: 18, height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2.4, color: kNavy900,
                          ),
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Sign in',
                              style: GoogleFonts.inter(
                                fontSize: 15, fontWeight: FontWeight.w800,
                                letterSpacing: -0.2,
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Icon(Icons.arrow_forward, size: 18),
                          ],
                        ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  GestureDetector(
                    onTap: onToggleRemember,
                    behavior: HitTestBehavior.opaque,
                    child: Row(
                      children: [
                        Container(
                          width: 17, height: 17,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: remember ? kAmber500 : Colors.transparent,
                            borderRadius: BorderRadius.circular(5),
                            border: Border.all(
                              color: remember
                                  ? kAmber500
                                  : Colors.white.withValues(alpha: 0.55),
                              width: 1.4,
                            ),
                          ),
                          child: remember
                              ? const Icon(Icons.check, size: 11, color: kNavy900)
                              : null,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Remember me',
                          style: GoogleFonts.inter(
                            color: Colors.white.withValues(alpha: 0.80),
                            fontSize: 12, fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  InkWell(
                    onTap: () => context.push('/forgot-password'),
                    borderRadius: BorderRadius.circular(6),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 4, vertical: 2),
                      child: Text(
                        'Forgot password?',
                        style: GoogleFonts.inter(
                          color: kAmber300,
                          fontSize: 12, fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Translucent input on glass — no fill, white text + icon, thin border.
// =============================================================================

class _GlassField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final Widget? suffix;
  final List<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;
  const _GlassField({
    required this.controller,
    required this.hint,
    required this.icon,
    this.obscure = false,
    this.suffix,
    this.autofillHints,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.white.withValues(alpha: 0.55)),
          const SizedBox(width: 10),
          Expanded(
            child: TextField(
              controller: controller,
              obscureText: obscure,
              autofillHints: autofillHints,
              onSubmitted: onSubmitted,
              cursorColor: kAmber500,
              style: GoogleFonts.inter(
                color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  color: Colors.white.withValues(alpha: 0.42),
                  fontSize: 13.5, fontWeight: FontWeight.w500,
                ),
                isCollapsed: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                fillColor: Colors.transparent,
                filled: false,
              ),
            ),
          ),
          if (suffix != null) suffix!,
        ],
      ),
    );
  }
}

// =============================================================================
// Inline error pill — sits above the CTA inside the glass card.
// =============================================================================

class _InlineError extends StatelessWidget {
  final String message;
  const _InlineError({required this.message});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: kDanger600.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: kDanger600.withValues(alpha: 0.45)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, size: 16, color: Colors.white),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: GoogleFonts.inter(
                fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// =============================================================================
// Footer — address + copyright. Tiny so it doesn't compete with the form.
// =============================================================================

class _AddressFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Text(
        '© ${DateTime.now().year} Global Ehsan Relief',
        style: GoogleFonts.inter(
          color: Colors.white.withValues(alpha: 0.40),
          fontSize: 10.5,
        ),
      ),
    );
  }
}
