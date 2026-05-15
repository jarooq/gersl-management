import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../services/friendly_error.dart';
import 'auth_controller.dart';

// =============================================================================
// LoginScreen — modern HR look matching the supplied mockup.
//   Top half (white):  brand mark + illustration
//   Bottom half (navy round-top card): username / password / yellow CTA
//   Footer pill: "Remember me" toggle + "Forgot password?" link
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

  Future<void> _submit() async {
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

    return Scaffold(
      backgroundColor: kBgLight,
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.zero,
          child: ConstrainedBox(
            constraints: BoxConstraints(
              minHeight: MediaQuery.of(context).size.height -
                  MediaQuery.of(context).padding.vertical,
            ),
            child: IntrinsicHeight(
              child: Column(
                children: [
                  // ----- Brand + illustration -------------------------------
                  Padding(
                    padding: const EdgeInsets.fromLTRB(28, 24, 28, 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 56, height: 56,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: kSurfaceLight,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: kBorderLight),
                            boxShadow: [
                              BoxShadow(
                                color: kNavy900.withValues(alpha: 0.08),
                                blurRadius: 14, offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.volunteer_activism,
                              color: kNavy900, size: 26),
                        ),
                      ],
                    ),
                  ),

                  // Decorative illustration block (mockup uses a stylized
                  // person + chart; here we render a friendly composition
                  // entirely in code so we don't ship raster assets).
                  Expanded(
                    flex: 5,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: const _LoginIllustration(),
                    ),
                  ),

                  // ----- Sign-in card ---------------------------------------
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.fromLTRB(24, 26, 24, 28),
                    decoration: const BoxDecoration(
                      color: kNavy900,
                      borderRadius: BorderRadius.only(
                        topLeft: Radius.circular(28),
                        topRight: Radius.circular(28),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.arrow_back, color: Colors.white, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              'Login',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.w800,
                                letterSpacing: -0.3,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 22),

                        _DarkField(
                          controller: _username,
                          hint: 'Username',
                          icon: Icons.person_outline,
                          autofillHints: const [AutofillHints.username],
                        ),
                        const SizedBox(height: 12),
                        _DarkField(
                          controller: _password,
                          hint: 'Password',
                          icon: Icons.lock_outline,
                          obscure: !_showPassword,
                          autofillHints: const [AutofillHints.password],
                          onSubmitted: (_) => loading ? null : _submit(),
                          suffix: GestureDetector(
                            onTap: () => setState(() => _showPassword = !_showPassword),
                            child: Icon(
                              _showPassword
                                  ? Icons.visibility_off_outlined
                                  : Icons.visibility_outlined,
                              color: Colors.white.withValues(alpha: 0.55),
                              size: 18,
                            ),
                          ),
                        ),

                        if (_error != null) ...[
                          const SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 10),
                            decoration: BoxDecoration(
                              color: kDanger600.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: kDanger600.withValues(alpha: 0.40),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.error_outline,
                                    size: 18, color: kDanger600),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: GoogleFonts.inter(
                                      fontSize: 12.5,
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        const SizedBox(height: 18),
                        SizedBox(
                          height: 52,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: kAmber500,
                              foregroundColor: kNavy900,
                              elevation: 0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14),
                              ),
                              textStyle: GoogleFonts.inter(
                                fontSize: 15, fontWeight: FontWeight.w800,
                              ),
                            ),
                            onPressed: loading ? null : _submit,
                            child: loading
                                ? const SizedBox(
                                    width: 18, height: 18,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2.4,
                                      color: kNavy900,
                                    ),
                                  )
                                : const Text('Go to Dashboard'),
                          ),
                        ),

                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            GestureDetector(
                              onTap: () => setState(() => _remember = !_remember),
                              child: Row(
                                children: [
                                  Container(
                                    width: 18, height: 18,
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: _remember ? kAmber500 : Colors.transparent,
                                      borderRadius: BorderRadius.circular(5),
                                      border: Border.all(
                                        color: _remember
                                            ? kAmber500
                                            : Colors.white.withValues(alpha: 0.45),
                                        width: 1.4,
                                      ),
                                    ),
                                    child: _remember
                                        ? const Icon(Icons.check, size: 12, color: kNavy900)
                                        : null,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    'Remember Me',
                                    style: GoogleFonts.inter(
                                      color: Colors.white.withValues(alpha: 0.85),
                                      fontSize: 12.5, fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            // Wired 2026-05-15: opens the request-reset
                            // screen which posts to /api/auth/forgot-password.
                            // Backend has been ready since launch; this UI
                            // was a static label until now.
                            InkWell(
                              onTap: () => context.push('/forgot-password'),
                              borderRadius: BorderRadius.circular(6),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                child: Text(
                                  'Forgot Password?',
                                  style: GoogleFonts.inter(
                                    color: kAmber300,
                                    fontSize: 12.5, fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
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

// -----------------------------------------------------------------------------

class _DarkField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final IconData icon;
  final bool obscure;
  final Widget? suffix;
  final List<String>? autofillHints;
  final ValueChanged<String>? onSubmitted;
  const _DarkField({
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
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.10)),
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
                  color: Colors.white.withValues(alpha: 0.45),
                  fontSize: 14, fontWeight: FontWeight.w500,
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

// -----------------------------------------------------------------------------
// Login illustration — friendly procedural composition, no asset shipping.
// A pastel "person + chart" silhouette using shapes.
// -----------------------------------------------------------------------------

class _LoginIllustration extends StatelessWidget {
  const _LoginIllustration();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return SizedBox(
          width: constraints.maxWidth,
          child: AspectRatio(
            aspectRatio: 1.2,
            child: Stack(
              alignment: Alignment.center,
              children: [
                Positioned(
                  top: 0, right: 0,
                  child: Container(
                    width: 160, height: 110,
                    decoration: BoxDecoration(
                      color: kAmber500.withValues(alpha: 0.20),
                      borderRadius: BorderRadius.circular(16),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 18, left: 18,
                  child: Container(
                    width: 120, height: 90,
                    decoration: BoxDecoration(
                      color: kKpiSkyBg,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          _BarStub(h: 30),
                          const SizedBox(width: 6),
                          _BarStub(h: 50),
                          const SizedBox(width: 6),
                          _BarStub(h: 22),
                          const SizedBox(width: 6),
                          _BarStub(h: 60),
                        ],
                      ),
                    ),
                  ),
                ),
                // Person silhouette
                Container(
                  width: 70, height: 70,
                  decoration: const BoxDecoration(
                    color: kNavy900, shape: BoxShape.circle,
                  ),
                  alignment: Alignment.center,
                  child: const Icon(Icons.person_rounded,
                      color: Colors.white, size: 38),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _BarStub extends StatelessWidget {
  final double h;
  const _BarStub({required this.h});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 14,
      height: h,
      decoration: BoxDecoration(
        color: kNavy900.withValues(alpha: 0.65),
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}
