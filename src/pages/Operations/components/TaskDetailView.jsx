import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  User,
  Users,
  MapPin,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Image,
  MessageCircle,
  Edit,
  UserPlus,
  TrendingUp,
  Package,
  Camera,
  ChevronRight,
  Download,
  ExternalLink,
  Activity,
  Target,
  Briefcase,
  FileCheck
} from 'lucide-react';
import { useProjects } from '../../../contexts/ProjectContext';
import { useHR } from '../../../contexts/HRContext';
import { useBeneficiaries } from '../../../contexts/BeneficiaryContext';
import { getTaskBeneficiaries } from '../../../services/taskBeneficiaryService';
import { getAggregateDistributionByTask } from '../../../services/aggregateDistributionService';
import TaskComments from '../../../components/tasks/TaskComments';

const TaskDetailView = ({ isOpen, onClose, task, onEdit, onAssign, onUpdateProgress, onComplete, onSelectBeneficiaries }) => {
  const { projects } = useProjects();
  const { staff } = useHR();
  const { beneficiaries } = useBeneficiaries();

  const [activeTab, setActiveTab] = useState('overview');
  const [taskBeneficiaries, setTaskBeneficiaries] = useState([]);
  const [aggregateDistribution, setAggregateDistribution] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && task) {
      loadTaskDetails();
    }
  }, [isOpen, task]);

  const loadTaskDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load beneficiaries if Individual Distribution
      if (task.distributionType === 'Individual Distribution') {
        const beneficiariesData = await getTaskBeneficiaries(task.id);
        setTaskBeneficiaries(beneficiariesData);
      }

      // Load aggregate distribution if Aggregate Distribution
      if (task.distributionType === 'Aggregate Distribution') {
        const distributionData = await getAggregateDistributionByTask(task.id);
        setAggregateDistribution(distributionData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  // Helper functions
  const getProject = () => {
    return projects.find(p => p.id === task.projectId);
  };

  const getAssignedStaff = () => {
    if (!task.assignedTo) return null;
    return staff.find(s => s.id === task.assignedTo);
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-ink-100 text-ink-800'
    };
    return colors[status] || 'bg-ink-100 text-ink-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-ink-100 text-ink-800';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const project = getProject();
  const assignedStaff = getAssignedStaff();

  // Tab content components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-h1 text-ink-900 mb-2">{task.taskName}</h3>
            <p className="text-ink-600">{task.description || 'No description provided'}</p>
          </div>
          <div className="flex gap-2 ml-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Start Date</span>
            </div>
            <p className="text-sm font-semibold text-ink-900">{formatDate(task.startDate)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">End Date</span>
            </div>
            <p className="text-sm font-semibold text-ink-900">{formatDate(task.endDate)}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Target className="w-4 h-4" />
              <span className="text-xs font-medium">Type</span>
            </div>
            <p className="text-sm font-semibold text-ink-900">{task.taskType}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <Package className="w-4 h-4" />
              <span className="text-xs font-medium">Distribution</span>
            </div>
            <p className="text-sm font-semibold text-ink-900">{task.distributionType || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Main Information Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Project Information */}
          <div className="bg-white rounded-lg border border-ink-100 p-4">
            <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              Project Information
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Project Name:</span>
                <span className="text-sm font-medium text-ink-900">{project?.title || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Project Code:</span>
                <span className="text-sm font-medium text-ink-900">{project?.code || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Assignment Information */}
          <div className="bg-white rounded-lg border border-ink-100 p-4">
            <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              Assignment
            </h4>
            {assignedStaff ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">
                      {assignedStaff.firstName} {assignedStaff.lastName}
                    </p>
                    <p className="text-xs text-ink-600">{assignedStaff.position || 'Staff Member'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ink-500">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">Not assigned</span>
              </div>
            )}
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg border border-ink-100 p-4">
            <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Location
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Province:</span>
                <span className="text-sm font-medium text-ink-900">{task.province || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">District:</span>
                <span className="text-sm font-medium text-ink-900">
                  {task.district && typeof task.district === 'object'
                    ? task.district.join(', ')
                    : task.district || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Venue:</span>
                <span className="text-sm font-medium text-ink-900">{task.venue || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Budget Information */}
          {task.taskType === 'Procurement' && (
            <div className="bg-white rounded-lg border border-ink-100 p-4">
              <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                Budget Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Requested:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {formatCurrency(task.budgetRequestedAmount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Allocated:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(task.budgetAllocated)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-600">Spent:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatCurrency(task.budgetSpent)}
                  </span>
                </div>
                {task.budgetApprovalStatus && (
                  <div className="pt-2 border-t border-ink-100">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      task.budgetApprovalStatus === 'Approved'
                        ? 'bg-green-100 text-green-800'
                        : task.budgetApprovalStatus === 'Rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.budgetApprovalStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Coverage */}
          {task.mediaCoverageRequired && (
            <div className="bg-white rounded-lg border border-ink-100 p-4">
              <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                Media Coverage
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Coverage Type:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {task.mediaCoverageType || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Team Assigned:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {task.mediaTeamAssigned || 'Not assigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Status:</span>
                  <span className={`text-sm font-medium ${
                    task.mediaCoverageStatus === 'Completed'
                      ? 'text-green-600'
                      : task.mediaCoverageStatus === 'In Progress'
                      ? 'text-blue-600'
                      : 'text-ink-900'
                  }`}>
                    {task.mediaCoverageStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Distribution Summary */}
          {task.distributionType && (
            <div className="bg-white rounded-lg border border-ink-100 p-4">
              <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                Distribution Summary
              </h4>
              {task.distributionType === 'Individual Distribution' ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">Total Beneficiaries:</span>
                    <span className="text-sm font-medium text-ink-900">{taskBeneficiaries.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">Received:</span>
                    <span className="text-sm font-medium text-green-600">
                      {taskBeneficiaries.filter(tb => tb.received).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-ink-600">Attended:</span>
                    <span className="text-sm font-medium text-blue-600">
                      {taskBeneficiaries.filter(tb => tb.attended).length}
                    </span>
                  </div>
                </div>
              ) : task.distributionType === 'Aggregate Distribution' ? (
                <div className="space-y-2">
                  {aggregateDistribution ? (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">Total Items:</span>
                        <span className="text-sm font-medium text-ink-900">
                          {aggregateDistribution.totalQuantity || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">Distributed:</span>
                        <span className="text-sm font-medium text-green-600">
                          {aggregateDistribution.distributedQuantity || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-ink-600">Verified:</span>
                        <span className={`text-sm font-medium ${
                          aggregateDistribution.verified ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {aggregateDistribution.verified ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-ink-500">No distribution data</p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Timeline */}
          <div className="bg-white rounded-lg border border-ink-100 p-4">
            <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Timeline
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Created:</span>
                <span className="text-sm font-medium text-ink-900">
                  {formatDate(task.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-600">Last Updated:</span>
                <span className="text-sm font-medium text-ink-900">
                  {formatDate(task.updatedAt)}
                </span>
              </div>
              {task.completedDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Completed:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatDate(task.completedDate)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {task.notes && (
        <div className="bg-white rounded-lg border border-ink-100 p-4">
          <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            Notes
          </h4>
          <p className="text-sm text-ink-700 whitespace-pre-wrap">{task.notes}</p>
        </div>
      )}
    </div>
  );

  const BeneficiariesTab = () => {
    if (task.distributionType !== 'Individual Distribution') {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <p className="text-ink-600">This task does not have individual beneficiaries</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-ink-600 mt-4">Loading beneficiaries...</p>
        </div>
      );
    }

    if (taskBeneficiaries.length === 0) {
      return (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-ink-400 mx-auto mb-4" />
          <p className="text-ink-600">No beneficiaries added to this task yet</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{taskBeneficiaries.length}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Received</p>
                <p className="text-2xl font-bold text-green-900">
                  {taskBeneficiaries.filter(tb => tb.received).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Attended</p>
                <p className="text-2xl font-bold text-purple-900">
                  {taskBeneficiaries.filter(tb => tb.attended).length}
                </p>
              </div>
              <User className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Pending</p>
                <p className="text-2xl font-bold text-orange-900">
                  {taskBeneficiaries.filter(tb => !tb.received).length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Beneficiaries List */}
        <div className="bg-white rounded-lg border border-ink-100 overflow-hidden">
          <table className="min-w-full divide-y divide-ink-100">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                  Beneficiary
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                  Selection Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                  Received
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-ink-500 uppercase tracking-wider">
                  Attended
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-ink-100">
              {taskBeneficiaries.map((tb) => {
                const beneficiary = beneficiaries.find(b => b.id === tb.beneficiaryId);
                return (
                  <tr key={tb.id} className="hover:bg-ink-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-ink-900">
                            {beneficiary?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-ink-500">
                            NIC: {beneficiary?.nic || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-ink-900">{beneficiary?.phoneNumber || 'N/A'}</div>
                      <div className="text-sm text-ink-500">{beneficiary?.address || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        tb.selectionStatus === 'Selected'
                          ? 'bg-green-100 text-green-800'
                          : tb.selectionStatus === 'Waitlist'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tb.selectionStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tb.received ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(tb.receivedDate)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-ink-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Not received</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tb.attended ? (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(tb.attendanceDate)}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-ink-400">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">Not attended</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const DistributionTab = () => {
    if (task.distributionType === 'Aggregate Distribution') {
      if (loading) {
        return (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-ink-600 mt-4">Loading distribution data...</p>
          </div>
        );
      }

      if (!aggregateDistribution) {
        return (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-ink-400 mx-auto mb-4" />
            <p className="text-ink-600">No distribution data available yet</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Quantity</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {aggregateDistribution.totalQuantity || 0}
                  </p>
                </div>
                <Package className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium mb-1">Distributed</p>
                  <p className="text-3xl font-bold text-green-900">
                    {aggregateDistribution.distributedQuantity || 0}
                  </p>
                </div>
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {(aggregateDistribution.totalQuantity || 0) - (aggregateDistribution.distributedQuantity || 0)}
                  </p>
                </div>
                <Clock className="w-10 h-10 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Distribution Details */}
          <div className="bg-white rounded-lg border border-ink-100 p-6">
            <h4 className="font-semibold text-ink-900 mb-4">Distribution Details</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Distribution Date:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {formatDate(aggregateDistribution.distributionDate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Distribution Location:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {aggregateDistribution.distributionLocation || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Distribution Officer:</span>
                  <span className="text-sm font-medium text-ink-900">
                    {aggregateDistribution.distributionOfficer || 'N/A'}
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-ink-600">Verified:</span>
                  <span className={`text-sm font-medium ${
                    aggregateDistribution.verified ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {aggregateDistribution.verified ? 'Yes' : 'No'}
                  </span>
                </div>
                {aggregateDistribution.verified && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">Verified By:</span>
                      <span className="text-sm font-medium text-ink-900">
                        {aggregateDistribution.verifiedBy || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-ink-600">Verification Date:</span>
                      <span className="text-sm font-medium text-ink-900">
                        {formatDate(aggregateDistribution.verificationDate)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Distributed */}
          {aggregateDistribution.itemsDistributed && aggregateDistribution.itemsDistributed.length > 0 && (
            <div className="bg-white rounded-lg border border-ink-100 p-6">
              <h4 className="font-semibold text-ink-900 mb-4">Items Distributed</h4>
              <div className="space-y-2">
                {aggregateDistribution.itemsDistributed.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-ink-100 last:border-0">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-ink-400" />
                      <div>
                        <p className="text-sm font-medium text-ink-900">{item.itemName || 'Item'}</p>
                        <p className="text-xs text-ink-500">{item.description || 'No description'}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-ink-900">Qty: {item.quantity || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Distribution Notes */}
          {aggregateDistribution.distributionNotes && (
            <div className="bg-white rounded-lg border border-ink-100 p-6">
              <h4 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Distribution Notes
              </h4>
              <p className="text-sm text-ink-700 whitespace-pre-wrap">
                {aggregateDistribution.distributionNotes}
              </p>
            </div>
          )}

          {/* Evidence */}
          {aggregateDistribution.distributionEvidence && (
            <div className="bg-white rounded-lg border border-ink-100 p-6">
              <h4 className="font-semibold text-ink-900 mb-4 flex items-center gap-2">
                <Image className="w-4 h-4 text-blue-600" />
                Distribution Evidence
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {aggregateDistribution.distributionEvidence.photos?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-ink-700 mb-2">Photos:</p>
                    <div className="space-y-1">
                      {aggregateDistribution.distributionEvidence.photos.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Photo {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {aggregateDistribution.distributionEvidence.videos?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-ink-700 mb-2">Videos:</p>
                    <div className="space-y-1">
                      {aggregateDistribution.distributionEvidence.videos.map((url, index) => (
                        <a
                          key={index}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Video {index + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12">
        <Package className="w-16 h-16 text-ink-400 mx-auto mb-4" />
        <p className="text-ink-600">
          This task uses Individual Distribution. Check the Beneficiaries tab for details.
        </p>
      </div>
    );
  };

  const CommentsTab = () => (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-ink-100 p-6">
        <TaskComments taskId={task.id} />
      </div>
    </div>
  );

  // Dynamically build tabs based on task type
  const tabs = [
    { id: 'overview', label: 'Overview', icon: FileCheck }
  ];

  // Add Beneficiaries tab only for tasks that involve beneficiaries
  const beneficiaryTaskTypes = ['Beneficiary Selection', 'Mass Distribution', 'Individual Distribution'];
  if (task.involvesBeneficiaries && beneficiaryTaskTypes.includes(task.taskType)) {
    tabs.push({ id: 'beneficiaries', label: 'Beneficiaries', icon: Users });
  }

  // Add Distribution tab only for tasks with distribution
  if (task.distributionType && task.distributionType !== 'None') {
    tabs.push({ id: 'distribution', label: 'Distribution', icon: Package });
  }

  // Always show Comments tab
  tabs.push({ id: 'comments', label: 'Comments', icon: MessageCircle });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileCheck className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Task Details</h2>
              <p className="text-sm text-blue-100">Complete task information and tracking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-ink-50 border-b border-ink-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(task)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors text-sm font-medium text-ink-700"
              >
                <Edit className="w-4 h-4" />
                Edit Task
              </button>
            )}
            {onAssign && !assignedStaff && (
              <button
                onClick={() => onAssign(task)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <UserPlus className="w-4 h-4" />
                Assign Staff
              </button>
            )}
            {onUpdateProgress && task.status !== 'Completed' && (
              <button
                onClick={() => onUpdateProgress(task)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors text-sm font-medium text-ink-700"
              >
                <TrendingUp className="w-4 h-4" />
                Update Progress
              </button>
            )}
            {onComplete && task.status === 'In Progress' && (
              <button
                onClick={() => onComplete(task)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
              >
                <CheckCircle className="w-4 h-4" />
                Mark Complete
              </button>
            )}
            {task.involvesBeneficiaries && ['Beneficiary Selection', 'Mass Distribution', 'Individual Distribution'].includes(task.taskType) && (
              <button
                onClick={() => onSelectBeneficiaries && onSelectBeneficiaries(task)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Users className="w-4 h-4" />
                {taskBeneficiaries.length > 0 ? 'Manage Beneficiaries' : 'Select Beneficiaries'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-b border-ink-100 px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-ink-600 hover:text-ink-900 hover:border-ink-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 mb-1">Error loading data</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'beneficiaries' && <BeneficiariesTab />}
          {activeTab === 'distribution' && <DistributionTab />}
          {activeTab === 'comments' && <CommentsTab />}
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-100 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors text-sm font-medium text-ink-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailView;
