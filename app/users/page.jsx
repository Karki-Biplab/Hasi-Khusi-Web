'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { getLogs, getUsers } from '@/lib/firebase/firestore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon,
  CubeIcon,
  ReceiptPercentIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChartBarIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';

export default function Logs() {
  const { user, hasRole } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('24h');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'timestamp', 
    direction: 'desc' 
  });

  const { data: logs = [], isLoading: logsLoading } = useQuery(
    ['logs', user?.role],
    () => getLogs(user?.role),
    {
      enabled: hasRole('lv2'),
      refetchInterval: 30000
    }
  );

  const { data: users = [], isLoading: usersLoading } = useQuery(
    'users-for-logs',
    getUsers,
    { enabled: hasRole('lv2') }
  );

  const actionTypes = [
    { value: 'all', label: 'All Actions', icon: <ChartBarIcon className="h-4 w-4" /> },
    { value: 'add_product', label: 'Add Product', icon: <PlusIcon className="h-4 w-4" /> },
    { value: 'update_product', label: 'Update Product', icon: <CubeIcon className="h-4 w-4" /> },
    { value: 'delete_product', label: 'Delete Product', icon: <TrashIcon className="h-4 w-4" /> },
    { value: 'create_job_card', label: 'Create Job', icon: <PlusIcon className="h-4 w-4" /> },
    { value: 'update_job_card', label: 'Update Job', icon: <ClockIcon className="h-4 w-4" /> },
    { value: 'create_invoice', label: 'Create Invoice', icon: <ReceiptPercentIcon className="h-4 w-4" /> },
    { value: 'add_user', label: 'Add User', icon: <UserIcon className="h-4 w-4" /> },
    { value: 'update_user', label: 'Update User', icon: <UserIcon className="h-4 w-4" /> },
    { value: 'delete_user', label: 'Delete User', icon: <TrashIcon className="h-4 w-4" /> }
  ];

  const dateRanges = [
    { value: '24h', label: 'Last 24 hours' },
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: 'all', label: 'All time' }
  ];

  const sortOptions = [
    { key: 'timestamp', label: 'Date' },
    { key: 'user', label: 'User' },
    { key: 'action', label: 'Action Type' }
  ];

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getActionIcon = (action) => {
    const foundAction = actionTypes.find(a => a.value === action);
    return foundAction ? foundAction.icon : <DocumentTextIcon className="h-4 w-4" />;
  };

  const getActionColor = (action) => {
    if (action.includes('add') || action.includes('create')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('update')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('delete')) {
      return 'bg-red-100 text-red-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  const filterLogsByDate = (log) => {
    const now = new Date();
    const logDate = new Date(log.timestamp?.seconds * 1000);
    
    switch (dateRange) {
      case '24h':
        return now - logDate <= 24 * 60 * 60 * 1000;
      case '7d':
        return now - logDate <= 7 * 24 * 60 * 60 * 1000;
      case '30d':
        return now - logDate <= 30 * 24 * 60 * 60 * 1000;
      default:
        return true;
    }
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getActionLabel = (action) => {
    const foundAction = actionTypes.find(a => a.value === action);
    return foundAction ? foundAction.label : action;
  };

  const filteredLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.action.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesUser = selectedUser === 'all' || log.user_id === selectedUser;
      const matchesDate = filterLogsByDate(log);
      
      return matchesSearch && matchesAction && matchesUser && matchesDate;
    });

    // Add user names to logs for sorting
    filtered = filtered.map(log => ({
      ...log,
      userName: getUserName(log.user_id),
      actionLabel: getActionLabel(log.action)
    }));

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'timestamp') {
          aValue = a.timestamp?.seconds || 0;
          bValue = b.timestamp?.seconds || 0;
        } else if (sortConfig.key === 'user') {
          aValue = a.userName.toLowerCase();
          bValue = b.userName.toLowerCase();
        } else {
          aValue = a[sortConfig.key]?.toLowerCase() || '';
          bValue = b[sortConfig.key]?.toLowerCase() || '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [logs, searchTerm, selectedAction, selectedUser, dateRange, sortConfig, users]);

  const getUserActivityStats = (userId) => {
    const userLogs = filteredLogs.filter(log => log.user_id === userId);
    const actionCounts = userLogs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});
    
    return {
      totalActions: userLogs.length,
      actionCounts,
      lastActivity: userLogs[0]?.timestamp?.toDate().toLocaleString() || 'None'
    };
  };

  if (!hasRole('lv2')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg border-2 border-red-200 max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">You don't have permission to view this page.</p>
          <div className="h-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (logsLoading || usersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Activity Logs
                </h1>
              </div>
              <p className="text-gray-600">
                Track all user activities and changes in your workshop system
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-medium shadow-lg">
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                Live Updates
              </span>
            </div>
          </div>

          {/* User Activity Overview */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <UserGroupIcon className="h-5 w-5 text-indigo-600" />
              User Activity Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {users.slice(0, 4).map(user => {
                const stats = getUserActivityStats(user.id);
                return (
                  <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-xs text-gray-500">{user.role}</p>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Actions</p>
                        <p className="font-bold text-gray-900">{stats.totalActions}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-500">Last Active</p>
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {stats.lastActivity.split(',')[0]}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div>
                <select
                  className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                >
                  {actionTypes.map(action => (
                    <option key={action.value} value={action.value}>
                      {action.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="all">All Users</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  className="block w-full rounded-lg border-0 py-2.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  {dateRanges.map(range => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                Detailed Activity Logs
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <select
                    className="rounded-lg border-0 py-1 pl-2 pr-8 text-gray-900 ring-1 ring-inset ring-gray-200 focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-sm bg-white"
                    value={sortConfig.key}
                    onChange={(e) => requestSort(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.key} value={option.key}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={() => requestSort(sortConfig.key)}
                    className="p-1 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                  >
                    {sortConfig.direction === 'asc' ? (
                      <ArrowUpIcon className="h-4 w-4 text-gray-600" />
                    ) : (
                      <ArrowDownIcon className="h-4 w-4 text-gray-600" />
                    )}
                  </button>
                </div>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedAction('all');
                    setSelectedUser('all');
                    setDateRange('24h');
                    setSortConfig({ key: 'timestamp', direction: 'desc' });
                  }}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(100vh-400px)]">
              {filteredLogs.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('user')}
                      >
                        <div className="flex items-center gap-1">
                          User
                          <ChevronUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('action')}
                      >
                        <div className="flex items-center gap-1">
                          Action
                          <ChevronUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => requestSort('timestamp')}
                      >
                        <div className="flex items-center gap-1">
                          Time
                          <ChevronUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredLogs.map((log) => {
                      const logDate = new Date(log.timestamp?.seconds * 1000);
                      const isToday = new Date().toDateString() === logDate.toDateString();
                      
                      return (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 text-white`}>
                                {log.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                <div className="text-xs text-gray-500">
                                  {users.find(u => u.id === log.user_id)?.role || 'Unknown'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center ${getActionColor(log.action)}`}>
                                {getActionIcon(log.action)}
                              </div>
                              <span className="text-sm text-gray-900">
                                {getActionLabel(log.action)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{log.details}</div>
                            {log.target_id && (
                              <div className="text-xs text-gray-500 mt-1">
                                Target ID: {log.target_id}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {isToday 
                                ? logDate.toLocaleTimeString() 
                                : logDate.toLocaleDateString()}
                              <div className="text-xs text-gray-400">
                                {isToday ? 'Today' : logDate.toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No logs found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No activity logs match your current filters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}