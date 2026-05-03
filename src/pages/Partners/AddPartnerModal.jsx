import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, Globe, MapPin, Target, DollarSign, Calendar, Upload, Image } from 'lucide-react';

const AddPartnerModal = ({ isOpen, onClose, onAdd }) => {
  const [formData, setFormData] = useState({
    name: '',
    logo: '',
    category: 'Strategic Partner',
    type: 'International NGO',
    contactPerson: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    website: '',
    focusAreas: [],
    partnershipStart: '',
    status: 'Active',
    notes: ''
  });

  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [logoPreview, setLogoPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Major Donor',
    'Strategic Partner',
    'Implementing Partner',
    'Technology Partner',
    'Corporate Sponsor',
    'Foundation',
    'Government Agency'
  ];

  const types = [
    'International NGO',
    'Local NGO',
    'UN Agency',
    'Bilateral Donor',
    'Foundation',
    'Corporate',
    'Individual Donor',
    'Government',
    'Academic Institution'
  ];

  const commonFocusAreas = [
    'Child Protection',
    'Education',
    'Health',
    'Livelihood',
    'Emergency Response',
    'Food Security',
    'WASH',
    'Gender Equality',
    'Climate Action',
    'Technology & Innovation'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addFocusArea = (area) => {
    if (area && !formData.focusAreas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, area]
      }));
      setFocusAreaInput('');
    }
  };

  const removeFocusArea = (area) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.filter(a => a !== area)
    }));
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('File size should be less than 2MB');
        return;
      }

      // Convert to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setFormData(prev => ({ ...prev, logo: base64String }));
        setLogoPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearLogo = () => {
    setFormData(prev => ({ ...prev, logo: '' }));
    setLogoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await onAdd(formData);

      // Reset form only after successful submission
      setFormData({
        name: '',
        logo: '',
        category: 'Strategic Partner',
        type: 'International NGO',
        contactPerson: '',
        email: '',
        phone: '',
        country: '',
        address: '',
        website: '',
        focusAreas: [],
        partnershipStart: '',
        status: 'Active',
        notes: ''
      });
      setLogoPreview('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add partner. Please try again.');
      console.error('Error adding partner:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Add New Partner</h2>
              <p className="text-red-100 text-sm">Create a new partner or donor relationship</p>
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
            {/* Basic Information */}
            <div>
              <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-red-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Partner/Donor Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                    placeholder="e.g., UNICEF, Bill & Melinda Gates Foundation"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                    <Image size={16} className="text-red-600" />
                    Partner Logo
                  </label>

                  {/* Logo Preview */}
                  {(logoPreview || formData.logo) && (
                    <div className="mb-3 flex items-center gap-3">
                      <div className="w-24 h-24 rounded-lg border-2 border-ink-100 overflow-hidden bg-ink-50 flex items-center justify-center">
                        <img
                          src={logoPreview || formData.logo}
                          alt="Partner logo preview"
                          className="max-w-full max-h-full object-contain"
                          onError={(e) => {
                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f3f4f6" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={clearLogo}
                        className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        Remove Logo
                      </button>
                    </div>
                  )}

                  {/* Upload Option */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-ink-600 mb-2">
                      Upload Logo
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all">
                          <Upload size={18} className="text-ink-400" />
                          <span className="text-sm text-ink-600">Click to upload or drag image</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="mt-1 text-xs text-ink-500">Supports: JPG, PNG, GIF (max 2MB)</p>
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex-1 h-px bg-ink-200"></div>
                    <span className="text-xs text-ink-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-ink-200"></div>
                  </div>

                  {/* URL Option */}
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-2">
                      Enter Logo URL
                    </label>
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo.startsWith('data:') ? '' : formData.logo}
                      onChange={(e) => {
                        handleChange(e);
                        if (e.target.value) {
                          setLogoPreview(e.target.value);
                        }
                      }}
                      className="input-modern w-full"
                      placeholder="https://example.com/logo.png"
                    />
                    <p className="mt-1 text-xs text-ink-500">Enter a direct link to the partner's logo</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
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
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="input-modern w-full"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Partnership Start Date
                  </label>
                  <input
                    type="date"
                    name="partnershipStart"
                    value={formData.partnershipStart}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Contact Person *
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                    placeholder="Full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                    placeholder="contact@organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-modern w-full"
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="input-modern w-full"
                    placeholder="https://www.organization.org"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                    placeholder="e.g., United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="input-modern w-full"
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h3 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-purple-600" />
                Focus Areas
              </h3>

              {/* Common focus areas */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Select from common areas
                </label>
                <div className="flex flex-wrap gap-2">
                  {commonFocusAreas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => addFocusArea(area)}
                      disabled={formData.focusAreas.includes(area)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        formData.focusAreas.includes(area)
                          ? 'bg-green-100 text-green-700 border border-green-300'
                          : 'bg-ink-100 text-ink-700 border border-ink-100 hover:bg-ink-200'
                      }`}
                    >
                      {formData.focusAreas.includes(area) ? '✓ ' : '+ '}{area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom focus area */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Or add custom area
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={focusAreaInput}
                    onChange={(e) => setFocusAreaInput(e.target.value)}
                    className="input-modern flex-1"
                    placeholder="Enter custom focus area"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addFocusArea(focusAreaInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => addFocusArea(focusAreaInput)}
                    className="btn-primary px-4"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected focus areas */}
              {formData.focusAreas.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Selected Focus Areas ({formData.focusAreas.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.focusAreas.map(area => (
                      <span
                        key={area}
                        className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2"
                      >
                        {area}
                        <button
                          type="button"
                          onClick={() => removeFocusArea(area)}
                          className="hover:bg-red-100 rounded p-0.5"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="input-modern w-full"
                placeholder="Partnership details, special terms, contact preferences, etc."
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-ink-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-navy-900 text-white rounded-lg font-semibold shadow-card hover:shadow-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Partner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartnerModal;
