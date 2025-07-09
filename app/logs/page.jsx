'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { getLogs } from '@/lib/firebase/firestore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import {
  MagnifyingGlassIcon,
  ClockIcon,
  UserIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function Logs() {
  const { user, hasRole } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');

  const { data: logs = [], isLoading } = useQuery(
    ['logs', user?.role],
    () => getLogs(user?.role),
    {
      enabled: hasRole('lv2'),
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'add_product', label: 'Add Product' },
    { value: 'update_product', label: 'Update Product' },
    { value: 'delete_product', label: 'Delete Product' },
    { value: 'create_job_card', label: 'Create Job Card' },
    { value: 'update_job_card', label: 'Update Job Card' },
    { value: 'create_invoice', label: 'Create Invoice' },
    { value: 'add_user', label: 'Add User' },
    { value: 'update_user', label: 'Update User' },
    { value: 'delete_user', label: 'Delete User' }
  ];

  const getActionIcon = (action) => {
    switch (action) {
      case 'add_product':
      case 'update_product':
      case 'delete_product':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'create_job_card':
      case 'update_job_card':
        return <ClockIcon className="h-4 w-4" />;
      case 'create_invoice':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'add_user':
      case 'update_user':
      case 'delete_user':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
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

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  if (!hasRole('lv2')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <Sidebar />
      <Header />
      
      <main className="py-10 lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="sm:flex sm:items-center">
            <div className="sm:flex-auto">
              <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
              <p className="mt-2 text-sm text-gray-700">
                Track all activities and changes made in your workshop.
                {user?.role === 'lv2' && ' (Showing last 48 hours)'}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="min-w-0 flex-1 max-w-xs">
              <select
                className="block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
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
          </div>

          <div className="mt-8">
            <div className="flow-root">
              <ul role="list" className="-mb-8">
                {filteredLogs.map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== filteredLogs.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${getActionColor(log.action)}`}>
                            {getActionIcon(log.action)}
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {log.details}
                            </p>
                            <p className="text-xs text-gray-400">
                              Action: {log.action}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={log.timestamp?.toISOString()}>
                              {log.timestamp?.toLocaleDateString()}{' '}
                              {log.timestamp?.toLocaleTimeString()}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            
            {filteredLogs.length === 0 && (
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
      </main>
    </div>
  );
}