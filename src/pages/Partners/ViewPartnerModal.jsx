import React from 'react';
import { X, Building2, Mail, Phone, Globe, MapPin, Calendar, Target, Briefcase, Heart, DollarSign, Image } from 'lucide-react';

const ViewPartnerModal = ({ isOpen, onClose, partner }) => {
  if (!isOpen || !partner) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-rose-700 text-white p-6 rounded-t-xl flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center text-2xl font-bold overflow-hidden">
              {partner.logo ? (
                <img
                  src={partner.logo}
                  alt={`${partner.name} logo`}
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = partner.name.charAt(0);
                  }}
                />
              ) : (
                partner.name.charAt(0)
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{partner.name}</h2>
              <p className="text-red-100 text-sm">Partner Code: {partner.partnerCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-red-600" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Category</p>
                    <p className="text-sm font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200 inline-block">
                      {partner.category}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Type</p>
                    <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 inline-block">
                      {partner.type}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Status</p>
                    <p className={`text-sm font-bold px-3 py-2 rounded-lg inline-block ${
                      partner.status === 'Active'
                        ? 'text-green-600 bg-green-50 border border-green-200'
                        : 'text-gray-600 bg-gray-100 border border-gray-300'
                    }`}>
                      {partner.status}
                    </p>
                  </div>
                  {partner.partnershipStartDate && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar size={14} />
                        Partnership Start Date
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(partner.partnershipStartDate).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-blue-600" />
                  Contact Information
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Contact Person</p>
                    <p className="text-sm font-medium text-gray-900">{partner.contactPerson}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                      <Mail size={14} />
                      Email
                    </p>
                    <a href={`mailto:${partner.email}`} className="text-sm font-medium text-blue-600 hover:underline">
                      {partner.email}
                    </a>
                  </div>
                  {partner.phone && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Phone size={14} />
                        Phone
                      </p>
                      <a href={`tel:${partner.phone}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {partner.phone}
                      </a>
                    </div>
                  )}
                  {partner.website && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                        <Globe size={14} />
                        Website
                      </p>
                      <a
                        href={partner.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-blue-600 hover:underline break-all"
                      >
                        {partner.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={20} className="text-orange-600" />
                  Location
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Country</p>
                    <p className="text-sm font-medium text-gray-900">{partner.country}</p>
                  </div>
                  {partner.address && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Address</p>
                      <p className="text-sm font-medium text-gray-900">{partner.address}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Focus Areas */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Target size={20} className="text-purple-600" />
                  Focus Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Parse focusAreas if it's a JSON string, otherwise use as array
                    let focusAreasArray = [];
                    try {
                      if (typeof partner.focusAreas === 'string') {
                        focusAreasArray = JSON.parse(partner.focusAreas);
                      } else if (Array.isArray(partner.focusAreas)) {
                        focusAreasArray = partner.focusAreas;
                      }
                    } catch (e) {
                      focusAreasArray = [];
                    }

                    return focusAreasArray.length > 0 ? (
                      focusAreasArray.map((area, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-lg text-sm font-semibold border border-purple-300"
                        >
                          {area}
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">No focus areas specified</p>
                    );
                  })()}
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Financial Overview
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Total Contributions</p>
                    <p className="text-2xl font-bold text-green-600">
                      LKR {(partner.totalContributions / 1000000).toFixed(2)}M
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {partner.totalContributions.toLocaleString('en-US')} LKR
                    </p>
                  </div>
                  {partner.lastContribution && (
                    <div className="bg-white rounded-lg p-4 border border-green-200">
                      <p className="text-xs font-semibold text-gray-500 mb-1">Last Contribution</p>
                      <p className="text-lg font-bold text-gray-900">
                        {new Date(partner.lastContribution).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Notes */}
              {partner.notes && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Heart size={20} className="text-gray-600" />
                    Additional Notes
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">{partner.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 p-6 rounded-b-xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-lg hover:from-red-700 hover:to-rose-800 font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewPartnerModal;
