import { CBODueDiligence, CBOPartner, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL DUE DILIGENCE ASSESSMENTS
// ============================================
export const getAllDueDiligence = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, riskLevel, cboPartnerId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (riskLevel) where.riskLevel = riskLevel;
  if (cboPartnerId) where.cboPartnerId = cboPartnerId;

  const { count, rows: assessments } = await CBODueDiligence.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'type']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['assessmentDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      assessments,
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
// GET DUE DILIGENCE BY ID
// ============================================
export const getDueDiligenceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await CBODueDiligence.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district', 'type', 'contactPerson', 'email', 'phone']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'email']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ]
  });

  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  res.json({
    success: true,
    data: { assessment }
  });
});

// ============================================
// GET DUE DILIGENCE BY CBO PARTNER
// ============================================
export const getDueDiligenceByCBO = asyncHandler(async (req, res) => {
  const { cboPartnerId } = req.params;

  const assessments = await CBODueDiligence.findAll({
    where: { cboPartnerId },
    include: [
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ],
    order: [['assessmentDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { assessments }
  });
});

// ============================================
// CREATE DUE DILIGENCE ASSESSMENT
// ============================================
export const createDueDiligence = asyncHandler(async (req, res) => {
  const {
    cboPartnerId,
    assessmentDate,
    assessor,
    overallScore,
    financialScore,
    governanceScore,
    technicalScore,
    safeguardingScore,
    findings,
    recommendations,
    riskLevel,
    status,
    nextAssessmentDate
  } = req.body;

  // Validate required fields
  if (!cboPartnerId || !assessmentDate || !assessor) {
    throw new ValidationError('CBO Partner, assessment date, and assessor are required');
  }

  // Check if CBO Partner exists
  const cbo = await CBOPartner.findByPk(cboPartnerId);
  if (!cbo) {
    throw new NotFoundError('CBO Partner not found');
  }

  // Validate scores if provided
  const scores = [overallScore, financialScore, governanceScore, technicalScore, safeguardingScore];
  for (const score of scores) {
    if (score !== undefined && score !== null && (score < 0 || score > 100)) {
      throw new ValidationError('Scores must be between 0 and 100');
    }
  }

  // Create assessment
  const assessment = await CBODueDiligence.create({
    cboPartnerId,
    assessmentDate,
    assessor,
    overallScore,
    financialScore,
    governanceScore,
    technicalScore,
    safeguardingScore,
    findings,
    recommendations,
    riskLevel: riskLevel || 'Medium',
    status: status || 'Draft',
    nextAssessmentDate,
    createdBy: req.user?.id
  });

  // Fetch with associations
  const createdAssessment = await CBODueDiligence.findByPk(assessment.id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Due diligence assessment created successfully',
    data: { assessment: createdAssessment }
  });
});

// ============================================
// UPDATE DUE DILIGENCE ASSESSMENT
// ============================================
export const updateDueDiligence = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const assessment = await CBODueDiligence.findByPk(id);
  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  // Validate scores if provided
  const scoreFields = ['overallScore', 'financialScore', 'governanceScore', 'technicalScore', 'safeguardingScore'];
  for (const field of scoreFields) {
    const score = updates[field];
    if (score !== undefined && score !== null && (score < 0 || score > 100)) {
      throw new ValidationError(`${field} must be between 0 and 100`);
    }
  }

  await assessment.update(updates);

  // Fetch updated assessment with associations
  const updatedAssessment = await CBODueDiligence.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym', 'district']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Due diligence assessment updated successfully',
    data: { assessment: updatedAssessment }
  });
});

// ============================================
// SUBMIT DUE DILIGENCE FOR REVIEW
// ============================================
export const submitDueDiligence = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await CBODueDiligence.findByPk(id);
  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  if (assessment.status !== 'Draft') {
    throw new ValidationError('Only draft assessments can be submitted');
  }

  await assessment.update({
    status: 'Submitted'
  });

  const updatedAssessment = await CBODueDiligence.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Due diligence assessment submitted for review',
    data: { assessment: updatedAssessment }
  });
});

