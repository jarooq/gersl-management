import React, { useState, useMemo } from 'react';
import { Plus, BarChart3, PieChart, LineChart, TrendingUp, TrendingDown,
  MapPin, Target, Clock, CheckCircle, AlertCircle, Calendar, Zap } from 'lucide-react';
import { useProjects } from '../../contexts/ProjectContext';
import ProjectCard from './components/ProjectCard';
import ProjectDetails from './components/ProjectDetails';
import ProjectFilters from './components/ProjectFilters';
import ProjectStats from './components/ProjectStats';
import AddProjectForm from './components/AddProjectForm';
import EditProjectForm from './components/EditProjectForm';
import ProjectCompletionReport from './components/ProjectCompletionReport';

const ProjectsPage = () => {
  const {
    projects,
    addProject,
    updateProject,
    deleteProject,
    updateTask,
    addTask,
    deleteTask,
    searchProjects,
    getStats,
    getProgrammeAreas
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProgrammeArea, setFilterProgrammeArea] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedProject, setSelectedProject] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState(null);
  const [showCompletionReport, setShowCompletionReport] = useState(false);
  const [reportProject, setReportProject] = useState(null);

  const stats = getStats();
  const programmeAreas = getProgrammeAreas();

  // Filter projects based on search and filters
  const filteredProjects = useMemo(() => {
    let result = projects;

    // Apply search
    if (searchQuery) {
      result = searchProjects(searchQuery);
    }

    // Apply programme area filter
    if (filterProgrammeArea !== 'All') {
      result = result.filter(p => p.programmeArea === filterProgrammeArea);
    }

    // Apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(p => p.status === filterStatus);
    }

    return result;
  }, [projects, searchQuery, filterProgrammeArea, filterStatus, searchProjects]);

  const handleViewProject = (project) => {
    setSelectedProject(project);
  };

  const handleAddProject = (projectData) => {
    addProject(projectData);
  };

  const handleEditProject = (project) => {
    setProjectToEdit(project);
    setShowEditForm(true);
  };

  const handleUpdateProject = (id, updates) => {
    updateProject(id, updates);
  };

  const handleDeleteProject = (id) => {
    deleteProject(id);
  };

  const handleUpdateTask = (projectId, taskId, updates) => {
    updateTask(projectId, taskId, updates);
    // Refresh selected project if viewing details
    if (selectedProject?.id === projectId) {
      const updated = projects.find(p => p.id === projectId);
      setSelectedProject(updated);
    }
  };

  const handleGenerateReport = (project) => {
    setReportProject(project);
    setShowCompletionReport(true);
    setSelectedProject(null); // Close project details
  };

  const handleSaveCompletionReport = (reportData) => {
    // In a real app, this would save to backend
    console.log('Completion Report Saved:', reportData);
    alert('Completion report saved successfully! (In production, this would be saved to the database)');
    setShowCompletionReport(false);
    setReportProject(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-md flex items-center justify-center">
              <Target className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Operations · Projects</p>
              <h1 className="text-h2 font-bold leading-tight">Project Management</h1>
              <p className="text-ink-200 text-sm mt-0.5">Manage projects, tasks, and milestones across the portfolio.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card transition"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <ProjectStats stats={stats} />

      {/* Secondary Stats - Project Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(() => {
          // Calculate real on-schedule projects (endDate in future and progress on track)
          const today = new Date();
          const onScheduleProjects = projects.filter(p => {
            if (p.status !== 'Active' && p.status !== 'In Progress') return false;
            if (!p.endDate) return false;
            const endDate = new Date(p.endDate);
            const isBeforeDeadline = endDate > today;
            const progressOnTrack = p.progress >= 50; // Simple heuristic
            return isBeforeDeadline && progressOnTrack;
          }).length;

          // Calculate at-risk projects (near deadline or low progress)
          const atRiskProjects = projects.filter(p => {
            if (p.status !== 'Active' && p.status !== 'In Progress') return false;
            if (!p.endDate) return false;
            const endDate = new Date(p.endDate);
            const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            const isNearDeadline = daysUntilEnd > 0 && daysUntilEnd <= 30;
            const lowProgress = p.progress < 50;
            return isNearDeadline || lowProgress;
          }).length;

          // Calculate completed this year
          const currentYear = new Date().getFullYear();
          const completedThisYear = projects.filter(p => {
            if (p.status !== 'Completed') return false;
            if (!p.endDate) return false;
            const endDate = new Date(p.endDate);
            return endDate.getFullYear() === currentYear;
          }).length;

          // Calculate completed this month
          const currentMonth = new Date().getMonth();
          const completedThisMonth = projects.filter(p => {
            if (p.status !== 'Completed') return false;
            if (!p.endDate) return false;
            const endDate = new Date(p.endDate);
            return endDate.getFullYear() === currentYear && endDate.getMonth() === currentMonth;
          }).length;

          // Calculate active locations from project locations
          const activeLocations = new Set(
            projects
              .filter(p => p.status === 'Active' || p.status === 'In Progress')
              .map(p => p.location)
              .filter(loc => loc && loc !== '')
          ).size;

          // Count provinces (assuming location format includes province)
          const provinces = new Set(
            projects
              .filter(p => p.status === 'Active' || p.status === 'In Progress')
              .map(p => {
                if (!p.location) return null;
                // Try to extract province from location string
                const parts = p.location.split(',');
                return parts.length > 1 ? parts[parts.length - 1].trim() : p.location;
              })
              .filter(loc => loc && loc !== '')
          ).size;

          const onTimeRate = stats.active > 0 ? Math.round((onScheduleProjects / stats.active) * 100) : 0;

          return [
            { title: 'On Schedule',         value: onScheduleProjects, icon: Clock,        tone: 'green',  change: `${onTimeRate}% on time`,    subtitle: 'projects tracking' },
            { title: 'At Risk',             value: atRiskProjects,     icon: AlertCircle,  tone: 'amber',  change: 'Need attention',             subtitle: 'delayed projects' },
            { title: 'Completed This Year', value: completedThisYear,  icon: CheckCircle,  tone: 'blue',   change: `+${completedThisMonth} this month`, subtitle: 'successfully closed' },
            { title: 'Active Locations',    value: activeLocations,    icon: MapPin,       tone: 'indigo', change: `${provinces} ${provinces === 1 ? 'province' : 'provinces'}`, subtitle: 'field presence' }
          ];
        })().map((stat, index) => {
          const StatIcon = stat.icon;
          const tone = {
            green:  { bg: 'bg-success-50', border: 'border-success-200', text: 'text-success-700' },
            amber:  { bg: 'bg-mission-50', border: 'border-mission-200', text: 'text-mission-700' },
            blue:   { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700' },
            indigo: { bg: 'bg-indigo-50',  border: 'border-indigo-200',  text: 'text-indigo-700' },
          }[stat.tone];
          return (
            <div key={index} className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-ink-600 mb-2">{stat.title}</p>
                  <h3 className="text-h1 text-ink-900">{stat.value}</h3>
                  <p className="text-xs text-ink-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`${tone.bg} ${tone.border} border p-2.5 rounded-md flex-shrink-0`}>
                  <StatIcon className={tone.text} size={18} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <span className="text-xs font-medium text-ink-600">{stat.change}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <BarChart3 className="text-green-600" size={18} />
                Budget Distribution by Programme
              </h3>
              <p className="text-xs text-ink-600 mt-1">Allocated funds across programmes</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-ink-900">{stats.totalBudget.toLocaleString()}</div>
              <div className="text-xs text-green-600">Total Budget</div>
            </div>
          </div>
          <div className="space-y-3">
            {(() => {
              // Compute budget distribution from the live `projects` array.
              // Group by programmeArea, sum budget, sort desc, take top 6.
              const byProgramme = {};
              for (const p of projects) {
                const key = p.programmeArea || p.programme || 'Other';
                byProgramme[key] = (byProgramme[key] || 0) + Number(p.budget || 0);
              }
              const totalBudget = Object.values(byProgramme).reduce((s, v) => s + v, 0);
              const items = Object.entries(byProgramme)
                .map(([programme, budget]) => ({
                  programme,
                  budget,
                  percent: totalBudget > 0 ? Math.round((budget / totalBudget) * 100) : 0,
                }))
                .sort((a, b) => b.budget - a.budget)
                .slice(0, 6);
              if (items.length === 0) {
                return <p className="text-xs text-ink-500 text-center py-4">No project budgets to chart.</p>;
              }
              return items.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-ink-700">{item.programme}</span>
                    <span className="text-xs font-bold text-ink-900">LKR {(item.budget / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-1.5 rounded-full bg-navy-900 transition-all duration-500"
                      style={{ width: `${item.percent}%` }}></div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Project Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <PieChart className="text-blue-600" size={18} />
                Project Status Distribution
              </h3>
              <p className="text-xs text-ink-600 mt-1">Current project stages</p>
            </div>
          </div>
          <div className="space-y-4">
            {[
              { status: 'Active', count: stats.active, percent: stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0, color: 'bg-green-500' },
              { status: 'Planning', count: stats.planning, percent: stats.total > 0 ? Math.round((stats.planning / stats.total) * 100) : 0, color: 'bg-blue-500' },
              { status: 'On Hold', count: stats.onHold || 0, percent: stats.total > 0 ? Math.round(((stats.onHold || 0) / stats.total) * 100) : 0, color: 'bg-yellow-500' },
              { status: 'Completed', count: stats.completed || 0, percent: stats.total > 0 ? Math.round(((stats.completed || 0) / stats.total) * 100) : 0, color: 'bg-ink-500' },
              { status: 'Closing', count: stats.closing, percent: stats.total > 0 ? Math.round((stats.closing / stats.total) * 100) : 0, color: 'bg-purple-500' }
            ].filter(item => item.count > 0).map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-ink-700">{item.status}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-ink-900">{item.count} projects</span>
                  <span className="text-xs text-ink-600 bg-white px-2 py-1 rounded">{item.percent}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <LineChart className="text-purple-600" size={18} />
                Project Completion Trend
              </h3>
              <p className="text-xs text-ink-600 mt-1">Last 6 months</p>
            </div>
            {(() => {
              // Calculate completion rate trend
              const today = new Date();
              const sixMonthsAgo = new Date(today);
              sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

              const recentCompletions = projects.filter(p => {
                if (p.status !== 'Completed' || !p.endDate) return false;
                const endDate = new Date(p.endDate);
                return endDate >= sixMonthsAgo;
              }).length;

              const totalActive = projects.filter(p =>
                p.status === 'Active' || p.status === 'In Progress'
              ).length;

              const completionRate = (totalActive + recentCompletions) > 0
                ? Math.round((recentCompletions / (totalActive + recentCompletions)) * 100)
                : 0;

              return (
                <div className="text-right">
                  <div className={`text-xl font-bold flex items-center gap-1 ${
                    completionRate > 0 ? 'text-green-600' : 'text-ink-400'
                  }`}>
                    {completionRate > 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                    {completionRate}%
                  </div>
                  <div className="text-xs text-ink-600">Completion rate</div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-2">
            {(() => {
              // Generate last 6 months data from real projects
              const monthsData = [];
              const today = new Date();

              for (let i = 5; i >= 0; i--) {
                const targetDate = new Date(today);
                targetDate.setMonth(targetDate.getMonth() - i);
                const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

                // Count projects completed in this month
                const completed = projects.filter(p => {
                  if (p.status !== 'Completed' || !p.endDate) return false;
                  const endDate = new Date(p.endDate);
                  return endDate.getMonth() === targetDate.getMonth() &&
                         endDate.getFullYear() === targetDate.getFullYear();
                }).length;

                // Count projects started in this month
                const started = projects.filter(p => {
                  if (!p.startDate) return false;
                  const startDate = new Date(p.startDate);
                  return startDate.getMonth() === targetDate.getMonth() &&
                         startDate.getFullYear() === targetDate.getFullYear();
                }).length;

                monthsData.push({ month: monthName, completed, started });
              }

              if (monthsData.every(m => m.completed === 0 && m.started === 0)) {
                return (
                  <div className="text-center py-8 text-ink-500 text-sm">
                    No project activity in the last 6 months
                  </div>
                );
              }

              const maxValue = Math.max(...monthsData.map(m => Math.max(m.completed, m.started)), 1);

              return monthsData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-ink-600 w-20">{item.month}</span>
                  <div className="flex-1 flex gap-1">
                    <div className="bg-green-500 h-8 rounded transition-all duration-300"
                      style={{ width: `${(item.completed / maxValue) * 100}%` }}
                      title={`${item.completed} completed`}></div>
                    <div className="bg-blue-200 h-8 rounded transition-all duration-300"
                      style={{ width: `${(item.started / maxValue) * 100}%` }}
                      title={`${item.started} started`}></div>
                  </div>
                  <span className="text-xs text-ink-500 w-16 text-right">{item.completed} done</span>
                </div>
              ));
            })()}
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-ink-100">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-xs text-ink-600">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span className="text-xs text-ink-600">Started</span>
            </div>
          </div>
        </div>

        {/* Project Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-ink-100 p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-ink-900 flex items-center gap-2">
                <Zap className="text-yellow-600" size={18} />
                Performance Metrics
              </h3>
              <p className="text-xs text-ink-600 mt-1">Key performance indicators</p>
            </div>
            {(() => {
              if (projects.length === 0) return null;

              // Calculate overall success rate
              const today = new Date();

              // On-time delivery
              const completedProjects = projects.filter(p => p.status === 'Completed');
              const onTimeProjects = completedProjects.filter(p => {
                if (!p.endDate) return false;
                const endDate = new Date(p.endDate);
                return endDate <= today;
              }).length;
              const onTimeRate = completedProjects.length > 0
                ? Math.round((onTimeProjects / completedProjects.length) * 100)
                : 0;

              // Budget compliance
              const projectsWithBudget = projects.filter(p => p.budget > 0);
              const withinBudget = projectsWithBudget.filter(p =>
                (p.spent || 0) <= p.budget
              ).length;
              const budgetCompliance = projectsWithBudget.length > 0
                ? Math.round((withinBudget / projectsWithBudget.length) * 100)
                : 0;

              // Average progress for active projects
              const activeProjects = projects.filter(p =>
                p.status === 'Active' || p.status === 'In Progress'
              );
              const avgProgress = activeProjects.length > 0
                ? Math.round(activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length)
                : 0;

              // Overall success rate (average of all metrics)
              const successRate = Math.round((onTimeRate + budgetCompliance + avgProgress) / 3);

              return (
                <div className="text-right">
                  <div className={`text-xl font-bold ${
                    successRate >= 75 ? 'text-green-600' :
                    successRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {successRate}%
                  </div>
                  <div className="text-xs text-ink-600">Success Rate</div>
                </div>
              );
            })()}
          </div>
          <div className="space-y-4">
            {(() => {
              if (projects.length === 0) {
                return (
                  <div className="text-center py-8 text-ink-500 text-sm">
                    No performance data available
                  </div>
                );
              }

              const today = new Date();

              // On-Time Delivery - completed projects that met their deadline
              const completedProjects = projects.filter(p => p.status === 'Completed');
              const onTimeProjects = completedProjects.filter(p => {
                if (!p.endDate) return false;
                const endDate = new Date(p.endDate);
                return endDate <= today;
              }).length;
              const onTimeDelivery = completedProjects.length > 0
                ? Math.round((onTimeProjects / completedProjects.length) * 100)
                : 0;

              // Budget Compliance - projects within budget
              const projectsWithBudget = projects.filter(p => p.budget > 0);
              const withinBudget = projectsWithBudget.filter(p =>
                (p.spent || 0) <= p.budget
              ).length;
              const budgetCompliance = projectsWithBudget.length > 0
                ? Math.round((withinBudget / projectsWithBudget.length) * 100)
                : 0;

              // Project Progress - average progress of active projects
              const activeProjects = projects.filter(p =>
                p.status === 'Active' || p.status === 'In Progress'
              );
              const avgProgress = activeProjects.length > 0
                ? Math.round(activeProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / activeProjects.length)
                : 0;

              // Completion Rate - percentage of total projects completed
              const completionRate = projects.length > 0
                ? Math.round((completedProjects.length / projects.length) * 100)
                : 0;

              return [
                { metric: 'On-Time Delivery', value: onTimeDelivery, target: 80, status: onTimeDelivery >= 80 ? 'above' : 'below' },
                { metric: 'Budget Compliance', value: budgetCompliance, target: 90, status: budgetCompliance >= 90 ? 'above' : 'below' },
                { metric: 'Average Progress', value: avgProgress, target: 75, status: avgProgress >= 75 ? 'above' : 'below' },
                { metric: 'Completion Rate', value: completionRate, target: 60, status: completionRate >= 60 ? 'above' : 'below' }
              ].map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink-700">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink-900">{item.value}%</span>
                    {item.status === 'above' && (
                      <TrendingUp className="text-green-600" size={14} />
                    )}
                  </div>
                </div>
                <div className="w-full bg-ink-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      item.value >= item.target
                        ? 'bg-navy-900'
                        : 'bg-navy-900'
                    }`}
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-ink-500">Target: {item.target}%</span>
                  <span className={`text-xs font-medium ${
                    item.value >= item.target ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {item.value - item.target > 0 ? `+${item.value - item.target}%` : `${item.value - item.target}%`}
                  </span>
                </div>
              </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <ProjectFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterProgrammeArea={filterProgrammeArea}
        setFilterProgrammeArea={setFilterProgrammeArea}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        viewMode={viewMode}
        setViewMode={setViewMode}
        programmeAreas={programmeAreas}
      />

      {/* Project List */}
      {filteredProjects.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onView={handleViewProject}
              onEdit={handleEditProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-ink-500 text-lg">No projects found matching your criteria</p>
          <p className="text-ink-400 text-sm mt-2">Try adjusting your filters or search query</p>
        </div>
      )}

      {/* Project Details Modal */}
      {selectedProject && (
        <ProjectDetails
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdateTask={handleUpdateTask}
          onAddTask={addTask}
          onDeleteTask={deleteTask}
          onGenerateReport={handleGenerateReport}
        />
      )}

      {/* Add Project Form */}
      <AddProjectForm
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        onSubmit={handleAddProject}
      />

      {/* Edit Project Form */}
      <EditProjectForm
        isOpen={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setProjectToEdit(null);
        }}
        project={projectToEdit}
        onSubmit={handleUpdateProject}
      />

      {/* Project Completion Report (Annex D) */}
      <ProjectCompletionReport
        isOpen={showCompletionReport}
        onClose={() => {
          setShowCompletionReport(false);
          setReportProject(null);
        }}
        project={reportProject}
        onSubmit={handleSaveCompletionReport}
      />
    </div>
  );
};

export default ProjectsPage;
