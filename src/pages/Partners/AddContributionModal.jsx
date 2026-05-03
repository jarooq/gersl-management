import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Tag } from 'lucide-react';

const AddContributionModal = ({ isOpen, onClose, onAdd, partners }) => {
  const [formData, setFormData] = useState({
    partnerId: '',
    partnerName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Grant',
    purpose: '',
    projectName: '',
    restrictions: 'Unrestricted',
    currency: 'LKR',
    notes: ''
  });

  const contributionTypes = [
    'Grant',
    'Donation',
    'In-Kind',
    'Partnership',
    'Technology Grant',
    'Sponsorship',
    'Emergency Funding'
  ];

  const restrictions = [
    'Unrestricted',
    'Project-Specific',
    'Program-Specific',
    'Area-Specific',
    'Time-Bound'
  ];

  const currencies = ['LKR', 'USD', 'EUR', 'GBP', 'AUD'];

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
      amount: parseFloat(formData.amount)
    });
    setFormData({
      partnerId: '',
      partnerName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      type: 'Grant',
      purpose: '',
      projectName: '',
      restrictions: 'Unrestricted',
      currency: 'LKR',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <DollarSign size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add Contribution</h2>
              <p className="text-green-100 text-sm">Record a new donation or funding</p>
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
              <label className="block text-sm font-medium text-ink-700 mb-2">
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
                    {partner.name} ({partner.category})
                  </option>
                ))}
              </select>
              {partners.length === 0 && (
                <p className="text-sm text-orange-600 mt-1">
                  No partners available. Please add a partner first.
                </p>
              )}
            </div>

            {/* Amount and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  className="input-modern w-full"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Currency *
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date and Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Contribution Date *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="input-modern w-full"
                >
                  {contributionTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Purpose and Project */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Purpose/Description *
              </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleChange}
                required
                className="input-modern w-full"
                placeholder="e.g., Education Program Support, Emergency Relief, Infrastructure Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Project Name (if applicable)
              </label>
              <input
                type="text"
                name="projectName"
                value={formData.projectName}
                onChange={handleChange}
                className="input-modern w-full"
                placeholder="Link to specific project"
              />
            </div>

            {/* Restrictions */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Funding Restrictions
              </label>
              <select
                name="restrictions"
                value={formData.restrictions}
                onChange={handleChange}
                className="input-modern w-full"
              >
                {restrictions.map(rest => (
                  <option key={rest} value={rest}>{rest}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="input-modern w-full"
                placeholder="Payment method, receipt details, special conditions, etc."
              />
            </div>

            {/* Summary Box */}
            {formData.amount && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-bold text-ink-900 mb-2">Contribution Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-ink-600">Amount:</span>
                    <span className="font-bold text-green-600">
                      {formData.currency} {parseFloat(formData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {formData.partnerName && (
                    <div className="flex justify-between">
                      <span className="text-ink-600">From:</span>
                      <span className="font-semibold text-ink-900">{formData.partnerName}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-ink-600">Type:</span>
                    <span className="font-medium text-ink-700">{formData.type}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-ink-100 text-ink-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={partners.length === 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddContributionModal;
