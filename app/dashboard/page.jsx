'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/auth';
import { getProducts, getJobCards, getInvoices } from '@/lib/firebase/firestore';
import { 
  processRevenueData, 
  processJobCardStatusData, 
  processInventoryData,
  processWeeklyJobCards,
  calculateGrowthRate,
  getTopCustomers
} from '@/lib/utils/analytics';
import { BarChartComponent, LineChartComponent, PieChartComponent, AreaChartComponent } from '@/components/ui/ChartComponents';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  CubeIcon,
  DocumentTextIcon,
  ReceiptPercentIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    products: 0,
    jobCards: 0,
    invoices: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({
    revenueData: [],
    jobCardStatusData: [],
    inventoryData: [],
    weeklyJobCards: [],
    topCustomers: [],
    growthRate: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [products, jobCards, invoices] = await Promise.all([
          getProducts(),
          getJobCards(),
          getInvoices()
        ]);

        const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        const lastMonthRevenue = invoices
          .filter(invoice => {
            const invoiceDate = new Date(invoice.created_at);
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            return invoiceDate.getMonth() === lastMonth.getMonth();
          })
          .reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        
        const currentMonthRevenue = invoices
          .filter(invoice => {
            const invoiceDate = new Date(invoice.created_at);
            const currentMonth = new Date();
            return invoiceDate.getMonth() === currentMonth.getMonth();
          })
          .reduce((sum, invoice) => sum + (invoice.total || 0), 0);

        const completedJobs = jobCards.filter(job => job.status === 'completed').length;
        const pendingJobs = jobCards.filter(job => job.status === 'pending').length;
        const lowStockItems = products.filter(product => product.stock < 10).length;

        setStats({
          products: products.length,
          jobCards: jobCards.length,
          invoices: invoices.length,
          totalRevenue,
          completedJobs,
          pendingJobs,
          lowStockItems
        });
        
        setAnalyticsData({
          revenueData: processRevenueData(invoices),
          jobCardStatusData: processJobCardStatusData(jobCards),
          inventoryData: processInventoryData(products),
          weeklyJobCards: processWeeklyJobCards(jobCards),
          topCustomers: getTopCustomers(jobCards),
          growthRate: calculateGrowthRate(currentMonthRevenue, lastMonthRevenue)
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.products,
      change: '+5%',
      icon: CubeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Job Cards',
      value: stats.jobCards,
      change: '+12%',
      icon: DocumentTextIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
      borderColor: 'border-emerald-200',
    },
    {
      title: 'Completed Jobs',
      value: stats.completedJobs || 0,
      change: '+8%',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
      borderColor: 'border-green-200',
    },
    {
      title: 'Pending Jobs',
      value: stats.pendingJobs || 0,
      change: '+2',
      icon: ClockIcon,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
      borderColor: 'border-amber-200',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      change: `${analyticsData.growthRate >= 0 ? '+' : ''}${analyticsData.growthRate}%`,
      icon: CurrencyDollarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-50 to-violet-100',
      borderColor: 'border-purple-200',
      growth: analyticsData.growthRate,
      trend: analyticsData.growthRate >= 0 ? 'up' : 'down'
    },
    {
      title: 'Low Stock Alert',
      value: stats.lowStockItems || 0,
      change: '-2',
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-100',
      borderColor: 'border-red-200',
    }
  ];

  const handleQuickAction = (action) => {
    const routes = {
      'inventory': '/inventory',
      'job-cards': '/job-cards',
      'invoices': '/invoices',
      'users': '/users'
    };
    
    if (routes[action]) {
      window.location.href = routes[action];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-32 w-32 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      
      <Sidebar />
      <Header />
      
      <main className="relative z-10 py-10 lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Enhanced Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                  <SparklesIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Workshop Dashboard
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Welcome back, <span className="font-semibold text-blue-600">{user?.name || 'Admin'}</span>! Here's what's happening in your workshop today.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium shadow-lg">
                <ChartBarIcon className="h-4 w-4 animate-pulse" />
                Live Data
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-gray-600">System Online</span>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={stat.title} 
                  className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105"
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${stat.bgColor}`}></div>
                  <div className="relative z-10 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">
                        {stat.title}
                      </h3>
                      <div className={`relative rounded-2xl p-3 ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 group-hover:text-gray-800 transition-colors mb-2">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {stat.trend === 'up' ? (
                          <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                        ) : stat.trend === 'down' ? (
                          <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                        ) : null}
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          stat.trend === 'up' ? 'text-emerald-600 bg-emerald-50' : 
                          stat.trend === 'down' ? 'text-red-600 bg-red-50' : 
                          'text-emerald-600 bg-emerald-50'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">from last month</span>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>

          {/* Enhanced Analytics Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-xl border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-blue-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <ArrowTrendingUpIcon className="h-5 w-5 text-blue-600" />
                  Revenue Overview
                </h3>
                <p className="text-gray-600">Monthly revenue trends and growth analysis</p>
              </div>
              <div className="p-6">
                <AreaChartComponent 
                  data={analyticsData.revenueData}
                  dataKey="revenue"
                  xAxisKey="month"
                  title=""
                  color="#3B82F6"
                />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-t-xl border-b border-purple-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                  Job Status Distribution
                </h3>
                <p className="text-gray-600">Current status breakdown of all jobs</p>
              </div>
              <div className="p-6">
                <PieChartComponent 
                  data={analyticsData.jobCardStatusData}
                  title=""
                />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-green-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-t-xl border-b border-green-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <DocumentTextIcon className="h-5 w-5 text-green-600" />
                  Weekly Job Cards
                </h3>
                <p className="text-gray-600">Job card creation trends this week</p>
              </div>
              <div className="p-6">
                <BarChartComponent 
                  data={analyticsData.weeklyJobCards}
                  dataKey="count"
                  xAxisKey="day"
                  title=""
                  color="#10B981"
                />
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-orange-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-t-xl border-b border-orange-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <CubeIcon className="h-5 w-5 text-orange-600" />
                  Inventory Value
                </h3>
                <p className="text-gray-600">Stock value distribution by category</p>
              </div>
              <div className="p-6">
                <BarChartComponent 
                  data={analyticsData.inventoryData}
                  dataKey="value"
                  xAxisKey="category"
                  title=""
                  color="#F59E0B"
                />
              </div>
            </div>
          </div>

          {/* Enhanced Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 rounded-t-xl border-b border-gray-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <BoltIcon className="h-5 w-5 text-gray-600" />
                  Recent Activity
                </h3>
                <p className="text-gray-600">Latest actions in your workshop</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-green-200">
                    <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">New job card created</p>
                      <p className="text-sm text-gray-500">Vehicle #KA01AB1234</p>
                    </div>
                  </div>
                  
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-blue-200">
                    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                      <CubeIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Product updated</p>
                      <p className="text-sm text-gray-500">Brake Pad inventory</p>
                    </div>
                  </div>
                  
                  <div className="group flex items-center gap-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all duration-300 cursor-pointer border border-transparent hover:border-amber-200">
                    <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 p-3 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                      <ReceiptPercentIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-800">Invoice generated</p>
                      <p className="text-sm text-gray-500">Invoice #INV-001</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Customers */}
            <div className="bg-white rounded-xl border-2 border-indigo-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-t-xl border-b border-indigo-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <UsersIcon className="h-5 w-5 text-indigo-600" />
                  Top Customers
                </h3>
                <p className="text-gray-600">Most frequent workshop visitors</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {analyticsData.topCustomers.length > 0 ? (
                    analyticsData.topCustomers.map((customer, index) => (
                      <div key={customer.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-indigo-50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white text-sm font-medium">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                        </div>
                        <span className="text-sm text-indigo-600 font-medium">{customer.visits} visits</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <UsersIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      <p>No customer data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-xl border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-6 rounded-t-xl border-b border-purple-100">
                <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                  <BoltIcon className="h-5 w-5 text-purple-600" />
                  Quick Actions
                </h3>
                <p className="text-gray-600">Frequently used actions</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    className="group h-20 flex flex-col items-center justify-center gap-2 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => handleQuickAction('inventory')}
                  >
                    <CubeIcon className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-gray-700">Inventory</span>
                  </button>
                  <button 
                    className="group h-20 flex flex-col items-center justify-center gap-2 border-2 border-emerald-200 rounded-lg hover:border-emerald-400 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-green-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => handleQuickAction('job-cards')}
                  >
                    <DocumentTextIcon className="h-6 w-6 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-gray-700">Job Cards</span>
                  </button>
                  <button 
                    className="group h-20 flex flex-col items-center justify-center gap-2 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-gradient-to-br hover:from-purple-50 hover:to-violet-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => handleQuickAction('invoices')}
                  >
                    <ReceiptPercentIcon className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-gray-700">Invoices</span>
                  </button>
                  <button 
                    className="group h-20 flex flex-col items-center justify-center gap-2 border-2 border-orange-200 rounded-lg hover:border-orange-400 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-100 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                    onClick={() => handleQuickAction('users')}
                  >
                    <UsersIcon className="h-6 w-6 text-orange-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-semibold text-gray-700">Users</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}