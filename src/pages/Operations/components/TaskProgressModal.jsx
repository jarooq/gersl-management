import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Calendar,
  Activity,
  BarChart3,
  Info
} from 'lucide-react';
import { updateTaskStatus } from '../../../services/taskService';

const TaskProgressModal = ({ isOpen, onClose, task, onUpdate }) => {
  const [formData, setFormData] = useState({
    status: '',
    progressNotes: '',
    progressPercentage: 0
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      setFormData({
        status: task.status || 'Pending',
        progressNotes: '',
        progressPercentage: task.progressPercentage || 0
      });
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Validation
      if (formData.status === task.status && !formData.progressNotes && formData.progressPercentage === task.progressPercentage) {
        setError('Please make at least one change to update the task progress');
        setSubmitting(false);
        return;
      }

      // Update task status
      const response = await updateTaskStatus(task.id, formData.status);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to update task progress');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while updating task progress');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5" />;
      case 'In Progress':
        return <TrendingUp className="w-5 h-5" />;
      case 'On Hold':
        return <Clock className="w-5 h-5" />;
      case 'Pending':
        return <AlertCircle className="w-5 h-5" />;
      case 'Cancelled':
        return <X className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  const statusOptions = [
    { value: 'Pending', label: 'Pending', description: 'Task is waiting to be started', icon: AlertCircle },
    { value: 'In Progress', label: 'In Progress', description: 'Task is currently being worked on', icon: TrendingUp },
    { value: 'On Hold', label: 'On Hold', description: 'Task is temporarily paused', icon: Clock },
    { value: 'Completed', label: 'Completed', description: 'Task has been finished', icon: CheckCircle }
  ];

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Update Task Progress</h2>
              <p className="text-sm text-green-100">{task.taskName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900 mb-1">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-900 mb-1">Success</h4>
                <p className="text-sm text-green-700">Task progress updated successfully!</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Task Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Current Task Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Current Status:</p>
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                    {getStatusIcon(task.status)}
                    {task.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Due Date:</p>
                  <p className="text-sm font-medium text-blue-900">{formatDate(task.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Priority:</p>
                  <p className="text-sm font-medium text-blue-900">{task.priority}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Task Type:</p>
                  <p className="text-sm font-medium text-blue-900">{task.taskType}</p>
                </div>
              </div>
            </div>

            {/* Progress Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Percentage
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  name="progressPercentage"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progressPercentage}
                  onChange={handleChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">0%</span>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{formData.progressPercentage}%</span>
                  </div>
                  <span className="text-sm text-gray-600">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-teal-500 transition-all duration-300"
                    style={{ width: `${formData.progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Update Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, status: option.value }))}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`${getStatusColor(option.value).split(' ')[0]} rounded-full p-2`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{option.label}</p>
                          {isSelected && (
                            <p className="text-xs text-green-600 font-medium">Selected</p>
                          )}
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress Notes
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <textarea
                  name="progressNotes"
                  value={formData.progressNotes}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Describe the progress made, any challenges faced, or next steps..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Add notes about what you've accomplished and what's next
              </p>
            </div>

            {/* Summary */}
            {(formData.status !== task.status || formData.progressNotes || formData.progressPercentage !== (task.progressPercentage || 0)) && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-600" />
                  Update Summary
                </h3>
                <div className="space-y-2 text-sm">
                  {formData.status !== task.status && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Status change:</span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(formData.status)}`}>
                          {formData.status}
                        </span>
                      </div>
                    </div>
                  )}
                  {formData.progressPercentage !== (task.progressPercentage || 0) && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <span className="font-medium text-gray-900">
                        {task.progressPercentage || 0}% → {formData.progressPercentage}%
                      </span>
                    </div>
                  )}
                  {formData.progressNotes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes added:</span>
                      <span className="font-medium text-green-600">Yes</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || (formData.status === task.status && !formData.progressNotes && formData.progressPercentage === (task.progressPercentage || 0))}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Update Progress
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskProgressModal;
