import { Op, Sequelize } from 'sequelize';
import { Report, User, Project } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError, ForbiddenError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL REPORTS
// ============================================
export const getAllReports = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, reportType, generationStatus } = req.query;
  const offset = (page - 1) * limit;

  const where = {};

  // Filter by current user's accessible reports
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  if (!isAdmin) {
    // Non-admin users can only see their own reports or reports shared with them
    where[Op.or] = [
      { createdBy: userId },
      { isPublic: true },
      Sequelize.where(
        Sequelize.cast(Sequelize.col('Report.shared_with'), 'jsonb'),
        Op.contains,
        Sequelize.cast(JSON.stringify([userId]), 'jsonb')
      )
    ];
  }

  if (search) {
    where[Op.and] = where[Op.and] || [];
    where[Op.and].push({
      [Op.or]: [
        { title: { [Op.iLike]: `%${search}%` } },
        { projectName: { [Op.iLike]: `%${search}%` } },
        { donor: { [Op.iLike]: `%${search}%` } }
      ]
    });
  }

  if (reportType) where.reportType = reportType;
  if (generationStatus) where.generationStatus = generationStatus;

  const { count, rows: reports } = await Report.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'fullName', 'username'],
        required: false
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'donor', 'status'],
        required: false
      }
    ]
  });

  res.json({
    success: true,
    data: {
      reports,
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
// GET SINGLE REPORT
// ============================================
export const getReportById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username', 'email', 'phone']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'fullName', 'username'],
        required: false
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'donor', 'status', 'budget', 'description'],
        required: false
      }
    ]
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check access permissions
  const hasAccess = isAdmin ||
                    report.createdBy === userId ||
                    report.isPublic ||
                    (report.sharedWith && report.sharedWith.includes(userId));

  if (!hasAccess) {
    throw new ForbiddenError('You do not have permission to view this report');
  }

  res.json({
    success: true,
    data: { report }
  });
});

// ============================================
// CREATE REPORT
// ============================================
export const createReport = asyncHandler(async (req, res) => {
  const reportData = req.body;
  const userId = req.user.id;

  // Set creator
  reportData.createdBy = userId;

  // Calculate generation statistics
  if (reportData.sections && Array.isArray(reportData.sections)) {
    reportData.totalSections = reportData.sections.length;
    reportData.successfulSections = reportData.sections.filter(s => !s.error).length;

    // Determine generation status
    if (reportData.successfulSections === reportData.totalSections) {
      reportData.generationStatus = 'Completed';
    } else if (reportData.successfulSections > 0) {
      reportData.generationStatus = 'Partial';
    } else {
      reportData.generationStatus = 'Failed';
    }

    // Collect errors
    reportData.generationErrors = reportData.sections
      .filter(s => s.error)
      .map(s => ({ sectionId: s.id, title: s.title, error: s.error }));
  }

  // Cache project name if projectId is provided
  if (reportData.projectId) {
    const project = await Project.findByPk(reportData.projectId);
    if (project) {
      reportData.projectName = project.name;
      if (!reportData.donor && project.donor) {
        reportData.donor = project.donor;
      }
    }
  }

  // Generate title if not provided
  if (!reportData.title) {
    const timestamp = new Date().toLocaleDateString();
    reportData.title = `${reportData.reportType || 'Report'} - ${reportData.projectName || reportData.proposalTitle || timestamp}`;
  }

  const report = await Report.create(reportData);

  const createdReport = await Report.findByPk(report.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username']
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'donor'],
        required: false
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Report created successfully',
    data: { report: createdReport }
  });
});

// ============================================
// UPDATE REPORT
// ============================================
export const updateReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id);

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check permissions
  const canEdit = isAdmin || report.createdBy === userId;

  if (!canEdit) {
    throw new ForbiddenError('You do not have permission to update this report');
  }

  // Set lastEditedBy
  updateData.lastEditedBy = userId;

  // Recalculate statistics if sections are being updated
  if (updateData.sections && Array.isArray(updateData.sections)) {
    updateData.totalSections = updateData.sections.length;
    updateData.successfulSections = updateData.sections.filter(s => !s.error).length;

    if (updateData.successfulSections === updateData.totalSections) {
      updateData.generationStatus = 'Completed';
    } else if (updateData.successfulSections > 0) {
      updateData.generationStatus = 'Partial';
    } else {
      updateData.generationStatus = 'Failed';
    }

    updateData.generationErrors = updateData.sections
      .filter(s => s.error)
      .map(s => ({ sectionId: s.id, title: s.title, error: s.error }));
  }

  await report.update(updateData);

  const updatedReport = await Report.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'fullName', 'username']
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'donor'],
        required: false
      }
    ]
  });

  res.json({
    success: true,
    message: 'Report updated successfully',
    data: { report: updatedReport }
  });
});

