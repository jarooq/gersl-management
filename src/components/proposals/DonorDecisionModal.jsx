import React, { useState } from 'react';
import { X, CheckCircle, XCircle, Calendar, MessageSquare, Paperclip, Upload, Loader, AlertCircle, FileText, Image, File } from 'lucide-react';

/**
 * Donor Decision Recording Modal
 * For recording donor approval/rejection decisions with supporting documentation
 */
const DonorDecisionModal = ({ proposal, decision, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    decision: decision, // 'approved' or 'rejected'
    donorResponseDate: new Date().toISOString().split('T')[0], // Today's date
    communicationChannel: '',
    comments: '',
    donorContactPerson: '',
    attachments: []
  });

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const communicationChannels = [
    'WhatsApp',
    'Email',
    'Phone Call',
    'In-Person Meeting',
    'Video Call (Zoom/Teams)',
    'Official Letter',
    'Other'
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = [];
    const invalidFiles = [];

    files.forEach(file => {
      // Max 5MB per file
      if (file.size > 5 * 1024 * 1024) {
        invalidFiles.push(`${file.name} (too large - max 5MB)`);
        return;
      }

      // Allowed types: images, PDFs, Word docs
      const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name} (unsupported type)`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        attachments: `Some files were rejected: ${invalidFiles.join(', ')}`
      }));
    }

    if (validFiles.length > 0) {
      // Add to attachments
      const newAttachments = validFiles.map(file => ({
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: URL.createObjectURL(file)
      }));

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...newAttachments]
      }));
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <Image size={20} className="text-blue-600" />;
    if (type === 'application/pdf') return <FileText size={20} className="text-red-600" />;
    return <File size={20} className="text-ink-600" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.donorResponseDate) {
      newErrors.donorResponseDate = 'Response date is required';
    }

    if (!formData.communicationChannel) {
      newErrors.communicationChannel = 'Communication channel is required';
    }

    if (!formData.comments || formData.comments.trim().length === 0) {
      newErrors.comments = 'Comments/explanation is required';
    }

    if (formData.comments && formData.comments.length < 10) {
      newErrors.comments = 'Please provide more detailed comments (min 10 characters)';
    }

    if (!formData.donorContactPerson || formData.donorContactPerson.trim().length === 0) {
      newErrors.donorContactPerson = 'Donor contact person name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      // In production, would upload files first, then submit with file URLs
      await onSubmit({
        ...formData,
        proposalId: proposal.id,
        proposalCode: proposal.proposalCode,
        recordedBy: 'Current User', // Would come from auth context
        recordedAt: new Date().toISOString()
      });

      onClose();
    } catch (error) {
      setErrors({
        submit: error.message || 'Failed to record donor decision. Please try again.'
      });
      setSubmitting(false);
    }
  };

  const isApproved = decision === 'approved';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className={`${isApproved ? 'bg-navy-900' : 'bg-navy-900'} text-white p-6 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            {isApproved ? <CheckCircle size={32} /> : <XCircle size={32} />}
            <div>
              <h2 className="text-2xl font-bold">
                Record Donor {isApproved ? 'Approval' : 'Rejection'}
              </h2>
              <p className={`text-sm ${isApproved ? 'text-green-100' : 'text-red-100'}`}>
                {proposal.proposalCode} - {proposal.donor}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {errors.submit && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 m-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{errors.submit}</p>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Decision Summary */}
          <div className={`${isApproved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
            <p className={`text-sm ${isApproved ? 'text-green-800' : 'text-red-800'}`}>
              You are recording that <strong>{proposal.donor}</strong> has <strong>{isApproved ? 'APPROVED' : 'REJECTED'}</strong> this proposal.
              Please provide the details below to maintain an accurate audit trail.
            </p>
          </div>

          {/* Response Date */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Donor Response Date *
            </label>
            <input
              type="date"
              value={formData.donorResponseDate}
              onChange={(e) => handleInputChange('donorResponseDate', e.target.value)}
              max={new Date().toISOString().split('T')[0]} // Can't be in future
              className={`w-full px-4 py-2 border ${errors.donorResponseDate ? 'border-red-500' : 'border-ink-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              required
            />
            {errors.donorResponseDate && (
              <p className="text-xs text-red-600 mt-1">{errors.donorResponseDate}</p>
            )}
            <p className="text-xs text-ink-500 mt-1">
              When did the donor communicate their decision?
            </p>
          </div>

          {/* Communication Channel */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Communication Channel *
            </label>
            <select
              value={formData.communicationChannel}
              onChange={(e) => handleInputChange('communicationChannel', e.target.value)}
              className={`w-full px-4 py-2 border ${errors.communicationChannel ? 'border-red-500' : 'border-ink-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              required
            >
              <option value="">Select channel...</option>
              {communicationChannels.map(channel => (
                <option key={channel} value={channel}>{channel}</option>
              ))}
            </select>
            {errors.communicationChannel && (
              <p className="text-xs text-red-600 mt-1">{errors.communicationChannel}</p>
            )}
            <p className="text-xs text-ink-500 mt-1">
              How did the donor communicate their decision?
            </p>
          </div>

          {/* Donor Contact Person */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              Donor Contact Person *
            </label>
            <input
              type="text"
              value={formData.donorContactPerson}
              onChange={(e) => handleInputChange('donorContactPerson', e.target.value)}
              placeholder="e.g., John Smith, Programme Manager"
              className={`w-full px-4 py-2 border ${errors.donorContactPerson ? 'border-red-500' : 'border-ink-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              required
            />
            {errors.donorContactPerson && (
              <p className="text-xs text-red-600 mt-1">{errors.donorContactPerson}</p>
            )}
            <p className="text-xs text-ink-500 mt-1">
              Who from the donor organization communicated this decision?
            </p>
          </div>

          {/* Comments/Explanation */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              <MessageSquare size={16} className="inline mr-1" />
              Comments / Explanation *
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              placeholder={isApproved
                ? "E.g., Donor approved via WhatsApp on [date]. They expressed strong interest in the education component and confirmed funding will be available in Q2. Next steps: Sign MOU and begin project initiation."
                : "E.g., Donor rejected via email on [date]. Reason stated: 'Project does not align with our current funding priorities for health sector.' Feedback: Consider reframing proposal to emphasize health outcomes and resubmit next funding cycle."
              }
              className={`w-full px-4 py-2 border ${errors.comments ? 'border-red-500' : 'border-ink-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
              rows={5}
              required
            />
            {errors.comments && (
              <p className="text-xs text-red-600 mt-1">{errors.comments}</p>
            )}
            <p className="text-xs text-ink-500 mt-1">
              {formData.comments.length}/1000 characters
              {isApproved
                ? " - Include any conditions, next steps, or special notes from the donor"
                : " - Include the reason for rejection and any feedback provided by the donor"
              }
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              <Paperclip size={16} className="inline mr-1" />
              Attach Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-ink-300 rounded-lg p-6 text-center hover:border-indigo-500 transition">
              <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading || submitting}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Upload size={32} className="text-ink-400" />
                <p className="text-sm text-ink-600">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-ink-500">
                  Screenshots, emails, PDFs, or documents (max 5MB each)
                </p>
              </label>
            </div>
            {errors.attachments && (
              <p className="text-xs text-red-600 mt-1">{errors.attachments}</p>
            )}

            {/* Attached Files */}
            {formData.attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-ink-700">
                  Attached Files ({formData.attachments.length})
                </p>
                {formData.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg border border-ink-200">
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {formatFileSize(attachment.size)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAttachment(index)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                      disabled={submitting}
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Attach screenshots of WhatsApp messages, email confirmations,
              or official letters to maintain a complete record of the donor's decision. This helps with
              audits and future reference.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-200 p-4 flex justify-between items-center gap-3">
          <p className="text-xs text-ink-600">
            * Required fields must be completed
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex items-center gap-2 px-6 py-2 ${isApproved ? 'bg-navy-900 ' : 'bg-navy-900 '} text-white rounded-lg transition font-semibold shadow-card hover:shadow-lift disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {submitting ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  {isApproved ? <CheckCircle size={20} /> : <XCircle size={20} />}
                  Record {isApproved ? 'Approval' : 'Rejection'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorDecisionModal;
