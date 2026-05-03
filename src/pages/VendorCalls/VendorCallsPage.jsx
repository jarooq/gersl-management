import React, { useState, useEffect, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import API from '../../services/api';
import {
  Store,
  TrendingUp,
  Users,
  CheckCircle,
  Plus,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Download,
  X,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  Target,
  Package,
  ShoppingCart
} from 'lucide-react';

const VendorCallsPage = () => {
  const { vendorCalls } = useCampaign();
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCall, setEditingCall] = useState(null);
  const [viewingCall, setViewingCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const [callForm, setCallForm] = useState({
    title: '',
    description: '',
    category: 'Goods',
    requirements: '',
    specifications: '',
    budget: '',
    publishedDate: new Date().toISOString().split('T')[0],
    submissionDeadline: '',
    evaluationCriteria: '',
    termsAndConditions: '',
    status: 'Draft',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    bondRequired: false,
    preBidMeetingDate: ''
  });

  const categories = ['Goods', 'Services', 'Construction', 'Consultancy', 'Equipment', 'Other'];
  const callStatuses = ['All', 'Active', 'Draft', 'Closed', 'Awarded', 'Cancelled'];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCallForm({
      ...callForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = { ...callForm };
      if (formData.budget) {
        formData.budget = parseFloat(formData.budget);
      }

      if (editingCall) {
        await API.VendorCall.update(editingCall.id, formData);
      } else {
        await API.VendorCall.create(formData);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error saving vendor call:', error);
      alert('Failed to save vendor call. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCallForm({
      title: '',
      description: '',
      category: 'Goods',
      requirements: '',
      specifications: '',
      budget: '',
      publishedDate: new Date().toISOString().split('T')[0],
      submissionDeadline: '',
      evaluationCriteria: '',
      termsAndConditions: '',
      status: 'Draft',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      bondRequired: false,
      preBidMeetingDate: ''
    });
    setEditingCall(null);
    setShowModal(false);
  };

  const handleNewCall = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (call) => {
    setEditingCall(call);
    setCallForm({
      title: call.title || '',
      description: call.description || '',
      category: call.category || 'Goods',
      requirements: call.requirements || '',
      specifications: call.specifications || '',
      budget: call.budget?.toString() || '',
      publishedDate: call.publishedDate || new Date().toISOString().split('T')[0],
      submissionDeadline: call.submissionDeadline || '',
      evaluationCriteria: call.evaluationCriteria || '',
      termsAndConditions: call.termsAndConditions || '',
      status: call.status || 'Draft',
      contactPerson: call.contactPerson || '',
      contactEmail: call.contactEmail || '',
      contactPhone: call.contactPhone || '',
      bondRequired: call.bondRequired || false,
      preBidMeetingDate: call.preBidMeetingDate || ''
    });
    setShowModal(true);
  };

  const handleView = (call) => {
    setViewingCall(call);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vendor call?')) {
      try {
        await API.VendorCall.delete(id);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting vendor call:', error);
        alert('Failed to delete vendor call');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Active': { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
      'Draft': { label: 'Draft', color: 'text-ink-700', bgColor: 'bg-ink-100', icon: FileText },
      'Closed': { label: 'Closed', color: 'text-red-700', bgColor: 'bg-red-100', icon: X },
      'Awarded': { label: 'Awarded', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Target },
      'Cancelled': { label: 'Cancelled', color: 'text-orange-700', bgColor: 'bg-orange-100', icon: AlertCircle }
    };
    return badges[status] || badges['Draft'];
  };

  const getCategoryBadge = (category) => {
    const badges = {
      'Goods': { color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'Services': { color: 'text-purple-700', bgColor: 'bg-purple-100' },
      'Construction': { color: 'text-orange-700', bgColor: 'bg-orange-100' },
      'Consultancy': { color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
      'Equipment': { color: 'text-green-700', bgColor: 'bg-green-100' },
      'Other': { color: 'text-ink-700', bgColor: 'bg-ink-100' }
    };
    return badges[category] || badges['Other'];
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Tender Code', 'Title', 'Category', 'Budget', 'Status', 'Published Date', 'Deadline', 'Submissions'];
    const rows = filteredCalls.map(call => [
      call.id,
      call.tenderCode,
      call.title,
      call.category,
      call.budget || 'N/A',
      call.status,
      call.publishedDate,
      call.submissionDeadline || 'N/A',
      call.submissions?.length || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor_calls_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredCalls = useMemo(() => {
    return vendorCalls.filter(call => {
      const matchesSearch =
        (call.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.tenderCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (call.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || call.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || call.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendorCalls, searchTerm, statusFilter, categoryFilter]);

  const stats = useMemo(() => {
    const total = vendorCalls.length;
    const active = vendorCalls.filter(c => c.status === 'Active').length;
    const awarded = vendorCalls.filter(c => c.status === 'Awarded').length;
    const draft = vendorCalls.filter(c => c.status === 'Draft').length;
    const totalSubmissions = vendorCalls.reduce((sum, c) => sum + (c.submissions?.length || 0), 0);
    const totalBudget = vendorCalls.reduce((sum, c) => sum + (c.budget || 0), 0);

    return { total, active, awarded, draft, totalSubmissions, totalBudget };
  }, [vendorCalls]);

  return (
    <div className="p-8 bg-ink-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-xl p-6 text-white shadow-card relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" ></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Vendor Calls & Tenders</h1>
                <p className="text-fuchsia-100 text-sm">Manage procurement tenders, track submissions, and award contracts</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
              <div className="text-center">
                <p className="text-sm text-fuchsia-100">Active Tenders</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Tenders</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.total}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">{stats.active} active</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Store className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Budget</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">${(stats.totalBudget / 1000).toFixed(0)}K</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">All tenders</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <DollarSign className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Submissions</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.totalSubmissions}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Total received</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Users className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer" >
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Awarded</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.awarded}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">{stats.draft} draft</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Target className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-1 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search vendor calls..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              {callStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="All">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={handleNewCall}
              className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Vendor Call
            </button>
          </div>
        </div>
      </div>

      {/* Vendor Calls Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Tender</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Category</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Budget</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Deadline</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Submissions</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredCalls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-ink-500">
                    <Store className="w-12 h-12 mx-auto mb-3 text-ink-300" />
                    <p className="text-lg font-medium">No vendor calls found</p>
                    <p className="text-sm">Create your first tender to start procurement</p>
                  </td>
                </tr>
              ) : (
                filteredCalls.map((call) => {
                  const statusBadge = getStatusBadge(call.status);
                  const categoryBadge = getCategoryBadge(call.category);
                  return (
                    <tr key={call.id} className="hover:bg-fuchsia-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-ink-800">{call.title}</p>
                          <p className="text-sm text-ink-500">{call.tenderCode}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${categoryBadge.bgColor} ${categoryBadge.color}`}>
                          {call.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {call.budget ? (
                          <p className="font-bold text-green-600">${call.budget.toLocaleString()}</p>
                        ) : (
                          <p className="text-sm text-ink-400">Not specified</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {call.submissionDeadline ? (
                          <div className="flex items-center gap-1 text-sm text-ink-600">
                            <Clock className="w-4 h-4 text-ink-500" />
                            {new Date(call.submissionDeadline).toLocaleDateString()}
                          </div>
                        ) : (
                          <p className="text-sm text-ink-400">No deadline</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {call.submissions && call.submissions.length > 0 ? (
                          <p className="text-sm font-medium text-blue-600 flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {call.submissions.length}
                          </p>
                        ) : (
                          <p className="text-sm text-ink-400">0</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${statusBadge.bgColor} ${statusBadge.color}`}>
                          <statusBadge.icon className="w-3 h-3" />
                          {statusBadge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(call)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {call.status !== 'Awarded' && call.status !== 'Cancelled' && (
                            <button
                              onClick={() => handleEdit(call)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(call.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingCall ? 'Edit Vendor Call' : 'Create New Vendor Call'}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Tender Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={callForm.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="e.g., Supply of Office Equipment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Category *</label>
                  <select
                    name="category"
                    value={callForm.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Budget ($)</label>
                  <input
                    type="number"
                    name="budget"
                    value={callForm.budget}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Published Date *</label>
                  <input
                    type="date"
                    name="publishedDate"
                    value={callForm.publishedDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Submission Deadline</label>
                  <input
                    type="date"
                    name="submissionDeadline"
                    value={callForm.submissionDeadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Status *</label>
                  <select
                    name="status"
                    value={callForm.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Awarded">Awarded</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Pre-Bid Meeting Date</label>
                  <input
                    type="date"
                    name="preBidMeetingDate"
                    value={callForm.preBidMeetingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Person</label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={callForm.contactPerson}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={callForm.contactEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="procurement@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={callForm.contactPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="bondRequired"
                      checked={callForm.bondRequired}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-fuchsia-600 focus:ring-fuchsia-500 rounded"
                    />
                    <span className="text-sm font-medium text-ink-700">Performance Bond Required</span>
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={callForm.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Detailed description of the tender..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Specifications</label>
                  <textarea
                    name="specifications"
                    value={callForm.specifications}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Technical specifications (one per line)..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Requirements</label>
                  <textarea
                    name="requirements"
                    value={callForm.requirements}
                    onChange={handleInputChange}
                    rows="4"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Vendor requirements and qualifications..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Evaluation Criteria</label>
                  <textarea
                    name="evaluationCriteria"
                    value={callForm.evaluationCriteria}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="How submissions will be evaluated..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Terms and Conditions</label>
                  <textarea
                    name="termsAndConditions"
                    value={callForm.termsAndConditions}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Terms and conditions for this tender..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg font-semibold transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : editingCall ? 'Update Tender' : 'Create Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewingCall.title}</h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-fuchsia-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Tender Code</p>
                  <p className="text-lg font-bold text-ink-800">{viewingCall.tenderCode}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Category</p>
                  <p className="text-lg font-bold text-ink-800">{viewingCall.category}</p>
                </div>
              </div>

              {viewingCall.budget && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    Budget
                  </p>
                  <p className="text-2xl font-bold text-green-600">${viewingCall.budget.toLocaleString()}</p>
                </div>
              )}

              <div className="border-t pt-4">
                <h3 className="font-semibold text-ink-700 mb-2">Description</h3>
                <p className="text-ink-600 text-sm whitespace-pre-line">{viewingCall.description}</p>
              </div>

              {viewingCall.specifications && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Specifications</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingCall.specifications}</p>
                </div>
              )}

              {viewingCall.requirements && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Requirements</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingCall.requirements}</p>
                </div>
              )}

              {viewingCall.evaluationCriteria && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Evaluation Criteria</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line">{viewingCall.evaluationCriteria}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <p className="text-sm text-ink-600 mb-1">Published Date</p>
                  <p className="font-semibold text-ink-800">{new Date(viewingCall.publishedDate).toLocaleDateString()}</p>
                </div>
                {viewingCall.submissionDeadline && (
                  <div>
                    <p className="text-sm text-ink-600 mb-1 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Submission Deadline
                    </p>
                    <p className="font-semibold text-ink-800">{new Date(viewingCall.submissionDeadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-ink-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingCall.status).bgColor} ${getStatusBadge(viewingCall.status).color}`}>
                    {viewingCall.status}
                  </span>
                </div>
                {viewingCall.bondRequired && (
                  <div>
                    <span className="text-xs px-3 py-1 bg-orange-100 text-orange-700 rounded-full font-medium">
                      Performance Bond Required
                    </span>
                  </div>
                )}
              </div>

              {(viewingCall.contactPerson || viewingCall.contactEmail || viewingCall.contactPhone) && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {viewingCall.contactPerson && (
                      <p className="text-ink-600">Person: <span className="font-medium text-ink-800">{viewingCall.contactPerson}</span></p>
                    )}
                    {viewingCall.contactEmail && (
                      <p className="text-ink-600">Email: <span className="font-medium text-ink-800">{viewingCall.contactEmail}</span></p>
                    )}
                    {viewingCall.contactPhone && (
                      <p className="text-ink-600">Phone: <span className="font-medium text-ink-800">{viewingCall.contactPhone}</span></p>
                    )}
                  </div>
                </div>
              )}

              {viewingCall.termsAndConditions && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-2">Terms and Conditions</h3>
                  <p className="text-ink-600 text-sm whitespace-pre-line bg-ink-50 p-4 rounded-lg">{viewingCall.termsAndConditions}</p>
                </div>
              )}

              {viewingCall.submissions && viewingCall.submissions.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-fuchsia-600" />
                    Vendor Submissions ({viewingCall.submissions.length})
                  </h3>
                  <p className="text-sm text-ink-600">Total submissions received for this tender</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorCallsPage;
