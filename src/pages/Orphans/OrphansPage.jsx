import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Heart, Sparkles, BarChart3, PieChart, LineChart, TrendingUp,
  MapPin, Users, Calendar, Baby, Wallet, AlertCircle, CheckCircle, Clock, ClipboardList, Upload } from 'lucide-react';
import { useOrphans } from '../../contexts/OrphanContext';
import OrphanCard from './components/OrphanCard';
import OrphanListView from './components/OrphanListView';
import OrphanMapView from './components/OrphanMapView';
import OrphanProfile from './components/OrphanProfile';
import OrphanFilters from './components/OrphanFilters';
import VisitForm from './components/VisitForm';
import StatsCards from './components/StatsCards';
import AddOrphanForm from './components/AddOrphanForm';
import NeedsReport from './components/NeedsReport';
import BulkUploadModal from '../../components/common/BulkUploadModal';
import { OrphanNeedAPI } from '../../services/api';

const OrphansPage = () => {
  const {
    orphans,
    deleteOrphan,
    addVisit,
    searchOrphans,
    getStats,
    getDistricts,
    fetchOrphans,
    bulkImportOrphans
  } = useOrphans();

  // Fetch orphans when component mounts
  useEffect(() => {
    fetchOrphans();
  }, []);


  // Performance targets for orphan care metrics
  const performanceTargets = {
    orphanCare: {
      regularVisitsTarget: 80,
      healthCheckupsTarget: 90,
      educationSupportTarget: 95,
      familySupportTarget: 85
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedOrphan, setSelectedOrphan] = useState(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitOrphan, setVisitOrphan] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [orphanToEdit, setOrphanToEdit] = useState(null);
  const [showNeedsReport, setShowNeedsReport] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const baseStats = getStats();
  const districts = getDistricts();

  // Compute additional stats for StatsCards
  const stats = {
    totalOrphans: baseStats.total,
    activeOrphans: baseStats.active,
    visitedThisMonth: orphans.filter(o => {
      if (!o.lastVisitDate) return false;
      const lastVisit = new Date(o.lastVisitDate);
      const now = new Date();
      const monthDiff = (now.getFullYear() - lastVisit.getFullYear()) * 12 + (now.getMonth() - lastVisit.getMonth());
      return monthDiff === 0;
    }).length,
    needsVisit: baseStats.needsVisit,
    totalStipend: baseStats.totalStipend,
    visitRate: baseStats.total > 0 ? Math.round((orphans.filter(o => {
      if (!o.lastVisitDate) return false;
      const lastVisit = new Date(o.lastVisitDate);
      const now = new Date();
      const monthDiff = (now.getFullYear() - lastVisit.getFullYear()) * 12 + (now.getMonth() - lastVisit.getMonth());
      return monthDiff === 0;
    }).length / baseStats.total) * 100) : 0
  };

  // Filter orphans based on search and filters
  const filteredOrphans = useMemo(() => {
    let result = orphans;

    // Apply search
    if (searchQuery) {
      result = searchOrphans(searchQuery);
    }

    // Apply district filter
    if (filterDistrict !== 'All') {
      result = result.filter(o => o.district === filterDistrict);
    }

    // Apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(o => o.status === filterStatus);
    }

    return result;
  }, [orphans, searchQuery, filterDistrict, filterStatus]);

  const handleViewOrphan = (orphan) => {
    setSelectedOrphan(orphan);
  };

  const handleEditOrphan = (orphan) => {
    setOrphanToEdit(orphan);
    setShowAddForm(true);
  };

  const handleDeleteOrphan = (id) => {
    deleteOrphan(id);
  };

  const handleAddVisit = (orphan) => {
    setVisitOrphan(orphan);
    setShowVisitForm(true);
  };

  const handleVisitSubmit = async (orphanId, visitData) => {
    try {
      // Save visit data
      addVisit(orphanId, visitData);

      // Save any recorded needs to the database
      if (visitData.currentNeeds && visitData.currentNeeds.length > 0) {
        for (const need of visitData.currentNeeds) {
          await OrphanNeedAPI.create({
            orphanId: orphanId,
            needType: need.needType,
            needCategory: need.needCategory,
            description: need.description,
            quantity: need.quantity,
            estimatedCost: need.estimatedCost || null,
            urgency: need.urgency
          });
        }
        console.log(`✅ ${visitData.currentNeeds.length} need(s) recorded for orphan ${orphanId}`);
      }

      // Refresh selected orphan if viewing profile
      if (selectedOrphan?.id === orphanId) {
        const updated = orphans.find(o => o.id === orphanId);
        setSelectedOrphan(updated);
      }
    } catch (error) {
      console.error('Error saving visit or needs:', error);
      alert('Visit saved, but there was an error recording some needs. Please check the needs list.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center">
              <Heart className="w-5 h-5 text-mission-300" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Orphan Care</p>
              <h1 className="text-h2 font-bold leading-tight">Orphan Care Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Supporting {stats.totalOrphans} children with compassion</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
            >
              <Upload size={16} />
              Bulk Upload
            </button>
            <button
              onClick={() => setShowNeedsReport(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
            >
              <ClipboardList size={16} />
              Needs Report
            </button>
            <button
              onClick={() => { setOrphanToEdit(null); setShowAddForm(true); }}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
            >
              <Plus size={16} />
              Add Orphan
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Secondary Stats - Orphan Care Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          // Calculate real age distribution from orphan data
          const age0to5 = orphans.filter(o => {
            const age = parseInt(o.age);
            return !isNaN(age) && age >= 0 && age <= 5;
          }).length;

          const age6to12 = orphans.filter(o => {
            const age = parseInt(o.age);
            return !isNaN(age) && age >= 6 && age <= 12;
          }).length;

          const age13to18 = orphans.filter(o => {
            const age = parseInt(o.age);
            return !isNaN(age) && age >= 13 && age <= 18;
          }).length;

          // Calculate urgent cases (needs visit and overdue > 30 days)
          const today = new Date();
          const urgentCases = orphans.filter(o => {
            if (o.status !== 'Active') return false;
            if (!o.lastVisitDate) return true; // Never visited = urgent
            const lastVisit = new Date(o.lastVisitDate);
            const daysSinceVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
            return daysSinceVisit > 60; // More than 60 days = urgent
          }).length;

          return [
            { title: 'Age 0-5 Years',  value: age0to5,    icon: Baby,         tone: 'blue',    change: 'Infants & toddlers',     subtitle: 'youngest group' },
            { title: 'Age 6-12 Years', value: age6to12,   icon: Users,        tone: 'indigo',  change: 'School-age children',    subtitle: 'primary education' },
            { title: 'Age 13-18 Years',value: age13to18,  icon: Users,        tone: 'amber',   change: 'Teenagers',              subtitle: 'secondary education' },
            { title: 'Urgent Cases',   value: urgentCases,icon: AlertCircle,  tone: 'red',     change: 'Need immediate attention',subtitle: 'priority visits' }
          ].map((stat, index) => {
            const StatIcon = stat.icon;
            const tone = {
              blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700' },
              indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
              amber:  { bg: 'bg-mission-50',border: 'border-mission-200',text: 'text-mission-700' },
              red:    { bg: 'bg-danger-50', border: 'border-danger-200', text: 'text-danger-700' },
            }[stat.tone];
            return (
              <div key={index} className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-ink-600 mb-1">{stat.title}</p>
                    <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                    <p className="text-xs text-ink-500 mt-0.5">{stat.subtitle}</p>
                  </div>
                  <div className={`${tone.bg} ${tone.border} border p-2.5 rounded-md flex-shrink-0`}>
                    <StatIcon className={tone.text} size={18} />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-ink-100">
                  <span className="text-xs font-medium text-ink-600">{stat.change}</span>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District Distribution Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <MapPin className="text-purple-600" size={18} />
                Geographic Distribution
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">Orphans by district</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-ink-900">{districts.length}</div>
              <div className="text-xs text-purple-600">Districts</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {(() => {
              if (stats.totalOrphans === 0) {
                return (
                  <div className="text-center py-8 text-ink-500 text-sm">
                    No geographic data available
                  </div>
                );
              }

              return districts.slice(0, 5).map((district, index) => {
                const count = orphans.filter(o => o.district === district).length;
                const percent = stats.totalOrphans > 0 ? Math.round((count / stats.totalOrphans) * 100) : 0;
                return (
                  <div key={index} className="" >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-ink-700">{district}</span>
                      <span className="text-xs font-bold text-ink-900">{count} children</span>
                    </div>
                    <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-1.5 rounded-full transition-all duration-500 bg-navy-900" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Visit Status Chart */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Calendar className="text-green-600" size={18} />
                Visit Status Overview
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">Current visit tracking</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { status: 'Visited This Month', count: stats.visitedThisMonth, color: 'bg-green-500' },
              { status: 'Needs Visit', count: stats.needsVisit, color: 'bg-yellow-500' },
              { status: 'Overdue Visit', count: Math.max(0, Math.floor(stats.needsVisit * 0.4)), color: 'bg-red-500' },
              { status: 'Up to Date', count: stats.totalOrphans - stats.needsVisit, color: 'bg-blue-500' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-ink-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`}></div>
                  <span className="text-xs font-medium text-ink-700">{item.status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-ink-900">{item.count} children</span>
                  <span className="text-xs text-ink-600 bg-white px-1.5 py-0.5 rounded">
                    {Math.round((item.count / stats.totalOrphans) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Stipend Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Wallet className="text-blue-600" size={18} />
                Monthly Stipend Distribution
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">Support breakdown</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">LKR {(stats.totalStipend / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-ink-600">Total monthly</div>
            </div>
          </div>
          <div className="space-y-2.5">
            {(() => {
              // Calculate real stipend distribution from orphan data
              const range1 = orphans.filter(o => o.stipendAmount >= 5000 && o.stipendAmount < 10000).length;
              const range2 = orphans.filter(o => o.stipendAmount >= 10000 && o.stipendAmount < 15000).length;
              const range3 = orphans.filter(o => o.stipendAmount >= 15000 && o.stipendAmount < 20000).length;
              const range4 = orphans.filter(o => o.stipendAmount >= 20000).length;
              const totalWithStipend = range1 + range2 + range3 + range4;

              if (totalWithStipend === 0) {
                return (
                  <div className="text-center py-8 text-ink-500 text-sm">
                    No stipend data available
                  </div>
                );
              }

              return [
                { range: 'LKR 5,000 - 10,000', count: range1, percent: Math.round((range1 / totalWithStipend) * 100) },
                { range: 'LKR 10,000 - 15,000', count: range2, percent: Math.round((range2 / totalWithStipend) * 100) },
                { range: 'LKR 15,000 - 20,000', count: range3, percent: Math.round((range3 / totalWithStipend) * 100) },
                { range: 'LKR 20,000+', count: range4, percent: Math.round((range4 / totalWithStipend) * 100) }
              ].filter(item => item.count > 0).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-700">{item.range}</span>
                    <span className="text-xs font-bold text-ink-900">{item.count} children</span>
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

        {/* Care Program Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Heart className="text-pink-600" size={18} />
                Care Program Performance
              </h3>
              <p className="text-xs text-ink-600 mt-0.5">Quality indicators</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-pink-600">{stats.visitRate}%</div>
              <div className="text-xs text-ink-600">Visit rate</div>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              if (stats.totalOrphans === 0) {
                return (
                  <div className="text-center py-8 text-ink-500 text-sm">
                    No performance data available
                  </div>
                );
              }

              // Calculate health checkup rate (orphans with healthStatus recorded)
              const withHealthCheckups = orphans.filter(o => o.healthStatus && o.healthStatus !== 'Unknown').length;
              const healthCheckupRate = stats.totalOrphans > 0 ? Math.round((withHealthCheckups / stats.totalOrphans) * 100) : 0;

              // Calculate education support rate (orphans in school)
              const inSchool = orphans.filter(o => o.educationStatus === 'In School' || o.educationStatus === 'Enrolled').length;
              const educationRate = stats.totalOrphans > 0 ? Math.round((inSchool / stats.totalOrphans) * 100) : 0;

              // Calculate family support rate (orphans with active guardians)
              const withGuardians = orphans.filter(o => o.guardianName && o.guardianName !== '').length;
              const familySupportRate = stats.totalOrphans > 0 ? Math.round((withGuardians / stats.totalOrphans) * 100) : 0;

              return [
                { metric: 'Regular Visits', value: stats.visitRate, target: performanceTargets.orphanCare.regularVisitsTarget, status: stats.visitRate >= performanceTargets.orphanCare.regularVisitsTarget ? 'above' : 'below' },
                { metric: 'Health Checkups', value: healthCheckupRate, target: performanceTargets.orphanCare.healthCheckupsTarget, status: healthCheckupRate >= performanceTargets.orphanCare.healthCheckupsTarget ? 'above' : 'below' },
                { metric: 'Education Support', value: educationRate, target: performanceTargets.orphanCare.educationSupportTarget, status: educationRate >= performanceTargets.orphanCare.educationSupportTarget ? 'above' : 'below' },
                { metric: 'Family Support', value: familySupportRate, target: performanceTargets.orphanCare.familySupportTarget, status: familySupportRate >= performanceTargets.orphanCare.familySupportTarget ? 'above' : 'below' }
              ].map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-700">{item.metric}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-ink-900">{item.value}%</span>
                      {item.status === 'above' ? (
                        <CheckCircle className="text-green-600" size={12} />
                      ) : (
                        <Clock className="text-yellow-600" size={12} />
                      )}
                    </div>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.status === 'above'
                          ? 'bg-navy-900'
                          : 'bg-navy-900'
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-ink-500">Target: {item.target}%</span>
                    <span className={`text-xs font-medium ${
                      item.status === 'above' ? 'text-green-600' : 'text-yellow-600'
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

      {/* Filters */}
      <OrphanFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDistrict={filterDistrict}
        setFilterDistrict={setFilterDistrict}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        districts={districts}
      />

      {/* Orphan Views */}
      {viewMode === 'map' ? (
        <OrphanMapView
          orphans={filteredOrphans}
          onView={handleViewOrphan}
        />
      ) : filteredOrphans.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredOrphans.map((orphan) => (
            <div
              key={orphan.id}
              className=""
              
            >
              {viewMode === 'grid' ? (
                <OrphanCard
                  orphan={orphan}
                  onView={handleViewOrphan}
                  onEdit={handleEditOrphan}
                  onDelete={handleDeleteOrphan}
                />
              ) : (
                <OrphanListView
                  orphan={orphan}
                  onView={handleViewOrphan}
                  onEdit={handleEditOrphan}
                  onDelete={handleDeleteOrphan}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card-modern text-center py-16 ">
          <div className="flex flex-col items-center gap-4">
            <div className="bg-ink-100 p-6 rounded-full">
              <Heart className="w-12 h-12 text-ink-400" />
            </div>
            <div>
              <p className="text-ink-900 text-lg font-semibold">No orphans found</p>
              <p className="text-ink-500 text-sm mt-2">Try adjusting your filters or search query</p>
            </div>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterDistrict('All');
                setFilterStatus('All');
              }}
              className="btn-secondary mt-4"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Orphan Profile Modal */}
      {selectedOrphan && (
        <OrphanProfile
          orphan={selectedOrphan}
          onClose={() => setSelectedOrphan(null)}
          onAddVisit={handleAddVisit}
        />
      )}

      {/* Visit Form Modal */}
      {showVisitForm && visitOrphan && (
        <VisitForm
          orphan={visitOrphan}
          onClose={() => {
            setShowVisitForm(false);
            setVisitOrphan(null);
          }}
          onSubmit={handleVisitSubmit}
        />
      )}

      {/* Add/Edit Orphan Form Modal */}
      <AddOrphanForm
        isOpen={showAddForm}
        onClose={() => {
          setShowAddForm(false);
          setOrphanToEdit(null);
        }}
        orphanToEdit={orphanToEdit}
      />

      {/* Needs Report Modal */}
      {showNeedsReport && (
        <NeedsReport onClose={() => setShowNeedsReport(false)} />
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <BulkUploadModal
          isOpen={showBulkUpload}
          onClose={() => setShowBulkUpload(false)}
          type="orphans"
          title="Bulk Upload Orphans"
          onUpload={async (validData, progressCallback) => {
            await bulkImportOrphans(validData, progressCallback);
          }}
        />
      )}
    </div>
  );
};

export default OrphansPage;
