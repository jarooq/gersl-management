import React, { useState, useEffect } from 'react';
import { X, Building2, Save, Image, Upload } from 'lucide-react';

const EditPartnerModal = ({ isOpen, onClose, onUpdate, partner }) => {
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

  const [customFocusArea, setCustomFocusArea] = useState('');
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    if (partner && isOpen) {
      // Parse focusAreas if it's a JSON string
      let parsedFocusAreas = [];
      try {
        if (typeof partner.focusAreas === 'string') {
          parsedFocusAreas = JSON.parse(partner.focusAreas);
        } else if (Array.isArray(partner.focusAreas)) {
          parsedFocusAreas = partner.focusAreas;
        }
      } catch (e) {
        parsedFocusAreas = [];
      }

      setFormData({
        name: partner.name || '',
        logo: partner.logo || '',
        category: partner.category || 'Strategic Partner',
        type: partner.type || 'International NGO',
        contactPerson: partner.contactPerson || '',
        email: partner.email || '',
        phone: partner.phone || '',
        country: partner.country || '',
        address: partner.address || '',
        website: partner.website || '',
        focusAreas: parsedFocusAreas,
        partnershipStart: partner.partnershipStart || '',
        status: partner.status || 'Active',
        notes: partner.notes || ''
      });
      setLogoPreview(partner.logo || '');
    }
  }, [partner, isOpen]);

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
    'Emergency Response',
    'Livelihoods',
    'WASH',
    'Gender Equality',
    'Climate Action',
    'Food Security',
    'Youth Development'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleFocusArea = (area) => {
    setFormData(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }));
  };

  const addCustomFocusArea = () => {
    if (customFocusArea.trim() && !formData.focusAreas.includes(customFocusArea.trim())) {
      setFormData(prev => ({
        ...prev,
        focusAreas: [...prev.focusAreas, customFocusArea.trim()]
      }));
      setCustomFocusArea('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(partner.id, formData);
    onClose();
  };

  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Edit Partner</h2>
              <p className="text-blue-100 text-sm">Update partner information - {partner.name}</p>
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
            {/* Basic Information Section */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-4 pb-2 border-b border-ink-100">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-2">
                    Partner Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input-modern w-full"
                    placeholder="e.g., UNICEF, World Bank"
                  />
                </div>

                {/* Logo Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-ink-700 mb-2 flex items-center gap-2">
                    <Image size={16} className="text-blue-600" />
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
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-ink-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all">
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
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-xs text-ink-400 font-medium">OR</span>
                    <div className="flex-1 h-px bg-gray-200"></div>
                  </div>

                  {/* URL Option */}
                  <div>
                    <label className="block text-xs font-medium text-ink-600 mb-2">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      name="logo"
                      value={formData.logo}
                      onChange={handleChange}
                      className="input-modern w-full text-sm"
                      placeholder="https://example.com/logo.png"
                    />
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
                    Organization Type *
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

            {/* Contact Information Section */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-4 pb-2 border-b border-ink-100">
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
                    placeholder="e.g., John Smith"
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
                    placeholder="+94 11 234 5678"
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
              </div>
            </div>

            {/* Location Section */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-4 pb-2 border-b border-ink-100">
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="e.g., Sri Lanka, United States"
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
                    placeholder="Street address, City"
                  />
                </div>
              </div>
            </div>

            {/* Focus Areas Section */}
            <div>
              <h3 className="text-lg font-bold text-ink-900 mb-4 pb-2 border-b border-ink-100">
                Focus Areas
              </h3>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {commonFocusAreas.map(area => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleFocusArea(area)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                        formData.focusAreas.includes(area)
                          ? 'bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-md'
                          : 'bg-ink-100 text-ink-700 hover:bg-gray-200 border border-ink-200'
                      }`}
                    >
                      {area}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFocusArea}
                    onChange={(e) => setCustomFocusArea(e.target.value)}
                    className="input-modern flex-1"
                    placeholder="Add custom focus area..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomFocusArea();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomFocusArea}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                  >
                    Add
                  </button>
                </div>

                {formData.focusAreas.length > 0 && (
                  <div className="bg-ink-50 rounded-lg p-3 border border-ink-100">
                    <p className="text-xs font-semibold text-ink-600 mb-2">Selected Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.focusAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium border border-blue-200 flex items-center gap-2"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => removeFocusArea(area)}
                            className="text-blue-600 hover:text-blue-800 font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                placeholder="Any additional information about this partner..."
              />
            </div>
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 text-white rounded-lg hover:from-blue-700 hover:to-cyan-800 font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPartnerModal;
