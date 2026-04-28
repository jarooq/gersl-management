import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, DollarSign, Baby, Briefcase, TrendingUp, TrendingDown,
  Calendar, CheckCircle, Clock, ArrowRight, Target, Heart,
  Award, Activity, BarChart3, MapPin, FileText, Globe,
  AlertTriangle, Handshake, Plus, ExternalLink, Bell,
  Package, Wallet, Building2, UserCheck, AlertCircle, ChevronRight,
  Zap, Flame
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';
import { useOrphans } from '../../contexts/OrphanContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useFinance } from '../../contexts/FinanceContext';
import { useHR } from '../../contexts/HRContext';
import { usePartners } from '../../contexts/PartnersContext';
import { useProposals } from '../../contexts/ProposalsContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useCampaign } from '../../contexts/CampaignContext';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { orphans } = useOrphans();
  const { projects } = useProjects();
  const {
    expenses,
    budgets,
    getStats,
    getExpensesByCategory,
    invoices,
    bills,
    payrollData,
    purchaseOrders
  } = useFinance();
  const { staff } = useHR();
  const { partners } = usePartners();
  const { proposals } = useProposals();
  const { performanceTargets } = useSettings();
  const { campaigns } = useCampaign();

  // Financial statistics
  const financeStats = getStats();
  const expensesByCategory = getExpensesByCategory();

  // Calculate statistics
  const activeOrphans = orphans.filter(o => o.status === 'Active').length;
  const activeProjects = projects.filter(p => p.status === 'Active' || p.status === 'In Progress').length;
  const totalBudget = budgets.reduce((sum, b) => sum + (b.totalBudget || 0), 0);
  const activeStaff = staff.filter(s => s.status === 'Active').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
  const totalBeneficiaries = orphans.length + projects.reduce((sum, p) => sum + (p.beneficiaries || 0), 0);
  const activePartners = partners.filter(p => p.status === 'Active').length;
  const pendingProposals = proposals.filter(p => p.status === 'Draft' || p.status === 'Pending').length;

  // Campaign metrics
  const totalCampaignTarget = campaigns.reduce((sum, c) => sum + (c.targetAmount || 0), 0);
  const totalCampaignRaised = campaigns.reduce((sum, c) => sum + (c.raisedAmount || 0), 0);
  const campaignProgress = totalCampaignTarget > 0 ? (totalCampaignRaised / totalCampaignTarget) * 100 : 0;

  // Quick stats for today/this week
  const today = new Date();
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's donations (from campaign raised amounts updated today)
  const todaysDonations = campaigns.filter(c => {
    const lastUpdate = new Date(c.updatedAt || c.createdAt);
    return lastUpdate.toDateString() === new Date().toDateString();
  }).reduce((sum, c) => sum + (c.raisedAmount || 0), 0);

  // This week's new orphan registrations
  const weeklyNewOrphans = orphans.filter(o => {
    const regDate = new Date(o.registrationDate || o.createdAt);
    return regDate >= startOfWeek;
  }).length;

  // Upcoming deadlines (next 7 days)
  const upcomingDeadlines = projects.filter(p => {
    if (!p.endDate || p.status === 'Completed') return false;
    const endDate = new Date(p.endDate);
    const daysUntil = Math.ceil((endDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  }).length;

  // Budget burn rate (monthly)
  const monthlyExpenses = expenses.filter(e => {
    const expDate = new Date(e.date || e.createdAt);
    return expDate >= startOfMonth;
  }).reduce((sum, e) => sum + (e.amount || 0), 0);

  // Donor metrics (from orphans with assigned donors)
  const orphansWithDonors = orphans.filter(o => o.donorName || o.donor);
  const totalDonors = new Set(orphans.map(o => o.donorName || o.donor).filter(Boolean)).size;

  // Recent donations (from campaigns updated recently)
  const recentDonations = campaigns
    .filter(c => c.updatedAt || c.createdAt)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5)
    .map(c => ({
      campaign: c.title,
      amount: c.raisedAmount,
      date: c.updatedAt || c.createdAt
    }));

  // Chart data - Monthly project timeline
  const projectTimelineData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthProjects = projects.filter(p => {
        const startDate = new Date(p.startDate);
        return startDate.getFullYear() === currentYear && startDate.getMonth() === index;
      });

      return {
        month,
        projects: monthProjects.length,
        budget: monthProjects.reduce((sum, p) => sum + (p.budget || 0), 0) / 1000000 // Convert to millions
      };
    });
  }, [projects]);

  // Budget allocation by programme area
  const budgetByProgrammeData = useMemo(() => {
    const programmeData = {};
    projects.forEach(project => {
      const area = project.programmeArea || 'Other';
      if (!programmeData[area]) {
        programmeData[area] = 0;
      }
      programmeData[area] += project.budget || 0;
    });

    return Object.entries(programmeData)
      .map(([name, value]) => ({
        name,
        value: value / 1000000 // Convert to millions
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [projects]);

  // Campaign fundraising progress
  const campaignProgressData = useMemo(() => {
    return campaigns
      .filter(c => c.status === 'Active')
      .map(c => ({
        name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
        raised: c.raisedAmount / 1000,
        target: c.targetAmount / 1000,
        progress: (c.raisedAmount / c.targetAmount) * 100
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 6);
  }, [campaigns]);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const statuses = ['In Progress', 'Planning', 'Completed', 'On Hold'];
    return statuses.map(status => ({
      name: status,
      value: projects.filter(p => {
        if (status === 'In Progress') return p.status === 'In Progress' || p.status === 'Active';
        return p.status === status;
      }).length
    })).filter(item => item.value > 0);
  }, [projects]);

  // Monthly expense trends
  const monthlyExpenseData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();

    return months.map((month, index) => {
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date || e.createdAt);
        return expenseDate.getFullYear() === currentYear && expenseDate.getMonth() === index;
      });

      return {
        month,
        expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) / 1000, // Convert to thousands
        budget: budgets
          .filter(b => {
            const budgetDate = new Date(b.startDate || b.createdAt);
            return budgetDate.getFullYear() === currentYear && budgetDate.getMonth() === index;
          })
          .reduce((sum, b) => sum + (b.allocated || b.totalBudget || 0), 0) / 1000
      };
    });
  }, [expenses, budgets]);

  // Expense by category for pie chart
  const expenseCategoryData = useMemo(() => {
    return expensesByCategory
      .map(item => ({
        name: item.name,
        value: item.amount / 1000 // Convert to thousands
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [expensesByCategory]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // Recent activities
  const recentActivities = useMemo(() => {
    const activities = [];
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

    // Recent orphans
    [...orphans]
      .sort((a, b) => new Date(b.registrationDate || 0) - new Date(a.registrationDate || 0))
      .slice(0, 2)
      .forEach(orphan => {
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

    // Recent projects
    [...projects]
      .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
      .slice(0, 2)
      .forEach(project => {
        if (project.startDate) {
          activities.push({
            id: `project-${project.id}`,
            title: `${project.status === 'Completed' ? 'Completed' : 'Started'}: ${project.projectName}`,
            time: timeAgo(project.startDate),
            timestamp: new Date(project.startDate),
            icon: project.status === 'Completed' ? CheckCircle : Briefcase,
            color: project.status === 'Completed' ? 'text-green-600' : 'text-blue-600',
            bgColor: project.status === 'Completed' ? 'bg-green-50' : 'bg-blue-50'
          });
        }
      });

    // Recent campaigns
    [...campaigns]
      .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
      .slice(0, 1)
      .forEach(campaign => {
        if (campaign.startDate) {
          activities.push({
            id: `campaign-${campaign.id}`,
            title: `Campaign launched: ${campaign.title}`,
            time: timeAgo(campaign.startDate),
            timestamp: new Date(campaign.startDate),
            icon: Heart,
            color: 'text-red-600',
            bgColor: 'bg-red-50'
          });
        }
      });

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [orphans, projects, campaigns]);

  // Urgent tasks and alerts
  const urgentItems = useMemo(() => {
    const items = [];
    const today = new Date();

    // Orphans needing visits
    const orphansNeedingVisit = orphans.filter(o => {
      if (o.status !== 'Active') return false;
      if (!o.lastVisitDate) return true;
      const lastVisit = new Date(o.lastVisitDate);
      const daysSinceVisit = Math.floor((today - lastVisit) / (1000 * 60 * 60 * 24));
      return daysSinceVisit > 30;
    });

    if (orphansNeedingVisit.length > 0) {
      items.push({
        id: 'orphan-visits',
        title: `${orphansNeedingVisit.length} orphan${orphansNeedingVisit.length > 1 ? 's' : ''} need visit`,
        description: 'Overdue or never visited',
        priority: 'high',
        icon: AlertTriangle,
        link: '/orphans'
      });
    }

    // Projects with upcoming deadlines
    const upcomingDeadlines = projects.filter(p => {
      if (p.status === 'Completed' || p.status === 'On Hold') return false;
      if (!p.endDate) return false;
      const endDate = new Date(p.endDate);
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 7;
    });

    if (upcomingDeadlines.length > 0) {
      items.push({
        id: 'project-deadlines',
        title: `${upcomingDeadlines.length} project${upcomingDeadlines.length > 1 ? 's' : ''} due soon`,
        description: 'Within next 7 days',
        priority: 'high',
        icon: Clock,
        link: '/projects'
      });
    }

    // Pending proposals
    if (pendingProposals > 0) {
      items.push({
        id: 'pending-proposals',
        title: `${pendingProposals} pending proposal${pendingProposals > 1 ? 's' : ''}`,
        description: 'Needs review',
        priority: 'medium',
        icon: FileText,
        link: '/proposals'
      });
    }

    // Campaign ending soon
    const campaignsEndingSoon = campaigns.filter(c => {
      if (c.status !== 'Active') return false;
      if (!c.endDate) return false;
      const endDate = new Date(c.endDate);
      const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 7;
    });

    if (campaignsEndingSoon.length > 0) {
      items.push({
        id: 'campaigns-ending',
        title: `${campaignsEndingSoon.length} campaign${campaignsEndingSoon.length > 1 ? 's' : ''} ending soon`,
        description: 'Within next 7 days',
        priority: 'medium',
        icon: Heart,
        link: '/campaigns'
      });
    }

    return items;
  }, [orphans, projects, pendingProposals, campaigns]);

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 animate-pulse" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Welcome Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">
                    Welcome back, {currentUser?.fullName?.split(' ')[0] || 'User'}!
                  </h1>
                  <p className="text-blue-100 flex items-center gap-2">
                    <Calendar size={16} />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-lg text-blue-50 max-w-2xl leading-relaxed">
                Empowering communities through humanitarian action. Monitor your organization's impact and manage operations efficiently.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/orphans"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-4 rounded-xl transition-all flex flex-col items-center gap-2 border border-white/30"
              >
                <Baby size={24} />
                <span className="text-sm font-semibold">Orphans</span>
              </Link>
              <Link
                to="/projects"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-4 rounded-xl transition-all flex flex-col items-center gap-2 border border-white/30"
              >
                <Briefcase size={24} />
                <span className="text-sm font-semibold">Projects</span>
              </Link>
              <Link
                to="/campaigns"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-4 rounded-xl transition-all flex flex-col items-center gap-2 border border-white/30"
              >
                <Heart size={24} />
                <span className="text-sm font-semibold">Campaigns</span>
              </Link>
              <Link
                to="/finance"
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 p-4 rounded-xl transition-all flex flex-col items-center gap-2 border border-white/30"
              >
                <Wallet size={24} />
                <span className="text-sm font-semibold">Finance</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Summary Bar */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="text-yellow-500" size={20} />
          <h3 className="text-sm font-bold text-gray-900">Today's Pulse</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Today's Donations</p>
              <p className="text-lg font-bold text-gray-900">${(todaysDonations / 1000).toFixed(1)}K</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Baby className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">New This Week</p>
              <p className="text-lg font-bold text-gray-900">{weeklyNewOrphans} orphans</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${upcomingDeadlines > 0 ? 'bg-orange-100' : 'bg-gray-100'}`}>
              <Clock className={upcomingDeadlines > 0 ? 'text-orange-600' : 'text-gray-400'} size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Due Next 7 Days</p>
              <p className="text-lg font-bold text-gray-900">{upcomingDeadlines} {upcomingDeadlines === 1 ? 'project' : 'projects'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Flame className="text-purple-600" size={18} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Monthly Burn Rate</p>
              <p className="text-lg font-bold text-gray-900">LKR {(monthlyExpenses / 1000).toFixed(0)}K</p>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Orphans Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Baby className="text-white" size={28} />
            </div>
            <Link to="/orphans" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="text-gray-400" size={20} />
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Orphans</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{activeOrphans}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">of {orphans.length} total</span>
              <div className="flex items-center gap-1 text-green-600">
                <TrendingUp size={14} />
                <span className="font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Projects Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Briefcase className="text-white" size={28} />
            </div>
            <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="text-gray-400" size={20} />
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Projects</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{activeProjects}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">of {projects.length} total</span>
              <div className="flex items-center gap-1 text-blue-600">
                <TrendingUp size={14} />
                <span className="font-semibold">In Progress</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Heart className="text-white" size={28} />
            </div>
            <Link to="/campaigns" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="text-gray-400" size={20} />
            </Link>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Active Campaigns</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{activeCampaigns}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{campaignProgress.toFixed(0)}% funded</span>
              <div className="flex items-center gap-1 text-green-600">
                <DollarSign size={14} />
                <span className="font-semibold">${(totalCampaignRaised / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Beneficiaries Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all group">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
              <Users className="text-white" size={28} />
            </div>
            <div className="p-2">
              <Globe className="text-gray-400" size={20} />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-1">Total Beneficiaries</p>
            <p className="text-4xl font-bold text-gray-900 mb-2">{totalBeneficiaries.toLocaleString()}</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">{new Set(orphans.map(o => o.district)).size} districts</span>
              <div className="flex items-center gap-1 text-purple-600">
                <MapPin size={14} />
                <span className="font-semibold">Sri Lanka</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500 rounded-lg shadow-md">
              <UserCheck className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activeStaff}</p>
              <p className="text-xs font-semibold text-gray-600">Active Staff</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500 rounded-lg shadow-md">
              <Handshake className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activePartners}</p>
              <p className="text-xs font-semibold text-gray-600">Active Partners</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500 rounded-lg shadow-md">
              <FileText className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
              <p className="text-xs font-semibold text-gray-600">Total Proposals</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-500 rounded-lg shadow-md">
              <DollarSign className="text-white" size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{(totalBudget / 1000000).toFixed(1)}M</p>
              <p className="text-xs font-semibold text-gray-600">Total Budget (LKR)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Timeline Chart */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={22} />
                Project Timeline
              </h3>
              <p className="text-sm text-gray-500 mt-1">Monthly project starts and budgets</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={projectTimelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value, name) => {
                  if (name === 'budget') return [`LKR ${value.toFixed(1)}M`, 'Budget'];
                  return [value, 'Projects'];
                }}
              />
              <Legend />
              <Bar dataKey="projects" fill="#3b82f6" name="Projects" radius={[8, 8, 0, 0]} />
              <Bar dataKey="budget" fill="#8b5cf6" name="Budget (M)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Budget by Programme */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-purple-600" size={22} />
                Budget by Programme
              </h3>
              <p className="text-sm text-gray-500 mt-1">Resource allocation across programmes</p>
            </div>
          </div>
          {budgetByProgrammeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={budgetByProgrammeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetByProgrammeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value) => `LKR ${value.toFixed(1)}M`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Package size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">No programme data available</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Progress Chart */}
      {campaignProgressData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Heart className="text-red-600" size={22} />
                Campaign Fundraising Progress
              </h3>
              <p className="text-sm text-gray-500 mt-1">Top performing active campaigns</p>
            </div>
            <Link to="/campaigns" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={campaignProgressData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                formatter={(value, name) => {
                  if (name === 'raised') return [`$${value.toFixed(0)}K`, 'Raised'];
                  if (name === 'target') return [`$${value.toFixed(0)}K`, 'Target'];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="raised" fill="#10b981" name="Raised ($K)" radius={[0, 8, 8, 0]} />
              <Bar dataKey="target" fill="#e5e7eb" name="Target ($K)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Finance Overview Section */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-green-500 rounded-xl shadow-lg">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Financial Overview</h3>
            <p className="text-sm text-gray-600">Real-time financial metrics and cash flow</p>
          </div>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-green-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              LKR {(financeStats.totalExpenses / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Paid: LKR {(financeStats.paidExpenses / 1000).toFixed(0)}K
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-orange-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="text-orange-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Pending Expenses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              LKR {(financeStats.pendingExpenses / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-orange-600 mt-1 font-semibold">
              Requires action
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="text-blue-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Budget Utilization</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {financeStats.budgetUtilization}%
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(financeStats.totalSpent / 1000000).toFixed(1)}M / {(financeStats.totalBudget / 1000000).toFixed(1)}M LKR
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-purple-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Payroll Processed</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              LKR {(financeStats.processedPayroll / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-gray-500 mt-1">
              of {(financeStats.totalPayroll / 1000).toFixed(0)}K total
            </p>
          </div>
        </div>

        {/* Finance Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Expense Trend */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="mb-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Monthly Expense Trend
              </h4>
              <p className="text-xs text-gray-500 mt-1">Expenses vs Budget (2025)</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  formatter={(value) => `LKR ${value.toFixed(0)}K`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ fill: '#10b981', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke="#94a3b8"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Budget"
                  dot={{ fill: '#94a3b8', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expense by Category */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
            <div className="mb-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Package className="text-purple-600" size={20} />
                Expenses by Category
              </h4>
              <p className="text-xs text-gray-500 mt-1">Top spending categories</p>
            </div>
            {expenseCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value) => `LKR ${value.toFixed(0)}K`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Package size={40} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No expense data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Finance Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Link
            to="/finance/invoices"
            className="bg-white rounded-xl p-4 border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-blue-600" size={20} />
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">{invoices.length}</p>
            <p className="text-xs font-semibold text-gray-600">Total Invoices</p>
            <p className="text-xs text-blue-600 mt-1">
              {invoices.filter(i => i.status === 'Pending').length} pending
            </p>
          </Link>

          <Link
            to="/finance/bills"
            className="bg-white rounded-xl p-4 border-2 border-orange-200 hover:border-orange-400 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <FileText className="text-orange-600" size={20} />
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">{bills.length}</p>
            <p className="text-xs font-semibold text-gray-600">Total Bills</p>
            <p className="text-xs text-orange-600 mt-1">
              {bills.filter(b => b.status === 'Unpaid').length} unpaid
            </p>
          </Link>

          <Link
            to="/finance/purchase-orders"
            className="bg-white rounded-xl p-4 border-2 border-purple-200 hover:border-purple-400 transition-all shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-2">
              <Package className="text-purple-600" size={20} />
              <ChevronRight className="text-gray-400" size={18} />
            </div>
            <p className="text-xl font-bold text-gray-900">{purchaseOrders.length}</p>
            <p className="text-xs font-semibold text-gray-600">Purchase Orders</p>
            <p className="text-xs text-purple-600 mt-1">
              {financeStats.pendingPOs} pending approval
            </p>
          </Link>
        </div>
      </div>

      {/* Donor Engagement Section */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 rounded-xl shadow-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Donor Engagement</h3>
              <p className="text-sm text-gray-600">Donor relationships and contribution metrics</p>
            </div>
          </div>
          <Link to="/orphans" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            View donors <ChevronRight size={16} />
          </Link>
        </div>

        {/* Donor KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-md border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <Users className="text-indigo-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Total Donors</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalDonors}</p>
            <p className="text-xs text-gray-500 mt-1">Active supporters</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-green-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="text-green-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Sponsorships</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">{orphansWithDonors.length}</p>
            <p className="text-xs text-gray-500 mt-1">Orphans sponsored</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Target className="text-blue-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Coverage Rate</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {orphans.length > 0 ? ((orphansWithDonors.length / orphans.length) * 100).toFixed(0) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-1">Orphans with donors</p>
          </div>

          <div className="bg-white rounded-xl p-4 shadow-md border border-purple-100">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="text-purple-600" size={18} />
              <p className="text-xs font-semibold text-gray-500">Campaign Total</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">${(totalCampaignRaised / 1000).toFixed(0)}K</p>
            <p className="text-xs text-gray-500 mt-1">Raised via campaigns</p>
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Heart className="text-red-600" size={20} />
              Recent Campaign Activity
            </h4>
            <span className="text-xs text-gray-500">{recentDonations.length} recent updates</span>
          </div>

          {recentDonations.length > 0 ? (
            <div className="space-y-3">
              {recentDonations.map((donation, index) => {
                const updateDate = new Date(donation.date);
                const daysAgo = Math.floor((new Date() - updateDate) / (1000 * 60 * 60 * 24));
                const timeString = daysAgo === 0 ? 'Today' : daysAgo === 1 ? 'Yesterday' : `${daysAgo}d ago`;

                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 bg-indigo-500 rounded-lg flex-shrink-0">
                        <Heart className="text-white" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{donation.campaign}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Clock size={10} className="text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500">{timeString}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <p className="text-sm font-bold text-indigo-600">${(donation.amount / 1000).toFixed(1)}K</p>
                      <p className="text-xs text-gray-500">raised</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Heart size={40} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent campaign activity</p>
            </div>
          )}
        </div>

        {/* Donor Retention Insight */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white rounded-xl p-4 border-2 border-green-200 hover:border-green-400 transition-all shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalDonors}</p>
                <p className="text-xs font-semibold text-gray-600">Active Donor Base</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Current active donors supporting orphan sponsorships and campaigns
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border-2 border-blue-200 hover:border-blue-400 transition-all shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="text-blue-600" size={24} />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {orphans.length > 0 ? ((orphansWithDonors.length / orphans.length) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs font-semibold text-gray-600">Sponsorship Coverage</p>
              </div>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {orphansWithDonors.length} of {orphans.length} orphans have active sponsors
            </p>
          </div>
        </div>
      </div>

      {/* Activity Feed & Urgent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="text-blue-600" size={22} />
              Recent Activity
            </h3>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight size={16} />
            </button>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className={`flex items-start gap-3 p-3 ${activity.bgColor} rounded-xl hover:shadow-md transition-all`}
                >
                  <div className={`p-2 bg-white rounded-lg shadow-sm`}>
                    <activity.icon size={18} className={activity.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 leading-snug">{activity.title}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock size={12} className="text-gray-400" />
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Activity size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Urgent Items */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Bell className="text-orange-600" size={22} />
              Urgent Items
            </h3>
            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
              {urgentItems.length} items
            </span>
          </div>
          <div className="space-y-3">
            {urgentItems.length > 0 ? (
              urgentItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.link}
                  className={`flex items-start gap-3 p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                    item.priority === 'high'
                      ? 'bg-red-50 border-red-200 hover:border-red-300'
                      : 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg shadow-sm ${
                    item.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    <item.icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
                </Link>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <CheckCircle size={48} className="mx-auto mb-3 opacity-50 text-green-400" />
                <p className="text-sm font-semibold text-green-600">All caught up!</p>
                <p className="text-xs text-gray-500 mt-1">No urgent items at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Impact Summary Banner */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">Making a Difference</h3>
              <p className="text-blue-100">Your organization's impact summary</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <p className="text-3xl font-bold">{orphans.length}</p>
              <p className="text-xs text-blue-100 mt-1 font-semibold">Total Orphans</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <p className="text-3xl font-bold">{totalBeneficiaries.toLocaleString()}</p>
              <p className="text-xs text-blue-100 mt-1 font-semibold">Beneficiaries</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <p className="text-3xl font-bold">{projects.length}</p>
              <p className="text-xs text-blue-100 mt-1 font-semibold">Projects</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 text-center border border-white/30">
              <p className="text-3xl font-bold">{activePartners}</p>
              <p className="text-xs text-blue-100 mt-1 font-semibold">Partners</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
