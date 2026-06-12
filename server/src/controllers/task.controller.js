import { Task, Project, User, TaskAssignee, TaskComment } from '../models/index.js';
import sequelize from '../config/database.js';
import { Op, Sequelize } from 'sequelize';

/**
 * Get all tasks with filtering
 * GET /api/tasks?projectId=1&assignedTo=2&status=In Progress
 */
export const getAllTasks = async (req, res) => {
  try {
    const { projectId, assignedTo, status, priority } = req.query;

    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }

    // Support filtering by assignedTo - checks both legacy assignedTo field and TaskAssignee table.
    // Note: TaskAssignee is always part of the include list below, so the $assignees.userId$ alias resolves.
    if (assignedTo) {
      where[Op.or] = [
        { assignedTo: assignedTo },
        { '$assignees.userId$': assignedTo }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const tasks = await Task.findAll({
      where,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        // Include all assignees (multi-staff)
        {
          model: TaskAssignee,
          as: 'assignees',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', ['full_name', 'fullName'], 'email', 'role', 'department']
          }]
        }
      ],
      order: [['createdAt', 'DESC']],
      distinct: true // Avoid duplicate rows when filtering by assignee
    });

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
};

/**
 * Get single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName'], 'status']
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email', 'role', 'department']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        // Include all assignees (multi-staff)
        {
          model: TaskAssignee,
          as: 'assignees',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', ['full_name', 'fullName'], 'email', 'role', 'department']
          }],
          order: [['assignedAt', 'ASC']]
        },
        // Include comments with author info
        {
          model: TaskComment,
          as: 'comments',
          include: [{
            model: User,
            as: 'author',
            attributes: ['id', ['full_name', 'fullName'], 'email']
          }],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task',
      error: error.message
    });
  }
};

/**
 * Create new task
 * POST /api/tasks
 */
export const createTask = async (req, res) => {
  try {
    const {
      projectId,
      title,
      description,
      assignedTo, // Legacy: single user ID
      assignedUsers, // New: array of user IDs for multi-staff assignment
      dueDate,
      startDate,
      priority,
      dependsOn,
      budgetAllocated,
      deliverables,
      requiresApproval,
      // Task type fields
      taskType,
      taskCategory,
      // Procurement fields
      requiresProcurement,
      // Beneficiary fields
      involvesBeneficiaries,
      beneficiaryTrackingMode,
      beneficiarySelectionMethod,
      selectionCriteria,
      targetBeneficiaries,
      // Distribution fields
      distributionType,
      distributionItems,
      cashAmount,
      distributionDate,
      distributionLocation,
      // Training fields
      trainingType,
      trainingDuration,
      certificateProvided,
      // Media team fields
      mediaTeamAssigned,
      mediaCoverageRequired,
      mediaCoverageType
    } = req.body;

    // Validate required fields
    if (!projectId || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: projectId, title'
      });
    }

    // Generate task code
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const taskCount = await Task.count({ where: { projectId } });
    const taskCode = `${project.projectCode}-T${String(taskCount + 1).padStart(3, '0')}`;

    // Build task data object
    const taskData = {
      projectId,
      taskCode,
      title,
      description,
      assignedTo: assignedTo || null,
      assignedBy: req.user.id,
      assignedAt: assignedTo ? new Date() : null,
      dueDate: dueDate || null,
      startDate: startDate || null,
      status: 'Pending',
      priority: priority || 'Medium',
      progress: 0,
      dependsOn: dependsOn || [],
      budgetAllocated: budgetAllocated || null,
      deliverables: deliverables || [],
      requiresApproval: requiresApproval || false,
      createdBy: req.user.id,
      // Task type fields
      taskType: taskType || 'Other',
      taskCategory: taskCategory || null,
      // Procurement fields
      requiresProcurement: requiresProcurement || false,
      procurementStatus: requiresProcurement ? 'Not Required' : 'Not Required',
      // Beneficiary fields
      involvesBeneficiaries: involvesBeneficiaries || false,
      beneficiaryTrackingMode: beneficiaryTrackingMode || 'None',
      beneficiarySelectionMethod: beneficiarySelectionMethod || 'None',
      selectionCriteria: selectionCriteria || null,
      targetBeneficiaries: targetBeneficiaries || null,
      actualBeneficiaries: 0,
      // Distribution fields
      distributionType: distributionType || 'None',
      distributionItems: distributionItems || null,
      cashAmount: cashAmount || null,
      distributionDate: distributionDate || null,
      distributionLocation: distributionLocation || null,
      // Training fields
      trainingType: trainingType || null,
      trainingDuration: trainingDuration || null,
      certificateProvided: certificateProvided || false,
      // Media team fields
      mediaTeamAssigned: mediaTeamAssigned || [],
      mediaCoverageRequired: mediaCoverageRequired || false,
      mediaCoverageType: mediaCoverageType || [],
      mediaCoverageStatus: mediaCoverageRequired ? 'Pending' : 'Not Required'
    };

    // Create task
    const task = await Task.create(taskData);

    // Create TaskAssignee records for multi-staff assignment
    if (assignedUsers && Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const assigneeRecords = assignedUsers.map(userId => ({
        taskId: task.id,
        userId: userId,
        assignedBy: req.user.id,
        assignedAt: new Date(),
        status: 'Pending'
      }));

      await TaskAssignee.bulkCreate(assigneeRecords);
    }

    // Fetch with relationships
    const fullTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        // Include multi-staff assignees
        {
          model: TaskAssignee,
          as: 'assignees',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      task: fullTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
};

