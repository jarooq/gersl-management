import React, { useState } from 'react';
import { useMEAL } from '../../contexts/MEALContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useHR } from '../../contexts/HRContext';
import AddEvaluationWizard from '../../components/meal/AddEvaluationWizard';
import EditEvaluationWizard from '../../components/meal/EditEvaluationWizard';
import AddLearningEventWizard from '../../components/meal/AddLearningEventWizard';
import UpdateIndicatorModal from '../../components/meal/UpdateIndicatorModal';
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
  const [filterProject, setFilterProject] = useState('All');

  // Modal states for viewing details
  const [showIndicatorDetail, setShowIndicatorDetail] = useState(false);
  const [showEvaluationDetail, setShowEvaluationDetail] = useState(false);
  const [showComplaintDetail, setShowComplaintDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Modal states for creating/editing
  const [showAddEvaluation, setShowAddEvaluation] = useState(false);
  const [showEditEvaluation, setShowEditEvaluation] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [showAddComplaint, setShowAddComplaint] = useState(false);
  const [showAddLearningEvent, setShowAddLearningEvent] = useState(false);
  const [updatingIndicator, setUpdatingIndicator] = useState(null);

  const stats = getStats();

  // Filter based on active tab
  const filteredIndicators = indicators.filter(indicator => {
    const matchesSearch = indicator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         indicator.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || indicator.status === filterStatus;
    const matchesProject = filterProject === 'All' || indicator.projectId === parseInt(filterProject);
    return matchesSearch && matchesStatus && matchesProject;
  });

  const filteredEvaluations = evaluations.filter(evaluation => {
    const projectName = typeof evaluation.project === 'object' ? (evaluation.project?.name || '') : (evaluation.project || '');
    const matchesSearch = evaluation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         projectName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || evaluation.status === filterStatus;
    const matchesProject = filterProject === 'All' || evaluation.projectId === parseInt(filterProject);
    return matchesSearch && matchesStatus && matchesProject;
  });

  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || complaint.status === filterStatus;
    const matchesProject = filterProject === 'All' || complaint.projectId === parseInt(filterProject);
    return matchesSearch && matchesStatus && matchesProject;
  });

  const filteredLearningEvents = learningEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProject = filterProject === 'All' || event.projectId === parseInt(filterProject);
    return matchesSearch && matchesProject;
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
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="input-modern min-w-[200px]"
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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

            {/* Indicators Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Code</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Indicator Name</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Project</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Type</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Baseline</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Current</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Target</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Progress</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIndicators.map((indicator, index) => {
                    const progress = ((indicator.current / indicator.target) * 100).toFixed(0);
                    return (
                      <tr
                        key={indicator.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-slide-up"
                        style={{ animationDelay: `${index * 0.02}s` }}
                      >
                        <td className="p-3">
                          <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                            {indicator.code}
                          </span>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-sm text-gray-900 mb-0.5">{indicator.name}</p>
                          <p className="text-xs text-gray-500">Unit: {indicator.unit}</p>
                        </td>
                        <td className="p-3">
                          <p className="text-sm text-gray-700">
                            {typeof indicator.project === 'object' ? indicator.project?.name : indicator.project}
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="text-xs font-semibold text-gray-600">{indicator.type}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-sm text-gray-900">{indicator.baseline}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-sm text-blue-600">{indicator.current}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-semibold text-sm text-green-600">{indicator.target}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-xs font-bold text-gray-900">{progress}%</span>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  progress >= 75 ? 'bg-green-500' :
                                  progress >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(indicator.status)}`}>
                            {indicator.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedItem(indicator);
                                setShowIndicatorDetail(true);
                              }}
                              className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => setUpdatingIndicator(indicator)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Update Progress"
                            >
                              <TrendingUp size={16} />
                            </button>
                            <button
                              onClick={() => deleteIndicator(indicator.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredIndicators.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Target size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No indicators found</p>
                </div>
              )}
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
            {/* Add Evaluation Button */}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Project Evaluations</h3>
              <button
                onClick={() => setShowAddEvaluation(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-all font-semibold shadow-md"
              >
                <Plus size={18} />
                Add Evaluation
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search evaluations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="input-modern min-w-[200px]"
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-modern"
              >
                <option value="All">All Status</option>
                <option value="Planned">Planned</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Evaluations Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Title</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Project</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Evaluator</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Duration</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Budget</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Report Status</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvaluations.map((evaluation, index) => (
                    <tr
                      key={evaluation.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors animate-slide-up"
                      style={{ animationDelay: `${index * 0.02}s` }}
                    >
                      <td className="p-3">
                        <p className="font-semibold text-sm text-gray-900">{evaluation.title}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold text-purple-600">{evaluation.type}</span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">
                          {typeof evaluation.project === 'object' ? evaluation.project?.name : evaluation.project}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">{evaluation.evaluator}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-xs text-gray-600">
                          {new Date(evaluation.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })} -<br/>
                          {new Date(evaluation.endDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="font-semibold text-sm text-gray-900">
                          LKR {(evaluation.budget / 1000).toFixed(0)}K
                        </p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          evaluation.reportStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                          evaluation.reportStatus === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {evaluation.reportStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(evaluation.status)}`}>
                          {evaluation.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedItem(evaluation);
                              setShowEvaluationDetail(true);
                            }}
                            className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                            title="View Report"
                          >
                            <FileText size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setEditingEvaluation(evaluation);
                              setShowEditEvaluation(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteEvaluation(evaluation.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredEvaluations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <FileCheck size={48} className="mx-auto mb-3 opacity-50" />
                  <p>No evaluations found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="p-6">
            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search learning events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-modern pl-10 w-full"
                />
              </div>
              <select
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="input-modern min-w-[200px]"
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddLearningEvent(true)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-lg hover:from-indigo-700 hover:to-purple-800 transition-all font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Plus size={18} />
                Add Event
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Event Title</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Type</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Project</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Linked Evaluation</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Date</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Facilitator</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Participants</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLearningEvents.map((event, index) => (
                    <tr key={event.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <p className="font-semibold text-sm text-gray-900">{event.title}</p>
                        {event.objectives && (
                          <p className="text-xs text-gray-600 mt-1">{event.objectives}</p>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                          {event.type}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">
                          {typeof event.project === 'object' ? event.project?.name : event.project}
                        </p>
                      </td>
                      <td className="p-3">
                        {event.evaluationId ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-semibold">
                              {evaluations.find(e => e.id === event.evaluationId)?.title || 'Linked'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">None</span>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">
                          {new Date(event.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">{event.facilitator}</p>
                      </td>
                      <td className="p-3 text-center">
                        <p className="text-sm font-semibold text-gray-900">{event.participants}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {/* View details modal */}}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {/* Edit modal */}}
                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {/* Delete confirmation */}}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Accountability/Complaints Tab */}
        {activeTab === 'complaints' && (
          <div className="p-6">
            {/* Header with Add Button */}
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Beneficiary Complaints & Feedback</h3>
              <button
                onClick={() => setShowAddComplaint(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-lg hover:from-orange-700 hover:to-red-800 transition-all font-semibold shadow-md"
              >
                <Plus size={18} />
                Record Complaint
              </button>
            </div>
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
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
                className="input-modern min-w-[200px]"
              >
                <option value="All">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
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

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200 bg-gray-50">
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Ticket #</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Category</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Project</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Description</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Complainant</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Submitted</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-700 uppercase">Assigned To</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Priority</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Status</th>
                    <th className="text-center p-3 text-xs font-bold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.map((complaint, index) => (
                    <tr key={complaint.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3">
                        <span className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {complaint.ticketNumber}
                        </span>
                      </td>
                      <td className="p-3">
                        <p className="text-sm font-semibold text-gray-900">{complaint.category}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">
                          {typeof complaint.project === 'object' ? complaint.project?.name : complaint.project}
                        </p>
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-sm text-gray-700 truncate" title={complaint.description}>
                          {complaint.description}
                        </p>
                        {complaint.resolution && (
                          <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Resolved
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">{complaint.complainant}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">
                          {new Date(complaint.submittedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm text-gray-700">{complaint.assignedTo}</p>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs font-bold ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {/* View details modal */}}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => {/* Edit modal */}}
                            className="p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteComplaint(complaint.id)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <p className="text-teal-100">
                    {typeof selectedItem.project === 'object' ? selectedItem.project?.name : selectedItem.project}
                  </p>
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
                  <p className="text-purple-100">
                    {typeof selectedItem.project === 'object' ? selectedItem.project?.name : selectedItem.project}
                  </p>
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

              {/* Methodology */}
              {selectedItem.methodology && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Methodology</h3>
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedItem.methodology}</p>
                  </div>
                </div>
              )}

              {/* Objectives */}
              {selectedItem.objectives && Array.isArray(selectedItem.objectives) && selectedItem.objectives.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Evaluation Objectives</h3>
                  <div className="space-y-2">
                    {selectedItem.objectives.map((objective, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                        <span className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <p className="text-gray-800 flex-1">{objective}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report URL */}
              {selectedItem.reportUrl && (
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Evaluation Report</h3>
                  <a
                    href={selectedItem.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText size={18} />
                    View Report
                  </a>
                </div>
              )}

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

      {/* Add Evaluation Wizard */}
      {showAddEvaluation && (
        <AddEvaluationWizard
          projects={projects}
          onClose={() => setShowAddEvaluation(false)}
        />
      )}

      {/* Edit Evaluation Modal */}
      {showEditEvaluation && editingEvaluation && (
        <EditEvaluationWizard
          evaluation={editingEvaluation}
          projects={projects}
          onClose={() => {
            setShowEditEvaluation(false);
            setEditingEvaluation(null);
          }}
        />
      )}

      {/* Add Learning Event Modal */}
      {showAddLearningEvent && (
        <AddLearningEventWizard
          projects={projects}
          evaluations={evaluations}
          onClose={() => setShowAddLearningEvent(false)}
        />
      )}

      {/* Update Indicator Modal */}
      {updatingIndicator && (
        <UpdateIndicatorModal
          indicator={updatingIndicator}
          onClose={() => setUpdatingIndicator(null)}
        />
      )}

      {/* Add Complaint Modal */}
      {showAddComplaint && (
        <AddComplaintModal
          projects={projects}
          onClose={() => setShowAddComplaint(false)}
        />
      )}
    </div>
  );
};

// Add Complaint Modal Component
const AddComplaintModal = ({ projects, onClose }) => {
  const { addComplaint } = useMEAL();
  const [formData, setFormData] = useState({
    complainantName: '',
    contactMethod: 'Phone',
    contactDetails: '',
    category: 'Service Quality',
    priority: 'Medium',
    description: '',
    projectId: '',
    status: 'Open'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const project = projects.find(p => p.id === parseInt(formData.projectId));
      await addComplaint({
        ...formData,
        projectId: parseInt(formData.projectId),
        projectName: project?.name || '',
        submittedDate: new Date().toISOString().split('T')[0]
      });
      onClose();
    } catch (error) {
      console.error('Error adding complaint:', error);
      alert('Failed to add complaint');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-700 p-6 rounded-t-2xl text-white">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Record New Complaint</h3>
              <p className="text-orange-100 text-sm mt-1">Beneficiary/Community feedback mechanism</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Complainant Name *
              </label>
              <input
                type="text"
                value={formData.complainantName}
                onChange={(e) => setFormData({ ...formData, complainantName: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Contact Method *
              </label>
              <select
                value={formData.contactMethod}
                onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              >
                <option value="Phone">Phone</option>
                <option value="Email">Email</option>
                <option value="In Person">In Person</option>
                <option value="Written">Written Letter</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contact Details *
            </label>
            <input
              type="text"
              value={formData.contactDetails}
              onChange={(e) => setFormData({ ...formData, contactDetails: e.target.value })}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              placeholder="Phone number or email"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              >
                <option value="Service Quality">Service Quality</option>
                <option value="Staff Conduct">Staff Conduct</option>
                <option value="Safeguarding">Safeguarding</option>
                <option value="Discrimination">Discrimination</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Priority *
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Project *
              </label>
              <select
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              >
                <option value="">Select...</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Complaint Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              placeholder="Describe the complaint in detail..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-700 text-white rounded-xl hover:from-orange-700 hover:to-red-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MEALPage;
