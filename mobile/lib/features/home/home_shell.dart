import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../services/background_location_service.dart';
import '../../services/location_tracker.dart';
import '../../services/token_store.dart';

// =============================================================================
// HomeShell — modern bottom-tab scaffold (no drawer).
//   5 tabs: Today · Visits · Tasks · Approvals · More
//   The "More" tab is a card-grid hub for everything else.
// =============================================================================

class _Tab {
  final String label;
  final IconData icon;
  final IconData iconActive;
  final String route;
  const _Tab(this.label, this.icon, this.iconActive, this.route);
}

const _tabs = <_Tab>[
  _Tab('Today',     Icons.today_outlined,        Icons.today,            '/today'),
  _Tab('Visits',    Icons.location_on_outlined,  Icons.location_on,      '/visits'),
  _Tab('Tasks',     Icons.checklist_outlined,    Icons.checklist,        '/tasks'),
  _Tab('Approvals', Icons.fact_check_outlined,   Icons.fact_check,       '/approvals'),
  _Tab('More',      Icons.grid_view_outlined,    Icons.grid_view_rounded,'/more'),
];

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = GoRouterState.of(context).matchedLocation;
    final idx = _tabs.indexWhere((t) => loc.startsWith(t.route));
    final selected = idx == -1 ? 0 : idx;
    final tracking = ref.watch(isTrackingProvider);

    return Scaffold(
      backgroundColor: kInk50,
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                color: kNavy900,
                borderRadius: BorderRadius.circular(8),
              ),
              alignment: Alignment.center,
              child: const Icon(
                Icons.volunteer_activism_outlined,
                color: kMission300,
                size: 16,
              ),
            ),
            const SizedBox(width: 10),
            Text(
              _tabs[selected].label,
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w800,
                color: kInk900,
                letterSpacing: -0.3,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: tracking ? 'Stop GPS tracking' : 'Start GPS tracking',
            icon: Icon(
              tracking ? Icons.gps_fixed : Icons.gps_off,
              color: tracking ? kSuccess600 : kInk500,
            ),
            onPressed: () => _toggleTracking(context, ref, tracking),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: child,
      bottomNavigationBar: _BottomBar(
        selected: selected,
        onSelect: (i) => context.go(_tabs[i].route),
      ),
    );
  }

  Future<void> _toggleTracking(
      BuildContext context, WidgetRef ref, bool tracking) async {
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

// -----------------------------------------------------------------------------
// Bottom bar — custom built so we can render a mission-amber pill behind the
// active label, matching the admin-web sidebar accent.
// -----------------------------------------------------------------------------

class _BottomBar extends StatelessWidget {
  final int selected;
  final ValueChanged<int> onSelect;
  const _BottomBar({required this.selected, required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: kInk100, width: 1)),
        boxShadow: [
          BoxShadow(
            color: kNavy900.withValues(alpha: 0.04),
            blurRadius: 14, offset: const Offset(0, -3),
          ),
        ],
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
  const _BottomBarItem({
    required this.tab,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Active indicator pill
            AnimatedContainer(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOutCubic,
              padding: EdgeInsets.symmetric(
                horizontal: selected ? 14 : 0,
                vertical: 6,
              ),
              decoration: BoxDecoration(
                color: selected
                    ? kMission500.withValues(alpha: 0.16)
                    : Colors.transparent,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Icon(
                selected ? tab.iconActive : tab.icon,
                size: 22,
                color: selected ? kNavy900 : kInk500,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              tab.label,
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                color: selected ? kNavy900 : kInk500,
                letterSpacing: 0.1,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
