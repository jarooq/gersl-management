import React, { useState, useEffect } from 'react';
import { usePartners } from '../../contexts/PartnersContext';
import AddPartnerModal from './AddPartnerModal';
import AddContributionModal from './AddContributionModal';
import AddCommunicationModal from './AddCommunicationModal';
import ViewPartnerModal from './ViewPartnerModal';
import EditPartnerModal from './EditPartnerModal';
import {
  HeartHandshake,
  Plus,
  Search,
  DollarSign,
  Users,
  TrendingUp,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Filter,
  ArrowRight,
  Briefcase,
  MessageSquare,
  CircleDot,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  PieChart,
  LineChart,
  TrendingDown,
  Heart
} from 'lucide-react';

const PartnersPage = () => {
  const {
    partners,
    contributions,
    communications,
    loading,
    error,
    getStats,
    fetchPartners,
    addPartner,
    updatePartner,
    addContribution,
    addCommunication,
    deletePartner,
    deleteContribution,
    deleteCommunication
  } = usePartners();

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modal states
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [showAddContributionModal, setShowAddContributionModal] = useState(false);
  const [showAddCommunicationModal, setShowAddCommunicationModal] = useState(false);
  const [showViewPartnerModal, setShowViewPartnerModal] = useState(false);
  const [showEditPartnerModal, setShowEditPartnerModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);

  // Context already fetches partners on mount via its own useEffect

  // Safe stats calculation - only if we have data
  const stats = partners ? getStats() : {
    totalPartners: 0,
    activePartners: 0,
    totalContributions: 0,
    partnerTypes: 0,
    avgContribution: 0,
    pendingFollowUps: 0
  };

  // Handler functions
  const handleViewPartner = (partner) => {
    setSelectedPartner(partner);
    setShowViewPartnerModal(true);
  };

  const handleEditPartner = (partner) => {
    setSelectedPartner(partner);
    setShowEditPartnerModal(true);
  };

  // Filter partners - ensure partners is an array before filtering
  const filteredPartners = (partners && Array.isArray(partners)) ? partners.filter(partner => {
    const matchesSearch = (partner.name && partner.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (partner.contactPerson && partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (partner.partnerCode && partner.partnerCode.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'All' || partner.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || partner.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  }) : [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Major Donor': return 'text-purple-600';
      case 'Strategic Partner': return 'text-blue-600';
      case 'Implementing Partner': return 'text-green-600';
      case 'Technology Partner': return 'text-orange-600';
      default: return 'text-ink-600';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Grant': return 'bg-green-50 text-green-600 border-green-200';
      case 'In-Kind': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Partnership': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Technology Grant': return 'bg-orange-50 text-orange-600 border-orange-200';
      default: return 'bg-ink-50 text-ink-600 border-ink-100';
    }
  };

  const statItems = [
    {
      title: 'Total Partners',
      value: stats.totalPartners || 0,
      icon: Building2,
      gradient: 'from-red-500 to-rose-600',
      change: `${stats.activePartners || 0} active`,
      subtitle: 'partnerships managed'
    },
    {
      title: 'Total Contributions',
      value: `${((stats.totalContributions || 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: `LKR ${((stats.avgContribution || 0) / 1000).toFixed(0)}K avg`,
      subtitle: 'in funding received'
    },
    {
      title: 'Partner Types',
      value: stats.partnerTypes || 0,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      change: 'Diverse network',
      subtitle: 'different categories'
    },
    {
      title: 'Pending Follow-ups',
      value: stats.pendingFollowUps || 0,
      icon: MessageSquare,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Next 7 days',
      subtitle: 'communications due'
    }
  ];

  // Show loading state
  if (loading && partners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-600 font-medium">Loading partners...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && partners.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HeartHandshake className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-h1 text-ink-900 mb-2">Unable to Load Partners</h2>
          <p className="text-ink-600 mb-4">{error}</p>
          <button
            onClick={() => fetchPartners()}
            className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Fund Development</p>
              <h1 className="text-h2 font-bold leading-tight">Partners & Donors</h1>
              <p className="text-ink-200 text-sm mt-0.5">Building lasting relationships with {stats.activePartners} active partners</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowAddPartnerModal(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition">
              <Plus size={16} /> Add Partner
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
            
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-600 mb-2">{stat.title}</p>
                <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                <p className="text-xs text-ink-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-card transform group- transition-transform duration-200 flex-shrink-0`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-ink-100">
              <span className="text-xs font-medium text-ink-600">{stat.change}</span>
              <ArrowRight size={16} className="text-ink-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contribution by Partner Type Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <BarChart3 className="text-green-600" size={18} />
                Contributions by Partner Type
              </h3>
              <p className="text-xs text-ink-600 mt-1">Funding sources breakdown</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                LKR {(stats.totalContributions / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-ink-600">Total</div>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              // Compute by partner type from the live partners array.
              const byType = {};
              for (const p of (partners || [])) {
                const k = p.partnerType || p.type || 'Other';
                byType[k] = (byType[k] || 0) + Number(p.totalContribution || p.contribution || 0);
              }
              const total = Object.values(byType).reduce((s, v) => s + v, 0);
              const items = Object.entries(byType)
                .map(([type, amount]) => ({ type, amount, percent: total > 0 ? Math.round((amount / total) * 100) : 0 }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 6);
              if (items.length === 0) {
                return <p className="text-xs text-ink-500 text-center py-4">No contribution data yet.</p>;
              }
              return items.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-700">{item.type}</span>
                    <span className="text-xs font-bold text-ink-900">LKR {(item.amount / 1000000).toFixed(1)}M</span>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-navy-900 transition-all duration-500"
                      style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Partner Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <PieChart className="text-blue-600" size={18} />
                Partner Status Overview
              </h3>
              <p className="text-xs text-ink-600 mt-1">Partnership health</p>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const byStatus = {};
              for (const p of (partners || [])) {
                const k = p.status || 'Unknown';
                byStatus[k] = (byStatus[k] || 0) + 1;
              }
              const colorMap = {
                Active: 'bg-green-500', Pending: 'bg-yellow-500',
                Inactive: 'bg-ink-400', Closed: 'bg-red-500',
              };
              const items = Object.entries(byStatus)
                .map(([status, count]) => ({ status, count, color: colorMap[status] || 'bg-ink-500' }))
                .sort((a, b) => b.count - a.count);
              if (items.length === 0) {
                return <p className="text-xs text-ink-500 text-center py-4">No partners on file yet.</p>;
              }
              return items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm font-medium text-ink-700">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-ink-900">{item.count} partners</span>
                    <span className="text-xs text-ink-600 bg-white px-2 py-1 rounded">
                      {stats.totalPartners > 0 ? Math.round((item.count / stats.totalPartners) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Monthly Contributions Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <LineChart className="text-purple-600" size={18} />
                Contribution Trend
              </h3>
              <p className="text-xs text-ink-600 mt-1">Last 6 months (millions)</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-ink-600 flex items-center gap-1">
                <TrendingUp size={18} />
                0%
              </div>
              <div className="text-xs text-ink-600">Growth</div>
            </div>
          </div>
          <div className="space-y-2">
            {(() => {
              // Compute partners-acquired trend by createdAt month.
              // (True contribution-trend would need a monthly contributions
              // history table which doesn't yet exist — partners-acquired
              // is the closest proxy from current data.)
              const months = [];
              const now = new Date();
              for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                months.push({
                  key: `${d.getFullYear()}-${d.getMonth()}`,
                  label: d.toLocaleString('en', { month: 'short' }),
                  count: 0,
                });
              }
              for (const p of (partners || [])) {
                if (!p.createdAt) continue;
                const d = new Date(p.createdAt);
                const k = `${d.getFullYear()}-${d.getMonth()}`;
                const m = months.find(x => x.key === k);
                if (m) m.count += 1;
              }
              const max = Math.max(1, ...months.map(m => m.count));
              if (months.every(m => m.count === 0)) {
                return <p className="text-xs text-ink-500 text-center py-4">No partner activity in the last 6 months.</p>;
              }
              return months.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-ink-600 w-20">{m.label}</span>
                  <div className="flex-1">
                    <div className="bg-navy-900 h-8 rounded transition-all duration-300 flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(8, (m.count / max) * 100)}%` }}>
                      <span className="text-white text-xs font-bold">{m.count}</span>
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Partnership Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Heart className="text-red-600" size={18} />
                Partnership Health
              </h3>
              <p className="text-xs text-ink-600 mt-1">Key indicators</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-ink-600">No Data</div>
              <div className="text-xs text-ink-600">Overall</div>
            </div>
          </div>
          <div className="space-y-4">
            {(() => {
              const total = (partners || []).length;
              const active = (partners || []).filter(p => p.status === 'Active').length;
              const withFollowUp = (partners || []).filter(p => p.lastFollowUpDate).length;
              const withContact = (partners || []).filter(p => p.email || p.phone).length;
              const items = total === 0 ? [] : [
                { metric: 'Active rate',          value: Math.round((active / total) * 100),       target: 70 },
                { metric: 'Follow-up coverage',   value: Math.round((withFollowUp / total) * 100), target: 60 },
                { metric: 'Contact info on file', value: Math.round((withContact / total) * 100),  target: 90 },
              ].map(it => ({ ...it, status: it.value >= it.target ? 'above' : 'below' }));
              if (items.length === 0) {
                return <p className="text-xs text-ink-500 text-center py-4">No partners to score.</p>;
              }
              return items.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink-700">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-900">{item.value}%</span>
                    {item.status === 'above' ? (
                      <TrendingUp className="text-green-600" size={14} />
                    ) : (
                      <TrendingDown className="text-orange-600" size={14} />
                    )}
                  </div>
                </div>
                <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-navy-900 transition-all duration-500"
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-ink-500">Target: {item.target}%</span>
                  <span className={`text-xs font-medium ${
                    item.status === 'above' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {item.status === 'above' ? `+${item.value - item.target}%` : `${item.value - item.target}%`}
                  </span>
                </div>
              </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-card border border-ink-100">
        <div className="border-b border-ink-100">
          <div className="flex gap-1 p-2">
            {[
              { id: 'overview', label: 'Partner Directory', icon: Building2 },
              { id: 'contributions', label: 'Contributions', icon: DollarSign },
              { id: 'communications', label: 'Communications', icon: MessageSquare }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-navy-900 text-white shadow-md'
                    : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Partner Directory Tab */}
        {activeTab === 'overview' && (
          <div className="p-6">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400" size={20} />
                <input
                  type="text"
                  placeholder="Search partners by name, code, or contact person..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="input-modern"
                >
                  <option value="All">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="input-modern"
                >
                  <option value="All">All Categories</option>
                  <option value="Major Donor">Major Donor</option>
                  <option value="Strategic Partner">Strategic Partner</option>
                  <option value="Implementing Partner">Implementing Partner</option>
                  <option value="Technology Partner">Technology Partner</option>
                </select>
              </div>
            </div>

            {/* Partner Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPartners.map((partner, index) => (
                <div
                  key={partner.id}
                  className="card-modern group p-5"
                  
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-red-50 border border-red-200 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-card group- transition-transform">
                        {partner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-ink-900 leading-tight truncate">{partner.name}</h3>
                        <p className="text-xs text-ink-500 font-medium">{partner.partnerCode}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(partner.status)} flex-shrink-0`}>
                      {partner.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target size={12} className="text-purple-500" />
                      </div>
                      <span className={`font-semibold ${getCategoryColor(partner.category)}`}>{partner.category}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase size={12} className="text-blue-500" />
                      </div>
                      <span className="font-medium truncate">{partner.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail size={12} className="text-green-500" />
                      </div>
                      <span className="font-medium truncate">{partner.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-700">
                      <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe size={12} className="text-orange-500" />
                      </div>
                      <span className="font-medium truncate">{partner.country}</span>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  {(() => {
                    // Parse focusAreas if it's a JSON string, otherwise use as array
                    let focusAreasArray = [];
                    try {
                      if (typeof partner.focusAreas === 'string') {
                        focusAreasArray = JSON.parse(partner.focusAreas);
                      } else if (Array.isArray(partner.focusAreas)) {
                        focusAreasArray = partner.focusAreas;
                      }
                    } catch (e) {
                      focusAreasArray = [];
                    }

                    return focusAreasArray && focusAreasArray.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold text-ink-600 mb-2">Focus Areas</p>
                        <div className="flex flex-wrap gap-1">
                          {focusAreasArray.slice(0, 3).map((area, idx) => (
                            <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium border border-red-100">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Stats */}
                  <div className="pt-4 border-t border-ink-100">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-ink-500 mb-1">Total Contributions</p>
                        <p className="font-bold text-sm text-ink-900">LKR {((partner.totalContributions || 0) / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-ink-500 mb-1">Last Contribution</p>
                        <p className="font-bold text-sm text-ink-900">
                          {partner.lastContribution ? new Date(partner.lastContribution).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewPartner(partner)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-navy-900 text-white rounded-lg transition-all text-xs font-semibold shadow-md hover:shadow-card active:scale-95"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={() => handleEditPartner(partner)}
                        className="px-3 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-all border border-ink-100 hover:border-ink-200 active:scale-95"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => deletePartner(partner.id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredPartners.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="mx-auto text-ink-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-ink-900 mb-2">No partners found</h3>
                <p className="text-ink-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-900">All Contributions</h3>
              <button
                onClick={() => setShowAddContributionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold shadow-card hover:shadow-lift transition-all"
              >
                <Plus size={18} />
                Add Contribution
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-100">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Partner</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Purpose</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Receipt</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-ink-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((contribution, index) => (
                    <tr
                      key={contribution.id}
                      className="border-b border-ink-100 hover:bg-ink-50 transition-colors"
                      
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-ink-400" />
                          <span className="text-sm font-medium text-ink-900">
                            {new Date(contribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-ink-900">{contribution.partnerName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-green-600">
                          LKR {(contribution.amount / 1000000).toFixed(2)}M
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getTypeColor(contribution.type)}`}>
                          {contribution.type}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm text-ink-700 line-clamp-1">{contribution.purpose}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-ink-600 bg-ink-100 px-2 py-1 rounded">
                          {contribution.receiptNumber}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-1 text-sm font-semibold text-green-600">
                          <CheckCircle size={14} />
                          {contribution.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-1">
                          <button className="p-1.5 bg-ink-100 text-ink-600 rounded hover:bg-ink-200 transition-all">
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => deleteContribution(contribution.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-all"
                          >
                            <Trash2 size={14} />
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

        {/* Communications Tab */}
        {activeTab === 'communications' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-900">Communication Log</h3>
              <button
                onClick={() => setShowAddCommunicationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg font-semibold shadow-card hover:shadow-lift transition-all"
              >
                <Plus size={18} />
                Log Communication
              </button>
            </div>
            <div className="space-y-3">
              {communications.sort((a, b) => new Date(b.date) - new Date(a.date)).map((comm, index) => (
                <div
                  key={comm.id}
                  className="bg-white border border-ink-100 rounded-lg2 shadow-card p-4"
                  
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        comm.type === 'Meeting' ? 'bg-purple-50' :
                        comm.type === 'Email' ? 'bg-blue-50' :
                        comm.type === 'Phone Call' ? 'bg-green-50' :
                        'bg-orange-50'
                      }`}>
                        <MessageSquare size={18} className={
                          comm.type === 'Meeting' ? 'text-purple-500' :
                          comm.type === 'Email' ? 'text-blue-500' :
                          comm.type === 'Phone Call' ? 'text-green-500' :
                          'text-orange-500'
                        } />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-ink-900 mb-1">{comm.subject}</h4>
                        <p className="text-sm text-ink-600 mb-2">{comm.partnerName}</p>
                        <p className="text-sm text-ink-700">{comm.summary}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCommunication(comm.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-ink-100">
                    <div className="flex items-center gap-2 text-xs text-ink-600">
                      <Calendar size={14} className="text-ink-400" />
                      <span className="font-medium">
                        {new Date(comm.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      comm.type === 'Meeting' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                      comm.type === 'Email' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      comm.type === 'Phone Call' ? 'bg-green-50 text-green-600 border border-green-200' :
                      'bg-orange-50 text-orange-600 border border-orange-200'
                    }`}>
                      {comm.type}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-ink-600">
                      <span className="font-medium">By: {comm.contactedBy}</span>
                    </div>
                    {comm.nextFollowUp && (
                      <div className="flex items-center gap-2 text-xs">
                        <Clock size={14} className="text-orange-500" />
                        <span className="font-medium text-orange-600">
                          Follow-up: {new Date(comm.nextFollowUp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AddPartnerModal
        isOpen={showAddPartnerModal}
        onClose={() => setShowAddPartnerModal(false)}
        onAdd={addPartner}
      />

      <AddContributionModal
        isOpen={showAddContributionModal}
        onClose={() => setShowAddContributionModal(false)}
        onAdd={addContribution}
        partners={partners}
      />

      <AddCommunicationModal
        isOpen={showAddCommunicationModal}
        onClose={() => setShowAddCommunicationModal(false)}
        onAdd={addCommunication}
        partners={partners}
      />

      <ViewPartnerModal
        isOpen={showViewPartnerModal}
        onClose={() => setShowViewPartnerModal(false)}
        partner={selectedPartner}
      />

      <EditPartnerModal
        isOpen={showEditPartnerModal}
        onClose={() => setShowEditPartnerModal(false)}
        onUpdate={updatePartner}
        partner={selectedPartner}
      />
    </div>
  );
};

export default PartnersPage;
