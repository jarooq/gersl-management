import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Users, DollarSign, Baby, Briefcase, TrendingUp, TrendingDown,
  Calendar, CheckCircle, Clock, ArrowRight, Target,
  Heart, Award, Activity, BarChart3, MapPin, FileText, Globe, AlertTriangle, Handshake
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrphans } from '../../contexts/OrphanContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useHR } from '../../contexts/HRContext';
import { usePartners } from '../../contexts/PartnersContext';
import { useProposals } from '../../contexts/ProposalsContext';
import { useSettings } from '../../contexts/SettingsContext';

const Dashboard = () => {
  const { currentUser } = useAuth();

  // Get data from contexts
  const { orphans } = useOrphans();
  const { projects } = useProjects();
  const { getTotalExpenses, budgets } = useFinance();
  const { staff } = useHR();
  const { partners } = usePartners();
  const { proposals } = useProposals();
  const { performanceTargets } = useSettings();

  // Calculate real statistics
  const activeOrphans = orphans.filter(o => o.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
  const activeStaff = staff.filter(s => s.status === 'Active').length;

  // Calculate total beneficiaries (orphans + project beneficiaries)
  const totalBeneficiaries = orphans.length + projects.reduce((sum, p) => sum + (p.beneficiaries || 0), 0);

  const stats = [
    {
      title: 'Active Orphans',
      value: activeOrphans.toString(),
      icon: Baby,
      gradient: 'from-pink-500 to-rose-600',
      change: activeOrphans > 0 ? `${activeOrphans} total` : 'No data',
      changePercent: '',
      trend: 'up'
    },
    {
      title: 'Active Projects',
      value: activeProjects.toString(),
      icon: Briefcase,
      gradient: 'from-purple-500 to-indigo-600',
      change: activeProjects > 0 ? `${activeProjects} active` : 'No data',
      changePercent: '',
      trend: 'up'
    },
    {
      title: 'Total Budget',
      value: totalBudget > 0 ? `${(totalBudget / 1000000).toFixed(1)}M` : '0',
      icon: DollarSign,
      gradient: 'from-green-500 to-emerald-600',
      change: totalBudget > 0 ? 'LKR' : 'No budgets',
      trend: 'up'
    },
    {
      title: 'Beneficiaries',
      value: totalBeneficiaries > 0 ? totalBeneficiaries.toString() : '0',
      icon: Users,
      gradient: 'from-blue-500 to-cyan-600',
      change: totalBeneficiaries > 0 ? 'Total served' : 'No data',
      changePercent: '',
      trend: 'up'
    },
  ];

  // Generate real recent activities from actual data
  const recentActivities = (() => {
    const activities = [];

    // Helper function to calculate time ago
    const timeAgo = (date) => {
      if (!date) return 'Recently';
      const now = new Date();
      const then = new Date(date);
      const diffMs = now - then;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return then.toLocaleDateString();
    };

    // Add recent orphans
    if (orphans.length > 0) {
      const recentOrphans = [...orphans]
        .sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0))
        .slice(0, 2);

      recentOrphans.forEach(orphan => {
        if (orphan.registrationDate) {
          activities.push({
            id: `orphan-${orphan.id}`,
            title: `New orphan registered: ${orphan.fullName}`,
            time: timeAgo(orphan.registrationDate),
            timestamp: new Date(orphan.registrationDate),
            icon: Baby,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50'
          });
        }
      });
    }

    // Add recent projects
    if (projects.length > 0) {
      const recentProjects = [...projects]
        .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
        .slice(0, 2);

      recentProjects.forEach(project => {
        if (project.startDate) {
          const icon = project.status === 'Completed' ? CheckCircle : Briefcase;
          const color = project.status === 'Completed' ? 'text-green-600' : 'text-blue-600';
          const bgColor = project.status === 'Completed' ? 'bg-green-50' : 'bg-blue-50';

          activities.push({
            id: `project-${project.id}`,
            title: `${project.status === 'Completed' ? 'Completed' : 'Started'}: ${project.projectName}`,
            time: timeAgo(project.startDate),
            timestamp: new Date(project.startDate),
            icon: icon,
            color: color,
            bgColor: bgColor
          });
        }
      });
    }

    // Add recent proposals
    if (proposals.length > 0) {
      const recentProposals = [...proposals]
        .sort((a, b) => new Date(b.submissionDate || 0) - new Date(a.submissionDate || 0))
        .slice(0, 2);

      recentProposals.forEach(proposal => {
        if (proposal.submissionDate) {
          activities.push({
            id: `proposal-${proposal.id}`,
            title: `Proposal submitted: ${proposal.projectTitle}`,
            time: timeAgo(proposal.submissionDate),
            timestamp: new Date(proposal.submissionDate),
            icon: FileText,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50'
          });
        }
      });
    }

    // Add recent partners
    if (partners.length > 0) {
      const recentPartners = [...partners]
        .sort((a, b) => new Date(b.partnershipDate || 0) - new Date(a.partnershipDate || 0))
        .slice(0, 1);

      recentPartners.forEach(partner => {
        if (partner.partnershipDate) {
          activities.push({
            id: `partner-${partner.id}`,
            title: `New partner: ${partner.organizationName}`,
            time: timeAgo(partner.partnershipDate),
            timestamp: new Date(partner.partnershipDate),
            icon: Handshake,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50'
          });
        }
      });
    }

    // Sort all activities by timestamp and take top 5
    return activities
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
  })();

  // Generate real upcoming tasks from actual data
  const upcomingTasks = (() => {
    const tasks = [];
    const today = new Date();

    // Helper function to format due date
    const formatDueDate = (date) => {
      const diffTime = date - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Check for orphans needing visits (last visit > 30 days ago or never visited)
    const orphansNeedingVisit = orphans.filter(o => {
      if (o.status !== 'Active') return false;
      if (!o.lastVisitDate) return true;
      const lastVisit = new Date(o.lastVisitDate);
      const daysSinceVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
      return daysSinceVisit > 30;
    });

    if (orphansNeedingVisit.length > 0) {
      tasks.push({
        id: 'orphan-visits',
        title: `Orphan visits overdue (${orphansNeedingVisit.length} orphans)`,
        due: 'Overdue',
        priority: 'high',
        dueDate: today
      });
    }

    // Check for projects with upcoming deadlines (within 30 days)
    const upcomingProjectDeadlines = projects.filter(p => {
      if (p.status === 'Completed' || p.status === 'On Hold') return false;
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 30;
    }).sort((a, b) => new Date(a.endDate) - new Date(b.endDate));

    upcomingProjectDeadlines.slice(0, 2).forEach(project => {
      const endDate = new Date(project.endDate);
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      tasks.push({
        id: `project-${project.id}`,
        title: `Project deadline: ${project.projectName}`,
        due: formatDueDate(endDate),
        priority: daysUntilEnd <= 7 ? 'high' : 'medium',
        dueDate: endDate
      });
    });

    // Check for pending proposals
    const pendingProposals = proposals.filter(p => p.status === 'Draft' || p.status === 'Pending');
    if (pendingProposals.length > 0) {
      tasks.push({
        id: 'pending-proposals',
        title: `Review pending proposals (${pendingProposals.length})`,
        due: 'This week',
        priority: 'medium',
        dueDate: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      });
    }

    // Check for budgets needing review (if budget period is ending soon)
    const budgetsNeedingReview = budgets.filter(b => {
      if (!b.endDate) return false;
      const endDate = new Date(b.endDate);
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 30;
    });

    if (budgetsNeedingReview.length > 0) {
      const nextBudget = budgetsNeedingReview.sort((a, b) => new Date(a.endDate) - new Date(b.endDate))[0];
      const endDate = new Date(nextBudget.endDate);
      tasks.push({
        id: 'budget-review',
        title: `Budget review: ${nextBudget.category}`,
        due: formatDueDate(endDate),
        priority: 'medium',
        dueDate: endDate
      });
    }

    // Sort tasks by priority and due date
    return tasks
      .sort((a, b) => {
        // Priority order: high > medium > low
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        // Then by due date
        return a.dueDate - b.dueDate;
      })
      .slice(0, 5);
  })();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Welcome back, {currentUser?.fullName?.split(' ')[0] || 'User'}!</h1>
                <p className="text-blue-100 text-sm">Here's your organization overview</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200 mb-1">Current Date</div>
              <div className="text-sm font-semibold">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`bg-gradient-to-br ${stat.gradient} p-2.5 rounded-lg shadow-sm group-hover:scale-105 transition-transform`}>
                <stat.icon className="text-white" size={18} />
              </div>
              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                stat.trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {stat.trend === 'up' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                <span>{stat.changePercent}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.change} this month</p>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Active Staff', value: activeStaff, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Active Partners', value: partners.filter(p => p.status === 'Active').length, icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Districts Covered', value: new Set(orphans.map(o => o.district)).size, icon: MapPin, color: 'text-cyan-600', bg: 'bg-cyan-50' },
          { label: 'Total Proposals', value: proposals.length, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' }
        ].map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
            <div className="flex items-center gap-3">
              <div className={`${item.bg} p-2 rounded-lg`}>
                <item.icon className={item.color} size={16} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{item.value}</p>
                <p className="text-xs text-gray-600">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Budget Utilization - Compact */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="text-green-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Budget Utilization by Programme</h3>
            </div>
            <div className="text-right">
              {(() => {
                const totalProgrammeBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
                const totalProgrammeSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
                const overallPercent = totalProgrammeBudget > 0 ? Math.round((totalProgrammeSpent / totalProgrammeBudget) * 100) : 0;
                return (
                  <>
                    <div className="text-lg font-bold text-gray-900">{overallPercent}%</div>
                    <div className={`text-xs flex items-center gap-1 ${overallPercent > 80 ? 'text-red-600' : overallPercent > 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                      <TrendingUp size={10} />
                      {overallPercent > 80 ? 'High use' : overallPercent > 60 ? 'On track' : 'Low use'}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
          <div className="space-y-2.5">
            {(() => {
              // Group projects by programme area
              const programmeData = {};
              projects.forEach(project => {
                const area = project.programmeArea || 'Other';
                if (!programmeData[area]) {
                  programmeData[area] = { budget: 0, spent: 0 };
                }
                programmeData[area].budget += project.budget || 0;
                programmeData[area].spent += project.spent || 0;
              });

              const programmes = Object.entries(programmeData)
                .map(([area, data]) => ({
                  program: area,
                  used: data.spent / 1000000,
                  budget: data.budget / 1000000,
                  percent: data.budget > 0 ? Math.round((data.spent / data.budget) * 100) : 0
                }))
                .filter(p => p.budget > 0) // Only show programmes with actual budget
                .sort((a, b) => b.budget - a.budget)
                .slice(0, 5);

              if (programmes.length === 0) {
                return (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No programme budget data available
                  </div>
                );
              }

              return programmes.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.program}</span>
                    <span className="text-gray-600">{item.used.toFixed(1)}M / {item.budget.toFixed(1)}M LKR</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        item.percent > 80 ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                        item.percent > 60 ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                        'bg-gradient-to-r from-green-500 to-emerald-600'
                      }`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Project Status - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-purple-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Project Status</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">{projects.length}</div>
          </div>
          <div className="space-y-2.5">
            {(() => {
              if (projects.length === 0) {
                return (
                  <div className="text-center py-4 text-gray-500 text-xs">No projects yet</div>
                );
              }

              const inProgressCount = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;
              const planningCount = projects.filter(p => p.status === 'Planning').length;
              const completedCount = projects.filter(p => p.status === 'Completed').length;
              const onHoldCount = projects.filter(p => p.status === 'On Hold').length;
              const total = projects.length;

              return [
                { status: 'In Progress', count: inProgressCount, percent: (inProgressCount / total) * 100, color: 'from-blue-500 to-cyan-600' },
                { status: 'Planning', count: planningCount, percent: (planningCount / total) * 100, color: 'from-purple-500 to-indigo-600' },
                { status: 'Completed', count: completedCount, percent: (completedCount / total) * 100, color: 'from-green-500 to-emerald-600' },
                { status: 'On Hold', count: onHoldCount, percent: (onHoldCount / total) * 100, color: 'from-yellow-500 to-orange-600' }
              ].filter(item => item.count > 0).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.color}`}></div>
                      <span className="font-medium text-gray-700">{item.status}</span>
                    </div>
                    <span className="text-gray-600">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${item.color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Performance & Geographic Coverage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance Metrics - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Performance Indicators</h3>
            </div>
            {(() => {
              const completedProjects = projects.filter(p => p.status === 'Completed').length;
              const totalProjects = projects.length;
              const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

              const totalBudgetAmount = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
              const totalSpentAmount = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
              const budgetEfficiency = totalBudgetAmount > 0 ? Math.round((totalSpentAmount / totalBudgetAmount) * 100) : 0;

              const activeOrphansCount = orphans.filter(o => o.status === 'Active').length;
              const totalOrphansCount = orphans.length;
              const orphanCoverage = totalOrphansCount > 0 ? Math.round((activeOrphansCount / totalOrphansCount) * 100) : 0;

              const activePartnersCount = partners.filter(p => p.status === 'Active').length;
              const totalPartnersCount = partners.length;
              const partnerEngagement = totalPartnersCount > 0 ? Math.round((activePartnersCount / totalPartnersCount) * 100) : 0;

              const metrics = [
                { metric: 'Project Completion', value: completionRate, target: performanceTargets.dashboard.projectCompletionTarget },
                { metric: 'Budget Utilization', value: budgetEfficiency, target: performanceTargets.dashboard.budgetUtilizationTarget },
                { metric: 'Orphan Coverage', value: orphanCoverage, target: performanceTargets.dashboard.orphanCoverageTarget },
                { metric: 'Partner Engagement', value: partnerEngagement, target: performanceTargets.dashboard.partnerEngagementTarget },
              ];

              const avgPerformance = Math.round(metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length);

              return (
                <>
                  <div className={`text-lg font-bold ${avgPerformance >= 75 ? 'text-green-600' : avgPerformance >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {avgPerformance}%
                  </div>
                </>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(() => {
              const completedProjects = projects.filter(p => p.status === 'Completed').length;
              const totalProjects = projects.length;
              const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

              const totalBudgetAmount = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
              const totalSpentAmount = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
              const budgetEfficiency = totalBudgetAmount > 0 ? Math.round((totalSpentAmount / totalBudgetAmount) * 100) : 0;

              const activeOrphansCount = orphans.filter(o => o.status === 'Active').length;
              const totalOrphansCount = orphans.length;
              const orphanCoverage = totalOrphansCount > 0 ? Math.round((activeOrphansCount / totalOrphansCount) * 100) : 0;

              const activePartnersCount = partners.filter(p => p.status === 'Active').length;
              const totalPartnersCount = partners.length;
              const partnerEngagement = totalPartnersCount > 0 ? Math.round((activePartnersCount / totalPartnersCount) * 100) : 0;

              return [
                { metric: 'Project Completion', value: completionRate, target: performanceTargets.dashboard.projectCompletionTarget },
                { metric: 'Budget Utilization', value: budgetEfficiency, target: performanceTargets.dashboard.budgetUtilizationTarget },
                { metric: 'Orphan Coverage', value: orphanCoverage, target: performanceTargets.dashboard.orphanCoverageTarget },
                { metric: 'Partner Engagement', value: partnerEngagement, target: performanceTargets.dashboard.partnerEngagementTarget },
              ].map((item, index) => (
                <div key={index} className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-700">{item.metric}</span>
                    <span className={`text-sm font-bold ${
                      item.value >= item.target ? 'text-green-600' : 'text-orange-600'
                    }`}>{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                    <div
                      className={`h-1 rounded-full ${
                        item.value >= item.target
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                          : 'bg-gradient-to-r from-orange-500 to-red-600'
                      }`}
                      style={{ width: `${item.value}%` }}
                    ></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Geographic Coverage - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="text-teal-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Geographic Coverage</h3>
            </div>
            <div className="text-lg font-bold text-gray-900">{new Set(orphans.map(o => o.district)).size}</div>
          </div>
          <div className="space-y-2">
            {(() => {
              const districtData = {};
              orphans.forEach(orphan => {
                if (orphan.district) {
                  if (!districtData[orphan.district]) {
                    districtData[orphan.district] = { orphans: 0 };
                  }
                  districtData[orphan.district].orphans++;
                }
              });

              const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];

              return Object.entries(districtData)
                .sort((a, b) => b[1].orphans - a[1].orphans)
                .slice(0, 4)
                .map(([district, data], index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${colors[index % colors.length]}`}></div>
                      <span className="text-xs font-medium text-gray-700">{district}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span>{data.orphans} orphans</span>
                    </div>
                  </div>
                ));
            })()}
            {orphans.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-xs">No geographic data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Activity and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Activity - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Recent Activity</h3>
            </div>
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
              View all
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-2.5 p-2.5 ${activity.bgColor} rounded-lg hover:shadow-sm transition-all duration-200`}
                >
                  <activity.icon size={16} className={activity.color} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 leading-snug">{activity.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No recent activity to display
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Tasks - Compact */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="text-purple-600" size={18} />
              <h3 className="text-sm font-bold text-gray-900">Upcoming Tasks</h3>
            </div>
            <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              Add task
              <ArrowRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-lg hover:shadow-sm transition-all duration-200 group"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-2 border-gray-300 cursor-pointer"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Calendar size={10} className="text-gray-400" />
                      <p className="text-xs text-gray-500">{task.due}</p>
                      <span className={`ml-auto px-1.5 py-0.5 rounded text-xs font-semibold ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 text-sm">
                No upcoming tasks
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact Summary - Compact */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-blue-500 p-2 rounded-lg shadow-sm">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Impact Summary</h3>
            <p className="text-xs text-gray-600">Organization achievements</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Orphans', value: orphans.length.toString(), color: 'text-blue-600' },
            { label: 'Active Orphans', value: activeOrphans.toString(), color: 'text-green-600' },
            { label: 'Total Projects', value: projects.length.toString(), color: 'text-purple-600' },
            { label: 'Active Partners', value: partners.filter(p => p.status === 'Active').length.toString(), color: 'text-orange-600' }
          ].map((item, index) => (
            <div key={index} className="text-center p-3 bg-white rounded-lg shadow-sm">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
