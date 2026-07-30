import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/auth_controller.dart';
import '../features/distribution/distribution_repository.dart';
import '../services/scan_queue.dart';
import 'router.dart';
import 'theme.dart';

class GerslApp extends ConsumerStatefulWidget {
  const GerslApp({super.key});

  @override
  ConsumerState<GerslApp> createState() => _GerslAppState();
}

class _GerslAppState extends ConsumerState<GerslApp>
    with WidgetsBindingObserver {
  // Concurrency guard — a slow flush must not overlap a second one fired by
  // a quick background/foreground bounce.
  bool _flushing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // One flush attempt shortly after startup too (cold boot counts as
    // "coming to the foreground"). Post-frame so auth state has a chance to
    // restore from secure storage first.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // ignore: discarded_futures
      _flushScanQueue();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // ignore: discarded_futures
      _flushScanQueue();
    }
  }

  /// Replay any offline distribution scans when the app comes to the
  /// foreground and the user is signed in. Silent + best-effort: failures
  /// leave rows queued for the next resume or a manual "Sync now".
  Future<void> _flushScanQueue() async {
    if (_flushing) return;
    _flushing = true;
    try {
      // On a true cold-boot the post-frame callback fires while
      // authControllerProvider is still AsyncLoading (secure storage read).
      // Wait for the bootstrap to settle so yesterday's queued scans don't
      // sit untouched until the next background/foreground bounce.
      final auth = await ref.read(authControllerProvider.future);
      if (!auth.isAuthenticated) return;
      final pending = await ref.read(scanQueueProvider).count();
      if (pending > 0) {
        await ref.read(distributionRepoProvider).flushQueue();
      }
    } catch (_) {
      // Never let a sync failure surface at app level.
    } finally {
      _flushing = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'GERSL',
      theme: gerslLightTheme,
      darkTheme: gerslDarkTheme,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      routerConfig: router,
    );
  }
}
