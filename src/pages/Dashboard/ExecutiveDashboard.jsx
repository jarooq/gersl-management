import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, AlertCircle,
  Activity, Award, Clock, CheckCircle, FolderOpen, Calendar
} from 'lucide-react';
import { fetchTasks } from '../../services/taskService';
import { fetchProjects } from '../../services/projectService';
import { fetchProposals } from '../../services/proposalService';

/**
 * Executive Dashboard
 * High-level analytics dashboard for organization leadership
 * Shows portfolio health, budget utilization, team performance, and strategic metrics
 */
const ExecutiveDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    tasks: [],
    projects: [],
    proposals: []
  });

  // Load all data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, proposalsRes] = await Promise.all([
        fetchTasks(),
        fetchProjects(),
        fetchProposals()
      ]);

      setData({
        tasks: tasksRes.success ? tasksRes.data : [],
        projects: projectsRes.success ? projectsRes.data : [],
        proposals: proposalsRes.success ? proposalsRes.data : []
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const activeProjects = data.projects.filter(p => p.status === 'Active' || p.status === 'In Progress');
    const completedProjects = data.projects.filter(p => p.status === 'Completed');
    const totalBudget = data.projects.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const budgetSpent = data.projects.reduce((sum, p) => sum + (parseFloat(p.budgetSpent) || 0), 0);
    const budgetUtilization = totalBudget > 0 ? (budgetSpent / totalBudget) * 100 : 0;

    return {
      totalProjects: data.projects.length,
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length,
      totalBudget,
      budgetSpent,
      budgetUtilization,
      budgetRemaining: totalBudget - budgetSpent
    };
  }, [data.projects]);

  // Calculate task metrics
  const taskMetrics = useMemo(() => {
    const completedTasks = data.tasks.filter(t => t.status === 'Completed');
    const overdueTasks = data.tasks.filter(t => {
      if (!t.dueDate || t.status === 'Completed') return false;
      return new Date(t.dueDate) < new Date();
    });
    const highPriorityTasks = data.tasks.filter(t =>
      (t.priority === 'High' || t.priority === 'Urgent') && t.status !== 'Completed'
    );

    const completionRate = data.tasks.length > 0
      ? (completedTasks.length / data.tasks.length) * 100
      : 0;

    return {
      totalTasks: data.tasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      highPriorityTasks: highPriorityTasks.length,
      completionRate
    };
  }, [data.tasks]);

  // Calculate proposal metrics
  const proposalMetrics = useMemo(() => {
    const approved = data.proposals.filter(p => p.status === 'Approved');
    const pending = data.proposals.filter(p => p.status === 'Pending' || p.status === 'Under Review');
    const rejected = data.proposals.filter(p => p.status === 'Rejected');
    const totalValue = data.proposals.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);
    const approvedValue = approved.reduce((sum, p) => sum + (parseFloat(p.budget) || 0), 0);

    return {
      total: data.proposals.length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      totalValue,
      approvedValue,
      approvalRate: data.proposals.length > 0 ? (approved.length / data.proposals.length) * 100 : 0
    };
  }, [data.proposals]);

  // Project status distribution for pie chart
  const projectStatusData = useMemo(() => {
    const statusCounts = data.projects.reduce((acc, project) => {
      const status = project.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [data.projects]);

  // Task completion trend (last 6 months)
  const taskTrendData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('en-US', { month: 'short' });

      const monthTasks = data.tasks.filter(t => {
        const createdDate = new Date(t.createdAt);
        return createdDate.getMonth() === date.getMonth() &&
               createdDate.getFullYear() === date.getFullYear();
      });

      const completed = monthTasks.filter(t => t.status === 'Completed').length;

      months.push({
        month: monthName,
        total: monthTasks.length,
        completed,
        pending: monthTasks.length - completed
      });
    }

    return months;
  }, [data.tasks]);

  // Budget allocation by project
  const budgetAllocationData = useMemo(() => {
    return data.projects
      .filter(p => parseFloat(p.budget) > 0)
      .slice(0, 5)
      .map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        budget: parseFloat(p.budget) || 0,
        spent: parseFloat(p.budgetSpent) || 0
      }));
  }, [data.projects]);

  // Chart colors
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Executive Dashboard</h1>
        <p className="text-purple-100">
          Organization-wide analytics and performance metrics
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Projects */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FolderOpen className="text-blue-600" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalProjects}</div>
              <div className="text-xs text-gray-500">Total Projects</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">{portfolioMetrics.activeProjects} Active</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{portfolioMetrics.completedProjects} Completed</span>
          </div>
        </div>

        {/* Budget Utilization */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {portfolioMetrics.budgetUtilization.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">Budget Used</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  portfolioMetrics.budgetUtilization > 90 ? 'bg-red-600' :
                  portfolioMetrics.budgetUtilization > 75 ? 'bg-orange-500' : 'bg-green-600'
                }`}
                style={{ width: `${Math.min(portfolioMetrics.budgetUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task Completion */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="text-purple-600" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {taskMetrics.completionRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Tasks Complete</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-purple-600 font-medium">{taskMetrics.completedTasks}/{taskMetrics.totalTasks}</span>
            <span className="text-gray-400">•</span>
            <span className="text-red-600">{taskMetrics.overdueTasks} Overdue</span>
          </div>
        </div>

        {/* Proposal Success Rate */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Award className="text-orange-600" size={24} />
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {proposalMetrics.approvalRate.toFixed(0)}%
              </div>
              <div className="text-xs text-gray-500">Approval Rate</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">{proposalMetrics.approved} Approved</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{proposalMetrics.pending} Pending</span>
          </div>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Budget Summary Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Financial Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${portfolioMetrics.totalBudget.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Budget Spent</span>
                  <span className="text-lg font-bold text-orange-600">
                    ${portfolioMetrics.budgetSpent.toLocaleString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Remaining</span>
                  <span className="text-lg font-bold text-green-600">
                    ${portfolioMetrics.budgetRemaining.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Proposal Value (Approved)</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${proposalMetrics.approvedValue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(taskMetrics.overdueTasks > 0 || taskMetrics.highPriorityTasks > 0) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Attention Required
              </h3>
              <div className="space-y-3">
                {taskMetrics.overdueTasks > 0 && (
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="text-red-600" size={18} />
                      <span className="text-sm font-medium text-red-900">Overdue Tasks</span>
                    </div>
                    <span className="text-lg font-bold text-red-600">{taskMetrics.overdueTasks}</span>
                  </div>
                )}
                {taskMetrics.highPriorityTasks > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="text-orange-600" size={18} />
                      <span className="text-sm font-medium text-orange-900">High Priority</span>
                    </div>
                    <span className="text-lg font-bold text-orange-600">{taskMetrics.highPriorityTasks}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Budget Allocation Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Allocation (Top 5 Projects)</h3>
          {budgetAllocationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetAllocationData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="budget" fill="#3B82F6" name="Allocated" />
                <Bar dataKey="spent" fill="#F59E0B" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No budget data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Completion Trend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Task Completion Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={taskTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed" />
              <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Project Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Project Status Distribution</h3>
          {projectStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No project data available
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/projects')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
          >
            <FolderOpen className="text-blue-600 mb-2" size={24} />
            <div className="font-medium text-gray-900">View Projects</div>
            <div className="text-xs text-gray-500">{portfolioMetrics.totalProjects} total</div>
          </button>
          <button
            onClick={() => navigate('/admin/operations/tasks')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors text-left"
          >
            <Target className="text-purple-600 mb-2" size={24} />
            <div className="font-medium text-gray-900">View Tasks</div>
            <div className="text-xs text-gray-500">{taskMetrics.totalTasks} total</div>
          </button>
          <button
            onClick={() => navigate('/admin/proposals')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors text-left"
          >
            <Award className="text-orange-600 mb-2" size={24} />
            <div className="font-medium text-gray-900">View Proposals</div>
            <div className="text-xs text-gray-500">{proposalMetrics.total} total</div>
          </button>
          <button
            onClick={() => navigate('/admin/finance')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-left"
          >
            <DollarSign className="text-green-600 mb-2" size={24} />
            <div className="font-medium text-gray-900">Finance</div>
            <div className="text-xs text-gray-500">Budget overview</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
