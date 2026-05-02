import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
  _NavItem('Today',    Icons.today_outlined,     '/today'),
  _NavItem('Visits',   Icons.location_on_outlined,'/visits'),
  _NavItem('Tasks',    Icons.checklist_outlined, '/tasks'),
];

const _drawerItems = <_NavItem>[
  _NavItem('Today',          Icons.today_outlined,           '/today'),
  _NavItem('My visits',      Icons.location_on_outlined,     '/visits'),
  _NavItem('My tasks',       Icons.checklist_outlined,       '/tasks'),
  _NavItem('Movements',      Icons.directions_car_outlined,  '/movements'),
  _NavItem('Fuel claims',    Icons.local_gas_station,        '/fuel-claims'),
  _NavItem('Leave',          Icons.event_busy_outlined,      '/leaves'),
  _NavItem('Expenses',       Icons.receipt_long_outlined,    '/expenses'),
  _NavItem('Shifts',         Icons.calendar_view_week,       '/shifts'),
  _NavItem('Salary advances',Icons.attach_money,             '/advances'),
  _NavItem('Payslips',       Icons.payments_outlined,        '/payslips'),
  _NavItem('Approvals',      Icons.fact_check_outlined,      '/approvals'),
  _NavItem('Announcements',  Icons.campaign_outlined,        '/announcements'),
];

class HomeShell extends ConsumerWidget {
  final Widget child;
  const HomeShell({super.key, required this.child});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loc = GoRouterState.of(context).matchedLocation;
    final bottomIdx = _bottomTabs.indexWhere((t) => loc.startsWith(t.route));
    final tracking = ref.watch(isTrackingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_bottomTabs[bottomIdx == -1 ? 0 : bottomIdx].label),
        actions: [
          IconButton(
            tooltip: tracking ? 'Stop tracking' : 'Start tracking',
            icon: Icon(tracking ? Icons.gps_fixed : Icons.gps_off, color: tracking ? Colors.greenAccent : null),
            onPressed: () async {
              final running = await BackgroundLocationService.isRunning();
              if (running) {
                await BackgroundLocationService.stop();
                await ref.read(locationTrackerProvider).stop();
                ref.read(isTrackingProvider.notifier).state = false;
                return;
              }
              // Need a foreground permission grant before the bg service can read location.
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
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign out',
            onPressed: () async {
              await BackgroundLocationService.stop();
              await ref.read(locationTrackerProvider).stop();
              ref.read(isTrackingProvider.notifier).state = false;
              await ref.read(authControllerProvider.notifier).logout();
            },
          ),
        ],
      ),
      drawer: Drawer(
        child: SafeArea(
          child: ListView(
            children: [
              const DrawerHeader(child: Text('GERSL', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold))),
              for (final item in _drawerItems)
                ListTile(
                  leading: Icon(item.icon),
                  title: Text(item.label),
                  selected: loc.startsWith(item.route),
                  onTap: () {
                    Navigator.of(context).pop();
                    context.go(item.route);
                  },
                ),
            ],
          ),
        ),
      ),
      body: child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: bottomIdx == -1 ? 0 : bottomIdx,
        onDestinationSelected: (i) => context.go(_bottomTabs[i].route),
        destinations: [
          for (final t in _bottomTabs)
            NavigationDestination(icon: Icon(t.icon), label: t.label),
        ],
      ),
    );
  }
}
