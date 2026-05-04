import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/advances/advances_screen.dart';
import '../features/advances/new_advance_screen.dart';
import '../features/announcements/announcements_screen.dart';
import '../features/approvals/approvals_screen.dart';
import '../features/auth/auth_controller.dart';
import '../features/auth/login_screen.dart';
import '../features/expenses/expenses_screen.dart';
import '../features/expenses/new_expense_screen.dart';
import '../features/home/home_shell.dart';
import '../features/home/more_screen.dart';
import '../features/leaves/leaves_screen.dart';
import '../features/leaves/new_leave_screen.dart';
import '../features/movement/fuel_claims_screen.dart';
import '../features/movement/movements_screen.dart';
import '../features/payslips/payslips_screen.dart';
import '../features/shifts/shifts_screen.dart';
import '../features/punch/punch_screen.dart';
import '../features/tasks/my_tasks_screen.dart';
import '../features/visits/new_visit_screen.dart';
import '../features/visits/visits_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authControllerProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
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
          GoRoute(path: '/today',         builder: (context, state) => const PunchScreen()),
          GoRoute(path: '/tasks',         builder: (context, state) => const MyTasksScreen()),
          GoRoute(path: '/visits',        builder: (context, state) => const VisitsScreen()),
          GoRoute(path: '/more',          builder: (context, state) => const MoreScreen()),
          GoRoute(path: '/advances',      builder: (context, state) => const AdvancesScreen()),
          GoRoute(path: '/announcements', builder: (context, state) => const AnnouncementsScreen()),
          GoRoute(path: '/movements',     builder: (context, state) => const MovementsScreen()),
          GoRoute(path: '/fuel-claims',   builder: (context, state) => const FuelClaimsScreen()),
          GoRoute(path: '/leaves',        builder: (context, state) => const LeavesScreen()),
          GoRoute(path: '/expenses',      builder: (context, state) => const ExpensesScreen()),
          GoRoute(path: '/shifts',        builder: (context, state) => const ShiftsScreen()),
          GoRoute(path: '/payslips',      builder: (context, state) => const PayslipsScreen()),
          GoRoute(path: '/approvals',     builder: (context, state) => const ApprovalsScreen()),
        ],
      ),
      GoRoute(path: '/visits/new',    builder: (context, state) => const NewVisitScreen()),
      GoRoute(path: '/advances/new',  builder: (context, state) => const NewAdvanceScreen()),
      GoRoute(path: '/leaves/new',    builder: (context, state) => const NewLeaveScreen()),
      GoRoute(path: '/expenses/new',  builder: (context, state) => const NewExpenseScreen()),
    ],
  );
});
