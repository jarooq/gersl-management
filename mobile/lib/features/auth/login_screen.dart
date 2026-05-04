import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import 'auth_controller.dart';

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
  String? _error;

  Future<void> _submit() async {
    setState(() { _busy = true; _error = null; });
    try {
      await ref.read(authControllerProvider.notifier)
          .login(_username.text.trim(), _password.text);
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authControllerProvider);
    final loading = auth.isLoading || _busy;

    return Scaffold(
      backgroundColor: kInk50,
      body: Stack(
        children: [
          // Top navy hero band
          Positioned(
            left: 0, right: 0, top: 0,
            height: MediaQuery.of(context).size.height * 0.42,
            child: Container(
              decoration: const BoxDecoration(color: kNavy900),
              child: Stack(
                children: [
                  Positioned(
                    top: -80, right: -60,
                    child: GradientBlob(
                      size: 260,
                      colors: [
                        kMission500.withValues(alpha: 0.45),
                        kNavy700.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                  Positioned(
                    bottom: -100, left: -80,
                    child: GradientBlob(
                      size: 220,
                      colors: [
                        kNavy700.withValues(alpha: 0.7),
                        kNavy900.withValues(alpha: 0.0),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 380),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const SizedBox(height: 32),

                      // Brand crest + name
                      Center(
                        child: Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: kMission500.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: kMission500.withValues(alpha: 0.35),
                            ),
                          ),
                          alignment: Alignment.center,
                          child: const Icon(
                            Icons.volunteer_activism_outlined,
                            color: kMission300,
                            size: 30,
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text(
                        'Global Ehsan Relief',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Sri Lanka · Field Staff App',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          color: kMission300,
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1.0,
                        ),
                      ),

                      const SizedBox(height: 36),

                      // Sign-in card
                      SoftCard(
                        padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Sign in',
                              style: GoogleFonts.inter(
                                fontSize: 18,
                                fontWeight: FontWeight.w800,
                                color: kInk900,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Use your GERSL credentials',
                              style: GoogleFonts.inter(
                                fontSize: 13,
                                color: kInk500,
                              ),
                            ),
                            const SizedBox(height: 18),

                            TextField(
                              controller: _username,
                              decoration: const InputDecoration(
                                labelText: 'Username or email',
                                prefixIcon: Icon(Icons.person_outline, size: 18),
                              ),
                              autofillHints: const [AutofillHints.username],
                              textInputAction: TextInputAction.next,
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _password,
                              obscureText: !_showPassword,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.lock_outline, size: 18),
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _showPassword
                                        ? Icons.visibility_off_outlined
                                        : Icons.visibility_outlined,
                                    size: 18,
                                  ),
                                  onPressed: () => setState(
                                      () => _showPassword = !_showPassword),
                                ),
                              ),
                              autofillHints: const [AutofillHints.password],
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) => loading ? null : _submit(),
                            ),

                            if (_error != null) ...[
                              const SizedBox(height: 14),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: kDanger600.withValues(alpha: 0.08),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: kDanger600.withValues(alpha: 0.25),
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
                                          color: kDanger600,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],

                            const SizedBox(height: 18),
                            GlowButton(
                              label: loading ? 'Signing in…' : 'Sign in',
                              icon: Icons.arrow_forward,
                              loading: loading,
                              onPressed: _submit,
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 18),
                      Center(
                        child: Text(
                          kMissionTagline,
                          style: GoogleFonts.inter(
                            color: kInk500,
                            fontSize: 12,
                          ),
                        ),
                      ),
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
