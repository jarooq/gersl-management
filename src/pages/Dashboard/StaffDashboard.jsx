import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTasks } from '../../services/taskService';
import {
  CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar,
  Target, BarChart3, Activity, Plus, ArrowRight, Zap
} from 'lucide-react';

/**
 * Staff Dashboard
 * Personalized productivity dashboard for staff members
 * Shows task summary, upcoming deadlines, recent activity, and quick actions
 */
const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user's tasks
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await fetchTasks();
      if (response.success && response.data) {
        // Filter tasks assigned to current user
        const userTasks = response.data.filter(
          task => task.assignedTo === user?.id || task.AssignedUser?.id === user?.id
        );
        setTasks(userTasks);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'Completed').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      todo: tasks.filter(t => t.status === 'To Do').length,
      overdue: tasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        return new Date(t.dueDate) < now;
      }).length,
      dueToday: tasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        const due = new Date(t.dueDate);
        return due.toDateString() === now.toDateString();
      }).length,
      dueTomorrow: tasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        const due = new Date(t.dueDate);
        return due.toDateString() === tomorrow.toDateString();
      }).length,
      dueThisWeek: tasks.filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        const due = new Date(t.dueDate);
        return due >= now && due <= nextWeek;
      }).length,
      highPriority: tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length,
    };
  }, [tasks]);

  // Calculate completion rate
  const completionRate = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  // Get upcoming tasks (next 7 days, not completed)
  const upcomingTasks = useMemo(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    return tasks
      .filter(t => {
        if (!t.dueDate || t.status === 'Completed') return false;
        const due = new Date(t.dueDate);
        return due >= new Date() && due <= nextWeek;
      })
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  }, [tasks]);

  // Recent activity (recently updated tasks)
  const recentActivity = useMemo(() => {
    return [...tasks]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 5);
  }, [tasks]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Quick actions
  const quickActions = [
    {
      id: 'new-task',
      title: 'Create Task',
      icon: Plus,
      color: 'indigo',
      action: () => navigate('/admin/operations/tasks')
    },
    {
      id: 'my-tasks',
      title: 'My Tasks',
      icon: Target,
      color: 'blue',
      action: () => navigate('/admin/operations/my-tasks')
    },
    {
      id: 'all-tasks',
      title: 'All Tasks',
      icon: BarChart3,
      color: 'purple',
      action: () => navigate('/admin/operations/tasks')
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.name || 'Team Member'}!
        </h1>
        <p className="text-indigo-100">
          Here's your productivity overview for today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="text-indigo-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-gray-900">{stats.total}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Total Tasks</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-600">{completionRate}%</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Completed</h3>
          <p className="text-xs text-gray-500 mt-1">
            {stats.inProgress} in progress
          </p>
        </div>

        {/* Due This Week */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-blue-600">{stats.dueThisWeek}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">Due This Week</h3>
          <p className="text-xs text-gray-500 mt-1">
            {stats.dueToday} due today
          </p>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-red-600">{stats.highPriority}</span>
          </div>
          <h3 className="text-sm font-medium text-gray-600">High Priority</h3>
          <p className="text-xs text-gray-500 mt-1">
            {stats.overdue} overdue
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Upcoming Deadlines</h2>
            <button
              onClick={() => navigate('/admin/operations/my-tasks')}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
            >
              View all
              <ArrowRight size={14} />
            </button>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/operations/my-tasks')}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'High' ? 'bg-red-500' :
                    task.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    <p className="text-xs text-gray-500">
                      {task.Project?.name || 'No project'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">
                      {formatDate(task.dueDate)}
                    </span>
                    <p className="text-xs text-gray-500">{task.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {quickActions.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={action.action}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg bg-${action.color}-50 hover:bg-${action.color}-100 transition-colors text-left`}
                  >
                    <div className={`w-8 h-8 bg-${action.color}-100 rounded-lg flex items-center justify-center`}>
                      <Icon className={`text-${action.color}-600`} size={16} />
                    </div>
                    <span className="font-medium text-gray-900">{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Performance Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={20} />
              <h3 className="font-bold">This Week</h3>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.completed}</div>
            <p className="text-green-100 text-sm">Tasks completed</p>
            <div className="mt-4 pt-4 border-t border-green-400/30">
              <div className="flex justify-between text-sm">
                <span className="text-green-100">Completion Rate</span>
                <span className="font-bold">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                onClick={() => navigate('/admin/operations/my-tasks')}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  task.status === 'Completed' ? 'bg-green-100' :
                  task.status === 'In Progress' ? 'bg-blue-100' : 'bg-orange-100'
                }`}>
                  {task.status === 'Completed' ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : task.status === 'In Progress' ? (
                    <Clock size={16} className="text-blue-600" />
                  ) : (
                    <Target size={16} className="text-orange-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{task.title}</h3>
                  <p className="text-xs text-gray-500">
                    {task.Project?.name || 'No project'} • {task.status}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(task.updatedAt || task.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
