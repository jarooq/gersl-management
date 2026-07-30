import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Users, DollarSign, Calendar, MapPin,
  Target, CheckCircle, Clock, AlertCircle, User, Plus, X, Mail, Phone, Briefcase, Heart, BarChart, List, FileText, TrendingUp,
  Activity, Shield, MessageSquareWarning, FileCheck, Lightbulb, AlertTriangle, Star, Award, Eye
} from 'lucide-react';
import * as API from '../../services/api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Toast from '../../components/ui/Toast';
import { useMEAL } from '../../contexts/MEALContext';
import { useCompliance } from '../../contexts/ComplianceContext';
import CreateTaskModal from '../Operations/components/CreateTaskModal';
import TaskFormModal from '../Operations/components/TaskFormModal';
import TaskViewModal from '../Operations/components/TaskViewModal';
import BudgetActualReport from './components/BudgetActualReport';
import BeneficiaryMap from '../../components/map/BeneficiaryMap';
import BeneficiaryQrPanel from './components/BeneficiaryQrPanel';
import DistributionEventsPanel from './components/DistributionEventsPanel';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Get MEAL and Compliance data
  const { indicators, evaluations, complaints } = useMEAL();
  const { incidents, policies, backgroundChecks, trainingRecords } = useCompliance();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [taskView, setTaskView] = useState('list'); // 'list' or 'gantt'
  const [toast, setToast] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchAvailableStaff = useCallback(async (department) => {
    try {
      const response = await API.ProjectTeamAPI.getAvailableStaff(id, department);
      console.log('👥 Available staff:', response);
      setAvailableStaff(response.staff || []);
    } catch (error) {
      console.error('Error fetching available staff:', error);
    }
  }, [id]);

  const fetchProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.ProjectAPI.getById(id);
      console.log('📊 Project data:', response);
      setProject(response);
      setTeamMembers(response.teamMembers || []);
      setError(null);

      // Fetch available staff for the project
      if (response.department) {
        fetchAvailableStaff(response.department);
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('Failed to load project details');
      showToast('Failed to load project', 'error');
    } finally {
      setLoading(false);
    }
  }, [id, fetchAvailableStaff, showToast]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await API.TaskAPI.getAll({ projectId: id });
      console.log('📋 Tasks data:', response);
      setTasks(response.tasks || []);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    }
  }, [id]);

  // Fetch project details
  useEffect(() => {
    fetchProject();
    fetchTasks();
  }, [fetchProject, fetchTasks]);

  const handleRemoveTeamMember = async (teamMemberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from the project team?`)) return;

    try {
      await API.ProjectTeamAPI.removeTeamMember(teamMemberId);
      setTeamMembers(prev => prev.filter(tm => tm.id !== teamMemberId));
      showToast('Team member removed successfully');
    } catch (error) {
      console.error('Error removing team member:', error);
      showToast('Failed to remove team member', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-ink-900 mb-2">
            {error || 'Project not found'}
          </h2>
          <button
            onClick={() => navigate('/admin/projects')}
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            ← Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Filter MEAL data for this project
  const projectIndicators = indicators.filter(ind => ind.projectId === parseInt(id));
  const projectEvaluations = evaluations.filter(evaluation => evaluation.projectId === parseInt(id));
  const projectComplaints = complaints.filter(comp => comp.projectId === parseInt(id));

  // Filter Compliance data for this project (only incidents are project-specific)
  const projectIncidents = incidents.filter(inc => inc.projectId === parseInt(id));

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'team', label: 'Team Members', count: teamMembers.length },
    { id: 'financial', label: 'Financial' },
    { id: 'map', label: 'Map' },
    { id: 'tasks', label: 'Tasks', count: tasks.length },
    { id: 'beneficiaries', label: 'Beneficiaries & QR' },
    { id: 'meal', label: 'MEAL', count: projectIndicators.length + projectEvaluations.length + projectComplaints.length },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">{project.programmeArea} · {project.projectCode}</p>
                  <h1 className="text-h2 font-bold leading-tight">{project.name}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/20 rounded-md transition">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-danger-600 hover:bg-danger-700 rounded-md transition">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </div>

      {/* Tabs - Modern rounded style */}
      <div className="bg-white rounded-xl shadow-card p-2 mb-6">
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 px-4 rounded-lg transition-all font-semibold text-sm ${
                activeTab === tab.id
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-ink-200 text-ink-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  Description
                </h3>
                <p className="text-ink-700 leading-relaxed">
                  {project.description || 'No description available'}
                </p>
              </div>

              {/* Progress */}
              <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2">
                  <TrendingUp className="text-purple-600" size={22} />
                  Project Progress
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-ink-700 font-semibold">Overall Progress</span>
                      <span className="font-bold text-purple-600">{project.progress}%</span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 shadow-inner">
                      <div
                        className="bg-navy-900 h-3 rounded-full transition-all shadow-sm"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-3">
                      <span className="text-ink-700 font-semibold">Budget Used</span>
                      <span className="font-bold text-green-600">
                        {((project.spent / project.budget) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-white rounded-full h-3 shadow-inner">
                      <div
                        className="bg-navy-900 h-3 rounded-full transition-all shadow-sm"
                        style={{ width: `${(project.spent / project.budget) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-ink-600 mt-2">
                      <span>Spent: LKR {project.spent?.toLocaleString()}</span>
                      <span>Budget: LKR {project.budget?.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Key Stats */}
              <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2">
                  <Target className="text-indigo-600" size={22} />
                  Key Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <DollarSign size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink-600">Total Budget</p>
                      <p className="text-lg font-bold text-ink-900">
                        LKR {project.budget?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Users size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink-600">Beneficiaries</p>
                      <p className="text-lg font-bold text-ink-900">
                        {project.beneficiaries} / {project.targetBeneficiaries}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Calendar size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink-600">Duration</p>
                      <p className="text-sm font-bold text-ink-900">
                        {new Date(project.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-bold text-ink-900">
                        to {new Date(project.endDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="p-2 bg-red-500 rounded-lg">
                      <MapPin size={18} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-ink-600">Location</p>
                      <p className="text-sm font-bold text-ink-900">{project.location}</p>
                    </div>
                  </div>

                  {project.donor && (
                    <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg border border-pink-100">
                      <div className="p-2 bg-pink-500 rounded-lg">
                        <Heart size={18} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-ink-600">Donor</p>
                        <p className="text-sm font-bold text-ink-900">{project.donor}</p>
                      </div>
                    </div>
                  )}

                  {project.manager && (
                    <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                      <div className="p-2 bg-indigo-500 rounded-lg">
                        <User size={18} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-ink-600">Project Manager</p>
                        <p className="text-sm font-bold text-ink-900">{project.manager.fullName}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
            <div className="p-6 border-b border-ink-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Users className="text-blue-600" size={22} />
                  Team Members
                </h3>
                <p className="text-sm text-ink-600 mt-1">
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''} assigned to this project
                </p>
              </div>
              <button
                onClick={() => setShowAddTeamMember(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
              >
                <Plus size={18} />
                <span className="font-semibold">Add Member</span>
              </button>
            </div>

            <div className="p-6">
              {teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="mx-auto text-ink-400 mb-4" />
                  <p className="text-ink-600 mb-4">No team members assigned yet</p>
                  <button
                    onClick={() => setShowAddTeamMember(true)}
                    className="text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Add your first team member
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map(member => (
                    <div
                      key={member.id}
                      className="border border-ink-100 rounded-lg2 p-4 hover:shadow-card hover:border-navy-300 transition bg-white"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {member.user.fullName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-ink-900">{member.user.fullName}</h4>
                            <p className="text-sm text-blue-600 font-semibold">{member.role || member.user.role}</p>
                            {member.user.department && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                                {member.user.department}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveTeamMember(member.id, member.user.fullName)}
                          className="p-1.5 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                      {member.responsibilities && (
                        <div className="bg-blue-50 rounded-lg p-3 mb-3 border border-blue-100">
                          <p className="text-xs text-ink-700">{member.responsibilities}</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 text-sm text-ink-600">
                        {member.user.email && (
                          <div className="flex items-center gap-2 text-xs">
                            <Mail size={14} className="text-blue-500" />
                            <span>{member.user.email}</span>
                          </div>
                        )}
                        {member.user.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <Phone size={14} className="text-green-500" />
                            <span>{member.user.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            {/* Budget vs Actual report — server-side aggregation across all
                project expenses (Approved/Paid), with per-category breakdown
                and monthly trend. */}
            <BudgetActualReport projectId={id} />

            <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
              <h3 className="text-lg font-bold text-ink-900 mb-6 flex items-center gap-2">
                <DollarSign className="text-green-600" size={22} />
                Financial Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <DollarSign size={18} className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-ink-600">Total Budget</p>
                  </div>
                  <p className="text-h1 text-ink-900">
                    LKR {project.budget?.toLocaleString()}
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <TrendingUp size={18} className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-ink-600">Spent</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    LKR {project.spent?.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-500 mt-1">
                    {((project.spent / project.budget) * 100).toFixed(1)}% of budget
                  </p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-md border border-green-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-500 rounded-lg">
                      <Target size={18} className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-ink-600">Remaining</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    LKR {(project.budget - project.spent)?.toLocaleString()}
                  </p>
                  <p className="text-xs text-ink-500 mt-1">
                    {((1 - project.spent / project.budget) * 100).toFixed(1)}% available
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <FileText className="text-blue-600" size={20} />
                  Expenses
                </h3>
                <p className="text-sm text-ink-600 mt-1">
                  {project.expenses?.length || 0} expense{(project.expenses?.length || 0) !== 1 ? 's' : ''} recorded
                </p>
              </div>
              <div className="p-6">
                {!project.expenses || project.expenses.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign size={48} className="mx-auto text-ink-400 mb-4" />
                    <p className="text-ink-600">No expenses recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-ink-50">
                          <th className="text-left py-4 px-4 text-sm font-bold text-ink-700">Date</th>
                          <th className="text-left py-4 px-4 text-sm font-bold text-ink-700">Category</th>
                          <th className="text-left py-4 px-4 text-sm font-bold text-ink-700">Description</th>
                          <th className="text-right py-4 px-4 text-sm font-bold text-ink-700">Amount</th>
                          <th className="text-center py-4 px-4 text-sm font-bold text-ink-700">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {project.expenses.map((expense) => (
                          <tr key={expense.id} className="border-b border-ink-100 hover:bg-purple-50 transition-colors">
                            <td className="py-4 px-4 text-sm font-semibold text-ink-900">
                              {new Date(expense.date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 text-sm">
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                {expense.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm text-ink-600">
                              {expense.description || '-'}
                            </td>
                            <td className="py-4 px-4 text-sm font-bold text-ink-900 text-right">
                              LKR {expense.amount?.toLocaleString()}
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                                expense.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                expense.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {expense.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="space-y-4">
            <BeneficiaryMap projectId={Number(id)} height={620} />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
            <div className="p-6 border-b border-ink-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                    <CheckCircle className="text-blue-600" size={22} />
                    Tasks
                  </h3>
                  <p className="text-sm text-ink-600 mt-1">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} in this project
                  </p>
                </div>
                <button
                  onClick={() => setShowAddTask(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg transition-all shadow-md flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Task
                </button>
              </div>

              {/* View Toggle */}
              {tasks.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setTaskView('list')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      taskView === 'list'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                    }`}
                  >
                    <List size={16} />
                    List View
                  </button>
                  <button
                    onClick={() => setTaskView('gantt')}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      taskView === 'gantt'
                        ? 'bg-blue-100 text-blue-700 font-medium'
                        : 'bg-ink-100 text-ink-600 hover:bg-ink-200'
                    }`}
                  >
                    <BarChart size={16} />
                    Gantt Chart
                  </button>
                </div>
              )}
            </div>

            <div className="p-6">
              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-ink-400 mb-4" />
                  <p className="text-ink-600 mb-4">No tasks yet</p>
                  <button
                    onClick={() => setShowAddTask(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Task
                  </button>
                </div>
              ) : taskView === 'list' ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="border border-ink-100 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-ink-900">{task.title}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.status === 'Completed' ? 'bg-green-100 text-green-700' :
                              task.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                              task.status === 'On Hold' ? 'bg-yellow-100 text-yellow-700' :
                              task.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                              'bg-ink-100 text-ink-700'
                            }`}>
                              {task.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              task.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                              task.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-ink-100 text-ink-700'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                          {task.description && (
                            <p className="text-sm text-ink-600 mb-2">{task.description}</p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-ink-500">
                            {task.assignee && (
                              <div className="flex items-center gap-1">
                                <User size={14} />
                                <span>{task.assignee.fullName}</span>
                              </div>
                            )}
                            {task.dueDate && (
                              <div className="flex items-center gap-1">
                                <Calendar size={14} />
                                <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            {task.progress !== undefined && (
                              <div className="flex items-center gap-2">
                                <div className="w-24 bg-ink-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${task.progress}%` }}
                                  ></div>
                                </div>
                                <span>{task.progress}%</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-3 mt-3 border-t border-ink-100">
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowTaskDetail(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-orange-100 transition text-xs font-semibold"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setShowEditTask(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-ink-50 text-ink-600 rounded-lg hover:bg-ink-100 transition text-xs font-semibold"
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Delete task "${task.title}"?`)) {
                              try {
                                await API.TaskAPI.delete(task.id);
                                showToast('Task deleted successfully');
                                fetchTasks();
                              } catch (error) {
                                console.error('Error deleting task:', error);
                                showToast('Failed to delete task', 'error');
                              }
                            }
                          }}
                          className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition text-xs font-semibold"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <GanttChart tasks={tasks} />
              )}
            </div>
          </div>
        )}

        {activeTab === 'beneficiaries' && (
          <div className="space-y-6">
            {/* QR-code beneficiary distribution: enrolment list + printable
                A4 QR sheet, then the distribution-event CRUD below it. */}
            <BeneficiaryQrPanel
              projectId={Number(id)}
              projectName={project.name}
              showToast={showToast}
            />
            <DistributionEventsPanel
              projectId={Number(id)}
              showToast={showToast}
            />
          </div>
        )}

        {activeTab === 'meal' && (
          <div className="space-y-6">
            {/* MEAL Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-teal-500 rounded-xl">
                    <Target size={24} className="text-white" />
                  </div>
                  <span className="text-3xl font-bold text-teal-700">{projectIndicators.length}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink-700">Indicators</h3>
                <p className="text-xs text-ink-600 mt-1">Performance metrics</p>
              </div>

              <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <FileCheck size={24} className="text-white" />
                  </div>
                  <span className="text-3xl font-bold text-blue-700">{projectEvaluations.length}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink-700">Evaluations</h3>
                <p className="text-xs text-ink-600 mt-1">Assessments completed</p>
              </div>

              <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-orange-500 rounded-xl">
                    <MessageSquareWarning size={24} className="text-white" />
                  </div>
                  <span className="text-3xl font-bold text-orange-700">{projectComplaints.length}</span>
                </div>
                <h3 className="text-sm font-semibold text-ink-700">Complaints</h3>
                <p className="text-xs text-ink-600 mt-1">Accountability records</p>
              </div>
            </div>

            {/* Indicators Section */}
            <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <Target className="text-teal-600" size={22} />
                  Performance Indicators
                </h3>
                <p className="text-sm text-ink-600 mt-1">{projectIndicators.length} indicator{projectIndicators.length !== 1 ? 's' : ''} tracking project performance</p>
              </div>
              <div className="p-6">
                {projectIndicators.length === 0 ? (
                  <div className="text-center py-12">
                    <Target size={48} className="mx-auto text-ink-400 mb-4" />
                    <p className="text-ink-600">No indicators defined for this project</p>
                    <p className="text-sm text-ink-500 mt-2">Visit the MEAL module to add indicators</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {projectIndicators.map((indicator) => (
                      <div key={indicator.id} className="border-2 border-ink-100 rounded-xl p-4 hover:shadow-md hover:border-teal-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-bold">{indicator.code}</span>
                              <h4 className="font-semibold text-ink-900">{indicator.name}</h4>
                            </div>
                            <p className="text-sm text-ink-600 mb-3">{indicator.description}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            indicator.status === 'On Track' ? 'bg-green-100 text-green-700' :
                            indicator.status === 'At Risk' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {indicator.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-xs text-ink-600 mb-1">Baseline</p>
                            <p className="text-lg font-bold text-blue-700">{indicator.baseline} {indicator.unit}</p>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-xs text-ink-600 mb-1">Current</p>
                            <p className="text-lg font-bold text-purple-700">{indicator.current} {indicator.unit}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-xs text-ink-600 mb-1">Target</p>
                            <p className="text-lg font-bold text-green-700">{indicator.target} {indicator.unit}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="w-full bg-ink-200 rounded-full h-2.5">
                              <div
                                className="bg-navy-900 h-2.5 rounded-full transition-all"
                                style={{ width: `${Math.min((indicator.current / indicator.target) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-ink-700">
                            {Math.round((indicator.current / indicator.target) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Evaluations Section */}
            <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <FileCheck className="text-blue-600" size={22} />
                  Evaluations
                </h3>
                <p className="text-sm text-ink-600 mt-1">{projectEvaluations.length} evaluation{projectEvaluations.length !== 1 ? 's' : ''} conducted</p>
              </div>
              <div className="p-6">
                {projectEvaluations.length === 0 ? (
                  <div className="text-center py-12">
                    <FileCheck size={48} className="mx-auto text-ink-400 mb-4" />
                    <p className="text-ink-600">No evaluations for this project</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="border-2 border-ink-100 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-ink-900 mb-1">{evaluation.title}</h4>
                            <p className="text-sm text-ink-600">{evaluation.type}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            evaluation.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            evaluation.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-ink-100 text-ink-700'
                          }`}>
                            {evaluation.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm text-ink-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-blue-500" />
                            <span>{new Date(evaluation.evaluationDate).toLocaleDateString()}</span>
                          </div>
                          {evaluation.evaluator && (
                            <div className="flex items-center gap-2">
                              <User size={14} className="text-purple-500" />
                              <span>{evaluation.evaluator}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Complaints Section */}
            <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <MessageSquareWarning className="text-orange-600" size={22} />
                  Complaints & Accountability
                </h3>
                <p className="text-sm text-ink-600 mt-1">{projectComplaints.length} complaint{projectComplaints.length !== 1 ? 's' : ''} logged</p>
              </div>
              <div className="p-6">
                {projectComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquareWarning size={48} className="mx-auto text-ink-400 mb-4" />
                    <p className="text-ink-600">No complaints for this project</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectComplaints.map((complaint) => (
                      <div key={complaint.id} className="border-2 border-ink-100 rounded-xl p-4 hover:shadow-md hover:border-orange-300 transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">{complaint.ticketNumber}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                complaint.priority === 'High' ? 'bg-red-100 text-red-700' :
                                complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {complaint.priority}
                              </span>
                            </div>
                            <p className="text-sm text-ink-700 font-medium mb-2">{complaint.description}</p>
                            <p className="text-xs text-ink-600">{complaint.category}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'Under Investigation' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {complaint.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-ink-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>Submitted: {new Date(complaint.submittedDate).toLocaleDateString()}</span>
                          </div>
                          {complaint.satisfactionRating && (
                            <div className="flex items-center gap-1">
                              <Star size={12} className="text-amber-500" />
                              <span>{complaint.satisfactionRating}/5</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Overview */}
            <div className="bg-ink-50 border border-ink-200 rounded-lg2 shadow-card p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-4 bg-purple-500 rounded-xl">
                  <Shield size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-h1 text-ink-900">Compliance & Safeguarding</h3>
                  <p className="text-sm text-ink-600 mt-1">Project-specific compliance and safeguarding records</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <AlertTriangle size={20} className="text-red-500" />
                    <span className="text-2xl font-bold text-red-600">{projectIncidents.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink-700">Incidents</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <FileText size={20} className="text-blue-500" />
                    <span className="text-2xl font-bold text-blue-600">{policies.filter(p => p.status === 'Active').length}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink-700">Active Policies</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle size={20} className="text-green-500" />
                    <span className="text-2xl font-bold text-green-600">{backgroundChecks.filter(b => b.status === 'Cleared').length}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink-700">Cleared Checks</p>
                </div>

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <Award size={20} className="text-purple-500" />
                    <span className="text-2xl font-bold text-purple-600">{trainingRecords.length}</span>
                  </div>
                  <p className="text-xs font-semibold text-ink-700">Training Sessions</p>
                </div>
              </div>
            </div>

            {/* Safeguarding Incidents */}
            <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
              <div className="p-6 border-b border-ink-100">
                <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                  <AlertTriangle className="text-red-600" size={22} />
                  Safeguarding Incidents
                </h3>
                <p className="text-sm text-ink-600 mt-1">{projectIncidents.length} incident{projectIncidents.length !== 1 ? 's' : ''} reported for this project</p>
              </div>
              <div className="p-6">
                {projectIncidents.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield size={48} className="mx-auto text-ink-400 mb-4" />
                    <p className="text-ink-600">No safeguarding incidents reported</p>
                    <p className="text-sm text-ink-500 mt-2">This is a positive indicator for project safety</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projectIncidents.map((incident) => (
                      <div key={incident.id} className="border-2 border-ink-100 rounded-xl p-4 hover:shadow-md hover:border-red-300 transition-all bg-ink-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">{incident.incidentCode}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                incident.severity === 'Critical' ? 'bg-red-600 text-white' :
                                incident.severity === 'High' ? 'bg-red-100 text-red-700' :
                                incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {incident.severity}
                              </span>
                            </div>
                            <h4 className="font-semibold text-ink-900 mb-2">{incident.incidentType}</h4>
                            <p className="text-sm text-ink-600 mb-3">{incident.description}</p>
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            incident.status === 'Resolved' || incident.status === 'Closed' ? 'bg-green-100 text-green-700' :
                            incident.status === 'Under Investigation' || incident.status === 'In Progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {incident.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-ink-600">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} />
                            <span>Reported: {new Date(incident.incidentDate).toLocaleDateString()}</span>
                          </div>
                          {incident.reportedBy && (
                            <div className="flex items-center gap-1">
                              <User size={12} />
                              <span>By: {incident.reportedBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Note about policies and training */}
            <div className="bg-blue-50 border border-ink-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Activity size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Organization-wide Compliance</h4>
                  <p className="text-sm text-blue-700">
                    Organization-wide policies, background checks, and training records are managed in the Compliance & Safeguarding module.
                    Visit the main module to view and manage all compliance activities across the organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Team Member Modal */}
      {showAddTeamMember && (
        <AddTeamMemberModal
          projectId={id}
          project={project}
          onClose={() => setShowAddTeamMember(false)}
          onSuccess={(newMember) => {
            setTeamMembers(prev => [...prev, newMember]);
            setShowAddTeamMember(false);
            showToast('Team member added successfully');
          }}
        />
      )}

      {/* Add Task Modal */}
      <CreateTaskModal
        isOpen={showAddTask}
        onClose={() => setShowAddTask(false)}
        defaultProjectId={parseInt(id)}
        projectTeamMembers={teamMembers}
        availableStaff={availableStaff}
        onTaskCreated={async () => {
          setShowAddTask(false);
          await fetchTasks();
          showToast('Task created successfully');
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
          projectTeamMembers={teamMembers}
          onTaskUpdated={async () => {
            setShowEditTask(false);
            setSelectedTask(null);
            await fetchTasks();
            showToast('Task updated successfully');
          }}
        />
      )}

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

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

// Add Team Member Modal Component
const AddTeamMemberModal = ({ projectId, project, onClose, onSuccess }) => {
  const [availableStaff, setAvailableStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState('');
  const [role, setRole] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchAvailableStaff = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.ProjectTeamAPI.getAvailableStaff(projectId, project.department);
      console.log('👥 Available staff:', response);
      setAvailableStaff(response.staff || []);
    } catch (error) {
      console.error('Error fetching available staff:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId, project.department]);

  useEffect(() => {
    fetchAvailableStaff();
  }, [fetchAvailableStaff]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSubmitting(true);
      const response = await API.ProjectTeamAPI.addTeamMember(projectId, {
        userId: parseInt(selectedUser),
        role,
        responsibilities
      });
      onSuccess(response.teamMember);
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-ink-100 flex justify-between items-center sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-ink-900">Add Team Member</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : availableStaff.length === 0 ? (
            <div className="text-center py-8">
              <Users size={48} className="mx-auto text-ink-400 mb-4" />
              <p className="text-ink-600">
                No available staff members in the {project.department} department
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Select Staff Member *
                </label>
                <select
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Choose a staff member...</option>
                  {availableStaff.map(staff => (
                    <option key={staff.id} value={staff.id}>
                      {staff.fullName} - {staff.role} ({staff.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Role in Project
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g., Field Officer, M&E Officer"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Responsibilities
                </label>
                <textarea
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  rows={3}
                  placeholder="Describe their responsibilities on this project..."
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-ink-700 hover:bg-ink-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedUser}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Team Member'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

// Gantt Chart Component
const GanttChart = ({ tasks }) => {
  // Filter tasks with dates
  const tasksWithDates = tasks.filter(task => task.startDate || task.dueDate);

  if (tasksWithDates.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-ink-400 mb-4" />
        <p className="text-ink-600">No tasks with dates to display in Gantt chart</p>
        <p className="text-sm text-ink-500 mt-2">Add start and due dates to tasks to see them here</p>
      </div>
    );
  }

  // Calculate date range
  const allDates = tasksWithDates.flatMap(task =>
    [task.startDate, task.dueDate].filter(Boolean).map(d => new Date(d))
  );
  const minDate = new Date(Math.min(...allDates));
  const maxDate = new Date(Math.max(...allDates));
  const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1;

  // Generate month markers
  const months = [];
  const currentMonth = new Date(minDate);
  while (currentMonth <= maxDate) {
    months.push({
      name: currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      date: new Date(currentMonth)
    });
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  // Calculate task bar positions and widths
  const getTaskBar = (task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date(task.dueDate);
    const end = task.dueDate ? new Date(task.dueDate) : new Date(task.startDate);

    const startOffset = Math.ceil((start - minDate) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    return {
      left: `${(startOffset / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`
    };
  };

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Month headers */}
        <div className="flex border-b border-ink-200 mb-2 pb-2">
          <div className="w-48 flex-shrink-0"></div>
          <div className="flex-1 flex">
            {months.map((month, idx) => (
              <div key={idx} className="flex-1 text-center text-sm font-semibold text-ink-700">
                {month.name}
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasksWithDates.map((task) => {
          const barStyle = getTaskBar(task);
          return (
            <div key={task.id} className="flex items-center mb-3">
              {/* Task name */}
              <div className="w-48 flex-shrink-0 pr-4">
                <div className="text-sm font-medium text-ink-900 truncate" title={task.title}>
                  {task.title}
                </div>
                <div className="text-xs text-ink-500">
                  {task.assignee?.fullName || 'Unassigned'}
                </div>
              </div>

              {/* Timeline */}
              <div className="flex-1 relative h-10">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {months.map((_, idx) => (
                    <div key={idx} className="flex-1 border-r border-ink-100"></div>
                  ))}
                </div>

                {/* Task bar */}
                <div
                  className={`absolute h-8 rounded flex items-center px-2 ${
                    task.status === 'Completed' ? 'bg-green-500' :
                    task.status === 'In Progress' ? 'bg-blue-500' :
                    task.status === 'On Hold' ? 'bg-yellow-500' :
                    task.status === 'Cancelled' ? 'bg-red-500' :
                    'bg-ink-400'
                  }`}
                  style={{ left: barStyle.left, width: barStyle.width }}
                  title={`${task.title}\nStart: ${task.startDate || '-'}\nDue: ${task.dueDate || '-'}\nProgress: ${task.progress || 0}%`}
                >
                  {/* Progress overlay */}
                  {task.progress > 0 && (
                    <div
                      className="absolute inset-0 bg-white bg-opacity-30 rounded-l"
                      style={{ width: `${task.progress}%` }}
                    ></div>
                  )}
                  <span className="text-xs text-white font-medium truncate relative z-10">
                    {task.progress || 0}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-ink-100 flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-ink-400"></div>
            <span className="text-xs text-ink-600">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-xs text-ink-600">In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-xs text-ink-600">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-xs text-ink-600">On Hold</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-xs text-ink-600">Cancelled</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
