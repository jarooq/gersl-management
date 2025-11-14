import React, { useState } from 'react';
import {
  FileText, Download, Calendar, Filter, TrendingUp, BarChart3, PieChart,
  FileBarChart, Clock, CheckCircle, Users, DollarSign, Target, Activity,
  Plus, Eye, Printer, Mail, Settings, Search, ChevronDown, X, AlertCircle,
  Building2, Heart, Briefcase, UserCheck, ShieldCheck, Package, TrendingDown,
  Globe, Award, Database, FileSpreadsheet, Share2, RefreshCw, Zap
} from 'lucide-react';
import { useFinance } from '../../contexts/FinanceContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useOrphans } from '../../contexts/OrphanContext';
import { useHR } from '../../contexts/HRContext';
import { usePartners } from '../../contexts/PartnersContext';
import { useMEAL } from '../../contexts/MEALContext';
import { useCompliance } from '../../contexts/ComplianceContext';
import { useGrantReceivables } from '../../contexts/GrantReceivablesContext';
import { useReports } from '../../contexts/ReportContext';
import { useProposals } from '../../contexts/ProposalsContext';
import { exportReport } from '../../utils/reportExport';
import ReportGenerator from '../../components/reports/ReportGenerator';
import ReportsList from '../../components/reports/ReportsList';

const ReportsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('PDF');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [sourceType, setSourceType] = useState('project');

  // Context data
  const finance = useFinance();
  const projects = useProjects();
  const aiReports = useReports();
  const proposals = useProposals();
  const orphans = useOrphans();
  const hr = useHR();
  const partners = usePartners();
  const meal = useMEAL();
  const compliance = useCompliance();
  const grantReceivables = useGrantReceivables();

  // Empty data arrays for generated reports
  const [reports, setReports] = useState([]);
  const [scheduledReports, setScheduledReports] = useState([]);

  // Calculate stats from all modules
  const financeStats = finance.getStats();
  const projectStats = projects.getStats();
  const orphanStats = orphans.getStats();
  const hrStats = hr.getStats();
  const partnerStats = partners.getStats();
  const mealStats = meal.getStats();
  const complianceStats = compliance.getStats();
  const grantStats = grantReceivables.getTotals();

  const stats = {
    totalReports: reports.length,
    thisMonth: reports.filter(r => {
      const reportDate = new Date(r.generatedDate);
      const now = new Date();
      return reportDate.getMonth() === now.getMonth() && reportDate.getFullYear() === now.getFullYear();
    }).length,
    scheduled: scheduledReports.length,
    downloads: reports.reduce((sum, r) => sum + (r.downloads || 0), 0)
  };

  // Comprehensive report types organized by module
  const reportTypes = {
    financial: [
      { id: 'financial-summary', name: 'Financial Summary Report', desc: 'Overview of all financial activities' },
      { id: 'expense-report', name: 'Expense Analysis Report', desc: 'Detailed expense breakdown' },
      { id: 'budget-utilization', name: 'Budget Utilization Report', desc: 'Budget vs actual spending' },
      { id: 'payroll-report', name: 'Payroll Summary', desc: 'Staff payroll and deductions' },
      { id: 'purchase-orders', name: 'Purchase Orders Report', desc: 'PO status and approvals' },
      { id: 'invoices-bills', name: 'Invoices & Bills Report', desc: 'Accounts payable/receivable' },
      { id: 'cash-flow', name: 'Cash Flow Report', desc: 'Cash inflows and outflows' },
      { id: 'trial-balance', name: 'Trial Balance', desc: 'Chart of accounts balance' },
      { id: 'meal-costs', name: 'MEAL Cost Analysis', desc: 'MEAL activity costs and efficiency' }
    ],
    projects: [
      { id: 'project-portfolio', name: 'Project Portfolio Report', desc: 'All projects overview' },
      { id: 'project-performance', name: 'Project Performance Report', desc: 'Progress and KPIs by project' },
      { id: 'project-budget', name: 'Project Budget Report', desc: 'Budget tracking by project' },
      { id: 'project-timeline', name: 'Project Timeline Report', desc: 'Gantt chart and milestones' },
      { id: 'project-risks', name: 'Project Risks Report', desc: 'Risk register and mitigation' },
      { id: 'beneficiary-reach', name: 'Beneficiary Reach Report', desc: 'Beneficiaries by project' }
    ],
    orphans: [
      { id: 'orphan-registry', name: 'Orphan Registry Report', desc: 'Complete orphan database' },
      { id: 'orphan-visits', name: 'Orphan Visits Report', desc: 'Visit logs and schedules' },
      { id: 'stipend-payments', name: 'Stipend Payments Report', desc: 'Payment history and pending' },
      { id: 'orphan-demographics', name: 'Orphan Demographics', desc: 'Age, gender, location breakdown' },
      { id: 'orphan-education', name: 'Education Support Report', desc: 'School enrollment and progress' },
      { id: 'orphan-health', name: 'Health Status Report', desc: 'Medical checkups and needs' }
    ],
    hr: [
      { id: 'staff-roster', name: 'Staff Roster Report', desc: 'Complete staff directory' },
      { id: 'attendance-report', name: 'Attendance Report', desc: 'Staff attendance tracking' },
      { id: 'gps-attendance', name: 'GPS Attendance Report', desc: 'GPS-based field attendance' },
      { id: 'leave-report', name: 'Leave Management Report', desc: 'Leave requests and balances' },
      { id: 'vehicle-usage', name: 'Vehicle Usage Report', desc: 'Vehicle requests and usage' },
      { id: 'accommodation', name: 'Accommodation Report', desc: 'Guest house bookings' },
      { id: 'asset-assignments', name: 'Asset Assignment Report', desc: 'Asset allocation to staff' },
      { id: 'field-operations', name: 'Field Operations Report', desc: 'Field team activities' }
    ],
    partners: [
      { id: 'partner-portfolio', name: 'Partner Portfolio Report', desc: 'All partners and donors' },
      { id: 'contributions', name: 'Contributions Report', desc: 'Financial contributions tracking' },
      { id: 'partner-engagement', name: 'Partner Engagement Report', desc: 'Communication logs' },
      { id: 'grant-receivables', name: 'Grant Receivables Report', desc: 'Pledged vs received funds' },
      { id: 'partner-performance', name: 'Partner Performance Report', desc: 'Partnership health metrics' },
      { id: 'donor-retention', name: 'Donor Retention Report', desc: 'Retention and growth analysis' }
    ],
    meal: [
      { id: 'indicators-dashboard', name: 'Indicators Dashboard', desc: 'All indicators tracking' },
      { id: 'evaluation-report', name: 'Evaluation Report', desc: 'Evaluation findings and recommendations' },
      { id: 'cfm-report', name: 'Community Feedback Report', desc: 'CFM logs and resolutions' },
      { id: 'field-monitoring', name: 'Field Monitoring Report', desc: 'Field visit findings' },
      { id: 'learning-report', name: 'Learning & Adaptation Report', desc: 'Lessons learned documentation' },
      { id: 'indicator-progress', name: 'Indicator Progress Report', desc: 'Baseline vs target vs actual' }
    ],
    compliance: [
      { id: 'safeguarding', name: 'Safeguarding Report', desc: 'Policies and incidents' },
      { id: 'background-checks', name: 'Background Checks Report', desc: 'Staff verification status' },
      { id: 'incident-log', name: 'Incident Log Report', desc: 'Safeguarding incidents tracking' },
      { id: 'training-records', name: 'Training Records Report', desc: 'Staff training compliance' },
      { id: 'data-protection', name: 'Data Protection Report', desc: 'GDPR compliance status' },
      { id: 'audit-trail', name: 'Audit Trail Report', desc: 'System activity logs' }
    ],
    operations: [
      { id: 'activities-report', name: 'Activities Report', desc: 'Planned vs completed activities' },
      { id: 'tasks-report', name: 'Tasks Management Report', desc: 'Task assignments and completion' },
      { id: 'proposals', name: 'Proposals Report', desc: 'Grant proposals tracking' },
      { id: 'cbo-partnerships', name: 'CBO Partnerships Report', desc: 'Community organization collaboration' }
    ],
    executive: [
      { id: 'executive-summary', name: 'Executive Summary', desc: 'High-level organization overview' },
      { id: 'board-report', name: 'Board Report', desc: 'Comprehensive report for board meetings' },
      { id: 'donor-report', name: 'Donor Report', desc: 'Customizable report for donors' },
      { id: 'annual-report', name: 'Annual Report', desc: 'Year-end comprehensive report' },
      { id: 'quarterly-report', name: 'Quarterly Report', desc: 'Quarterly performance overview' },
      { id: 'impact-report', name: 'Impact Report', desc: 'Social impact and outcomes' }
    ]
  };

  const categories = [
    'All',
    'Financial',
    'Projects',
    'Orphans',
    'HR',
    'Partners',
    'MEAL',
    'Compliance',
    'Operations',
    'Executive'
  ];

  const formats = ['PDF', 'Excel', 'CSV', 'Word', 'PowerPoint'];

  // Quick stats cards data from all modules
  const quickStats = [
    { label: 'Total Projects', value: projectStats.total, change: '+0%', color: 'blue', icon: Briefcase },
    { label: 'Active Orphans', value: orphanStats.active, change: '+0%', color: 'pink', icon: Heart },
    { label: 'Total Staff', value: hrStats.totalStaff, change: '+0%', color: 'purple', icon: Users },
    { label: 'Active Partners', value: partnerStats.activePartners, change: '+0%', color: 'green', icon: Building2 },
    { label: 'Budget (LKR)', value: `${(projectStats.totalBudget / 1000000).toFixed(1)}M`, change: '+0%', color: 'orange', icon: DollarSign },
    { label: 'MEAL Indicators', value: mealStats.totalIndicators, change: '+0%', color: 'indigo', icon: Target },
    { label: 'Compliance Rate', value: '0%', change: '+0%', color: 'red', icon: ShieldCheck },
    { label: 'Grant Receivables', value: `${(grantStats.totalOutstanding / 1000000).toFixed(1)}M`, change: '+0%', color: 'teal', icon: TrendingUp }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-600',
      pink: 'from-pink-500 to-pink-600 bg-pink-50 text-pink-600',
      purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-600',
      green: 'from-green-500 to-green-600 bg-green-50 text-green-600',
      orange: 'from-orange-500 to-orange-600 bg-orange-50 text-orange-600',
      indigo: 'from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-600',
      red: 'from-red-500 to-red-600 bg-red-50 text-red-600',
      teal: 'from-teal-500 to-teal-600 bg-teal-50 text-teal-600'
    };
    return colors[color] || colors.blue;
  };

  const handleGenerateReport = () => {
    if (!selectedReportType || !dateRange.start || !dateRange.end) {
      alert('Please fill in all required fields');
      return;
    }

    const reportTypeObj = Object.values(reportTypes)
      .flat()
      .find(rt => rt.id === selectedReportType);

    const newReport = {
      id: reports.length + 1,
      name: reportTypeObj.name,
      type: selectedReportType,
      category: Object.keys(reportTypes).find(key =>
        reportTypes[key].some(rt => rt.id === selectedReportType)
      ),
      generatedDate: new Date().toISOString().split('T')[0],
      dateRange: dateRange,
      format: selectedFormat,
      downloads: 0,
      status: 'Generated'
    };

    setReports([newReport, ...reports]);
    setShowGenerateModal(false);
    setSelectedReportType('');
    setDateRange({ start: '', end: '' });
    setSelectedFormat('PDF');
  };

  const handleScheduleReport = (scheduleData) => {
    const newSchedule = {
      id: scheduledReports.length + 1,
      ...scheduleData,
      status: 'Active',
      nextDate: calculateNextDate(scheduleData.frequency),
      createdDate: new Date().toISOString().split('T')[0]
    };

    setScheduledReports([...scheduledReports, newSchedule]);
    setShowScheduleModal(false);
  };

  const calculateNextDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'Daily':
        now.setDate(now.getDate() + 1);
        break;
      case 'Weekly':
        now.setDate(now.getDate() + 7);
        break;
      case 'Monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'Quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        now.setDate(now.getDate() + 1);
    }
    return now.toISOString().split('T')[0];
  };

  const handleDownloadReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    // Gather all context data for the report
    const contextData = {
      financeStats,
      projectStats,
      orphanStats,
      hrStats,
      partnerStats,
      mealStats,
      complianceStats,
      grantStats,
      chartOfAccounts: finance.chartOfAccounts || [],
      projects: projects.projects || [],
      orphans: orphans.orphans || [],
      staff: hr.employees || [],
      partners: partners.partners || []
    };

    // Export the report using the utility
    exportReport(report, report.name, report.format, contextData);

    // Update download count
    setReports(reports.map(r =>
      r.id === reportId ? { ...r, downloads: (r.downloads || 0) + 1 } : r
    ));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <FileBarChart className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                  <p className="text-indigo-100 text-sm mt-1">Comprehensive reporting across all modules</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-lg hover:bg-white/20 transition-all font-semibold"
              >
                <Clock size={20} />
                Schedule
              </button>
              <button
                onClick={() => setShowGenerateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-lg hover:shadow-xl transition-all font-semibold"
              >
                <Plus size={20} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <FileText className="text-white" size={24} />
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">All Time</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.totalReports}</h3>
          <p className="text-sm text-gray-600">Total Reports</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-white" size={24} />
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-3 py-1 rounded-full">This Month</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.thisMonth}</h3>
          <p className="text-sm text-gray-600">Generated</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Clock className="text-white" size={24} />
            </div>
            <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">Upcoming</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.scheduled}</h3>
          <p className="text-sm text-gray-600">Scheduled</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Download className="text-white" size={24} />
            </div>
            <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">Total</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">{stats.downloads}</h3>
          <p className="text-sm text-gray-600">Downloads</p>
        </div>
      </div>

      {/* Quick Stats from All Modules */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">System Overview</h2>
            <p className="text-sm text-gray-600">Real-time data across all modules</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            const colors = getColorClasses(stat.color).split(' ');
            return (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg hover:shadow-md transition-all">
                <div className={`w-12 h-12 bg-gradient-to-br ${colors[0]} ${colors[1]} rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent size={20} className="text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.change}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'catalog', label: 'Report Catalog', icon: FileBarChart },
              { id: 'reports', label: 'Generated Reports', icon: FileText },
              { id: 'ai-reports', label: 'AI Reports', icon: Zap },
              { id: 'scheduled', label: 'Scheduled', icon: Calendar }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon size={18} />
                <span className="font-semibold">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowGenerateModal(true)}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-200 transition-all">
                      <Plus className="text-indigo-600" size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Generate Report</h3>
                    <p className="text-sm text-gray-600">Create custom report</p>
                  </div>
                </button>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-all">
                      <Calendar className="text-purple-600" size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Schedule Report</h3>
                    <p className="text-sm text-gray-600">Automate generation</p>
                  </div>
                </button>

                <button
                  onClick={() => setActiveTab('catalog')}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-all">
                      <FileBarChart className="text-green-600" size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Browse Catalog</h3>
                    <p className="text-sm text-gray-600">View all report types</p>
                  </div>
                </button>

                <button className="p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-orange-400 hover:bg-orange-50 transition-all group">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-all">
                      <Share2 className="text-orange-600" size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">Export Data</h3>
                    <p className="text-sm text-gray-600">Bulk data export</p>
                  </div>
                </button>
              </div>

              {/* Module Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Financial Reports</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {reportTypes.financial.length} types
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Budget, expenses, payroll, and financial analysis</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedCategory('Financial');
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm"
                    >
                      View Reports
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Projects & MEAL</h3>
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold">
                      {reportTypes.projects.length + reportTypes.meal.length} types
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Performance, indicators, and impact assessment</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedCategory('Projects');
                      }}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-sm"
                    >
                      View Reports
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">HR & Operations</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                      {reportTypes.hr.length + reportTypes.operations.length} types
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Staff, attendance, activities, and tasks</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveTab('catalog');
                        setSelectedCategory('HR');
                      }}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
                    >
                      View Reports
                    </button>
                  </div>
                </div>
              </div>

              {/* Recent Reports */}
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recent Reports</h2>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View All →
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="mx-auto text-gray-300 mb-4" size={64} />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Yet</h3>
                    <p className="text-gray-600 mb-4">Generate your first report to get started</p>
                    <button
                      onClick={() => setShowGenerateModal(true)}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                    >
                      Generate Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 5).map(report => (
                      <div key={report.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                              <FileText className="text-indigo-600" size={20} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{report.name}</h4>
                              <p className="text-sm text-gray-600">{report.generatedDate} • {report.format}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">{report.downloads} downloads</span>
                            <button
                              onClick={() => handleDownloadReport(report.id)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Report Catalog Tab */}
          {activeTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Report Catalog</h2>
                  <p className="text-gray-600 mt-1">Browse all available report types across modules</p>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-semibold"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {Object.entries(reportTypes).map(([category, types]) => {
                if (selectedCategory !== 'All' && selectedCategory.toLowerCase() !== category) return null;

                return (
                  <div key={category} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-gray-900 capitalize">{category} Reports</h3>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                        {types.length} reports
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {types.map((reportType) => (
                        <div
                          key={reportType.id}
                          className="bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-md transition-all group cursor-pointer"
                          onClick={() => {
                            setSelectedReportType(reportType.id);
                            setShowGenerateModal(true);
                          }}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-all">
                              <FileBarChart size={24} className="text-white" />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedReportType(reportType.id);
                                setShowGenerateModal(true);
                              }}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Zap size={20} />
                            </button>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                            {reportType.name}
                          </h4>
                          <p className="text-sm text-gray-600">{reportType.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Generated Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Reports List */}
              {reports.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <FileText className="mx-auto text-gray-300 mb-4" size={80} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Reports Found</h3>
                  <p className="text-gray-600 mb-6">Start by generating your first report</p>
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                  >
                    <Plus className="inline mr-2" size={20} />
                    Generate Report
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {reports
                    .filter(r => selectedCategory === 'All' || r.category === selectedCategory.toLowerCase())
                    .filter(r => !searchTerm || r.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(report => (
                      <div key={report.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="text-indigo-600" size={24} />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg mb-1">{report.name}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar size={14} />
                                  {report.generatedDate}
                                </span>
                                <span className="flex items-center gap-1">
                                  <FileText size={14} />
                                  {report.format}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download size={14} />
                                  {report.downloads || 0} downloads
                                </span>
                              </div>
                              <div className="mt-2 text-xs text-gray-500">
                                Date Range: {report.dateRange.start} to {report.dateRange.end}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                              <Eye size={20} />
                            </button>
                            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                              <Mail size={20} />
                            </button>
                            <button
                              onClick={() => handleDownloadReport(report.id)}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                            >
                              <Download className="inline mr-2" size={18} />
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* AI Reports Tab */}
          {activeTab === 'ai-reports' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                    <Zap size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">AI-Powered Report Generation</h2>
                    <p className="text-sm text-gray-600">Generate professional narrative reports using AI</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mb-4">
                  Create comprehensive donor reports, progress reports, completion reports, and more with AI assistance.
                  Reports are generated based on your project or proposal data and can be exported in multiple formats.
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">7 Report Types</span>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">AI-Powered</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">5 Export Formats</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Source Selection */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Source</h3>

                    {/* Source Type Toggle */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source Type
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSourceType('project');
                            setSelectedProposal(null);
                          }}
                          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                            sourceType === 'project'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Project
                        </button>
                        <button
                          onClick={() => {
                            setSourceType('proposal');
                            setSelectedProject(null);
                          }}
                          className={`flex-1 px-4 py-2 rounded text-sm font-medium transition-colors ${
                            sourceType === 'proposal'
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          Proposal
                        </button>
                      </div>
                    </div>

                    {/* Project Selection */}
                    {sourceType === 'project' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Project
                        </label>
                        {projects.projects && projects.projects.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {projects.projects.map((project) => (
                              <div
                                key={project.id}
                                onClick={() => setSelectedProject(project)}
                                className={`p-3 border rounded cursor-pointer transition-colors ${
                                  selectedProject?.id === project.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                <p className="font-medium text-sm text-gray-800">{project.name}</p>
                                {project.donor && (
                                  <p className="text-xs text-gray-600 mt-1">{project.donor}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No projects available
                          </p>
                        )}
                      </div>
                    )}

                    {/* Proposal Selection */}
                    {sourceType === 'proposal' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Proposal
                        </label>
                        {proposals.proposals && proposals.proposals.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {proposals.proposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                onClick={() => setSelectedProposal(proposal)}
                                className={`p-3 border rounded cursor-pointer transition-colors ${
                                  selectedProposal?.id === proposal.id
                                    ? 'border-indigo-600 bg-indigo-50'
                                    : 'border-gray-200 hover:border-indigo-300'
                                }`}
                              >
                                <p className="font-medium text-sm text-gray-800">{proposal.title}</p>
                                {proposal.donor && (
                                  <p className="text-xs text-gray-600 mt-1">{proposal.donor}</p>
                                )}
                                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                                  proposal.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                  proposal.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {proposal.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No proposals available
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Report Generator */}
                <div className="lg:col-span-2">
                  <ReportGenerator
                    project={selectedProject}
                    proposal={selectedProposal}
                    onReportGenerated={() => {}}
                  />
                </div>
              </div>

              {/* Generated AI Reports */}
              <div>
                <ReportsList />
              </div>
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Scheduled Reports</h2>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                >
                  <Plus size={20} />
                  New Schedule
                </button>
              </div>

              {scheduledReports.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-xl">
                  <Clock className="mx-auto text-gray-300 mb-4" size={80} />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Scheduled Reports</h3>
                  <p className="text-gray-600 mb-6">Set up automated report generation</p>
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                  >
                    <Calendar className="inline mr-2" size={20} />
                    Schedule Report
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {scheduledReports.map(schedule => (
                    <div key={schedule.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{schedule.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {schedule.frequency}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar size={14} />
                              Next: {schedule.nextDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users size={14} />
                              {schedule.recipients || 0} recipients
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {schedule.status}
                          </span>
                          <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                            <Settings size={20} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Generate New Report</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Report Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedReportType('');
                    }}
                  >
                    <option value="">Select category...</option>
                    {Object.keys(reportTypes).map(cat => (
                      <option key={cat} value={cat} className="capitalize">{cat}</option>
                    ))}
                  </select>
                </div>

                {selectedCategory && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Report Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      value={selectedReportType}
                      onChange={(e) => setSelectedReportType(e.target.value)}
                    >
                      <option value="">Select report type...</option>
                      {reportTypes[selectedCategory]?.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                    {selectedReportType && (
                      <p className="mt-2 text-sm text-gray-600">
                        {reportTypes[selectedCategory]?.find(t => t.id === selectedReportType)?.desc}
                      </p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Output Format <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-5 gap-3">
                    {formats.map(format => (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`p-3 border-2 rounded-lg font-semibold transition-all ${
                          selectedFormat === format
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-semibold text-blue-900 mb-1">Report Generation Info</p>
                      <p className="text-xs text-blue-700">
                        Reports are generated based on real-time data from your system. Large date ranges may take longer to process.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={!selectedReportType || !dateRange.start || !dateRange.end}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="inline mr-2" size={18} />
                Generate Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Report Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Schedule Automated Report</h2>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Report Name</label>
                  <input
                    type="text"
                    placeholder="Monthly Financial Summary"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Report Type</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="">Select report type...</option>
                    {Object.entries(reportTypes).map(([category, types]) =>
                      types.map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frequency</label>
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annually</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Recipients (Email)</label>
                  <textarea
                    placeholder="email@example.com, email2@example.com"
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate multiple emails with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Format</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['PDF', 'Excel', 'CSV'].map(format => (
                      <button
                        key={format}
                        className="p-3 border-2 border-gray-300 hover:border-purple-400 rounded-lg font-semibold"
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleScheduleReport({
                    name: 'New Scheduled Report',
                    frequency: 'Monthly',
                    recipients: 0
                  });
                }}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
              >
                <Clock className="inline mr-2" size={18} />
                Schedule Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
