import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../app/theme.dart';
import '../../services/background_location_service.dart';
import '../../services/location_tracker.dart';
import '../../services/token_store.dart';
import '../auth/auth_controller.dart';

class _NavItem {
  final String label;
  final IconData icon;
  final String route;
  const _NavItem(this.label, this.icon, this.route);
}

const _bottomTabs = <_NavItem>[
  _NavItem('Today',  Icons.today_outlined,        '/today'),
  _NavItem('Visits', Icons.location_on_outlined,  '/visits'),
  _NavItem('Tasks',  Icons.checklist_outlined,    '/tasks'),
];

const _drawerSections = <(String, List<_NavItem>)>[
  ('Field work', <_NavItem>[
    _NavItem('Today',           Icons.today_outlined,           '/today'),
    _NavItem('My visits',       Icons.location_on_outlined,     '/visits'),
    _NavItem('My tasks',        Icons.checklist_outlined,       '/tasks'),
    _NavItem('Movements',       Icons.directions_car_outlined,  '/movements'),
    _NavItem('Fuel claims',     Icons.local_gas_station,        '/fuel-claims'),
  ]),
  ('HR & finance', <_NavItem>[
    _NavItem('Leave',           Icons.event_busy_outlined,      '/leaves'),
    _NavItem('Expenses',        Icons.receipt_long_outlined,    '/expenses'),
    _NavItem('Shifts',          Icons.calendar_view_week,       '/shifts'),
    _NavItem('Salary advances', Icons.attach_money,             '/advances'),
    _NavItem('Payslips',        Icons.payments_outlined,        '/payslips'),
  ]),
  ('Other', <_NavItem>[
    _NavItem('Approvals',       Icons.fact_check_outlined,      '/approvals'),
    _NavItem('Announcements',   Icons.campaign_outlined,        '/announcements'),
  ]),
];

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = GoRouterState.of(context).matchedLocation;
    final bottomIdx = _bottomTabs.indexWhere((t) => loc.startsWith(t.route));
    final tracking = ref.watch(isTrackingProvider);
    final user = ref.watch(authControllerProvider).valueOrNull?.user;

    return Scaffold(
      appBar: AppBar(
        title: Text(_bottomTabs[bottomIdx == -1 ? 0 : bottomIdx].label),
        actions: [
          IconButton(
            tooltip: tracking ? 'Stop tracking' : 'Start tracking',
            icon: Icon(
              tracking ? Icons.gps_fixed : Icons.gps_off,
              color: tracking ? kSuccess600 : kInk500,
            ),
            onPressed: () => _toggleTracking(context, ref, tracking),
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: kInk500),
            tooltip: 'Sign out',
            onPressed: () async {
              await BackgroundLocationService.stop();
              await ref.read(locationTrackerProvider).stop();
              ref.read(isTrackingProvider.notifier).state = false;
              await ref.read(authControllerProvider.notifier).logout();
            },
          ),
          const SizedBox(width: 4),
        ],
      ),
      drawer: _GerslDrawer(loc: loc, user: user),
      body: child,
      bottomNavigationBar: NavigationBar(
        height: 64,
        selectedIndex: bottomIdx == -1 ? 0 : bottomIdx,
        onDestinationSelected: (i) => context.go(_bottomTabs[i].route),
        destinations: [
          for (final t in _bottomTabs)
            NavigationDestination(icon: Icon(t.icon), label: t.label),
        ],
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

class _GerslDrawer extends StatelessWidget {
  final String loc;
  final Map<String, dynamic>? user;
  const _GerslDrawer({required this.loc, required this.user});

  @override
  Widget build(BuildContext context) {
    final name = (user?['fullName'] ?? user?['name'] ?? '?') as String;
    final role = user?['role'] as String?;
    final initials = _initials(name);
    return Drawer(
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Brand header — navy band with mission-amber accent.
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
              decoration: const BoxDecoration(color: kNavy900),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color: kMission500.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                              color: kMission500.withValues(alpha: 0.30)),
                        ),
                        alignment: Alignment.center,
                        child: Text(
                          initials,
                          style: GoogleFonts.inter(
                            color: kMission300,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              name,
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (role != null)
                              Text(
                                role,
                                style: GoogleFonts.inter(
                                  color: kInk200,
                                  fontSize: 12,
                                ),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Text(
                    'Global Ehsan Relief · Sri Lanka',
                    style: GoogleFonts.inter(
                      color: kMission300,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.6,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Serving with compassion since 2015',
                    style: GoogleFonts.inter(
                      color: kInk200,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // Sections
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  for (final (heading, items) in _drawerSections) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 14, 20, 6),
                      child: Text(
                        heading.toUpperCase(),
                        style: GoogleFonts.inter(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.0,
                          color: kInk500,
                        ),
                      ),
                    ),
                    for (final item in items)
                      _DrawerTile(item: item, currentPath: loc),
                  ],
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+')).where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts.first.characters.first.toUpperCase();
    return (parts.first.characters.first + parts.last.characters.first).toUpperCase();
  }
}

class _DrawerTile extends StatelessWidget {
  final _NavItem item;
  final String currentPath;
  const _DrawerTile({required this.item, required this.currentPath});

  @override
  Widget build(BuildContext context) {
    final selected = currentPath.startsWith(item.route);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () {
          Navigator.of(context).pop();
          context.go(item.route);
        },
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 10),
          margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 1),
          decoration: BoxDecoration(
            color: selected ? kNavy50 : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            border: selected
                ? const Border(left: BorderSide(color: kMission500, width: 3))
                : null,
          ),
          child: Row(
            children: [
              Icon(
                item.icon,
                size: 19,
                color: selected ? kNavy900 : kInk500,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  item.label,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? kNavy900 : kInk700,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
