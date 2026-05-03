import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, DollarSign, Users, TrendingUp, Eye, Edit, Trash2, Target, MessageSquare, Shield } from 'lucide-react';

const ProjectCard = ({ project, onView, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const getStatusColor = (status) => {
    switch (status) {
      case 'Implementation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Planning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Closing': return 'bg-green-100 text-green-700 border-green-200';
      case 'Completed': return 'bg-ink-100 text-ink-700 border-ink-100';
      default: return 'bg-ink-100 text-ink-700 border-ink-100';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 75) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-blue-500 to-cyan-600';
    if (progress >= 25) return 'from-yellow-500 to-amber-600';
    return 'from-red-500 to-rose-600';
  };

  const budgetPercentage = ((project.spent / project.budget) * 100).toFixed(0);

  return (
    <div className="card-modern group">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 mr-3">
            <h3 className="font-bold text-lg text-ink-900 leading-tight mb-1">{project.name}</h3>
            <p className="text-sm text-ink-600 font-medium mb-2">{project.programmeArea}</p>

            {/* MEAL Badges - NEW */}
            <div className="flex items-center gap-2 flex-wrap">
              {project.resultsFramework && project.resultsFramework.length > 0 && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-semibold flex items-center gap-1">
                  <Target size={11} />
                  {project.resultsFramework.length} Indicators
                </span>
              )}
              {project.cfmLog && project.cfmLog.length > 0 && (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-xs font-semibold flex items-center gap-1">
                  <MessageSquare size={11} />
                  {project.cfmLog.filter(f => f.status === 'Open').length || 0} CFM Open
                </span>
              )}
              {project.beneficiaryBreakdown && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold flex items-center gap-1">
                  <Users size={11} />
                  {(project.beneficiaryBreakdown.directMale || 0) +
                   (project.beneficiaryBreakdown.directFemale || 0) +
                   (project.beneficiaryBreakdown.directChildren || 0)} Direct
                </span>
              )}
              {project.learningLog && project.learningLog.length > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-semibold flex items-center gap-1">
                  <Shield size={11} />
                  {project.learningLog.length} Lessons
                </span>
              )}
            </div>
          </div>
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(project.status)} flex-shrink-0`}>
            {project.status}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-ink-600 flex items-center gap-2">
              <Target size={16} className="text-purple-500" />
              Progress
            </span>
            <span className="text-sm font-bold text-ink-900">{project.progress}%</span>
          </div>
          <div className="w-full bg-ink-200 rounded-full h-2.5 shadow-inner">
            <div
              className={`bg-gradient-to-r ${getProgressColor(project.progress)} h-2.5 rounded-full transition-all shadow-sm`}
              style={{ width: `${project.progress}%` }}
            ></div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-3 text-sm p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <DollarSign size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-600 font-medium">Budget</p>
              <p className="font-bold text-ink-900">LKR {(project.budget / 1000).toFixed(0)}K</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm p-3 bg-blue-50 rounded-lg border border-blue-100">
            <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <Users size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-600 font-medium">Beneficiaries</p>
              <p className="font-bold text-ink-900">{project.beneficiaries}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm p-3 bg-purple-50 rounded-lg border border-purple-100">
            <div className="w-8 h-8 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-600 font-medium">Spent</p>
              <p className="font-bold text-ink-900">{budgetPercentage}%</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm p-3 bg-orange-50 rounded-lg border border-orange-100">
            <div className="w-8 h-8 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
              <Calendar size={16} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-ink-600 font-medium">End Date</p>
              <p className="font-bold text-ink-900">{new Date(project.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* Next Task */}
        {project.nextTask && (
          <div className="mb-4 p-3 bg-ink-50 border-l-4 border-blue-500 rounded-lg shadow-sm">
            <p className="text-xs text-blue-600 font-semibold mb-1">Next Task</p>
            <p className="text-sm font-medium text-ink-900">{project.nextTask}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-ink-100">
          <button
            onClick={() => navigate(`/admin/projects/${project.id}`)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-navy-900 text-white rounded-lg transition-all text-sm font-semibold shadow-md hover:shadow-card active:scale-95"
          >
            <Eye size={16} />
            View
          </button>
          <button
            onClick={() => onEdit(project)}
            className="px-3 py-2.5 bg-ink-100 text-ink-700 rounded-lg hover:bg-ink-200 transition-all border border-ink-100 hover:border-ink-200 active:scale-95"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => onDelete(project.id)}
            className="px-3 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;