/**
 * Update task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { assignedUsers, ...updateData } = req.body;

    const task = await Task.findByPk(id, { transaction: t });

    if (!task) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update(updateData, { transaction: t });

    if (assignedUsers && Array.isArray(assignedUsers)) {
      await TaskAssignee.destroy({ where: { taskId: id }, transaction: t });

      if (assignedUsers.length > 0) {
        const assigneeRecords = assignedUsers.map(userId => ({
          taskId: id,
          userId: userId,
          assignedBy: req.user.id,
          assignedAt: new Date(),
          status: 'Pending'
        }));

        await TaskAssignee.bulkCreate(assigneeRecords, { transaction: t });
      }
    }

    await t.commit();

    // Fetch updated task with relationships
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        // Include multi-staff assignees
        {
          model: TaskAssignee,
          as: 'assignees',
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
          }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      task: updatedTask
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
};

/**
 * Delete task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
};

/**
 * Assign task to user
 * PUT /api/tasks/:id/assign
 */
export const assignTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'assignedTo is required'
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user exists
    const user = await User.findByPk(assignedTo);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update task
    await task.update({
      assignedTo,
      assignedBy: req.user.id,
      assignedAt: new Date(),
      status: task.status === 'Pending' ? 'Pending' : task.status
    });

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'fullName', 'email', 'role']
        },
        {
          model: User,
          as: 'assigner',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Task assigned successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign task',
      error: error.message
    });
  }
};

/**
 * Update task status
 * PUT /api/tasks/:id/status
 */
export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, completionNotes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'status is required'
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updateData = { status };

    // If marking as completed
    if (status === 'Completed') {
      updateData.completionDate = new Date();
      updateData.progress = 100;
      if (completionNotes) {
        updateData.completionNotes = completionNotes;
      }
    }

    await task.update(updateData);

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Task status updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task status',
      error: error.message
    });
  }
};

/**
 * Update task progress
 * PUT /api/tasks/:id/progress
 */
export const updateTaskProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(400).json({
        success: false,
        message: 'progress must be between 0 and 100'
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updateData = { progress };

    // Auto-update status based on progress
    if (progress === 0 && task.status === 'Pending') {
      updateData.status = 'Pending';
    } else if (progress > 0 && progress < 100 && task.status === 'Pending') {
      updateData.status = 'In Progress';
    } else if (progress === 100 && task.status !== 'Completed') {
      updateData.status = 'Completed';
      updateData.completionDate = new Date();
    }

    await task.update(updateData);

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Task progress updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update task progress',
      error: error.message
    });
  }
};

/**
 * Get current user's assigned tasks
 * GET /api/tasks/my-tasks
 */
