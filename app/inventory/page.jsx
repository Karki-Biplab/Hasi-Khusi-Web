'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { getProducts, addProduct, updateProduct, deleteProduct, addLog } from '@/lib/firebase/firestore';
import { processTopProductsData } from '@/lib/utils/analytics';
import { BarChartComponent } from '@/components/ui/ChartComponents';
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
  CubeIcon,
  ChartBarIcon,
  TagIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  BoltIcon,
  ArchiveBoxIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export default function Inventory() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit_price: '',
    description: ''
  });

  const { data: products = [], isLoading, refetch } = useQuery('products', getProducts);

  const addProductMutation = useMutation(addProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      setIsAddModalOpen(false);
      resetForm();
      toast.success('Product added successfully!');
      logAction('add_product', 'Product added');
    },
    onError: (error) => {
      toast.error('Failed to add product: ' + error.message);
    }
  });

  const updateProductMutation = useMutation(
    ({ id, data }) => updateProduct(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('products');
        setIsEditModalOpen(false);
        resetForm();
        toast.success('Product updated successfully!');
        logAction('update_product', 'Product updated');
      },
      onError: (error) => {
        toast.error('Failed to update product: ' + error.message);
      }
    }
  );

  const deleteProductMutation = useMutation(deleteProduct, {
    onSuccess: () => {
      queryClient.invalidateQueries('products');
      toast.success('Product deleted successfully!');
      logAction('delete_product', 'Product deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    }
  });

  const logAction = async (action, details) => {
    try {
      await addLog({
        user_id: user.uid,
        action,
        details,
        target_id: selectedProduct?.id || 'new'
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: '',
      unit_price: '',
      description: ''
    });
    setSelectedProduct(null);
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    addProductMutation.mutate({
      ...formData,
      quantity: parseInt(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      last_updated_by: user.uid
    });
  };

  const handleUpdateProduct = (e) => {
    e.preventDefault();
    updateProductMutation.mutate({
      id: selectedProduct.id,
      data: {
        ...formData,
        quantity: parseInt(formData.quantity),
        unit_price: parseFloat(formData.unit_price),
        last_updated_by: user.uid
      }
    });
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      quantity: product.quantity.toString(),
      unit_price: product.unit_price.toString(),
      description: product.description || ''
    });
    setIsEditModalOpen(true);
  };

  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !categoryFilter || product.category === categoryFilter;
      const matchesStock = !stockFilter || 
                          (stockFilter === 'low' && product.quantity <= 10) ||
                          (stockFilter === 'medium' && product.quantity > 10 && product.quantity <= 50) ||
                          (stockFilter === 'high' && product.quantity > 50);
      return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const categories = [...new Set(products.map(p => p.category))];
  const totalValue = products.reduce((sum, p) => sum + (p.quantity * p.unit_price), 0);
  const lowStockCount = products.filter(p => p.quantity <= 10).length;
  const outOfStockCount = products.filter(p => p.quantity === 0).length;

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800 border-red-200' };
    if (quantity <= 5) return { label: 'Critical', color: 'bg-red-100 text-red-800 border-red-200' };
    if (quantity <= 10) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    if (quantity <= 50) return { label: 'Medium Stock', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    return { label: 'High Stock', color: 'bg-green-100 text-green-800 border-green-200' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

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
      title: 'Total Products',
      value: products.length,
      icon: CubeIcon,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      description: 'Active items in stock'
    },
    {
      title: 'Total Value',
      value: formatCurrency(totalValue),
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
      description: 'Inventory worth'
    },
    {
      title: 'Low Stock',
      value: lowStockCount,
      icon: ExclamationTriangleIcon,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
      description: 'Items need restocking'
    },
    {
      title: 'Out of Stock',
      value: outOfStockCount,
      icon: ArchiveBoxIcon,
      color: 'text-red-600',
      bgColor: 'bg-gradient-to-br from-red-50 to-pink-100',
      description: 'Items unavailable'
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
                <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-emerald-800 to-teal-800 bg-clip-text text-transparent">
                  Inventory Management
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Manage your workshop's products, parts, and stock levels with ease.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasRole('owner') && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-semibold">Add Product</span>
                  </div>
                </button>
              )}
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

          {/* Analytics Chart */}
          <div className="bg-white rounded-xl border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all duration-300">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-t-xl border-b border-blue-100">
              <h3 className="flex items-center gap-2 text-xl font-bold text-gray-800 mb-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                Top Products by Value
              </h3>
              <p className="text-gray-600">Most valuable items in your inventory</p>
            </div>
            <div className="p-6">
              <BarChartComponent 
                data={processTopProductsData(products)}
                dataKey="value"
                xAxisKey="name"
                title=""
                color="#3B82F6"
              />
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative min-w-0 flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="block w-full rounded-xl border-2 border-gray-200 py-3 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select
                  className="rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                
                <select
                  className="rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                  value={stockFilter}
                  onChange={(e) => setStockFilter(e.target.value)}
                >
                  <option value="">All Stock Levels</option>
                  <option value="low">Low Stock</option>
                  <option value="medium">Medium Stock</option>
                  <option value="high">High Stock</option>
                </select>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
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
                </div>
              </div>
            </div>
          </div>

          {/* Products Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.quantity);
                return (
                  <div key={product.id} className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
                    <div className="relative z-10 p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          <div className="flex items-center gap-2 mb-2">
                            <TagIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{product.category}</span>
                          </div>
                        </div>
                        {hasRole('lv2') && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {hasRole('owner') && (
                              <button
                                onClick={() => deleteProductMutation.mutate(product.id)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Stock:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                            {product.quantity} - {stockStatus.label}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Unit Price:</span>
                          <span className="text-sm font-bold text-gray-900">₹{product.unit_price.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Total Value:</span>
                          <span className="text-sm font-bold text-emerald-600">₹{(product.quantity * product.unit_price).toLocaleString()}</span>
                        </div>
                        
                        {product.description && (
                          <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-500 line-clamp-2">{product.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Stock Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Unit Price
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total Value
                      </th>
                      {hasRole('lv2') && (
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      return (
                        <tr key={product.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                                <CubeIcon className="h-5 w-5 text-white" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-bold text-gray-900">{product.name}</div>
                                {product.description && (
                                  <div className="text-xs text-gray-500 line-clamp-1">{product.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${stockStatus.color}`}>
                                {product.quantity} - {stockStatus.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{product.unit_price.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600">
                            ₹{(product.quantity * product.unit_price).toLocaleString()}
                          </td>
                          {hasRole('lv2') && (
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                {hasRole('owner') && (
                                  <button
                                    onClick={() => deleteProductMutation.mutate(product.id)}
                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-12 text-center">
              <CubeIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || categoryFilter || stockFilter 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Start by adding your first product to the inventory.'
                }
              </p>
              {hasRole('owner') && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Add First Product
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
        maxWidth="max-w-2xl"
      >
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Add a new product to your inventory</h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">Fill in the details below to add a new product to your workshop inventory.</p>
        </div>
        <form onSubmit={handleAddProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Brake Pads"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Engine Parts">Engine Parts</option>
                <option value="Brake System">Brake System</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Parts">Body Parts</option>
                <option value="Fluids">Fluids</option>
                <option value="Tools">Tools</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="0"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g. 50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="e.g. 499.99"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="3"
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional product description"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border-2 border-gray-200 bg-white py-3 px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addProductMutation.isLoading}
              className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 px-6 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {addProductMutation.isLoading ? 'Adding...' : 'Add Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Product"
        maxWidth="max-w-2xl"
      >
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
              <PencilIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Update product details</h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">Modify the details below to update this product in your inventory.</p>
        </div>
        <form onSubmit={handleUpdateProduct} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Brake Pads"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                required
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select category</option>
                <option value="Engine Parts">Engine Parts</option>
                <option value="Brake System">Brake System</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Parts">Body Parts</option>
                <option value="Fluids">Fluids</option>
                <option value="Tools">Tools</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                required
                min="0"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="e.g. 50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
                value={formData.unit_price}
                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                placeholder="e.g. 499.99"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows="3"
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional product description"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl border-2 border-gray-200 bg-white py-3 px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProductMutation.isLoading}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 py-3 px-6 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {updateProductMutation.isLoading ? 'Updating...' : 'Update Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}