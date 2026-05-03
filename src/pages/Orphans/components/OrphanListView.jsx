import React from 'react';
import { MapPin, GraduationCap, Calendar, Heart, Eye, Edit, Trash2, User, Phone } from 'lucide-react';

const OrphanListView = ({ orphan, onView, onEdit, onDelete }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getPerformanceColor = (performance) => {
    switch (performance) {
      case 'Excellent': return 'text-green-600';
      case 'Good': return 'text-blue-600';
      case 'Average': return 'text-yellow-600';
      default: return 'text-ink-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lift transition-shadow border border-ink-100 p-5">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Avatar and Basic Info */}
        <div className="flex items-center gap-4 md:w-1/4">
          <div className="w-16 h-16 bg-pink-50 border border-pink-200 text-white rounded-xl flex items-center justify-center text-2xl font-bold shadow-card flex-shrink-0">
            {orphan.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-ink-900 leading-tight">{orphan.fullName}</h3>
            <p className="text-sm text-ink-500">ID: {orphan.orphanId || `#${orphan.id}`}</p>
            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(orphan.status)}`}>
              {orphan.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <User size={16} className="text-ink-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">Age</p>
              <p className="font-semibold text-ink-900">{orphan.age} years</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin size={16} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">District</p>
              <p className="font-semibold text-ink-900">{orphan.district}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Phone size={16} className="text-green-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">Guardian</p>
              <p className="font-semibold text-ink-900">{orphan.guardianName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <GraduationCap size={16} className="text-purple-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">School</p>
              <p className="font-semibold text-ink-900">{orphan.schoolName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <GraduationCap size={16} className="text-indigo-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">Grade</p>
              <p className="font-semibold text-ink-900">{orphan.currentGrade}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Heart size={16} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">Performance</p>
              <p className={`font-semibold ${getPerformanceColor(orphan.academicPerformance)}`}>
                {orphan.academicPerformance}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm md:col-span-2">
            <Calendar size={16} className="text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-ink-500">Last Visit</p>
              <p className="font-semibold text-ink-900">{orphan.lastVisitDate || 'Never'}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex md:flex-col gap-2 md:w-auto justify-end">
          <button
            onClick={() => onView(orphan)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-navy-900 text-white rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-card"
            title="View Details"
          >
            <Eye size={16} />
            <span className="md:hidden">View</span>
          </button>
          <button
            onClick={() => onEdit(orphan)}
            className="px-3 py-2 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-all border border-ink-100 hover:border-ink-200"
            title="Edit"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(orphan.id)}
            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrphanListView;
