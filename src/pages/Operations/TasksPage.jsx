import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { useHR } from '../../contexts/HRContext';
import { fetchTasks, deleteTask } from '../../services/taskService';
import CreateTaskModal from './components/CreateTaskModal';
import TaskFormModal from './components/TaskFormModal';
import TaskViewModal from './components/TaskViewModal';
import BeneficiarySelectionModal from './components/BeneficiarySelectionModal';
import AggregateDistributionModal from './components/AggregateDistributionModal';
import IndividualDistributionModal from './components/IndividualDistributionModal';
import BudgetWorkflowModal from './components/BudgetWorkflowModal';
import MediaCoverageModal from './components/MediaCoverageModal';
import TaskDetailView from './components/TaskDetailView';
import TaskAssignmentModal from './components/TaskAssignmentModal';
import AdvancedFilters from '../../components/tasks/AdvancedFilters';
import FilterChips from '../../components/tasks/FilterChips';
import {
  ClipboardCheck, CheckCircle, Clock, AlertCircle, Users, Calendar, Flag,
  Plus, Eye, Edit2, Trash2, MessageSquare, Paperclip, PlayCircle, StopCircle,
  List, LayoutGrid, Filter, ChevronDown, ChevronRight, Link as LinkIcon, X, Download,
  Square, CheckSquare, Trash, UserPlus
} from 'lucide-react';
import { exportTasksToCSV } from '../../utils/exportUtils';

