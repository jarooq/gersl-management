// ============================================
// BUDGET REQUEST WORKFLOW MODAL
// ============================================
// Component for managing procurement budget requests and approvals
// Used for tasks with requiresProcurement = true

import React, { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Calendar,
  User,
  Send,
  ThumbsUp,
  ThumbsDown,
  Eye,
  TrendingUp,
  Package
} from 'lucide-react';
import {
  requestBudget,
  approveBudget,
  rejectBudget
} from '../../../services/taskService';

/**
 * Budget Workflow Modal Component
 *
 * Features:
 * - Submit budget request
 * - View budget request details
 * - Approve/reject budget requests
 * - Track budget workflow status
 * - View approval history
 */
const BudgetWorkflowModal = ({ isOpen, onClose, task, onUpdate, userRole = 'staff' }) => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'request', 'approve'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Request form state
  const [requestFormData, setRequestFormData] = useState({
    budgetRequestedAmount: '',
    budgetRequestNotes: ''
  });

  // Approval form state
  const [approvalFormData, setApprovalFormData] = useState({
    budgetAllocated: '',
    budgetApprovalNotes: '',
    budgetApprovalId: ''
  });

  // Rejection form state
  const [rejectionFormData, setRejectionFormData] = useState({
    budgetApprovalNotes: ''
  });

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);

  // ============================================
  // INITIALIZE
  // ============================================
  useEffect(() => {
    if (isOpen && task) {
      // Reset state
      setError(null);
      setSuccess(null);

      // Set initial tab based on budget status
      if (!task.budgetRequestedAmount) {
        setActiveTab('request');
      } else if (task.budgetRequestStatus === 'Pending' && userRole === 'ceo') {
        setActiveTab('approve');
      } else {
        setActiveTab('overview');
      }

      // Pre-fill approval amount with requested amount
      if (task.budgetRequestedAmount && !approvalFormData.budgetAllocated) {
        setApprovalFormData(prev => ({
          ...prev,
          budgetAllocated: task.budgetRequestedAmount.toString()
        }));
      }
    }
  }, [isOpen, task, userRole]);

  // ============================================
  // SUBMIT BUDGET REQUEST
  // ============================================
  const handleSubmitRequest = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!requestFormData.budgetRequestedAmount || parseFloat(requestFormData.budgetRequestedAmount) <= 0) {
        setError('Please enter a valid budget amount');
        setLoading(false);
        return;
      }

      const response = await requestBudget(
        task.id,
        parseFloat(requestFormData.budgetRequestedAmount),
        requestFormData.budgetRequestNotes || null
      );

      if (response.success) {
        setSuccess('Budget request submitted successfully');
        setRequestFormData({
          budgetRequestedAmount: '',
          budgetRequestNotes: ''
        });
        onUpdate?.();

        // Switch to overview tab after successful submission
        setTimeout(() => {
          setActiveTab('overview');
          setSuccess(null);
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting budget request:', err);
      setError(err.message || 'Failed to submit budget request');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // APPROVE BUDGET REQUEST
  // ============================================
  const handleApproveBudget = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (!approvalFormData.budgetAllocated || parseFloat(approvalFormData.budgetAllocated) <= 0) {
        setError('Please enter a valid allocated amount');
        setLoading(false);
        return;
      }

      const response = await approveBudget(
        task.id,
        parseFloat(approvalFormData.budgetAllocated),
        approvalFormData.budgetApprovalNotes || null,
        approvalFormData.budgetApprovalId || null
      );

      if (response.success) {
        setSuccess('Budget approved successfully');
        setShowApprovalModal(false);
        onUpdate?.();

        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error approving budget:', err);
      setError(err.message || 'Failed to approve budget');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // REJECT BUDGET REQUEST
  // ============================================
  const handleRejectBudget = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await rejectBudget(
        task.id,
        rejectionFormData.budgetApprovalNotes || null
      );

      if (response.success) {
        setSuccess('Budget request rejected');
        setShowRejectionModal(false);
        onUpdate?.();

        setTimeout(() => {
          setSuccess(null);
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error rejecting budget:', err);
      setError(err.message || 'Failed to reject budget');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GET STATUS BADGE
  // ============================================
  const getStatusBadge = (status) => {
    const badges = {
      'Pending': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'Approved': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'Rejected': { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle }
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="h-4 w-4 mr-1" />
        {status || 'Not Requested'}
      </span>
    );
  };

  // ============================================
  // GET PROCUREMENT STATUS BADGE
  // ============================================
  const getProcurementStatusBadge = (status) => {
    const badges = {
      'Not Required': 'bg-gray-100 text-gray-800',
      'Budget Requested': 'bg-yellow-100 text-yellow-800',
      'Budget Approved': 'bg-green-100 text-green-800',
      'Budget Rejected': 'bg-red-100 text-red-800',
      'Procurement In Progress': 'bg-blue-100 text-blue-800',
      'Procurement Completed': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status || 'Not Required'}
      </span>
    );
  };

  // ============================================
  // FORMAT CURRENCY
  // ============================================
  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // ============================================
  // RENDER
  // ============================================
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white">Budget Request Workflow</h2>
              <p className="text-blue-100 text-sm mt-1">{task?.title}</p>
              <div className="flex items-center space-x-4 mt-2">
                {getStatusBadge(task?.budgetRequestStatus)}
                {getProcurementStatusBadge(task?.procurementStatus)}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-start">
            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Success</p>
              <p className="text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 border-b border-gray-200">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-600 border-t border-x border-gray-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Overview
            </button>

            {!task?.budgetRequestedAmount && (
              <button
                onClick={() => setActiveTab('request')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'request'
                    ? 'bg-white text-blue-600 border-t border-x border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Send className="h-4 w-4 inline mr-2" />
                Request Budget
              </button>
            )}

            {task?.budgetRequestStatus === 'Pending' && userRole === 'ceo' && (
              <button
                onClick={() => setActiveTab('approve')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'approve'
                    ? 'bg-white text-blue-600 border-t border-x border-gray-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ThumbsUp className="h-4 w-4 inline mr-2" />
                Approve/Reject
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ============================================ */}
          {/* OVERVIEW TAB */}
          {/* ============================================ */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Budget Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-blue-900">Requested Amount</h3>
                    <DollarSign className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatCurrency(task?.budgetRequestedAmount)}
                  </p>
                  {task?.budgetRequestedAt && (
                    <p className="text-xs text-blue-700 mt-1">
                      {new Date(task.budgetRequestedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-green-900">Allocated Amount</h3>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">
                    {formatCurrency(task?.budgetAllocated)}
                  </p>
                  {task?.budgetApprovedAt && (
                    <p className="text-xs text-green-700 mt-1">
                      {new Date(task.budgetApprovedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-purple-900">Spent Amount</h3>
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {formatCurrency(task?.budgetSpent || 0)}
                  </p>
                  <p className="text-xs text-purple-700 mt-1">
                    {task?.budgetAllocated
                      ? `${((task.budgetSpent || 0) / task.budgetAllocated * 100).toFixed(1)}% used`
                      : 'No budget allocated'}
                  </p>
                </div>
              </div>

              {/* Request Details */}
              {task?.budgetRequestedAmount && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-blue-600" />
                    Request Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Requested By
                      </label>
                      <div className="flex items-center text-gray-900">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {task.budgetRequestedBy ? `User #${task.budgetRequestedBy}` : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Requested Date
                      </label>
                      <div className="flex items-center text-gray-900">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        {task.budgetRequestedAt
                          ? new Date(task.budgetRequestedAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-600 mb-1">
                        Request Notes
                      </label>
                      <p className="text-gray-900 bg-gray-50 p-3 rounded border border-gray-200">
                        {task.budgetRequestNotes || 'No notes provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Details */}
              {task?.budgetRequestStatus === 'Approved' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Approval Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Approved By
                      </label>
                      <div className="flex items-center text-green-900">
                        <User className="h-4 w-4 mr-2 text-green-600" />
                        {task.budgetApprovedBy ? `User #${task.budgetApprovedBy}` : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Approved Date
                      </label>
                      <div className="flex items-center text-green-900">
                        <Calendar className="h-4 w-4 mr-2 text-green-600" />
                        {task.budgetApprovedAt
                          ? new Date(task.budgetApprovedAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>

                    {task.budgetApprovalId && (
                      <div>
                        <label className="block text-sm font-medium text-green-700 mb-1">
                          Approval ID
                        </label>
                        <p className="text-green-900 font-mono text-sm">
                          {task.budgetApprovalId}
                        </p>
                      </div>
                    )}

                    <div className={task.budgetApprovalId ? '' : 'col-span-2'}>
                      <label className="block text-sm font-medium text-green-700 mb-1">
                        Approval Notes
                      </label>
                      <p className="text-green-900 bg-green-100 p-3 rounded border border-green-200">
                        {task.budgetApprovalNotes || 'No notes provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Rejection Details */}
              {task?.budgetRequestStatus === 'Rejected' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                    <XCircle className="h-5 w-5 mr-2" />
                    Rejection Details
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Rejected By
                      </label>
                      <div className="flex items-center text-red-900">
                        <User className="h-4 w-4 mr-2 text-red-600" />
                        {task.budgetApprovedBy ? `User #${task.budgetApprovedBy}` : 'N/A'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Rejected Date
                      </label>
                      <div className="flex items-center text-red-900">
                        <Calendar className="h-4 w-4 mr-2 text-red-600" />
                        {task.budgetApprovedAt
                          ? new Date(task.budgetApprovedAt).toLocaleDateString()
                          : 'N/A'}
                      </div>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-red-700 mb-1">
                        Rejection Reason
                      </label>
                      <p className="text-red-900 bg-red-100 p-3 rounded border border-red-200">
                        {task.budgetApprovalNotes || 'No reason provided'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* No Request Yet */}
              {!task?.budgetRequestedAmount && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Request Yet</h3>
                  <p className="text-gray-600 mb-4">
                    This task requires procurement but no budget has been requested yet.
                  </p>
                  <button
                    onClick={() => setActiveTab('request')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Request Budget Now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================ */}
          {/* REQUEST BUDGET TAB */}
          {/* ============================================ */}
          {activeTab === 'request' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Submit Budget Request</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Enter the budget amount required for this procurement task. Your request will be sent to the CEO for approval.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Requested Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={requestFormData.budgetRequestedAmount}
                      onChange={(e) => setRequestFormData(prev => ({
                        ...prev,
                        budgetRequestedAmount: e.target.value
                      }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Request Notes
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide details about what this budget will be used for..."
                    value={requestFormData.budgetRequestNotes}
                    onChange={(e) => setRequestFormData(prev => ({
                      ...prev,
                      budgetRequestNotes: e.target.value
                    }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <button
                  onClick={handleSubmitRequest}
                  disabled={loading || !requestFormData.budgetRequestedAmount}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Submit Budget Request
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* APPROVE/REJECT TAB (CEO Only) */}
          {/* ============================================ */}
          {activeTab === 'approve' && task?.budgetRequestStatus === 'Pending' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Pending Approval</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Review the budget request details below and approve or reject accordingly.
                    </p>
                  </div>
                </div>
              </div>

              {/* Request Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Request Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(task.budgetRequestedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Requested Date:</span>
                    <span className="font-medium text-gray-900">
                      {task.budgetRequestedAt ? new Date(task.budgetRequestedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {task.budgetRequestNotes && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-gray-600">Notes:</span>
                      <p className="text-gray-900 mt-1 bg-gray-50 p-2 rounded">
                        {task.budgetRequestNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowApprovalModal(true)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <ThumbsUp className="h-5 w-5 mr-2" />
                  Approve Budget
                </button>
                <button
                  onClick={() => setShowRejectionModal(true)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <ThumbsDown className="h-5 w-5 mr-2" />
                  Reject Request
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* APPROVAL MODAL */}
      {/* ============================================ */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Approve Budget Request</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocated Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={approvalFormData.budgetAllocated}
                    onChange={(e) => setApprovalFormData(prev => ({
                      ...prev,
                      budgetAllocated: e.target.value
                    }))}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Requested: {formatCurrency(task?.budgetRequestedAmount)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., APV-2024-001"
                  value={approvalFormData.budgetApprovalId}
                  onChange={(e) => setApprovalFormData(prev => ({
                    ...prev,
                    budgetApprovalId: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Approval Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Any comments or conditions..."
                  value={approvalFormData.budgetApprovalNotes}
                  onChange={(e) => setApprovalFormData(prev => ({
                    ...prev,
                    budgetApprovalNotes: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowApprovalModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveBudget}
                disabled={loading || !approvalFormData.budgetAllocated}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve Budget'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* REJECTION MODAL */}
      {/* ============================================ */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Reject Budget Request</h3>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  Are you sure you want to reject this budget request?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain why this request is being rejected..."
                  value={rejectionFormData.budgetApprovalNotes}
                  onChange={(e) => setRejectionFormData(prev => ({
                    ...prev,
                    budgetApprovalNotes: e.target.value
                  }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectionModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectBudget}
                disabled={loading || !rejectionFormData.budgetApprovalNotes}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Rejecting...' : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetWorkflowModal;
