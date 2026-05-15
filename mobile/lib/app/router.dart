import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/advances/advances_screen.dart';
import '../features/advances/new_advance_screen.dart';
import '../features/announcements/announcements_screen.dart';
import '../features/approvals/approvals_screen.dart';
import '../features/attendance/attendance_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/forgot_password_screen.dart';
import '../features/auth/login_screen.dart';
import '../features/auth/reset_password_screen.dart';
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

// Mobile route table.
//
// Audit-hardening (2026-05): converted ShellRoute → StatefulShellRoute so
// each of the 5 bottom-nav tabs keeps its own Navigator stack and widget
// tree alive across tab switches. Before this change, every tab switch
// dropped the page state (scroll position, search input, autoDispose
// providers) and re-fetched data on return — visible as a noticeable
// blank flash when bouncing between tabs.
//
// IndexedStack-based shell: bodies of all 5 branches are kept mounted at
// the same time; switching tabs just changes the visible index.
// Heavier on memory than the old ShellRoute, but far better UX for a
// field-staff app where users dip into multiple sections per session.
final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      // Defer redirect while the auth controller is still booting (reading
      // the stored token). Without this, cold boot flashes /login briefly
      // before snapping to /today.
      if (auth.isLoading) return null;
      final loggedIn = auth.value?.isAuthenticated ?? false;
      // Public auth flows that an unauthenticated user must be able to reach.
      const publicPaths = {'/login', '/forgot-password', '/reset-password'};
      final atPublic = publicPaths.contains(state.matchedLocation);
      if (!loggedIn && !atPublic) return '/login';
      if (loggedIn && state.matchedLocation == '/login') return '/today';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      // Public auth flows — sit outside the shell so the bottom nav is hidden.
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/reset-password',
        builder: (context, state) => ResetPasswordScreen(
          // Token comes from the email link's ?token=… query param.
          token: state.uri.queryParameters['token'],
        ),
      ),

      // Five-branch indexed-stack shell. Each branch corresponds to one
      // bottom-nav tab. Sub-routes (e.g. /tasks under More) live inside
      // their tab's branch so the bottom-nav highlight stays correct and
      // pressing the same tab twice pops back to the branch root.
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) =>
            HomeShell(navigationShell: navigationShell),
        branches: [
          // Branch 0: Home
          StatefulShellBranch(routes: [
            GoRoute(path: '/today', builder: (context, state) => const HomeDashboardScreen()),
            GoRoute(path: '/punch', builder: (context, state) => const PunchScreen()),
          ]),
          // Branch 1: Attendance
          StatefulShellBranch(routes: [
            GoRoute(path: '/attendance', builder: (context, state) => const AttendanceScreen()),
          ]),
          // Branch 2: Leave
          StatefulShellBranch(routes: [
            GoRoute(path: '/leaves', builder: (context, state) => const LeavesScreen()),
          ]),
          // Branch 3: Payroll
          StatefulShellBranch(routes: [
            GoRoute(path: '/payslips', builder: (context, state) => const PayslipsScreen()),
          ]),
          // Branch 4: More (the heavy branch — everything reachable from
          // the More-tab grid lives here so bottom-nav keeps highlighting
          // More while the user drills in.)
          StatefulShellBranch(routes: [
            GoRoute(path: '/more',                   builder: (context, state) => const MoreScreen()),
            GoRoute(path: '/tasks',                  builder: (context, state) => const MyTasksScreen()),
            GoRoute(path: '/visits',                 builder: (context, state) => const VisitsScreen()),
            GoRoute(path: '/notifications',          builder: (context, state) => const NotificationsScreen()),
            GoRoute(path: '/incidents',              builder: (context, state) => const IncidentReportScreen()),
            GoRoute(path: '/vehicle-requests',       builder: (context, state) => const VehicleRequestsScreen()),
            GoRoute(path: '/accommodation-requests', builder: (context, state) => const AccommodationRequestsScreen()),
            GoRoute(path: '/advances',               builder: (context, state) => const AdvancesScreen()),
            GoRoute(path: '/announcements',          builder: (context, state) => const AnnouncementsScreen()),
            GoRoute(path: '/movements',              builder: (context, state) => const MovementsScreen()),
            GoRoute(path: '/fuel-claims',            builder: (context, state) => const FuelClaimsScreen()),
            GoRoute(path: '/expenses',               builder: (context, state) => const ExpensesScreen()),
            GoRoute(path: '/approvals',              builder: (context, state) => const ApprovalsScreen()),
            GoRoute(path: '/programmes',             builder: (context, state) => const MyProgrammesScreen()),
            GoRoute(path: '/orphans',                builder: (context, state) => const MyOrphansScreen()),
            GoRoute(path: '/beneficiaries',          builder: (context, state) => const BeneficiariesScreen()),
          ]),
        ],
      ),

      // Full-screen routes that intentionally sit OUTSIDE the shell so they
      // hide the bottom nav. Detail screens, the programme map, and "new"
      // form sheets all push on top of the active branch.
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