// ============================================
// DELETE REPORT
// ============================================
export const deleteReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id);

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check permissions
  const canDelete = isAdmin || report.createdBy === userId;

  if (!canDelete) {
    throw new ForbiddenError('You do not have permission to delete this report');
  }

  await report.destroy();

  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// ============================================
// UPDATE REPORT SECTION
// ============================================
export const updateReportSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { sectionId, content } = req.body;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id);

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check permissions
  const canEdit = isAdmin || report.createdBy === userId;

  if (!canEdit) {
    throw new ForbiddenError('You do not have permission to edit this report');
  }

  if (!sectionId || content === undefined) {
    throw new BadRequestError('sectionId and content are required');
  }

  // Update the specific section
  const sections = report.sections.map(section => {
    if (section.id === sectionId) {
      return {
        ...section,
        content: content,
        editedAt: new Date().toISOString()
      };
    }
    return section;
  });

  await report.update({
    sections,
    lastEditedBy: userId
  });

  res.json({
    success: true,
    message: 'Section updated successfully',
    data: { report }
  });
});

// ============================================
// GET REPORTS BY PROJECT
// ============================================
export const getReportsByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: reports } = await Report.findAndCountAll({
    where: { projectId: parseInt(projectId) },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      reports,
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
// GET REPORTS BY PROPOSAL
// ============================================
export const getReportsByProposal = asyncHandler(async (req, res) => {
  const { proposalId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const { count, rows: reports } = await Report.findAndCountAll({
    where: { proposalId: parseInt(proposalId) },
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      reports,
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
// GET REPORTS BY TYPE
// ============================================
export const getReportsByType = asyncHandler(async (req, res) => {
  const { reportType } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const where = { reportType };

  if (!isAdmin) {
    where[Op.or] = [
      { createdBy: userId },
      { isPublic: true },
      Sequelize.where(
        Sequelize.cast(Sequelize.col('Report.shared_with'), 'jsonb'),
        Op.contains,
        Sequelize.cast(JSON.stringify([userId]), 'jsonb')
      )
    ];
  }

  const { count, rows: reports } = await Report.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      reports,
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
// SHARE REPORT
// ============================================
export const shareReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userIds, isPublic } = req.body;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id);

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check permissions
  const canShare = isAdmin || report.createdBy === userId;

  if (!canShare) {
    throw new ForbiddenError('You do not have permission to share this report');
  }

  const updateData = {};

  if (isPublic !== undefined) {
    updateData.isPublic = isPublic;
  }

  if (userIds && Array.isArray(userIds)) {
    // Merge existing and new shared users
    const existingShared = report.sharedWith || [];
    const newShared = [...new Set([...existingShared, ...userIds])];
    updateData.sharedWith = newShared;
  }

  await report.update(updateData);

  res.json({
    success: true,
    message: 'Report sharing updated successfully',
    data: { report }
  });
});

// ============================================
// EXPORT REPORT
// ============================================
export const exportReport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { format = 'json' } = req.query;
  const userId = req.user.id;
  const isAdmin = ['Admin', 'CEO', 'Director Programmes'].includes(req.user.role);

  const report = await Report.findByPk(id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'username', 'email']
      },
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'donor', 'description', 'budget'],
        required: false
      }
    ]
  });

  if (!report) {
    throw new NotFoundError('Report not found');
  }

  // Check access permissions
  const hasAccess = isAdmin ||
                    report.createdBy === userId ||
                    report.isPublic ||
                    (report.sharedWith && report.sharedWith.includes(userId));

  if (!hasAccess) {
    throw new ForbiddenError('You do not have permission to export this report');
  }

  // Update export metadata
  const exportedFormats = report.exportedFormats || [];
  if (!exportedFormats.includes(format)) {
    exportedFormats.push(format);
  }

  await report.update({
    exportedFormats,
    lastExportedAt: new Date()
  });

  // Return report data for client-side export
  res.json({
    success: true,
    data: { report }
  });
});
