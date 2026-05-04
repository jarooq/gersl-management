import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../app/widgets.dart';
import '../../services/background_location_service.dart';
import '../../services/location_tracker.dart';
import '../../services/token_store.dart';
import '../auth/auth_controller.dart';

// =============================================================================
// HomeShell — modern shell:
//   - Slim app bar with brand mark + title + avatar (avatar opens AccountSheet)
//   - 5-tab floating-pill bottom nav with mission-amber active indicator
//   - Haptic feedback on tab change
// =============================================================================

class _Tab {
  final String label;
  final IconData icon;
  final IconData iconActive;
  final String route;
  const _Tab(this.label, this.icon, this.iconActive, this.route);
}

const _tabs = <_Tab>[
  _Tab('Home',      Icons.home_outlined,         Icons.home_rounded,            '/today'),
  _Tab('Visits',    Icons.location_on_outlined,  Icons.location_on,             '/visits'),
  _Tab('Tasks',     Icons.checklist_outlined,    Icons.checklist,               '/tasks'),
  _Tab('Approvals', Icons.fact_check_outlined,   Icons.fact_check,              '/approvals'),
  _Tab('More',      Icons.grid_view_outlined,    Icons.grid_view_rounded,       '/more'),
];

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = GoRouterState.of(context).matchedLocation;
    final idx = _tabs.indexWhere((t) => loc.startsWith(t.route));
    final selected = idx == -1 ? 0 : idx;
    final tracking = ref.watch(isTrackingProvider);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;
    final name = (user?['fullName'] ?? user?['name'] ?? '?') as String;
    final role = user?['role'] as String?;

    return Scaffold(
      backgroundColor: kInk50,
      extendBody: true, // so the floating nav can sit over the content
      appBar: AppBar(
        titleSpacing: 16,
        toolbarHeight: 56,
        title: Row(
          children: [
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(color: kNavy900, borderRadius: BorderRadius.circular(8)),
              alignment: Alignment.center,
              child: const Icon(Icons.volunteer_activism_outlined, color: kMission300, size: 16),
            ),
            const SizedBox(width: 10),
            Text(
              _tabs[selected].label,
              style: GoogleFonts.inter(
                fontSize: 18, fontWeight: FontWeight.w800,
                color: kInk900, letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Notifications',
            icon: const Icon(Icons.notifications_outlined, color: kInk700, size: 22),
            onPressed: () { Haptics.light(); context.go('/notifications'); },
          ),
          // Avatar → opens AccountSheet
          Padding(
            padding: const EdgeInsets.only(right: 12, left: 4),
            child: InkWell(
              onTap: () => _openAccountSheet(context, ref, name, role, tracking),
              borderRadius: BorderRadius.circular(16),
              child: Container(
                width: 32, height: 32,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: kNavy900, borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  _initials(name),
                  style: GoogleFonts.inter(
                    color: kMission300, fontSize: 12, fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 84), // leave room for floating nav
          child: child,
        ),
      ),
      bottomNavigationBar: _FloatingBottomBar(
        selected: selected,
        onSelect: (i) {
          Haptics.select();
          context.go(_tabs[i].route);
        },
      ),
    );
  }

  void _openAccountSheet(BuildContext context, WidgetRef ref, String name, String? role, bool tracking) {
    Haptics.light();
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.42),
      builder: (_) => AccountSheet(
        name: name,
        role: role,
        initials: _initials(name),
        tracking: tracking,
        onToggleTracking: () => _toggleTracking(context, ref, tracking),
        onSignOut: () async {
          await BackgroundLocationService.stop();
          await ref.read(locationTrackerProvider).stop();
          ref.read(isTrackingProvider.notifier).state = false;
          await ref.read(authControllerProvider.notifier).logout();
        },
      ),
    );
  }

  Future<void> _toggleTracking(BuildContext context, WidgetRef ref, bool tracking) async {
    final running = await BackgroundLocationService.isRunning();
    if (running) {
      await BackgroundLocationService.stop();
      await ref.read(locationTrackerProvider).stop();
      ref.read(isTrackingProvider.notifier).state = false;
      return;
    }
    final foregroundOk = await ref.read(locationTrackerProvider).start();
    if (!foregroundOk) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Location permission denied')),
        );
      }
      return;
    }
    final access = await TokenStore().readAccess();
    if (access == null) {
      ref.read(isTrackingProvider.notifier).state = false;
      return;
    }
    final ok = await BackgroundLocationService.start(accessToken: access);
    ref.read(isTrackingProvider.notifier).state = ok;
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not start background tracking')),
      );
    }
  }
}

// =============================================================================
// Floating-pill bottom navigation bar.
// =============================================================================

class _FloatingBottomBar extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onSelect;
  const _FloatingBottomBar({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(28),
            border: Border.all(color: kInk100),
            boxShadow: [
              BoxShadow(
                color: kNavy900.withValues(alpha: 0.10),
                blurRadius: 22, offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Row(
            children: [
              for (var i = 0; i < _tabs.length; i++)
                Expanded(
                  child: _BottomBarItem(
                    tab: _tabs[i],
                    selected: i == selected,
                    onTap: () => onSelect(i),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _BottomBarItem extends StatelessWidget {
  final _Tab tab;
  final bool selected;
  final VoidCallback onTap;
  const _BottomBarItem({required this.tab, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      borderRadius: BorderRadius.circular(22),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeOutCubic,
          padding: EdgeInsets.symmetric(
            horizontal: selected ? 8 : 4, vertical: 8,
          ),
          decoration: BoxDecoration(
            color: selected ? kNavy900 : Colors.transparent,
            borderRadius: BorderRadius.circular(22),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                selected ? tab.iconActive : tab.icon,
                size: 18,
                color: selected ? kMission300 : kInk500,
              ),
              if (selected) ...[
                const SizedBox(width: 6),
                Flexible(
                  child: Text(
                    tab.label,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.inter(
                      color: Colors.white, fontSize: 11.5,
                      fontWeight: FontWeight.w800, letterSpacing: 0.1,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
