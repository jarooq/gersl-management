import React from 'react';
import { MapPin, Calendar, GraduationCap, Heart, Eye, Edit, Trash2 } from 'lucide-react';

const OrphanCard = ({ orphan, onView, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600 font-semibold';
      case 'Good': return 'text-blue-600 font-semibold';
      case 'Average': return 'text-yellow-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="card-modern group">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-lg group-hover:scale-105 transition-transform">
              {orphan.fullName.charAt(0)}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">{orphan.fullName}</h3>
              <p className="text-sm text-gray-500 font-medium">{orphan.age} years old</p>
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(orphan.status)} flex-shrink-0`}>
            {orphan.status}
          </span>
        </div>

        <div className="space-y-3 mb-5">
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-blue-500" />
            </div>
            <span className="font-medium">{orphan.district}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <GraduationCap size={16} className="text-green-500" />
            </div>
            <span className="font-medium">{orphan.schoolName} - {orphan.currentGrade}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700">
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

        <div className="pt-4 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => onView(orphan)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg active:scale-95"
            >
              <Eye size={16} />
              View
            </button>
            <button
              onClick={() => onEdit(orphan)}
              className="px-3 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300 active:scale-95"
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
