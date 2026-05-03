import React, { useState } from 'react';
import {
  X, Calendar, DollarSign, Users, Target, MapPin, Building2,
  CheckCircle, AlertCircle, BarChart3, Users2, Shield, FileText,
  TrendingUp, MessageSquare, ArrowRight, Loader, Send, Eye, ThumbsUp, ThumbsDown, XCircle,
  FileEdit, Mail, CheckCircle2, Rocket, Download
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import API from '../../../services/api';
import { convertProposalToProject } from '../../../services/proposalService';
import { generateProposalPDF } from '../../../utils/proposalPdfGenerator';
import EmailModal from '../../../components/proposals/EmailModal';
import DonorDecisionModal from '../../../components/proposals/DonorDecisionModal';

const ProposalViewModal = ({ proposal, onClose, onUpdate }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [converting, setConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const [conversionError, setConversionError] = useState('');
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState('');
  const [workflowSuccess, setWorkflowSuccess] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDonorDecisionModal, setShowDonorDecisionModal] = useState(false);
  const [donorDecision, setDonorDecision] = useState(null);
  const [workflowAction, setWorkflowAction] = useState(null);
  const [comments, setComments] = useState('');

  if (!proposal) return null;

  /**
   * Convert proposal to project using atomic conversion endpoint
   * This creates the project, links it to the proposal, generates MEAL indicators,
   * and optionally creates approval workflows and notifications
   */
  const handleConvertToProject = async () => {
    setConverting(true);
    setConversionError('');
    setConversionSuccess(false);

    try {
      // Use the atomic conversion endpoint
      // projectManagerId defaults to current user if not specified
      const conversionData = {
        projectManagerId: currentUser?.id,
        // Optional: Add approval chain if needed
        // approvalChain: [
        //   { userId: 5, role: 'Programme Manager', order: 0 },
        //   { userId: 1, role: 'CEO', order: 1 }
        // ]
      };

      const result = await convertProposalToProject(proposal.id, conversionData);

      if (result.success) {
        setConversionSuccess(true);
        console.log('✅ Proposal converted to project:', {
          project: result.data.project,
          indicatorsCreated: result.data.indicatorsCreated,
          approvalCreated: result.data.approvalCreated
        });

        // Notify parent component to refresh proposal list
        if (onUpdate) {
          onUpdate(result.data.proposal);
        }

        // Show success message for 2 seconds, then close modal
        setTimeout(() => {
          onClose();
          // Navigate to projects page to view the new project
          window.location.href = '/projects';
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to convert proposal to project');
      }
    } catch (error) {
      console.error('❌ Error converting proposal:', error);
      setConversionError(error.message || 'An error occurred during conversion');
    } finally {
      setConverting(false);
    }
  };

  /**
   * Handle workflow status change
   */
  const handleStatusChange = async (newStatus, requiresComment = false) => {
    if (requiresComment) {
      // Show comment modal for actions that need comments
      setWorkflowAction({ status: newStatus });
      setShowCommentModal(true);
      return;
    }

    // Direct status change without comment
    await executeStatusChange(newStatus, '');
  };

  /**
   * Execute status change with API call
   */
  const executeStatusChange = async (newStatus, comment) => {
    setWorkflowLoading(true);
    setWorkflowError('');
    setWorkflowSuccess('');

    try {
      const updatedProposal = await API.Proposal.updateStatus(proposal.id, newStatus, comment);
      setWorkflowSuccess(`Proposal status updated to "${newStatus}"`);

      // Notify parent component to refresh
      if (onUpdate) {
        onUpdate(updatedProposal);
      }

      // Close comment modal if open
      setShowCommentModal(false);
      setComments('');

      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setWorkflowSuccess('');
      }, 3000);
    } catch (error) {
      console.error('Error updating proposal status:', error);
      setWorkflowError(error.message || 'Failed to update proposal status');
    } finally {
      setWorkflowLoading(false);
    }
  };

  /**
   * Submit comment and execute workflow action
   */
  const handleCommentSubmit = () => {
    if (workflowAction) {
      executeStatusChange(workflowAction.status, comments);
    }
  };

  /**
   * Handle email send and update proposal status
   */
  const handleEmailSend = async (emailPayload) => {
    try {
      // In production, this would call an API endpoint to send the email
      // For now, we'll just update the proposal status to "Submitted to Donor"
      console.log('Email payload:', emailPayload);

      // Update proposal status
      await executeStatusChange('Submitted to Donor',
        `Email sent to ${emailPayload.to} with ${emailPayload.attachments.length} attachment(s)`
      );

      // Show success message
      setWorkflowSuccess('Email prepared and proposal marked as submitted to donor');

    } catch (error) {
      console.error('Error sending email:', error);
      setWorkflowError('Failed to send email. Please try again.');
      throw error;
    }
  };

  /**
   * Handle donor decision recording with evidence
   */
  const handleDonorDecisionSubmit = async (decisionData) => {
    try {
      console.log('Donor decision data:', decisionData);

      // Determine new status based on decision
      const newStatus = decisionData.decision === 'approved' ? 'Donor Approved' : 'Donor Rejected';

      // Build comprehensive comment from decision data
      const detailedComment = `
Donor Decision: ${decisionData.decision.toUpperCase()}
Response Date: ${new Date(decisionData.donorResponseDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
Communication Channel: ${decisionData.communicationChannel}
Contact Person: ${decisionData.donorContactPerson}

${decisionData.comments}

${decisionData.attachments.length > 0 ? `\nAttachments: ${decisionData.attachments.map(a => a.name).join(', ')}` : ''}
`.trim();

      // Update proposal status with detailed information
      await executeStatusChange(newStatus, detailedComment);

      // Show success message
      setWorkflowSuccess(`Donor ${decisionData.decision === 'approved' ? 'approval' : 'rejection'} recorded successfully`);

      // Close the donor decision modal
      setShowDonorDecisionModal(false);
      setDonorDecision(null);

    } catch (error) {
      console.error('Error recording donor decision:', error);
      setWorkflowError('Failed to record donor decision. Please try again.');
      throw error;
    }
  };

  // Debug logging
  console.log('ProposalViewModal Debug:', {
    currentUser,
    userRole: currentUser?.role,
    proposalStatus: proposal.status,
    hasCurrentUser: !!currentUser
  });

  // Permission checks based on user role and proposal status
  // Roles that can submit proposals for approval
  const canSubmitRoles = [
    'Admin',
    'Programme Manager',
    'Director Programmes',
    'Project Officer WASH',
    'Project Officer Education',
    'Project Officer Health',
    'Project Officer Food Security'
  ];

  const canSubmitForApproval = currentUser &&
    proposal.status === 'Draft' &&
    canSubmitRoles.includes(currentUser.role);

  const canReview = currentUser &&
    currentUser.role === 'CEO' &&
    ['Submitted', 'Under Review'].includes(proposal.status);

  // Roles that can perform fundraising actions (Submit to Donor, Mark Donor Decision, Convert to Project)
  const fundraisingRoles = ['Fundraising Manager', 'Admin', 'CEO'];

  const canSubmitToDonor = currentUser &&
    fundraisingRoles.includes(currentUser.role) &&
    proposal.status === 'Approved';

  const canMarkDonorDecision = currentUser &&
    fundraisingRoles.includes(currentUser.role) &&
    proposal.status === 'Submitted to Donor';

  const canConvertToProject = currentUser &&
    fundraisingRoles.includes(currentUser.role) &&
    proposal.status === 'Donor Approved' &&
    !proposal.linkedProjectId; // Don't show if already converted

  const totalDirectBeneficiaries = (
    (proposal.beneficiaryBreakdown?.directMale || 0) +
    (proposal.beneficiaryBreakdown?.directFemale || 0) +
    (proposal.beneficiaryBreakdown?.directChildren || 0)
  );

  const totalBudget = proposal.budgetBreakdown?.reduce((sum, item) => sum + (item.totalCost || 0), 0) || proposal.budgetRequested;

  const costPerBeneficiary = totalDirectBeneficiaries > 0
    ? (totalBudget / totalDirectBeneficiaries).toFixed(2)
    : 0;

  const getBudgetCategoryTotal = (category) => {
    if (!proposal.budgetBreakdown) return 0;
    return proposal.budgetBreakdown
      .filter(item => item.category === category)
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
  };

  // Workflow steps configuration
  const workflowSteps = [
    { key: 'Draft', label: 'Draft', icon: FileEdit, color: 'gray' },
    { key: 'Submitted', label: 'Submitted', icon: Send, color: 'blue' },
    { key: 'Under Review', label: 'Under Review', icon: Eye, color: 'yellow' },
    { key: 'Approved', label: 'Approved', icon: CheckCircle2, color: 'green' },
    { key: 'Submitted to Donor', label: 'Sent to Donor', icon: Mail, color: 'purple' },
    { key: 'Donor Approved', label: 'Donor Approved', icon: ThumbsUp, color: 'emerald' },
    { key: 'Project', label: 'Project Created', icon: Rocket, color: 'indigo' }
  ];

  // Get current step index
  const getCurrentStepIndex = () => {
    if (proposal.linkedProjectId) return 6; // Project Created
    const index = workflowSteps.findIndex(step => step.key === proposal.status);
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Workflow Tracker Component
  const WorkflowTracker = () => (
    <div className="bg-white border-b border-ink-100 p-6">
      <h3 className="text-sm font-semibold text-ink-700 mb-4 uppercase tracking-wide">Proposal Workflow</h3>
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-ink-200" style={{ zIndex: 0 }}></div>
        {/* Progress Bar Fill */}
        <div
          className="absolute top-5 left-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
          style={{
            width: `${(currentStepIndex / (workflowSteps.length - 1)) * 100}%`,
            zIndex: 1
          }}
        ></div>

        {/* Steps */}
        <div className="relative flex justify-between" style={{ zIndex: 2 }}>
          {workflowSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isRejected = proposal.status === 'Rejected' && step.key === 'Under Review';
            const isDonorRejected = proposal.status === 'Donor Rejected' && step.key === 'Submitted to Donor';

            const StepIcon = step.icon;

            return (
              <div key={step.key} className="flex flex-col items-center" style={{ width: '14%' }}>
                {/* Icon Circle */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? `bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white shadow-card scale-110` :
                    isCurrent ? `bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white shadow-lift scale-125` :
                    isRejected || isDonorRejected ? 'bg-red-500 text-white' :
                    'bg-ink-200 text-ink-400'}
                `}>
                  {isCompleted ? (
                    <CheckCircle size={20} className="" />
                  ) : isRejected || isDonorRejected ? (
                    <XCircle size={20} />
                  ) : (
                    <StepIcon size={18} />
                  )}
                </div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p className={`text-xs font-semibold transition-colors ${
                    isCompleted || isCurrent ? 'text-ink-900' : 'text-ink-400'
                  }`}>
                    {step.label}
                  </p>
                  {isCurrent && (
                    <p className="text-[10px] text-blue-600 font-bold mt-0.5">
                      Current
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejected Status Banner */}
      {(proposal.status === 'Rejected' || proposal.status === 'Donor Rejected') && (
        <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
          <p className="text-sm text-red-800 font-semibold flex items-center gap-2">
            <XCircle size={16} />
            {proposal.status === 'Rejected' ? 'Proposal Rejected by CEO' : 'Proposal Rejected by Donor'}
          </p>
          {proposal.comments && (
            <p className="text-xs text-red-700 mt-1">{proposal.comments}</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg2 shadow-pop max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{proposal.title}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.proposalCode}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.donor}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {proposal.programmeArea}
                </span>
                <span className={`px-3 py-1 bg-white bg-opacity-30 rounded-full text-sm font-bold`}>
                  {proposal.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Workflow Tracker */}
        <WorkflowTracker />

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-ink-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Overview
            </button>
            {proposal.resultsFramework && proposal.resultsFramework.length > 0 && (
              <button
                onClick={() => setActiveTab('meal')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'meal'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                <BarChart3 size={16} />
                MEAL Data
                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {proposal.resultsFramework.length}
                </span>
              </button>
            )}
            {proposal.budgetBreakdown && proposal.budgetBreakdown.length > 0 && (
              <button
                onClick={() => setActiveTab('budget')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'budget'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                <DollarSign size={16} />
                Budget Breakdown
                <span className="ml-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                  {proposal.budgetBreakdown.length}
                </span>
              </button>
            )}
            {proposal.safeguarding && proposal.safeguarding.length > 0 && (
              <button
                onClick={() => setActiveTab('safeguarding')}
                className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'safeguarding'
                    ? 'border-b-2 border-indigo-600 text-indigo-600'
                    : 'text-ink-500 hover:text-ink-700'
                }`}
              >
                <Shield size={16} />
                Safeguarding
                <span className="ml-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full text-xs">
                  {proposal.safeguarding.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <Calendar size={16} />
              Timeline
            </button>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="text-green-600" size={24} />
                    <span className="text-xs font-semibold text-green-700">BUDGET</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">LKR {(totalBudget / 1000000).toFixed(2)}M</p>
                  <p className="text-xs text-green-700 mt-1">Total Requested</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="text-blue-600" size={24} />
                    <span className="text-xs font-semibold text-blue-700">REACH</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{proposal.targetBeneficiaries?.toLocaleString() || 'N/A'}</p>
                  <p className="text-xs text-blue-700 mt-1">Target Beneficiaries</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="text-purple-600" size={24} />
                    <span className="text-xs font-semibold text-purple-700">DURATION</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{proposal.duration || 'N/A'}</p>
                  <p className="text-xs text-purple-700 mt-1">Months</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <TrendingUp className="text-orange-600" size={24} />
                    <span className="text-xs font-semibold text-orange-700">EFFICIENCY</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-900">LKR {costPerBeneficiary}</p>
                  <p className="text-xs text-orange-700 mt-1">Cost per Beneficiary</p>
                </div>
              </div>

              {/* Proposal Details */}
              <div className="bg-white border border-ink-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Proposal Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-ink-500 mb-1">Programme Area</p>
                    <p className="font-semibold text-ink-900">{proposal.programmeArea || 'Not specified'}</p>
                  </div>
                  {proposal.projectTier && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1">Project Tier</p>
                      <p className="font-semibold text-ink-900">{proposal.projectTier}</p>
                    </div>
                  )}
                  {proposal.sectorTheme && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1">Sector Theme</p>
                      <p className="font-semibold text-ink-900">{proposal.sectorTheme}</p>
                    </div>
                  )}
                  {proposal.district && Array.isArray(proposal.district) && proposal.district.length > 0 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm text-ink-500 mb-1 flex items-center gap-1">
                        <MapPin size={14} />
                        Target Districts
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {proposal.district.map((dist, idx) => (
                          <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                            {dist}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-ink-500 mb-1">Lead Writer</p>
                    <p className="font-semibold text-ink-900">{proposal.leadWriter || 'Not specified'}</p>
                  </div>
                  {proposal.submissionDate && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1">Submission Date</p>
                      <p className="font-semibold text-ink-900">
                        {new Date(proposal.submissionDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-ink-500 mb-1">Priority</p>
                    <p className={`font-semibold ${
                      proposal.priority === 'High' ? 'text-red-600' :
                      proposal.priority === 'Medium' ? 'text-orange-600' :
                      'text-blue-600'
                    }`}>
                      {proposal.priority || 'Medium'}
                    </p>
                  </div>
                  {proposal.startDate && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        Start Date
                      </p>
                      <p className="font-semibold text-green-700">
                        {new Date(proposal.startDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {proposal.endDate && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        End Date
                      </p>
                      <p className="font-semibold text-red-700">
                        {new Date(proposal.endDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                  {proposal.cboName && (
                    <div>
                      <p className="text-sm text-ink-500 mb-1 flex items-center gap-1">
                        <Building2 size={14} />
                        CBO Partner
                      </p>
                      <p className="font-semibold text-ink-900">{proposal.cboName}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Project Description */}
              {(proposal.summary || proposal.problemStatement || proposal.proposedSolution || proposal.overallGoal) && (
                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-600" />
                    Project Description
                  </h3>
                  <div className="space-y-4">
                    {proposal.summary && (
                      <div>
                        <p className="text-sm font-semibold text-ink-700 mb-2">Summary</p>
                        <p className="text-ink-900 leading-relaxed">{proposal.summary}</p>
                      </div>
                    )}
                    {proposal.problemStatement && (
                      <div>
                        <p className="text-sm font-semibold text-ink-700 mb-2">Problem Statement</p>
                        <p className="text-ink-900 leading-relaxed">{proposal.problemStatement}</p>
                      </div>
                    )}
                    {proposal.proposedSolution && (
                      <div>
                        <p className="text-sm font-semibold text-ink-700 mb-2">Proposed Solution</p>
                        <p className="text-ink-900 leading-relaxed">{proposal.proposedSolution}</p>
                      </div>
                    )}
                    {proposal.overallGoal && (
                      <div>
                        <p className="text-sm font-semibold text-ink-700 mb-2">Overall Goal</p>
                        <p className="text-ink-900 leading-relaxed">{proposal.overallGoal}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Objectives */}
              {proposal.objectives && Array.isArray(proposal.objectives) && proposal.objectives.length > 0 && (
                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                    <Target size={20} className="text-blue-600" />
                    Objectives
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {proposal.objectives.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {proposal.objectives.map((obj, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex-shrink-0 w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-ink-900 flex-1">{typeof obj === 'string' ? obj : obj.objective || obj.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Activities */}
              {proposal.keyActivities && Array.isArray(proposal.keyActivities) && proposal.keyActivities.length > 0 && (
                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-600" />
                    Key Activities
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      {proposal.keyActivities.length}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {proposal.keyActivities.map((activity, index) => (
                      <div key={index} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <p className="text-ink-900 flex-1">{typeof activity === 'string' ? activity : activity.activity || activity.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Beneficiary Breakdown */}
              {proposal.beneficiaryBreakdown && (
                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                    <Users2 size={20} className="text-green-600" />
                    Beneficiary Breakdown
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-blue-900">{proposal.beneficiaryBreakdown.directMale?.toLocaleString() || 0}</p>
                      <p className="text-xs text-blue-700 font-semibold mt-1">Direct Male</p>
                    </div>
                    <div className="bg-pink-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-pink-900">{proposal.beneficiaryBreakdown.directFemale?.toLocaleString() || 0}</p>
                      <p className="text-xs text-pink-700 font-semibold mt-1">Direct Female</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-purple-900">{proposal.beneficiaryBreakdown.directChildren?.toLocaleString() || 0}</p>
                      <p className="text-xs text-purple-700 font-semibold mt-1">Children</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-orange-900">{proposal.beneficiaryBreakdown.directPWD?.toLocaleString() || 0}</p>
                      <p className="text-xs text-orange-700 font-semibold mt-1">PWD</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-900">{proposal.beneficiaryBreakdown.indirectTotal?.toLocaleString() || 0}</p>
                      <p className="text-xs text-green-700 font-semibold mt-1">Indirect Total</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEAL Data Tab */}
          {activeTab === 'meal' && proposal.resultsFramework && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-blue-600" />
                  Results Framework - Indicators
                </h3>
                <div className="space-y-3">
                  {proposal.resultsFramework.map((indicator, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-ink-900 mb-2">{indicator.indicator}</p>
                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-ink-500">Baseline</p>
                              <p className="font-bold text-ink-900">{indicator.baseline}</p>
                            </div>
                            <div>
                              <p className="text-xs text-ink-500">Target</p>
                              <p className="font-bold text-green-600">{indicator.target}</p>
                            </div>
                            <div>
                              <p className="text-xs text-ink-500">Means of Verification</p>
                              <p className="text-sm text-ink-700">{indicator.meansOfVerification}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Budget Breakdown Tab */}
          {activeTab === 'budget' && proposal.budgetBreakdown && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-purple-600" />
                  Budget Breakdown
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-purple-200">
                        <th className="text-left p-3 text-sm font-bold text-ink-700">Category</th>
                        <th className="text-left p-3 text-sm font-bold text-ink-700">Item Description</th>
                        <th className="text-right p-3 text-sm font-bold text-ink-700">Unit Cost</th>
                        <th className="text-center p-3 text-sm font-bold text-ink-700">Quantity</th>
                        <th className="text-right p-3 text-sm font-bold text-ink-700">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.budgetBreakdown.map((item, index) => (
                        <tr key={index} className="border-b border-ink-100 hover:bg-purple-50">
                          <td className="p-3 text-sm font-semibold text-ink-900">{item.category}</td>
                          <td className="p-3 text-sm text-ink-700">{item.itemDescription}</td>
                          <td className="p-3 text-sm text-right text-ink-900">LKR {item.unitCost?.toLocaleString()}</td>
                          <td className="p-3 text-sm text-center text-ink-900">{item.quantity}</td>
                          <td className="p-3 text-sm text-right font-bold text-purple-900">LKR {item.totalCost?.toLocaleString()}</td>
                        </tr>
                      ))}
                      <tr className="bg-purple-100 font-bold">
                        <td colSpan="4" className="p-3 text-right text-ink-900">TOTAL BUDGET:</td>
                        <td className="p-3 text-right text-purple-900">LKR {totalBudget.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Safeguarding Tab */}
          {activeTab === 'safeguarding' && proposal.safeguarding && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-orange-600" />
                  Safeguarding Compliance
                </h3>
                <div className="space-y-3">
                  {proposal.safeguarding.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg border border-orange-100 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          item.status === 'Yes' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {item.status === 'Yes' ? (
                            <CheckCircle className="text-green-600" size={20} />
                          ) : (
                            <AlertCircle className="text-red-600" size={20} />
                          )}
                        </div>
                        <p className="font-semibold text-ink-900">{item.item}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        item.status === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-indigo-600" />
                Proposal Timeline
              </h3>

              <div className="relative pl-8">
                {/* Vertical line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 to-purple-500"></div>

                {/* Timeline Events */}
                {proposal.createdAt && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-card"></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-ink-100">
                      <div className="flex items-center gap-2 mb-1">
                        <FileEdit size={16} className="text-blue-600" />
                        <span className="font-semibold text-ink-900">Proposal Created</span>
                      </div>
                      <p className="text-sm text-ink-600">
                        {new Date(proposal.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-ink-500 mt-1">Created by: {proposal.creator?.fullName || 'Unknown'}</p>
                    </div>
                  </div>
                )}

                {proposal.submissionDate && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-card"></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border border-ink-100">
                      <div className="flex items-center gap-2 mb-1">
                        <Send size={16} className="text-green-600" />
                        <span className="font-semibold text-ink-900">Proposal Submitted</span>
                      </div>
                      <p className="text-sm text-ink-600">
                        {new Date(proposal.submissionDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-ink-500 mt-1">Submitted by: {proposal.leadWriter || 'Unknown'}</p>
                    </div>
                  </div>
                )}

                {proposal.status === 'Approved' && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-emerald-500 rounded-full border-4 border-white shadow-card"></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border-2 border-emerald-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={16} className="text-emerald-600" />
                        <span className="font-semibold text-ink-900">Proposal Approved</span>
                      </div>
                      <p className="text-sm text-ink-600">Current Status</p>
                      <p className="text-xs text-emerald-700 mt-1 font-semibold">✓ Ready to submit to donor</p>
                    </div>
                  </div>
                )}

                {proposal.status === 'Submitted to Donor' && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-purple-500 rounded-full border-4 border-white shadow-card"></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail size={16} className="text-purple-600" />
                        <span className="font-semibold text-ink-900">Sent to Donor</span>
                      </div>
                      <p className="text-sm text-ink-600">Current Status</p>
                      <p className="text-xs text-purple-700 mt-1 font-semibold">⏳ Awaiting donor decision</p>
                    </div>
                  </div>
                )}

                {proposal.status === 'Donor Approved' && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-indigo-500 rounded-full border-4 border-white shadow-card"></div>
                    <div className="bg-white p-4 rounded-lg shadow-md border-2 border-indigo-200">
                      <div className="flex items-center gap-2 mb-1">
                        <ThumbsUp size={16} className="text-indigo-600" />
                        <span className="font-semibold text-ink-900">Donor Approved</span>
                      </div>
                      <p className="text-sm text-ink-600">Current Status</p>
                      <p className="text-xs text-indigo-700 mt-1 font-semibold">🚀 Ready to convert to project</p>
                    </div>
                  </div>
                )}

                {proposal.linkedProjectId && (
                  <div className="relative mb-6">
                    <div className="absolute left-[-1.4rem] w-6 h-6 bg-navy-900 rounded-full border-4 border-white shadow-lift"></div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg shadow-card border-2 border-indigo-300">
                      <div className="flex items-center gap-2 mb-1">
                        <Rocket size={16} className="text-indigo-700" />
                        <span className="font-semibold text-ink-900">Project Created</span>
                      </div>
                      <p className="text-sm text-ink-600">
                        {proposal.convertedToProjectDate && new Date(proposal.convertedToProjectDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-indigo-700 mt-1 font-semibold">
                        Project Code: {proposal.linkedProjectCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Workflow Actions Section - Always show */}
        <div className="border-t border-ink-100 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-600" />
            Workflow Actions
          </h3>

            {/* Workflow Success/Error Messages */}
            {workflowSuccess && (
              <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
                <CheckCircle size={24} className="text-green-600" />
                <p className="text-sm text-green-700">{workflowSuccess}</p>
              </div>
            )}

            {workflowError && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
                <AlertCircle size={24} className="text-red-600" />
                <p className="text-sm text-red-700">{workflowError}</p>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {/* Staff: Submit for CEO Approval */}
              {canSubmitForApproval && (
                <button
                  onClick={() => handleStatusChange('Submitted')}
                  disabled={workflowLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {workflowLoading ? (
                    <Loader size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                  Submit for CEO Approval
                </button>
              )}

              {/* CEO: Review Actions */}
              {canReview && (
                <>
                  <button
                    onClick={() => handleStatusChange('Under Review')}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workflowLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Eye size={20} />
                    )}
                    Set Under Review
                  </button>

                  <button
                    onClick={() => handleStatusChange('Approved', true)}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workflowLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <ThumbsUp size={20} />
                    )}
                    Approve Proposal
                  </button>

                  <button
                    onClick={() => handleStatusChange('Rejected', true)}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workflowLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <XCircle size={20} />
                    )}
                    Reject Proposal
                  </button>
                </>
              )}

              {/* Fundraising Manager: Submit to Donor */}
              {canSubmitToDonor && (
                <>
                  <button
                    onClick={() => setShowEmailModal(true)}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Mail size={20} />
                    Email to Donor
                  </button>
                  <button
                    onClick={() => handleStatusChange('Submitted to Donor')}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {workflowLoading ? (
                      <Loader size={20} className="animate-spin" />
                    ) : (
                      <Send size={20} />
                    )}
                    Mark as Submitted
                  </button>
                </>
              )}

              {/* Fundraising Manager: Mark Donor Decision */}
              {canMarkDonorDecision && (
                <>
                  <button
                    onClick={() => {
                      setDonorDecision('approved');
                      setShowDonorDecisionModal(true);
                    }}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ThumbsUp size={20} />
                    Record Donor Approval
                  </button>

                  <button
                    onClick={() => {
                      setDonorDecision('rejected');
                      setShowDonorDecisionModal(true);
                    }}
                    disabled={workflowLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-card disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ThumbsDown size={20} />
                    Record Donor Rejection
                  </button>
                </>
              )}

              {/* No actions available message */}
              {!canSubmitForApproval && !canReview && !canSubmitToDonor && !canMarkDonorDecision && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No workflow actions available.</strong>
                    {currentUser ? (
                      <>
                        <br />
                        Current status: <strong>{proposal.status}</strong>
                        <br />
                        Your role: <strong>{currentUser.role}</strong>
                        <br />
                        {proposal.status === 'Draft' && (
                          <span>This proposal needs to be submitted for approval by Admin, Programme Manager, Director Programmes, or Project Officers.</span>
                        )}
                        {['Submitted', 'Under Review'].includes(proposal.status) && (
                          <span>This proposal is awaiting CEO review.</span>
                        )}
                        {proposal.status === 'Approved' && (
                          <span>This proposal needs to be submitted to donor by Fundraising Manager, Admin, or CEO.</span>
                        )}
                        {proposal.status === 'Submitted to Donor' && (
                          <span>Awaiting donor decision from Fundraising Manager, Admin, or CEO.</span>
                        )}
                        {proposal.status === 'Donor Approved' && !proposal.linkedProjectId && (
                          <span>This proposal can be converted to a project by Fundraising Manager, Admin, or CEO.</span>
                        )}
                        {proposal.linkedProjectId && (
                          <span className="text-green-700 font-semibold">
                            ✓ This proposal has been converted to project {proposal.linkedProjectCode}
                          </span>
                        )}
                      </>
                    ) : (
                      <span>Please log in to perform workflow actions.</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-2xl">
          {/* Success Message */}
          {conversionSuccess && (
            <div className="mb-3 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex items-center gap-3">
              <CheckCircle size={24} className="text-green-600" />
              <div>
                <p className="font-bold text-green-900">Conversion Successful!</p>
                <p className="text-sm text-green-700">Proposal converted to project. Redirecting to Projects page...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {conversionError && (
            <div className="mb-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-center gap-3">
              <AlertCircle size={24} className="text-red-600" />
              <div>
                <p className="font-bold text-red-900">Conversion Failed</p>
                <p className="text-sm text-red-700">{conversionError}</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-3">
              {/* PDF Download Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => generateProposalPDF(proposal, 'full')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition shadow-md hover:shadow-card"
                  title="Download full proposal as PDF"
                >
                  <Download size={18} />
                  Full PDF
                </button>
                <button
                  onClick={() => generateProposalPDF(proposal, 'executive')}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition shadow-md hover:shadow-card"
                  title="Download executive summary as PDF"
                >
                  <FileText size={18} />
                  Summary PDF
                </button>
              </div>

              <div className="text-sm text-ink-600">
                {proposal.status === 'Donor Approved' && canConvertToProject && (
                  <p className="flex items-center gap-2 text-green-700">
                    <CheckCircle size={16} />
                    This proposal is donor-approved and ready for conversion
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
                disabled={converting || workflowLoading}
              >
                Close
              </button>
              {canConvertToProject && !conversionSuccess && (
                <button
                  onClick={handleConvertToProject}
                  disabled={converting || workflowLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-navy-900 text-white rounded-lg transition font-semibold shadow-card hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {converting ? (
                    <>
                      <Loader size={20} className="animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={20} />
                      Convert to Project
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          proposal={proposal}
          onClose={() => setShowEmailModal(false)}
          onSend={handleEmailSend}
        />
      )}

      {/* Donor Decision Modal */}
      {showDonorDecisionModal && donorDecision && (
        <DonorDecisionModal
          proposal={proposal}
          decision={donorDecision}
          onClose={() => {
            setShowDonorDecisionModal(false);
            setDonorDecision(null);
          }}
          onSubmit={handleDonorDecisionSubmit}
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-ink-900 mb-4">
              Add Comments
            </h3>
            <p className="text-sm text-ink-600 mb-4">
              Please provide comments for this action (optional):
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[120px]"
              placeholder="Enter your comments here..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowCommentModal(false);
                  setComments('');
                  setWorkflowAction(null);
                }}
                className="px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-semibold"
                disabled={workflowLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={workflowLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {workflowLoading ? (
                  <>
                    <Loader size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalViewModal;