const TasksPage = () => {
  const { projects } = useProjects();
  const { staff } = useHR();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [tasks, setTasks] = useState([]);

  // Bulk operations state
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkAction, setBulkAction] = useState(null); // 'status', 'assign', 'delete'
  const [showBulkConfirmation, setShowBulkConfirmation] = useState(false);

  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: [],
    priority: [],
    dateFrom: '',
    dateTo: '',
    assignee: [],
    project: [],
    searchTerm: ''
  });

  // Modal states for task operations
  const [showBeneficiarySelection, setShowBeneficiarySelection] = useState(false);
  const [showAggregateDistribution, setShowAggregateDistribution] = useState(false);
  const [showIndividualDistribution, setShowIndividualDistribution] = useState(false);
  const [showBudgetWorkflow, setShowBudgetWorkflow] = useState(false);
  const [showMediaCoverage, setShowMediaCoverage] = useState(false);
  const [showTaskDetailView, setShowTaskDetailView] = useState(false);
  const [showTaskAssignment, setShowTaskAssignment] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Fetch tasks from backend on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTasks();
      console.log('📊 Tasks API Response:', response);

      // Backend returns { success: true, tasks: [...] }
      if (response.success && response.tasks) {
        // Ensure each task has required properties with defaults
        const tasksWithDefaults = response.tasks.map(task => ({
          ...task,
          status: task.status || 'To Do',
          priority: task.priority || 'Medium',
          id: task.id,
          title: task.title || 'Untitled Task',
          assignee: task.assignee || null, // Explicitly set to null if undefined
          assignees: task.assignees || [],
          subtasks: task.subtasks || [],
          dependencies: task.dependencies || [],
          project: task.project || null, // Explicitly set to null if undefined
          tags: task.tags || [],
          comments: task.comments || [],
          attachments: task.attachments || []
        }));

        console.log('📊 Processed Tasks:', tasksWithDefaults);
        setTasks(tasksWithDefaults);
      } else {
        console.warn('⚠️ Unexpected response structure:', response);
        setTasks([]);
      }
    } catch (err) {
      console.error('❌ Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = useCallback((newTask) => {
    // Ensure new task has required properties with defaults
    const taskWithDefaults = {
      ...newTask,
      status: newTask.status || 'To Do',
      priority: newTask.priority || 'Medium',
      id: newTask.id,
      title: newTask.title || 'Untitled Task',
      assignee: newTask.assignee || null,
      assignees: newTask.assignees || [],
      subtasks: newTask.subtasks || [],
      dependencies: newTask.dependencies || [],
      project: newTask.project || null,
      tags: newTask.tags || [],
      comments: newTask.comments || [],
      attachments: newTask.attachments || []
    };
    setTasks(prev => [taskWithDefaults, ...prev]);
    // Reload to get full task data with associations
    loadTasks();
  }, []);

  // Memoized helper functions
  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={14} className="text-green-600" />;
      case 'In Progress':
        return <Clock size={14} className="text-blue-600" />;
      case 'To Do':
        return <AlertCircle size={14} className="text-orange-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'To Do':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  }, []);

  const getPriorityColor = useCallback((priority) => {
    switch (priority) {
      case 'High':
        return 'text-red-600';
      case 'Medium':
        return 'text-orange-600';
      case 'Low':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  }, []);

  const formatTime = useCallback((minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  // Export tasks to CSV
  const handleExportCSV = useCallback(() => {
    if (tasks && tasks.length > 0) {
      exportTasksToCSV(tasks);
    }
  }, [tasks]);

  // Bulk operations handlers
  const toggleTaskSelection = useCallback((taskId) => {
    setSelectedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  const selectAllTasks = useCallback(() => {
    const allTaskIds = new Set(tasks.filter(task => task?.id).map(task => task.id));
    setSelectedTaskIds(allTaskIds);
  }, [tasks]);

  const deselectAllTasks = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  const handleBulkStatusUpdate = useCallback(async (newStatus) => {
    if (selectedTaskIds.size === 0) return;

    try {
      // Update tasks locally (in a real app, this would be an API call)
      setTasks(prev => prev.map(task =>
        selectedTaskIds.has(task.id) ? { ...task, status: newStatus } : task
      ));

      // Clear selection
      setSelectedTaskIds(new Set());
      setShowBulkActions(false);

      // Show success message
      alert(`Updated ${selectedTaskIds.size} task(s) to ${newStatus}`);
    } catch (error) {
      console.error('Error updating tasks:', error);
      alert('Failed to update tasks');
    }
  }, [selectedTaskIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedTaskIds.size === 0) return;

    try {
      // Delete tasks locally (in a real app, this would be an API call)
      setTasks(prev => prev.filter(task => !selectedTaskIds.has(task.id)));

      // Clear selection
      setSelectedTaskIds(new Set());
      setShowBulkConfirmation(false);
      setShowBulkActions(false);

      // Show success message
      alert(`Deleted ${selectedTaskIds.size} task(s)`);
    } catch (error) {
      console.error('Error deleting tasks:', error);
      alert('Failed to delete tasks');
    }
  }, [selectedTaskIds]);

  // Advanced filtering handlers
  const handleApplyFilters = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  const handleRemoveFilter = useCallback((key, value) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };

      if (key === 'dateFrom' || key === 'dateTo' || key === 'searchTerm') {
        newFilters[key] = '';
      } else if (Array.isArray(prev[key])) {
        newFilters[key] = prev[key].filter(item => item !== value);
      }

      return newFilters;
    });
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setActiveFilters({
      status: [],
      priority: [],
      dateFrom: '',
      dateTo: '',
      assignee: [],
      project: [],
      searchTerm: ''
    });
  }, []);

  // Apply filters to tasks using useMemo for performance
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];

    // Status filter
    if (activeFilters.status && activeFilters.status.length > 0) {
      filtered = filtered.filter(task => task?.status && activeFilters.status.includes(task.status));
    }

    // Priority filter
    if (activeFilters.priority && activeFilters.priority.length > 0) {
      filtered = filtered.filter(task => task?.priority && activeFilters.priority.includes(task.priority));
    }

    // Date range filter
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      filtered = filtered.filter(task => {
        if (!task.dueDate) return false;

        const taskDate = new Date(task.dueDate);
        const fromDate = activeFilters.dateFrom ? new Date(activeFilters.dateFrom) : null;
        const toDate = activeFilters.dateTo ? new Date(activeFilters.dateTo) : null;

        if (fromDate && taskDate < fromDate) return false;
        if (toDate && taskDate > toDate) return false;

        return true;
      });
    }

    // Project filter
    if (activeFilters.project && activeFilters.project.length > 0) {
      filtered = filtered.filter(task =>
        task.projectId && activeFilters.project.includes(task.projectId)
      );
    }

    // Assignee filter
    if (activeFilters.assignee && activeFilters.assignee.length > 0) {
      filtered = filtered.filter(task =>
        task.assignedTo && activeFilters.assignee.includes(task.assignedTo)
      );
    }

    // Search term filter
    if (activeFilters.searchTerm) {
      const searchLower = activeFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [tasks, activeFilters]);

  const toggleTaskExpanded = useCallback((taskId) => {
    setExpandedTasks(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(taskId)) {
        newExpanded.delete(taskId);
      } else {
        newExpanded.add(taskId);
      }
      return newExpanded;
    });
  }, []);

  const openTaskDetail = useCallback((task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  }, []);

  const handleEditTask = useCallback((task) => {
    setSelectedTask(task);
    setShowEditTask(true);
  }, []);

  const handleDeleteTask = useCallback(async (task) => {
    if (!window.confirm(`Are you sure you want to delete the task "${task.title || task.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('🗑️ Deleting task:', task.id, task.title);
      await deleteTask(task.id);
      console.log('✅ Task deleted successfully');

      // Refresh tasks list
      await loadTasks();

      alert('Task deleted successfully');
    } catch (err) {
      console.error('❌ Error deleting task:', err);
      alert(err.message || 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  }, [loadTasks]);

  // Task Templates
  const taskTemplates = [
    {
      id: 'meal-report',
      name: 'MEAL Quarterly Report',
      description: 'Standard template for quarterly MEAL reporting',
      category: 'MEAL',
      project: 'All Projects',
      priority: 'High',
      timeEstimate: 720,
      tags: ['MEAL', 'Report'],
      subtasks: [
        { title: 'Collect data from all field teams', completed: false },
        { title: 'Analyze and compile indicators', completed: false },
        { title: 'Prepare visual charts and graphs', completed: false },
        { title: 'Write executive summary', completed: false },
        { title: 'Review and finalize report', completed: false }
      ]
    },
    {
      id: 'donor-report',
      name: 'Donor Report Preparation',
      description: 'Template for preparing comprehensive donor reports',
      category: 'Finance',
      project: 'Finance',
      priority: 'High',
      timeEstimate: 600,
      tags: ['Report', 'Donor'],
      subtasks: [
        { title: 'Gather financial statements', completed: false },
        { title: 'Compile impact metrics', completed: false },
        { title: 'Prepare case studies and photos', completed: false },
        { title: 'Write narrative sections', completed: false },
        { title: 'Internal review and approval', completed: false }
      ]
    },
    {
      id: 'field-visit',
      name: 'Field Visit Organization',
      description: 'Standard checklist for organizing field visits',
      category: 'Operations',
      project: 'Operations',
      priority: 'Medium',
      timeEstimate: 360,
      tags: ['Logistics', 'Visit'],
      subtasks: [
        { title: 'Select visit locations and dates', completed: false },
        { title: 'Arrange transportation', completed: false },
        { title: 'Confirm participant list', completed: false },
        { title: 'Prepare materials and supplies', completed: false },
        { title: 'Conduct post-visit documentation', completed: false }
      ]
    },
    {
      id: 'budget-review',
      name: 'Budget Review and Adjustment',
      description: 'Template for reviewing and adjusting project budgets',
      category: 'Finance',
      project: 'Finance',
      priority: 'Medium',
      timeEstimate: 300,
      tags: ['Finance', 'Review'],
      subtasks: [
        { title: 'Review budget requests from PMs', completed: false },
        { title: 'Analyze variance reports', completed: false },
        { title: 'Prepare adjustment recommendations', completed: false },
        { title: 'Get management approval', completed: false }
      ]
    },
    {
      id: 'community-session',
      name: 'Community Feedback Session',
      description: 'Organize community feedback and consultation sessions',
      category: 'CFM',
      project: 'Community Engagement',
      priority: 'Medium',
      timeEstimate: 480,
      tags: ['CFM', 'Community'],
      subtasks: [
        { title: 'Identify community leaders and stakeholders', completed: false },
        { title: 'Send invitations and confirm attendance', completed: false },
        { title: 'Prepare feedback forms and materials', completed: false },
        { title: 'Conduct session and document feedback', completed: false },
        { title: 'Analyze feedback and prepare action plan', completed: false }
      ]
    },
    {
      id: 'staff-onboarding',
      name: 'New Staff Onboarding',
      description: 'Comprehensive onboarding checklist for new staff members',
      category: 'HR',
      project: 'HR',
      priority: 'Low',
      timeEstimate: 420,
      tags: ['HR', 'Training'],
      subtasks: [
        { title: 'Prepare workstation and equipment', completed: false },
        { title: 'Complete HR documentation', completed: false },
        { title: 'Conduct organization orientation', completed: false },
        { title: 'Assign mentor and training plan', completed: false },
        { title: 'Schedule follow-up meetings', completed: false }
      ]
    }
  ];

  const createTaskFromTemplate = (template) => {
    const newTask = {
      id: tasks.length + 1,
      title: template.name,
      description: template.description,
      project: template.project,
      assignee: { name: 'Unassigned', avatar: '?' },
      priority: template.priority,
      status: 'To Do',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      progress: 0,
      timeTracked: 0,
      timeEstimate: template.timeEstimate,
      tags: template.tags,
      comments: [],
      attachments: [],
      subtasks: template.subtasks.map((st, idx) => ({ id: idx + 1, ...st })),
      dependencies: []
    };
    setTasks([...tasks, newTask]);
    setShowTemplates(false);
  };

  const stats = {
    total: tasks.length,
    inProgress: tasks.filter(t => t?.status === 'In Progress').length,
    completed: tasks.filter(t => t?.status === 'Completed').length,
    overdue: tasks.filter(t => t?.dueDate && new Date(t.dueDate) < new Date() && t?.status !== 'Completed').length
  };

  // Kanban columns
  const columns = [
    { id: 'To Do', title: 'To Do', color: 'orange' },
    { id: 'In Progress', title: 'In Progress', color: 'blue' },
    { id: 'Completed', title: 'Completed', color: 'green' }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-500 via-blue-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Advanced Task Management</h1>
                <p className="text-indigo-100 text-sm">Organize, track, and collaborate on tasks</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAdvancedFilters(true)}
                className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white rounded-lg hover:bg-opacity-30 transition-all font-bold flex items-center gap-2"
                title="Advanced Filters"
              >
                <Filter size={20} />
                Filters
              </button>
              <button
                onClick={handleExportCSV}
                disabled={!tasks || tasks.length === 0}
                className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white rounded-lg hover:bg-opacity-30 transition-all font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Export all tasks to CSV"
              >
                <Download size={20} />
                Export CSV
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="px-6 py-3 bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white rounded-lg hover:bg-opacity-30 transition-all font-bold flex items-center gap-2"
              >
                <LayoutGrid size={20} />
                Templates
              </button>
              <button
                onClick={() => setShowAddTask(true)}
                className="px-6 py-3 bg-white text-indigo-600 rounded-lg hover:shadow-lg transition-all font-bold flex items-center gap-2"
              >
                <Plus size={20} />
                New Task
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group cursor-pointer animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">Total Tasks</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
              <p className="text-xs text-gray-500 mt-1">All projects</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <ClipboardCheck className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">In Progress</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.inProgress}</h3>
              <p className="text-xs text-gray-500 mt-1">Active tasks</p>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Clock className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">Completed</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.completed}</h3>
              <p className="text-xs text-gray-500 mt-1">This month</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-xl shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <CheckCircle className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-600 mb-2">Overdue</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.overdue}</h3>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-orange-600 p-3 rounded-xl shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <AlertCircle className="text-white" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle & Filters */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={18} />
            List View
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
              viewMode === 'kanban'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={18} />
            Kanban Board
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-semibold">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </div>

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {/* Bulk Actions Toolbar */}
          {selectedTaskIds.size > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900">
                  {selectedTaskIds.size} task(s) selected
                </span>
                <button
                  onClick={deselectAllTasks}
                  className="text-xs text-blue-700 hover:text-blue-900 underline"
                >
                  Clear selection
                </button>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleBulkStatusUpdate('To Do')}
                  className="px-3 py-1.5 bg-orange-500 text-white text-sm rounded hover:bg-orange-600 transition-colors"
                >
                  Mark To Do
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('In Progress')}
                  className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                >
                  Mark In Progress
                </button>
                <button
                  onClick={() => handleBulkStatusUpdate('Completed')}
                  className="px-3 py-1.5 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => setShowBulkConfirmation(true)}
                  className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors flex items-center gap-1"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-gray-900">My Tasks</h2>
            {tasks.length > 0 && (
              <button
                onClick={selectedTaskIds.size === tasks.length ? deselectAllTasks : selectAllTasks}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
              >
                {selectedTaskIds.size === tasks.length ? (
                  <>
                    <CheckSquare size={14} />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square size={14} />
                    Select All
                  </>
                )}
              </button>
            )}
          </div>

          {/* Filter Chips */}
          <FilterChips
            filters={activeFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
          />

          <div className="space-y-3">
            {filteredTasks.map((task, index) => {
              const isExpanded = expandedTasks.has(task.id);
              const completedSubtasks = task.subtasks.filter(st => st.completed).length;
              const totalSubtasks = task.subtasks.length;

              return (
                <div
                  key={task.id}
                  className="card-modern p-4 animate-slide-up"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Task Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      {/* Checkbox for bulk selection */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskSelection(task.id);
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        {selectedTaskIds.has(task.id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} className="text-gray-400" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleTaskExpanded(task.id)}
                        className="hover:bg-gray-100 rounded p-1 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 hover:text-indigo-600 cursor-pointer" onClick={() => openTaskDetail(task)}>
                          {task.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {task.project?.projectName || 'No Project'}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(task.status)}`}>
                        {getStatusIcon(task.status)}
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Flag size={16} className={getPriorityColor(task.priority)} />
                      <span className={`text-xs font-bold ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Task Meta */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 ml-8">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Users size={14} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Assigned to</p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {task.assignee?.fullName || task.assignee?.name || 'Unassigned'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Calendar size={14} className="text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Due Date</p>
                        <p className="text-sm font-semibold text-gray-900">{task.dueDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock size={14} className="text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Time Tracked</p>
                        <p className="text-sm font-semibold text-gray-900">{formatTime(task.timeTracked)} / {formatTime(task.timeEstimate)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ClipboardCheck size={14} className="text-orange-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500">Subtasks</p>
                        <p className="text-sm font-semibold text-gray-900">{completedSubtasks}/{totalSubtasks}</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="ml-8 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-700">Progress</span>
                      <span className="text-xs font-bold text-indigo-600">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-blue-600 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Tags & Actions */}
                  <div className="flex items-center justify-between ml-8">
                    <div className="flex items-center gap-2 flex-wrap">
                      {task.tags?.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                      {task.comments?.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <MessageSquare size={14} />
                          {task.comments.length}
                        </span>
                      )}
                      {task.attachments.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Paperclip size={14} />
                          {task.attachments.length}
                        </span>
                      )}
                      {task.dependencies.length > 0 && (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <LinkIcon size={14} />
                          {task.dependencies.length}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openTaskDetail(task)}
                        className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all text-xs font-semibold"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditTask(task);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-all text-xs font-semibold"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task);
                        }}
                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all text-xs font-semibold"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Expanded View - Subtasks */}
                  {isExpanded && (
                    <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Subtasks</h4>
                      <div className="space-y-2">
                        {task.subtasks?.map((subtask) => (
                          <div key={subtask.id} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={subtask.completed}
                              className="w-4 h-4 text-indigo-600 rounded"
                              readOnly
                            />
                            <span className={`text-sm ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {subtask.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column) => {
            const columnTasks = tasks.filter(t => t?.status === column.id);
            return (
              <div key={column.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900">{column.title}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">
                    {columnTasks.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openTaskDetail(task)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-sm text-gray-900">{task.title}</h4>
                        <Flag size={14} className={getPriorityColor(task.priority)} />
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{task.project?.projectName || 'No Project'}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                          {task.assignee?.avatar || task.assignee?.fullName?.[0] || '?'}
                        </div>
                        <span className="text-xs text-gray-500">
                          {task.assignee?.fullName || task.assignee?.name || 'Unassigned'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {task.dueDate}
                        </span>
                        <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {/* View Task Detail Modal */}
      <TaskViewModal
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setSelectedTask(null);
        }}
        onEdit={() => {
          setShowEditTask(true);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        onTaskCreated={handleTaskCreated}
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
          onTaskUpdated={() => {
            loadTasks();
          }}
        />
      )}

      {/* Beneficiary Selection Modal */}
      <BeneficiarySelectionModal
        isOpen={showBeneficiarySelection}
        onClose={() => {
          setShowBeneficiarySelection(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onBeneficiariesAdded={() => {
          loadTasks();
        }}
      />

      {/* Aggregate Distribution Modal */}
      <AggregateDistributionModal
        isOpen={showAggregateDistribution}
        onClose={() => {
          setShowAggregateDistribution(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadTasks();
        }}
      />

      {/* Individual Distribution Modal */}
      <IndividualDistributionModal
        isOpen={showIndividualDistribution}
        onClose={() => {
          setShowIndividualDistribution(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadTasks();
        }}
      />

      {/* Budget Workflow Modal */}
      <BudgetWorkflowModal
        isOpen={showBudgetWorkflow}
        onClose={() => {
          setShowBudgetWorkflow(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadTasks();
        }}
        userRole="staff"
      />

      {/* Media Coverage Modal */}
      <MediaCoverageModal
        isOpen={showMediaCoverage}
        onClose={() => {
          setShowMediaCoverage(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadTasks();
        }}
      />

      {/* Task Detail View Modal */}
      <TaskDetailView
        isOpen={showTaskDetailView}
        onClose={() => {
          setShowTaskDetailView(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onEdit={(task) => {
          setActiveTask(task);
          setShowTaskDetailView(false);
          setShowAddTask(true);
        }}
        onAssign={(task) => {
          setActiveTask(task);
          setShowTaskDetailView(false);
          setShowTaskAssignment(true);
        }}
        onUpdateProgress={(task) => {
          // Will be implemented in next component
          console.log('Update progress:', task);
        }}
        onComplete={(task) => {
          // Will be implemented in next component
          console.log('Complete task:', task);
        }}
        onSelectBeneficiaries={(task) => {
          setActiveTask(task);
          setShowTaskDetailView(false);
          setShowBeneficiarySelection(true);
        }}
      />

      {/* Task Assignment Modal */}
      <TaskAssignmentModal
        isOpen={showTaskAssignment}
        onClose={() => {
          setShowTaskAssignment(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadTasks();
        }}
      />

      {/* Task Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Task Templates</h2>
                  <p className="text-purple-100">Create tasks from predefined templates</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="p-2 hover:bg-purple-700 rounded-lg transition"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {taskTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-5 border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {template.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-bold">
                            {template.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Flag size={14} className={getPriorityColor(template.priority)} />
                          <span className={`text-xs font-bold ${getPriorityColor(template.priority)}`}>
                            {template.priority}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Clock size={14} />
                          <span className="text-xs font-semibold">{formatTime(template.timeEstimate)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600">
                          <ClipboardCheck size={14} />
                          <span className="text-xs font-semibold">{template.subtasks.length} subtasks</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Subtasks:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {template.subtasks.map((subtask, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                            <CheckCircle size={12} className="text-gray-400 flex-shrink-0" />
                            <span>{subtask.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => createTaskFromTemplate(template)}
                      className="mt-4 w-full py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold flex items-center justify-center gap-2"
                    >
                      <Plus size={18} />
                      Create Task from Template
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl">
              <button
                onClick={() => setShowTemplates(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirm Bulk Delete</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{selectedTaskIds.size}</strong> selected task(s)?
              All data associated with these tasks will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowBulkConfirmation(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center gap-2"
              >
                <Trash size={16} />
                Delete {selectedTaskIds.size} Task(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Modal */}
      {showAdvancedFilters && (
        <AdvancedFilters
          onApplyFilters={handleApplyFilters}
          onClose={() => setShowAdvancedFilters(false)}
          projects={projects}
          users={staff}
        />
      )}
    </div>
  );
};

export default TasksPage;