export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    // Find tasks where user is assigned either via old assignedTo field OR new TaskAssignee table
    const taskWhere = {};
    if (status) {
      taskWhere.status = status;
    }

    const tasks = await Task.findAll({
      where: {
        ...taskWhere,
        [Op.or]: [
          { assignedTo: userId },
          { '$assignees.user_id$': userId },
          Sequelize.where(
            Sequelize.col('Task.media_team_assigned'),
            Op.contains,
            [userId]
          )
        ]
      },
      include: [
        {
          model: Project,
          as: 'project',
          required: false, // LEFT JOIN to include tasks without projects
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName'], 'status']
        },
        {
          model: User,
          as: 'assigner',
          required: false, // LEFT JOIN to include tasks without assigner
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: TaskAssignee,
          as: 'assignees',
          required: false, // LEFT JOIN to include tasks with no multi-staff assignments
          include: [{
            model: User,
            as: 'user',
            attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
          }]
        }
      ],
      order: [['dueDate', 'ASC']]
    });

    // Add user's role in each task (primary assignee vs media team member)
    const tasksWithRole = tasks.map(task => {
      const taskData = task.toJSON();

      // Determine user's role in this task
      const isPrimaryAssignee = taskData.assignedTo === userId ||
                               taskData.assignees?.some(a => a.userId === userId);
      const isMediaTeamMember = taskData.mediaTeamAssigned?.includes(userId);

      return {
        ...taskData,
        userRole: isPrimaryAssignee ? 'primary' : isMediaTeamMember ? 'media' : 'unknown'
      };
    });

    res.json({
      success: true,
      tasks: tasksWithRole
    });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
};

/**
 * Request budget for task
 * POST /api/tasks/:id/budget-request
 */
export const requestBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budgetRequestedAmount, budgetRequestNotes } = req.body;

    if (!budgetRequestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'budgetRequestedAmount is required'
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Update task with budget request
    await task.update({
      requiresProcurement: true,
      budgetRequestedAmount,
      budgetRequestedBy: req.user.id,
      budgetRequestedAt: new Date(),
      budgetRequestNotes: budgetRequestNotes || null,
      budgetRequestStatus: 'Pending',
      procurementStatus: 'Budget Requested'
    });

    // Fetch updated task with relationships
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Budget request submitted successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error requesting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request budget',
      error: error.message
    });
  }
};

/**
 * Approve budget request for task
 * PUT /api/tasks/:id/budget-approve
 */
export const approveBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budgetAllocated, budgetApprovalNotes, budgetApprovalId } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.budgetRequestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'No budget request found for this task'
      });
    }

    if (task.budgetRequestStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Budget request is not pending (current status: ${task.budgetRequestStatus || 'None'})`
      });
    }

    // Update task with budget approval
    await task.update({
      budgetAllocated: budgetAllocated || task.budgetRequestedAmount,
      budgetApprovedBy: req.user.id,
      budgetApprovedAt: new Date(),
      budgetApprovalNotes: budgetApprovalNotes || null,
      budgetApprovalId: budgetApprovalId || null,
      budgetRequestStatus: 'Approved',
      procurementStatus: 'Budget Approved'
    });

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Budget approved successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error approving budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve budget',
      error: error.message
    });
  }
};

/**
 * Reject budget request for task
 * PUT /api/tasks/:id/budget-reject
 */
export const rejectBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const { budgetApprovalNotes } = req.body;

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!task.budgetRequestedAmount) {
      return res.status(400).json({
        success: false,
        message: 'No budget request found for this task'
      });
    }

    if (task.budgetRequestStatus !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Budget request is not pending (current status: ${task.budgetRequestStatus || 'None'})`
      });
    }

    // Update task with budget rejection
    await task.update({
      budgetApprovedBy: req.user.id,
      budgetApprovedAt: new Date(),
      budgetApprovalNotes: budgetApprovalNotes || null,
      budgetRequestStatus: 'Rejected',
      procurementStatus: 'Budget Rejected'
    });

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Budget request rejected',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error rejecting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject budget',
      error: error.message
    });
  }
};

/**
 * Assign media team to task
 * PUT /api/tasks/:id/media-team
 */
