import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config/apiBase';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  TrendingUp,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  AlertTriangle,
  Activity,
  Download,
  FileText,
  BarChart3,
  Target,
  X,
  Eye,
  ClipboardList,
  Baby
} from 'lucide-react';
import { useCoordinator } from '../../contexts/CoordinatorContext';
import { useOrphans } from '../../contexts/OrphanContext';
import OrphanProfile from '../Orphans/components/OrphanProfile';
import VisitForm from '../Orphans/components/VisitForm';
import OrphanCard from '../Orphans/components/OrphanCard';

const CoordinatorDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    selectedCoordinator,
    coordinatorStats,
    assignedOrphans,
    loading,
    error,
    fetchCoordinatorById,
    fetchCoordinatorStats,
    fetchAssignedOrphans
  } = useCoordinator();

  // Orphan management integration
  const { addVisit, deleteOrphan, setSelectedOrphan } = useOrphans();

  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedOrphanForProfile, setSelectedOrphanForProfile] = useState(null);
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitOrphan, setVisitOrphan] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, orphans, performance
  const [showWorkloadModal, setShowWorkloadModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCoordinatorById(id);
      fetchCoordinatorStats(id, selectedPeriod);
      fetchAssignedOrphans(id);
    }
  }, [id, selectedPeriod]);

  // Export coordinator report
  // Handlers for orphan management
  const handleViewOrphan = async (orphan) => {
    try {
      // Fetch full orphan details from the orphans API
      const token = localStorage.getItem('accessToken');

      const response = await fetch(`${API_BASE_URL}/orphans/${orphan.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orphan details');
      }

      const responseData = await response.json();
      const fullOrphanData = responseData.data?.orphan || responseData;

      // Transform orphan data to match OrphanProfile's expected field names
      const transformedOrphan = {
        ...fullOrphanData,
        fullName: fullOrphanData.fullName || fullOrphanData.full_name || fullOrphanData.name,
        orphanId: fullOrphanData.orphanId || fullOrphanData.orphan_id || fullOrphanData.id
      };

      setSelectedOrphanForProfile(transformedOrphan);
    } catch (error) {
      console.error('Error fetching orphan details:', error);
      // Fallback to basic data if fetch fails
      const transformedOrphan = {
        ...orphan,
        fullName: orphan.name || orphan.fullName || orphan.full_name,
        orphanId: orphan.id
      };
      setSelectedOrphanForProfile(transformedOrphan);
    }
  };

  const handleLogVisit = (orphan) => {
    setVisitOrphan(orphan);
    setShowVisitForm(true);
  };

  const handleVisitSubmit = async (visitData) => {
    try {
      await addVisit(visitOrphan.id, visitData);
      setShowVisitForm(false);
      setVisitOrphan(null);
      // Refresh the orphans list
      await fetchAssignedOrphans(id);
    } catch (error) {
      console.error('Error logging visit:', error);
      alert('Failed to log visit: ' + error.message);
    }
  };

  const exportReport = () => {
    if (!selectedCoordinator) return;

    const reportData = [
      `COORDINATOR PERFORMANCE REPORT`,
      `Generated: ${new Date().toLocaleDateString()}`,
      ``,
      `COORDINATOR INFORMATION`,
      `Name: ${selectedCoordinator.name}`,
      `Email: ${selectedCoordinator.email}`,
      `Phone: ${selectedCoordinator.phone || 'N/A'}`,
      `Position: ${selectedCoordinator.position}`,
      `Status: ${selectedCoordinator.is_active_coordinator ? 'Active' : 'Inactive'}`,
      ``,
      `PERFORMANCE METRICS (${selectedPeriod})`,
      `Total Orphans Assigned: ${selectedCoordinator.total_orphans || 0}`,
      `Total Visits: ${selectedCoordinator.total_visits || 0}`,
      `Completed Tasks: ${selectedCoordinator.completed_tasks || 0}`,
      `Total Activities: ${selectedCoordinator.total_activities || 0}`,
      ``,
      `WORKLOAD`,
      `Current Workload: ${selectedCoordinator.current_workload || 0}`,
      `Max Capacity: ${selectedCoordinator.max_orphan_capacity || 50}`,
      `Utilization: ${(((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100).toFixed(1)}%`,
    ].join('\n');

    const blob = new Blob([reportData], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `coordinator_${selectedCoordinator.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
  };

  if (loading && !selectedCoordinator) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          <p className="font-medium">Error loading coordinator details</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!selectedCoordinator) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <User className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-ink-700">Coordinator Not Found</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin/coordinators')}
        className="flex items-center gap-2 text-ink-600 hover:text-ink-900 mb-6 transition"
      >
        <ArrowLeft size={20} />
        <span>Back to Coordinators</span>
      </button>

      {/* Header Card */}
      <div className="bg-navy-900 rounded-lg2 shadow-lift p-8 mb-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{selectedCoordinator.name}</h1>
            <div className="flex flex-wrap gap-4 text-blue-100">
              <div className="flex items-center gap-2">
                <Briefcase size={18} />
                <span>{selectedCoordinator.position}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{selectedCoordinator.address || 'Not specified'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedCoordinator.is_active_coordinator ? (
              <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-semibold flex items-center gap-2">
                <CheckCircle size={16} />
                Active
              </span>
            ) : (
              <span className="px-4 py-2 bg-yellow-500 text-white rounded-full text-sm font-semibold flex items-center gap-2">
                <AlertCircle size={16} />
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t border-blue-500">
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-sm font-semibold active:scale-95"
            title="Download performance report"
          >
            <Download size={16} />
            Export Report
          </button>
          <button
            onClick={() => {
              // Scroll to performance section
              const performanceSection = document.querySelector('[data-tab="overview"]');
              if (performanceSection) {
                performanceSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveTab('overview');
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-sm font-semibold active:scale-95"
            title="View performance metrics"
          >
            <BarChart3 size={16} />
            View Analytics
          </button>
          <button
            onClick={() => {
              // Copy coordinator info to clipboard for editing
              const info = `Name: ${selectedCoordinator.name}\nEmail: ${selectedCoordinator.email}\nPhone: ${selectedCoordinator.phone || 'N/A'}\nPosition: ${selectedCoordinator.position}`;
              navigator.clipboard.writeText(info);
              alert('Coordinator information copied to clipboard!');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-sm font-semibold active:scale-95"
            title="Copy coordinator information"
          >
            <FileText size={16} />
            Copy Info
          </button>
          <button
            onClick={() => setShowWorkloadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all text-sm font-semibold active:scale-95"
            title="Analyze workload capacity"
          >
            <Target size={16} />
            Workload Analysis
          </button>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-500">
          <div className="flex items-center gap-3">
            <Mail size={18} />
            <span>{selectedCoordinator.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={18} />
            <span>{selectedCoordinator.phone || 'Not provided'}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-sm text-ink-500">Total</span>
          </div>
          <p className="text-3xl font-bold text-ink-900">{selectedCoordinator.total_orphans || 0}</p>
          <p className="text-sm text-ink-600 mt-1">Orphans Assigned</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm text-ink-500">All Time</span>
          </div>
          <p className="text-3xl font-bold text-ink-900">{selectedCoordinator.total_visits || 0}</p>
          <p className="text-sm text-ink-600 mt-1">Total Visits</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-sm text-ink-500">Tasks</span>
          </div>
          <p className="text-3xl font-bold text-ink-900">{selectedCoordinator.completed_tasks || 0}</p>
          <p className="text-sm text-ink-600 mt-1">Completed Tasks</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-sm text-ink-500">Activities</span>
          </div>
          <p className="text-3xl font-bold text-ink-900">{selectedCoordinator.total_activities || 0}</p>
          <p className="text-sm text-ink-600 mt-1">Total Activities</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6" data-tab="overview">
        <div className="flex border-b border-ink-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Performance Overview
          </button>
          <button
            onClick={() => setActiveTab('orphans')}
            className={`px-6 py-4 font-semibold transition ${
              activeTab === 'orphans'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            Assigned Orphans ({assignedOrphans.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Performance Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              {/* Period Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Performance Period
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                  <option value="quarterly">Last 90 Days</option>
                  <option value="yearly">Last Year</option>
                </select>
              </div>

              {/* Performance Stats */}
              {coordinatorStats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Visit Stats */}
                  <div className="bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Visit Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-ink-600">Total Visits:</span>
                        <span className="font-semibold">{coordinatorStats.total_visits || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Completed:</span>
                        <span className="font-semibold text-green-600">{coordinatorStats.completed_visits || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Follow-ups:</span>
                        <span className="font-semibold text-yellow-600">{coordinatorStats.follow_ups_required || 0}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-blue-200">
                        <span className="text-ink-600">Completion Rate:</span>
                        <span className="font-bold text-blue-600">{coordinatorStats.visit_completion_rate || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Stats */}
                  <div className="bg-purple-50 rounded-lg p-6">
                    <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                      Task Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-ink-600">Total Tasks:</span>
                        <span className="font-semibold">{coordinatorStats.total_tasks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Completed:</span>
                        <span className="font-semibold text-green-600">{coordinatorStats.completed_tasks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Pending:</span>
                        <span className="font-semibold text-yellow-600">{coordinatorStats.pending_tasks || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Overdue:</span>
                        <span className="font-semibold text-red-600">{coordinatorStats.overdue_tasks || 0}</span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-purple-200">
                        <span className="text-ink-600">Completion Rate:</span>
                        <span className="font-bold text-purple-600">{coordinatorStats.task_completion_rate || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Activity Stats */}
                  <div className="bg-green-50 rounded-lg p-6">
                    <h3 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      Activity Metrics
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-ink-600">Total Activities:</span>
                        <span className="font-semibold">{coordinatorStats.total_activities || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Phone Calls:</span>
                        <span className="font-semibold">{coordinatorStats.phone_calls || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-600">Documents:</span>
                        <span className="font-semibold">{coordinatorStats.documents_uploaded || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Assigned Orphans Tab */}
          {activeTab === 'orphans' && (
            <div>
              {assignedOrphans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedOrphans.map((orphan) => (
                    <OrphanCard
                      key={orphan.id}
                      orphan={orphan}
                      onView={() => handleViewOrphan(orphan)}
                      onEdit={() => handleLogVisit(orphan)}
                      onDelete={() => {}}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-ink-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-ink-700">No Orphans Assigned</h3>
                  <p className="text-ink-500 mt-2">This coordinator has no orphans assigned yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Workload Analysis Modal */}
      {showWorkloadModal && selectedCoordinator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-navy-900 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Target size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Workload Analysis</h2>
                    <p className="text-blue-100 mt-1">{selectedCoordinator.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWorkloadModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-ink-50 rounded-xl p-4 border border-blue-200">
                  <div className="text-sm font-medium text-blue-600 mb-1">Current Workload</div>
                  <div className="text-3xl font-bold text-blue-900">
                    {selectedCoordinator.current_workload || 0}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">orphans assigned</div>
                </div>

                <div className="bg-ink-50 rounded-xl p-4 border border-purple-200">
                  <div className="text-sm font-medium text-purple-600 mb-1">Max Capacity</div>
                  <div className="text-3xl font-bold text-purple-900">
                    {selectedCoordinator.max_orphan_capacity || 50}
                  </div>
                  <div className="text-xs text-purple-600 mt-1">maximum capacity</div>
                </div>

                <div className="bg-ink-50 rounded-xl p-4 border border-green-200">
                  <div className="text-sm font-medium text-green-600 mb-1">Available</div>
                  <div className="text-3xl font-bold text-green-900">
                    {(selectedCoordinator.max_orphan_capacity || 50) - (selectedCoordinator.current_workload || 0)}
                  </div>
                  <div className="text-xs text-green-600 mt-1">slots remaining</div>
                </div>
              </div>

              {/* Utilization Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-ink-700">Capacity Utilization</span>
                  <span className="text-lg font-bold text-ink-900">
                    {(((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-ink-200 rounded-full h-4 overflow-hidden shadow-inner">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                        ? 'bg-navy-900'
                        : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                        ? 'bg-navy-9000'
                        : 'bg-navy-900'
                    }`}
                    style={{
                      width: `${Math.min(((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>

              {/* Status Card */}
              <div className={`rounded-xl p-5 border-2 ${
                ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                  ? 'bg-green-50 border-green-300'
                  : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                  ? 'bg-yellow-50 border-yellow-300'
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                      ? 'bg-green-200 text-green-700'
                      : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                      ? 'bg-yellow-200 text-yellow-700'
                      : 'bg-red-200 text-red-700'
                  }`}>
                    {((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60 ? (
                      <CheckCircle size={24} />
                    ) : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80 ? (
                      <AlertCircle size={24} />
                    ) : (
                      <AlertTriangle size={24} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-bold text-lg ${
                      ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                        ? 'text-green-900'
                        : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                        ? 'text-yellow-900'
                        : 'text-red-900'
                    }`}>
                      {((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                        ? 'Optimal Workload'
                        : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                        ? 'Moderate Workload'
                        : 'High Workload - At Risk'}
                    </h3>
                    <p className={`text-sm mt-1 ${
                      ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                        ? 'text-green-700'
                        : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                        ? 'text-yellow-700'
                        : 'text-red-700'
                    }`}>
                      {((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60
                        ? 'This coordinator has healthy capacity and can take on more orphans. Consider assigning new cases to maintain balanced distribution.'
                        : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80
                        ? 'Workload is approaching capacity. Monitor performance closely and consider redistribution if quality of care decreases.'
                        : 'Urgent: Coordinator is at or near maximum capacity. Immediate action recommended - redistribute orphans or reduce assignments to prevent burnout.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-ink-50 rounded-xl p-5 border border-ink-100">
                <h3 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  Recommendations
                </h3>
                <ul className="space-y-2 text-sm text-ink-700">
                  {((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 60 ? (
                    <>
                      <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Can safely accept {(selectedCoordinator.max_orphan_capacity || 50) - (selectedCoordinator.current_workload || 0)} more orphan assignments</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Maintain regular monitoring schedule for all assigned orphans</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Good candidate for training new coordinators or mentoring</span>
                      </li>
                    </>
                  ) : ((selectedCoordinator.current_workload || 0) / (selectedCoordinator.max_orphan_capacity || 50)) * 100 < 80 ? (
                    <>
                      <li className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>Limit new assignments to {Math.max(0, Math.floor((selectedCoordinator.max_orphan_capacity || 50) * 0.8) - (selectedCoordinator.current_workload || 0))} additional orphans</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>Review visit schedules to ensure all orphans receive adequate attention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle size={16} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>Consider providing additional administrative support</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Critical:</strong> Do not assign additional orphans until workload is reduced</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Redistribute {Math.ceil((selectedCoordinator.current_workload || 0) - (selectedCoordinator.max_orphan_capacity || 50) * 0.7)} orphans to other coordinators</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Schedule meeting to discuss workload management and support needs</span>
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-4 border-t border-ink-100">
                <button
                  onClick={() => setShowWorkloadModal(false)}
                  className="px-6 py-2.5 bg-navy-900 text-white rounded-lg transition-all font-semibold shadow-card hover:shadow-lift active:scale-95"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OrphanProfile Modal */}
      {selectedOrphanForProfile && (
        <OrphanProfile
          orphan={selectedOrphanForProfile}
          onClose={() => setSelectedOrphanForProfile(null)}
        />
      )}

      {/* VisitForm Modal */}
      {showVisitForm && visitOrphan && (
        <VisitForm
          orphan={visitOrphan}
          onSubmit={handleVisitSubmit}
          onClose={() => {
            setShowVisitForm(false);
            setVisitOrphan(null);
          }}
        />
      )}
    </div>
  );
};

export default CoordinatorDetailsPage;
