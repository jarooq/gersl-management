import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ApprovalAPI } from '../../services/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  FolderOpen,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Send,
  Eye,
  Filter,
  User,
  Calendar
} from 'lucide-react';

const ApprovalsPage = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ApprovalAPI.getAll({ status: activeTab });
      setApprovals(data.approvals || data || []);
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApprovalAction = async (approvalId, action, comment) => {
    setIsSubmitting(true);
    try {
      await ApprovalAPI.approve(approvalId, action, comment);
      setShowDetailModal(false);
      setSelectedApproval(null);
      setComment('');
      fetchApprovals();
    } catch (error) {
      console.error('Error processing approval:', error);
      alert(error.message || 'Failed to process approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'proposal': return FileText;
      case 'project': return FolderOpen;
      case 'finance': return DollarSign;
      default: return FileText;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'proposal': return 'text-purple-600 bg-purple-50';
      case 'project': return 'text-blue-600 bg-blue-50';
      case 'finance': return 'text-green-600 bg-green-50';
      default: return 'text-ink-600 bg-ink-50';
    }
  };

  const getStageColor = (stage) => {
    switch (stage) {
      case 'CEO Initial Review': return 'bg-purple-100 text-purple-700';
      case 'Programme Manager Review': return 'bg-blue-100 text-blue-700';
      case 'Finance Review': return 'bg-green-100 text-green-700';
      case 'CEO Final Approval': return 'bg-indigo-100 text-indigo-700';
      default: return 'bg-ink-100 text-ink-700';
    }
  };

  const canUserApprove = (approval) => {
    const role = currentUser.role;
    const stage = approval.currentStage;

    if (role === 'Admin') return true;

    const stageRoleMap = {
      'CEO Initial Review': ['CEO'],
      'Programme Manager Review': ['Programme Manager'],
      'Finance Review': ['Finance Manager', 'Finance Officer'],
      'CEO Final Approval': ['CEO']
    };

    return stageRoleMap[stage]?.includes(role);
  };

  const filteredApprovals = approvals.filter(approval => {
    if (filterType === 'All') return true;
    return approval.itemType === filterType.toLowerCase();
  });

  const stats = {
    pending: approvals.filter(a => a.status === 'pending').length,
    approved: approvals.filter(a => a.status === 'approved').length,
    rejected: approvals.filter(a => a.status === 'rejected').length,
    myPending: approvals.filter(a => a.status === 'pending' && canUserApprove(a)).length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-md flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Operations · Approvals</p>
            <h1 className="text-h2 font-bold leading-tight">Approval Centre</h1>
            <p className="text-ink-200 text-sm mt-0.5">{stats.myPending} items awaiting your approval · {stats.pending} total pending</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon={Clock}       label="Pending Approvals"     value={stats.pending}   tone="warn"    trend="+12%" />
        <StatCard icon={CheckCircle} label="Approved This Month"   value={stats.approved}  tone="success" trend="+8%" />
        <StatCard icon={XCircle}     label="Rejected"              value={stats.rejected}  tone="danger"  trend="-3%" />
        <StatCard icon={User}        label="Awaiting Your Review"  value={stats.myPending} tone="brand"   trend="Action Required" />
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          {/* Tabs */}
          <div className="flex gap-2">
            {['pending', 'approved', 'rejected'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md font-semibold text-sm transition ${
                  activeTab === tab
                    ? 'bg-orange-500 text-white shadow-card'
                    : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-ink-600" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
            >
              <option value="All">All Types</option>
              <option value="Proposal">Proposals</option>
              <option value="Project">Projects</option>
              <option value="Finance">Finance</option>
            </select>
          </div>
        </div>

        {/* Approvals List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-ink-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-ink-600 text-sm">Loading approvals…</p>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-ink-400" />
            </div>
            <p className="text-ink-600 text-lg font-semibold">No {activeTab} approvals</p>
            <p className="text-ink-500 text-sm mt-1">Items will appear here when they require approval</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApprovals.map(approval => {
              const Icon = getTypeIcon(approval.itemType);
              const userCanApprove = canUserApprove(approval);

              return (
                <div
                  key={approval.id}
                  className={`border rounded-lg2 p-5 transition hover:shadow-card ${
                    userCanApprove && approval.status === 'pending'
                      ? 'border-mission-300 bg-mission-50/50'
                      : 'border-ink-100 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getTypeColor(approval.itemType)}`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-ink-900">{approval.itemTitle}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStageColor(approval.currentStage)}`}>
                            {approval.currentStage}
                          </span>
                          {userCanApprove && approval.status === 'pending' && (
                            <span className="px-2 py-1 bg-purple-500 text-white rounded-full text-xs font-bold">
                              YOUR TURN
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2 text-ink-600">
                            <FileText size={14} />
                            <span className="font-semibold">{approval.itemCode}</span>
                          </div>
                          <div className="flex items-center gap-2 text-ink-600">
                            <User size={14} />
                            <span>Submitted by {approval.submittedBy}</span>
                          </div>
                          <div className="flex items-center gap-2 text-ink-600">
                            <Calendar size={14} />
                            <span>{new Date(approval.submittedDate).toLocaleDateString()}</span>
                          </div>
                          {approval.itemType === 'finance' || approval.itemType === 'proposal' ? (
                            <div className="flex items-center gap-2 text-ink-600">
                              <DollarSign size={14} />
                              <span className="font-semibold">
                                LKR {parseFloat(approval.amount || 0).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-ink-600">
                              <TrendingUp size={14} />
                              <span>{approval.priority || 'Medium'} Priority</span>
                            </div>
                          )}
                        </div>

                        {/* Approval History */}
                        {approval.approvalHistory && approval.approvalHistory.length > 0 && (
                          <div className="bg-ink-50 rounded-lg p-3 mb-3">
                            <p className="text-xs font-semibold text-ink-700 mb-2">Approval Trail:</p>
                            <div className="space-y-1">
                              {approval.approvalHistory.map((history, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs text-ink-600">
                                  {history.action === 'approved' ? (
                                    <CheckCircle size={12} className="text-green-600" />
                                  ) : (
                                    <XCircle size={12} className="text-red-600" />
                                  )}
                                  <span className="font-semibold">{history.reviewerRole}</span>
                                  <span>{history.action}</span>
                                  <span className="text-ink-400">• {new Date(history.date).toLocaleDateString()}</span>
                                  {history.comment && (
                                    <span className="italic">"{history.comment}"</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          setSelectedApproval(approval);
                          setShowDetailModal(true);
                        }}
                        className="px-3.5 py-2 bg-ink-100 text-ink-700 rounded-md hover:bg-ink-200 transition text-sm font-semibold inline-flex items-center gap-2"
                      >
                        <Eye size={16} />
                        View
                      </button>
                      {userCanApprove && approval.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setShowDetailModal(true);
                            }}
                            className="px-3.5 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition text-sm font-semibold inline-flex items-center gap-2"
                          >
                            <ThumbsUp size={16} />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApproval(approval);
                              setShowDetailModal(true);
                            }}
                            className="px-3.5 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition text-sm font-semibold inline-flex items-center gap-2"
                          >
                            <ThumbsDown size={16} />
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          canApprove={canUserApprove(selectedApproval)}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedApproval(null);
            setComment('');
          }}
          onApprove={(comment) => handleApprovalAction(selectedApproval.id, 'approve', comment)}
          onReject={(comment) => handleApprovalAction(selectedApproval.id, 'reject', comment)}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, tone = 'brand', trend }) => {
  const tones = {
    warn:    { bg: 'bg-mission-50', border: 'border-mission-200', text: 'text-mission-700' },
    success: { bg: 'bg-success-50', border: 'border-success-600/20', text: 'text-success-700' },
    danger:  { bg: 'bg-danger-50',  border: 'border-danger-600/20',  text: 'text-danger-700' },
    brand:   { bg: 'bg-navy-50',    border: 'border-navy-200',       text: 'text-navy-800' },
  }[tone];
  const trendCls =
    trend.startsWith('+') ? 'bg-success-50 text-success-700' :
    trend.startsWith('-') ? 'bg-danger-50 text-danger-700' :
                            'bg-mission-50 text-mission-700';
  return (
    <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 ${tones.bg} ${tones.border} border rounded-md flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${tones.text}`} />
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${trendCls}`}>{trend}</span>
      </div>
      <p className="text-h1 text-ink-900 mb-0.5">{value}</p>
      <p className="text-xs text-ink-600 font-medium">{label}</p>
    </div>
  );
};

// Approval Detail Modal Component
const ApprovalDetailModal = ({ approval, canApprove, onClose, onApprove, onReject, isSubmitting }) => {
  const [comment, setComment] = useState('');
  const [action, setAction] = useState(null);

  const handleSubmit = () => {
    if (action === 'approve') {
      onApprove(comment);
    } else if (action === 'reject') {
      if (!comment.trim()) {
        alert('Please provide a reason for rejection');
        return;
      }
      onReject(comment);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Approval Details</h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition"
            >
              <XCircle size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Item Information */}
          <div className="bg-ink-50 rounded-xl p-5">
            <h3 className="text-xl font-bold text-ink-900 mb-4">{approval.itemTitle}</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-600 font-semibold mb-1">Type</p>
                <p className="text-ink-900 capitalize">{approval.itemType}</p>
              </div>
              <div>
                <p className="text-ink-600 font-semibold mb-1">Code</p>
                <p className="text-ink-900">{approval.itemCode}</p>
              </div>
              <div>
                <p className="text-ink-600 font-semibold mb-1">Current Stage</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border bg-navy-50 text-navy-800 border-navy-200">
                  {approval.currentStage}
                </span>
              </div>
              <div>
                <p className="text-ink-600 font-semibold mb-1">Submitted By</p>
                <p className="text-ink-900">{approval.submittedBy}</p>
              </div>
              <div>
                <p className="text-ink-600 font-semibold mb-1">Submission Date</p>
                <p className="text-ink-900">{new Date(approval.submittedDate).toLocaleString()}</p>
              </div>
              {(approval.itemType === 'finance' || approval.itemType === 'proposal') && (
                <div>
                  <p className="text-ink-600 font-semibold mb-1">Amount</p>
                  <p className="text-ink-900 font-bold">
                    LKR {parseFloat(approval.amount || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description/Summary */}
          {approval.description && (
            <div>
              <h4 className="text-lg font-bold text-ink-900 mb-2">Description</h4>
              <p className="text-ink-700 bg-white rounded-lg p-4 border border-ink-100">
                {approval.description}
              </p>
            </div>
          )}

          {/* Approval History */}
          {approval.approvalHistory && approval.approvalHistory.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-ink-900 mb-3">Approval Trail</h4>
              <div className="space-y-3">
                {approval.approvalHistory.map((history, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white rounded-lg p-4 border border-ink-100">
                    {history.action === 'approved' ? (
                      <CheckCircle size={20} className="text-green-600 mt-0.5" />
                    ) : (
                      <XCircle size={20} className="text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-ink-900">{history.reviewerRole}</span>
                        <span className="text-ink-600">{history.action}</span>
                        <span className="text-ink-400 text-sm">
                          • {new Date(history.date).toLocaleString()}
                        </span>
                      </div>
                      {history.comment && (
                        <p className="text-ink-700 italic text-sm">"{history.comment}"</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comment Section */}
          {canApprove && approval.status === 'pending' && (
            <div>
              <h4 className="text-lg font-bold text-ink-900 mb-2">Your Review</h4>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add your comments or feedback (required for rejection)..."
                rows="4"
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-ink-50 px-6 py-4 rounded-b-2xl border-t border-ink-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition font-semibold"
              disabled={isSubmitting}
            >
              Close
            </button>
            {canApprove && approval.status === 'pending' && (
              <>
                <button
                  onClick={() => {
                    setAction('reject');
                    handleSubmit();
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting && action === 'reject' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Rejecting...
                    </>
                  ) : (
                    <>
                      <ThumbsDown size={18} />
                      Reject
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setAction('approve');
                    handleSubmit();
                  }}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting && action === 'approve' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Approving...
                    </>
                  ) : (
                    <>
                      <ThumbsUp size={18} />
                      Approve
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;