export const assignMediaTeam = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaTeamAssigned, mediaCoverageType, mediaCoverageRequired } = req.body;

    if (!mediaTeamAssigned || !Array.isArray(mediaTeamAssigned)) {
      return res.status(400).json({
        success: false,
        message: 'mediaTeamAssigned must be an array of user IDs'
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify all media team members exist
    const mediaTeamUsers = await User.findAll({
      where: { id: mediaTeamAssigned }
    });

    if (mediaTeamUsers.length !== mediaTeamAssigned.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more media team members not found'
      });
    }

    // Update task with media team assignment
    await task.update({
      mediaTeamAssigned,
      mediaCoverageRequired: mediaCoverageRequired !== undefined ? mediaCoverageRequired : true,
      mediaCoverageType: mediaCoverageType || [],
      mediaCoverageStatus: 'Pending'
    });

    // Fetch updated task with media team members
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Media team assigned successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error assigning media team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign media team',
      error: error.message
    });
  }
};

/**
 * Update media coverage status
 * PUT /api/tasks/:id/media-status
 */
export const updateMediaCoverageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { mediaCoverageStatus, distributionEvidence, mediaCoverageNotes, mediaLinks } = req.body;

    const validStatuses = ['Not Required', 'Pending', 'In Progress', 'Completed'];
    if (mediaCoverageStatus && !validStatuses.includes(mediaCoverageStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid media coverage status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const task = await Task.findByPk(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const updateData = {};

    // Update status if provided
    if (mediaCoverageStatus) {
      updateData.mediaCoverageStatus = mediaCoverageStatus;

      // If marking as completed, set completion timestamp
      if (mediaCoverageStatus === 'Completed') {
        updateData.mediaCoverageCompletedAt = new Date();
      }
    }

    // Update media coverage notes if provided
    if (mediaCoverageNotes !== undefined) {
      updateData.mediaCoverageNotes = mediaCoverageNotes;
    }

    // Update distribution evidence if provided (for backward compatibility)
    if (distributionEvidence) {
      updateData.distributionEvidence = distributionEvidence;
    }

    // Handle media links (Google Drive links for photos, videos, testimonials)
    if (mediaLinks) {
      // Store media links in distributionEvidence JSONB field
      const currentEvidence = task.distributionEvidence || {};
      updateData.distributionEvidence = {
        ...currentEvidence,
        mediaLinks: mediaLinks, // { photos: [...], videos: [...], testimonials: [...] }
        uploadedBy: req.user.id,
        uploadedAt: new Date()
      };
    }

    await task.update(updateData);

    // Fetch updated task
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', ['project_code', 'projectCode'], ['name', 'projectName']]
        },
        {
          model: User,
          as: 'assignee',
          attributes: ['id', ['full_name', 'fullName'], 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Media coverage status updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating media coverage status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update media coverage status',
      error: error.message
    });
  }
};

// ============================================
// TASK COMMENT ENDPOINTS
// ============================================

/**
 * Get all comments for a task
 * GET /api/tasks/:id/comments
 */
export const getTaskComments = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comments = await TaskComment.findAll({
      where: { taskId: id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      comments
    });
  } catch (error) {
    console.error('Error fetching task comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task comments',
      error: error.message
    });
  }
};

/**
 * Add a comment to a task
 * POST /api/tasks/:id/comments
 */
export const addTaskComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, mentionedUsers } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const comment = await TaskComment.create({
      taskId: id,
      userId: req.user.id,
      content: content.trim(),
      mentionedUsers: mentionedUsers || []
    });

    const fullComment = await TaskComment.findByPk(comment.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      comment: fullComment
    });
  } catch (error) {
    console.error('Error adding task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
};

/**
 * Update a comment
 * PUT /api/tasks/:taskId/comments/:commentId
 */
export const updateTaskComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    const comment = await TaskComment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only the author can update their comment
    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own comments'
      });
    }

    await comment.update({
      content: content.trim(),
      isEdited: true
    });

    const updatedComment = await TaskComment.findByPk(commentId, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', ['full_name', 'fullName'], 'email', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error updating task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update comment',
      error: error.message
    });
  }
};

/**
 * Delete a comment
 * DELETE /api/tasks/:taskId/comments/:commentId
 */
export const deleteTaskComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await TaskComment.findByPk(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Only the author can delete their comment
    if (comment.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments'
      });
    }

    await comment.destroy();

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting task comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete comment',
      error: error.message
    });
  }
};
