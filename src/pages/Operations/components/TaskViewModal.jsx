import React from 'react';
import { X, Calendar, Users, DollarSign, Package, GraduationCap, Megaphone, Flag, Gift, Truck, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const TaskViewModal = ({ task, isOpen, onClose, onEdit }) => {
  if (!isOpen || !task) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      Low: 'bg-gray-100 text-gray-700',
      Medium: 'bg-blue-100 text-blue-700',
      High: 'bg-orange-100 text-orange-700',
      Urgent: 'bg-red-100 text-red-700',
      Critical: 'bg-red-100 text-red-700'
    };
    return colors[priority] || colors.Medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'bg-gray-100 text-gray-700',
      'In Progress': 'bg-blue-100 text-blue-700',
      'On Hold': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || colors['Not Started'];
  };

  // Parse array fields if they're JSON strings
  const mediaCoverageType = (() => {
    if (Array.isArray(task.mediaCoverageType)) return task.mediaCoverageType;
    if (typeof task.mediaCoverageType === 'string') {
      try {
        return JSON.parse(task.mediaCoverageType);
      } catch {
        return task.mediaCoverageType ? [task.mediaCoverageType] : [];
      }
    }
    return [];
  })();

  const mediaTeamAssigned = (() => {
    if (Array.isArray(task.mediaTeamAssigned)) return task.mediaTeamAssigned;
    if (typeof task.mediaTeamAssigned === 'string') {
      try {
        return JSON.parse(task.mediaTeamAssigned);
      } catch {
        return [];
      }
    }
    return [];
  })();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{task.title || task.name}</h2>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(task.status)} bg-white bg-opacity-90`}>
                  {task.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getPriorityColor(task.priority)} bg-white bg-opacity-90`}>
                  <Flag size={14} />
                  {task.priority} Priority
                </span>
                {task.taskType && task.taskType !== 'Other' && (
                  <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-bold">
                    {task.taskType}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-indigo-700 rounded-lg transition ml-4"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {task.description && (
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dates */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <Calendar size={16} />
                Dates
              </p>
              <div className="space-y-1">
                {task.startDate && (
                  <p className="text-sm">
                    <span className="text-gray-600">Start:</span>{' '}
                    <span className="font-semibold text-gray-900">{formatDate(task.startDate)}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-gray-600">Due:</span>{' '}
                  <span className="font-semibold text-gray-900">{formatDate(task.dueDate || task.endDate)}</span>
                </p>
              </div>
            </div>

            {/* Assigned Users */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                <Users size={16} />
                Assigned Staff
              </p>
              {task.assignees && task.assignees.length > 0 ? (
                <div className="space-y-2">
                  {task.assignees.map((assignee, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                        {assignee.user?.fullName?.[0] || '?'}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {assignee.user?.fullName || 'Unknown'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-sm font-semibold text-gray-900">Unassigned</span>
              )}
            </div>

            {/* Progress */}
            {task.progress !== undefined && (
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">Progress</p>
                <p className="text-2xl font-bold text-green-700">{task.progress}%</p>
                <div className="w-full bg-green-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Project */}
            {task.project && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Project</p>
                <p className="font-semibold text-gray-900">
                  {task.project.projectName || task.project.name || 'Unknown Project'}
                </p>
              </div>
            )}
          </div>

          {/* Procurement Details */}
          {task.requiresProcurement && (
            <div className="p-5 bg-purple-50 border-2 border-purple-200 rounded-xl">
              <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                <Package size={20} />
                Procurement Details
              </h3>
              <div className="space-y-3">
                {task.procurementItems && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Items to Procure</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg">{task.procurementItems}</p>
                  </div>
                )}
                {task.estimatedBudget && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Estimated Budget</p>
                    <p className="text-xl font-bold text-purple-700 flex items-center gap-1">
                      <DollarSign size={20} />
                      {parseFloat(task.estimatedBudget).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Beneficiary Details - Only show if task involves beneficiaries AND has beneficiary data */}
          {task.involvesBeneficiaries && (
            task.beneficiaryTrackingMode ||
            task.targetBeneficiaries ||
            (task.beneficiarySelectionMethod && task.beneficiarySelectionMethod !== 'None') ||
            task.selectionCriteria
          ) && (
            <div className="p-5 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <Users size={20} />
                Beneficiary Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {task.beneficiaryTrackingMode && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Tracking Mode</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg font-semibold">
                      {task.beneficiaryTrackingMode}
                    </p>
                  </div>
                )}
                {task.targetBeneficiaries && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Target Beneficiaries</p>
                    <p className="text-2xl font-bold text-blue-700 bg-white p-3 rounded-lg">
                      {task.targetBeneficiaries.toLocaleString()} people
                    </p>
                  </div>
                )}
                {task.beneficiarySelectionMethod && task.beneficiarySelectionMethod !== 'None' && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Selection Method</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg">{task.beneficiarySelectionMethod}</p>
                  </div>
                )}
                {task.selectionCriteria && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Selection Criteria</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg whitespace-pre-wrap">{task.selectionCriteria}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Distribution Details */}
          {task.distributionType && task.distributionType !== 'None' && (
            <div className="p-5 bg-green-50 border-2 border-green-200 rounded-xl">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                <Gift size={20} />
                Distribution Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Distribution Type</p>
                  <p className="text-gray-900 bg-white p-3 rounded-lg font-semibold">{task.distributionType}</p>
                </div>
                {task.distributionDate && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Distribution Date</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg font-semibold">{formatDate(task.distributionDate)}</p>
                  </div>
                )}
                {task.distributionItems && (
                  <div className="md:col-span-2">
                    <p className="text-sm font-semibold text-gray-700 mb-1">Items to Distribute</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg whitespace-pre-wrap">{task.distributionItems}</p>
                  </div>
                )}
                {task.cashAmount && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Cash Amount (per beneficiary)</p>
                    <p className="text-xl font-bold text-green-700 bg-white p-3 rounded-lg flex items-center gap-1">
                      <DollarSign size={20} />
                      {parseFloat(task.cashAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {task.distributionLocation && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Location</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg">{task.distributionLocation}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Training Details */}
          {task.taskType === 'Training' && task.trainingType && (
            <div className="p-5 bg-indigo-50 border-2 border-indigo-200 rounded-xl">
              <h3 className="text-lg font-bold text-indigo-900 mb-4 flex items-center gap-2">
                <GraduationCap size={20} />
                Training Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-1">Training Type</p>
                  <p className="text-gray-900 bg-white p-3 rounded-lg font-semibold">{task.trainingType}</p>
                </div>
                {task.trainingDuration && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Duration</p>
                    <p className="text-gray-900 bg-white p-3 rounded-lg font-semibold">
                      {task.trainingDuration} hours
                    </p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Certificate</p>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-lg">
                    {task.certificateProvided ? (
                      <>
                        <CheckCircle size={20} className="text-green-600" />
                        <span className="text-gray-900 font-semibold">Certificate will be provided</span>
                      </>
                    ) : (
                      <span className="text-gray-600">No certificate</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Media Coverage */}
          {task.mediaCoverageRequired && (
            <div className="p-5 bg-cyan-50 border-2 border-cyan-200 rounded-xl">
              <h3 className="text-lg font-bold text-cyan-900 mb-4 flex items-center gap-2">
                <Megaphone size={20} />
                Media Coverage
              </h3>
              <div className="space-y-4">
                {mediaCoverageType.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Coverage Types</p>
                    <div className="flex flex-wrap gap-2">
                      {mediaCoverageType.map((type, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-cyan-600 text-white rounded-full text-sm font-semibold"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {mediaTeamAssigned.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">Media Team Assigned</p>
                    <div className="bg-white p-3 rounded-lg">
                      <p className="text-gray-900 font-semibold">{mediaTeamAssigned.length} team member(s) assigned</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Close
          </button>
          {onEdit && task.status !== 'Completed' && (
            <button
              onClick={() => {
                onClose();
                onEdit();
              }}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
            >
              Edit Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskViewModal;
