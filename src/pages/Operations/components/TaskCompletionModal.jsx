import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Calendar,
  Award,
  Clock,
  Info,
  Upload,
  Image as ImageIcon,
  File,
  Link as LinkIcon
} from 'lucide-react';
import { updateTaskStatus } from '../../../services/taskService';

const TaskCompletionModal = ({ isOpen, onClose, task, onUpdate }) => {
  const [formData, setFormData] = useState({
    completionDate: '',
    completionNotes: '',
    deliverables: '',
    lessonsLearned: '',
    completionEvidence: []
  });

  const [newEvidenceUrl, setNewEvidenceUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      const today = new Date().toISOString().split('T')[0];
      setFormData({
        completionDate: today,
        completionNotes: '',
        deliverables: '',
        lessonsLearned: '',
        completionEvidence: []
      });
      setNewEvidenceUrl('');
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
      if (!formData.completionDate) {
        setError('Please select a completion date');
        setSubmitting(false);
        return;
      }

      if (!formData.completionNotes) {
        setError('Please provide completion notes describing what was accomplished');
        setSubmitting(false);
        return;
      }

      // Update task status to Completed
      const response = await updateTaskStatus(task.id, 'Completed');

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onUpdate) onUpdate();
          onClose();
        }, 1500);
      } else {
        setError(response.message || 'Failed to complete task');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while completing the task');
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

  const addEvidence = () => {
    if (newEvidenceUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        completionEvidence: [...prev.completionEvidence, newEvidenceUrl.trim()]
      }));
      setNewEvidenceUrl('');
    }
  };

  const removeEvidence = (index) => {
    setFormData(prev => ({
      ...prev,
      completionEvidence: prev.completionEvidence.filter((_, i) => i !== index)
    }));
  };

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
      <div className="bg-white rounded-lg shadow-lift w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Complete Task</h2>
              <p className="text-sm text-purple-100">{task.taskName}</p>
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
                <p className="text-sm text-green-700">Task completed successfully!</p>
              </div>
            </div>
          )}

          {/* Warning Notice */}
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-900 mb-1">Important</h4>
              <p className="text-sm text-yellow-700">
                Once you mark this task as completed, the status will be changed to "Completed" and it will be removed from your active tasks list.
                Please ensure all deliverables are completed before submitting.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Summary */}
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Task Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-purple-700 mb-1">Task Type:</p>
                  <p className="font-medium text-purple-900">{task.taskType}</p>
                </div>
                <div>
                  <p className="text-purple-700 mb-1">Priority:</p>
                  <p className="font-medium text-purple-900">{task.priority}</p>
                </div>
                <div>
                  <p className="text-purple-700 mb-1">Started:</p>
                  <p className="font-medium text-purple-900">{formatDate(task.startDate)}</p>
                </div>
                <div>
                  <p className="text-purple-700 mb-1">Due Date:</p>
                  <p className="font-medium text-purple-900">{formatDate(task.endDate)}</p>
                </div>
              </div>
            </div>

            {/* Completion Date */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Completion Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
                <input
                  type="date"
                  name="completionDate"
                  value={formData.completionDate}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Completion Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Completion Summary <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-ink-400 w-5 h-5" />
                <textarea
                  name="completionNotes"
                  value={formData.completionNotes}
                  onChange={handleChange}
                  rows={4}
                  required
                  placeholder="Summarize what was accomplished, key outcomes, and any important details..."
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
              <p className="text-xs text-ink-500 mt-1">
                Describe the work completed and the results achieved
              </p>
            </div>

            {/* Deliverables */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Deliverables & Outputs
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 text-ink-400 w-5 h-5" />
                <textarea
                  name="deliverables"
                  value={formData.deliverables}
                  onChange={handleChange}
                  rows={3}
                  placeholder="List the key deliverables produced (reports, documents, completed activities, etc.)..."
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
              <p className="text-xs text-ink-500 mt-1">
                What tangible outputs were created or delivered?
              </p>
            </div>

            {/* Lessons Learned */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Lessons Learned & Recommendations
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-ink-400 w-5 h-5" />
                <textarea
                  name="lessonsLearned"
                  value={formData.lessonsLearned}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Share any insights, challenges faced, or recommendations for future similar tasks..."
                  className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                />
              </div>
              <p className="text-xs text-ink-500 mt-1">
                What did you learn? What would you do differently next time?
              </p>
            </div>

            {/* Completion Evidence */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Evidence & Supporting Documents (Optional)
              </label>
              <div className="space-y-3">
                {/* Add Evidence URL */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-ink-400 w-5 h-5" />
                    <input
                      type="url"
                      placeholder="Enter URL to photo, document, or report..."
                      value={newEvidenceUrl}
                      onChange={(e) => setNewEvidenceUrl(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addEvidence}
                    disabled={!newEvidenceUrl.trim()}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {/* Evidence List */}
                {formData.completionEvidence.length > 0 && (
                  <div className="border border-ink-100 rounded-lg divide-y divide-ink-100">
                    {formData.completionEvidence.map((url, index) => (
                      <div key={index} className="p-3 flex items-center justify-between hover:bg-ink-50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                            <ImageIcon className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          ) : (
                            <File className="w-5 h-5 text-purple-600 flex-shrink-0" />
                          )}
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-purple-600 hover:text-purple-800 truncate"
                          >
                            {url}
                          </a>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvidence(index)}
                          className="ml-3 text-red-600 hover:text-red-800 flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-ink-500 mt-1">
                Add links to photos, documents, reports, or other evidence of task completion
              </p>
            </div>

            {/* Completion Checklist */}
            <div className="bg-ink-50 rounded-lg p-4 border border-ink-100">
              <h3 className="font-semibold text-ink-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-ink-600" />
                Completion Checklist
              </h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    checked={!!formData.completionDate}
                    readOnly
                  />
                  <span className="text-sm text-ink-700">Completion date selected</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    checked={!!formData.completionNotes}
                    readOnly
                  />
                  <span className="text-sm text-ink-700">Completion summary provided</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                    checked={formData.deliverables.length > 0 || formData.completionEvidence.length > 0}
                    readOnly
                  />
                  <span className="text-sm text-ink-700">Deliverables or evidence documented (recommended)</span>
                </label>
              </div>
            </div>
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
            disabled={submitting || !formData.completionDate || !formData.completionNotes}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Completing Task...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete Task
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionModal;
