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
  final String route;
  const _Tab(this.label, this.icon, this.iconActive, this.route);
}

const _tabs = <_Tab>[
  _Tab('Home',       Icons.home_outlined,           Icons.home_rounded,           '/today'),
  _Tab('Attendance', Icons.fingerprint,             Icons.fingerprint,            '/attendance'),
  _Tab('Leave',      Icons.event_busy_outlined,     Icons.event_busy,             '/leaves'),
  _Tab('Payroll',    Icons.account_balance_wallet_outlined, Icons.account_balance_wallet, '/payslips'),
  _Tab('More',       Icons.grid_view_outlined,      Icons.grid_view_rounded,      '/more'),
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

    // Tabs that render their own navy gradient hero header (Home, Attendance).
    // For these, we hide the white AppBar and let the body fill from the top.
    final heroTab = selected == 0 || selected == 1;

    return Scaffold(
      backgroundColor: kBgLight,
      extendBodyBehindAppBar: heroTab,
      appBar: heroTab
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
                    onTap: () => _openAccountSheet(context, ref, name, role, tracking),
                  ),
                ),
              ],
            ),
      body: child,
      bottomNavigationBar: _BottomBar(
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
  final VoidCallback onTap;
  const _AvatarChip({required this.initials, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: 34, height: 34,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: kNavy900,
          borderRadius: BorderRadius.circular(11),
        ),
        child: Text(
          initials,
          style: GoogleFonts.inter(
            color: kAmber300, fontSize: 12, fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
