import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Filter, Download, Search, AlertCircle, CheckCircle,
  Clock, XCircle, Package, TrendingUp, DollarSign, X, Eye, Edit, Trash2
} from 'lucide-react';
import { OrphanNeedAPI } from '../../../services/api';

const NeedsReport = ({ onClose }) => {
  const [needs, setNeeds] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    needCategory: '',
    urgency: '',
    status: '',
    searchQuery: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    fetchNeeds();
    fetchSummary();
  }, [filters, pagination.page]);

  const fetchNeeds = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(filters.needCategory && { needCategory: filters.needCategory }),
        ...(filters.urgency && { urgency: filters.urgency }),
        ...(filters.status && { status: filters.status })
      };

      const response = await OrphanNeedAPI.getAll(params);
      setNeeds(response.data || []);
      setPagination(prev => ({
        ...prev,
        total: response.pagination?.total || 0,
        totalPages: response.pagination?.totalPages || 0
      }));
    } catch (error) {
      // Silently handle - orphan needs feature is disabled
      setNeeds([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await OrphanNeedAPI.getSummary();
      setSummary(data);
    } catch (error) {
      // Silently handle - orphan needs feature is disabled
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      needCategory: '',
      urgency: '',
      status: '',
      searchQuery: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const filteredNeeds = needs.filter(need => {
    if (!filters.searchQuery) return true;
    const query = filters.searchQuery.toLowerCase();
    return (
      need.need_type?.toLowerCase().includes(query) ||
      need.orphan_name?.toLowerCase().includes(query) ||
      need.description?.toLowerCase().includes(query)
    );
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Approved': return 'bg-blue-100 text-blue-700';
      case 'Fulfilled': return 'bg-green-100 text-green-700';
      case 'In Progress': return 'bg-purple-100 text-purple-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-700';
      case 'High': return 'bg-orange-100 text-orange-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Pending': return <Clock size={16} />;
      case 'Approved': return <CheckCircle size={16} />;
      case 'Fulfilled': return <Package size={16} />;
      case 'In Progress': return <TrendingUp size={16} />;
      case 'Cancelled': return <XCircle size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Orphan Name',
      'District',
      'Need Type',
      'Category',
      'Quantity',
      'Estimated Cost',
      'Urgency',
      'Status',
      'Recorded Date',
      'Recorded By'
    ];

    const rows = filteredNeeds.map(need => [
      need.orphan_name || '',
      need.orphan_district || '',
      need.need_type || '',
      need.need_category || '',
      need.quantity || '',
      need.estimated_cost || '',
      need.urgency || '',
      need.status || '',
      need.recorded_date || '',
      need.recorded_by_name || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `orphan_needs_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-t-2xl flex-shrink-0 z-10">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ClipboardList size={28} />
                <h2 className="text-2xl font-bold">Orphan Needs Report</h2>
              </div>
              <p className="text-blue-100 text-sm">
                View and manage all recorded orphan needs
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary?.overall && (
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <SummaryCard
                label="Total Needs"
                value={summary.overall.total_needs || 0}
                icon={<ClipboardList size={20} />}
                color="blue"
              />
              <SummaryCard
                label="Pending"
                value={summary.overall.pending_needs || 0}
                icon={<Clock size={20} />}
                color="yellow"
              />
              <SummaryCard
                label="Approved"
                value={summary.overall.approved_needs || 0}
                icon={<CheckCircle size={20} />}
                color="blue"
              />
              <SummaryCard
                label="Fulfilled"
                value={summary.overall.fulfilled_needs || 0}
                icon={<Package size={20} />}
                color="green"
              />
              <SummaryCard
                label="In Progress"
                value={summary.overall.in_progress_needs || 0}
                icon={<TrendingUp size={20} />}
                color="purple"
              />
              <SummaryCard
                label="High Urgency"
                value={summary.overall.high_urgency_needs || 0}
                icon={<AlertCircle size={20} />}
                color="red"
              />
              <SummaryCard
                label="Est. Cost"
                value={`LKR ${parseFloat(summary.overall.total_estimated_cost || 0).toLocaleString()}`}
                icon={<DollarSign size={20} />}
                color="green"
                small
              />
              <SummaryCard
                label="Actual Cost"
                value={`LKR ${parseFloat(summary.overall.total_actual_cost || 0).toLocaleString()}`}
                icon={<DollarSign size={20} />}
                color="blue"
                small
              />
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filters</h3>
            {(filters.needCategory || filters.urgency || filters.status || filters.searchQuery) && (
              <button
                onClick={clearFilters}
                className="ml-auto text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search size={16} className="inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                placeholder="Search needs..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filters.needCategory}
                onChange={(e) => handleFilterChange('needCategory', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Education">Education</option>
                <option value="Health">Health / Medical</option>
                <option value="Clothing">Clothing</option>
                <option value="Food">Food / Nutrition</option>
                <option value="Household">Household Items</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency
              </label>
              <select
                value={filters.urgency}
                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Urgencies</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="In Progress">In Progress</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredNeeds.length}</span> of{' '}
            <span className="font-semibold">{pagination.total}</span> needs
          </p>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        {/* Needs Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading needs...</p>
              </div>
            </div>
          ) : filteredNeeds.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ClipboardList size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">No needs found</p>
                <p className="text-gray-500 text-sm mt-1">
                  {filters.needCategory || filters.urgency || filters.status || filters.searchQuery
                    ? 'Try adjusting your filters'
                    : 'No orphan needs have been recorded yet'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Orphan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Need Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Est. Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNeeds.map((need) => (
                    <tr
                      key={need.id}
                      className="hover:bg-gray-50 transition cursor-pointer"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{need.orphan_name}</p>
                          <p className="text-sm text-gray-500">{need.orphan_district}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-gray-900">{need.need_type}</p>
                        {need.description && (
                          <p className="text-sm text-gray-500 max-w-xs truncate">
                            {need.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                          {need.need_category}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-gray-900">{need.quantity}</span>
                      </td>
                      <td className="px-4 py-4">
                        {need.estimated_cost ? (
                          <span className="font-medium text-gray-900">
                            LKR {parseFloat(need.estimated_cost).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getUrgencyColor(need.urgency)}`}>
                          {need.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full font-medium w-fit ${getStatusColor(need.status)}`}>
                          {getStatusIcon(need.status)}
                          {need.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900">
                          {need.recorded_date ? new Date(need.recorded_date).toLocaleDateString() : '-'}
                        </p>
                        <p className="text-xs text-gray-500">{need.recorded_by_name}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-between items-center">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ label, value, icon, color, small }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium uppercase">{label}</span>
      </div>
      <p className={`font-bold ${small ? 'text-sm' : 'text-lg'}`}>{value}</p>
    </div>
  );
};

export default NeedsReport;
