import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import {
  X, Calendar, DollarSign, Users, Target, MapPin, Heart,
  CheckCircle, Clock, AlertCircle, Plus, Edit, Trash2, FileText,
  MessageSquare, BarChart3, Users2, Lightbulb, Send, Eye, RefreshCw, CheckSquare, GanttChartSquare
} from 'lucide-react';
import { useProjects } from '../../../contexts/ProjectContext';
import TaskDetailView from '../../Operations/components/TaskDetailView';
import TaskAssignmentModal from '../../Operations/components/TaskAssignmentModal';
import TaskProgressModal from '../../Operations/components/TaskProgressModal';
import TaskCompletionModal from '../../Operations/components/TaskCompletionModal';
import CreateTaskModal from '../../Operations/components/CreateTaskModal';
import TaskFormModal from '../../Operations/components/TaskFormModal';
import BeneficiarySelectionModal from '../../Operations/components/BeneficiarySelectionModal';
import Toast from '../../../components/ui/Toast';
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import GanttChart from '../../../components/charts/GanttChart';
import * as taskService from '../../../services/taskService';

const ProjectDetails = ({ project, onClose, onUpdateTask, onAddTask, onDeleteTask, onGenerateReport }) => {
  const [editingTask, setEditingTask] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCFMModal, setShowCFMModal] = useState(false);
  const [cfmFormData, setCfmFormData] = useState({
    feedbackType: 'Complaint',
    channel: 'Hotline',
    severity: 'Medium',
    description: '',
    reportedBy: '',
    contactInfo: ''
  });

  // Task Modal States
  const [showTaskDetailView, setShowTaskDetailView] = useState(false);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [showTaskProgress, setShowTaskProgress] = useState(false);
  const [showTaskCompletion, setShowTaskCompletion] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showBeneficiarySelection, setShowBeneficiarySelection] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [toast, setToast] = useState(null);

  // Real tasks from backend (replaces project.tasks)
  const [projectTasks, setProjectTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const { addCFMFeedback, resolveCFMFeedback, refreshProject } = useProjects();

  // Load tasks from backend API when project changes
  const loadProjectTasks = useCallback(async () => {
    if (!project?.id) return;

    try {
      setLoadingTasks(true);
      const response = await taskService.fetchTasks({ projectId: project.id });
      console.log('📋 Project Tasks API Response:', response);

      // The API returns { success: true, tasks: [...] } or { success: true, data: [...] }
      const tasksData = response.tasks || response.data || [];
      console.log('📋 Extracted Tasks:', tasksData);

      if (response.success && tasksData) {
        setProjectTasks(tasksData);
      }
    } catch (error) {
      console.error('❌ Error loading project tasks:', error);
      setTaskError('Failed to load tasks');
    } finally {
      setLoadingTasks(false);
    }
  }, [project?.id]);

  // Load tasks when component mounts or project changes
  useEffect(() => {
    loadProjectTasks();
  }, [loadProjectTasks]);

  if (!project) return null;

  // Parse JSON strings if they're still strings (from database TEXT fields)
  const parseIfString = useCallback((value, defaultValue = []) => {
    if (!value) return defaultValue;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return defaultValue;
      }
    }
    return value;
  }, []);

  // Memoized parsed data
  const resultsFramework = useMemo(() => parseIfString(project.resultsFramework, []), [project.resultsFramework, parseIfString]);
  const objectives = useMemo(() => parseIfString(project.objectives, []), [project.objectives, parseIfString]);
  const keyActivities = useMemo(() => parseIfString(project.keyActivities, []), [project.keyActivities, parseIfString]);

  // Memoized calculations
  const budgetUsed = useMemo(() => ((project.spent / project.budget) * 100).toFixed(1), [project.spent, project.budget]);
  const beneficiaryProgress = useMemo(() => ((project.beneficiaries / project.targetBeneficiaries) * 100).toFixed(1), [project.beneficiaries, project.targetBeneficiaries]);

  const getTaskStatusIcon = (status) => {
    switch (status) {
      case 'Completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'In Progress': return <Clock size={16} className="text-blue-500" />;
      case 'Pending': return <AlertCircle size={16} className="text-ink-400" />;
      default: return <Clock size={16} className="text-ink-400" />;
    }
  };

  const getTaskStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-ink-100 text-ink-600';
      default: return 'bg-ink-100 text-ink-600';
    }
  };

  // CFM Handlers
  const handleCFMSubmit = (e) => {
    e.preventDefault();
    addCFMFeedback(project.id, cfmFormData);
    setCfmFormData({
      feedbackType: 'Complaint',
      channel: 'Hotline',
      severity: 'Medium',
      description: '',
      reportedBy: '',
      contactInfo: ''
    });
    setShowCFMModal(false);
  };

  const handleResolveCFM = (feedbackId) => {
    const resolution = prompt('Describe the action taken to resolve this feedback:');
    const responsiblePerson = prompt('Who handled this resolution?');

    if (resolution && responsiblePerson) {
      resolveCFMFeedback(project.id, feedbackId, {
        actionTaken: resolution,
        responsiblePerson: responsiblePerson
      });
    }
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case 'Complaint': return 'bg-red-100 text-red-700 border-red-300';
      case 'Suggestion': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Positive': return 'bg-green-100 text-green-700 border-green-300';
      case 'Query': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-ink-100 text-ink-700 border-ink-200';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'High': return 'text-red-600';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-green-600';
      default: return 'text-ink-600';
    }
  };

  // Priority colors for tasks
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'High': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-ink-600 bg-ink-50 border-ink-100';
    }
  };

  // Due date label helper
  const getDueDateLabel = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Overdue', color: 'text-red-600 bg-red-50' };
    if (diffDays === 0) return { label: 'Due Today', color: 'text-orange-600 bg-orange-50' };
    if (diffDays === 1) return { label: 'Due Tomorrow', color: 'text-yellow-600 bg-yellow-50' };
    if (diffDays <= 3) return { label: 'Due Soon', color: 'text-blue-600 bg-blue-50' };
    return null;
  };

  // Task action handlers (memoized)
  const handleViewTask = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskDetailView(true);
  }, []);

  const handleUpdateProgress = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskProgress(true);
  }, []);

  const handleCompleteTask = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskCompletion(true);
  }, []);

  const handleAssignTask = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskAssignment(true);
  }, []);

  const handleEditTask = useCallback((task) => {
    setSelectedTask(task);
    setShowEditTask(true);
  }, []);

  const handleSelectBeneficiaries = useCallback((task) => {
    setSelectedTask(task);
    setShowBeneficiarySelection(true);
  }, []);

  const handleDeleteTask = useCallback(async (task) => {
    if (!window.confirm(`Are you sure you want to delete the task "${task.title || task.name}"?`)) {
      return;
    }

    try {
      setIsLoadingTask(true);
      await taskService.deleteTask(task.id);

      setToast({
        message: 'Task deleted successfully',
        type: 'success'
      });

      // Reload tasks from API
      await loadProjectTasks();

      // Call parent callback if provided
      if (onDeleteTask) {
        onDeleteTask(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setToast({
        message: error.message || 'Failed to delete task',
        type: 'error'
      });
    } finally {
      setIsLoadingTask(false);
    }
  }, [loadProjectTasks, onDeleteTask]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg2 shadow-pop max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-navy-900 text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{project.name}</h2>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {project.programmeArea}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {project.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex border-b border-ink-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('meal')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'meal'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <BarChart3 size={16} />
              MEAL Data
              {project.resultsFramework?.length > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                  {project.resultsFramework.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('cfm')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'cfm'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <MessageSquare size={16} />
              CFM
              {project.cfmLog?.length > 0 && (
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                  {project.cfmLog.filter(f => f.status === 'Open').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-6 py-3 font-semibold transition ${
                activeTab === 'tasks'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-3 font-semibold transition flex items-center gap-2 ${
                activeTab === 'timeline'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              <GanttChartSquare size={16} />
              Timeline
            </button>
          </div>

          {/* Overview Cards */}
          {activeTab === 'overview' && (
          <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <OverviewCard
              icon={Target}
              label="Progress"
              value={`${project.progress}%`}
              color="bg-blue-500"
            />
            <OverviewCard
              icon={DollarSign}
              label="Budget Used"
              value={`${budgetUsed}%`}
              color="bg-green-500"
              subtitle={`${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}`}
            />
            <OverviewCard
              icon={Users}
              label="Beneficiaries"
              value={project.beneficiaries}
              color="bg-purple-500"
              subtitle={`Target: ${project.targetBeneficiaries}`}
            />
            <OverviewCard
              icon={Calendar}
              label="Days Remaining"
              value={Math.ceil((new Date(project.endDate) - new Date()) / (1000 * 60 * 60 * 24))}
              color="bg-orange-500"
            />
          </div>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoItem icon={Heart} label="Donor" value={project.donor} />
                <InfoItem icon={MapPin} label="Location" value={project.location} />
                <InfoItem icon={Calendar} label="Start Date" value={project.startDate} />
                <InfoItem icon={Calendar} label="End Date" value={project.endDate} />
              </div>
              {project.description && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-ink-600">{project.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-ink-600">Total Budget</span>
                  <span className="font-bold text-ink-900">LKR {project.budget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-600">Spent</span>
                  <span className="font-bold text-blue-600">LKR {project.spent.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ink-600">Remaining</span>
                  <span className="font-bold text-green-600">LKR {(project.budget - project.spent).toLocaleString()}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="w-full bg-ink-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                      style={{ width: `${budgetUsed}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-ink-500 text-center mt-2">{budgetUsed}% of budget used</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
          )}

          {/* MEAL Data Tab */}
          {activeTab === 'meal' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Results Framework</CardTitle>
                    <span className="text-sm text-ink-500">
                      {resultsFramework.length || 0} indicators
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {resultsFramework && resultsFramework.length > 0 ? (
                    <div className="space-y-4">
                      {resultsFramework.map((indicator, index) => (
                        <div key={index} className="border border-ink-100 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                {indicator.level}
                              </span>
                            </div>
                          </div>
                          <h4 className="font-semibold text-ink-900 mb-2">{indicator.indicator}</h4>
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-ink-500">Baseline:</span>
                              <span className="font-semibold text-ink-900 ml-1">{indicator.baseline}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">Target:</span>
                              <span className="font-semibold text-green-600 ml-1">{indicator.target}</span>
                            </div>
                            <div>
                              <span className="text-ink-500">MoV:</span>
                              <span className="text-ink-700 ml-1 text-xs">{indicator.meansOfVerification}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-ink-500 py-8">No indicators defined yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Beneficiary Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {project.beneficiaryBreakdown ? (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          {project.beneficiaryBreakdown.directMale || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Direct Male</p>
                      </div>
                      <div className="text-center p-4 bg-pink-50 rounded-lg">
                        <p className="text-2xl font-bold text-pink-600">
                          {project.beneficiaryBreakdown.directFemale || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Direct Female</p>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">
                          {project.beneficiaryBreakdown.directChildren || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Children</p>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          {project.beneficiaryBreakdown.directPWD || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">PWD</p>
                      </div>
                      <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <p className="text-2xl font-bold text-orange-600">
                          {project.beneficiaryBreakdown.indirectTotal || 0}
                        </p>
                        <p className="text-xs text-ink-600 mt-1">Indirect</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center text-ink-500 py-8">No beneficiary data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* CFM Tab */}
          {activeTab === 'cfm' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Community Feedback Mechanism</CardTitle>
                    <button
                      onClick={() => setShowCFMModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                    >
                      <Plus size={16} />
                      Log Feedback
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  {project.cfmLog && project.cfmLog.length > 0 ? (
                    <div className="space-y-4">
                      {project.cfmLog.map((feedback) => (
                        <div key={feedback.id} className="bg-ink-50 rounded-lg p-4 border border-ink-100">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getFeedbackTypeColor(feedback.feedbackType)}`}>
                                {feedback.feedbackType}
                              </span>
                              <span className="text-xs text-ink-500">via {feedback.channel}</span>
                              <span className={`text-xs font-semibold ${getSeverityColor(feedback.severity)}`}>
                                {feedback.severity} Severity
                              </span>
                            </div>
                            <span className="text-xs text-ink-500">{feedback.date}</span>
                          </div>

                          <p className="text-sm text-ink-700 mb-2">{feedback.description}</p>

                          <div className="flex items-center justify-between text-xs">
                            <div>
                              <span className="text-ink-500">Reported by: </span>
                              <span className="font-semibold text-ink-700">{feedback.reportedBy}</span>
                              <span className="text-ink-500 ml-3">Contact: </span>
                              <span className="text-ink-700">{feedback.contactInfo}</span>
                            </div>

                            {feedback.status === 'Resolved' ? (
                              <div className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
                                <span className="text-green-700 font-semibold">✓ Resolved</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleResolveCFM(feedback.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                              >
                                Mark as Resolved
                              </button>
                            )}
                          </div>

                          {feedback.status === 'Resolved' && (
                            <div className="mt-3 pt-3 border-t border-ink-100">
                              <p className="text-xs text-ink-600 mb-1">
                                <span className="font-semibold">Action Taken:</span> {feedback.actionTaken}
                              </p>
                              <p className="text-xs text-ink-600">
                                <span className="font-semibold">Resolved By:</span> {feedback.responsiblePerson} on {feedback.dateResolved}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-ink-500 py-8">No feedback logged yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Tasks ({projectTasks?.length || 0})</CardTitle>
                  <button
                    onClick={() => setShowCreateTask(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Error Display */}
                {taskError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Task Operation Failed</h4>
                      <p className="text-sm text-red-700">{taskError}</p>
                    </div>
                    <button
                      onClick={() => setTaskError(null)}
                      className="flex-shrink-0 text-red-600 hover:text-red-800 transition"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}

                {loadingTasks ? (
                  <div className="text-center py-8">
                    <LoadingSpinner size="md" message="Loading tasks..." />
                  </div>
                ) : projectTasks && projectTasks.length > 0 ? (
                  <div className="space-y-3">
                    {projectTasks.map((task) => {
                      const dueDateInfo = getDueDateLabel(task.dueDate);
                      return (
                        <div key={task.id} className="border border-ink-100 rounded-lg p-4 hover:border-blue-300 transition bg-white shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-start gap-3 flex-1">
                              {getTaskStatusIcon(task.status)}
                              <div className="flex-1">
                                <h4 className="font-semibold text-ink-900">{task.title || task.name}</h4>
                                <p className="text-sm text-ink-600 mt-1">
                                  {task.assignedTo ? `Assigned to: ${task.assignedTo}` : 'Not assigned'}
                                </p>
                                {task.taskType && (
                                  <span className="inline-block mt-1 text-xs text-ink-500 bg-ink-100 px-2 py-1 rounded">
                                    {task.taskType}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTaskStatusColor(task.status)}`}>
                                {task.status}
                              </span>
                              {task.priority && (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                              )}
                              {dueDateInfo && (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${dueDateInfo.color}`}>
                                  {dueDateInfo.label}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="mb-3">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-ink-500">Progress</span>
                              <span className="text-xs font-bold text-ink-900">{task.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-ink-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${task.progress || 0}%` }}
                              ></div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-ink-500 mb-3">
                            <span>Start: {task.startDate || 'N/A'}</span>
                            <span>Due: {task.dueDate || task.endDate || 'N/A'}</span>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-3 border-t border-ink-100">
                            <button
                              onClick={() => handleViewTask(task)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition text-sm font-semibold"
                            >
                              <Eye size={16} />
                              View
                            </button>
                            {task.status !== 'Completed' && (
                              <>
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-ink-50 text-ink-600 rounded-lg hover:bg-ink-100 transition text-sm font-semibold"
                                >
                                  <Edit size={16} />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleUpdateProgress(task)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition text-sm font-semibold"
                                >
                                  <RefreshCw size={16} />
                                  Update
                                </button>
                                <button
                                  onClick={() => handleCompleteTask(task)}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition text-sm font-semibold"
                                >
                                  <CheckSquare size={16} />
                                  Complete
                                </button>
                                {task.involvesBeneficiaries && task.taskType === 'Beneficiary Selection' && (
                                  <button
                                    onClick={() => handleSelectBeneficiaries(task)}
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition text-sm font-semibold"
                                  >
                                    <Users size={16} />
                                    Select
                                  </button>
                                )}
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-sm font-semibold"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-ink-500 py-8">No tasks added yet</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline - Gantt Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <GanttChart tasks={projectTasks || []} />
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-semibold"
            >
              Close
            </button>
            {(project.status === 'Closing' || project.status === 'Completed') && (
              <button
                onClick={() => onGenerateReport(project)}
                className="flex-1 px-6 py-3 bg-navy-900 text-white rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <FileText size={18} />
                Generate Completion Report
              </button>
            )}
            <button
              onClick={() => alert('Edit project coming soon!')}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              Edit Project
            </button>
          </div>
        </div>

        {/* CFM Modal */}
        {showCFMModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-blue-600 text-white p-6 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Log Community Feedback</h3>
                  <button
                    onClick={() => setShowCFMModal(false)}
                    className="p-2 hover:bg-blue-700 rounded-lg transition"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCFMSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Feedback Type *</label>
                    <select
                      value={cfmFormData.feedbackType}
                      onChange={(e) => setCfmFormData({...cfmFormData, feedbackType: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Complaint">Complaint</option>
                      <option value="Suggestion">Suggestion</option>
                      <option value="Positive">Positive Feedback</option>
                      <option value="Query">Query</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Channel *</label>
                    <select
                      value={cfmFormData.channel}
                      onChange={(e) => setCfmFormData({...cfmFormData, channel: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Hotline">Hotline</option>
                      <option value="Email">Email</option>
                      <option value="SMS">SMS</option>
                      <option value="In-Person">In-Person</option>
                      <option value="Feedback Box">Feedback Box</option>
                      <option value="Online Form">Online Form</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Severity *</label>
                  <select
                    value={cfmFormData.severity}
                    onChange={(e) => setCfmFormData({...cfmFormData, severity: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-1">Description *</label>
                  <textarea
                    value={cfmFormData.description}
                    onChange={(e) => setCfmFormData({...cfmFormData, description: e.target.value})}
                    required
                    rows="4"
                    className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the feedback in detail..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Reported By *</label>
                    <input
                      type="text"
                      value={cfmFormData.reportedBy}
                      onChange={(e) => setCfmFormData({...cfmFormData, reportedBy: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Name of person reporting"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-1">Contact Info *</label>
                    <input
                      type="text"
                      value={cfmFormData.contactInfo}
                      onChange={(e) => setCfmFormData({...cfmFormData, contactInfo: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Phone/Email"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCFMModal(false)}
                    className="flex-1 px-6 py-3 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
                    Submit Feedback
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Detail View Modal */}
        {showTaskDetailView && selectedTask && (
          <TaskDetailView
            task={selectedTask}
            onClose={() => {
              setShowTaskDetailView(false);
              setSelectedTask(null);
            }}
            onAssign={() => {
              setShowTaskDetailView(false);
              setShowTaskAssignment(true);
            }}
            onUpdateProgress={() => {
              setShowTaskDetailView(false);
              setShowTaskProgress(true);
            }}
            onComplete={() => {
              setShowTaskDetailView(false);
              setShowTaskCompletion(true);
            }}
            onSelectBeneficiaries={() => {
              setShowTaskDetailView(false);
              setShowBeneficiarySelection(true);
            }}
          />
        )}

        {/* Task Assignment Modal */}
        {showTaskAssignment && selectedTask && (
          <TaskAssignmentModal
            task={selectedTask}
            onClose={() => {
              setShowTaskAssignment(false);
              setSelectedTask(null);
              setTaskError(null);
            }}
            onAssign={async (assignmentData) => {
              try {
                setIsLoadingTask(true);
                setTaskError(null);

                // Call backend API to assign task
                await taskService.assignTask(selectedTask.id, assignmentData);

                // Close modal
                setShowTaskAssignment(false);
                setSelectedTask(null);

                // Refresh project data to show updated tasks
                if (refreshProject) {
                  await refreshProject(project.id);
                }

                // Show success toast
                setToast({ message: 'Task assigned successfully', type: 'success' });
              } catch (error) {
                console.error('❌ Task assignment failed:', error);
                setTaskError(error.message || 'Failed to assign task. Please try again.');
              } finally {
                setIsLoadingTask(false);
              }
            }}
          />
        )}

        {/* Task Progress Modal */}
        {showTaskProgress && selectedTask && (
          <TaskProgressModal
            task={selectedTask}
            onClose={() => {
              setShowTaskProgress(false);
              setSelectedTask(null);
              setTaskError(null);
            }}
            onUpdate={async (progressData) => {
              try {
                setIsLoadingTask(true);
                setTaskError(null);

                // Call backend API to update task
                await taskService.updateTask(selectedTask.id, progressData);

                // Close modal
                setShowTaskProgress(false);
                setSelectedTask(null);

                // Reload tasks from API to show updated tasks
                await loadProjectTasks();

                // Show success toast
                setToast({ message: 'Task progress updated successfully', type: 'success' });
              } catch (error) {
                console.error('❌ Task progress update failed:', error);
                setTaskError(error.message || 'Failed to update task progress. Please try again.');
              } finally {
                setIsLoadingTask(false);
              }
            }}
          />
        )}

        {/* Task Completion Modal */}
        {showTaskCompletion && selectedTask && (
          <TaskCompletionModal
            task={selectedTask}
            onClose={() => {
              setShowTaskCompletion(false);
              setSelectedTask(null);
              setTaskError(null);
            }}
            onComplete={async (completionData) => {
              try {
                setIsLoadingTask(true);
                setTaskError(null);

                // Call backend API to update task with completion data
                await taskService.updateTask(selectedTask.id, {
                  status: 'Completed',
                  progress: 100,
                  ...completionData
                });

                // Close modal
                setShowTaskCompletion(false);
                setSelectedTask(null);

                // Reload tasks from API to show updated tasks
                await loadProjectTasks();

                // Show success toast
                setToast({ message: 'Task completed successfully', type: 'success' });
              } catch (error) {
                console.error('❌ Task completion failed:', error);
                setTaskError(error.message || 'Failed to complete task. Please try again.');
              } finally {
                setIsLoadingTask(false);
              }
            }}
          />
        )}

        {/* Create Task Modal */}
        <CreateTaskModal
          isOpen={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          defaultProjectId={project.id}
          projectTeamMembers={project.teamMembers || []}
          onTaskCreated={async () => {
            setShowCreateTask(false);

            // Reload tasks from API to show the new task
            await loadProjectTasks();

            // Show success toast
            setToast({ message: 'Task created successfully', type: 'success' });
          }}
        />

        {/* Edit Task Modal */}
        {showEditTask && selectedTask && (
          <TaskFormModal
            mode="edit"
            task={selectedTask}
            isOpen={showEditTask}
            onClose={() => {
              setShowEditTask(false);
              setSelectedTask(null);
            }}
            projectTeamMembers={project.teamMembers || []}
            onTaskUpdated={async () => {
              // Reload tasks from API to show the updated task
              await loadProjectTasks();

              // Show success toast
              setToast({ message: 'Task updated successfully', type: 'success' });
            }}
          />
        )}

        {/* Beneficiary Selection Modal */}
        {showBeneficiarySelection && selectedTask && (
          <BeneficiarySelectionModal
            isOpen={showBeneficiarySelection}
            onClose={() => {
              setShowBeneficiarySelection(false);
              setSelectedTask(null);
            }}
            task={selectedTask}
            onBeneficiariesSelected={async () => {
              // Reload tasks from API to show the updated task
              await loadProjectTasks();

              // Show success toast
              setToast({ message: 'Beneficiaries selected successfully', type: 'success' });
            }}
          />
        )}

        {/* Loading Overlay */}
        {isLoadingTask && (
          <LoadingSpinner
            fullScreen
            message="Processing task operation..."
            size="lg"
          />
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

const OverviewCard = ({ icon: Icon, label, value, color, subtitle }) => (
  <div className="bg-white rounded-lg border border-ink-100 p-4">
    <div className="flex items-center gap-3">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-xs text-ink-500 uppercase">{label}</p>
        <p className="text-xl font-bold text-ink-900">{value}</p>
        {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
      </div>
    </div>
  </div>
);

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <Icon size={18} className="text-blue-500 mt-0.5" />
    <div>
      <p className="text-xs text-ink-500 uppercase">{label}</p>
      <p className="text-sm font-semibold text-ink-900">{value || 'N/A'}</p>
    </div>
  </div>
);

export default ProjectDetails;
