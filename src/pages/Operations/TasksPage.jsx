import React, { useState } from 'react';
import { useProjects } from '../../contexts/ProjectContext';
import { useHR } from '../../contexts/HRContext';
import {
  ClipboardCheck, CheckCircle, Clock, AlertCircle, Users, Calendar, Flag,
  Plus, Eye, Edit2, Trash2, MessageSquare, Paperclip, PlayCircle, StopCircle,
  List, LayoutGrid, Filter, ChevronDown, ChevronRight, Link as LinkIcon, X
} from 'lucide-react';

const TasksPage = () => {
  const { projects } = useProjects();
  const { staff } = useHR();

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  // Form state for new task
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: '',
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
    assignee: '',
    timeEstimate: '',
    tags: ''
  });

  const [tasks, setTasks] = useState([]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reset form
  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      project: '',
      priority: 'Medium',
      status: 'To Do',
      dueDate: '',
      assignee: '',
      timeEstimate: '',
      tags: ''
    });
  };

  // Create new task
  const handleCreateTask = () => {
    // Validation
    if (!newTask.title.trim() || !newTask.description.trim() || !newTask.project || !newTask.dueDate) {
      alert('Please fill in all required fields (Title, Description, Project, Due Date)');
      return;
    }

    // Create new task object
    const taskToAdd = {
      id: tasks.length + 1,
      title: newTask.title,
      description: newTask.description,
      project: newTask.project,
      assignee: newTask.assignee ? {
        name: newTask.assignee,
        avatar: newTask.assignee.split(' ').map(n => n[0]).join('').toUpperCase()
      } : { name: 'Unassigned', avatar: 'UN' },
      priority: newTask.priority,
      status: newTask.status,
      dueDate: newTask.dueDate,
      progress: newTask.status === 'Completed' ? 100 : (newTask.status === 'In Progress' ? 50 : 0),
      timeTracked: 0,
      timeEstimate: parseInt(newTask.timeEstimate) || 0,
      tags: newTask.tags ? newTask.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      comments: [],
      attachments: [],
      subtasks: [],
      dependencies: []
    };

    // Add task to list
    setTasks(prev => [taskToAdd, ...prev]);

    // Reset form and close modal
    resetForm();
    setShowAddTask(false);

    // Show success message (optional)
    alert('Task created successfully!');
  };

  const getStatusIcon = (status) => {
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
  };

  const getStatusColor = (status) => {
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
  };

  const getPriorityColor = (priority) => {
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
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const toggleTaskExpanded = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const openTaskDetail = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

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
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'Completed').length
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
          <h2 className="text-sm font-bold text-gray-900 mb-6">My Tasks</h2>
          <div className="space-y-3">
            {tasks.map((task, index) => {
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
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() => toggleTaskExpanded(task.id)}
                          className="hover:bg-gray-100 rounded p-1 transition-colors"
                        >
                          {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </button>
                        <h3 className="font-bold text-gray-900 hover:text-indigo-600 cursor-pointer" onClick={() => openTaskDetail(task)}>
                          {task.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${getStatusColor(task.status)}`}>
                          {getStatusIcon(task.status)}
                          {task.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 ml-8">{task.project}</p>
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
                        <p className="text-sm font-semibold text-gray-900 truncate">{task.assignee.name}</p>
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
                      {task.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-semibold">
                          {tag}
                        </span>
                      ))}
                      {task.comments.length > 0 && (
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
                    <button
                      onClick={() => openTaskDetail(task)}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all text-xs font-semibold"
                    >
                      <Eye size={14} />
                      View Details
                    </button>
                  </div>

                  {/* Expanded View - Subtasks */}
                  {isExpanded && (
                    <div className="mt-4 ml-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-bold text-gray-900 mb-3">Subtasks</h4>
                      <div className="space-y-2">
                        {task.subtasks.map((subtask) => (
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
            const columnTasks = tasks.filter(t => t.status === column.id);
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
                      <p className="text-xs text-gray-600 mb-2">{task.project}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-bold text-indigo-700">
                          {task.assignee.avatar}
                        </div>
                        <span className="text-xs text-gray-500">{task.assignee.name}</span>
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
      {showTaskDetail && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedTask.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getStatusColor(selectedTask.status)}`}>
                      {getStatusIcon(selectedTask.status)}
                      {selectedTask.status}
                    </span>
                    <span className={`px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-bold flex items-center gap-1`}>
                      <Flag size={14} />
                      {selectedTask.priority} Priority
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowTaskDetail(false)}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedTask.description}</p>
              </div>

              {/* Task Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Assigned To</p>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedTask.assignee.avatar}
                    </div>
                    <span className="font-semibold text-gray-900">{selectedTask.assignee.name}</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Due Date</p>
                  <p className="font-semibold text-gray-900">{selectedTask.dueDate}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Time Tracked</p>
                  <p className="font-semibold text-gray-900">{formatTime(selectedTask.timeTracked)} / {formatTime(selectedTask.timeEstimate)}</p>
                  <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-green-600 h-1.5 rounded-full"
                      style={{ width: `${(selectedTask.timeTracked / selectedTask.timeEstimate) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Project</p>
                  <p className="font-semibold text-gray-900">{selectedTask.project}</p>
                </div>
              </div>

              {/* Subtasks */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Subtasks ({selectedTask.subtasks.filter(st => st.completed).length}/{selectedTask.subtasks.length})</h3>
                <div className="space-y-2">
                  {selectedTask.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        className="w-5 h-5 text-indigo-600 rounded"
                        readOnly
                      />
                      <span className={`flex-1 ${subtask.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {subtask.title}
                      </span>
                      {subtask.completed && <CheckCircle size={18} className="text-green-600" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dependencies */}
              {selectedTask.dependencies.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Dependencies ({selectedTask.dependencies.length})</h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">This task depends on the following tasks to be completed first:</p>
                    <div className="space-y-2">
                      {selectedTask.dependencies.map((depId) => {
                        const dependentTask = tasks.find(t => t.id === depId);
                        if (!dependentTask) return null;
                        return (
                          <div key={depId} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200">
                            <LinkIcon size={18} className="text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-sm truncate">{dependentTask.title}</p>
                              <p className="text-xs text-gray-600">{dependentTask.project}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold border flex items-center gap-1 flex-shrink-0 ${getStatusColor(dependentTask.status)}`}>
                              {getStatusIcon(dependentTask.status)}
                              {dependentTask.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedTask.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Attachments ({selectedTask.attachments.length})</h3>
                  <div className="space-y-2">
                    {selectedTask.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                        <Paperclip size={18} className="text-gray-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{attachment.name}</p>
                          <p className="text-xs text-gray-500">{attachment.size}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Comments ({selectedTask.comments.length})</h3>
                <div className="space-y-3">
                  {selectedTask.comments.map((comment) => (
                    <div key={comment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900">{comment.author}</span>
                        <span className="text-xs text-gray-500">{comment.time}</span>
                      </div>
                      <p className="text-gray-700">{comment.text}</p>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold">
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between">
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center gap-2">
                  <PlayCircle size={18} />
                  Start Timer
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2">
                  <Edit2 size={18} />
                  Edit
                </button>
              </div>
              <button
                onClick={() => setShowTaskDetail(false)}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-700 text-white p-6 rounded-t-2xl z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Create New Task</h2>
                  <p className="text-indigo-100">Add a new task to your project</p>
                </div>
                <button
                  onClick={() => setShowAddTask(false)}
                  className="p-2 hover:bg-indigo-700 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Task Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Task Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={newTask.title}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter task title"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                      <textarea
                        name="description"
                        value={newTask.description}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows="3"
                        placeholder="Enter task description"
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Project *</label>
                      <select
                        name="project"
                        value={newTask.project}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="">Select project</option>
                        <option value="Child Protection Initiative">Child Protection Initiative</option>
                        <option value="Youth Skills Development">Youth Skills Development</option>
                        <option value="Orphan Care Program">Orphan Care Program</option>
                        <option value="Emergency Response">Emergency Response</option>
                        <option value="Education Program">Education Program</option>
                        <option value="All Projects">All Projects</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Priority *</label>
                      <select
                        name="priority"
                        value={newTask.priority}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Status *</label>
                      <select
                        name="status"
                        value={newTask.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="To Do">To Do</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
                      <input
                        type="date"
                        name="dueDate"
                        value={newTask.dueDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Assignee</label>
                      <input
                        type="text"
                        name="assignee"
                        value={newTask.assignee}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter assignee name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Time Estimate (minutes)</label>
                      <input
                        type="number"
                        name="timeEstimate"
                        value={newTask.timeEstimate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0"
                        min="0"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tags (comma separated)</label>
                      <input
                        type="text"
                        name="tags"
                        value={newTask.tags}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="e.g., MEAL, Urgent, Report"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> After creating the task, you can add subtasks, comments, attachments, and track time from the task detail view. You can also use templates for common task types.
                  </p>
                </div>
              </form>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4 rounded-b-2xl flex justify-between">
              <button
                onClick={() => {
                  resetForm();
                  setShowAddTask(false);
                }}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTask}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-700 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default TasksPage;
