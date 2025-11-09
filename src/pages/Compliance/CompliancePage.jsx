import React, { useState } from 'react';
import { useHR } from '../../contexts/HRContext';
import { useCompliance } from '../../contexts/ComplianceContext';
import {
  Shield, CheckCircle, AlertTriangle, FileText, Users, Calendar,
  Clock, Award, Lock, Eye, Download, Upload, Search, Filter,
  Plus, Edit2, Trash2, BookOpen, Briefcase, ClipboardCheck
} from 'lucide-react';

const CompliancePage = () => {
  const { staff } = useHR();
  const { policies: contextPolicies, incidents, backgroundChecks, trainingRecords, getStats } = useCompliance();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Get stats from ComplianceContext
  const contextStats = getStats();
  const totalStaff = staff.filter(s => s.status === 'Active').length;
  const trainedStaff = trainingRecords.length > 0 ? trainingRecords.filter(t => t.status === 'Completed').length : 0;

  const stats = {
    totalPolicies: contextStats.totalPolicies,
    upToDate: contextStats.activePolicies,
    needsReview: contextStats.totalPolicies - contextStats.activePolicies,
    overdue: 0, // Could be calculated based on policy review dates
    safeguardingCases: contextStats.activeIncidents,
    trainedStaff: trainedStaff,
    totalStaff: totalStaff,
    complianceRate: totalStaff > 0 ? Math.round((trainedStaff / totalStaff) * 100) : 0
  };

  const policies = [
    {
      id: 1,
      title: 'Child Safeguarding Policy',
      category: 'Safeguarding',
      lastReview: '2024-06-15',
      nextReview: '2025-06-15',
      status: 'Up to Date',
      responsible: 'Safeguarding Officer',
      priority: 'Critical'
    },
    {
      id: 2,
      title: 'Code of Conduct',
      category: 'Ethics',
      lastReview: '2024-01-10',
      nextReview: '2025-01-10',
      status: 'Up to Date',
      responsible: 'HR Manager',
      priority: 'High'
    },
    {
      id: 3,
      title: 'Data Protection & Privacy Policy',
      category: 'Data Protection',
      lastReview: '2024-03-20',
      nextReview: '2024-12-20',
      status: 'Needs Review',
      responsible: 'IT Manager',
      priority: 'High'
    },
    {
      id: 4,
      title: 'Anti-Fraud & Corruption Policy',
      category: 'Financial',
      lastReview: '2023-11-05',
      nextReview: '2024-11-05',
      status: 'Overdue',
      responsible: 'Finance Director',
      priority: 'Critical'
    },
    {
      id: 5,
      title: 'Complaints & Feedback Mechanism',
      category: 'Accountability',
      lastReview: '2024-08-12',
      nextReview: '2025-08-12',
      status: 'Up to Date',
      responsible: 'MEAL Manager',
      priority: 'Medium'
    }
  ];

  const trainings = [
    {
      id: 1,
      title: 'Child Safeguarding Training',
      completionRate: 96,
      dueDate: '2024-12-31',
      totalStaff: totalStaff,
      completed: Math.floor(totalStaff * 0.96),
      status: 'On Track'
    },
    {
      id: 2,
      title: 'Code of Conduct Induction',
      completionRate: 100,
      dueDate: '2024-11-30',
      totalStaff: totalStaff,
      completed: totalStaff,
      status: 'Completed'
    },
    {
      id: 3,
      title: 'Anti-Fraud Awareness',
      completionRate: 75,
      dueDate: '2024-11-15',
      totalStaff: totalStaff,
      completed: Math.floor(totalStaff * 0.75),
      status: 'At Risk'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Up to Date':
      case 'Completed':
      case 'On Track':
        return 'bg-green-100 text-green-700';
      case 'Needs Review':
      case 'At Risk':
        return 'bg-yellow-100 text-yellow-700';
      case 'Overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Critical':
        return 'text-red-600';
      case 'High':
        return 'text-orange-600';
      case 'Medium':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Compliance & Safeguarding</h1>
                <p className="text-emerald-100 text-sm">Maintaining highest standards in child protection and organizational compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FileText}
          label="Total Policies"
          value={stats.totalPolicies}
          subValue={`${stats.upToDate} up to date`}
          color="from-blue-500 to-cyan-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Needs Attention"
          value={stats.needsReview + stats.overdue}
          subValue={`${stats.overdue} overdue`}
          color="from-orange-500 to-amber-600"
        />
        <StatCard
          icon={Shield}
          label="Safeguarding Cases"
          value={stats.safeguardingCases}
          subValue="Zero incidents"
          color="from-green-500 to-emerald-600"
        />
        <StatCard
          icon={Users}
          label="Staff Trained"
          value={`${stats.trainedStaff}/${stats.totalStaff}`}
          subValue={`${Math.round((stats.trainedStaff / stats.totalStaff) * 100)}% completion`}
          color="from-purple-500 to-indigo-600"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 p-1.5">
            {[
              { id: 'overview', label: 'Overview', icon: ClipboardCheck },
              { id: 'policies', label: 'Policies', icon: FileText },
              { id: 'training', label: 'Training', icon: BookOpen },
              { id: 'incidents', label: 'Incidents', icon: AlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-900">Policy Documents</h2>
              <button className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition text-sm">
                <Plus size={18} />
                Add Policy
              </button>
            </div>

            <div className="space-y-3">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-900">{policy.title}</h3>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getStatusColor(policy.status)}`}>
                          {policy.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                        <div>Category: <span className="font-semibold">{policy.category}</span></div>
                        <div>Last Review: <span className="font-semibold">{policy.lastReview}</span></div>
                        <div>Next Review: <span className="font-semibold">{policy.nextReview}</span></div>
                        <div>Responsible: <span className="font-semibold">{policy.responsible}</span></div>
                      </div>
                      <div className="mt-2">
                        <span className={`text-xs font-bold ${getPriorityColor(policy.priority)}`}>
                          {policy.priority} Priority
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="p-2 text-gray-600 hover:bg-white rounded-lg transition">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-white rounded-lg transition">
                        <Download size={16} />
                      </button>
                      <button className="p-2 text-gray-600 hover:bg-white rounded-lg transition">
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Training Tab */}
        {activeTab === 'training' && (
          <div className="p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Staff Training Compliance</h2>
            <div className="space-y-4">
              {trainings.map((training) => (
                <div key={training.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900">{training.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getStatusColor(training.status)}`}>
                      {training.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{training.completed}/{training.totalStaff} staff completed</span>
                      <span className="font-bold">{training.completionRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${
                          training.completionRate === 100
                            ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                            : training.completionRate >= 75
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600'
                            : 'bg-gradient-to-r from-red-500 to-pink-600'
                        }`}
                        style={{ width: `${training.completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    Due Date: <span className="font-semibold">{training.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Compliance Overview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="text-green-600" size={18} />
                  Compliance Overview
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Overall Compliance Rate</span>
                      <span className="font-bold text-gray-900">{stats.complianceRate}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-600"
                        style={{ width: `${stats.complianceRate}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">{stats.upToDate}</div>
                      <div className="text-xs text-gray-600">Up to Date</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-yellow-600">{stats.needsReview}</div>
                      <div className="text-xs text-gray-600">Needs Review</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-red-600">{stats.overdue}</div>
                      <div className="text-xs text-gray-600">Overdue</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Safeguarding Status */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="text-emerald-600" size={18} />
                  Safeguarding Status
                </h3>
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <div className="text-2xl font-bold text-green-600 mb-1">All Clear</div>
                  <p className="text-xs text-gray-600">No safeguarding incidents reported</p>
                  <p className="text-xs text-gray-500 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="p-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="text-green-600" size={32} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">No Incidents Reported</h3>
              <p className="text-xs text-gray-600">Maintaining zero safeguarding incidents</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, subValue, color }) => (
  <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
    <div className="flex items-center justify-between mb-3">
      <div className={`bg-gradient-to-br ${color} p-2.5 rounded-lg shadow-sm`}>
        <Icon className="text-white" size={18} />
      </div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
    <p className="text-xs text-gray-500">{subValue}</p>
  </div>
);

export default CompliancePage;
