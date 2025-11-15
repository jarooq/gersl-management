import { Op } from 'sequelize';
import { ComplianceDocument, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllComplianceDocuments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, category, complianceArea } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { documentCode: { [Op.iLike]: `%${search}%` } },
      { title: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;
  if (complianceArea) where.complianceArea = complianceArea;

  const { count, rows: documents } = await ComplianceDocument.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['expiryDate', 'ASC']],
    include: [
      { model: User, as: 'responsiblePerson', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getComplianceDocumentById = asyncHandler(async (req, res) => {
  const document = await ComplianceDocument.findByPk(req.params.id, {
    include: [
      { model: User, as: 'responsiblePerson', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!document) throw new NotFoundError('Compliance document not found');
  res.json({ success: true, data: { document } });
});

export const createComplianceDocument = asyncHandler(async (req, res) => {
  const documentData = req.body;

  if (!documentData.documentCode) {
    const year = new Date().getFullYear();
    const count = await ComplianceDocument.count();
    documentData.documentCode = `COMP-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  if (req.user) documentData.createdBy = req.user.id;

  const document = await ComplianceDocument.create(documentData);
  res.status(201).json({ success: true, message: 'Compliance document created successfully', data: { document } });
});

export const updateComplianceDocument = asyncHandler(async (req, res) => {
  const document = await ComplianceDocument.findByPk(req.params.id);
  if (!document) throw new NotFoundError('Compliance document not found');

  await document.update(req.body);
  res.json({ success: true, message: 'Compliance document updated successfully', data: { document } });
});

export const deleteComplianceDocument = asyncHandler(async (req, res) => {
  const document = await ComplianceDocument.findByPk(req.params.id);
  if (!document) throw new NotFoundError('Compliance document not found');

  await document.destroy();
  res.json({ success: true, message: 'Compliance document deleted successfully' });
});

export const getComplianceStats = asyncHandler(async (req, res) => {
  const total = await ComplianceDocument.count();
  const active = await ComplianceDocument.count({ where: { status: 'Active' } });
  const expired = await ComplianceDocument.count({ where: { status: 'Expired' } });
  const pendingRenewal = await ComplianceDocument.count({ where: { status: 'Pending Renewal' } });

  // Documents expiring in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const expiringSoon = await ComplianceDocument.count({
    where: {
      status: 'Active',
      expiryDate: {
        [Op.lte]: thirtyDaysFromNow,
        [Op.gte]: new Date()
      }
    }
  });

  // Documents needing review in next 30 days
  const reviewDueSoon = await ComplianceDocument.count({
    where: {
      status: 'Active',
      nextReviewDate: {
        [Op.lte]: thirtyDaysFromNow,
        [Op.gte]: new Date()
      }
    }
  });

  res.json({
    success: true,
    data: {
      total, active, expired, pendingRenewal,
      expiringSoon,
      reviewDueSoon
    }
  });
});

export const getExpiringDocuments = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + parseInt(days));

  const documents = await ComplianceDocument.findAll({
    where: {
      status: 'Active',
      expiryDate: {
        [Op.lte]: targetDate,
        [Op.gte]: new Date()
      }
    },
    order: [['expiryDate', 'ASC']],
    include: [
      { model: User, as: 'responsiblePerson', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({ success: true, data: { documents } });
});

export const getReviewDueDocuments = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + parseInt(days));

  const documents = await ComplianceDocument.findAll({
    where: {
      status: 'Active',
      nextReviewDate: {
        [Op.lte]: targetDate,
        [Op.gte]: new Date()
      }
    },
    order: [['nextReviewDate', 'ASC']],
    include: [
      { model: User, as: 'responsiblePerson', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({ success: true, data: { documents } });
});
