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
// HomeShell — light HR-style shell.
//   - Frameless (no app bar) — each child screen renders its own navy header
//     so dashboards/attendance can carry the gradient hero edge-to-edge.
//   - 5-tab flat bottom bar with active yellow dot under the selected icon.
//   - Tabs: Home / Attendance / Leave / Payroll / More
//     (Visits, Tasks, Approvals stay reachable from the Home modules grid.)
// =============================================================================

class _Tab {
  final String label;
  final IconData icon;
  final IconData iconActive;
  const _Tab(this.label, this.icon, this.iconActive);
}

// Order matches the StatefulShellRoute branches in router.dart. Branch
// switching is index-based via navigationShell.goBranch(i), so we no longer
// keep route paths here — that mapping lives entirely in the router.
const _tabs = <_Tab>[
  _Tab('Home',       Icons.home_outlined,                   Icons.home_rounded),
  _Tab('Attendance', Icons.fingerprint,                     Icons.fingerprint),
  _Tab('Leave',      Icons.event_busy_outlined,             Icons.event_busy),
  _Tab('Payroll',    Icons.account_balance_wallet_outlined, Icons.account_balance_wallet),
  _Tab('More',       Icons.grid_view_outlined,              Icons.grid_view_rounded),
];

class HomeShell extends ConsumerWidget {
  // navigationShell is supplied by StatefulShellRoute.indexedStack and owns
  // the per-branch Navigator stacks. We render it as the body so the active
  // branch's widget tree stays mounted while tabs are switched.
  final StatefulNavigationShell navigationShell;
  const HomeShell({super.key, required this.navigationShell});

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selected = navigationShell.currentIndex;
    final tracking = ref.watch(isTrackingProvider);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;
    final name = (user?['fullName'] ?? user?['name'] ?? '?') as String;
    final role = user?['role'] as String?;

    // Hero screens render their OWN navy gradient header (which already adds
    // status-bar padding). Decided by route, not branch index — /punch lives
    // in the Home branch but is NOT a hero screen, so it must not be treated
    // like the dashboard.
    final loc = GoRouterState.of(context).matchedLocation;
    const heroRoutes = {'/today', '/attendance'};
    final heroTab = heroRoutes.contains(loc);

    // Tab-root screens that get the plain white shell AppBar (Leave / Payroll
    // / More). Deeper routes carry their own AppBar inside the child.
    const appBarRoots = {'/leaves', '/payslips', '/more'};
    final showShellAppBar = appBarRoots.contains(loc);

    // Any screen with neither a hero header nor the shell AppBar (e.g.
    // /punch, /notifications) would otherwise render flush under the status
    // bar — wrap those in a SafeArea so their content clears it.
    final needsSafeTop = !heroTab && !showShellAppBar;

    return Scaffold(
      backgroundColor: kBgLight,
      extendBodyBehindAppBar: heroTab,
      appBar: !showShellAppBar
          ? null
          : AppBar(
              backgroundColor: kBgLight,
              elevation: 0,
              titleSpacing: 16,
              title: Text(
                _tabs[selected].label,
                style: GoogleFonts.inter(
                  fontSize: 19, fontWeight: FontWeight.w800,
                  color: kInk900, letterSpacing: -0.3,
                ),
              ),
              actions: [
                IconButton(
                  tooltip: 'Notifications',
                  icon: const Icon(Icons.notifications_none_rounded, size: 22, color: kInk700),
                  onPressed: () { Haptics.light(); context.go('/notifications'); },
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 12, left: 4),
                  child: _AvatarChip(
                    initials: _initials(name),
                    avatarUrl: user?['avatarUrl'] as String?,
                    onTap: () => _openAccountSheet(context, ref, name, role, tracking),
                  ),
                ),
              ],
            ),
      body: needsSafeTop
          ? SafeArea(bottom: false, child: navigationShell)
          : navigationShell,
      bottomNavigationBar: _BottomBar(
        selected: selected,
        onSelect: (i) {
          Haptics.select();
          // Tapping the active tab again pops the branch back to its root
          // (matches iOS/Android system bottom-nav convention).
          navigationShell.goBranch(i, initialLocation: i == selected);
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
    final ok = await BackgroundLocationService.start();
    ref.read(isTrackingProvider.notifier).state = ok;
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not start background tracking')),
      );
    }
  }
}

// =============================================================================
// Flat bottom bar — white surface, navy active label, amber dot beneath.
// =============================================================================

class _BottomBar extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onSelect;
  const _BottomBar({
    required this.selected,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: kSurfaceLight,
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.06),
            blurRadius: 24, offset: const Offset(0, -6),
          ),
        ],
        border: const Border(top: BorderSide(color: kBorderLight)),
      ),
      child: SafeArea(
        top: false,
        child: SizedBox(
          height: 64,
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
    final color = selected ? kNavy900 : kInk500;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(selected ? tab.iconActive : tab.icon, size: 22, color: color),
              const SizedBox(height: 4),
              Text(
                tab.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 10.5,
                  fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                  color: color,
                ),
              ),
              const SizedBox(height: 3),
              AnimatedContainer(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOutCubic,
                width: selected ? 18 : 0,
                height: 3,
                decoration: BoxDecoration(
                  color: kAmber500,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AvatarChip extends StatelessWidget {
  final String initials;
  final String? avatarUrl;
  final VoidCallback onTap;
  const _AvatarChip({required this.initials, required this.avatarUrl, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(17),
      child: Avatar(
        imageUrl: avatarUrl,
        initials: initials,
        size: 34,
        background: kNavy900,
        foreground: kAmber300,
      ),
    );
  }
}
