'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { 
  getJobCards, 
  addJobCard, 
  updateJobCard, 
  getProducts, 
  addLog 
} from '@/lib/firebase/firestore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import {
  PlusIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserIcon,
  TruckIcon,
  ClockIcon,
  ArrowPathIcon,
  SparklesIcon,
  BoltIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ListBulletIcon
} from '@heroicons/react/24/outline';

export default function JobCards() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  const [formData, setFormData] = useState({
    customer_name: '',
    vehicle_number: '',
    vehicle_model: '',
    issue: '',
    services_done: '',
    parts_used: []
  });

  const { data: jobCards = [], isLoading, refetch } = useQuery('jobCards', getJobCards);
  const { data: products = [] } = useQuery('products', getProducts);

  const createJobCardMutation = useMutation(addJobCard, {
    onSuccess: () => {
      queryClient.invalidateQueries('jobCards');
      setIsCreateModalOpen(false);
      resetForm();
      toast.success('Job card created successfully!');
      logAction('create_job_card', 'Job card created');
    },
    onError: (error) => {
      toast.error('Failed to create job card: ' + error.message);
    }
  });

  const updateJobCardMutation = useMutation(
    ({ id, data }) => updateJobCard(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('jobCards');
        toast.success('Job card updated successfully!');
        logAction('update_job_card', 'Job card status updated');
      },
      onError: (error) => {
        toast.error('Failed to update job card: ' + error.message);
      }
    }
  );

  const logAction = async (action, details) => {
    try {
      await addLog({
        user_id: user.uid,
        action,
        details,
        target_id: selectedJobCard?.id || 'new'
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_name: '',
      vehicle_number: '',
      vehicle_model: '',
      issue: '',
      services_done: '',
      parts_used: []
    });
  };

  const handleCreateJobCard = (e) => {
    e.preventDefault();
    createJobCardMutation.mutate({
      ...formData,
      created_by: user.uid
    });
  };

  const handleStatusUpdate = (jobCard, newStatus) => {
    const updateData = { status: newStatus };
    
    if (newStatus === 'verified' && user.role === 'lv2') {
      updateData.verified_by = user.uid;
    } else if (newStatus === 'approved' && user.role === 'owner') {
      updateData.approved_by = user.uid;
    }
    
    updateJobCardMutation.mutate({
      id: jobCard.id,
      data: updateData
    });
  };

  const addPartToJobCard = () => {
    setFormData({
      ...formData,
      parts_used: [...formData.parts_used, { product_id: '', qty: 1, price: 0 }]
    });
  };

  const removePartFromJobCard = (index) => {
    setFormData({
      ...formData,
      parts_used: formData.parts_used.filter((_, i) => i !== index)
    });
  };

  const updatePartInJobCard = (index, field, value) => {
    const updatedParts = formData.parts_used.map((part, i) => 
      i === index ? { ...part, [field]: value } : part
    );
    setFormData({ ...formData, parts_used: updatedParts });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'verified': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'invoiced': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredJobCards = jobCards.filter(jobCard =>
    jobCard.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jobCard.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = jobCards.filter(j => j.status === 'pending').length;
  const verifiedCount = jobCards.filter(j => j.status === 'verified').length;
  const approvedCount = jobCards.filter(j => j.status === 'approved').length;
  const totalCount = jobCards.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="relative">
          <div className="animate-spin rounded-full h-32 w-32 border-4 border-transparent border-t-blue-500 border-r-purple-500"></div>
          <div className="absolute inset-0 animate-pulse rounded-full h-32 w-32 bg-gradient-to-r from-blue-400 to-purple-400 opacity-20"></div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Job Cards',
      value: totalCount,
      icon: DocumentTextIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-100',
      description: 'All job cards'
    },
    {
      title: 'Pending',
      value: pendingCount,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-gradient-to-br from-yellow-50 to-amber-100',
      description: 'Awaiting verification'
    },
    {
      title: 'Verified',
      value: verifiedCount,
      icon: CheckIcon,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      description: 'Verified by supervisor'
    },
    {
      title: 'Approved',
      value: approvedCount,
      icon: CheckIcon,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
      description: 'Approved by owner'
    }
  ];

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
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                  <DocumentTextIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-blue-800 bg-clip-text text-transparent">
                  Job Cards Management
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Track and manage all vehicle service job cards in your workshop.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <div className="flex items-center gap-2">
                  <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                  <span className="font-semibold">Create Job Card</span>
                </div>
              </button>
              <button
                onClick={() => refetch()}
                className="p-3 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-xl hover:bg-white transition-all duration-300 hover:shadow-lg"
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                    <div className="text-sm text-gray-500">
                      {stat.description}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              );
            })}
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative min-w-0 flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search job cards..."
                    className="block w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <ListBulletIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Squares2X2Icon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Job Cards Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredJobCards.map((jobCard) => (
                <div key={jobCard.id} className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          #{jobCard.id.slice(-6)}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{jobCard.customer_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedJobCard(jobCard);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {jobCard.status === 'pending' && hasRole('lv2') && (
                          <button
                            onClick={() => handleStatusUpdate(jobCard, 'verified')}
                            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        
                        {jobCard.status === 'verified' && hasRole('owner') && (
                          <button
                            onClick={() => handleStatusUpdate(jobCard, 'approved')}
                            className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {jobCard.vehicle_number} ({jobCard.vehicle_model})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(jobCard.status)}`}>
                          {jobCard.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Created:</span>
                        <span className="text-sm text-gray-500">
                          {jobCard.created_at?.toLocaleDateString()}
                        </span>
                      </div>
                      
                      {jobCard.issue && (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="text-xs text-gray-500 line-clamp-2">{jobCard.issue}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Job Card
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredJobCards.map((jobCard) => (
                      <tr key={jobCard.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">#{jobCard.id.slice(-6)}</div>
                              {jobCard.issue && (
                                <div className="text-xs text-gray-500 line-clamp-1">{jobCard.issue}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{jobCard.customer_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{jobCard.vehicle_number}</div>
                          <div className="text-xs text-gray-500">{jobCard.vehicle_model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(jobCard.status)}`}>
                            {jobCard.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {jobCard.created_at?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedJobCard(jobCard);
                                setIsViewModalOpen(true);
                              }}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            
                            {jobCard.status === 'pending' && hasRole('lv2') && (
                              <button
                                onClick={() => handleStatusUpdate(jobCard, 'verified')}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                            
                            {jobCard.status === 'verified' && hasRole('owner') && (
                              <button
                                onClick={() => handleStatusUpdate(jobCard, 'approved')}
                                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                              >
                                <CheckIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredJobCards.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No job cards found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'Start by creating your first job card.'
                }
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 inline mr-2" />
                Create First Job Card
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Create Job Card Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Job Card"
        maxWidth="max-w-2xl"
      >
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Create a new job card</h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">Fill in the details below to create a new job card for vehicle service.</p>
        </div>
        <form onSubmit={handleCreateJobCard} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input
                type="text"
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value })}
                placeholder="e.g. KA01AB1234"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
            <input
              type="text"
              required
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={formData.vehicle_model}
              onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
              placeholder="e.g. Honda City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue/Problem</label>
            <textarea
              rows="3"
              required
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={formData.issue}
              onChange={(e) => setFormData({ ...formData, issue: e.target.value })}
              placeholder="Describe the issue with the vehicle"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Services Done</label>
            <textarea
              rows="3"
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={formData.services_done}
              onChange={(e) => setFormData({ ...formData, services_done: e.target.value })}
              placeholder="List all services performed"
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 mb-1">Parts Used</label>
              <button
                type="button"
                onClick={addPartToJobCard}
                className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
              >
                + Add Part
              </button>
            </div>
            
            {formData.parts_used.map((part, index) => (
              <div key={index} className="flex items-center gap-3 mt-2">
                <select
                  className="flex-1 rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                  value={part.product_id}
                  onChange={(e) => updatePartInJobCard(index, 'product_id', e.target.value)}
                >
                  <option value="">Select product</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - ₹{product.unit_price}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  className="w-20 rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                  value={part.qty}
                  onChange={(e) => updatePartInJobCard(index, 'qty', parseInt(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => removePartFromJobCard(index)}
                  className="p-2 text-red-500 hover:text-red-700 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border-2 border-gray-200 bg-white py-3 px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createJobCardMutation.isLoading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-3 px-6 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {createJobCardMutation.isLoading ? 'Creating...' : 'Create Job Card'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Job Card Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Job Card #${selectedJobCard?.id?.slice(-6)}`}
        maxWidth="max-w-2xl"
      >
        {selectedJobCard && (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Job Card Details</h3>
              </div>
              <p className="text-sm text-gray-600 mt-2">View all details of this job card.</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedJobCard.customer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedJobCard.vehicle_number}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Model</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedJobCard.vehicle_model}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue/Problem</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{selectedJobCard.issue}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services Done</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{selectedJobCard.services_done || 'Not specified'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${getStatusColor(selectedJobCard.status)}`}>
                  {selectedJobCard.status}
                </span>
              </div>

              {selectedJobCard.parts_used && selectedJobCard.parts_used.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parts Used</label>
                  <div className="mt-2 space-y-2">
                    {selectedJobCard.parts_used.map((part, index) => {
                      const product = products.find(p => p.id === part.product_id);
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="text-sm font-medium text-gray-900">
                            {product?.name || 'Unknown Product'} (Qty: {part.qty})
                          </div>
                          {product && (
                            <div className="text-xs text-gray-500">
                              Price: ₹{product.unit_price.toLocaleString()} each
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="rounded-xl border-2 border-gray-200 bg-white py-3 px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}