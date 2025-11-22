import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Calendar,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  UserCog,
  Download,
  MoreVertical,
  ArrowUpDown,
  Eye,
  Edit,
  Trash2,
  FileText,
  BarChart3
} from 'lucide-react';
import { useCoordinator } from '../../contexts/CoordinatorContext';

const CoordinatorsPage = () => {
  const navigate = useNavigate();
  const { coordinators, loading, error, fetchCoordinators } = useCoordinator();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
  const [sortBy, setSortBy] = useState('name'); // name, orphans, visits, workload
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  const [showQuickActions, setShowQuickActions] = useState(null); // coordinator id for dropdown

  useEffect(() => {
    fetchCoordinators();
  }, []);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Position', 'Status', 'Orphans Assigned', 'Visits (30 Days)', 'Pending Tasks', 'Workload', 'Capacity'];
    const rows = filteredCoordinators.map(coord => [
      coord.name || '',
      coord.email || '',
      coord.phone || '',
      coord.position || '',
      coord.is_active_coordinator ? 'Active' : 'Inactive',
      coord.orphans_assigned || 0,
      coord.visits_last_30_days || 0,
      coord.pending_tasks || 0,
      coord.current_workload || 0,
      coord.max_orphan_capacity || 50
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coordinators_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Toggle sort order
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter coordinators based on search and status
  const filteredCoordinators = coordinators.filter(coord => {
    const matchesSearch =
      coord.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coord.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coord.district?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coord.email?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && coord.is_active_coordinator) ||
      (filterStatus === 'inactive' && !coord.is_active_coordinator);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'name':
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
        break;
      case 'orphans':
        aValue = parseInt(a.orphans_assigned) || 0;
        bValue = parseInt(b.orphans_assigned) || 0;
        break;
      case 'visits':
        aValue = parseInt(a.visits_last_30_days) || 0;
        bValue = parseInt(b.visits_last_30_days) || 0;
        break;
      case 'workload':
        aValue = ((a.current_workload || 0) / (a.max_orphan_capacity || 50)) * 100;
        bValue = ((b.current_workload || 0) / (b.max_orphan_capacity || 50)) * 100;
        break;
      default:
        return 0;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  // Calculate summary stats
  const totalCoordinators = coordinators.length;
  const activeCoordinators = coordinators.filter(c => c.is_active_coordinator).length;
  const totalOrphansAssigned = coordinators.reduce((sum, c) => sum + (parseInt(c.orphans_assigned) || 0), 0);
  const totalVisitsThisMonth = coordinators.reduce((sum, c) => sum + (parseInt(c.visits_last_30_days) || 0), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <UserCog className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Coordinator Management</h1>
                <p className="text-blue-100 text-sm">Managing {totalCoordinators} field coordinators with excellence</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/admin/coordinators/add')}
                className="btn-primary bg-white text-blue-600 hover:bg-blue-50 shadow-lg flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus size={18} />
                Add Coordinator
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Coordinators */}
        <div className="stat-card group cursor-pointer animate-slide-up">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Total Coordinators</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{totalCoordinators}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{activeCoordinators} active</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Users className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Coordinators */}
        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Active Coordinators</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{activeCoordinators}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">{((activeCoordinators / totalCoordinators) * 100 || 0).toFixed(0)}% active rate</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <UserCheck className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Orphans Assigned */}
        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Orphans Assigned</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{totalOrphansAssigned}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Total coverage</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-violet-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Users className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>

        {/* Visits (Last 30 Days) */}
        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Visits (Last 30 Days)</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{totalVisitsThisMonth}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Field activities</p>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Calendar className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-green-600">Good</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-col gap-4">
          {/* Top Row - Search and Actions */}
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, position, district, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* Export Button */}
            <button
              onClick={exportToCSV}
              disabled={filteredCoordinators.length === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all ${
                filteredCoordinators.length > 0
                  ? 'bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>

          {/* Bottom Row - Filters and Sorting */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="text-gray-400" size={20} />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-2">
              <ArrowUpDown className="text-gray-400" size={20} />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white text-sm"
              >
                <option value="name">Sort by Name</option>
                <option value="orphans">Sort by Orphans</option>
                <option value="visits">Sort by Visits</option>
                <option value="workload">Sort by Workload</option>
              </select>
            </div>

            {/* Sort Order Toggle */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              <ArrowUpDown size={16} />
              {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            </button>

            {/* Results Count */}
            <div className="ml-auto text-sm text-gray-600 font-medium">
              Showing {filteredCoordinators.length} of {coordinators.length} coordinators
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="font-medium">Error loading coordinators</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Coordinators Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCoordinators.map((coordinator) => (
            <div
              key={coordinator.id}
              className="card-modern group relative"
            >
              <div className="p-6">
                {/* Header with Avatar and Status */}
                <div className="flex justify-between items-center mb-4">
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => navigate(`/admin/coordinators/${coordinator.id}`)}
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-105 transition-transform">
                      {coordinator.name?.charAt(0) || 'C'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 leading-tight">{coordinator.name}</h3>
                      <p className="text-sm text-gray-500 font-medium">{coordinator.position}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex-shrink-0 ${
                      coordinator.is_active_coordinator
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {coordinator.is_active_coordinator ? 'Active' : 'Inactive'}
                    </span>
                    {/* Quick Actions Dropdown */}
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuickActions(showQuickActions === coordinator.id ? null : coordinator.id);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Quick Actions"
                      >
                        <MoreVertical size={18} className="text-gray-600" />
                      </button>

                      {showQuickActions === coordinator.id && (
                        <>
                          {/* Backdrop to close dropdown */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowQuickActions(null);
                            }}
                          />
                          {/* Dropdown Menu */}
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-20 animate-fade-in">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/coordinators/${coordinator.id}`);
                                setShowQuickActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <Eye size={16} className="text-blue-600" />
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/coordinators/${coordinator.id}/edit`);
                                setShowQuickActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <Edit size={16} className="text-green-600" />
                              Edit Coordinator
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/admin/coordinators/${coordinator.id}/performance`);
                                setShowQuickActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <BarChart3 size={16} className="text-purple-600" />
                              View Performance
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const report = `Coordinator: ${coordinator.name}\nEmail: ${coordinator.email}\nOrphans: ${coordinator.orphans_assigned || 0}\nVisits: ${coordinator.visits_last_30_days || 0}\nWorkload: ${coordinator.current_workload || 0}/${coordinator.max_orphan_capacity || 50}`;
                                navigator.clipboard.writeText(report);
                                setShowQuickActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                            >
                              <FileText size={16} className="text-orange-600" />
                              Copy Report
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to deactivate ${coordinator.name}?`)) {
                                  // Handle deactivation
                                  console.log('Deactivate coordinator:', coordinator.id);
                                }
                                setShowQuickActions(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-3 text-red-600"
                            >
                              <Trash2 size={16} />
                              Deactivate
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-5">
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin size={16} className="text-blue-500" />
                    </div>
                    <span className="font-medium truncate">{coordinator.address || coordinator.district || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail size={16} className="text-green-500" />
                    </div>
                    <span className="font-medium truncate">{coordinator.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone size={16} className="text-purple-500" />
                    </div>
                    <span className="font-medium">{coordinator.phone || 'Not provided'}</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-blue-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">
                      {coordinator.orphans_assigned || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Orphans</p>
                  </div>
                  <div className="text-center bg-green-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">
                      {coordinator.visits_last_30_days || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Visits</p>
                  </div>
                  <div className="text-center bg-orange-50 rounded-lg p-3">
                    <p className="text-2xl font-bold text-orange-600">
                      {coordinator.pending_tasks || 0}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Tasks</p>
                  </div>
                </div>

                {/* Workload Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600">Workload Capacity</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {coordinator.current_workload || 0} / {coordinator.max_orphan_capacity || 50}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        ((coordinator.current_workload || 0) / (coordinator.max_orphan_capacity || 50)) > 0.8
                          ? 'bg-gradient-to-r from-red-500 to-red-600'
                          : ((coordinator.current_workload || 0) / (coordinator.max_orphan_capacity || 50)) > 0.6
                          ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                          : 'bg-gradient-to-r from-green-500 to-green-600'
                      }`}
                      style={{
                        width: `${Math.min(
                          ((coordinator.current_workload || 0) / (coordinator.max_orphan_capacity || 50)) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/admin/coordinators/${coordinator.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
                  >
                    <TrendingUp size={16} />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCoordinators.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Coordinators Found</h3>
          <p className="text-gray-500">
            {searchQuery ? 'Try adjusting your search criteria' : 'No coordinators available'}
          </p>
        </div>
      )}
    </div>
  );
};

export default CoordinatorsPage;
