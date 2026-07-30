import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { fetchTasks } from '../../services/taskService';
import API from '../../services/api';
import {
  CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar,
  Target, BarChart3, Activity, Plus, ArrowRight, Zap,
  FileText, Download, User, Briefcase, LogOut, AlertCircle as AlertCircleIcon
} from 'lucide-react';

/**
 * Staff Dashboard
 * Personalized productivity dashboard for staff members
 * Shows task summary, upcoming deadlines, recent activity, and quick actions
 */
const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [hrData, setHRData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hrLoading, setHRLoading] = useState(false);

  const loadTasks = useCallback(async () => {
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
  }, [user?.id]);

  const loadHRData = useCallback(async () => {
    setHRLoading(true);
    try {
      const data = await API.HRContract.getMyHRData();
      setHRData(data);
    } catch (error) {
      console.error('Error loading HR data:', error);
    } finally {
      setHRLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      // API key is `Project` (singular); ProjectAPI.getAll returns the
      // unwrapped { projects, pagination } object directly.
      const response = await API.Project.getAll();
      const list = response?.projects || [];
      console.log('📊 Loaded projects for staff dashboard:', list.length);
      setProjects(list);
    } catch (error) {
      console.error('Error loading projects:', error);
      setProjects([]);
    }
  }, []);

  const loadProposals = useCallback(async () => {
    try {
      const response = await API.Proposal.getAll();
      const list = response?.proposals || [];
      console.log('📊 Loaded proposals for staff dashboard:', list.length);
      setProposals(list);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setProposals([]);
    }
  }, []);

  // Load user's tasks, projects, and proposals
  useEffect(() => {
    loadTasks();
    loadProjects();
    loadProposals();
    loadHRData();
  }, [loadTasks, loadProjects, loadProposals, loadHRData]);

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
          <p className="text-ink-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome — quiet navy header */}
      <div className="bg-navy-900 rounded-lg2 p-6 text-white shadow-card">
        <p className="text-xs font-medium uppercase tracking-wider text-mission-300 mb-1.5">My workspace</p>
        <h1 className="text-h1 leading-tight">
          Welcome back, {user?.name || 'Team Member'}.
        </h1>
        <p className="text-sm text-ink-200 mt-1.5">
          {activeTab === 'overview'
            ? "Your productivity overview for today."
            : "View your employment contract and HR information."}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg2 border border-ink-100 shadow-card">
        <div className="flex border-b border-ink-100">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 px-6 py-3 font-medium text-sm transition ${
              activeTab === 'overview'
                ? 'text-navy-900 border-b-2 border-mission-500 bg-ink-50'
                : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Activity size={18} />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveTab('my-hr-info')}
            className={`flex-1 px-6 py-3 font-medium text-sm transition ${
              activeTab === 'my-hr-info'
                ? 'text-navy-900 border-b-2 border-mission-500 bg-ink-50'
                : 'text-ink-500 hover:text-ink-900 hover:bg-ink-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Briefcase size={18} />
              My HR Info
            </div>
          </button>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Target className="text-indigo-600" size={20} />
            </div>
            <span className="text-h1 text-ink-900">{stats.total}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">Total Tasks</h3>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 bg-ink-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-xs font-medium text-ink-600">{completionRate}%</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-green-600">{stats.completed}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">Completed</h3>
          <p className="text-xs text-ink-500 mt-1">
            {stats.inProgress} in progress
          </p>
        </div>

        {/* Due This Week */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="text-blue-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-blue-600">{stats.dueThisWeek}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">Due This Week</h3>
          <p className="text-xs text-ink-500 mt-1">
            {stats.dueToday} due today
          </p>
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="text-red-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-red-600">{stats.highPriority}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">High Priority</h3>
          <p className="text-xs text-ink-500 mt-1">
            {stats.overdue} overdue
          </p>
        </div>

        {/* My Projects */}
        <div
          className="bg-white rounded-lg shadow-sm border border-ink-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/projects')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Briefcase className="text-purple-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-purple-600">{projects.length}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">My Projects</h3>
          <p className="text-xs text-ink-500 mt-1">
            {user?.department ? `${user.department} department` : 'All departments'}
          </p>
        </div>

        {/* My Proposals */}
        <div
          className="bg-white rounded-lg shadow-sm border border-ink-100 p-4 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/admin/proposals')}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileText className="text-amber-600" size={20} />
            </div>
            <span className="text-2xl font-bold text-amber-600">{proposals.length}</span>
          </div>
          <h3 className="text-sm font-medium text-ink-600">My Proposals</h3>
          <p className="text-xs text-ink-500 mt-1">
            {proposals.filter(p => p.status === 'Under Review').length} under review
          </p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Tasks */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-ink-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-ink-900">Upcoming Deadlines</h2>
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
              <Calendar className="w-12 h-12 text-ink-300 mx-auto mb-2" />
              <p className="text-ink-500">No upcoming deadlines</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-ink-50 rounded-lg hover:bg-ink-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/operations/my-tasks')}
                >
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'High' ? 'bg-red-500' :
                    task.priority === 'Medium' ? 'bg-orange-500' : 'bg-blue-500'
                  }`} />
                  <div className="flex-1">
                    <h3 className="font-medium text-ink-900">{task.title}</h3>
                    <p className="text-xs text-ink-500">
                      {task.Project?.name || 'No project'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-ink-700">
                      {formatDate(task.dueDate)}
                    </span>
                    <p className="text-xs text-ink-500">{task.priority}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
            <h2 className="text-lg font-bold text-ink-900 mb-4">Quick Actions</h2>
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
                    <span className="font-medium text-ink-900">{action.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Performance Card — mission accent */}
          <div className="bg-mission-50 border border-mission-200 rounded-lg2 p-6 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={18} className="text-mission-700" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-mission-700">This Week</h3>
            </div>
            <div className="text-3xl font-bold text-mission-900 mb-1">{stats.completed}</div>
            <p className="text-sm text-ink-600">Tasks completed</p>
            <div className="mt-4 pt-4 border-t border-mission-200/60">
              <div className="flex justify-between text-sm">
                <span className="text-ink-600">Completion Rate</span>
                <span className="font-bold text-mission-800">{completionRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
        <h2 className="text-lg font-bold text-ink-900 mb-4">Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-ink-300 mx-auto mb-2" />
            <p className="text-ink-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-4 p-3 hover:bg-ink-50 rounded-lg transition-colors cursor-pointer"
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
                  <h3 className="font-medium text-ink-900">{task.title}</h3>
                  <p className="text-xs text-ink-500">
                    {task.Project?.name || 'No project'} • {task.status}
                  </p>
                </div>
                <span className="text-xs text-ink-500">
                  {formatDate(task.updatedAt || task.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}

      {/* My HR Info Tab Content */}
      {activeTab === 'my-hr-info' && (
        <>
          {hrLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
                <p className="text-ink-600">Loading your HR information...</p>
              </div>
            </div>
          ) : !hrData?.hasStaffRecord ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <AlertCircleIcon className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-ink-900 mb-2">No Staff Record Found</h3>
              <p className="text-ink-600">
                Your account is not linked to a staff record. Please contact HR for assistance.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Employment Agreement Card */}
              {hrData?.agreement ? (
                <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <FileText className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-ink-900">Employment Agreement</h2>
                        <p className="text-sm text-ink-500">Your current contract details</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      hrData.agreement.status === 'Active' ? 'bg-green-100 text-green-700' :
                      hrData.agreement.status === 'Draft' ? 'bg-ink-100 text-ink-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {hrData.agreement.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">Position</div>
                      <div className="font-medium text-ink-900">{hrData.staff.position}</div>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">Department</div>
                      <div className="font-medium text-ink-900">{hrData.staff.department}</div>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">Contract Type</div>
                      <div className="font-medium text-ink-900">{hrData.agreement.contractType}</div>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">Monthly Salary</div>
                      <div className="font-medium text-ink-900">
                        LKR {hrData.agreement.salary?.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">Start Date</div>
                      <div className="font-medium text-ink-900">
                        {new Date(hrData.agreement.startDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </div>
                    </div>
                    <div className="bg-ink-50 rounded-lg p-4">
                      <div className="text-sm text-ink-600 mb-1">End Date</div>
                      <div className="font-medium text-ink-900">
                        {hrData.agreement.endDate
                          ? new Date(hrData.agreement.endDate).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            })
                          : 'Permanent'
                        }
                      </div>
                    </div>
                  </div>

                  {/* Leave Entitlements */}
                  <div className="border-t border-ink-100 pt-4">
                    <h3 className="font-medium text-ink-900 mb-3">Leave Entitlements (Annual)</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {hrData.agreement.annualLeaveDays || 14}
                        </div>
                        <div className="text-xs text-ink-600">Annual Leave</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {hrData.agreement.casualLeaveDays || 7}
                        </div>
                        <div className="text-xs text-ink-600">Casual Leave</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {hrData.agreement.sickLeaveDays || 14}
                        </div>
                        <div className="text-xs text-ink-600">Sick Leave</div>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {hrData.agreement.medicalLeaveDays || 21}
                        </div>
                        <div className="text-xs text-ink-600">Medical Leave</div>
                      </div>
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div className="border-t border-ink-100 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-ink-900">Working Hours</h3>
                        <p className="text-sm text-ink-500">
                          {hrData.agreement.workingHours || 8} hours per day
                        </p>
                      </div>
                      <div>
                        <h3 className="font-medium text-ink-900">Probation Period</h3>
                        <p className="text-sm text-ink-500">
                          {hrData.agreement.probationPeriod || 3} months
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-ink-50 border border-ink-100 rounded-lg p-6 text-center">
                  <FileText className="w-12 h-12 text-ink-400 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-ink-900 mb-2">No Active Employment Agreement</h3>
                  <p className="text-ink-600">
                    You don't have an active employment agreement on file. Please contact HR.
                  </p>
                </div>
              )}

              {/* Contract Status Card */}
              {hrData?.agreement?.endDate && (
                <div className="bg-navy-900 rounded-lg shadow-sm p-6 text-white">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="w-6 h-6" />
                    <h3 className="text-lg font-bold">Contract Status</h3>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Days until contract end</p>
                      <div className="text-3xl font-bold">
                        {Math.max(0, Math.ceil(
                          (new Date(hrData.agreement.endDate) - new Date()) / (1000 * 60 * 60 * 24)
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-purple-100 text-sm mb-1">End Date</p>
                      <div className="text-lg font-medium">
                        {new Date(hrData.agreement.endDate).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pending Renewals */}
              {hrData?.renewals && hrData.renewals.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
                  <h2 className="text-lg font-bold text-ink-900 mb-4">Contract Renewals</h2>
                  <div className="space-y-3">
                    {hrData.renewals.map(renewal => (
                      <div key={renewal.id} className="bg-ink-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-indigo-600" />
                            <span className="font-medium text-ink-900">
                              Contract Renewal Request
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            renewal.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            renewal.status === 'Approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {renewal.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-ink-600">New Period:</span>{' '}
                            <span className="font-medium text-ink-900">
                              {new Date(renewal.renewalStartDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                              {' '}-{' '}
                              {new Date(renewal.renewalEndDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-600">New Salary:</span>{' '}
                            <span className="font-medium text-ink-900">
                              LKR {renewal.newSalary?.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resignations */}
              {hrData?.resignations && hrData.resignations.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
                  <h2 className="text-lg font-bold text-ink-900 mb-4">My Resignations</h2>
                  <div className="space-y-3">
                    {hrData.resignations.map(resignation => (
                      <div key={resignation.id} className="bg-ink-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <LogOut size={18} className="text-red-600" />
                            <span className="font-medium text-ink-900">
                              Resignation Submitted
                            </span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            resignation.status === 'Submitted' ? 'bg-yellow-100 text-yellow-700' :
                            resignation.status === 'Reviewed' ? 'bg-blue-100 text-blue-700' :
                            resignation.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {resignation.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-ink-600">Resignation Date:</span>{' '}
                            <span className="font-medium text-ink-900">
                              {new Date(resignation.resignationDate).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </span>
                          </div>
                          <div>
                            <span className="text-ink-600">Proposed Last Day:</span>{' '}
                            <span className="font-medium text-ink-900">
                              {new Date(resignation.proposedLastDay).toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', year: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                        {resignation.reason && (
                          <div className="mt-2 text-sm">
                            <span className="text-ink-600">Reason:</span>{' '}
                            <span className="text-ink-900">{resignation.reason}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Self-Service Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-ink-100 p-6">
                <h2 className="text-lg font-bold text-ink-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate('/admin/hr/contract-management')}
                    className="flex items-center gap-3 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-ink-900">View Full Contract</div>
                      <div className="text-xs text-ink-500">Access complete agreement details</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      // TODO: Add resignation submission modal
                      alert('Resignation submission feature coming soon!');
                    }}
                    className="flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <LogOut className="text-red-600" size={20} />
                    </div>
                    <div>
                      <div className="font-medium text-ink-900">Submit Resignation</div>
                      <div className="text-xs text-ink-500">Initiate resignation process</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
