import React, { createContext, useContext, useState, useEffect } from 'react';
import { createProjectActivityApprovalWorkflow } from '../utils/workflowOrchestrator';

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
          status: "Pending",
          // Phase 3: Task assignment and deadline tracking
          assignees: taskData.assignees || [], // Array of { userId, userName, userRole }
          deadline: taskData.deadline || null,
          startDate: taskData.startDate || new Date().toISOString().split('T')[0],
          priority: taskData.priority || 'Medium', // Low, Medium, High, Critical
          dependencies: taskData.dependencies || [], // Array of task IDs this task depends on
          estimatedHours: taskData.estimatedHours || null,
          actualHours: taskData.actualHours || null,
          notifyOnDelay: taskData.notifyOnDelay !== false, // Default true
          delayNotificationSent: false,
          completedDate: null
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

  // ============================================
  // PHASE 2: Workflow Integration Methods
  // ============================================

  /**
   * Submit a project activity/task for approval
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task requiring approval
   * @param {Object} currentUser - Current user submitting the task
   * @returns {Object} Approval workflow data
   */
  const submitTaskForApproval = (projectId, taskId, currentUser) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    try {
      // Update task status to 'Pending Approval'
      updateTask(projectId, taskId, {
        status: 'Pending Approval',
        submittedForApproval: new Date().toISOString().split('T')[0],
        submittedBy: currentUser.fullName || currentUser.username
      });

      // Create approval workflow data
      const approvalData = createProjectActivityApprovalWorkflow(task, project, currentUser);

      return {
        success: true,
        projectId,
        taskId,
        approvalData,
        message: 'Task submitted for approval'
      };
    } catch (error) {
      console.error('Error submitting task for approval:', error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  /**
   * Submit a budget change for approval
   * @param {number} projectId - ID of the project
   * @param {Object} budgetChange - Budget change details
   * @param {Object} currentUser - Current user requesting the change
   * @returns {Object} Approval workflow data
   */
  const submitBudgetChangeForApproval = (projectId, budgetChange, currentUser) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    try {
      // Track the budget change request
      const budgetChangeRecord = {
        id: Date.now(),
        projectId,
        requestedBy: currentUser.fullName || currentUser.username,
        requestedDate: new Date().toISOString().split('T')[0],
        currentBudget: project.budget,
        requestedBudget: budgetChange.newBudget,
        difference: budgetChange.newBudget - project.budget,
        reason: budgetChange.reason,
        status: 'Pending Approval'
      };

      // Store the budget change request (you might want to add a budgetChanges array to project)
      updateProject(projectId, {
        budgetChangeRequests: [...(project.budgetChangeRequests || []), budgetChangeRecord]
      });

      // Create approval workflow (use FINANCE_EXPENSE type for budget changes)
      const approvalData = {
        type: 'FINANCE_EXPENSE',
        amount: Math.abs(budgetChange.newBudget - project.budget),
        data: {
          projectId,
          projectCode: project.code,
          projectName: project.name,
          budgetChangeId: budgetChangeRecord.id,
          currentBudget: project.budget,
          requestedBudget: budgetChange.newBudget,
          difference: budgetChangeRecord.difference,
          reason: budgetChange.reason,
          initiatorId: currentUser.id,
          initiatorName: currentUser.fullName,
        }
      };

      return {
        success: true,
        projectId,
        budgetChangeId: budgetChangeRecord.id,
        approvalData,
        message: 'Budget change submitted for approval'
      };
    } catch (error) {
      console.error('Error submitting budget change for approval:', error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  /**
   * Mark project as ready for completion
   * Triggers completion documentation and approval workflow
   * @param {number} projectId - ID of the project
   * @param {Object} completionData - Completion documentation
   * @returns {Object} Result
   */
  const submitProjectForCompletion = (projectId, completionData) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    // Check if all tasks are completed
    const incompleteTasks = project.tasks?.filter(t =>
      t.status !== 'Completed' && t.status !== 'Cancelled'
    ) || [];

    if (incompleteTasks.length > 0) {
      return {
        success: false,
        message: `Cannot complete project: ${incompleteTasks.length} tasks are still incomplete`,
        incompleteTasks
      };
    }

    try {
      updateProject(projectId, {
        status: 'Closing',
        completionDate: new Date().toISOString().split('T')[0],
        completionDocumentation: completionData,
        completedBy: completionData.completedBy
      });

      return {
        success: true,
        projectId,
        message: 'Project marked for completion'
      };
    } catch (error) {
      console.error('Error submitting project for completion:', error);
      return {
        success: false,
        message: error.message
      };
    }
  };

  /**
   * Finalize project completion after all documentation and approvals
   * @param {number} projectId - ID of the project
   * @returns {Object} Result
   */
  const finalizeProjectCompletion = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    updateProject(projectId, {
      status: 'Completed',
      finalizedDate: new Date().toISOString().split('T')[0]
    });

    console.log(`✅ Project ${project.code || project.name} completed and finalized`);

    return {
      success: true,
      projectId,
      message: 'Project completed successfully'
    };
  };

  // ============================================
  // PHASE 3: Task Assignment & Deadline Management
  // ============================================

  /**
   * Assign users to a task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {Array} assignees - Array of user objects { userId, userName, userRole }
   * @returns {Object} Result
   */
  const assignTaskToUsers = (projectId, taskId, assignees) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    try {
      updateTask(projectId, taskId, {
        assignees: assignees,
        assignedDate: new Date().toISOString().split('T')[0]
      });

      console.log(`👥 Task ${taskId} assigned to ${assignees.length} user(s)`);

      return {
        success: true,
        projectId,
        taskId,
        message: `Task assigned to ${assignees.length} user(s)`
      };
    } catch (error) {
      console.error('Error assigning task:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Add an assignee to an existing task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {Object} assignee - User object { userId, userName, userRole }
   * @returns {Object} Result
   */
  const addTaskAssignee = (projectId, taskId, assignee) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    // Check if user is already assigned
    const existingAssignees = task.assignees || [];
    const alreadyAssigned = existingAssignees.some(a => a.userId === assignee.userId);

    if (alreadyAssigned) {
      return { success: false, message: 'User is already assigned to this task' };
    }

    try {
      updateTask(projectId, taskId, {
        assignees: [...existingAssignees, assignee]
      });

      return {
        success: true,
        projectId,
        taskId,
        message: `${assignee.userName} added to task`
      };
    } catch (error) {
      console.error('Error adding assignee:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Remove an assignee from a task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {number} userId - User ID to remove
   * @returns {Object} Result
   */
  const removeTaskAssignee = (projectId, taskId, userId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    const existingAssignees = task.assignees || [];
    const updatedAssignees = existingAssignees.filter(a => a.userId !== userId);

    try {
      updateTask(projectId, taskId, {
        assignees: updatedAssignees
      });

      return {
        success: true,
        projectId,
        taskId,
        message: 'Assignee removed from task'
      };
    } catch (error) {
      console.error('Error removing assignee:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Get all tasks assigned to a specific user
   * @param {number} userId - User ID
   * @returns {Array} Array of tasks with project info
   */
  const getTasksAssignedToUser = (userId) => {
    const assignedTasks = [];

    projects.forEach(project => {
      project.tasks?.forEach(task => {
        const isAssigned = task.assignees?.some(a => a.userId === userId);
        if (isAssigned) {
          assignedTasks.push({
            ...task,
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code
          });
        }
      });
    });

    return assignedTasks;
  };

  /**
   * Get overdue tasks across all projects
   * @returns {Array} Array of overdue tasks with project info
   */
  const getOverdueTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = [];

    projects.forEach(project => {
      project.tasks?.forEach(task => {
        if (task.deadline && task.deadline < today && task.status !== 'Completed' && task.status !== 'Cancelled') {
          overdueTasks.push({
            ...task,
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code,
            daysOverdue: Math.floor((new Date() - new Date(task.deadline)) / (1000 * 60 * 60 * 24))
          });
        }
      });
    });

    return overdueTasks.sort((a, b) => b.daysOverdue - a.daysOverdue);
  };

  /**
   * Get tasks approaching deadline (within specified days)
   * @param {number} daysThreshold - Number of days to look ahead (default 7)
   * @returns {Array} Array of tasks approaching deadline
   */
  const getTasksApproachingDeadline = (daysThreshold = 7) => {
    const today = new Date();
    const thresholdDate = new Date();
    thresholdDate.setDate(today.getDate() + daysThreshold);

    const todayStr = today.toISOString().split('T')[0];
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    const approachingTasks = [];

    projects.forEach(project => {
      project.tasks?.forEach(task => {
        if (
          task.deadline &&
          task.deadline >= todayStr &&
          task.deadline <= thresholdStr &&
          task.status !== 'Completed' &&
          task.status !== 'Cancelled'
        ) {
          const daysUntilDeadline = Math.floor((new Date(task.deadline) - today) / (1000 * 60 * 60 * 24));
          approachingTasks.push({
            ...task,
            projectId: project.id,
            projectName: project.name,
            projectCode: project.code,
            daysUntilDeadline
          });
        }
      });
    });

    return approachingTasks.sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);
  };

  /**
   * Mark a task as completed
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {Object} completionData - Completion information
   * @returns {Object} Result
   */
  const completeTask = (projectId, taskId, completionData = {}) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    try {
      updateTask(projectId, taskId, {
        status: 'Completed',
        progress: 100,
        completedDate: new Date().toISOString().split('T')[0],
        completedBy: completionData.completedBy || null,
        actualHours: completionData.actualHours || task.actualHours,
        completionNotes: completionData.notes || null
      });

      // Recalculate project progress
      recalculateProjectProgress(projectId);

      console.log(`✅ Task ${taskId} marked as completed`);

      return {
        success: true,
        projectId,
        taskId,
        message: 'Task marked as completed'
      };
    } catch (error) {
      console.error('Error completing task:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Get workload statistics for a user
   * @param {number} userId - User ID
   * @returns {Object} Workload statistics
   */
  const getUserWorkload = (userId) => {
    const assignedTasks = getTasksAssignedToUser(userId);

    const stats = {
      totalTasks: assignedTasks.length,
      pendingTasks: assignedTasks.filter(t => t.status === 'Pending').length,
      inProgressTasks: assignedTasks.filter(t => t.status === 'In Progress').length,
      completedTasks: assignedTasks.filter(t => t.status === 'Completed').length,
      overdueTasks: assignedTasks.filter(t => {
        const today = new Date().toISOString().split('T')[0];
        return t.deadline && t.deadline < today && t.status !== 'Completed' && t.status !== 'Cancelled';
      }).length,
      totalEstimatedHours: assignedTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0),
      totalActualHours: assignedTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0),
      tasks: assignedTasks
    };

    return stats;
  };

  // ============================================
  // Task Dependency Tracking
  // ============================================

  /**
   * Add a dependency to a task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {number} dependsOnTaskId - ID of the task this depends on
   * @returns {Object} Result
   */
  const addTaskDependency = (projectId, taskId, dependsOnTaskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    const dependencyTask = project.tasks?.find(t => t.id === dependsOnTaskId);
    if (!dependencyTask) {
      return { success: false, message: 'Dependency task not found' };
    }

    // Check for circular dependencies
    if (hasCircularDependency(projectId, taskId, dependsOnTaskId)) {
      return { success: false, message: 'Circular dependency detected' };
    }

    const existingDependencies = task.dependencies || [];
    if (existingDependencies.includes(dependsOnTaskId)) {
      return { success: false, message: 'Dependency already exists' };
    }

    try {
      updateTask(projectId, taskId, {
        dependencies: [...existingDependencies, dependsOnTaskId]
      });

      return {
        success: true,
        projectId,
        taskId,
        message: 'Dependency added successfully'
      };
    } catch (error) {
      console.error('Error adding task dependency:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Remove a dependency from a task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {number} dependsOnTaskId - ID of the dependency to remove
   * @returns {Object} Result
   */
  const removeTaskDependency = (projectId, taskId, dependsOnTaskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) {
      return { success: false, message: 'Project not found' };
    }

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task) {
      return { success: false, message: 'Task not found' };
    }

    const existingDependencies = task.dependencies || [];
    const updatedDependencies = existingDependencies.filter(id => id !== dependsOnTaskId);

    try {
      updateTask(projectId, taskId, {
        dependencies: updatedDependencies
      });

      return {
        success: true,
        projectId,
        taskId,
        message: 'Dependency removed successfully'
      };
    } catch (error) {
      console.error('Error removing task dependency:', error);
      return { success: false, message: error.message };
    }
  };

  /**
   * Check for circular dependencies
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @param {number} dependsOnTaskId - ID of the potential dependency
   * @returns {boolean} True if circular dependency would be created
   */
  const hasCircularDependency = (projectId, taskId, dependsOnTaskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return false;

    const visited = new Set();
    const stack = [dependsOnTaskId];

    while (stack.length > 0) {
      const currentId = stack.pop();

      if (currentId === taskId) {
        return true; // Circular dependency found
      }

      if (visited.has(currentId)) {
        continue;
      }

      visited.add(currentId);

      const currentTask = project.tasks?.find(t => t.id === currentId);
      if (currentTask && currentTask.dependencies) {
        stack.push(...currentTask.dependencies);
      }
    }

    return false;
  };

  /**
   * Get tasks that depend on a specific task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @returns {Array} Tasks that depend on this task
   */
  const getDependentTasks = (projectId, taskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    return project.tasks?.filter(task =>
      task.dependencies?.includes(taskId)
    ) || [];
  };

  /**
   * Get all dependencies for a task
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @returns {Array} Array of task objects this task depends on
   */
  const getTaskDependencies = (projectId, taskId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return [];

    const task = project.tasks?.find(t => t.id === taskId);
    if (!task || !task.dependencies) return [];

    return project.tasks?.filter(t =>
      task.dependencies.includes(t.id)
    ) || [];
  };

  /**
   * Check if a task can be started (all dependencies completed)
   * @param {number} projectId - ID of the project
   * @param {number} taskId - ID of the task
   * @returns {Object} Result with canStart boolean and blocking tasks
   */
  const canTaskBeStarted = (projectId, taskId) => {
    const dependencies = getTaskDependencies(projectId, taskId);

    if (dependencies.length === 0) {
      return {
        canStart: true,
        blockingTasks: [],
        message: 'No dependencies'
      };
    }

    const blockingTasks = dependencies.filter(t =>
      t.status !== 'Completed' && t.status !== 'Cancelled'
    );

    return {
      canStart: blockingTasks.length === 0,
      blockingTasks,
      message: blockingTasks.length === 0
        ? 'All dependencies completed'
        : `${blockingTasks.length} blocking task(s)`
    };
  };

  /**
   * Get critical path for project
   * @param {number} projectId - ID of the project
   * @returns {Array} Tasks in critical path
   */
  const getCriticalPath = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project || !project.tasks) return [];

    // Simple critical path: longest chain of dependencies
    const tasksWithDurations = project.tasks.filter(t => t.startDate && t.deadline);

    const calculateDuration = (task) => {
      if (!task.startDate || !task.deadline) return 0;
      const start = new Date(task.startDate);
      const end = new Date(task.deadline);
      return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    };

    const calculatePath = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return { duration: 0, path: [] };

      visited.add(taskId);

      const task = project.tasks.find(t => t.id === taskId);
      if (!task) return { duration: 0, path: [] };

      const taskDuration = calculateDuration(task);
      const dependencies = task.dependencies || [];

      if (dependencies.length === 0) {
        return { duration: taskDuration, path: [task] };
      }

      let longestPath = { duration: 0, path: [] };

      dependencies.forEach(depId => {
        const depPath = calculatePath(depId, new Set(visited));
        if (depPath.duration > longestPath.duration) {
          longestPath = depPath;
        }
      });

      return {
        duration: taskDuration + longestPath.duration,
        path: [task, ...longestPath.path]
      };
    };

    // Find the longest path from all tasks
    let criticalPath = { duration: 0, path: [] };

    tasksWithDurations.forEach(task => {
      const path = calculatePath(task.id);
      if (path.duration > criticalPath.duration) {
        criticalPath = path;
      }
    });

    return criticalPath.path;
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
    updateIndicatorProgress,
    // Workflow Methods (Phase 2)
    submitTaskForApproval,
    submitBudgetChangeForApproval,
    submitProjectForCompletion,
    finalizeProjectCompletion,
    // Task Assignment & Deadline Methods (Phase 3)
    assignTaskToUsers,
    addTaskAssignee,
    removeTaskAssignee,
    getTasksAssignedToUser,
    getOverdueTasks,
    getTasksApproachingDeadline,
    completeTask,
    getUserWorkload,
    // Task Dependency Methods (Phase 3)
    addTaskDependency,
    removeTaskDependency,
    getDependentTasks,
    getTaskDependencies,
    canTaskBeStarted,
    getCriticalPath
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};