// ============================================
// APPROVE DUE DILIGENCE
// ============================================
export const approveDueDiligence = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await CBODueDiligence.findByPk(id);
  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  if (assessment.status === 'Approved') {
    throw new ValidationError('Assessment is already approved');
  }

  await assessment.update({
    status: 'Approved',
    approvedBy: req.user?.id,
    approvalDate: new Date().toISOString().split('T')[0]
  });

  const updatedAssessment = await CBODueDiligence.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Due diligence assessment approved successfully',
    data: { assessment: updatedAssessment }
  });
});

// ============================================
// REJECT DUE DILIGENCE
// ============================================
export const rejectDueDiligence = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await CBODueDiligence.findByPk(id);
  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  await assessment.update({
    status: 'Rejected',
    approvedBy: req.user?.id,
    approvalDate: new Date().toISOString().split('T')[0]
  });

  const updatedAssessment = await CBODueDiligence.findByPk(id, {
    include: [
      {
        model: CBOPartner,
        as: 'cboPartner',
        attributes: ['id', 'name', 'acronym']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Due diligence assessment rejected',
    data: { assessment: updatedAssessment }
  });
});

// ============================================
// DELETE DUE DILIGENCE ASSESSMENT
// ============================================
export const deleteDueDiligence = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assessment = await CBODueDiligence.findByPk(id);
  if (!assessment) {
    throw new NotFoundError('Due diligence assessment not found');
  }

  // Only allow deletion of drafts
  if (assessment.status !== 'Draft') {
    throw new ValidationError('Only draft assessments can be deleted');
  }

  await assessment.destroy();

  res.json({
    success: true,
    message: 'Due diligence assessment deleted successfully'
  });
});

// ============================================
// GET DUE DILIGENCE STATISTICS
// ============================================
export const getDueDiligenceStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.assessmentDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const [
    total,
    draft,
    submitted,
    underReview,
    approved,
    rejected,
    lowRisk,
    mediumRisk,
    highRisk,
    criticalRisk
  ] = await Promise.all([
    CBODueDiligence.count({ where }),
    CBODueDiligence.count({ where: { ...where, status: 'Draft' } }),
    CBODueDiligence.count({ where: { ...where, status: 'Submitted' } }),
    CBODueDiligence.count({ where: { ...where, status: 'Under Review' } }),
    CBODueDiligence.count({ where: { ...where, status: 'Approved' } }),
    CBODueDiligence.count({ where: { ...where, status: 'Rejected' } }),
    CBODueDiligence.count({ where: { ...where, riskLevel: 'Low' } }),
    CBODueDiligence.count({ where: { ...where, riskLevel: 'Medium' } }),
    CBODueDiligence.count({ where: { ...where, riskLevel: 'High' } }),
    CBODueDiligence.count({ where: { ...where, riskLevel: 'Critical' } })
  ]);

  // Calculate average scores
  const assessments = await CBODueDiligence.findAll({
    where: {
      ...where,
      overallScore: { [Op.not]: null }
    },
    attributes: ['overallScore', 'financialScore', 'governanceScore', 'technicalScore', 'safeguardingScore']
  });

  const calculateAvg = (field) => {
    const values = assessments.filter(a => a[field] !== null).map(a => parseFloat(a[field]));
    return values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2) : 0;
  };

  res.json({
    success: true,
    data: {
      total,
      byStatus: {
        draft,
        submitted,
        underReview,
        approved,
        rejected
      },
      byRiskLevel: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
        critical: criticalRisk
      },
      avgScores: {
        overall: calculateAvg('overallScore'),
        financial: calculateAvg('financialScore'),
        governance: calculateAvg('governanceScore'),
        technical: calculateAvg('technicalScore'),
        safeguarding: calculateAvg('safeguardingScore')
      },
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0
    }
  });
});
