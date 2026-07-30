import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCampaign } from '../../contexts/CampaignContext';
import API, { getImageUrl } from '../../services/api';
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
  AlertCircle,
  Upload,
  Image,
  Package,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const CampaignsPage = () => {
  const {
    campaigns,
    addCampaign,
    updateCampaign,
    deleteCampaign,
    approveCampaign,
    completeCampaign,
    getCampaignStats
  } = useCampaign();

  const stats = getCampaignStats();

  const [showModal, setShowModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [viewingCampaign, setViewingCampaign] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageInputKey, setImageInputKey] = useState(Date.now());
  const [isUploading, setIsUploading] = useState(false);

  // Package management state
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [managingCampaign, setManagingCampaign] = useState(null);
  const [packages, setPackages] = useState([]);
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    amount: '',
    imageUrl: '',
    displayOrder: 0,
    isActive: true
  });
  const [packageImageFile, setPackageImageFile] = useState(null);
  const [packageImagePreview, setPackageImagePreview] = useState('');
  const [packageImageInputKey, setPackageImageInputKey] = useState(Date.now());

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    type: 'Education',
    targetAmount: '',
    perDonorAmount: '',
    startDate: '',
    endDate: '',
    linkedProjectIds: [],
    linkedOrphanIds: [],
    visibility: 'Public',
    category: '',
    status: 'Draft',
    imageUrl: '',
    createdBy: 'Admin'
  });

  const campaignTypes = ['Education', 'Healthcare', 'Emergency', 'Infrastructure', 'Food Security', 'Other'];
  const campaignStatuses = ['All', 'Active', 'Pending Approval', 'Completed', 'Closed'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm({ ...campaignForm, [name]: value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsUploading(true);

      let imageUrl = campaignForm.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        const uploadResult = await API.Upload.uploadCampaignImage(imageFile);
        imageUrl = uploadResult.url;
      }

      const formData = {
        ...campaignForm,
        targetAmount: parseFloat(campaignForm.targetAmount),
        imageUrl
      };

      // Add perDonorAmount only if provided and valid
      if (campaignForm.perDonorAmount && campaignForm.perDonorAmount.trim() !== '') {
        formData.perDonorAmount = parseFloat(campaignForm.perDonorAmount);
      } else {
        // Remove perDonorAmount if empty to avoid database error
        delete formData.perDonorAmount;
      }

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, formData);
      } else {
        await addCampaign(formData);
      }

      resetForm();
    } catch (error) {
      console.error('Error submitting campaign:', error);
      alert('Failed to save campaign. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setCampaignForm({
      title: '',
      description: '',
      type: 'Education',
      targetAmount: '',
      perDonorAmount: '',
      startDate: '',
      endDate: '',
      linkedProjectIds: [],
      linkedOrphanIds: [],
      visibility: 'Public',
      category: '',
      status: 'Draft',
      imageUrl: '',
      createdBy: 'Admin'
    });
    setImageFile(null);
    setImagePreview('');
    setImageInputKey(Date.now()); // Reset file input
    setEditingCampaign(null);
    setShowAdvanced(false);
    setShowModal(false);
  };

  const handleNewCampaign = () => {
    setCampaignForm({
      title: '',
      description: '',
      type: 'Education',
      targetAmount: '',
      perDonorAmount: '',
      startDate: '',
      endDate: '',
      linkedProjectIds: [],
      linkedOrphanIds: [],
      visibility: 'Public',
      category: '',
      status: 'Draft',
      imageUrl: '',
      createdBy: 'Admin'
    });
    setImageFile(null);
    setImagePreview('');
    setImageInputKey(Date.now()); // Reset file input
    setEditingCampaign(null);
    setShowAdvanced(false);
    setShowModal(true);
  };

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      description: campaign.description,
      type: campaign.type,
      targetAmount: campaign.targetAmount.toString(),
      perDonorAmount: campaign.perDonorAmount ? campaign.perDonorAmount.toString() : '',
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      linkedProjectIds: campaign.linkedProjectIds,
      linkedOrphanIds: campaign.linkedOrphanIds,
      visibility: campaign.visibility,
      category: campaign.category,
      status: campaign.status || 'Draft',
      imageUrl: campaign.imageUrl || '',
      createdBy: campaign.createdBy
    });

    // Set existing image as preview
    if (campaign.imageUrl) {
      setImagePreview(getImageUrl(campaign.imageUrl));
    }

    // Auto-expand Advanced if any of its fields are populated on the record
    // we're about to edit, otherwise the user might not realise they're set.
    setShowAdvanced(
      Boolean(campaign.category) ||
      Boolean(campaign.perDonorAmount) ||
      (campaign.visibility && campaign.visibility !== 'Public')
    );

    setShowModal(true);
  };

  const handleView = async (campaign) => {
    setViewingCampaign(campaign);
    setShowViewModal(true);

    // Load campaign packages for viewing
    try {
      const campaignPackages = await API.CampaignPackage.getAll(campaign.id);
      setPackages(campaignPackages || []);
    } catch (error) {
      console.error('Error loading packages for view:', error);
      setPackages([]);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      deleteCampaign(id);
    }
  };

  // ============================================
  // PACKAGE MANAGEMENT HANDLERS
  // ============================================

  const handleManagePackages = async (campaign) => {
    setManagingCampaign(campaign);
    try {
      const campaignPackages = await API.CampaignPackage.getAll(campaign.id);
      setPackages(campaignPackages || []);
      setShowPackageModal(true);
    } catch (error) {
      console.error('Error loading packages:', error);
      alert('Failed to load campaign packages');
    }
  };

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      description: '',
      amount: '',
      imageUrl: '',
      displayOrder: packages.length,
      isActive: true
    });
    setPackageImageFile(null);
    setPackageImagePreview('');
    setPackageImageInputKey(Date.now()); // Reset file input
    setEditingPackage(null);
  };

  const handlePackageImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setPackageImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPackageImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePackageSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUploading(true);

      let imageUrl = packageForm.imageUrl;
      if (packageImageFile) {
        const uploadResult = await API.Upload.uploadCampaignImage(packageImageFile);
        imageUrl = uploadResult.url;
      }

      const formData = {
        ...packageForm,
        amount: parseFloat(packageForm.amount),
        imageUrl
      };

      let updatedPackage;
      if (editingPackage) {
        updatedPackage = await API.CampaignPackage.update(editingPackage.id, formData);
        setPackages(packages.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg));
      } else {
        updatedPackage = await API.CampaignPackage.create(managingCampaign.id, formData);
        setPackages([...packages, updatedPackage]);
      }

      resetPackageForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPackage = (pkg) => {
    setEditingPackage(pkg);
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      amount: pkg.amount.toString(),
      imageUrl: pkg.imageUrl || '',
      displayOrder: pkg.displayOrder,
      isActive: pkg.isActive
    });
    if (pkg.imageUrl) {
      setPackageImagePreview(getImageUrl(pkg.imageUrl));
    }
  };

  const handleDeletePackage = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await API.CampaignPackage.delete(id);
        setPackages(packages.filter(pkg => pkg.id !== id));
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package');
      }
    }
  };

  const handleTogglePackageStatus = async (id) => {
    try {
      const updatedPackage = await API.CampaignPackage.toggleStatus(id);
      setPackages(packages.map(pkg => pkg.id === updatedPackage.id ? updatedPackage : pkg));
    } catch (error) {
      console.error('Error toggling package status:', error);
      alert('Failed to toggle package status');
    }
  };

  const handleMovePackageUp = async (index) => {
    if (index === 0) return;
    const newPackages = [...packages];
    [newPackages[index - 1], newPackages[index]] = [newPackages[index], newPackages[index - 1]];
    setPackages(newPackages);

    try {
      await API.CampaignPackage.reorder(
        managingCampaign.id,
        newPackages.map(pkg => pkg.id)
      );
    } catch (error) {
      console.error('Error reordering packages:', error);
      setPackages(packages); // Revert on error
    }
  };

  const handleMovePackageDown = async (index) => {
    if (index === packages.length - 1) return;
    const newPackages = [...packages];
    [newPackages[index], newPackages[index + 1]] = [newPackages[index + 1], newPackages[index]];
    setPackages(newPackages);

    try {
      await API.CampaignPackage.reorder(
        managingCampaign.id,
        newPackages.map(pkg => pkg.id)
      );
    } catch (error) {
      console.error('Error reordering packages:', error);
      setPackages(packages); // Revert on error
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
      'Closed': { label: 'Closed', color: 'text-ink-700', bgColor: 'bg-ink-100', icon: X }
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
      'Other': { color: 'text-ink-700', bgColor: 'bg-ink-100' }
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Banner */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">Campaign Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Manage fundraising campaigns, track donations, and connect with supporters</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link
              to="/admin/donations"
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
            >
              <DollarSign className="w-4 h-4" />
              View donations
            </Link>
            <div className="bg-white/20 backdrop-blur-lg rounded-xl p-4 border border-white/30">
              <div className="text-center">
                <p className="text-sm text-purple-100">Overall Progress</p>
                <p className="text-3xl font-bold">{((stats.totalRaised / stats.totalTarget) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards — three numbers a campaign manager checks at a glance.
          Success Rate dropped (calculated metric, low daily value) and the
          hardcoded "Status: Good" trailing rows removed as pure visual noise. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Total Campaigns</p>
              <h3 className="text-h1 text-ink-900">{stats.totalCampaigns}</h3>
              <p className="text-xs text-ink-500 mt-1">{stats.activeCampaigns} active</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <Heart className="text-navy-700" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Funds Raised</p>
              <h3 className="text-h1 text-ink-900">${(stats.totalRaised / 1000).toFixed(0)}K</h3>
              <p className="text-xs text-ink-500 mt-1">of ${stats.totalTarget.toLocaleString()} target</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <DollarSign className="text-navy-700" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-card transition-all">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-1">Active Campaigns</p>
              <h3 className="text-h1 text-ink-900">{stats.activeCampaigns}</h3>
              <p className="text-xs text-ink-500 mt-1">{stats.completedCampaigns} completed</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <CheckCircle className="text-navy-700" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-3 items-center flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {campaignStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="flex items-center gap-2 px-4 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export
            </button>
            <button
              onClick={handleNewCampaign}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg transition-all shadow-md"
            >
              <Plus className="w-5 h-5" />
              New Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Campaign</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Type</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Progress</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Amount</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Duration</th>
                <th className="px-6 py-4 text-left text-sm font-bold text-ink-700">Status</th>
                <th className="px-6 py-4 text-center text-sm font-bold text-ink-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-ink-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-ink-300" />
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
                        <div className="flex items-center gap-3">
                          {campaign.imageUrl && (
                            <img
                              src={getImageUrl(campaign.imageUrl)}
                              alt={campaign.title}
                              className="w-12 h-12 rounded-lg object-cover border-2 border-ink-100"
                            />
                          )}
                          <div>
                            <p className="font-semibold text-ink-800">{campaign.title}</p>
                            <p className="text-sm text-ink-500">{campaign.id}</p>
                          </div>
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
                            <span className="text-ink-600 font-medium">{progress}%</span>
                          </div>
                          <div className="w-full bg-ink-200 rounded-full h-2">
                            <div
                              className="bg-navy-900 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-green-600">${campaign.raisedAmount.toLocaleString()}</p>
                          <p className="text-sm text-ink-500">of ${campaign.targetAmount.toLocaleString()}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-ink-600">{campaign.startDate}</p>
                          <p className="text-ink-500">to {campaign.endDate}</p>
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
                            onClick={() => handleManagePackages(campaign)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Manage Packages"
                          >
                            <Package className="w-4 h-4" />
                          </button>
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
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
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
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Campaign Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={campaignForm.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g., Education Support 2025"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                  <textarea
                    name="description"
                    value={campaignForm.description}
                    onChange={handleInputChange}
                    required
                    rows="3"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="Describe the campaign goals and impact"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Campaign Type *</label>
                  <select
                    name="type"
                    value={campaignForm.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    {campaignTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Target Amount ($) *</label>
                  <input
                    type="number"
                    name="targetAmount"
                    value={campaignForm.targetAmount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    placeholder="50000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Status *</label>
                  <select
                    name="status"
                    value={campaignForm.status}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                    <option value="Pending Approval">Pending Approval</option>
                    <option value="Completed">Completed</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={campaignForm.startDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={campaignForm.endDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Campaign Image</label>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all">
                          <Upload className="w-5 h-5 text-ink-500" />
                          <span className="text-sm text-ink-600">
                            {imageFile ? imageFile.name : 'Choose image or drag here'}
                          </span>
                        </div>
                        <input
                          key={imageInputKey}
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                      {imagePreview && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-ink-100">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                              setImageInputKey(Date.now());
                              setCampaignForm({ ...campaignForm, imageUrl: '' });
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-ink-500">Supported formats: JPG, PNG, GIF, WebP (Max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Advanced fields — hidden by default; shown via the toggle below.
                  These are useful but rarely changed: Category, Per Donor Amount, Visibility. */}
              <div className="mt-4 border-t border-ink-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(s => !s)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-ink-700 hover:text-purple-600 transition-colors"
                >
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Advanced options
                  <span className="text-xs font-normal text-ink-400">
                    (category, per-donor amount, visibility)
                  </span>
                </button>

                {showAdvanced && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Category</label>
                      <input
                        type="text"
                        name="category"
                        value={campaignForm.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Disaster Relief"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Per Donor Amount ($)</label>
                      <input
                        type="number"
                        name="perDonorAmount"
                        value={campaignForm.perDonorAmount}
                        onChange={handleInputChange}
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="20"
                      />
                      <p className="text-xs text-ink-500 mt-1">E.g., Back to School: Total $20,000, Each donor $20</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">Visibility</label>
                      <select
                        name="visibility"
                        value={campaignForm.visibility}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                  </div>
                )}
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
                  disabled={isUploading}
                  className="flex-1 px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold transition-all shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">{viewingCampaign.title}</h2>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setPackages([]);
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Campaign Image */}
              {viewingCampaign.imageUrl && (
                <div className="relative rounded-xl overflow-hidden shadow-card">
                  <img
                    src={getImageUrl(viewingCampaign.imageUrl)}
                    alt={viewingCampaign.title}
                    className="w-full h-64 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Campaign ID</p>
                  <p className="text-lg font-bold text-ink-800">{viewingCampaign.id}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-ink-600 mb-1">Type</p>
                  <p className="text-lg font-bold text-ink-800">{viewingCampaign.type}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-ink-700 mb-2">Description</h3>
                <p className="text-ink-600">{viewingCampaign.description}</p>
              </div>

              <div className="bg-ink-50 p-6 rounded-lg">
                <h3 className="font-semibold text-ink-700 mb-4">Fundraising Progress</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Target Amount:</span>
                    <span className="font-bold text-ink-800">${viewingCampaign.targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Raised Amount:</span>
                    <span className="font-bold text-green-600">${viewingCampaign.raisedAmount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-ink-200 rounded-full h-3">
                    <div
                      className="bg-navy-900 h-3 rounded-full"
                      style={{ width: `${getProgressPercentage(viewingCampaign.raisedAmount, viewingCampaign.targetAmount)}%` }}
                    ></div>
                  </div>
                  <p className="text-center text-sm text-ink-600">
                    {getProgressPercentage(viewingCampaign.raisedAmount, viewingCampaign.targetAmount)}% of target reached
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-ink-600 mb-1">Start Date</p>
                  <p className="font-semibold text-ink-800">{viewingCampaign.startDate}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1">End Date</p>
                  <p className="font-semibold text-ink-800">{viewingCampaign.endDate}</p>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(viewingCampaign.status).bgColor} ${getStatusBadge(viewingCampaign.status).color}`}>
                    {viewingCampaign.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-ink-600 mb-1">Visibility</p>
                  <p className="font-semibold text-ink-800">{viewingCampaign.visibility}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-ink-700 mb-3">Campaign Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Created By:</span>
                    <span className="font-medium text-ink-800">{viewingCampaign.createdBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Created Date:</span>
                    <span className="font-medium text-ink-800">{viewingCampaign.createdDate}</span>
                  </div>
                  {viewingCampaign.approvedBy && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Approved By:</span>
                        <span className="font-medium text-ink-800">{viewingCampaign.approvedBy}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Approval Date:</span>
                        <span className="font-medium text-ink-800">{viewingCampaign.approvalDate}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Campaign Packages */}
              {packages.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-ink-700">Campaign Packages ({packages.length})</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {packages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className={`border-2 rounded-lg p-4 ${
                          pkg.isActive ? 'border-purple-200 bg-purple-50/30' : 'border-ink-100 bg-ink-50 opacity-60'
                        }`}
                      >
                        {pkg.imageUrl && (
                          <img
                            src={getImageUrl(pkg.imageUrl)}
                            alt={pkg.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-ink-900">{pkg.name}</h4>
                            {pkg.description && (
                              <p className="text-sm text-ink-600 mt-1">{pkg.description}</p>
                            )}
                          </div>
                          {!pkg.isActive && (
                            <span className="text-xs px-2 py-1 bg-ink-200 text-ink-600 rounded-full">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-2xl font-bold text-purple-600 mt-3">
                          ${parseFloat(pkg.amount).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* PACKAGE MANAGEMENT MODAL */}
      {/* ============================================ */}
      {showPackageModal && managingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-h1 text-ink-900 flex items-center gap-2">
                  <Package className="w-6 h-6 text-purple-600" />
                  Manage Packages - {managingCampaign.title}
                </h2>
                <p className="text-sm text-ink-500 mt-1">Add sub-items/packages for this campaign</p>
              </div>
              <button
                onClick={() => {
                  setShowPackageModal(false);
                  setManagingCampaign(null);
                  setPackages([]);
                  resetPackageForm();
                }}
                className="text-ink-400 hover:text-ink-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Package Form */}
                <div className="bg-ink-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-ink-900 mb-4">
                    {editingPackage ? 'Edit Package' : 'Add New Package'}
                  </h3>

                  <form onSubmit={handlePackageSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">
                        Package Name *
                      </label>
                      <input
                        type="text"
                        value={packageForm.name}
                        onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="e.g., Food Pack, Ifthar Meal, Eid Gift"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={packageForm.description}
                        onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        rows="3"
                        placeholder="Package description..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">
                        Amount ($) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={packageForm.amount}
                        onChange={(e) => setPackageForm({ ...packageForm, amount: e.target.value })}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-ink-700 mb-1">
                        Package Image
                      </label>
                      <div className="mt-1">
                        <label className="flex items-center justify-center px-4 py-2 border-2 border-dashed border-ink-300 rounded-lg cursor-pointer hover:border-purple-500 transition-colors">
                          <Upload className="w-5 h-5 text-ink-400 mr-2" />
                          <span className="text-sm text-ink-600">
                            {packageImageFile ? packageImageFile.name : 'Upload image'}
                          </span>
                          <input
                            key={packageImageInputKey}
                            type="file"
                            accept="image/*"
                            onChange={handlePackageImageChange}
                            className="hidden"
                          />
                        </label>
                      </div>
                      {packageImagePreview && (
                        <div className="mt-3 relative">
                          <img
                            src={packageImagePreview}
                            alt="Package preview"
                            className="w-full h-40 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPackageImageFile(null);
                              setPackageImagePreview('');
                              setPackageImageInputKey(Date.now());
                              setPackageForm({ ...packageForm, imageUrl: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="packageActive"
                        checked={packageForm.isActive}
                        onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                        className="w-4 h-4 text-purple-600 focus:ring-orange-500 rounded"
                      />
                      <label htmlFor="packageActive" className="text-sm font-medium text-ink-700">
                        Active
                      </label>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? 'Saving...' : (editingPackage ? 'Update Package' : 'Add Package')}
                      </button>
                      {editingPackage && (
                        <button
                          type="button"
                          onClick={resetPackageForm}
                          className="px-4 py-2 border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Package List */}
                <div>
                  <h3 className="text-lg font-semibold text-ink-900 mb-4">
                    Packages ({packages.length})
                  </h3>

                  {packages.length === 0 ? (
                    <div className="bg-ink-50 rounded-lg p-8 text-center">
                      <Package className="w-12 h-12 text-ink-300 mx-auto mb-3" />
                      <p className="text-ink-500">No packages added yet</p>
                      <p className="text-sm text-ink-400 mt-1">Add your first package using the form</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {packages.map((pkg, index) => (
                        <div
                          key={pkg.id}
                          className={`bg-white border-2 rounded-lg p-4 ${
                            editingPackage?.id === pkg.id ? 'border-purple-500' : 'border-ink-100'
                          } ${!pkg.isActive ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            {pkg.imageUrl && (
                              <img
                                src={getImageUrl(pkg.imageUrl)}
                                alt={pkg.name}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-ink-900">{pkg.name}</h4>
                                  {pkg.description && (
                                    <p className="text-sm text-ink-600 mt-1">{pkg.description}</p>
                                  )}
                                  <p className="text-lg font-bold text-purple-600 mt-2">
                                    ${parseFloat(pkg.amount).toFixed(2)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleMovePackageUp(index)}
                                    disabled={index === 0}
                                    className="p-1 text-ink-400 hover:text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move up"
                                  >
                                    <ArrowUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleMovePackageDown(index)}
                                    disabled={index === packages.length - 1}
                                    className="p-1 text-ink-400 hover:text-ink-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Move down"
                                  >
                                    <ArrowDown className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleEditPackage(pkg)}
                                  className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleTogglePackageStatus(pkg.id)}
                                  className={`text-xs px-2 py-1 rounded ${
                                    pkg.isActive
                                      ? 'bg-green-50 text-green-600 hover:bg-green-100'
                                      : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                                  }`}
                                >
                                  {pkg.isActive ? 'Active' : 'Inactive'}
                                </button>
                                <button
                                  onClick={() => handleDeletePackage(pkg.id)}
                                  className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
