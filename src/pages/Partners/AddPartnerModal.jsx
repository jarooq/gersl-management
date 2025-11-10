import React, { useState } from 'react';
import { X, Building2, User, Mail, Phone, Globe, MapPin, Target, DollarSign, Calendar } from 'lucide-react';

const AddPartnerModal = ({ isOpen, onClose, onAdd }) => {
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
    partnershipStartDate: '',
    status: 'Active',
    notes: ''
  });

  const [focusAreaInput, setFocusAreaInput] = useState('');

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({
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
      partnershipStartDate: '',
      status: 'Active',
      notes: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
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
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-red-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    name="partnershipStartDate"
                    value={formData.partnershipStartDate}
                    onChange={handleChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User size={16} className="text-blue-600" />
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
                    placeholder="Full name"
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
                    placeholder="+1 234 567 8900"
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
                    placeholder="e.g., United States"
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
                    placeholder="Street, City, State, ZIP"
                  />
                </div>
              </div>
            </div>

            {/* Focus Areas */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Target size={16} className="text-purple-600" />
                Focus Areas
              </h3>

              {/* Common focus areas */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {formData.focusAreas.includes(area) ? '✓ ' : '+ '}{area}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom focus area */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Add Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPartnerModal;
