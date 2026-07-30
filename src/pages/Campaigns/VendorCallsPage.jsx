import React, { useState, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import {
  Store,
  Package,
  Calendar,
  DollarSign,
  Users,
  Search,
  Filter,
  Plus,
  X,
  Eye,
  Download,
  CheckCircle,
  XCircle,
  Edit,
  FileText,
  Clock
} from 'lucide-react';

const VendorCallsPage = () => {
  const {
    vendorCalls,
    addVendorCall,
    updateVendorCall,
    closeVendorCall
  } = useCampaign();

  // State Management
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const [editingCall, setEditingCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const [vendorForm, setVendorForm] = useState({
    title: '',
    category: 'Goods',
    description: '',
    requirements: '',
    budget: '',
    deadline: '',
    projectId: '',
    deliveryLocation: '',
    contactEmail: '',
    contactPhone: '',
    specifications: ''
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const openCalls = vendorCalls.filter(v => v.status === 'Open').length;
    const closedCalls = vendorCalls.filter(v => v.status === 'Closed').length;
    const totalBids = vendorCalls.reduce((sum, v) => sum + (v.bids || 0), 0);

    return {
      totalCalls: vendorCalls.length,
      openCalls,
      closedCalls,
      totalBids
    };
  }, [vendorCalls]);

  // Filter vendor calls
  const filteredCalls = useMemo(() => {
    return vendorCalls.filter(call => {
      const matchesSearch = call.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || call.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || call.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [vendorCalls, searchTerm, statusFilter, categoryFilter]);

  // Handlers
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!vendorForm.title || !vendorForm.category || !vendorForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    if (editingCall) {
      updateVendorCall(editingCall.id, vendorForm);
    } else {
      addVendorCall(vendorForm);
    }

    resetForm();
  };

  const resetForm = () => {
    setVendorForm({
      title: '',
      category: 'Goods',
      description: '',
      requirements: '',
      budget: '',
      deadline: '',
      projectId: '',
      deliveryLocation: '',
      contactEmail: '',
      contactPhone: '',
      specifications: ''
    });
    setEditingCall(null);
    setShowModal(false);
  };

  const handleEdit = (call) => {
    setEditingCall(call);
    setVendorForm({
      title: call.title,
      category: call.category,
      description: call.description || '',
      requirements: call.requirements || '',
      budget: call.budget || '',
      deadline: call.deadline || '',
      projectId: call.projectId || '',
      deliveryLocation: call.deliveryLocation || '',
      contactEmail: call.contactEmail || '',
      contactPhone: call.contactPhone || '',
      specifications: call.specifications || ''
    });
    setShowModal(true);
  };

  const handleView = (call) => {
    setSelectedCall(call);
    setShowViewModal(true);
  };

  const handleClose = (id) => {
    if (confirm('Are you sure you want to close this vendor call?')) {
      closeVendorCall(id);
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Category', 'Created Date', 'Deadline', 'Budget', 'Bids', 'Status'];
    const rows = filteredCalls.map(call => [
      call.title,
      call.category,
      call.createdDate,
      call.deadline || 'N/A',
      call.budget || 'N/A',
      call.bids || 0,
      call.status
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-calls-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Open': 'bg-green-100 text-green-800',
      'Closed': 'bg-ink-100 text-ink-800'
    };
    return badges[status] || 'bg-ink-100 text-ink-800';
  };

  const getCategoryBadge = (category) => {
    const badges = {
      'Goods': 'bg-blue-100 text-blue-800',
      'Services': 'bg-purple-100 text-purple-800',
      'Equipment': 'bg-orange-100 text-orange-800',
      'Supplies': 'bg-green-100 text-green-800',
      'Construction': 'bg-red-100 text-red-800'
    };
    return badges[category] || 'bg-ink-100 text-ink-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Section */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Call for Vendors</h1>
              <p className="text-ink-200 text-sm mt-0.5">Manage procurement and vendor bidding</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
            >
              <Plus size={20} />
              Create Call
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-orange-100 p-3 rounded-xl">
                <Store className="text-orange-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Calls</h3>
            <p className="text-3xl font-bold text-ink-800">{stats.totalCalls}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="text-green-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Open Calls</h3>
            <p className="text-3xl font-bold text-ink-800">{stats.openCalls}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-purple-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Total Bids</h3>
            <p className="text-3xl font-bold text-ink-800">{stats.totalBids}</p>
          </div>

          <div className="bg-white rounded-lg2 p-6 shadow-card border-l-4 border-ink-500">
            <div className="flex items-center justify-between mb-3">
              <div className="bg-ink-100 p-3 rounded-xl">
                <XCircle className="text-ink-600" size={24} />
              </div>
            </div>
            <h3 className="text-ink-600 text-sm font-medium mb-1">Closed Calls</h3>
            <p className="text-3xl font-bold text-ink-800">{stats.closedCalls}</p>
          </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg2 shadow-card p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by title or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="All">All Categories</option>
              <option value="Goods">Goods</option>
              <option value="Services">Services</option>
              <option value="Equipment">Equipment</option>
              <option value="Supplies">Supplies</option>
              <option value="Construction">Construction</option>
            </select>

            <button
              onClick={exportToCSV}
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-card"
            >
              <Download size={20} />
              Export CSV
            </button>
          </div>
        </div>

      {/* Vendor Calls Grid */}
      <div className="bg-white rounded-lg2 shadow-card overflow-hidden">
          <div className="p-6 bg-ink-50 border-b border-ink-100">
            <h2 className="text-2xl font-bold text-ink-800 flex items-center gap-2">
              <Store size={24} className="text-orange-600" />
              Vendor Calls ({filteredCalls.length})
            </h2>
          </div>

          {filteredCalls.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="bg-ink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                <Store size={40} className="text-ink-400" />
              </div>
              <h3 className="text-xl font-semibold text-ink-700 mb-2">No Vendor Calls Yet</h3>
              <p className="text-ink-500 mb-6">Create your first vendor call to start procurement</p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Create First Call
              </button>
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCalls.map((call) => (
                  <div
                    key={call.id}
                    className="bg-white rounded-lg2 p-6 border border-ink-100 hover:shadow-card transition cursor-pointer"
                    onClick={() => handleView(call)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-ink-800 mb-2">{call.title}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCategoryBadge(call.category)}`}>
                          {call.category}
                        </span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(call.status)}`}>
                        {call.status}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Calendar size={16} className="text-orange-600" />
                        <span>Created: {call.createdDate}</span>
                      </div>
                      {call.deadline && (
                        <div className="flex items-center gap-2 text-sm text-ink-600">
                          <Clock size={16} className="text-red-600" />
                          <span>Deadline: {call.deadline}</span>
                        </div>
                      )}
                      {call.budget && (
                        <div className="flex items-center gap-2 text-sm text-ink-600">
                          <DollarSign size={16} className="text-green-600" />
                          <span>Budget: {call.budget}</span>
                        </div>
                      )}
                      {call.deliveryLocation && (
                        <div className="flex items-center gap-2 text-sm text-ink-600">
                          <Package size={16} className="text-blue-600" />
                          <span className="truncate">{call.deliveryLocation}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-ink-100">
                      <div className="flex items-center gap-2 text-sm text-ink-600">
                        <Users size={16} className="text-ink-400" />
                        <span className="font-semibold">{call.bids || 0} bids</span>
                      </div>
                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleEdit(call)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        {call.status === 'Open' && (
                          <button
                            onClick={() => handleClose(call.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                            title="Close Call"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      {/* Create/Edit Vendor Call Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingCall ? <Edit size={24} /> : <Plus size={24} />}
                {editingCall ? 'Edit Vendor Call' : 'Create New Vendor Call'}
              </h2>
              <button
                onClick={resetForm}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Call Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={vendorForm.title}
                    onChange={(e) => setVendorForm({ ...vendorForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. Supply of Educational Materials"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={vendorForm.category}
                    onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  >
                    <option value="Goods">Goods</option>
                    <option value="Services">Services</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Construction">Construction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Budget Range</label>
                  <input
                    type="text"
                    value={vendorForm.budget}
                    onChange={(e) => setVendorForm({ ...vendorForm, budget: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. $10,000 - $15,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Submission Deadline</label>
                  <input
                    type="date"
                    value={vendorForm.deadline}
                    onChange={(e) => setVendorForm({ ...vendorForm, deadline: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Delivery Location</label>
                  <input
                    type="text"
                    value={vendorForm.deliveryLocation}
                    onChange={(e) => setVendorForm({ ...vendorForm, deliveryLocation: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="e.g. Nairobi Regional Office"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Project ID</label>
                  <input
                    type="text"
                    value={vendorForm.projectId}
                    onChange={(e) => setVendorForm({ ...vendorForm, projectId: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Link to project (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Email</label>
                  <input
                    type="email"
                    value={vendorForm.contactEmail}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="procurement@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={vendorForm.contactPhone}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="+254 123 456 789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={vendorForm.description}
                  onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="4"
                  placeholder="Provide a detailed description of what you're procuring..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Requirements</label>
                <textarea
                  value={vendorForm.requirements}
                  onChange={(e) => setVendorForm({ ...vendorForm, requirements: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="4"
                  placeholder="List the vendor qualifications and requirements..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Technical Specifications</label>
                <textarea
                  value={vendorForm.specifications}
                  onChange={(e) => setVendorForm({ ...vendorForm, specifications: e.target.value })}
                  className="w-full px-4 py-3 border border-ink-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  rows="4"
                  placeholder="Provide detailed technical specifications..."
                />
              </div>

              <div className="flex gap-4 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-xl font-semibold hover:bg-ink-50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold transition-all duration-200 shadow-card hover:shadow-lift"
                >
                  {editingCall ? 'Update Call' : 'Create Call'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Vendor Call Modal */}
      {showViewModal && selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Eye size={24} />
                Vendor Call Details
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-ink-50 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-3xl font-bold text-ink-800 mb-2">{selectedCall.title}</h3>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getCategoryBadge(selectedCall.category)}`}>
                      {selectedCall.category}
                    </span>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(selectedCall.status)}`}>
                    {selectedCall.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2 text-ink-700">
                    <Calendar size={18} className="text-orange-600" />
                    <div>
                      <p className="text-xs text-ink-500">Created</p>
                      <p className="text-sm font-semibold">{selectedCall.createdDate}</p>
                    </div>
                  </div>
                  {selectedCall.deadline && (
                    <div className="flex items-center gap-2 text-ink-700">
                      <Clock size={18} className="text-red-600" />
                      <div>
                        <p className="text-xs text-ink-500">Deadline</p>
                        <p className="text-sm font-semibold">{selectedCall.deadline}</p>
                      </div>
                    </div>
                  )}
                  {selectedCall.budget && (
                    <div className="flex items-center gap-2 text-ink-700">
                      <DollarSign size={18} className="text-green-600" />
                      <div>
                        <p className="text-xs text-ink-500">Budget</p>
                        <p className="text-sm font-semibold">{selectedCall.budget}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-ink-700">
                    <Users size={18} className="text-purple-600" />
                    <div>
                      <p className="text-xs text-ink-500">Bids Received</p>
                      <p className="text-sm font-semibold">{selectedCall.bids || 0}</p>
                    </div>
                  </div>
                  {selectedCall.deliveryLocation && (
                    <div className="flex items-center gap-2 text-ink-700 col-span-2">
                      <Package size={18} className="text-blue-600" />
                      <div>
                        <p className="text-xs text-ink-500">Delivery Location</p>
                        <p className="text-sm font-semibold">{selectedCall.deliveryLocation}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {selectedCall.description && (
                <div>
                  <h4 className="text-lg font-bold text-ink-800 mb-3">Description</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedCall.description}</p>
                </div>
              )}

              {selectedCall.requirements && (
                <div>
                  <h4 className="text-lg font-bold text-ink-800 mb-3">Vendor Requirements</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedCall.requirements}</p>
                </div>
              )}

              {selectedCall.specifications && (
                <div>
                  <h4 className="text-lg font-bold text-ink-800 mb-3">Technical Specifications</h4>
                  <p className="text-ink-600 whitespace-pre-line">{selectedCall.specifications}</p>
                </div>
              )}

              {(selectedCall.contactEmail || selectedCall.contactPhone) && (
                <div className="bg-ink-50 rounded-xl p-4">
                  <h4 className="text-lg font-bold text-ink-800 mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    {selectedCall.contactEmail && (
                      <p className="text-ink-600">
                        <span className="font-semibold">Email:</span> {selectedCall.contactEmail}
                      </p>
                    )}
                    {selectedCall.contactPhone && (
                      <p className="text-ink-600">
                        <span className="font-semibold">Phone:</span> {selectedCall.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedCall.projectId && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800">
                    <span className="font-semibold">Linked Project:</span> {selectedCall.projectId}
                  </p>
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
