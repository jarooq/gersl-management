import { Evaluation, Project } from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// Get all evaluations with filtering and pagination
export const getAllEvaluations = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    type,
    status,
    reportStatus,
    projectId,
    evaluator,
    search,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (type) where.type = type;
  if (status) where.status = status;
  if (reportStatus) where.reportStatus = reportStatus;
  if (projectId) where.projectId = projectId;
  if (evaluator) where.evaluator = { [Op.iLike]: `%${evaluator}%` };

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { evaluationCode: { [Op.iLike]: `%${search}%` } },
      { evaluator: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Evaluation.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'projectCode']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      evaluations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get single evaluation by ID
export const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findByPk(req.params.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'projectCode', 'status']
      }
    ]
  });

  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found'
    });
  }

  res.json({
    success: true,
    data: { evaluation }
  });
});

// Create new evaluation
export const createEvaluation = asyncHandler(async (req, res) => {
  const {
    evaluationCode,
    title,
    type,
    projectId,
    evaluator,
    startDate,
    endDate,
    status,
    methodology,
    objectives,
    findings,
    recommendations,
    reportStatus,
    reportUrl,
    attachments,
    budget
  } = req.body;

  // Validate required fields
  if (!evaluationCode || !title || !type || !evaluator || !startDate) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: evaluationCode, title, type, evaluator, startDate'
    });
  }

  // Check if evaluation code already exists
  const existingEvaluation = await Evaluation.findOne({ where: { evaluationCode } });
  if (existingEvaluation) {
    return res.status(400).json({
      success: false,
      message: 'Evaluation code already exists'
    });
  }

  const evaluation = await Evaluation.create({
    evaluationCode,
    title,
    type,
    projectId,
    evaluator,
    startDate,
    endDate,
    status: status || 'Planned',
    methodology,
    objectives: objectives || [],
    findings,
    recommendations,
    reportStatus: reportStatus || 'Pending',
    reportUrl,
    attachments: attachments || [],
    budget
  });

  res.status(201).json({
    success: true,
    data: { evaluation },
    message: 'Evaluation created successfully'
  });
});

// Update evaluation
export const updateEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findByPk(req.params.id);

  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found'
    });
  }

  const {
    evaluationCode,
    title,
    type,
    projectId,
    evaluator,
    startDate,
    endDate,
    status,
    methodology,
    objectives,
    findings,
    recommendations,
    reportStatus,
    reportUrl,
    attachments,
    budget
  } = req.body;

  // If updating evaluation code, check uniqueness
  if (evaluationCode && evaluationCode !== evaluation.evaluationCode) {
    const existingEvaluation = await Evaluation.findOne({ where: { evaluationCode } });
    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'Evaluation code already exists'
      });
    }
  }

  await evaluation.update({
    evaluationCode: evaluationCode || evaluation.evaluationCode,
    title: title || evaluation.title,
    type: type || evaluation.type,
    projectId: projectId !== undefined ? projectId : evaluation.projectId,
    evaluator: evaluator || evaluation.evaluator,
    startDate: startDate || evaluation.startDate,
    endDate: endDate !== undefined ? endDate : evaluation.endDate,
    status: status || evaluation.status,
    methodology: methodology !== undefined ? methodology : evaluation.methodology,
    objectives: objectives !== undefined ? objectives : evaluation.objectives,
    findings: findings !== undefined ? findings : evaluation.findings,
    recommendations: recommendations !== undefined ? recommendations : evaluation.recommendations,
    reportStatus: reportStatus || evaluation.reportStatus,
    reportUrl: reportUrl !== undefined ? reportUrl : evaluation.reportUrl,
    attachments: attachments !== undefined ? attachments : evaluation.attachments,
    budget: budget !== undefined ? budget : evaluation.budget
  });

  res.json({
    success: true,
    data: { evaluation },
    message: 'Evaluation updated successfully'
  });
});

// Delete evaluation
export const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findByPk(req.params.id);

  if (!evaluation) {
    return res.status(404).json({
      success: false,
      message: 'Evaluation not found'
    });
  }

  await evaluation.destroy();

  res.json({
    success: true,
    message: 'Evaluation deleted successfully'
  });
});

// Get evaluation statistics
export const getEvaluationStats = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const where = projectId ? { projectId } : {};

  const [
    total,
    byType,
    byStatus,
    byReportStatus,
    completedCount,
    inProgressCount
  ] = await Promise.all([
    Evaluation.count({ where }),
    Evaluation.findAll({
      where,
      attributes: [
        'type',
        [Evaluation.sequelize.fn('COUNT', Evaluation.sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    }),
    Evaluation.findAll({
      where,
      attributes: [
        'status',
        [Evaluation.sequelize.fn('COUNT', Evaluation.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }),
    Evaluation.findAll({
      where,
      attributes: [
        'reportStatus',
        [Evaluation.sequelize.fn('COUNT', Evaluation.sequelize.col('id')), 'count']
      ],
      group: ['reportStatus'],
      raw: true
    }),
    Evaluation.count({ where: { ...where, status: 'Completed' } }),
    Evaluation.count({ where: { ...where, status: 'In Progress' } })
  ]);

  res.json({
    success: true,
    data: {
      total,
      completedCount,
      inProgressCount,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byReportStatus: byReportStatus.reduce((acc, item) => {
        acc[item.reportStatus] = parseInt(item.count);
        return acc;
      }, {})
    }
  });
});
