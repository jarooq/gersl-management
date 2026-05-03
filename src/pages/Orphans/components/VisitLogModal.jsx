import React, { useState } from 'react';
import { X, Calendar, Upload, Image, FileText, Mail, Star, Eye, Plus, Trash2, Package } from 'lucide-react';
import { VisitLogAPI } from '../../../services/api';

const VisitLogModal = ({ isOpen, onClose, orphan, onSuccess }) => {
  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    visitNotes: '',
    observations: '',
    photos: [],
    drawings: [],
    letters: [],
    rating: {
      educationalProgress: 0,
      healthWellbeing: 0,
      socialDevelopment: 0,
      behavioralProgress: 0,
      notes: ''
    },
    needsAssessment: []
  });

  const [photoPreview, setPhotoPreview] = useState([]);
  const [drawingPreview, setDrawingPreview] = useState([]);
  const [letterPreview, setLetterPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRatingChange = (category, value) => {
    setFormData(prev => ({
      ...prev,
      rating: {
        ...prev.rating,
        [category]: value
      }
    }));
  };

  const handleFileUpload = async (e, type) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload image files only');
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size should be less than 5MB');
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;

        setFormData(prev => ({
          ...prev,
          [type]: [...prev[type], base64String]
        }));

        // Set preview
        if (type === 'photos') {
          setPhotoPreview(prev => [...prev, base64String]);
        } else if (type === 'drawings') {
          setDrawingPreview(prev => [...prev, base64String]);
        } else if (type === 'letters') {
          setLetterPreview(prev => [...prev, base64String]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = (type, index) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));

    if (type === 'photos') {
      setPhotoPreview(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'drawings') {
      setDrawingPreview(prev => prev.filter((_, i) => i !== index));
    } else if (type === 'letters') {
      setLetterPreview(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await VisitLogAPI.create({
        orphanId: orphan.id,
        ...formData
      });

      alert('Visit log created successfully!');
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        visitDate: new Date().toISOString().split('T')[0],
        visitNotes: '',
        observations: '',
        photos: [],
        drawings: [],
        letters: [],
        rating: {
          educationalProgress: 0,
          healthWellbeing: 0,
          socialDevelopment: 0,
          behavioralProgress: 0,
          notes: ''
        },
        needsAssessment: []
      });
      setPhotoPreview([]);
      setDrawingPreview([]);
      setLetterPreview([]);
    } catch (error) {
      console.error('Error creating visit log:', error);
      alert('Failed to create visit log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const ratingCategories = [
    { key: 'educationalProgress', label: 'Educational Progress', color: 'blue' },
    { key: 'healthWellbeing', label: 'Health & Wellbeing', color: 'green' },
    { key: 'socialDevelopment', label: 'Social Development', color: 'purple' },
    { key: 'behavioralProgress', label: 'Behavioral Progress', color: 'pink' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto my-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-rose-600 text-white px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-xl font-bold">Add Visit Log for {orphan?.fullName}</h2>
            <button type="button" onClick={onClose} className="hover:bg-white/20 p-1 rounded-lg">
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Visit Date */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Visit Date *
              </label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Visit Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <FileText size={16} className="inline mr-2" />
                Visit Notes
              </label>
              <textarea
                name="visitNotes"
                value={formData.visitNotes}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="General notes about the visit..."
              />
            </div>

            {/* Observations */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                <Eye size={16} className="inline mr-2" />
                Observations
              </label>
              <textarea
                name="observations"
                value={formData.observations}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                placeholder="Key observations, changes noticed, concerns..."
              />
            </div>

            {/* Needs Assessment */}
            <NeedsAssessmentSection
              needsAssessment={formData.needsAssessment}
              onChange={(needs) => setFormData(prev => ({ ...prev, needsAssessment: needs }))}
            />

            {/* Progress Ratings */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-xl border border-pink-200">
              <h3 className="font-bold text-lg text-ink-900 mb-4 flex items-center gap-2">
                <Star size={20} className="text-pink-600" />
                Progress Ratings (1-5 Stars)
              </h3>

              <div className="space-y-4">
                {ratingCategories.map(({ key, label, color }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-ink-700 mb-2">{label}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingChange(key, star)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            size={32}
                            className={formData.rating[key] >= star ? `fill-${color}-500 text-${color}-500` : 'text-gray-300'}
                            fill={formData.rating[key] >= star ? 'currentColor' : 'none'}
                          />
                        </button>
                      ))}
                      <span className="ml-4 self-center text-sm font-semibold text-ink-600">
                        {formData.rating[key] > 0 ? `${formData.rating[key]} / 5` : 'Not rated'}
                      </span>
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">Rating Notes</label>
                  <textarea
                    value={formData.rating.notes}
                    onChange={(e) => handleRatingChange('notes', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    placeholder="Additional notes about progress..."
                  />
                </div>
              </div>
            </div>

            {/* Media Upload Sections */}
            <MediaUploadSection
              title="Photos from Visit"
              type="photos"
              icon={Image}
              preview={photoPreview}
              onUpload={(e) => handleFileUpload(e, 'photos')}
              onRemove={(index) => removeMedia('photos', index)}
              color="blue"
            />

            <MediaUploadSection
              title="Children's Drawings"
              type="drawings"
              icon={Image}
              preview={drawingPreview}
              onUpload={(e) => handleFileUpload(e, 'drawings')}
              onRemove={(index) => removeMedia('drawings', index)}
              color="purple"
            />

            <MediaUploadSection
              title="Letters from Children"
              type="letters"
              icon={Mail}
              preview={letterPreview}
              onUpload={(e) => handleFileUpload(e, 'letters')}
              onRemove={(index) => removeMedia('letters', index)}
              color="green"
            />
          </div>

          {/* Footer */}
          <div className="bg-ink-50 px-6 py-4 flex justify-end gap-3 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-lg hover:from-pink-700 hover:to-rose-700 transition font-semibold shadow-md disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Visit Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MediaUploadSection = ({ title, type, icon: Icon, preview, onUpload, onRemove, color }) => (
  <div className="border-2 border-dashed border-ink-200 rounded-xl p-6">
    <h3 className="font-bold text-ink-900 mb-4 flex items-center gap-2">
      <Icon size={20} className={`text-${color}-600`} />
      {title}
    </h3>

    <div className="flex flex-wrap gap-3 mb-4">
      {preview.map((src, index) => (
        <div key={index} className="relative group">
          <img
            src={src}
            alt={`${type} ${index + 1}`}
            className="w-24 h-24 object-cover rounded-lg border-2 border-ink-100"
          />
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>

    <label className="cursor-pointer">
      <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-200 rounded-lg hover:border-pink-400 hover:bg-pink-50 transition-all">
        <Upload size={18} className="text-ink-400" />
        <span className="text-sm text-ink-600">Click to upload {type}</span>
      </div>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={onUpload}
        className="hidden"
      />
    </label>
    <p className="mt-2 text-xs text-ink-500">Supports: JPG, PNG, GIF (max 5MB per file)</p>
  </div>
);

const NeedsAssessmentSection = ({ needsAssessment, onChange }) => {
  const [newNeed, setNewNeed] = useState({
    needType: '',
    needCategory: '',
    quantity: '',
    estimatedCost: '',
    urgency: 'Medium',
    description: ''
  });

  const addNeed = () => {
    if (!newNeed.needType || !newNeed.needCategory) {
      alert('Please fill in Need Type and Category');
      return;
    }
    onChange([...needsAssessment, { ...newNeed, id: Date.now() }]);
    setNewNeed({
      needType: '',
      needCategory: '',
      quantity: '',
      estimatedCost: '',
      urgency: 'Medium',
      description: ''
    });
  };

  const removeNeed = (id) => {
    onChange(needsAssessment.filter(need => need.id !== id));
  };

  const needCategories = [
    'Education',
    'Health / Medical',
    'Clothing',
    'Food / Nutrition',
    'Household Items',
    'Emergency',
    'Other'
  ];

  const urgencyLevels = ['Low', 'Medium', 'High', 'Critical'];

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'Critical': return 'bg-red-100 text-red-700 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Low': return 'bg-ink-100 text-ink-700 border-ink-200';
      default: return 'bg-ink-100 text-ink-700 border-ink-200';
    }
  };

  return (
    <div className="border-2 border-dashed border-blue-300 rounded-xl p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
      <h3 className="font-bold text-lg text-ink-900 mb-4 flex items-center gap-2">
        <Package size={20} className="text-blue-600" />
        Needs Assessment
      </h3>

      {/* Existing Needs List */}
      {needsAssessment.length > 0 && (
        <div className="mb-4 space-y-2">
          {needsAssessment.map((need) => (
            <div
              key={need.id}
              className="bg-white border border-ink-100 rounded-lg p-4 flex justify-between items-start"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-ink-900">{need.needType}</h4>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                    {need.needCategory}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${getUrgencyColor(need.urgency)}`}>
                    {need.urgency}
                  </span>
                </div>
                {need.description && (
                  <p className="text-sm text-ink-600 mb-2">{need.description}</p>
                )}
                <div className="flex gap-4 text-sm text-ink-700">
                  {need.quantity && <span>Qty: {need.quantity}</span>}
                  {need.estimatedCost && <span>Est. Cost: LKR {parseFloat(need.estimatedCost).toLocaleString()}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeNeed(need.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Need Form */}
      <div className="bg-white border-2 border-dashed border-blue-200 rounded-lg p-4 space-y-3">
        <p className="text-sm font-semibold text-ink-700 mb-3">Add New Need</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Need Type *
            </label>
            <input
              type="text"
              value={newNeed.needType}
              onChange={(e) => setNewNeed({ ...newNeed, needType: e.target.value })}
              placeholder="e.g., School uniform, Medicine, Books"
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Category *
            </label>
            <select
              value={newNeed.needCategory}
              onChange={(e) => setNewNeed({ ...newNeed, needCategory: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {needCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Quantity
            </label>
            <input
              type="text"
              value={newNeed.quantity}
              onChange={(e) => setNewNeed({ ...newNeed, quantity: e.target.value })}
              placeholder="e.g., 2, 1 set, 3 bottles"
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Estimated Cost (LKR)
            </label>
            <input
              type="number"
              value={newNeed.estimatedCost}
              onChange={(e) => setNewNeed({ ...newNeed, estimatedCost: e.target.value })}
              placeholder="e.g., 5000"
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Urgency
            </label>
            <select
              value={newNeed.urgency}
              onChange={(e) => setNewNeed({ ...newNeed, urgency: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {urgencyLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-ink-700 mb-1">
              Description
            </label>
            <textarea
              value={newNeed.description}
              onChange={(e) => setNewNeed({ ...newNeed, description: e.target.value })}
              rows={2}
              placeholder="Additional details about this need..."
              className="w-full px-3 py-2 text-sm border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={addNeed}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
        >
          <Plus size={16} />
          Add Need to List
        </button>
      </div>

      {needsAssessment.length === 0 && (
        <p className="text-sm text-ink-500 text-center mt-3">
          No needs recorded yet. Add needs identified during this visit.
        </p>
      )}
    </div>
  );
};

export default VisitLogModal;
