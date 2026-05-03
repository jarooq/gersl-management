import React, { useState, useEffect } from 'react';
import { X, Calendar, User, CheckCircle, Clock, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import AttachmentUpload from './AttachmentUpload';
import AttachmentList from './AttachmentList';
import api from '../../services/api';

const TaskDetailModal = ({ taskId, isOpen, onClose, onUpdate }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('details');
  const [attachmentCount, setAttachmentCount] = useState(0);

  // Fetch task details
  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.task);
      } else {
        setError('Failed to load task details');
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask();
      setActiveTab('details');
    }
  }, [isOpen, taskId]);

  // Handle upload success
  const handleUploadSuccess = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  // Handle attachments change
  const handleAttachmentsChange = (attachments) => {
    setAttachmentCount(attachments.length);
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-ink-100 text-ink-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      'on-hold': 'bg-ink-100 text-ink-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-200">
          <h2 className="text-2xl font-bold text-ink-900">Task Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-ink-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-6 flex items-center gap-2 text-red-600">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : task ? (
          <>
            {/* Tabs */}
            <div className="border-b border-ink-200">
              <div className="flex gap-4 px-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-3 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === 'details'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-ink-500 hover:text-ink-700'
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab('attachments')}
                  className={`py-3 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === 'attachments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-ink-500 hover:text-ink-700'
                  }`}
                >
                  Attachments {attachmentCount > 0 && `(${attachmentCount})`}
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`py-3 px-1 border-b-2 font-medium transition-colors ${
                    activeTab === 'comments'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare size={18} />
                    Comments
                  </div>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'details' && (
                <div className="space-y-6">
                  {/* Title and Status */}
                  <div>
                    <h3 className="text-xl font-semibold text-ink-900 mb-2">{task.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                    </div>
                  </div>

                  {/* Description */}
                  {task.description && (
                    <div>
                      <h4 className="text-sm font-medium text-ink-700 mb-2">Description</h4>
                      <p className="text-ink-600 whitespace-pre-wrap">{task.description}</p>
                    </div>
                  )}

                  {/* Task Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Assigned To */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                        <User size={16} />
                        <span className="font-medium">Assigned To</span>
                      </div>
                      <p className="text-ink-900">
                        {task.assignedTo?.fullName || 'Unassigned'}
                      </p>
                    </div>

                    {/* Created By */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                        <User size={16} />
                        <span className="font-medium">Created By</span>
                      </div>
                      <p className="text-ink-900">
                        {task.createdBy?.fullName || 'Unknown'}
                      </p>
                    </div>

                    {/* Due Date */}
                    {task.dueDate && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                          <Calendar size={16} />
                          <span className="font-medium">Due Date</span>
                        </div>
                        <p className="text-ink-900">
                          {format(new Date(task.dueDate), 'PPP')}
                        </p>
                      </div>
                    )}

                    {/* Progress */}
                    {task.progress !== null && task.progress !== undefined && (
                      <div>
                        <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                          <CheckCircle size={16} />
                          <span className="font-medium">Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-ink-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-ink-900">{task.progress}%</span>
                        </div>
                      </div>
                    )}

                    {/* Created At */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                        <Clock size={16} />
                        <span className="font-medium">Created</span>
                      </div>
                      <p className="text-ink-900">
                        {format(new Date(task.createdAt), 'PPP')}
                      </p>
                    </div>

                    {/* Updated At */}
                    <div>
                      <div className="flex items-center gap-2 text-sm text-ink-500 mb-1">
                        <Clock size={16} />
                        <span className="font-medium">Last Updated</span>
                      </div>
                      <p className="text-ink-900">
                        {format(new Date(task.updatedAt), 'PPP')}
                      </p>
                    </div>
                  </div>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-ink-700 mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-2">
                        {task.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-ink-100 text-ink-700 rounded-full text-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'attachments' && (
                <div className="space-y-6">
                  <AttachmentUpload taskId={taskId} onUploadSuccess={handleUploadSuccess} />
                  <AttachmentList taskId={taskId} onAttachmentsChange={handleAttachmentsChange} />
                </div>
              )}

              {activeTab === 'comments' && (
                <div className="text-center py-8 text-ink-500">
                  <MessageSquare size={48} className="mx-auto mb-2 text-ink-300" />
                  <p>Comments section - To be implemented</p>
                </div>
              )}
            </div>
          </>
        ) : null}

        {/* Footer */}
        <div className="border-t border-ink-200 p-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-ink-700 bg-ink-100 rounded-lg hover:bg-ink-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
