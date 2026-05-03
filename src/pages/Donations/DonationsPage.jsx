import React, { useState, useEffect, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import API from '../../services/api';
import {
  DollarSign,
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
  Heart,
  CreditCard,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  Mail,
  Phone,
  Building2,
  BarChart3
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const DonationsPage = () => {
  const { donations, campaigns } = useCampaign();
  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingDonation, setEditingDonation] = useState(null);
  const [viewingDonation, setViewingDonation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [campaignFilter, setCampaignFilter] = useState('All');
  const [loading, setLoading] = useState(false);

  const [donationForm, setDonationForm] = useState({
    campaignId: '',
    donorName: '',
    donorEmail: '',
    donorPhone: '',
    donorType: 'Individual',
    donorAddress: '',
    amount: '',
    paymentMethod: 'Bank Transfer',
    paymentStatus: 'Pending',
    transactionId: '',
    donationDate: new Date().toISOString().split('T')[0],
    notes: '',
    isAnonymous: false,
    isRecurring: false
  });

  const paymentStatuses = ['All', 'Completed', 'Pending', 'Failed', 'Refunded'];
  const donorTypes = ['Individual', 'Organization', 'Corporate', 'Foundation'];
  const paymentMethods = ['Bank Transfer', 'Credit Card', 'Debit Card', 'Cash', 'Check', 'Online Payment'];

  // Load donation stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await API.Donation.getStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error loading donation stats:', error);
      }
    };
    loadStats();
  }, [donations]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDonationForm({
      ...donationForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const formData = {
        ...donationForm,
        amount: parseFloat(donationForm.amount),
        campaignId: donationForm.campaignId || null
      };

      if (editingDonation) {
        await API.Donation.update(editingDonation.id, formData);
      } else {
        await API.Donation.create(formData);
      }

      // Reload data
      window.location.reload();
    } catch (error) {
      console.error('Error saving donation:', error);
      alert('Failed to save donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDonationForm({
      campaignId: '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      donorType: 'Individual',
      donorAddress: '',
      amount: '',
      paymentMethod: 'Bank Transfer',
      paymentStatus: 'Pending',
      transactionId: '',
      donationDate: new Date().toISOString().split('T')[0],
      notes: '',
      isAnonymous: false,
      isRecurring: false
    });
    setEditingDonation(null);
    setShowModal(false);
  };

  const handleNewDonation = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (donation) => {
    setEditingDonation(donation);
    setDonationForm({
      campaignId: donation.campaignId || '',
      donorName: donation.donorName || '',
      donorEmail: donation.donorEmail || '',
      donorPhone: donation.donorPhone || '',
      donorType: donation.donorType || 'Individual',
      donorAddress: donation.donorAddress || '',
      amount: donation.amount.toString(),
      paymentMethod: donation.paymentMethod || 'Bank Transfer',
      paymentStatus: donation.paymentStatus || 'Pending',
      transactionId: donation.transactionId || '',
      donationDate: donation.donationDate || new Date().toISOString().split('T')[0],
      notes: donation.notes || '',
      isAnonymous: donation.isAnonymous || false,
      isRecurring: donation.isRecurring || false
    });
    setShowModal(true);
  };

  const handleView = (donation) => {
    setViewingDonation(donation);
    setShowViewModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this donation?')) {
      try {
        await API.Donation.delete(id);
        window.location.reload();
      } catch (error) {
        console.error('Error deleting donation:', error);
        alert('Failed to delete donation');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Completed': { label: 'Completed', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
      'Pending': { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: Clock },
      'Failed': { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
      'Refunded': { label: 'Refunded', color: 'text-ink-700', bgColor: 'bg-ink-100', icon: AlertCircle }
    };
    return badges[status] || badges['Pending'];
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Donor Name', 'Email', 'Phone', 'Type', 'Amount', 'Payment Method', 'Status', 'Campaign', 'Date', 'Transaction ID', 'Receipt Number'];
    const rows = filteredDonations.map(donation => [
      donation.id,
      donation.donorName,
      donation.donorEmail,
      donation.donorPhone,
      donation.donorType,
      donation.amount,
      donation.paymentMethod,
      donation.paymentStatus,
      donation.campaign?.title || 'N/A',
      donation.donationDate,
      donation.transactionId || 'N/A',
      donation.receiptNumber || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredDonations = useMemo(() => {
    return donations.filter(donation => {
      const matchesSearch =
        (donation.donorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donation.donorEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donation.donationCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (donation.transactionId || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || donation.paymentStatus === statusFilter;
      const matchesType = typeFilter === 'All' || donation.donorType === typeFilter;
      const matchesCampaign = campaignFilter === 'All' || donation.campaignId?.toString() === campaignFilter;
      return matchesSearch && matchesStatus && matchesType && matchesCampaign;
    });
  }, [donations, searchTerm, statusFilter, typeFilter, campaignFilter]);

  // Prepare chart data
  const monthlyData = useMemo(() => {
    if (!stats?.byMonth) return [];
    return stats.byMonth.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short' }),
      amount: item.total,
      count: item.count
    }));
  }, [stats]);

  const donorTypeData = useMemo(() => {
    if (!stats?.byDonorType) return [];
    return stats.byDonorType.map(item => ({
      name: item.donorType,
      value: item.total,
      count: item.count
    }));
  }, [stats]);

  const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

  if (!stats) {
    return (
      <div className="p-8 bg-ink-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
          <p className="mt-4 text-ink-600">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Donation Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Track and manage all donations, receipts, and donor relationships</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
              <div className="text-center">
                <p className="text-sm text-fuchsia-100">Success Rate</p>
                <p className="text-3xl font-bold">{stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(1) : 0}%</p>
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
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Donations</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.total}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">{stats.completed} completed</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Heart className="text-white" size={18} />
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

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Amount</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">${(stats.totalAmount / 1000).toFixed(0)}K</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Completed donations</p>
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

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Average Donation</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">${stats.avgDonation.toLocaleString()}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-ink-500 mt-1">Per donor</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <BarChart3 className="text-white" size={18} />
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

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all group cursor-pointer">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Pending</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-h1 text-ink-900">{stats.pending}</h3>
              </div>
              <p className="text-xs text-ink-500 mt-1">{stats.failed} failed</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Clock className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-ink-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500"></div>
                <span className="text-xs font-semibold text-yellow-600">Monitor</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Donations Chart */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-fuchsia-600" />
            Monthly Donations
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="amount" fill="#d946ef" name="Amount ($)" />
              <Bar dataKey="count" fill="#8b5cf6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Donor Type Distribution */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-bold text-ink-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-fuchsia-600" />
            Donor Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={donorTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {donorTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
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
                placeholder="Search donations..."
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
              {paymentStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="All">All Types</option>
              {donorTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
            >
              <option value="All">All Campaigns</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
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
              onClick={handleNewDonation}
              className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Donation
            </button>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Donor</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Campaign</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Payment</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Date</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-ink-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-ink-300" />
                    <p className="text-lg font-medium">No donations found</p>
                    <p className="text-sm">Add your first donation to start tracking</p>
                  </td>
                </tr>
              ) : (
                filteredDonations.map((donation) => {
                  const statusBadge = getStatusBadge(donation.paymentStatus);
                  return (
                    <tr key={donation.id} className="hover:bg-fuchsia-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-ink-800">{donation.donorName}</p>
                          <p className="text-sm text-ink-500">{donation.donorEmail}</p>
                          <span className="text-xs px-2 py-1 bg-ink-100 text-ink-600 rounded-full mt-1 inline-block">
                            {donation.donorType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-green-600 text-lg">${donation.amount.toLocaleString()}</p>
                        {donation.receiptNumber && (
                          <p className="text-xs text-ink-500 flex items-center gap-1 mt-1">
                            <Receipt className="w-3 h-3" />
                            {donation.receiptNumber}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-ink-800">
                          {donation.campaign?.title || 'General'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-ink-800">{donation.paymentMethod}</p>
                          {donation.transactionId && (
                            <p className="text-xs text-ink-500 mt-1">
                              ID: {donation.transactionId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-ink-600">
                          {new Date(donation.donationDate).toLocaleDateString()}
                        </p>
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
                            onClick={() => handleView(donation)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {donation.paymentStatus !== 'Completed' && (
                            <button
                              onClick={() => handleEdit(donation)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(donation.id)}
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
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingDonation ? 'Edit Donation' : 'Record New Donation'}
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
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Campaign (Optional)</label>
                  <select
                    name="campaignId"
                    value={donationForm.campaignId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="">General Donation</option>
                    {campaigns.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>{campaign.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor Name *</label>
                  <input
                    type="text"
                    name="donorName"
                    value={donationForm.donorName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor Email *</label>
                  <input
                    type="email"
                    name="donorEmail"
                    value={donationForm.donorEmail}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    name="donorPhone"
                    value={donationForm.donorPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor Type *</label>
                  <select
                    name="donorType"
                    value={donationForm.donorType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {donorTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Amount ($) *</label>
                  <input
                    type="number"
                    name="amount"
                    value={donationForm.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="100.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Method *</label>
                  <select
                    name="paymentMethod"
                    value={donationForm.paymentMethod}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    {paymentMethods.map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Status *</label>
                  <select
                    name="paymentStatus"
                    value={donationForm.paymentStatus}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Transaction ID</label>
                  <input
                    type="text"
                    name="transactionId"
                    value={donationForm.transactionId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="TXN123456"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donation Date *</label>
                  <input
                    type="date"
                    name="donationDate"
                    value={donationForm.donationDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor Address</label>
                  <input
                    type="text"
                    name="donorAddress"
                    value={donationForm.donorAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="123 Main St, City, Country"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Notes</label>
                  <textarea
                    name="notes"
                    value={donationForm.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-fuchsia-500"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="md:col-span-2 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isAnonymous"
                      checked={donationForm.isAnonymous}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-fuchsia-600 focus:ring-fuchsia-500 rounded"
                    />
                    <span className="text-sm font-medium text-ink-700">Anonymous Donation</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isRecurring"
                      checked={donationForm.isRecurring}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-fuchsia-600 focus:ring-fuchsia-500 rounded"
                    />
                    <span className="text-sm font-medium text-ink-700">Recurring Donation</span>
                  </label>
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
                  {loading ? 'Saving...' : editingDonation ? 'Update Donation' : 'Record Donation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Donation Details</h2>
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
                  <p className="text-sm text-ink-600 mb-1">Donation Code</p>
                  <p className="text-lg font-bold text-ink-800">{viewingDonation.donationCode}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Amount</p>
                  <p className="text-lg font-bold text-green-600">${viewingDonation.amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5 text-fuchsia-600" />
                  Donor Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Name:</span>
                    <span className="font-medium text-ink-800">{viewingDonation.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Email:</span>
                    <span className="font-medium text-ink-800 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {viewingDonation.donorEmail}
                    </span>
                  </div>
                  {viewingDonation.donorPhone && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">Phone:</span>
                      <span className="font-medium text-ink-800 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {viewingDonation.donorPhone}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-600">Type:</span>
                    <span className="font-medium text-ink-800">{viewingDonation.donorType}</span>
                  </div>
                  {viewingDonation.donorAddress && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">Address:</span>
                      <span className="font-medium text-ink-800">{viewingDonation.donorAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-ink-700 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-fuchsia-600" />
                  Payment Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Method:</span>
                    <span className="font-medium text-ink-800">{viewingDonation.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingDonation.paymentStatus).bgColor} ${getStatusBadge(viewingDonation.paymentStatus).color}`}>
                      {viewingDonation.paymentStatus}
                    </span>
                  </div>
                  {viewingDonation.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">Transaction ID:</span>
                      <span className="font-medium text-ink-800">{viewingDonation.transactionId}</span>
                    </div>
                  )}
                  {viewingDonation.receiptNumber && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">Receipt Number:</span>
                      <span className="font-medium text-ink-800 flex items-center gap-1">
                        <Receipt className="w-3 h-3" />
                        {viewingDonation.receiptNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-600">Date:</span>
                    <span className="font-medium text-ink-800">
                      {new Date(viewingDonation.donationDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {viewingDonation.campaign && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3">Campaign</h3>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="font-medium text-ink-800">{viewingDonation.campaign.title}</p>
                    <p className="text-sm text-ink-600 mt-1">Code: {viewingDonation.campaign.campaignCode}</p>
                  </div>
                </div>
              )}

              {viewingDonation.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-ink-700 mb-3">Notes</h3>
                  <p className="text-ink-600 text-sm bg-ink-50 p-4 rounded-lg">{viewingDonation.notes}</p>
                </div>
              )}

              {(viewingDonation.isAnonymous || viewingDonation.isRecurring) && (
                <div className="border-t pt-4">
                  <div className="flex gap-2">
                    {viewingDonation.isAnonymous && (
                      <span className="px-3 py-1 bg-ink-100 text-ink-700 rounded-full text-xs font-medium">
                        Anonymous
                      </span>
                    )}
                    {viewingDonation.isRecurring && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Recurring
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsPage;
