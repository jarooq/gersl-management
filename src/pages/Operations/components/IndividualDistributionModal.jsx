// ============================================
// INDIVIDUAL DISTRIBUTION TRACKING MODAL
// ============================================
// Component for tracking individual beneficiary receipts, attendance, and status
// Used for "Individual Distribution" task types

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  User,
  CheckCircle,
  XCircle,
  Calendar,
  Phone,
  MapPin,
  Filter,
  Download,
  FileText,
  AlertCircle,
  Clock,
  Package,
  UserCheck,
  UserX,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  getTaskBeneficiaries,
  updateSelectionStatus,
  markAsReceived,
  markAttendance,
  removeBeneficiaryFromTask
} from '../../../services/taskBeneficiaryService';

/**
 * Individual Distribution Modal Component
 *
 * Features:
 * - View all beneficiaries assigned to task
 * - Track receipt status (Received/Not Received)
 * - Mark attendance (Present/Absent)
 * - Update selection status workflow
 * - Record signatures/acknowledgments
 * - Filter and search beneficiaries
 * - Bulk actions
 * - Export distribution report
 */
const IndividualDistributionModal = ({ isOpen, onClose, task, onUpdate }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    selectionStatus: '',
    received: '',
    attended: ''
  });

  // Action state
  const [actionLoading, setActionLoading] = useState({});

  // Modal states
  const [showReceiveModal, setShowReceiveModal] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(null);
  const [showRemoveModal, setShowRemoveModal] = useState(null);

  // Form data for modals
  const [receiveFormData, setReceiveFormData] = useState({
    receivedDate: new Date().toISOString().split('T')[0],
    signatureUrl: '',
    receivedNotes: ''
  });

  const [attendanceFormData, setAttendanceFormData] = useState({
    attended: true,
    attendanceDate: new Date().toISOString().split('T')[0],
    attendanceNotes: ''
  });

  const [statusFormData, setStatusFormData] = useState({
    selectionStatus: '',
    selectionNotes: ''
  });

  // ============================================
  // LOAD BENEFICIARIES
  // ============================================
  const loadBeneficiaries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTaskBeneficiaries(task.id);
      if (response.success && response.data) {
        setBeneficiaries(response.data);
      }
    } catch (err) {
      console.error('Error loading beneficiaries:', err);
      setError(err.message || 'Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (isOpen && task?.id) {
      loadBeneficiaries();
    }
  }, [isOpen, task?.id, loadBeneficiaries]);

  // ============================================
  // FILTERING & SEARCH
  // ============================================
  const filteredBeneficiaries = beneficiaries.filter(tb => {
    const beneficiary = tb.Beneficiary || {};

    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      beneficiary.full_name?.toLowerCase().includes(searchLower) ||
      beneficiary.nic?.toLowerCase().includes(searchLower) ||
      beneficiary.primary_phone?.includes(searchTerm);

    // Status filter
    const matchesStatus = !filters.selectionStatus ||
      tb.selectionStatus === filters.selectionStatus;

    // Received filter
    const matchesReceived = !filters.received ||
      (filters.received === 'yes' && tb.received) ||
      (filters.received === 'no' && !tb.received);

    // Attendance filter
    const matchesAttended = !filters.attended ||
      (filters.attended === 'yes' && tb.attended) ||
      (filters.attended === 'no' && !tb.attended);

    return matchesSearch && matchesStatus && matchesReceived && matchesAttended;
  });

  // ============================================
  // STATISTICS
  // ============================================
  const stats = {
    total: beneficiaries.length,
    received: beneficiaries.filter(tb => tb.received).length,
    notReceived: beneficiaries.filter(tb => !tb.received).length,
    attended: beneficiaries.filter(tb => tb.attended).length,
    absent: beneficiaries.filter(tb => tb.attended === false).length,
    nominated: beneficiaries.filter(tb => tb.selectionStatus === 'Nominated').length,
    screened: beneficiaries.filter(tb => tb.selectionStatus === 'Screened').length,
    verified: beneficiaries.filter(tb => tb.selectionStatus === 'Verified').length,
    approved: beneficiaries.filter(tb => tb.selectionStatus === 'Approved').length,
    rejected: beneficiaries.filter(tb => tb.selectionStatus === 'Rejected').length
  };

  // ============================================
  // MARK AS RECEIVED
  // ============================================
  const handleReceiveSubmit = async () => {
    if (!showReceiveModal) return;

    setActionLoading(prev => ({ ...prev, [`receive_${showReceiveModal.id}`]: true }));
    setError(null);

    try {
      const response = await markAsReceived(showReceiveModal.id, {
        received: true,
        receivedDate: receiveFormData.receivedDate,
        signatureUrl: receiveFormData.signatureUrl || null,
        receivedNotes: receiveFormData.receivedNotes || null
      });

      if (response.success) {
        await loadBeneficiaries();
        setShowReceiveModal(null);
        setReceiveFormData({
          receivedDate: new Date().toISOString().split('T')[0],
          signatureUrl: '',
          receivedNotes: ''
        });
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error marking as received:', err);
      setError(err.message || 'Failed to mark as received');
    } finally {
      setActionLoading(prev => ({ ...prev, [`receive_${showReceiveModal.id}`]: false }));
    }
  };

  // ============================================
  // MARK ATTENDANCE
  // ============================================
  const handleAttendanceSubmit = async () => {
    if (!showAttendanceModal) return;

    setActionLoading(prev => ({ ...prev, [`attend_${showAttendanceModal.id}`]: true }));
    setError(null);

    try {
      const response = await markAttendance(showAttendanceModal.id, {
        attended: attendanceFormData.attended,
        attendanceDate: attendanceFormData.attendanceDate,
        attendanceNotes: attendanceFormData.attendanceNotes || null
      });

      if (response.success) {
        await loadBeneficiaries();
        setShowAttendanceModal(null);
        setAttendanceFormData({
          attended: true,
          attendanceDate: new Date().toISOString().split('T')[0],
          attendanceNotes: ''
        });
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error marking attendance:', err);
      setError(err.message || 'Failed to mark attendance');
    } finally {
      setActionLoading(prev => ({ ...prev, [`attend_${showAttendanceModal.id}`]: false }));
    }
  };

  // ============================================
  // UPDATE SELECTION STATUS
  // ============================================
  const handleStatusSubmit = async () => {
    if (!showStatusModal) return;

    setActionLoading(prev => ({ ...prev, [`status_${showStatusModal.id}`]: true }));
    setError(null);

    try {
      const response = await updateSelectionStatus(
        showStatusModal.id,
        statusFormData.selectionStatus,
        statusFormData.selectionNotes || null
      );

      if (response.success) {
        await loadBeneficiaries();
        setShowStatusModal(null);
        setStatusFormData({
          selectionStatus: '',
          selectionNotes: ''
        });
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setActionLoading(prev => ({ ...prev, [`status_${showStatusModal.id}`]: false }));
    }
  };

  // ============================================
  // REMOVE BENEFICIARY
  // ============================================
  const handleRemove = async () => {
    if (!showRemoveModal) return;

    setActionLoading(prev => ({ ...prev, [`remove_${showRemoveModal.id}`]: true }));
    setError(null);

    try {
      const response = await removeBeneficiaryFromTask(showRemoveModal.id);

      if (response.success) {
        await loadBeneficiaries();
        setShowRemoveModal(null);
        onUpdate?.();
      }
    } catch (err) {
      console.error('Error removing beneficiary:', err);
      setError(err.message || 'Failed to remove beneficiary');
    } finally {
      setActionLoading(prev => ({ ...prev, [`remove_${showRemoveModal.id}`]: false }));
    }
  };

  // ============================================
  // TOGGLE EXPAND ROW
  // ============================================
  const toggleExpandRow = (id) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ============================================
  // EXPORT REPORT
  // ============================================
  const handleExport = () => {
    // CSV export
    const headers = ['Name', 'NIC', 'Phone', 'Selection Status', 'Received', 'Received Date', 'Attended', 'Attendance Date'];
    const rows = filteredBeneficiaries.map(tb => {
      const b = tb.Beneficiary || {};
      return [
        b.full_name || '',
        b.nic || '',
        b.primary_phone || '',
        tb.selectionStatus || '',
        tb.received ? 'Yes' : 'No',
        tb.receivedDate || '',
        tb.attended === true ? 'Yes' : tb.attended === false ? 'No' : '',
        tb.attendanceDate || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribution_${task?.title || 'report'}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================================
  // STATUS BADGE
  // ============================================
  const getStatusBadge = (status) => {
    const badges = {
      'Nominated': 'bg-blue-100 text-blue-800',
      'Screened': 'bg-yellow-100 text-yellow-800',
      'Verified': 'bg-purple-100 text-purple-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || 'bg-ink-100 text-ink-800'}`}>
        {status}
      </span>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-ink-900">Individual Distribution Tracking</h2>
            <p className="text-sm text-ink-600 mt-1">{task?.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-400 hover:text-ink-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="px-6 py-4 bg-ink-50 border-b border-ink-100">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white p-3 rounded-lg border border-ink-100">
              <div className="text-h1 text-ink-900">{stats.total}</div>
              <div className="text-xs text-ink-600">Total</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{stats.received}</div>
              <div className="text-xs text-ink-600">Received</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{stats.notReceived}</div>
              <div className="text-xs text-ink-600">Not Received</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{stats.attended}</div>
              <div className="text-xs text-ink-600">Attended</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">{stats.approved}</div>
              <div className="text-xs text-ink-600">Approved</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <div className="text-xs text-ink-600">Rejected</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="px-6 py-4 bg-white border-b border-ink-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
              <input
                type="text"
                placeholder="Search name, NIC, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Selection Status Filter */}
            <select
              value={filters.selectionStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, selectionStatus: e.target.value }))}
              className="border border-ink-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Nominated">Nominated</option>
              <option value="Screened">Screened</option>
              <option value="Verified">Verified</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Received Filter */}
            <select
              value={filters.received}
              onChange={(e) => setFilters(prev => ({ ...prev, received: e.target.value }))}
              className="border border-ink-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Receipt Status</option>
              <option value="yes">Received</option>
              <option value="no">Not Received</option>
            </select>

            {/* Attendance Filter */}
            <select
              value={filters.attended}
              onChange={(e) => setFilters(prev => ({ ...prev, attended: e.target.value }))}
              className="border border-ink-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="">All Attendance</option>
              <option value="yes">Attended</option>
              <option value="no">Absent</option>
            </select>
          </div>

          {/* Export Button */}
          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-ink-600">
              Showing {filteredBeneficiaries.length} of {beneficiaries.length} beneficiaries
            </p>
            <button
              onClick={handleExport}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Beneficiaries Table */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-ink-600">Loading beneficiaries...</span>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-ink-400 mx-auto mb-4" />
              <p className="text-ink-600">No beneficiaries found</p>
              <p className="text-sm text-ink-500 mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBeneficiaries.map((taskBeneficiary) => {
                const beneficiary = taskBeneficiary.Beneficiary || {};
                const isExpanded = expandedRows.has(taskBeneficiary.id);

                return (
                  <div key={taskBeneficiary.id} className="border border-ink-100 rounded-lg overflow-hidden">
                    {/* Main Row */}
                    <div className="bg-white p-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Expand Button */}
                        <div className="col-span-1">
                          <button
                            onClick={() => toggleExpandRow(taskBeneficiary.id)}
                            className="text-ink-400 hover:text-ink-600"
                          >
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </button>
                        </div>

                        {/* Name & NIC */}
                        <div className="col-span-3">
                          <div className="font-medium text-ink-900">{beneficiary.full_name}</div>
                          <div className="text-sm text-ink-500">{beneficiary.nic}</div>
                        </div>

                        {/* Contact */}
                        <div className="col-span-2">
                          <div className="flex items-center text-sm text-ink-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {beneficiary.primary_phone || 'N/A'}
                          </div>
                        </div>

                        {/* Selection Status */}
                        <div className="col-span-2">
                          {getStatusBadge(taskBeneficiary.selectionStatus)}
                        </div>

                        {/* Received Status */}
                        <div className="col-span-2">
                          {taskBeneficiary.received ? (
                            <div className="flex items-center text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Received
                            </div>
                          ) : (
                            <div className="flex items-center text-orange-600 text-sm">
                              <Clock className="h-4 w-4 mr-1" />
                              Pending
                            </div>
                          )}
                        </div>

                        {/* Attendance Status */}
                        <div className="col-span-2">
                          {taskBeneficiary.attended === true ? (
                            <div className="flex items-center text-blue-600 text-sm">
                              <UserCheck className="h-4 w-4 mr-1" />
                              Present
                            </div>
                          ) : taskBeneficiary.attended === false ? (
                            <div className="flex items-center text-red-600 text-sm">
                              <UserX className="h-4 w-4 mr-1" />
                              Absent
                            </div>
                          ) : (
                            <div className="text-ink-400 text-sm">Not marked</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-ink-50 border-t border-ink-100 p-4">
                        <div className="grid grid-cols-2 gap-6 mb-4">
                          {/* Beneficiary Details */}
                          <div>
                            <h4 className="font-medium text-ink-900 mb-2">Beneficiary Details</h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center text-ink-600">
                                <MapPin className="h-3 w-3 mr-2" />
                                {beneficiary.district}, {beneficiary.province}
                              </div>
                              <div className="text-ink-600">
                                Gender: {beneficiary.gender}, Age: {beneficiary.age || 'N/A'}
                              </div>
                              <div className="text-ink-600">
                                Type: {beneficiary.beneficiary_type}
                              </div>
                            </div>
                          </div>

                          {/* Distribution Details */}
                          <div>
                            <h4 className="font-medium text-ink-900 mb-2">Distribution Details</h4>
                            <div className="space-y-1 text-sm">
                              {taskBeneficiary.receivedDate && (
                                <div className="flex items-center text-ink-600">
                                  <Calendar className="h-3 w-3 mr-2" />
                                  Received: {new Date(taskBeneficiary.receivedDate).toLocaleDateString()}
                                </div>
                              )}
                              {taskBeneficiary.attendanceDate && (
                                <div className="flex items-center text-ink-600">
                                  <Calendar className="h-3 w-3 mr-2" />
                                  Attended: {new Date(taskBeneficiary.attendanceDate).toLocaleDateString()}
                                </div>
                              )}
                              {taskBeneficiary.selectionNotes && (
                                <div className="text-ink-600">
                                  Notes: {taskBeneficiary.selectionNotes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          {/* Mark as Received */}
                          {!taskBeneficiary.received && (
                            <button
                              onClick={() => setShowReceiveModal(taskBeneficiary)}
                              className="flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Mark Received
                            </button>
                          )}

                          {/* Mark Attendance */}
                          {taskBeneficiary.attended === null && (
                            <button
                              onClick={() => setShowAttendanceModal(taskBeneficiary)}
                              className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Mark Attendance
                            </button>
                          )}

                          {/* Update Status */}
                          <button
                            onClick={() => {
                              setStatusFormData({ selectionStatus: taskBeneficiary.selectionStatus, selectionNotes: '' });
                              setShowStatusModal(taskBeneficiary);
                            }}
                            className="flex items-center px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Update Status
                          </button>

                          {/* Remove */}
                          <button
                            onClick={() => setShowRemoveModal(taskBeneficiary)}
                            className="flex items-center px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-ink-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* RECEIVE MODAL */}
      {/* ============================================ */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lift w-full max-w-md">
            <div className="px-6 py-4 border-b border-ink-100">
              <h3 className="text-lg font-semibold text-ink-900">Mark as Received</h3>
              <p className="text-sm text-ink-600 mt-1">{showReceiveModal.Beneficiary?.full_name}</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Received Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={receiveFormData.receivedDate}
                  onChange={(e) => setReceiveFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Signature/Acknowledgment URL
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={receiveFormData.signatureUrl}
                  onChange={(e) => setReceiveFormData(prev => ({ ...prev, signatureUrl: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional notes..."
                  value={receiveFormData.receivedNotes}
                  onChange={(e) => setReceiveFormData(prev => ({ ...prev, receivedNotes: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowReceiveModal(null)}
                className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReceiveSubmit}
                disabled={actionLoading[`receive_${showReceiveModal.id}`]}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[`receive_${showReceiveModal.id}`] ? 'Saving...' : 'Mark Received'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ATTENDANCE MODAL */}
      {/* ============================================ */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lift w-full max-w-md">
            <div className="px-6 py-4 border-b border-ink-100">
              <h3 className="text-lg font-semibold text-ink-900">Mark Attendance</h3>
              <p className="text-sm text-ink-600 mt-1">{showAttendanceModal.Beneficiary?.full_name}</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Attendance Status <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={attendanceFormData.attended === true}
                      onChange={() => setAttendanceFormData(prev => ({ ...prev, attended: true }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Present</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={attendanceFormData.attended === false}
                      onChange={() => setAttendanceFormData(prev => ({ ...prev, attended: false }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Absent</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Attendance Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={attendanceFormData.attendanceDate}
                  onChange={(e) => setAttendanceFormData(prev => ({ ...prev, attendanceDate: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any additional notes..."
                  value={attendanceFormData.attendanceNotes}
                  onChange={(e) => setAttendanceFormData(prev => ({ ...prev, attendanceNotes: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowAttendanceModal(null)}
                className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAttendanceSubmit}
                disabled={actionLoading[`attend_${showAttendanceModal.id}`]}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[`attend_${showAttendanceModal.id}`] ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* STATUS MODAL */}
      {/* ============================================ */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lift w-full max-w-md">
            <div className="px-6 py-4 border-b border-ink-100">
              <h3 className="text-lg font-semibold text-ink-900">Update Selection Status</h3>
              <p className="text-sm text-ink-600 mt-1">{showStatusModal.Beneficiary?.full_name}</p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Selection Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={statusFormData.selectionStatus}
                  onChange={(e) => setStatusFormData(prev => ({ ...prev, selectionStatus: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select status...</option>
                  <option value="Nominated">Nominated</option>
                  <option value="Screened">Screened</option>
                  <option value="Verified">Verified</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Reason for status change..."
                  value={statusFormData.selectionNotes}
                  onChange={(e) => setStatusFormData(prev => ({ ...prev, selectionNotes: e.target.value }))}
                  className="w-full border border-ink-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-ink-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowStatusModal(null)}
                className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusSubmit}
                disabled={!statusFormData.selectionStatus || actionLoading[`status_${showStatusModal.id}`]}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[`status_${showStatusModal.id}`] ? 'Saving...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* REMOVE CONFIRMATION MODAL */}
      {/* ============================================ */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lift w-full max-w-md">
            <div className="px-6 py-4 border-b border-ink-100">
              <h3 className="text-lg font-semibold text-ink-900">Remove Beneficiary</h3>
            </div>

            <div className="px-6 py-4">
              <p className="text-ink-600">
                Are you sure you want to remove <strong>{showRemoveModal.Beneficiary?.full_name}</strong> from this task?
              </p>
              <p className="text-sm text-red-600 mt-2">
                This action cannot be undone.
              </p>
            </div>

            <div className="px-6 py-4 border-t border-ink-100 flex justify-end space-x-3">
              <button
                onClick={() => setShowRemoveModal(null)}
                className="px-4 py-2 border border-ink-200 rounded-lg text-ink-700 hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRemove}
                disabled={actionLoading[`remove_${showRemoveModal.id}`]}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading[`remove_${showRemoveModal.id}`] ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndividualDistributionModal;
