import React, { useState } from 'react';
import { X, MessageSquare, Calendar, User } from 'lucide-react';

const AddCommunicationModal = ({ isOpen, onClose, onAdd, partners }) => {
  const [formData, setFormData] = useState({
    partnerId: '',
    partnerName: '',
    type: 'Email',
    subject: '',
    summary: '',
    contactedBy: '',
    outcome: 'Positive',
    nextFollowUp: '',
    notes: ''
  });

  const communicationTypes = [
    'Email',
    'Phone Call',
    'Meeting',
    'Video Conference',
    'Site Visit',
    'Report Submission',
    'Proposal Discussion'
  ];

  const outcomes = [
    'Positive',
    'Neutral',
    'Follow-up Required',
    'Action Needed',
    'Completed'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'partnerId') {
      const partner = partners.find(p => p.id === parseInt(value));
      setFormData(prev => ({
        ...prev,
        partnerId: value,
        partnerName: partner ? partner.name : ''
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({
      ...formData,
      partnerId: parseInt(formData.partnerId),
      date: new Date().toISOString().split('T')[0]
    });
    setFormData({
      partnerId: '',
      partnerName: '',
      type: 'Email',
      subject: '',
      summary: '',
      contactedBy: '',
      outcome: 'Positive',
      nextFollowUp: '',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Log Communication</h2>
              <p className="text-blue-100 text-sm">Record partner interaction or follow-up</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Partner Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Partner/Donor *
              </label>
              <select
                name="partnerId"
                value={formData.partnerId}
                onChange={handleChange}
                required
                className="input-modern w-full"
              >
                <option value="">Select a partner...</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
              {partners.length === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  No partners available. Please add a partner first.
                </p>
              )}
            </div>

            {/* Type and Contacted By */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                >
                  {communicationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contacted By *
                </label>
                <input
                  type="text"
                  name="contactedBy"
                  value={formData.contactedBy}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject/Topic *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="input-modern w-full"
                placeholder="e.g., Quarterly Report Discussion, Funding Renewal, Partnership Review"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary/Key Points *
              </label>
              <textarea
                name="summary"
                value={formData.summary}
                onChange={handleChange}
                required
                rows={4}
                className="input-modern w-full"
                placeholder="Brief summary of the conversation, key decisions, action items, etc."
              />
            </div>

            {/* Outcome and Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome
                </label>
                <select
                  name="outcome"
                  value={formData.outcome}
                  onChange={handleChange}
                  className="input-modern w-full"
                >
                  {outcomes.map(outcome => (
                    <option key={outcome} value={outcome}>{outcome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Next Follow-up Date
                </label>
                <input
                  type="date"
                  name="nextFollowUp"
                  value={formData.nextFollowUp}
                  onChange={handleChange}
                  className="input-modern w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-modern w-full"
                placeholder="Attachments, references, commitments made, etc."
              />
            </div>

            {/* Info Box */}
            {formData.nextFollowUp && (
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="text-blue-600" size={16} />
                  <span className="font-medium text-gray-900">
                    Follow-up reminder set for{' '}
                    <span className="font-bold text-blue-600">
                      {new Date(formData.nextFollowUp).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={partners.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Log Communication
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCommunicationModal;
