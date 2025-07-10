import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../utils/theme.dart';

class BaseLayout extends StatelessWidget {
  final String title;
  final Widget body;
  final List<Widget>? actions;
  final Widget? floatingActionButton;

  const BaseLayout({
    super.key,
    required this.title,
    required this.body,
    this.actions,
    this.floatingActionButton,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          ...?actions,
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'logout') {
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                await authProvider.logout();
                context.go('/login');
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: Row(
                  children: [
                    const Icon(Icons.person),
                    const SizedBox(width: 8),
                    Consumer<AuthProvider>(
                      builder: (context, authProvider, child) {
                        return Text(authProvider.user?.name ?? 'User');
                      },
                    ),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Logout'),
                  ],
                ),
              ),
            ],
            child: Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                return Container(
                  margin: const EdgeInsets.only(right: 16),
                  child: CircleAvatar(
                    backgroundColor: AppTheme.primaryColor,
                    child: Text(
                      authProvider.user?.name?.substring(0, 1).toUpperCase() ?? 'U',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      body: Container(
        decoration: AppTheme.gradientBackground,
        child: body,
      ),
      bottomNavigationBar: _buildBottomNavigation(context),
      floatingActionButton: floatingActionButton,
    );
  }

  Widget _buildBottomNavigation(BuildContext context) {
    final currentLocation = GoRouter.of(context).location;
    
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final items = <BottomNavigationBarItem>[
          const BottomNavigationBarItem(
            icon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.inventory_2),
            label: 'Inventory',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Job Cards',
          ),
          const BottomNavigationBarItem(
            icon: Icon(Icons.receipt),
            label: 'Invoices',
          ),
          if (authProvider.hasRole('owner'))
            const BottomNavigationBarItem(
              icon: Icon(Icons.people),
              label: 'Users',
            ),
          if (authProvider.hasRole('lv2'))
            const BottomNavigationBarItem(
              icon: Icon(Icons.history),
              label: 'Logs',
            ),
        ];

        final routes = [
          '/dashboard',
          '/inventory',
          '/job-cards',
          '/invoices',
          if (authProvider.hasRole('owner')) '/users',
          if (authProvider.hasRole('lv2')) '/logs',
        ];

        int currentIndex = routes.indexOf(currentLocation);
        if (currentIndex == -1) currentIndex = 0;

        return BottomNavigationBar(
          type: BottomNavigationBarType.fixed,
          currentIndex: currentIndex,
          onTap: (index) {
            if (index < routes.length) {
              context.go(routes[index]);
            }
          },
          items: items,
          selectedItemColor: AppTheme.primaryColor,
          unselectedItemColor: AppTheme.textTertiary,
          backgroundColor: Colors.white,
          elevation: 8,
        );
      },
    );
  }
}