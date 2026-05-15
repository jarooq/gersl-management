import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/advances/advances_screen.dart';
import '../features/advances/new_advance_screen.dart';
import '../features/announcements/announcements_screen.dart';
import '../features/approvals/approvals_screen.dart';
import '../features/attendance/attendance_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/expenses/expenses_screen.dart';
import '../features/expenses/new_expense_screen.dart';
import '../features/compliance/incident_screen.dart';
import '../features/home/home_dashboard_screen.dart';
import '../features/home/home_shell.dart';
import '../features/home/more_screen.dart';
import '../features/notifications/notifications_screen.dart';
import '../features/requests/vehicle_requests_screen.dart';
import '../features/requests/accommodation_requests_screen.dart';
import '../features/leaves/leaves_screen.dart';
import '../features/leaves/new_leave_screen.dart';
import '../features/movement/fuel_claims_screen.dart';
import '../features/movement/movements_screen.dart';
import '../features/movement/new_movement_screen.dart';
import '../features/payslips/payslips_screen.dart';
import '../features/punch/punch_screen.dart';
import '../features/tasks/my_tasks_screen.dart';
import '../features/visits/new_visit_screen.dart';
import '../features/visits/visits_screen.dart';
import '../features/programmes/my_programmes_screen.dart';
import '../features/programmes/programme_item_screen.dart';
import '../features/programmes/programme_order_screen.dart';
import '../features/programmes/programme_map_screen.dart';
import '../features/orphans/my_orphans_screen.dart';
import '../features/orphans/orphan_detail_screen.dart';
import '../features/beneficiaries/beneficiaries_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      // Audit-hardening 2026-05: during cold boot the auth controller is in
      // AsyncLoading for ~250ms while it reads the stored token. Previously
      // we treated loading as "not logged in" → user saw a flash of the
      // login screen before snapping to /today. Defer routing while loading.
      if (auth.isLoading) return null;
      final loggedIn = auth.value?.isAuthenticated ?? false;
      final atLogin = state.matchedLocation == '/login';
      if (!loggedIn && !atLogin) return '/login';
      if (loggedIn && atLogin) return '/today';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      ShellRoute(
        builder: (context, state, child) => HomeShell(child: child),
        routes: [
          GoRoute(path: '/today',         builder: (context, state) => const HomeDashboardScreen()),
          GoRoute(path: '/attendance',    builder: (context, state) => const AttendanceScreen()),
          GoRoute(path: '/punch',         builder: (context, state) => const PunchScreen()),
          GoRoute(path: '/tasks',         builder: (context, state) => const MyTasksScreen()),
          GoRoute(path: '/visits',        builder: (context, state) => const VisitsScreen()),
          GoRoute(path: '/more',          builder: (context, state) => const MoreScreen()),
          GoRoute(path: '/notifications', builder: (context, state) => const NotificationsScreen()),
          GoRoute(path: '/incidents',     builder: (context, state) => const IncidentReportScreen()),
          GoRoute(path: '/vehicle-requests',       builder: (context, state) => const VehicleRequestsScreen()),
          GoRoute(path: '/accommodation-requests', builder: (context, state) => const AccommodationRequestsScreen()),
          GoRoute(path: '/advances',      builder: (context, state) => const AdvancesScreen()),
          GoRoute(path: '/announcements', builder: (context, state) => const AnnouncementsScreen()),
          GoRoute(path: '/movements',     builder: (context, state) => const MovementsScreen()),
          GoRoute(path: '/fuel-claims',   builder: (context, state) => const FuelClaimsScreen()),
          GoRoute(path: '/leaves',        builder: (context, state) => const LeavesScreen()),
          GoRoute(path: '/expenses',      builder: (context, state) => const ExpensesScreen()),
          GoRoute(path: '/payslips',      builder: (context, state) => const PayslipsScreen()),
          GoRoute(path: '/approvals',     builder: (context, state) => const ApprovalsScreen()),
          GoRoute(path: '/programmes',    builder: (context, state) => const MyProgrammesScreen()),
          GoRoute(path: '/orphans',       builder: (context, state) => const MyOrphansScreen()),
          GoRoute(path: '/beneficiaries', builder: (context, state) => const BeneficiariesScreen()),
        ],
      ),

      GoRoute(
        path: '/orphans/:id',
        builder: (context, state) => OrphanDetailScreen(
          orphanId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/programmes/:kind/order/:id',
        builder: (context, state) => ProgrammeOrderScreen(
          kind: state.pathParameters['kind']!,
          orderId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/programmes/map',
        builder: (context, state) => const ProgrammeMapScreen(),
      ),
      GoRoute(
        path: '/programmes/:kind/:id',
        builder: (context, state) => ProgrammeItemScreen(
          kind: state.pathParameters['kind']!,
          itemId: int.parse(state.pathParameters['id']!),
        ),
      ),
      GoRoute(path: '/visits/new',    builder: (context, state) => const NewVisitScreen()),
      GoRoute(path: '/advances/new',  builder: (context, state) => const NewAdvanceScreen()),
      GoRoute(path: '/leaves/new',    builder: (context, state) => const NewLeaveScreen()),
      GoRoute(path: '/expenses/new',  builder: (context, state) => const NewExpenseScreen()),
      GoRoute(path: '/movements/new', builder: (context, state) => const NewMovementScreen()),
    ],
  );
});
