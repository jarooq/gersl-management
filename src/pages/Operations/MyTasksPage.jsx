import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ClipboardCheck,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Flag,
  TrendingUp,
  Eye,
  Filter,
  Search,
  ChevronDown,
  User,
  Briefcase,
  MapPin,
  ListTodo,
  CalendarClock,
  Target,
  BarChart3
} from 'lucide-react';
import { fetchTasks } from '../../services/taskService';
import TaskDetailView from './components/TaskDetailView';
import TaskProgressModal from './components/TaskProgressModal';
import TaskCompletionModal from './components/TaskCompletionModal';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dueDate');

  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);

  // Get current user ID from localStorage (assuming it's stored there)
  const currentUserId = parseInt(localStorage.getItem('userId')) || null;

  useEffect(() => {
    loadMyTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, filterStatus, filterPriority, searchTerm, sortBy]);

  const loadMyTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchTasks();
      if (response.success && response.data) {
        // Filter tasks assigned to current user
        const myTasks = response.data.filter(task => task.assignedTo === currentUserId);
        setTasks(myTasks);
      }
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Memoized helper functions
  const getStatusColor = useCallback((status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200',
      'On Hold': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  }, []);

  const getPriorityColor = useCallback((priority) => {
    const colors = {
      'Low': 'text-green-600',
      'Medium': 'text-yellow-600',
      'High': 'text-orange-600',
      'Urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'In Progress':
        return <Clock className="w-4 h-4" />;
      case 'Pending':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays < 0) {
      return { text: formattedDate, color: 'text-red-600', label: 'Overdue' };
    } else if (diffDays === 0) {
      return { text: formattedDate, color: 'text-orange-600', label: 'Due Today' };
    } else if (diffDays === 1) {
      return { text: formattedDate, color: 'text-orange-600', label: 'Due Tomorrow' };
    } else if (diffDays <= 3) {
      return { text: formattedDate, color: 'text-yellow-600', label: `Due in ${diffDays} days` };
    } else if (diffDays <= 7) {
      return { text: formattedDate, color: 'text-blue-600', label: `Due in ${diffDays} days` };
    } else {
      return { text: formattedDate, color: 'text-gray-600', label: `Due in ${diffDays} days` };
    }
  }, []);

  const applyFilters = useCallback(() => {
    let filtered = [...tasks];

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(task =>
        task.taskName.toLowerCase().includes(search) ||
        task.description?.toLowerCase().includes(search) ||
        task.taskType?.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.endDate || '9999-12-31') - new Date(b.endDate || '9999-12-31');
        case 'priority': {
          const priorityOrder = { 'Urgent': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
          return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
        }
        case 'status': {
          const statusOrder = { 'In Progress': 0, 'Pending': 1, 'On Hold': 2, 'Completed': 3 };
          return (statusOrder[a.status] || 4) - (statusOrder[b.status] || 4);
        }
        case 'name':
          return a.taskName.localeCompare(b.taskName);
        default:
          return 0;
      }
    });

    setFilteredTasks(filtered);
  }, [tasks, filterStatus, filterPriority, searchTerm, sortBy]);

  // Memoized statistics calculations
  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'Pending').length,
    inProgress: tasks.filter(t => t.status === 'In Progress').length,
    completed: tasks.filter(t => t.status === 'Completed').length,
    overdue: tasks.filter(t => {
      if (!t.endDate || t.status === 'Completed') return false;
      return new Date(t.endDate) < new Date();
    }).length,
    dueToday: tasks.filter(t => {
      if (!t.endDate || t.status === 'Completed') return false;
      const today = new Date();
      const dueDate = new Date(t.endDate);
      return today.toDateString() === dueDate.toDateString();
    }).length
  }), [tasks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Tasks</h1>
            <p className="text-blue-100">Manage and track your assigned tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-100">Total Tasks</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <p className="text-sm text-blue-100">In Progress</p>
              <p className="text-3xl font-bold">{stats.inProgress}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <ListTodo className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <p className="text-sm text-gray-600">Total Tasks</p>
        </div>

        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-900">{stats.pending}</span>
          </div>
          <p className="text-sm text-yellow-700">Pending</p>
        </div>

        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{stats.inProgress}</span>
          </div>
          <p className="text-sm text-blue-700">In Progress</p>
        </div>

        <div className="bg-green-50 rounded-lg border border-green-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold text-green-900">{stats.completed}</span>
          </div>
          <p className="text-sm text-green-700">Completed</p>
        </div>

        <div className="bg-red-50 rounded-lg border border-red-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-red-900">{stats.overdue}</span>
          </div>
          <p className="text-sm text-red-700">Overdue</p>
        </div>

        <div className="bg-orange-50 rounded-lg border border-orange-200 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <CalendarClock className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">{stats.dueToday}</span>
          </div>
          <p className="text-sm text-orange-700">Due Today</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-4 gap-4">
          {/* Search */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-medium text-red-900 mb-1">Error</h4>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <ClipboardCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-600">
            {tasks.length === 0
              ? "You don't have any assigned tasks yet."
              : 'No tasks match your current filters. Try adjusting your search criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const dueDate = formatDate(task.endDate);
            const isOverdue = dueDate.label === 'Overdue' && task.status !== 'Completed';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-lg border ${
                  isOverdue ? 'border-red-300 bg-red-50' : 'border-gray-200'
                } p-4 hover:shadow-md transition-all`}
              >
                <div className="flex items-start justify-between">
                  {/* Left Section */}
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${getStatusColor(task.status).split(' ')[0]} rounded-full p-2`}>
                        {getStatusIcon(task.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">{task.taskName}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description || 'No description provided'}
                        </p>

                        {/* Task Details */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            <span>{task.taskType}</span>
                          </div>
                          {task.province && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{task.province}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className={dueDate.color}>{dueDate.text}</span>
                            {isOverdue && (
                              <span className="ml-1 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                                {dueDate.label}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Flag className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
                            <span className={getPriorityColor(task.priority)}>{task.priority} Priority</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setActiveTask(task);
                        setShowTaskDetail(true);
                      }}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                    {task.status !== 'Completed' && (
                      <>
                        <button
                          onClick={() => {
                            setActiveTask(task);
                            setShowProgressModal(true);
                          }}
                          className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Update
                        </button>
                        {task.status === 'In Progress' && (
                          <button
                            onClick={() => {
                              setActiveTask(task);
                              setShowCompletionModal(true);
                            }}
                            className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Complete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Detail View Modal */}
      <TaskDetailView
        isOpen={showTaskDetail}
        onClose={() => {
          setShowTaskDetail(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onEdit={() => {}}
        onAssign={() => {}}
        onUpdateProgress={(task) => {
          setActiveTask(task);
          setShowTaskDetail(false);
          setShowProgressModal(true);
        }}
        onComplete={(task) => {
          setActiveTask(task);
          setShowTaskDetail(false);
          setShowCompletionModal(true);
        }}
      />

      {/* Task Progress Modal */}
      <TaskProgressModal
        isOpen={showProgressModal}
        onClose={() => {
          setShowProgressModal(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadMyTasks();
        }}
      />

      {/* Task Completion Modal */}
      <TaskCompletionModal
        isOpen={showCompletionModal}
        onClose={() => {
          setShowCompletionModal(false);
          setActiveTask(null);
        }}
        task={activeTask}
        onUpdate={() => {
          loadMyTasks();
        }}
      />
    </div>
  );
};

export default MyTasksPage;
