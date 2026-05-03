import React, { useState, useEffect, useMemo } from 'react';
import { useBeneficiaries } from '../../contexts/BeneficiaryContext';
import { useAuth } from '../../contexts/AuthContext';
import { PERMISSIONS } from '../../utils/permissions';
import BeneficiaryFormModal from '../../components/beneficiaries/BeneficiaryFormModal';
import BeneficiaryListGenerator from '../../components/beneficiaries/BeneficiaryListGenerator';
import BulkUploadModal from '../../components/common/BulkUploadModal';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Heart,
  FileText,
  X,
  Eye,
  Edit,
  Trash2,
  Download,
  Grid3x3,
  List,
  CheckCircle,
  Clock,
  Activity,
  DollarSign,
  ClipboardList,
  Upload
} from 'lucide-react';
import './BeneficiariesPage.css';

const BeneficiariesPage = () => {
  const { currentUser: user, hasPermission } = useAuth();
  const {
    beneficiaries,
    loading,
    pagination,
    filters,
    fetchBeneficiaries,
    updateFilters,
    clearFilters,
    getBeneficiaryStats,
    deleteBeneficiary,
    getDistricts,
    getDivisions,
    bulkImportBeneficiaries
  } = useBeneficiaries();

  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [districts, setDistricts] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // table or grid
  const [showListGenerator, setShowListGenerator] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const canView = hasPermission(PERMISSIONS.BENEFICIARIES_VIEW);
  const canCreate = hasPermission(PERMISSIONS.BENEFICIARIES_CREATE);
  const canEdit = hasPermission(PERMISSIONS.BENEFICIARIES_EDIT);
  const canDelete = hasPermission(PERMISSIONS.BENEFICIARIES_DELETE);

  useEffect(() => {
    if (canView) {
      loadInitialData();
    }
  }, [canView]);

  const loadInitialData = async () => {
    try {
      await fetchBeneficiaries();
      const statsData = await getBeneficiaryStats();
      setStats(statsData);
      const districtList = await getDistricts();
      setDistricts(districtList);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearch = () => {
    updateFilters({ search: searchTerm });
    fetchBeneficiaries({ page: 1 });
  };

  const handleDistrictChange = async (district) => {
    setSelectedDistrict(district);
    updateFilters({ district, division: '' });
    fetchBeneficiaries({ page: 1 });

    if (district) {
      const divisionList = await getDivisions(district);
      setDivisions(divisionList);
    } else {
      setDivisions([]);
    }
  };

  const handleFilterChange = (key, value) => {
    updateFilters({ [key]: value });
    fetchBeneficiaries({ page: 1 });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDistrict('');
    setDivisions([]);
    clearFilters();
    fetchBeneficiaries({ page: 1 });
  };

  const handlePageChange = (newPage) => {
    fetchBeneficiaries({ page: newPage });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this beneficiary?')) {
      try {
        await deleteBeneficiary(id);
        const statsData = await getBeneficiaryStats();
        setStats(statsData);
      } catch (error) {
        console.error('Error deleting beneficiary:', error);
      }
    }
  };

  const handleViewDetails = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
  };

  const handleEdit = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowEditModal(true);
  };

  const handleCloseModal = async () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedBeneficiary(null);
    await fetchBeneficiaries();
    const statsData = await getBeneficiaryStats();
    setStats(statsData);
  };

  // Calculate additional analytics
  const analytics = useMemo(() => {
    if (!beneficiaries || beneficiaries.length === 0) return null;

    // Age distribution
    const age0to18 = beneficiaries.filter(b => {
      const age = parseInt(b.age);
      return !isNaN(age) && age >= 0 && age <= 18;
    }).length;

    const age19to35 = beneficiaries.filter(b => {
      const age = parseInt(b.age);
      return !isNaN(age) && age >= 19 && age <= 35;
    }).length;

    const age36to60 = beneficiaries.filter(b => {
      const age = parseInt(b.age);
      return !isNaN(age) && age >= 36 && age <= 60;
    }).length;

    const age60plus = beneficiaries.filter(b => {
      const age = parseInt(b.age);
      return !isNaN(age) && age > 60;
    }).length;

    // Support distribution by district (top 5)
    const districtCounts = {};
    beneficiaries.forEach(b => {
      if (b.district) {
        districtCounts[b.district] = (districtCounts[b.district] || 0) + 1;
      }
    });

    const topDistricts = Object.entries(districtCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([district, count]) => ({
        district,
        count,
        percentage: Math.round((count / beneficiaries.length) * 100)
      }));

    return {
      ageGroups: [
        { label: '0-18 Years', count: age0to18 },
        { label: '19-35 Years', count: age19to35 },
        { label: '36-60 Years', count: age36to60 },
        { label: '60+ Years', count: age60plus }
      ],
      topDistricts
    };
  }, [beneficiaries]);

  if (!canView) {
    return (
      <div className="beneficiaries-page">
        <div className="no-permission">
          <AlertTriangle size={48} />
          <h2>Access Denied</h2>
          <p>You do not have permission to view beneficiaries.</p>
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
              <Users className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Beneficiaries</p>
              <h1 className="text-h2 font-bold leading-tight">Beneficiary Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Universal database across all projects · Supporting {stats?.total_beneficiaries || 0} individuals</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setShowBulkUpload(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition">
              <Upload size={16} /> Bulk Upload
            </button>
            <button onClick={() => setShowListGenerator(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition">
              <ClipboardList size={16} /> Generate List
            </button>
            <button onClick={() => handleClearFilters()} className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition">
              <Download size={16} /> Export Data
            </button>
            {canCreate && (
              <button onClick={() => setShowAddModal(true)} className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition">
                <UserPlus size={16} /> Register Beneficiary
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              title: 'Total Beneficiaries',
              value: stats.total_beneficiaries || 0,
              icon: Users,
              gradient: 'from-blue-500 to-cyan-600',
              subtitle: 'registered individuals'
            },
            {
              title: 'Active Beneficiaries',
              value: stats.active_beneficiaries || 0,
              icon: TrendingUp,
              gradient: 'from-green-500 to-emerald-600',
              subtitle: 'currently receiving support'
            },
            {
              title: 'Vulnerable Cases',
              value: stats.vulnerable_beneficiaries || 0,
              icon: AlertTriangle,
              gradient: 'from-orange-500 to-amber-600',
              subtitle: 'require priority attention'
            },
            {
              title: 'Districts Covered',
              value: stats.districts_covered || 0,
              icon: MapPin,
              gradient: 'from-purple-500 to-indigo-600',
              subtitle: 'geographic reach'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
              
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-ink-600 mb-1">{stat.title}</p>
                  <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                  <p className="text-xs text-ink-500 mt-0.5">{stat.subtitle}</p>
                </div>
                <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0`}>
                  <stat.icon className="text-white" size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Secondary Stats - Age & Type Breakdown */}
      {beneficiaries && beneficiaries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(() => {
            // Calculate real age distribution
            const age0to18 = beneficiaries.filter(b => {
              const age = parseInt(b.age);
              return !isNaN(age) && age >= 0 && age <= 18;
            }).length;

            const age19to35 = beneficiaries.filter(b => {
              const age = parseInt(b.age);
              return !isNaN(age) && age >= 19 && age <= 35;
            }).length;

            const age36to60 = beneficiaries.filter(b => {
              const age = parseInt(b.age);
              return !isNaN(age) && age >= 36 && age <= 60;
            }).length;

            const age60plus = beneficiaries.filter(b => {
              const age = parseInt(b.age);
              return !isNaN(age) && age > 60;
            }).length;

            return [
              {
                title: 'Age 0-18 Years',
                value: age0to18,
                icon: Users,
                gradient: 'from-blue-500 to-cyan-600',
                change: 'Children & youth',
                subtitle: 'youngest group'
              },
              {
                title: 'Age 19-35 Years',
                value: age19to35,
                icon: Users,
                gradient: 'from-green-500 to-emerald-600',
                change: 'Young adults',
                subtitle: 'working age'
              },
              {
                title: 'Age 36-60 Years',
                value: age36to60,
                icon: Users,
                gradient: 'from-orange-500 to-amber-600',
                change: 'Middle-aged',
                subtitle: 'prime working age'
              },
              {
                title: 'Age 60+ Years',
                value: age60plus,
                icon: Heart,
                gradient: 'from-purple-500 to-indigo-600',
                change: 'Elderly',
                subtitle: 'senior citizens'
              }
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer"
                
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-600 mb-1">{stat.title}</p>
                    <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg shadow-sm transform group- transition-transform duration-200 flex-shrink-0`}>
                    <stat.icon className="text-white" size={18} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                  <span className="text-xs font-medium text-ink-600">{stat.change}</span>
                </div>
              </div>
            ));
          })()}
        </div>
      )}

      {/* Analytics Charts */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Geographic Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <MapPin className="text-purple-600" size={18} />
                  Geographic Distribution
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">Beneficiaries by district</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-ink-900">{stats?.districts_covered || 0}</div>
                <div className="text-xs text-purple-600">Districts</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {(() => {
                if (!analytics.topDistricts || analytics.topDistricts.length === 0) {
                  return (
                    <div className="text-center py-8 text-ink-500 text-sm">
                      No geographic data available
                    </div>
                  );
                }

                return analytics.topDistricts.map((item, index) => (
                  <div key={index} className="" >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink-700">{item.district}</span>
                      <span className="text-xs font-bold text-ink-900">{item.count} beneficiaries</span>
                    </div>
                    <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r ${
                        index === 0 ? 'from-purple-500 to-indigo-600' :
                        index === 1 ? 'from-blue-500 to-cyan-600' :
                        index === 2 ? 'from-green-500 to-emerald-600' :
                        index === 3 ? 'from-orange-500 to-amber-600' :
                        'from-pink-500 to-rose-600'
                      }`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Beneficiary Type Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <Users className="text-blue-600" size={18} />
                  Beneficiary Type Distribution
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">Support categories</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {(() => {
                // Calculate beneficiary type distribution
                const typeCounts = {};
                beneficiaries.forEach(b => {
                  if (b.beneficiary_type) {
                    typeCounts[b.beneficiary_type] = (typeCounts[b.beneficiary_type] || 0) + 1;
                  }
                });

                const topTypes = Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4);

                if (topTypes.length === 0) {
                  return (
                    <div className="text-center py-8 text-ink-500 text-sm">
                      No type data available
                    </div>
                  );
                }

                return topTypes.map(([type, count], index) => {
                  const percentage = Math.round((count / beneficiaries.length) * 100);
                  return (
                    <div key={index} className="" >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-ink-700">{type}</span>
                        <span className="text-xs font-bold text-ink-900">{count} beneficiaries</span>
                      </div>
                      <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-1.5 rounded-full transition-all duration-500 bg-gradient-to-r ${
                          index === 0 ? 'from-blue-500 to-cyan-600' :
                          index === 1 ? 'from-green-500 to-emerald-600' :
                          index === 2 ? 'from-orange-500 to-amber-600' :
                          'from-purple-500 to-indigo-600'
                        }`} style={{ width: `${percentage}%` }}></div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Support Value Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <DollarSign className="text-green-600" size={18} />
                  Support Value Distribution
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">Total support breakdown</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-green-600">
                  LKR {(beneficiaries.reduce((sum, b) => sum + (b.total_value || 0), 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-ink-600">Total value</div>
              </div>
            </div>
            <div className="space-y-2.5">
              {(() => {
                // Calculate support value ranges
                const range1 = beneficiaries.filter(b => b.total_value > 0 && b.total_value < 50000).length;
                const range2 = beneficiaries.filter(b => b.total_value >= 50000 && b.total_value < 100000).length;
                const range3 = beneficiaries.filter(b => b.total_value >= 100000 && b.total_value < 200000).length;
                const range4 = beneficiaries.filter(b => b.total_value >= 200000).length;
                const totalWithSupport = range1 + range2 + range3 + range4;

                if (totalWithSupport === 0) {
                  return (
                    <div className="text-center py-8 text-ink-500 text-sm">
                      No support value data available
                    </div>
                  );
                }

                return [
                  { range: 'LKR 0 - 50,000', count: range1, percent: Math.round((range1 / totalWithSupport) * 100), color: 'from-blue-500 to-cyan-600' },
                  { range: 'LKR 50,000 - 100,000', count: range2, percent: Math.round((range2 / totalWithSupport) * 100), color: 'from-green-500 to-emerald-600' },
                  { range: 'LKR 100,000 - 200,000', count: range3, percent: Math.round((range3 / totalWithSupport) * 100), color: 'from-orange-500 to-amber-600' },
                  { range: 'LKR 200,000+', count: range4, percent: Math.round((range4 / totalWithSupport) * 100), color: 'from-purple-500 to-indigo-600' }
                ].filter(item => item.count > 0).map((item, index) => (
                  <div key={index} className="" >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink-700">{item.range}</span>
                      <span className="text-xs font-bold text-ink-900">{item.count} beneficiaries</span>
                    </div>
                    <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                        style={{ width: `${item.percent}%` }}></div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Support Activity Status */}
          <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                  <Activity className="text-orange-600" size={18} />
                  Support Activity Status
                </h3>
                <p className="text-xs text-ink-600 mt-0.5">Beneficiary engagement</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { status: 'Active Beneficiaries', count: stats?.active_beneficiaries || 0, color: 'bg-green-500' },
                { status: 'Vulnerable Cases', count: stats?.vulnerable_beneficiaries || 0, color: 'bg-orange-500' },
                { status: 'With Support History', count: beneficiaries.filter(b => b.total_supports > 0).length, color: 'bg-blue-500' },
                { status: 'New Registrations', count: beneficiaries.filter(b => !b.total_supports || b.total_supports === 0).length, color: 'bg-purple-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-ink-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                    <span className="text-xs font-medium text-ink-700">{item.status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-900">{item.count} people</span>
                    <span className="text-xs text-ink-600 bg-white px-1.5 py-0.5 rounded">
                      {Math.round((item.count / (stats?.total_beneficiaries || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center gap-3 bg-ink-50 rounded-lg px-4 py-2 border border-ink-100">
            <Search size={20} className="text-ink-400" />
            <input
              type="text"
              placeholder="Search by name, NIC, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
            <button
              onClick={handleSearch}
              className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
              }`}
            >
              <Filter size={18} />
              Filters
            </button>

            <div className="flex bg-ink-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-sm' : 'hover:bg-ink-200'
                }`}
              >
                <List size={18} className={viewMode === 'table' ? 'text-blue-600' : 'text-ink-600'} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-ink-200'
                }`}
              >
                <Grid3x3 size={18} className={viewMode === 'grid' ? 'text-blue-600' : 'text-ink-600'} />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-ink-100">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="form-group">
                <label className="text-xs font-semibold text-ink-700 mb-2">District</label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-ink-700 mb-2">Division</label>
                <select
                  value={filters.division}
                  onChange={(e) => handleFilterChange('division', e.target.value)}
                  disabled={!selectedDistrict}
                  className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-ink-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Divisions</option>
                  {divisions.map((division) => (
                    <option key={division} value={division}>
                      {division}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-ink-700 mb-2">Vulnerability Status</label>
                <select
                  value={filters.isVulnerable}
                  onChange={(e) => handleFilterChange('isVulnerable', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All</option>
                  <option value="true">Vulnerable Only</option>
                  <option value="false">Non-Vulnerable</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-ink-700 mb-2">Status</label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-ink-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                  <option value="">All</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
              >
                <X size={16} />
                Clear All Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Beneficiaries Content */}
      <div className="bg-white rounded-lg shadow-sm border border-ink-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-ink-600 text-sm">Loading beneficiaries...</p>
          </div>
        ) : beneficiaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="bg-ink-100 p-6 rounded-full mb-4">
              <Users className="w-12 h-12 text-ink-400" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900 mb-2">No Beneficiaries Found</h3>
            <p className="text-ink-500 text-sm mb-6">Try adjusting your search or filters.</p>
            {canCreate && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={20} />
                Register First Beneficiary
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">NIC</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Contact</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Location</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Support History</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {beneficiaries.map((beneficiary, index) => (
                      <tr
                        key={beneficiary.id}
                        className="hover:bg-ink-50 transition-colors"
                        
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-ink-900">{beneficiary.nic}</span>
                            {beneficiary.is_vulnerable && (
                              <span className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1">
                                <AlertTriangle size={12} />
                                Vulnerable
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-ink-900">{beneficiary.full_name}</span>
                            <span className="text-xs text-ink-500">{beneficiary.gender || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-ink-600">
                            <Phone size={14} />
                            {beneficiary.primary_phone || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-ink-600">
                            <MapPin size={14} />
                            {beneficiary.district && beneficiary.division
                              ? `${beneficiary.division}, ${beneficiary.district}`
                              : beneficiary.district || 'N/A'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              beneficiary.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-ink-100 text-ink-700'
                            }`}
                          >
                            {beneficiary.is_active ? <CheckCircle size={12} /> : <Clock size={12} />}
                            {beneficiary.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 text-xs text-ink-600">
                            <div className="flex items-center gap-1">
                              <FileText size={12} />
                              {beneficiary.total_supports || 0} supports
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={12} />
                              LKR {(beneficiary.total_value || 0).toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(beneficiary)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            {canEdit && (
                              <button
                                onClick={() => handleEdit(beneficiary)}
                                className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(beneficiary.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                {beneficiaries.map((beneficiary, index) => (
                  <div
                    key={beneficiary.id}
                    className="bg-white border border-ink-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                    
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-ink-900 text-sm mb-1">{beneficiary.full_name}</h3>
                        <p className="text-xs text-ink-500">{beneficiary.nic}</p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          beneficiary.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-ink-100 text-ink-700'
                        }`}
                      >
                        {beneficiary.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs text-ink-600">
                        <Phone size={12} />
                        {beneficiary.primary_phone || 'N/A'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-ink-600">
                        <MapPin size={12} />
                        {beneficiary.district || 'N/A'}
                      </div>
                      {beneficiary.is_vulnerable && (
                        <div className="flex items-center gap-2 text-xs text-orange-600">
                          <AlertTriangle size={12} />
                          Vulnerable Case
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                      <div className="text-xs text-ink-600">
                        <div>{beneficiary.total_supports || 0} supports</div>
                        <div className="font-medium text-ink-900">LKR {(beneficiary.total_value || 0).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleViewDetails(beneficiary)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                          title="View"
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => handleEdit(beneficiary)}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(beneficiary.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-ink-100 bg-ink-50">
                <div className="text-sm text-ink-600">
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} total)
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-ink-700 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <BeneficiaryFormModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        beneficiary={null}
      />

      <BeneficiaryFormModal
        isOpen={showEditModal}
        onClose={handleCloseModal}
        beneficiary={selectedBeneficiary}
      />

      {/* List Generator Modal */}
      {showListGenerator && (
        <BeneficiaryListGenerator
          beneficiaries={beneficiaries || []}
          onClose={() => setShowListGenerator(false)}
        />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          type="beneficiaries"
          title="Bulk Upload Beneficiaries"
          onUpload={async (validData, progressCallback) => {
            await bulkImportBeneficiaries(validData, progressCallback);
          }}
        />
      )}
    </div>
  );
};

export default BeneficiariesPage;
