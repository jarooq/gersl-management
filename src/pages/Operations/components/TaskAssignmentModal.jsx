import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  User,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Search,
  Users,
  Briefcase,
  Mail,
  Phone
} from 'lucide-react';
import { useHR } from '../../../contexts/HRContext';
import { assignTask } from '../../../services/taskService';

const TaskAssignmentModal = ({ isOpen, onClose, task, onUpdate }) => {
  const { staff } = useHR();

  const [formData, setFormData] = useState({
    assignedTo: '',
    dueDate: '',
    priority: 'Medium',
    assignmentNotes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      // Pre-fill form if task is already assigned
      setFormData({
        assignedTo: task.assignedTo || '',
        dueDate: task.endDate ? task.endDate.split('T')[0] : '',
        priority: task.priority || 'Medium',
        assignmentNotes: task.assignmentNotes || ''
      });

      if (task.assignedTo) {
        const assignedStaff = staff.find(s => s.id === task.assignedTo);
        setSelectedStaff(assignedStaff || null);
      } else {
        setSelectedStaff(null);
      }
      setSearchTerm('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, task, staff]);

  if (!isOpen || !task) return null;

  // Filter staff based on search
  const filteredStaff = staff.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const position = (s.position || '').toLowerCase();
    const department = (s.department || '').toLowerCase();

    return fullName.includes(searchLower) ||
           position.includes(searchLower) ||
           department.includes(searchLower) ||
           (s.email || '').toLowerCase().includes(searchLower);
  });

  const handleStaffSelect = (staffMember) => {
    setSelectedStaff(staffMember);
    setFormData(prev => ({
      ...prev,
      assignedTo: staffMember.id
    }));
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!formData.assignedTo) {
        setError('Please select a staff member to assign this task to');
        setSubmitting(false);
        return;
      }

      if (!formData.dueDate) {
        setError('Please set a due date for this task');
        setSubmitting(false);
        return;
      }

      const response = await assignTask(task.id, {
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        priority: formData.priority,
        assignmentNotes: formData.assignmentNotes
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to assign task');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while assigning the task');
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

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800 border-green-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Urgent': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-ink-100 text-ink-800 border-ink-100';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lift w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-orange-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserPlus className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Assign Task</h2>
              <p className="text-sm text-blue-100">{task.taskName}</p>
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
                <p className="text-sm text-green-700">Task assigned successfully!</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Information */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Task Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Task Type:</p>
                  <p className="text-sm font-medium text-blue-900">{task.taskType}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Distribution Type:</p>
                  <p className="text-sm font-medium text-blue-900">{task.distributionType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">Start Date:</p>
                  <p className="text-sm font-medium text-blue-900">
                    {task.startDate ? new Date(task.startDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 mb-1">End Date:</p>
                  <p className="text-sm font-medium text-blue-900">
                    {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Assign To <span className="text-red-500">*</span>
              </label>

              {/* Selected Staff Display */}
              {selectedStaff ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-ink-900">
                          {selectedStaff.firstName} {selectedStaff.lastName}
                        </p>
                        <p className="text-sm text-ink-600">{selectedStaff.position || 'Staff Member'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          {selectedStaff.email && (
                            <div className="flex items-center gap-1 text-xs text-ink-500">
                              <Mail className="w-3 h-3" />
                              {selectedStaff.email}
                            </div>
                          )}
                          {selectedStaff.phoneNumber && (
                            <div className="flex items-center gap-1 text-xs text-ink-500">
                              <Phone className="w-3 h-3" />
                              {selectedStaff.phoneNumber}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStaff(null);
                        setFormData(prev => ({ ...prev, assignedTo: '' }));
                      }}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Search Box */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search staff by name, position, department, or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  {/* Staff List */}
                  <div className="border border-ink-100 rounded-lg max-h-64 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <div className="p-8 text-center text-ink-500">
                        <Users className="w-12 h-12 mx-auto mb-3 text-ink-400" />
                        <p>No staff members found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-ink-100">
                        {filteredStaff.map((staffMember) => (
                          <button
                            key={staffMember.id}
                            type="button"
                            onClick={() => handleStaffSelect(staffMember)}
                            className="w-full p-4 hover:bg-blue-50 transition-colors text-left flex items-center gap-3"
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-ink-900">
                                {staffMember.firstName} {staffMember.lastName}
                              </p>
                              <p className="text-sm text-ink-600">{staffMember.position || 'Staff Member'}</p>
                              {staffMember.department && (
                                <p className="text-xs text-ink-500">{staffMember.department}</p>
                              )}
                            </div>
                            <div className="text-right text-xs text-ink-500">
                              {staffMember.email && <div>{staffMember.email}</div>}
                              {staffMember.phoneNumber && <div>{staffMember.phoneNumber}</div>}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Due Date and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
                  <input
                    type="date"
                    name="dueDate"
                    value={formData.dueDate}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
                <div className="mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                    {formData.priority} Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Assignment Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Assignment Notes (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-ink-400 w-5 h-5" />
                <textarea
                  name="assignmentNotes"
                  value={formData.assignmentNotes}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Add any specific instructions or notes for the assigned staff member..."
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Assignment Summary */}
            {selectedStaff && formData.dueDate && (
              <div className="bg-ink-50 rounded-lg p-4 border border-ink-100">
                <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  Assignment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Task:</span>
                    <span className="font-medium text-ink-900">{task.taskName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Assigned To:</span>
                    <span className="font-medium text-ink-900">
                      {selectedStaff.firstName} {selectedStaff.lastName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Due Date:</span>
                    <span className="font-medium text-ink-900">
                      {new Date(formData.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink-600">Priority:</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(formData.priority)}`}>
                      {formData.priority}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-100 px-6 py-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-white border border-ink-200 rounded-lg hover:bg-ink-50 transition-colors text-sm font-medium text-ink-700 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !selectedStaff || !formData.dueDate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Assign Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskAssignmentModal;
