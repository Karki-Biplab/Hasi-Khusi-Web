'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuthStore } from '@/lib/store/auth';
import { 
  getInvoices, 
  addInvoice, 
  getJobCards, 
  getProducts, 
  updateJobCard,
  addLog 
} from '@/lib/firebase/firestore';
import Sidebar from '@/components/Layout/Sidebar';
import Header from '@/components/Layout/Header';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PlusIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  UserIcon,
  TruckIcon,
  CalendarIcon,
  ArrowPathIcon,
  SparklesIcon,
  Squares2X2Icon,
  ListBulletIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Invoices() {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedJobCard, setSelectedJobCard] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('table');

  const { data: invoices = [], isLoading, refetch } = useQuery('invoices', getInvoices);
  const { data: jobCards = [] } = useQuery('jobCards', getJobCards);
  const { data: products = [] } = useQuery('products', getProducts);

  const approvedJobCards = jobCards.filter(jc => jc.status === 'approved');

  const createInvoiceMutation = useMutation(addInvoice, {
    onSuccess: () => {
      queryClient.invalidateQueries('invoices');
      queryClient.invalidateQueries('jobCards');
      setIsCreateModalOpen(false);
      toast.success('Invoice created successfully!');
      logAction('create_invoice', 'Invoice generated');
    },
    onError: (error) => {
      toast.error('Failed to create invoice: ' + error.message);
    }
  });

  const logAction = async (action, details) => {
    try {
      await addLog({
        user_id: user.uid,
        action,
        details,
        target_id: selectedInvoice?.id || selectedJobCard?.id || 'new'
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const calculateInvoiceTotal = (jobCard) => {
    const partsTotal = jobCard.parts_used?.reduce((total, part) => {
      const product = products.find(p => p.id === part.product_id);
      return total + (product?.unit_price || 0) * part.qty;
    }, 0) || 0;

    const serviceCharge = 500; // Fixed service charge
    const subtotal = partsTotal + serviceCharge;
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + tax;

    return {
      partsTotal,
      serviceCharge,
      subtotal,
      tax,
      total
    };
  };

  const handleCreateInvoice = async () => {
    if (!selectedJobCard) return;

    const invoiceData = calculateInvoiceTotal(selectedJobCard);
    
    try {
      // Create invoice
      await createInvoiceMutation.mutateAsync({
        job_card_id: selectedJobCard.id,
        customer_name: selectedJobCard.customer_name,
        vehicle_number: selectedJobCard.vehicle_number,
        vehicle_model: selectedJobCard.vehicle_model,
        parts_used: selectedJobCard.parts_used,
        services_done: selectedJobCard.services_done,
        ...invoiceData,
        created_by: user.uid
      });

      // Update job card status
      await updateJobCard(selectedJobCard.id, { status: 'invoiced' });
      
      setSelectedJobCard(null);
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const generatePDF = (invoice) => {
    const doc = new jsPDF();
    
    // Add logo and header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('HasiKhusi Auto Works', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Kahare Chowk, Kathmandu, Nepal', 105, 30, { align: 'center' });
    doc.text('Phone: +91 9876543210 | Email: contact@autocare.com', 105, 36, { align: 'center' });
    
    // Invoice title and details
    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 105, 50, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${invoice.id.slice(-8)}`, 20, 60);
    doc.text(`Date: ${invoice.created_at?.toLocaleDateString()}`, 20, 66);
    
    // Customer details
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Customer Details:', 20, 80);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${invoice.customer_name}`, 20, 88);
    doc.text(`Vehicle: ${invoice.vehicle_number} (${invoice.vehicle_model})`, 20, 94);
    
    // Services section
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text('Services Performed:', 20, 110);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    const servicesLines = doc.splitTextToSize(invoice.services_done || 'General service and maintenance', 170);
    doc.text(servicesLines, 20, 118);
    
    // Parts table
    if (invoice.parts_used && invoice.parts_used.length > 0) {
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'bold');
      doc.text('Parts Used:', 20, 140);
      
      const partsData = invoice.parts_used.map(part => {
        const product = products.find(p => p.id === part.product_id);
        const price = product?.unit_price || 0;
        return [
          product?.name || 'Unknown',
          part.qty,
          `₹${price.toFixed(2)}`,
          `₹${(price * part.qty).toFixed(2)}`
        ];
      });
      
      autoTable(doc, {
        startY: 148,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: partsData,
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          cellPadding: 3,
          fontSize: 9,
          valign: 'middle'
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 }
        },
        margin: { left: 20 }
      });
    }
    
    // Totals
    const startY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Parts Total:`, 140, startY);
    doc.text(`₹${invoice.partsTotal.toFixed(2)}`, 170, startY);
    
    doc.text(`Service Charge:`, 140, startY + 6);
    doc.text(`₹${invoice.serviceCharge.toFixed(2)}`, 170, startY + 6);
    
    doc.text(`Subtotal:`, 140, startY + 12);
    doc.text(`₹${invoice.subtotal.toFixed(2)}`, 170, startY + 12);
    
    doc.text(`Tax (13%):`, 140, startY + 18);
    doc.text(`₹${invoice.tax.toFixed(2)}`, 170, startY + 18);
    
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Amount:`, 140, startY + 28);
    doc.text(`₹${invoice.total.toFixed(2)}`, 170, startY + 28);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for your business!', 105, 280, { align: 'center' });
    doc.text('Please make payment within 15 days', 105, 285, { align: 'center' });
    
    doc.save(`invoice-${invoice.id.slice(-8)}.pdf`);
  };

  const filteredInvoices = invoices.filter(invoice =>
    invoice.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.vehicle_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidCount = invoices.length;
  const pendingPaymentCount = 0; // You can add payment status tracking if needed

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
      title: 'Total Invoices',
      value: invoices.length,
      icon: DocumentTextIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-50 to-blue-100',
      description: 'All generated invoices'
    },
    {
      title: 'Total Revenue',
      value: `₹${totalAmount.toLocaleString()}`,
      icon: CurrencyDollarIcon,
      color: 'text-emerald-600',
      bgColor: 'bg-gradient-to-br from-emerald-50 to-green-100',
      description: 'Total amount invoiced'
    },
    {
      title: 'Paid Invoices',
      value: paidCount,
      icon: CheckIcon,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
      description: 'Completed payments'
    },
    {
      title: 'Pending Payment',
      value: pendingPaymentCount,
      icon: ClockIcon,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-50 to-orange-100',
      description: 'Awaiting payment'
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
                  Invoices Management
                </h1>
              </div>
              <p className="text-gray-600 text-lg">
                Generate and manage professional invoices for completed services.
              </p>
            </div>
            <div className="flex items-center gap-4">
              {hasRole('lv2') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center gap-2">
                    <PlusIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
                    <span className="font-semibold">Create Invoice</span>
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

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
              <div className="flex flex-wrap gap-4 flex-1">
                <div className="relative min-w-0 flex-1 max-w-md">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
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

          {/* Invoices Display */}
          {viewMode === 'grid' ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredInvoices.map((invoice) => (
                <div key={invoice.id} className="group relative overflow-hidden bg-white rounded-xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-blue-50 to-indigo-100"></div>
                  <div className="relative z-10 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          #{invoice.id.slice(-8)}
                        </h3>
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{invoice.customer_name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setIsViewModalOpen(true);
                          }}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => generatePDF(invoice)}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Vehicle:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {invoice.vehicle_number} ({invoice.vehicle_model})
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Date:</span>
                        <span className="text-sm text-gray-500">
                          {invoice.created_at?.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Total:</span>
                        <span className="text-sm font-bold text-emerald-600">
                          ₹{invoice.total.toLocaleString()}
                        </span>
                      </div>
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
                        Invoice
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <DocumentTextIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900">#{invoice.id.slice(-8)}</div>
                              <div className="text-xs text-gray-500">Job #{invoice.job_card_id.slice(-6)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.customer_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{invoice.vehicle_number}</div>
                          <div className="text-xs text-gray-500">{invoice.vehicle_model}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-emerald-600">₹{invoice.total.toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {invoice.created_at?.toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setIsViewModalOpen(true);
                              }}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => generatePDF(invoice)}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                              <DocumentArrowDownIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {filteredInvoices.length === 0 && (
            <div className="bg-white rounded-xl border-2 border-gray-200 shadow-lg p-12 text-center">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : approvedJobCards.length > 0 
                    ? 'Create your first invoice from an approved job card.'
                    : 'No approved job cards available to create invoices.'
                }
              </p>
              {approvedJobCards.length > 0 && hasRole('lv2') && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <PlusIcon className="h-5 w-5 inline mr-2" />
                  Create First Invoice
                </button>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Invoice"
        maxWidth="max-w-2xl"
      >
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Generate Invoice</h3>
          </div>
          <p className="text-sm text-gray-600 mt-2">Select an approved job card to generate an invoice.</p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Approved Job Card</label>
            <select
              className="block w-full rounded-xl border-2 border-gray-200 py-3 px-4 text-gray-900 focus:border-blue-500 focus:ring-0 transition-colors duration-200"
              value={selectedJobCard?.id || ''}
              onChange={(e) => {
                const jobCard = approvedJobCards.find(jc => jc.id === e.target.value);
                setSelectedJobCard(jobCard);
              }}
            >
              <option value="">Select a job card</option>
              {approvedJobCards.map(jobCard => (
                <option key={jobCard.id} value={jobCard.id}>
                  #{jobCard.id.slice(-6)} - {jobCard.customer_name} ({jobCard.vehicle_number})
                </option>
              ))}
            </select>
          </div>

          {selectedJobCard && (
            <div className="bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Invoice Preview</h4>
              
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500">Customer:</div>
                    <div className="font-medium">{selectedJobCard.customer_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Vehicle:</div>
                    <div className="font-medium">{selectedJobCard.vehicle_number} ({selectedJobCard.vehicle_model})</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-gray-500">Services:</div>
                  <div className="font-medium">{selectedJobCard.services_done || 'General service and maintenance'}</div>
                </div>
                
                {selectedJobCard.parts_used && selectedJobCard.parts_used.length > 0 && (
                  <div>
                    <div className="text-gray-500 mb-2">Parts Used:</div>
                    <div className="space-y-2">
                      {selectedJobCard.parts_used.map((part, index) => {
                        const product = products.find(p => p.id === part.product_id);
                        const lineTotal = (product?.unit_price || 0) * part.qty;
                        return (
                          <div key={index} className="flex justify-between bg-white p-3 rounded-lg border border-gray-200">
                            <div>
                              <div className="font-medium">{product?.name || 'Unknown'}</div>
                              <div className="text-xs text-gray-500">Qty: {part.qty}</div>
                            </div>
                            <div className="font-medium">₹{lineTotal.toFixed(2)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div className="border-t pt-4 mt-4">
                  {(() => {
                    const invoiceData = calculateInvoiceTotal(selectedJobCard);
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Parts Total:</span>
                          <span>₹{invoiceData.partsTotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge:</span>
                          <span>₹{invoiceData.serviceCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>₹{invoiceData.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (18%):</span>
                          <span>₹{invoiceData.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2">
                          <span>Total:</span>
                          <span>₹{invoiceData.total.toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border-2 border-gray-200 bg-white py-3 px-6 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateInvoice}
              disabled={!selectedJobCard || createInvoiceMutation.isLoading}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 py-3 px-6 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
            >
              {createInvoiceMutation.isLoading ? 'Creating...' : 'Generate Invoice'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`Invoice #${selectedInvoice?.id?.slice(-8)}`}
        maxWidth="max-w-2xl"
      >
        {selectedInvoice && (
          <>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <DocumentTextIcon className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">Invoice Details</h3>
              </div>
              <p className="text-sm text-gray-600 mt-2">View all details of this invoice.</p>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedInvoice.customer_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedInvoice.vehicle_number} ({selectedInvoice.vehicle_model})</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Services Done</label>
                <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg whitespace-pre-line">{selectedInvoice.services_done}</p>
              </div>

              {selectedInvoice.parts_used && selectedInvoice.parts_used.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Parts Used</label>
                  <div className="mt-2 space-y-2">
                    {selectedInvoice.parts_used.map((part, index) => {
                      const product = products.find(p => p.id === part.product_id);
                      const lineTotal = (product?.unit_price || 0) * part.qty;
                      return (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {product?.name || 'Unknown Product'}
                              </div>
                              <div className="text-xs text-gray-500">Qty: {part.qty}</div>
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              ₹{lineTotal.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Parts Total:</span>
                    <span>₹{selectedInvoice.partsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>₹{selectedInvoice.serviceCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (18%):</span>
                    <span>₹{selectedInvoice.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  onClick={() => generatePDF(selectedInvoice)}
                  className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 py-3 px-6 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <DocumentArrowDownIcon className="h-5 w-5 inline mr-2" />
                  Download PDF
                </button>
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