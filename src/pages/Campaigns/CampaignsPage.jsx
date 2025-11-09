import React, { useState, useMemo } from 'react';
import { useCampaign } from '../../contexts/CampaignContext';
import {
  TrendingUp,
  Target,
  DollarSign,
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
  Users,
  Heart,
  Briefcase,
  FileText,
  AlertCircle
} from 'lucide-react';

const CampaignsPage = () => {
  const {
    campaigns,
    donations,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    approveCampaign,
    completeCampaign,
    getCampaignStats
  } = useCampaign();

  const stats = getCampaignStats();

  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [viewingCampaign, setViewingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    type: 'Education',
    targetAmount: '',
    startDate: '',
    endDate: '',
    linkedProjectIds: [],
    linkedOrphanIds: [],
    visibility: 'Public',
    category: '',
    createdBy: 'Admin'
  });

  const campaignTypes = ['Education', 'Healthcare', 'Emergency', 'Infrastructure', 'Food Security', 'Other'];
  const campaignStatuses = ['All', 'Active', 'Pending Approval', 'Completed', 'Closed'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm({ ...campaignForm, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingCampaign) {
      updateCampaign(editingCampaign.id, {
        ...campaignForm,
        targetAmount: parseFloat(campaignForm.targetAmount)
      });
    } else {
      addCampaign({
        ...campaignForm,
        targetAmount: parseFloat(campaignForm.targetAmount)
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setCampaignForm({
      title: '',
      description: '',
      type: 'Education',
      targetAmount: '',
      startDate: '',
      endDate: '',
      linkedProjectIds: [],
      linkedOrphanIds: [],
      visibility: 'Public',
      category: '',
      createdBy: 'Admin'
    });
    setEditingCampaign(null);
    setShowModal(false);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      description: campaign.description,
      type: campaign.type,
      targetAmount: campaign.targetAmount.toString(),
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      linkedProjectIds: campaign.linkedProjectIds,
      linkedOrphanIds: campaign.linkedOrphanIds,
      visibility: campaign.visibility,
      category: campaign.category,
      createdBy: campaign.createdBy
    });
    setShowModal(true);
  };

  const handleView = (campaign) => {
    setViewingCampaign(campaign);
    setShowViewModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
    }
  };

  const handleApprove = (id) => {
    if (window.confirm('Approve this campaign?')) {
      approveCampaign(id, 'Director');
    }
  };

  const handleComplete = (id) => {
    if (window.confirm('Mark this campaign as completed?')) {
      completeCampaign(id);
    }
  };

  const getProgressPercentage = (raised, target) => {
    return Math.min(((raised / target) * 100), 100).toFixed(1);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'Active': { label: 'Active', color: 'text-green-700', bgColor: 'bg-green-100', icon: CheckCircle },
      'Pending Approval': { label: 'Pending', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: AlertCircle },
      'Completed': { label: 'Completed', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: CheckCircle },
      'Closed': { label: 'Closed', color: 'text-gray-700', bgColor: 'bg-gray-100', icon: X }
    };
    return badges[status] || badges['Active'];
  };

  const getTypeBadge = (type) => {
    const badges = {
      'Education': { color: 'text-purple-700', bgColor: 'bg-purple-100' },
      'Healthcare': { color: 'text-red-700', bgColor: 'bg-red-100' },
      'Emergency': { color: 'text-orange-700', bgColor: 'bg-orange-100' },
      'Infrastructure': { color: 'text-blue-700', bgColor: 'bg-blue-100' },
      'Food Security': { color: 'text-green-700', bgColor: 'bg-green-100' },
      'Other': { color: 'text-gray-700', bgColor: 'bg-gray-100' }
    };
    return badges[type] || badges['Other'];
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Type', 'Target Amount', 'Raised Amount', 'Progress %', 'Start Date', 'End Date', 'Status', 'Created By', 'Approved By'];
    const rows = filteredCampaigns.map(campaign => [
      campaign.id,
      campaign.title,
      campaign.type,
      campaign.targetAmount,
      campaign.raisedAmount,
      getProgressPercentage(campaign.raisedAmount, campaign.targetAmount),
      campaign.startDate,
      campaign.endDate,
      campaign.status,
      campaign.createdBy,
      campaign.approvedBy || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(campaign => {
      const matchesSearch = (campaign.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (campaign.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'All' || campaign.status === statusFilter;
      const matchesType = typeFilter === 'All' || campaign.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [campaigns, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-500 via-purple-600 to-fuchsia-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Heart className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Campaign Management</h1>
                <p className="text-purple-100 text-sm">Manage fundraising campaigns, track donations, and connect with supporters</p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
              <div className="text-center">
                <p className="text-sm text-purple-100">Overall Progress</p>
                <p className="text-3xl font-bold">{((stats.totalRaised / stats.totalTarget) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Total Campaigns</h3>
            <Briefcase className="text-purple-600 w-8 h-8" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalCampaigns}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.activeCampaigns} active</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Funds Raised</h3>
            <DollarSign className="text-green-600 w-8 h-8" />
          </div>
          <p className="text-3xl font-bold text-gray-800">${stats.totalRaised.toLocaleString()}</p>
          <p className="text-sm text-gray-500 mt-1">of ${stats.totalTarget.toLocaleString()} target</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Active Campaigns</h3>
            <TrendingUp className="text-blue-600 w-8 h-8" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.activeCampaigns}</p>
          <p className="text-sm text-gray-500 mt-1">{stats.completedCampaigns} completed</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-indigo-500 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 font-semibold">Success Rate</h3>
            <Target className="text-indigo-600 w-8 h-8" />
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.successRate}%</p>
          <p className="text-sm text-gray-500 mt-1">Campaign completion</p>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              {campaignStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
            >
              <option value="All">All Types</option>
              {campaignTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-100 to-blue-100">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Campaign</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No campaigns found</p>
                    <p className="text-sm">Create your first campaign to start fundraising</p>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => {
                  const statusBadge = getStatusBadge(campaign.status);
                  const typeBadge = getTypeBadge(campaign.type);
                  const progress = getProgressPercentage(campaign.raisedAmount, campaign.targetAmount);

                  return (
                    <tr key={campaign.id} className="hover:bg-purple-50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-gray-800">{campaign.title}</p>
                          <p className="text-sm text-gray-500">{campaign.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${typeBadge.bgColor} ${typeBadge.color}`}>
                          {campaign.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-green-600">${campaign.raisedAmount.toLocaleString()}</p>
                          <p className="text-sm text-gray-500">of ${campaign.targetAmount.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-600">{campaign.startDate}</p>
                          <p className="text-gray-500">to {campaign.endDate}</p>
                        </div>
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
                            onClick={() => handleView(campaign)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {campaign.status !== 'Completed' && (
                            <button
                              onClick={() => handleEdit(campaign)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {campaign.status === 'Pending Approval' && (
                            <button
                              onClick={() => handleApprove(campaign.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          {campaign.status === 'Active' && campaign.raisedAmount >= campaign.targetAmount && (
                            <button
                              onClick={() => handleComplete(campaign.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(campaign.id)}
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={campaignForm.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Education Support 2025"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={campaignForm.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe the campaign goals and impact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign Type *</label>
                  <select
                    name="type"
                    value={campaignForm.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    {campaignTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={campaignForm.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Disaster Relief"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount ($) *</label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={campaignForm.targetAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Visibility</label>
                  <select
                    name="visibility"
                    value={campaignForm.visibility}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={campaignForm.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={campaignForm.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold transition-all shadow-lg"
                >
                  {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewingCampaign.title}</h2>
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
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Campaign ID</p>
                  <p className="text-lg font-bold text-gray-800">{viewingCampaign.id}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Type</p>
                  <p className="text-lg font-bold text-gray-800">{viewingCampaign.type}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600">{viewingCampaign.description}</p>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-4">Fundraising Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Amount:</span>
                    <span className="font-bold text-gray-800">${viewingCampaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Raised Amount:</span>
                    <span className="font-bold text-green-600">${viewingCampaign.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full"
                      style={{ width: `${getProgressPercentage(viewingCampaign.raisedAmount, viewingCampaign.targetAmount)}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm text-gray-600">
                    {getProgressPercentage(viewingCampaign.raisedAmount, viewingCampaign.targetAmount)}% of target reached
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-semibold text-gray-800">{viewingCampaign.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date</p>
                  <p className="font-semibold text-gray-800">{viewingCampaign.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingCampaign.status).bgColor} ${getStatusBadge(viewingCampaign.status).color}`}>
                    {viewingCampaign.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Visibility</p>
                  <p className="font-semibold text-gray-800">{viewingCampaign.visibility}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-3">Campaign Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created By:</span>
                    <span className="font-medium text-gray-800">{viewingCampaign.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created Date:</span>
                    <span className="font-medium text-gray-800">{viewingCampaign.createdDate}</span>
                  </div>
                  {viewingCampaign.approvedBy && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved By:</span>
                        <span className="font-medium text-gray-800">{viewingCampaign.approvedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approval Date:</span>
                        <span className="font-medium text-gray-800">{viewingCampaign.approvalDate}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignsPage;
