import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext(null);

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);

  const [selectedProject, setSelectedProject] = useState(null);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gersl_projects');
    if (stored) {
      try {
        setProjects(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_projects', JSON.stringify(projects));
  }, [projects]);

  // CRUD Operations
  const addProject = (projectData) => {
    const newProject = {
      ...projectData,
      id: Math.max(...projects.map(p => p.id), 0) + 1,
      progress: 0,
      spent: 0,
      beneficiaries: 0,
      tasks: [],
      status: "Planning",
      // MEAL Data
      resultsFramework: projectData.resultsFramework || [],
      beneficiaryBreakdown: projectData.beneficiaryBreakdown || {
        directMale: 0,
        directFemale: 0,
        directChildren: 0,
        directPWD: 0,
        indirectTotal: 0
      },
      theoryOfChange: projectData.theoryOfChange || {
        inputs: [],
        activities: [],
        outputs: [],
        outcomes: [],
        impact: '',
        assumptions: [],
        risks: []
      },
      cfmLog: [],
      fieldMonitoring: [],
      learningLog: [],
      indicatorProgress: []
    };
    setProjects([...projects, newProject]);
    return newProject;
  };

  const updateProject = (id, updates) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteProject = (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
    }
  };

  // Task Management
  const addTask = (projectId, taskData) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        const newTask = {
          ...taskData,
          id: (p.tasks?.length || 0) + 1,
          progress: 0,
          status: "Pending"
        };
        return {
          ...p,
          tasks: [...(p.tasks || []), newTask]
        };
      }
      return p;
    }));
  };

  const updateTask = (projectId, taskId, updates) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
        };
      }
      return p;
    }));
  };

  const deleteTask = (projectId, taskId) => {
    setProjects(projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          tasks: p.tasks.filter(t => t.id !== taskId)
        };
      }
      return p;
    }));
  };

  // Filtering and Search
  const getProjectsByProgrammeArea = (area) => {
    if (area === "All") return projects;
    return projects.filter(p => p.programmeArea === area);
  };

  const getProjectsByStatus = (status) => {
    if (status === "All") return projects;
    return projects.filter(p => p.status === status);
  };

  const searchProjects = (query) => {
    const q = query.toLowerCase();
    return projects.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.programmeArea.toLowerCase().includes(q) ||
      p.donor?.toLowerCase().includes(q) ||
      p.location?.toLowerCase().includes(q)
    );
  };

  // Stats
  const getStats = () => {
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
    const totalSpent = projects.reduce((sum, p) => sum + (p.spent || 0), 0);
    const totalBeneficiaries = projects.reduce((sum, p) => sum + (p.beneficiaries || 0), 0);

    // Count projects by status
    const statusCounts = projects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});

    return {
      total: projects.length,
      active: projects.filter(p => p.status === "Implementation").length,
      planning: projects.filter(p => p.status === "Planning").length,
      closing: projects.filter(p => p.status === "Closing").length,
      completed: projects.filter(p => p.status === "Completed").length,
      onHold: projects.filter(p => p.status === "On Hold").length,
      statusCounts, // Full status breakdown
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
      totalBeneficiaries,
      avgProgress: Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length)
    };
  };

  // Programme Areas
  const getProgrammeAreas = () => {
    const areas = [...new Set(projects.map(p => p.programmeArea))];
    return areas.sort();
  };

  // Calculate project progress based on tasks
  const recalculateProjectProgress = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.tasks && project.tasks.length > 0) {
      const avgProgress = Math.round(
        project.tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / project.tasks.length
      );
      updateProject(projectId, { progress: avgProgress });
    }
  };

  // MEAL Methods - CFM (Community Feedback Mechanism)
  const addCFMFeedback = (projectId, feedback) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newFeedback = {
        id: `CFM-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...feedback,
        status: feedback.feedbackType === 'Positive' ? 'Acknowledged' : 'Open'
      };
      updateProject(projectId, {
        cfmLog: [...(project.cfmLog || []), newFeedback]
      });
      return newFeedback.id;
    }
    return null;
  };

  const resolveCFMFeedback = (projectId, feedbackId, resolution) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.cfmLog) {
      const updatedCFM = project.cfmLog.map(fb =>
        fb.id === feedbackId ? {
          ...fb,
          actionTaken: resolution.actionTaken,
          responsiblePerson: resolution.responsiblePerson,
          dateResolved: new Date().toISOString().split('T')[0],
          status: 'Resolved'
        } : fb
      );
      updateProject(projectId, { cfmLog: updatedCFM });
    }
  };

  // MEAL Methods - Field Monitoring
  const addFieldMonitoring = (projectId, monitoringData) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newMonitoring = {
        id: `FM-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        ...monitoringData
      };
      updateProject(projectId, {
        fieldMonitoring: [...(project.fieldMonitoring || []), newMonitoring]
      });
      return newMonitoring.id;
    }
    return null;
  };

  // MEAL Methods - Learning & Adaptation
  const addLearning = (projectId, learning) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const newLearning = {
        id: `LRN-${Date.now()}`,
        dateIdentified: new Date().toISOString().split('T')[0],
        ...learning,
        status: learning.status || 'Pending'
      };
      updateProject(projectId, {
        learningLog: [...(project.learningLog || []), newLearning]
      });
      return newLearning.id;
    }
    return null;
  };

  const updateLearningStatus = (projectId, learningId, status, notes) => {
    const project = projects.find(p => p.id === projectId);
    if (project && project.learningLog) {
      const updatedLearning = project.learningLog.map(lrn =>
        lrn.id === learningId ? {
          ...lrn,
          status,
          implementationNotes: notes,
          dateCompleted: status === 'Implemented' ? new Date().toISOString().split('T')[0] : null
        } : lrn
      );
      updateProject(projectId, { learningLog: updatedLearning });
    }
  };

  // MEAL Methods - Indicator Tracking
  const updateIndicatorProgress = (projectId, indicatorId, progressData) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      const existingProgress = project.indicatorProgress || [];
      const existingIndex = existingProgress.findIndex(ind => ind.indicatorId === indicatorId);

      if (existingIndex >= 0) {
        const updated = [...existingProgress];
        updated[existingIndex] = { ...updated[existingIndex], ...progressData };
        updateProject(projectId, { indicatorProgress: updated });
      } else {
        updateProject(projectId, {
          indicatorProgress: [...existingProgress, { indicatorId, ...progressData }]
        });
      }
    }
  };

  const value = {
    projects,
    selectedProject,
    setSelectedProject,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    deleteTask,
    getProjectsByProgrammeArea,
    getProjectsByStatus,
    searchProjects,
    getStats,
    getProgrammeAreas,
    recalculateProjectProgress,
    // MEAL Methods
    addCFMFeedback,
    resolveCFMFeedback,
    addFieldMonitoring,
    addLearning,
    updateLearningStatus,
    updateIndicatorProgress
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
