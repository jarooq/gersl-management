import { Op } from 'sequelize';
import { Project, User, Expense, Indicator, ProjectTeamMember } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';
import { DEPARTMENT_RESTRICTED_ROLES } from '../constants/roles.js';

// ============================================
// GET ALL PROJECTS
// ============================================
export const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, programmeArea } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (status) where.status = status;
  if (programmeArea) where.programmeArea = programmeArea;

  // 🔒 DEPARTMENT-BASED ACCESS CONTROL
  // Project Officers can ONLY see projects in their department
  // Managers, Directors, Admin, CEO can see ALL projects
  const user = req.user;
  const userRole = user.role;
  const userDepartment = user.department;

  // If user is a Project Officer or restricted role, filter by their department
  if (DEPARTMENT_RESTRICTED_ROLES.includes(userRole) && userDepartment) {
    where.department = userDepartment;
  }

  const { count, rows: projects } = await Project.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      projects,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE PROJECT
// ============================================
export const getProjectById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'fullName', 'username', 'email', 'phone']
      },
      {
        model: Expense,
        as: 'expenses',
        limit: 10,
        order: [['date', 'DESC']]
      },
      {
        model: Indicator,
        as: 'indicators'
      },
      {
        model: ProjectTeamMember,
        as: 'teamMembers',
        where: { isActive: true },
        required: false,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'fullName', 'username', 'email', 'role', 'department', 'position', 'phone']
          }
        ]
      }
    ]
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  res.json({
    success: true,
    data: { project }
  });
});

// ============================================
// CREATE PROJECT
// ============================================
export const createProject = asyncHandler(async (req, res) => {
  const projectData = req.body;

  // Set manager to current user if not specified
  if (!projectData.managerId) {
    projectData.managerId = req.user.id;
  }

  // Calculate progress if not provided
  if (!projectData.progress) {
    projectData.progress = 0;
  }

  const project = await Project.create(projectData);

  const createdProject = await Project.findByPk(project.id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project: createdProject }
  });
});

// ============================================
// UPDATE PROJECT
// ============================================
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const project = await Project.findByPk(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Check permissions
  const user = req.user;
  const isManager = project.managerId === user.id;
  const canEdit = ['Admin', 'CEO', 'Programme Manager'].includes(user.role) || isManager;

  if (!canEdit) {
    throw new BadRequestError('You do not have permission to update this project');
  }

  await project.update(updateData);

  const updatedProject = await Project.findByPk(id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project: updatedProject }
  });
});

// ============================================
// DELETE PROJECT
// ============================================
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findByPk(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  await project.destroy();

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
});

// ============================================
// GET PROJECT STATISTICS
// ============================================
export const getProjectStats = asyncHandler(async (req, res) => {
  const { programmeArea, managerId } = req.query;

  const where = {};
  if (programmeArea) where.programmeArea = programmeArea;
  if (managerId) where.managerId = managerId;

  // Total count
  const total = await Project.count({ where });

  // Status breakdown
  const byStatus = await Project.findAll({
    where,
    attributes: [
      'status',
      [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  // Programme area breakdown
  const byProgrammeArea = await Project.findAll({
    where,
    attributes: [
      'programmeArea',
      [Project.sequelize.fn('COUNT', Project.sequelize.col('id')), 'count']
    ],
    group: ['programmeArea']
  });

  // Financial summary
  const financialStats = await Project.findAll({
    where,
    attributes: [
      [Project.sequelize.fn('SUM', Project.sequelize.col('budget')), 'totalBudget'],
      [Project.sequelize.fn('SUM', Project.sequelize.col('spent')), 'totalSpent'],
      [Project.sequelize.fn('AVG', Project.sequelize.col('progress')), 'avgProgress']
    ]
  });

  // Beneficiaries summary
  const beneficiaryStats = await Project.findAll({
    where,
    attributes: [
      [Project.sequelize.fn('SUM', Project.sequelize.col('beneficiaries')), 'totalBeneficiaries'],
      [Project.sequelize.fn('SUM', Project.sequelize.col('targetBeneficiaries')), 'totalTarget']
    ]
  });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byProgrammeArea: byProgrammeArea.map(p => ({
        programmeArea: p.programmeArea,
        count: parseInt(p.get('count'))
      })),
      financial: {
        totalBudget: parseFloat(financialStats[0]?.get('totalBudget') || 0),
        totalSpent: parseFloat(financialStats[0]?.get('totalSpent') || 0),
        avgProgress: parseFloat(financialStats[0]?.get('avgProgress') || 0)
      },
      beneficiaries: {
        total: parseInt(beneficiaryStats[0]?.get('totalBeneficiaries') || 0),
        target: parseInt(beneficiaryStats[0]?.get('totalTarget') || 0)
      }
    }
  });
});

// ============================================
// UPDATE PROJECT PROGRESS
// ============================================
export const updateProjectProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { progress, beneficiaries } = req.body;

  const project = await Project.findByPk(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  if (progress !== undefined) {
    if (progress < 0 || progress > 100) {
      throw new BadRequestError('Progress must be between 0 and 100');
    }
    project.progress = progress;
  }

  if (beneficiaries !== undefined) {
    project.beneficiaries = beneficiaries;
  }

  await project.save();

  res.json({
    success: true,
    message: 'Project progress updated successfully',
    data: { project }
  });
});

// ============================================
// GET PROJECT EXPENSES
// ============================================
export const getProjectExpenses = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findByPk(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const expenses = await Expense.findAll({
    where: { projectId: id },
    order: [['date', 'DESC']],
    include: [
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  const totalExpenses = await Expense.sum('amount', { where: { projectId: id } });

  res.json({
    success: true,
    data: {
      expenses,
      summary: {
        totalExpenses: parseFloat(totalExpenses || 0),
        budget: parseFloat(project.budget),
        remaining: parseFloat(project.budget) - parseFloat(totalExpenses || 0),
        percentageUsed: (parseFloat(totalExpenses || 0) / parseFloat(project.budget)) * 100
      }
    }
  });
});

// ============================================
// GET PROJECT INDICATORS
// ============================================
export const getProjectIndicators = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await Project.findByPk(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  const indicators = await Indicator.findAll({
    where: { projectId: id },
    order: [['type', 'ASC'], ['createdAt', 'DESC']]
  });

  res.json({
    success: true,
    data: { indicators }
  });
});
