import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Users } from 'lucide-react';
import { updateTask } from '../../../services/taskService';
import * as API from '../../../services/api';

const EditTaskModal = ({ task, isOpen, onClose, onTaskUpdated, projectTeamMembers = null }) => {
  // No longer need staff from HRContext - we use project team members directly
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dynamicProjectTeamMembers, setDynamicProjectTeamMembers] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Not Started',
    startDate: '',
    dueDate: '',
    assignedTo: '',
    assignedUsers: [], // Multi-staff assignment
    progress: 0
  });

  useEffect(() => {
    if (task && isOpen) {
      // Format dates for input fields
      const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
      };

      // Extract assigned user IDs from task.assignees array
      const assignedUserIds = task.assignees && Array.isArray(task.assignees)
        ? task.assignees.map(a => a.userId || a.user?.id).filter(Boolean)
        : [];

      setFormData({
        title: task.title || task.name || '',
        description: task.description || '',
        priority: task.priority || 'Medium',
        status: task.status || 'Not Started',
        startDate: formatDate(task.startDate),
        dueDate: formatDate(task.dueDate || task.endDate),
        assignedTo: task.assignedTo || '',
        assignedUsers: assignedUserIds,
        progress: task.progress || 0
      });

      // Fetch project team members if task has a projectId and projectTeamMembers prop is not provided
      if (task.projectId && !projectTeamMembers) {
        const fetchProjectTeamMembers = async () => {
          try {
            const response = await API.ProjectAPI.getById(task.projectId);
            if (response && response.teamMembers) {
              setDynamicProjectTeamMembers(response.teamMembers);
            } else {
              setDynamicProjectTeamMembers([]);
            }
          } catch (error) {
            console.error('Error fetching project team members:', error);
            setDynamicProjectTeamMembers([]);
          }
        };
        fetchProjectTeamMembers();
      } else if (!task.projectId) {
        setDynamicProjectTeamMembers(null);
      }
    }
  }, [task, isOpen, projectTeamMembers]);

  const handleAssignedUserToggle = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: prev.assignedUsers.includes(userId)
        ? prev.assignedUsers.filter(id => id !== userId)
        : [...prev.assignedUsers, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      // Include assignedUsers in the update payload
      const updateData = {
        ...formData,
        assignedUsers: formData.assignedUsers.length > 0 ? formData.assignedUsers : []
      };
      await updateTask(task.id, updateData);

      if (onTaskUpdated) {
        onTaskUpdated();
      }
      onClose();
    } catch (err) {
      console.error('Error updating task:', err);
      setError(err.message || 'Failed to update task');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-600 to-gray-800 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Edit Task</h2>
              <p className="text-gray-200 text-sm">Update task details</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">Error</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Task Title */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Task Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter task title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter task description"
            />
          </div>

          {/* Priority and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Assigned Staff Members (Multi-select) */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-3">
              <Users className="inline mr-2" size={18} />
              Assigned Staff Members (Multiple Selection)
              {!task?.projectId && (
                <span className="ml-2 text-xs text-amber-600">(Select a project to filter staff)</span>
              )}
              {task?.projectId && (
                <span className="ml-2 text-xs text-ink-500">(Project Team Members Only)</span>
              )}
            </label>
            <div className="border border-ink-200 rounded-lg p-4 max-h-64 overflow-y-auto bg-ink-50">
              {(() => {
                // Use either prop-provided or dynamically fetched project team members
                const effectiveProjectTeamMembers = projectTeamMembers || dynamicProjectTeamMembers;

                // Show team members directly from the project (no need to match with staff table)
                // Team members already have user information from the API
                const availableMembers = effectiveProjectTeamMembers && effectiveProjectTeamMembers.length > 0
                  ? effectiveProjectTeamMembers
                  : []; // Return empty array if no project selected or no team members

                return availableMembers && availableMembers.length > 0 ? (
                  <div className="space-y-2">
                    {availableMembers.map(teamMember => {
                      // Use userId from team member (this is the user_id from project_team_members table)
                      const userId = teamMember.userId;
                      const userName = teamMember.user?.fullName || teamMember.user?.username || 'Unknown User';
                      const userRole = teamMember.role || teamMember.user?.position || teamMember.user?.role || '';

                      return (
                        <label
                          key={teamMember.id}
                          className="flex items-center p-3 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-indigo-200"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedUsers.includes(userId)}
                            onChange={() => handleAssignedUserToggle(userId)}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-ink-200"
                          />
                          <span className="ml-3 text-sm font-medium text-ink-900">
                            {userName}
                          </span>
                          {userRole && (
                            <span className="ml-auto text-xs text-ink-500">{userRole}</span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-center py-4">
                    {!effectiveProjectTeamMembers || effectiveProjectTeamMembers.length === 0 ? (
                      <div className="text-ink-500">
                        <p className="font-semibold">No project team members</p>
                        <p className="text-xs mt-1">This project has no assigned team members</p>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
            {formData.assignedUsers.length > 0 && (
              <p className="mt-2 text-sm text-indigo-600">
                {formData.assignedUsers.length} staff member(s) selected
              </p>
            )}
          </div>

          {/* Progress */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Progress: {formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${formData.progress}%` }}
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-4 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
                loading
                  ? 'bg-gray-300 text-ink-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-gray-600 to-gray-800 text-white hover:from-gray-700 hover:to-gray-900'
              }`}
            >
              <Save size={18} />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
