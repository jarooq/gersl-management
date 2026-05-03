import React from 'react';
import { MapPin, Calendar, GraduationCap, Heart, Eye, Edit, Trash2 } from 'lucide-react';
import { API_ORIGIN } from '../../../config/apiBase';

const OrphanCard = ({ orphan, onView, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600 font-semibold';
      case 'Good': return 'text-blue-600 font-semibold';
      case 'Average': return 'text-yellow-600 font-semibold';
      default: return 'text-ink-600';
    }
  };

  // Helper function to get profile photo URL
  const getProfilePhotoUrl = () => {
    try {
      if (!orphan.photos) {
        return null;
      }

      let photos = orphan.photos;

      // If it's a string, try to parse it
      if (typeof photos === 'string') {
        try {
          photos = JSON.parse(photos);
        } catch (e) {
          console.error('OrphanCard - Failed to parse photos string:', e);
          return null;
        }
      }

      if (Array.isArray(photos) && photos.length > 0) {
        return `${API_ORIGIN}${photos[0]}`;
      }
    } catch (error) {
      console.error('OrphanCard - Error in getProfilePhotoUrl:', error);
    }
    return null;
  };

  // Handle both fullName and name fields
  const displayName = orphan.fullName || orphan.name || orphan.full_name || 'Unknown';
  const profilePhotoUrl = getProfilePhotoUrl();

  return (
    <div className="card-modern group">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3 flex-1">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt={displayName}
                className="w-14 h-14 rounded-xl object-cover shadow-card group- transition-transform"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-14 h-14 bg-pink-50 border border-pink-200 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-card group- transition-transform"
              style={{ display: profilePhotoUrl ? 'none' : 'flex' }}
            >
              {displayName.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-ink-900 leading-tight">{displayName}</h3>
              <p className="text-sm text-ink-500 font-medium">{orphan.age} years old</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(orphan.status)} flex-shrink-0`}>
            {orphan.status}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-blue-500" />
            </div>
            <span className="font-medium">{orphan.district}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-green-500" />
            </div>
            <span className="font-medium">{orphan.schoolName} - {orphan.currentGrade}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-ink-700">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar size={16} className="text-purple-500" />
            </div>
            <span className="font-medium">Last visit: {orphan.lastVisitDate || 'Never'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Heart size={16} className="text-red-500" />
            </div>
            <span className={getPerformanceColor(orphan.academicPerformance)}>
              Performance: {orphan.academicPerformance}
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-ink-100">
          <div className="flex gap-2">
            <button
              onClick={() => onView(orphan)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-card active:scale-95"
            >
              <Eye size={16} />
              View
            </button>
            <button
              onClick={() => onEdit(orphan)}
              className="px-3 py-2.5 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-all border border-ink-100 hover:border-ink-200 active:scale-95"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => onDelete(orphan.id)}
              className="px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrphanCard;
