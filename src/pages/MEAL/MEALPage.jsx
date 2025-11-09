import React, { useState } from 'react';
import { useMEAL } from '../../contexts/MEALContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useHR } from '../../contexts/HRContext';
import {
  BarChart3,
  Plus,
  Search,
  Target,
  FileCheck,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  ArrowRight,
  Activity,
  BookOpen,
  MessageSquareWarning,
  Star,
  FileText,
  X
} from 'lucide-react';

const MEALPage = () => {
  const {
    indicators,
    evaluations,
    learningEvents,
    complaints,
    getStats,
    deleteIndicator,
    deleteEvaluation,
    deleteLearningEvent,
    deleteComplaint
  } = useMEAL();

  const { projects } = useProjects();
  const { staff } = useHR();

  const [activeTab, setActiveTab] = useState('indicators');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal states for viewing details
  const [showIndicatorDetail, setShowIndicatorDetail] = useState(false);
  const [showEvaluationDetail, setShowEvaluationDetail] = useState(false);
  const [showComplaintDetail, setShowComplaintDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const stats = getStats();

  // Filter based on active tab
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || indicator.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredEvaluations = evaluations.filter(evaluation => {
    const matchesSearch = evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         evaluation.project.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || evaluation.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || complaint.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-700 border-green-200';
      case 'At Risk': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Off Track': return 'bg-red-100 text-red-700 border-red-200';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'In Progress': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Planned': return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'Resolved': return 'bg-green-100 text-green-700 border-green-200';
      case 'Open': return 'bg-red-100 text-red-700 border-red-200';
      case 'Under Investigation': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressIcon = (indicator) => {
    const progress = (indicator.current / indicator.target) * 100;
    if (progress >= 75) return <TrendingUp size={16} className="text-green-500" />;
    if (progress >= 50) return <Minus size={16} className="text-yellow-500" />;
    return <TrendingDown size={16} className="text-red-500" />;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const statItems = [
    {
      title: 'Total Indicators',
      value: stats.totalIndicators,
      icon: Target,
      gradient: 'from-teal-500 to-cyan-600',
      change: `${stats.onTrackIndicators} on track`,
      subtitle: 'performance metrics'
    },
    {
      title: 'Evaluations',
      value: stats.totalEvaluations,
      icon: FileCheck,
      gradient: 'from-blue-500 to-indigo-600',
      change: `${stats.completedEvaluations} completed`,
      subtitle: 'assessments done'
    },
    {
      title: 'Resolution Rate',
      value: `${stats.resolutionRate}%`,
      icon: CheckCircle,
      gradient: 'from-green-500 to-emerald-600',
      change: `${stats.resolvedComplaints}/${stats.totalComplaints} resolved`,
      subtitle: 'complaint handling'
    },
    {
      title: 'Satisfaction',
      value: stats.avgSatisfaction,
      icon: Star,
      gradient: 'from-orange-500 to-amber-600',
      change: 'Average rating',
      subtitle: 'out of 5.0'
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Teal Gradient Hero Banner */}
      <div className="bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">MEAL System</h1>
                <p className="text-teal-100 text-sm">Monitoring, Evaluation, Accountability & Learning</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statItems.map((stat, index) => (
          <div
            key={index}
            className="stat-card group cursor-pointer animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 mb-2">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
              <div className={`bg-gradient-to-br ${stat.gradient} p-3 rounded-xl shadow-lg transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                <stat.icon className="text-white" size={18} />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-xs font-medium text-gray-600">{stat.change}</span>
              <ArrowRight size={16} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-2">
            {[
              { id: 'indicators', label: 'Indicators', icon: Target },
              { id: 'evaluations', label: 'Evaluations', icon: FileCheck },
              { id: 'learning', label: 'Learning', icon: Lightbulb },
              { id: 'complaints', label: 'Accountability', icon: MessageSquareWarning }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-teal-600 to-cyan-700 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indicators Tab */}
        {activeTab === 'indicators' && (
          <div className="p-6">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search indicators by name or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-modern"
              >
                <option value="All">All Status</option>
                <option value="On Track">On Track</option>
                <option value="At Risk">At Risk</option>
                <option value="Off Track">Off Track</option>
              </select>
            </div>

            {/* Indicators Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredIndicators.map((indicator, index) => {
                const progress = ((indicator.current / indicator.target) * 100).toFixed(0);
                return (
                  <div
                    key={indicator.id}
                    className="card-modern group p-5 animate-slide-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {indicator.code}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(indicator.status)} flex items-center gap-1`}>
                            {getProgressIcon(indicator)}
                            {indicator.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-gray-900 leading-tight mb-1">{indicator.name}</h3>
                        <p className="text-sm text-gray-600 font-medium">{indicator.project}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-gray-600">Progress</span>
                        <span className="text-xs font-bold text-gray-900">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 shadow-inner">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            progress >= 75 ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                            progress >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                            'bg-gradient-to-r from-red-500 to-rose-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Baseline</p>
                        <p className="font-bold text-sm text-gray-900">{indicator.baseline}</p>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-600 mb-1">Current</p>
                        <p className="font-bold text-sm text-blue-900">{indicator.current}</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg border border-green-100">
                        <p className="text-xs text-green-600 mb-1">Target</p>
                        <p className="font-bold text-sm text-green-900">{indicator.target}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-xs text-gray-500">Type: <span className="font-semibold text-gray-700">{indicator.type}</span></p>
                          <p className="text-xs text-gray-500">Responsible: <span className="font-semibold text-gray-700">{indicator.responsible}</span></p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedItem(indicator);
                            setShowIndicatorDetail(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-lg hover:from-teal-700 hover:to-cyan-800 transition-all text-xs font-semibold shadow-md hover:shadow-lg active:scale-95">
                          <Eye size={14} />
                          View
                        </button>
                        <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300 active:scale-95">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteIndicator(indicator.id)}
                          className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredIndicators.length === 0 && (
              <div className="text-center py-12">
                <Target className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No indicators found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}

        {/* Evaluations Tab */}
        {activeTab === 'evaluations' && (
          <div className="p-6">
            <div className="space-y-4">
              {filteredEvaluations.map((evaluation, index) => (
                <div
                  key={evaluation.id}
                  className="card-modern p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(evaluation.status)}`}>
                          {evaluation.status}
                        </span>
                        <span className="text-xs font-semibold text-purple-600">{evaluation.type}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{evaluation.title}</h3>
                      <p className="text-sm text-gray-600 font-medium">{evaluation.project}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Evaluator</p>
                      <p className="font-semibold text-sm text-gray-900">{evaluation.evaluator}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="font-semibold text-sm text-gray-900">LKR {(evaluation.budget / 1000).toFixed(0)}K</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Duration</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(evaluation.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} -
                        {new Date(evaluation.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Report Status</p>
                      <p className="font-semibold text-sm text-gray-900">{evaluation.reportStatus}</p>
                    </div>
                  </div>

                  {evaluation.findings && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-xs font-semibold text-blue-700 mb-1">Key Findings</p>
                      <p className="text-sm text-gray-700">{evaluation.findings}</p>
                    </div>
                  )}

                  {evaluation.recommendations && evaluation.recommendations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Recommendations</p>
                      <ul className="space-y-1">
                        {evaluation.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedItem(evaluation);
                        setShowEvaluationDetail(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-700 text-white rounded-lg hover:from-teal-700 hover:to-cyan-800 transition-all text-sm font-semibold shadow-md hover:shadow-lg active:scale-95">
                      <FileText size={14} />
                      View Report
                    </button>
                    <button className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all border border-gray-200 hover:border-gray-300 active:scale-95">
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteEvaluation(evaluation.id)}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all border border-red-200 hover:border-red-300 active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="p-6">
            <div className="space-y-4">
              {learningEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="card-modern p-5 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <span className="text-xs font-semibold text-indigo-600">{event.type}</span>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{event.title}</h3>
                      <p className="text-sm text-gray-600">{event.objectives}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Date</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Facilitator</p>
                      <p className="font-semibold text-sm text-gray-900">{event.facilitator}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Participants</p>
                      <p className="font-semibold text-sm text-gray-900">{event.participants} people</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Lightbulb size={14} className="text-yellow-500" />
                        Key Learnings
                      </p>
                      <ul className="space-y-1">
                        {event.keyLearnings.map((learning, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-yellow-500 flex-shrink-0">•</span>
                            <span>{learning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
                        <Activity size={14} className="text-teal-500" />
                        Action Points
                      </p>
                      <ul className="space-y-1">
                        {event.actionPoints.map((action, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <CheckCircle size={14} className="text-teal-500 mt-0.5 flex-shrink-0" />
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      <BookOpen size={12} className="inline mr-1" />
                      Documentation: <span className="font-semibold">{event.documentation}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accountability/Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="p-6">
            {/* Search and Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search complaints by ticket or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-modern"
              >
                <option value="All">All Status</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredComplaints.map((complaint, index) => (
                <div
                  key={complaint.id}
                  className="card-modern p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {complaint.ticketNumber}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <span className={`text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority} Priority
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{complaint.category} - {complaint.project}</p>
                      <p className="text-sm text-gray-700">{complaint.description}</p>
                    </div>
                    <button
                      onClick={() => deleteComplaint(complaint.id)}
                      className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="font-semibold text-xs text-gray-900">
                        {new Date(complaint.submittedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Complainant</p>
                      <p className="font-semibold text-xs text-gray-900">{complaint.complainant}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Assigned To</p>
                      <p className="font-semibold text-xs text-gray-900">{complaint.assignedTo}</p>
                    </div>
                    {complaint.satisfactionRating && (
                      <div>
                        <p className="text-xs text-gray-500">Satisfaction</p>
                        <p className="font-semibold text-xs text-gray-900 flex items-center gap-1">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          {complaint.satisfactionRating}/5
                        </p>
                      </div>
                    )}
                  </div>

                  {complaint.resolution && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-xs font-semibold text-green-700 mb-1">Resolution</p>
                      <p className="text-sm text-gray-700">{complaint.resolution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {filteredComplaints.length === 0 && (
              <div className="text-center py-12">
                <MessageSquareWarning className="mx-auto text-gray-300 mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No complaints found</h3>
                <p className="text-gray-600">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Indicator Detail Modal */}
      {showIndicatorDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono bg-white/20 px-2 py-1 rounded">{selectedItem.code}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{selectedItem.name}</h2>
                  <p className="text-teal-100">{selectedItem.project}</p>
                </div>
                <button
                  onClick={() => setShowIndicatorDetail(false)}
                  className="p-2 hover:bg-teal-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Progress Overview */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Progress Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Baseline</p>
                    <p className="text-3xl font-bold text-gray-900">{selectedItem.baseline}</p>
                    <p className="text-xs text-gray-500 mt-1">{selectedItem.unit}</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                    <p className="text-sm text-blue-700 mb-2">Current</p>
                    <p className="text-3xl font-bold text-blue-900">{selectedItem.current}</p>
                    <p className="text-xs text-blue-600 mt-1">{selectedItem.unit}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border border-green-300">
                    <p className="text-sm text-green-700 mb-2">Target</p>
                    <p className="text-3xl font-bold text-green-900">{selectedItem.target}</p>
                    <p className="text-xs text-green-600 mt-1">{selectedItem.unit}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-semibold text-gray-700">Achievement Rate</span>
                    <span className="text-lg font-bold text-gray-900">
                      {((selectedItem.current / selectedItem.target) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-cyan-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((selectedItem.current / selectedItem.target) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Indicator Details */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Indicator Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <p className="font-semibold text-gray-900">{selectedItem.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900">{selectedItem.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Measurement Frequency</p>
                    <p className="font-semibold text-gray-900">{selectedItem.frequency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data Source</p>
                    <p className="font-semibold text-gray-900">{selectedItem.dataSource}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Responsible Person</p>
                    <p className="font-semibold text-gray-900">{selectedItem.responsible}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedItem.lastUpdated).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowIndicatorDetail(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Detail Modal */}
      {showEvaluationDetail && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(selectedItem.status)}`}>
                      {selectedItem.status}
                    </span>
                    <span className="text-sm bg-white/20 px-2 py-1 rounded">{selectedItem.type}</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">{selectedItem.title}</h2>
                  <p className="text-purple-100">{selectedItem.project}</p>
                </div>
                <button
                  onClick={() => setShowEvaluationDetail(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Evaluation Overview */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Evaluation Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Evaluator</p>
                    <p className="font-semibold text-gray-900">{selectedItem.evaluator}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Budget</p>
                    <p className="font-semibold text-gray-900">LKR {(selectedItem.budget / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedItem.startDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedItem.endDate).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Report Status</p>
                    <p className="font-semibold text-gray-900">{selectedItem.reportStatus}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Attachments</p>
                    <p className="font-semibold text-gray-900">{selectedItem.attachments} file(s)</p>
                  </div>
                </div>
              </div>

              {/* Findings */}
              {selectedItem.findings && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Key Findings</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-gray-800">{selectedItem.findings}</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedItem.recommendations && selectedItem.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {selectedItem.recommendations.map((rec, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-800">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowEvaluationDetail(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MEALPage;
