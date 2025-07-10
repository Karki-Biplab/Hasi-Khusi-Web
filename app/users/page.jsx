'use client';

import { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { getUsers, addLog, addUser, updateUser, deleteUser } from '@/lib/firebase/firestore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowPathIcon,
  FunnelIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export default function Users() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ 
    key: 'name', 
    direction: 'asc' 
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'lv1'
  });

  const { data: users = [], isLoading, refetch } = useQuery('users', getUsers, {
    enabled: hasRole('owner')
  });

  // Sorting functionality
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Improved date formatting
  const formatUserDate = (date) => {
    if (!date) return 'Unknown';
    const userDate = new Date(date);
    const isToday = new Date().toDateString() === userDate.toDateString();
    
    return isToday 
      ? `Today at ${userDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
      : userDate.toLocaleDateString();
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSortConfig({ key: 'name', direction: 'asc' });
  };

  // Sorted and filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        // Handle nested properties if needed
        const aValue = a[sortConfig.key]?.toLowerCase() || '';
        const bValue = b[sortConfig.key]?.toLowerCase() || '';

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
  }, [users, searchTerm, sortConfig]);

  const addUserMutation = useMutation(
    (userData) => addUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsAddModalOpen(false);
        resetForm();
        toast.success('User added successfully!', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
            border: 'none'
          }
        });
        logAction('add_user', 'User added');
      },
      onError: (error) => {
        toast.error('Failed to add user: ' + error.message, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#EF4444',
            color: 'white',
            border: 'none'
          }
        });
      }
    }
  );

  const updateUserMutation = useMutation(
    ({ id, data }) => updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        setIsEditModalOpen(false);
        resetForm();
        toast.success('User updated successfully!', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
            border: 'none'
          }
        });
        logAction('update_user', 'User updated');
      },
      onError: (error) => {
        toast.error('Failed to update user: ' + error.message, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#EF4444',
            color: 'white',
            border: 'none'
          }
        });
      }
    }
  );

  const deleteUserMutation = useMutation(
    (id) => deleteUser(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('User deleted successfully!', {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#10B981',
            color: 'white',
            border: 'none'
          }
        });
        logAction('delete_user', 'User deleted');
      },
      onError: (error) => {
        toast.error('Failed to delete user: ' + error.message, {
          position: 'top-right',
          duration: 3000,
          style: {
            background: '#EF4444',
            color: 'white',
            border: 'none'
          }
        });
      }
    }
  );

  const logAction = async (action, details) => {
    try {
      await addLog({
        user_id: user.uid,
        action,
        details,
        target_id: selectedUser?.id || 'new'
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'lv1'
    });
    setSelectedUser(null);
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    addUserMutation.mutate(formData);
  };

  const handleUpdateUser = (e) => {
    e.preventDefault();
    updateUserMutation.mutate({
      id: selectedUser.id,
      data: formData
    });
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsEditModalOpen(true);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'lv2': return 'bg-gradient-to-r from-blue-500 to-cyan-600';
      case 'lv1': return 'bg-gradient-to-r from-green-500 to-emerald-600';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-600';
    }
  };

  const getRoleTextColor = (role) => {
    switch (role) {
      case 'owner': return 'text-purple-600';
      case 'lv2': return 'text-blue-600';
      case 'lv1': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'owner': return 'Owner';
      case 'lv2': return 'Admin';
      case 'lv1': return 'Worker';
      default: return 'Unknown';
    }
  };

  if (!hasRole('owner')) {
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

  if (isLoading) {
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
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  User Management
                </h1>
              </div>
              <p className="text-gray-600">
                Manage all user accounts and permissions for your workshop system.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-xs">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6 bg-white shadow-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:opacity-90 transition-all duration-300"
              >
                <PlusIcon className="h-4 w-4" />
                Add User
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{users.length}</p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Owners</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.role === 'owner').length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Admins</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.role === 'lv2').length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-100 rounded-lg">
                  <ShieldCheckIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Workers</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {users.filter(u => u.role === 'lv1').length}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-100 rounded-lg">
                  <UserIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-indigo-600" />
                All Users
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={resetFilters}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                </button>
                <button 
                  onClick={() => refetch()}
                  className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        User
                        {sortConfig.key === 'name' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email
                        {sortConfig.key === 'email' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => requestSort('role')}
                    >
                      <div className="flex items-center gap-1">
                        Role
                        {sortConfig.key === 'role' ? (
                          sortConfig.direction === 'asc' ? (
                            <ArrowUpIcon className="h-4 w-4" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUpDownIcon className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                              <span className="text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-xs text-gray-500">Joined {formatUserDate(user.created_at)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleTextColor(user.role)} bg-opacity-20`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {user.role !== 'owner' && (
                              <button
                                onClick={() => deleteUserMutation.mutate(user.id)}
                                className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <UserGroupIcon className="h-12 w-12 text-gray-400 mb-4" />
                          <h4 className="text-lg font-medium text-gray-900">No users found</h4>
                          <p className="text-gray-500 mt-1">Try adjusting your search or add a new user</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New User"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleAddUser} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <div className="relative">
              <select
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="lv1">Worker</option>
                <option value="lv2">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addUserMutation.isLoading}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2 px-4 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-70"
            >
              {addUserMutation.isLoading ? 'Adding...' : 'Add User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
            <div className="relative">
              <select
                required
                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-4 border bg-white"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="lv1">Worker</option>
                <option value="lv2">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-lg border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateUserMutation.isLoading}
              className="rounded-lg bg-gradient-to-r from-indigo-600 to-blue-600 py-2 px-4 text-sm font-medium text-white shadow-lg hover:opacity-90 transition-opacity disabled:opacity-70"
            >
              {updateUserMutation.isLoading ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}