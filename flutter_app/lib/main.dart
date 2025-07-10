import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:go_router/go_router.dart';

import 'providers/auth_provider.dart';
import 'providers/data_provider.dart';
import 'services/notification_service.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/inventory/inventory_screen.dart';
import 'screens/job_cards/job_cards_screen.dart';
import 'screens/invoices/invoices_screen.dart';
import 'screens/users/users_screen.dart';
import 'screens/logs/logs_screen.dart';
import 'utils/theme.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  
  // Initialize notification service
  await NotificationService.initialize();
  
  runApp(const WorkshopApp());
}

class WorkshopApp extends StatelessWidget {
  const WorkshopApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DataProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp.router(
            title: 'Workshop Manager',
            theme: AppTheme.lightTheme,
            debugShowCheckedModeBanner: false,
            routerConfig: _createRouter(authProvider),
          );
        },
      ),
    );
  }

  GoRouter _createRouter(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: authProvider.isAuthenticated ? '/dashboard' : '/login',
      redirect: (context, state) {
        final isAuthenticated = authProvider.isAuthenticated;
        final isLoginRoute = state.location == '/login';

        if (!isAuthenticated && !isLoginRoute) {
          return '/login';
        }
        if (isAuthenticated && isLoginRoute) {
          return '/dashboard';
        }
        return null;
      },
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (context, state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/inventory',
          builder: (context, state) => const InventoryScreen(),
        ),
        GoRoute(
          path: '/job-cards',
          builder: (context, state) => const JobCardsScreen(),
        ),
        GoRoute(
          path: '/invoices',
          builder: (context, state) => const InvoicesScreen(),
        ),
        GoRoute(
          path: '/users',
          builder: (context, state) => const UsersScreen(),
        ),
        GoRoute(
          path: '/logs',
          builder: (context, state) => const LogsScreen(),
        ),
      ],
    );
  }
}