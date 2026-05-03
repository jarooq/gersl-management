import React, { useState } from 'react';
import { X, TrendingUp, Save, AlertCircle } from 'lucide-react';
import { useMEAL } from '../../contexts/MEALContext';

const UpdateIndicatorModal = ({ indicator, onClose }) => {
  const { updateIndicator } = useMEAL();
  const [formData, setFormData] = useState({
    current: indicator.current || 0,
    status: indicator.status || 'On Track',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const progress = indicator.target > 0 ? (formData.current / indicator.target) * 100 : 0;

  const getProgressColor = () => {
    if (progress >= 100) return 'text-green-600';
    if (progress >= 75) return 'text-blue-600';
    if (progress >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getProgressBarColor = () => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      await updateIndicator(indicator.id, {
        current: parseFloat(formData.current),
        status: formData.status
      });
      onClose();
    } catch (error) {
      console.error('Error updating indicator:', error);
      alert('Failed to update indicator. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full">
        {/* Header */}
        <div className="bg-navy-900 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">Update Indicator</h2>
              <p className="text-blue-100 text-sm">Record progress measurement</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Indicator Info */}
          <div className="bg-ink-50 border border-ink-200 rounded-lg p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="text-blue-600" size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-ink-600 mb-1">{indicator.code}</p>
                <h3 className="font-bold text-ink-900 mb-2">{indicator.name}</h3>
                {indicator.description && (
                  <p className="text-sm text-ink-600">{indicator.description}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-ink-200">
              <div>
                <p className="text-xs text-ink-600 mb-1">Baseline</p>
                <p className="font-bold text-ink-900">{indicator.baseline} {indicator.unit}</p>
              </div>
              <div>
                <p className="text-xs text-ink-600 mb-1">Current</p>
                <p className="font-bold text-blue-600">{indicator.current} {indicator.unit}</p>
              </div>
              <div>
                <p className="text-xs text-ink-600 mb-1">Target</p>
                <p className="font-bold text-ink-900">{indicator.target} {indicator.unit}</p>
              </div>
            </div>
          </div>

          {/* Update Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                New Measurement Value *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.current}
                  onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                  className="input-modern w-full pr-20"
                  placeholder="Enter new value"
                  step="0.01"
                  min="0"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-500 font-medium">
                  {indicator.unit}
                </span>
              </div>
              <p className="text-xs text-ink-500 mt-1">
                Enter the latest measurement for this indicator
              </p>
            </div>

            {/* Progress Visualization */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-ink-700">Progress to Target</p>
                <p className={`text-2xl font-bold ${getProgressColor()}`}>
                  {progress.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-ink-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full ${getProgressBarColor()} transition-all duration-500 rounded-full`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-ink-600">
                <span>Baseline: {indicator.baseline}</span>
                <span>Current: {formData.current}</span>
                <span>Target: {indicator.target}</span>
              </div>
            </div>

            {/* Status Update */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input-modern w-full"
              >
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Off Track">Off Track</option>
                <option value="Achieved">Achieved</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input-modern w-full"
                rows={3}
                placeholder="Add context about this measurement, data sources, or any observations..."
              />
            </div>

            {/* Warning if value is unusual */}
            {parseFloat(formData.current) > indicator.target * 1.5 && (
              <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    Value exceeds target significantly
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    The entered value is {((formData.current / indicator.target) * 100).toFixed(0)}% of the target.
                    Please verify this measurement is correct.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-200 p-4 rounded-b-2xl flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !formData.current}
            className={`px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              submitting || !formData.current
                ? 'bg-ink-300 text-ink-500 cursor-not-allowed'
                : 'bg-navy-900 text-white '
            }`}
          >
            <Save size={18} />
            {submitting ? 'Saving...' : 'Save Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateIndicatorModal;
