import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/auth_provider.dart';
import '../../providers/data_provider.dart';
import '../../utils/theme.dart';
import '../../widgets/base_layout.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/chart_card.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final dataProvider = Provider.of<DataProvider>(context, listen: false);
    await Future.wait([
      dataProvider.fetchProducts(),
      dataProvider.fetchJobCards(),
      dataProvider.fetchInvoices(),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return BaseLayout(
      title: 'Dashboard',
      body: Consumer2<AuthProvider, DataProvider>(
        builder: (context, authProvider, dataProvider, child) {
          if (dataProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final stats = dataProvider.getDashboardStats();

          return RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Welcome Section
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: AppTheme.cardDecoration.copyWith(
                      gradient: AppTheme.primaryGradient,
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.dashboard,
                            color: Colors.white,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Welcome back, ${authProvider.user?.name ?? 'User'}!',
                                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Here\'s what\'s happening in your workshop today.',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.white.withOpacity(0.9),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Stats Cards
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.2,
                    children: [
                      StatCard(
                        title: 'Total Products',
                        value: stats['totalProducts'].toString(),
                        icon: Icons.inventory_2,
                        color: Colors.blue,
                        change: '+5%',
                      ),
                      StatCard(
                        title: 'Job Cards',
                        value: stats['totalJobCards'].toString(),
                        icon: Icons.assignment,
                        color: Colors.green,
                        change: '+12%',
                      ),
                      StatCard(
                        title: 'Total Revenue',
                        value: '₹${(stats['totalRevenue'] as double).toStringAsFixed(0)}',
                        icon: Icons.currency_rupee,
                        color: Colors.purple,
                        change: '+8%',
                      ),
                      StatCard(
                        title: 'Low Stock Alert',
                        value: stats['lowStockCount'].toString(),
                        icon: Icons.warning,
                        color: Colors.orange,
                        change: '-2',
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Charts Section
                  Text(
                    'Analytics Overview',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Revenue Chart
                  ChartCard(
                    title: 'Revenue Trend',
                    subtitle: 'Monthly revenue overview',
                    child: SizedBox(
                      height: 200,
                      child: LineChart(
                        LineChartData(
                          gridData: FlGridData(show: false),
                          titlesData: FlTitlesData(show: false),
                          borderData: FlBorderData(show: false),
                          lineBarsData: [
                            LineChartBarData(
                              spots: _generateRevenueSpots(dataProvider.invoices),
                              isCurved: true,
                              color: AppTheme.primaryColor,
                              barWidth: 3,
                              dotData: FlDotData(show: false),
                              belowBarData: BarAreaData(
                                show: true,
                                color: AppTheme.primaryColor.withOpacity(0.1),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Job Status Chart
                  ChartCard(
                    title: 'Job Status Distribution',
                    subtitle: 'Current status of all jobs',
                    child: SizedBox(
                      height: 200,
                      child: PieChart(
                        PieChartData(
                          sections: _generateJobStatusSections(dataProvider.jobCards),
                          centerSpaceRadius: 40,
                          sectionsSpace: 2,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Recent Activity
                  Text(
                    'Recent Activity',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 16),

                  Container(
                    decoration: AppTheme.cardDecoration,
                    child: Column(
                      children: [
                        _buildActivityItem(
                          icon: Icons.add_circle,
                          title: 'New job card created',
                          subtitle: 'Vehicle #KA01AB1234',
                          time: '2 hours ago',
                          color: Colors.green,
                        ),
                        const Divider(height: 1),
                        _buildActivityItem(
                          icon: Icons.inventory,
                          title: 'Product updated',
                          subtitle: 'Brake Pad inventory',
                          time: '4 hours ago',
                          color: Colors.blue,
                        ),
                        const Divider(height: 1),
                        _buildActivityItem(
                          icon: Icons.receipt,
                          title: 'Invoice generated',
                          subtitle: 'Invoice #INV-001',
                          time: '6 hours ago',
                          color: Colors.purple,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActivityItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required String time,
    required Color color,
  }) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
          Text(
            time,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppTheme.textTertiary,
            ),
          ),
        ],
      ),
    );
  }

  List<FlSpot> _generateRevenueSpots(List invoices) {
    // Generate sample revenue data
    return [
      const FlSpot(0, 3000),
      const FlSpot(1, 4500),
      const FlSpot(2, 3800),
      const FlSpot(3, 5200),
      const FlSpot(4, 4800),
      const FlSpot(5, 6100),
    ];
  }

  List<PieChartSectionData> _generateJobStatusSections(List jobCards) {
    final statusCounts = <String, int>{};
    for (final jobCard in jobCards) {
      statusCounts[jobCard.status] = (statusCounts[jobCard.status] ?? 0) + 1;
    }

    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
    ];

    int colorIndex = 0;
    return statusCounts.entries.map((entry) {
      final color = colors[colorIndex % colors.length];
      colorIndex++;
      
      return PieChartSectionData(
        value: entry.value.toDouble(),
        title: '${entry.value}',
        color: color,
        radius: 50,
        titleStyle: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      );
    }).toList();
  }
}