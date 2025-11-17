import React, { useState, useEffect } from 'react';
import { X, Building2, Save } from 'lucide-react';

const EditPartnerModal = ({ isOpen, onClose, onUpdate, partner }) => {
  const [formData, setFormData] = useState({
    name: '',
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">
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
                          ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
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
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-600 mb-2">Selected Focus Areas:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.focusAreas.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2"
                        >
                          {area}
                          <button
                            type="button"
                            onClick={() => removeFocusArea(area)}
                            className="text-red-600 hover:text-red-800 font-bold"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
