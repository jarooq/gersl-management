import React, { useState, useEffect } from 'react';
import { useHR } from '../../../contexts/HRContext';
import {
  createAggregateDistribution,
  getAggregateDistributionByTask,
  updateAggregateDistribution
} from '../../../services/aggregateDistributionService';
import {
  X,
  CheckCircle,
  AlertCircle,
  Users,
  Calendar,
  MapPin,
  Camera,
  Video,
  UserCheck,
  Loader,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

const AggregateDistributionModal = ({ isOpen, onClose, task, onDistributionSaved }) => {
  const { staff } = useHR();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [existingDistribution, setExistingDistribution] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const [formData, setFormData] = useState({
    distributionDate: '',
    totalBeneficiaries: '',
    demographicBreakdown: {
      male: '',
      female: '',
      children: '',
      elderly: ''
    },
    itemsDistributed: [
      { item: '', quantity: '' }
    ],
    photos: [],
    videos: [],
    distributedBy: [],
    mediaTeamPresent: [],
    distributionNotes: ''
  });

  useEffect(() => {
    if (isOpen && task) {
      loadExistingDistribution();
      // Pre-fill distribution date from task if available
      if (task.distributionDate && !formData.distributionDate) {
        setFormData(prev => ({
          ...prev,
          distributionDate: task.distributionDate.split('T')[0]
        }));
      }
    }
  }, [isOpen, task]);

  const loadExistingDistribution = async () => {
    if (!task?.id) return;

    try {
      const response = await getAggregateDistributionByTask(task.id);
      if (response.success && response.data) {
        const dist = response.data;
        setExistingDistribution(dist);
        setIsEditMode(true);

        // Populate form with existing data
        setFormData({
          distributionDate: dist.distributionDate?.split('T')[0] || '',
          totalBeneficiaries: dist.totalBeneficiaries || '',
          demographicBreakdown: dist.demographicBreakdown || {
            male: '',
            female: '',
            children: '',
            elderly: ''
          },
          itemsDistributed: dist.itemsDistributed?.length > 0
            ? dist.itemsDistributed
            : [{ item: '', quantity: '' }],
          photos: dist.photos || [],
          videos: dist.videos || [],
          distributedBy: dist.distributedBy || [],
          mediaTeamPresent: dist.mediaTeamPresent || [],
          distributionNotes: dist.distributionNotes || ''
        });
      }
    } catch (err) {
      console.error('Error loading distribution:', err);
      // Not an error if distribution doesn't exist yet
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDemographicChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      demographicBreakdown: {
        ...prev.demographicBreakdown,
        [name]: value
      }
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.itemsDistributed];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      itemsDistributed: updatedItems
    }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      itemsDistributed: [...prev.itemsDistributed, { item: '', quantity: '' }]
    }));
  };

  const removeItem = (index) => {
    if (formData.itemsDistributed.length > 1) {
      setFormData(prev => ({
        ...prev,
        itemsDistributed: prev.itemsDistributed.filter((_, i) => i !== index)
      }));
    }
  };

  const handleStaffToggle = (staffId, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(staffId)
        ? prev[field].filter(id => id !== staffId)
        : [...prev[field], staffId]
    }));
  };

  const handlePhotoUrlAdd = () => {
    const url = prompt('Enter photo URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, url]
      }));
    }
  };

  const handleVideoUrlAdd = () => {
    const url = prompt('Enter video URL:');
    if (url) {
      setFormData(prev => ({
        ...prev,
        videos: [...prev.videos, url]
      }));
    }
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = (index) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    if (!formData.distributionDate) {
      setError('Distribution date is required');
      return false;
    }

    if (!formData.totalBeneficiaries || formData.totalBeneficiaries <= 0) {
      setError('Total beneficiaries must be greater than 0');
      return false;
    }

    // Validate demographic breakdown adds up to total
    const { male, female, children, elderly } = formData.demographicBreakdown;
    const demographicTotal = (parseInt(male) || 0) + (parseInt(female) || 0) +
                            (parseInt(children) || 0) + (parseInt(elderly) || 0);

    if (demographicTotal > 0 && demographicTotal !== parseInt(formData.totalBeneficiaries)) {
      setError(`Demographic breakdown (${demographicTotal}) must equal total beneficiaries (${formData.totalBeneficiaries})`);
      return false;
    }

    // Validate items
    const validItems = formData.itemsDistributed.filter(item => item.item && item.quantity);
    if (validItems.length === 0) {
      setError('At least one item with quantity is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      // Clean up demographic breakdown - only include non-empty values
      const cleanDemographics = {};
      Object.keys(formData.demographicBreakdown).forEach(key => {
        const value = formData.demographicBreakdown[key];
        if (value && value !== '') {
          cleanDemographics[key] = parseInt(value);
        }
      });

      // Clean up items - only include valid items
      const validItems = formData.itemsDistributed
        .filter(item => item.item && item.quantity)
        .map(item => ({
          item: item.item,
          quantity: parseInt(item.quantity)
        }));

      const distributionData = {
        distributionDate: formData.distributionDate,
        totalBeneficiaries: parseInt(formData.totalBeneficiaries),
        demographicBreakdown: Object.keys(cleanDemographics).length > 0 ? cleanDemographics : null,
        itemsDistributed: validItems,
        photos: formData.photos.filter(p => p),
        videos: formData.videos.filter(v => v),
        distributedBy: formData.distributedBy,
        mediaTeamPresent: formData.mediaTeamPresent,
        distributionNotes: formData.distributionNotes || null
      };

      let response;
      if (isEditMode && existingDistribution) {
        // Update existing distribution
        response = await updateAggregateDistribution(existingDistribution.id, distributionData);
        setSuccessMessage('Distribution updated successfully');
      } else {
        // Create new distribution
        response = await createAggregateDistribution(task.id, distributionData);
        setSuccessMessage('Distribution recorded successfully');
      }

      if (response.success) {
        onDistributionSaved?.(response.data);

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error saving distribution:', err);
      setError(err.message || 'Failed to save distribution record');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-navy-900 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-1">
                {isEditMode ? 'Update' : 'Record'} Aggregate Distribution
              </h2>
              <p className="text-green-100">{task?.title}</p>
              {task?.distributionLocation && (
                <p className="text-sm text-green-100 mt-1 flex items-center gap-1">
                  <MapPin size={14} />
                  {task.distributionLocation}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-green-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Distribution Details */}
          <div>
            <h3 className="text-lg font-bold text-ink-900 mb-4">Distribution Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Distribution Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="distributionDate"
                  value={formData.distributionDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Total Beneficiaries <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="totalBeneficiaries"
                  value={formData.totalBeneficiaries}
                  onChange={handleInputChange}
                  placeholder="e.g., 500"
                  min="1"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Demographic Breakdown */}
          <div>
            <h3 className="text-lg font-bold text-ink-900 mb-2">Demographic Breakdown (Optional)</h3>
            <p className="text-sm text-ink-600 mb-4">Total must equal {formData.totalBeneficiaries || '0'} beneficiaries</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Male</label>
                <input
                  type="number"
                  name="male"
                  value={formData.demographicBreakdown.male}
                  onChange={handleDemographicChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Female</label>
                <input
                  type="number"
                  name="female"
                  value={formData.demographicBreakdown.female}
                  onChange={handleDemographicChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Children</label>
                <input
                  type="number"
                  name="children"
                  value={formData.demographicBreakdown.children}
                  onChange={handleDemographicChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Elderly</label>
                <input
                  type="number"
                  name="elderly"
                  value={formData.demographicBreakdown.elderly}
                  onChange={handleDemographicChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {/* Items Distributed */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-ink-900">Items Distributed <span className="text-red-500">*</span></h3>
              <button
                onClick={addItem}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>
            <div className="space-y-3">
              {formData.itemsDistributed.map((item, index) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                    placeholder="Item name (e.g., Ifthar meal package)"
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                    min="1"
                    className="w-32 px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {formData.itemsDistributed.length > 1 && (
                    <button
                      onClick={() => removeItem(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Distributed By */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-3 flex items-center gap-2">
                <UserCheck size={20} />
                Distributed By
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {staff?.map(member => (
                  <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-ink-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.distributedBy.includes(member.id)}
                      onChange={() => handleStaffToggle(member.id, 'distributedBy')}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-ink-900">
                      {member.name || `${member.firstName} ${member.lastName}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Media Team */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-3 flex items-center gap-2">
                <Camera size={20} />
                Media Team Present
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {staff?.filter(m => m.department === 'Media' || m.role?.includes('Media')).map(member => (
                  <label key={member.id} className="flex items-center gap-2 p-2 hover:bg-ink-50 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mediaTeamPresent.includes(member.id)}
                      onChange={() => handleStaffToggle(member.id, 'mediaTeamPresent')}
                      className="w-4 h-4 text-green-600 rounded"
                    />
                    <span className="text-sm text-ink-900">
                      {member.name || `${member.firstName} ${member.lastName}`}
                    </span>
                  </label>
                ))}
                {staff?.filter(m => m.department === 'Media').length === 0 && (
                  <p className="text-sm text-ink-500 italic">No media team members found</p>
                )}
              </div>
            </div>
          </div>

          {/* Media Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <ImageIcon size={20} />
                  Photos ({formData.photos.length})
                </h3>
                <button
                  onClick={handlePhotoUrlAdd}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-semibold"
                >
                  Add URL
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.photos.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-ink-50 rounded-lg">
                    <span className="text-sm text-ink-700 truncate flex-1">{url}</span>
                    <button
                      onClick={() => removePhoto(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {formData.photos.length === 0 && (
                  <p className="text-sm text-ink-500 italic">No photos added</p>
                )}
              </div>
            </div>

            {/* Videos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Video size={20} />
                  Videos ({formData.videos.length})
                </h3>
                <button
                  onClick={handleVideoUrlAdd}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-semibold"
                >
                  Add URL
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {formData.videos.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-ink-50 rounded-lg">
                    <span className="text-sm text-ink-700 truncate flex-1">{url}</span>
                    <button
                      onClick={() => removeVideo(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {formData.videos.length === 0 && (
                  <p className="text-sm text-ink-500 italic">No videos added</p>
                )}
              </div>
            </div>
          </div>

          {/* Distribution Notes */}
          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Distribution Notes (Optional)</label>
            <textarea
              name="distributionNotes"
              value={formData.distributionNotes}
              onChange={handleInputChange}
              placeholder="Any additional notes about the distribution..."
              rows="3"
              className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-ink-50 border-t border-ink-100 p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 bg-navy-900 text-white rounded-lg hover:shadow-card transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                {isEditMode ? 'Update' : 'Save'} Distribution
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AggregateDistributionModal;
