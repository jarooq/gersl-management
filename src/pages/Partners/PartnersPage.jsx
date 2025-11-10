import React, { useState } from 'react';
import { usePartners } from '../../contexts/PartnersContext';
import AddPartnerModal from './AddPartnerModal';
import AddContributionModal from './AddContributionModal';
import AddCommunicationModal from './AddCommunicationModal';
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
    getStats,
    addPartner,
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

  const stats = getStats();

  // Filter partners
  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         partner.partnerCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || partner.status === filterStatus;
    const matchesCategory = filterCategory === 'All' || partner.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Major Donor': return 'text-purple-600';
      case 'Strategic Partner': return 'text-blue-600';
      case 'Implementing Partner': return 'text-green-600';
      case 'Technology Partner': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Grant': return 'bg-green-50 text-green-600 border-green-200';
      case 'In-Kind': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Partnership': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'Technology Grant': return 'bg-orange-50 text-orange-600 border-orange-200';
      default: return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const statItems = [
    {
      title: 'Total Partners',
      value: stats.totalPartners,
      icon: Building2,
      gradient: 'from-red-500 to-rose-600',
      change: `${stats.activePartners} active`,
      subtitle: 'partnerships managed'
    },
    {
      title: 'Total Contributions',
      value: `${(stats.totalContributions / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: `LKR ${(stats.avgContribution / 1000).toFixed(0)}K avg`,
      subtitle: 'in funding received'
    },
    {
      title: 'Partner Types',
      value: stats.partnerTypes,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      change: 'Diverse network',
      subtitle: 'different categories'
    },
    {
      title: 'Pending Follow-ups',
      value: stats.pendingFollowUps,
      icon: MessageSquare,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Next 7 days',
      subtitle: 'communications due'
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Red Gradient Hero Banner */}
      <div className="bg-gradient-to-r from-red-500 via-red-600 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Partners & Donors</h1>
                <p className="text-red-100 text-sm">Building lasting relationships with {stats.activePartners} active partners</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddPartnerModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-lg font-semibold transition-all border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl"
            >
              <Plus size={20} />
              <span>Add Partner</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="stat-card group cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-2">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">{stat.change}</span>
              <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contribution by Partner Type Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-green-600" size={18} />
                Contributions by Partner Type
              </h3>
              <p className="text-xs text-gray-600 mt-1">Funding sources breakdown</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-green-600">
                LKR {(stats.totalContributions / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
          <div className="space-y-3">
            {[].map((item, index) => (
              <div key={index} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">{item.type}</span>
                  <span className="text-xs font-bold text-gray-900">LKR {(item.amount / 1000000).toFixed(1)}M</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                    style={{ width: `${item.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partner Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <PieChart className="text-blue-600" size={18} />
                Partner Status Overview
              </h3>
              <p className="text-xs text-gray-600 mt-1">Partnership health</p>
            </div>
          </div>
          <div className="space-y-4">
            {[].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-gray-900">{item.count} partners</span>
                  <span className="text-xs text-gray-600 bg-white px-2 py-1 rounded">
                    {Math.round((item.count / stats.totalPartners) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Contributions Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <LineChart className="text-purple-600" size={18} />
                Contribution Trend
              </h3>
              <p className="text-xs text-gray-600 mt-1">Last 6 months (millions)</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-600 flex items-center gap-1">
                <TrendingUp size={18} />
                0%
              </div>
              <div className="text-xs text-gray-600">Growth</div>
            </div>
          </div>
          <div className="space-y-2">
            {[].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-20">{item.month}</span>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-8 rounded transition-all duration-300 flex items-center justify-end pr-2"
                    style={{ width: `${(item.amount / 20) * 100}%` }}>
                    <span className="text-white text-xs font-bold">{item.amount}M</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Partnership Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Heart className="text-red-600" size={18} />
                Partnership Health
              </h3>
              <p className="text-xs text-gray-600 mt-1">Key indicators</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-gray-600">No Data</div>
              <div className="text-xs text-gray-600">Overall</div>
            </div>
          </div>
          <div className="space-y-4">
            {[].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-700">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{item.value}%</span>
                    {item.status === 'above' ? (
                      <TrendingUp className="text-green-600" size={14} />
                    ) : (
                      <TrendingDown className="text-orange-600" size={14} />
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      item.status === 'above'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                        : 'bg-gradient-to-r from-yellow-500 to-orange-600'
                    }`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">Target: {item.target}%</span>
                  <span className={`text-xs font-medium ${
                    item.status === 'above' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {item.status === 'above' ? `+${item.value - item.target}%` : `${item.value - item.target}%`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
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
                    ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
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
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
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
                  className="card-modern group p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg group-hover:scale-105 transition-transform">
                        {partner.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{partner.name}</h3>
                        <p className="text-xs text-gray-500 font-medium">{partner.partnerCode}</p>
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
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-6 h-6 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Briefcase size={12} className="text-blue-500" />
                      </div>
                      <span className="font-medium truncate">{partner.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-6 h-6 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail size={12} className="text-green-500" />
                      </div>
                      <span className="font-medium truncate">{partner.contactPerson}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Globe size={12} className="text-orange-500" />
                      </div>
                      <span className="font-medium truncate">{partner.country}</span>
                    </div>
                  </div>

                  {/* Focus Areas */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Focus Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {partner.focusAreas.slice(0, 3).map((area, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-50 text-red-600 rounded-md text-xs font-medium border border-red-100">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Total Contributions</p>
                        <p className="font-bold text-sm text-gray-900">LKR {(partner.totalContributions / 1000000).toFixed(1)}M</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Last Contribution</p>
                        <p className="font-bold text-sm text-gray-900">
                          {partner.lastContribution ? new Date(partner.lastContribution).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 transition-all text-xs font-semibold shadow-md hover:shadow-lg active:scale-95">
                        <Eye size={14} />
                        View
                      </button>
                      <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300 active:scale-95">
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
                <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No partners found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Contributions Tab */}
        {activeTab === 'contributions' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">All Contributions</h3>
              <button
                onClick={() => setShowAddContributionModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={18} />
                Add Contribution
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Partner</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Purpose</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Receipt</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contributions.sort((a, b) => new Date(b.date) - new Date(a.date)).map((contribution, index) => (
                    <tr
                      key={contribution.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(contribution.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-semibold text-gray-900">{contribution.partnerName}</span>
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
                        <span className="text-sm text-gray-700 line-clamp-1">{contribution.purpose}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
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
                          <button className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-all">
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
              <h3 className="text-lg font-bold text-gray-900">Communication Log</h3>
              <button
                onClick={() => setShowAddCommunicationModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                <Plus size={18} />
                Log Communication
              </button>
            </div>
            <div className="space-y-3">
              {communications.sort((a, b) => new Date(b.date) - new Date(a.date)).map((comm, index) => (
                <div
                  key={comm.id}
                  className="card-modern p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
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
                        <h4 className="font-bold text-gray-900 mb-1">{comm.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">{comm.partnerName}</p>
                        <p className="text-sm text-gray-700">{comm.summary}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteCommunication(comm.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar size={14} className="text-gray-400" />
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
                    <div className="flex items-center gap-2 text-xs text-gray-600">
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
    </div>
  );
};

export default PartnersPage;
