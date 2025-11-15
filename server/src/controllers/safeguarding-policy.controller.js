import { SafeguardingPolicy, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL POLICIES
// ============================================
export const getAllPolicies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, category } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const { count, rows: policies } = await SafeguardingPolicy.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['effectiveDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      policies,
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
// GET POLICY BY ID
// ============================================
export const getPolicyById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const policy = await SafeguardingPolicy.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  res.json({
    success: true,
    data: { policy }
  });
});

// ============================================
// CREATE POLICY
// ============================================
export const createPolicy = asyncHandler(async (req, res) => {
  const policyData = req.body;

  if (!policyData.policyName || !policyData.version || !policyData.category || !policyData.effectiveDate) {
    throw new ValidationError('Policy name, version, category, and effective date are required');
  }

  if (req.user) {
    policyData.createdBy = req.user.id;
  }

  const policy = await SafeguardingPolicy.create(policyData);

  const createdPolicy = await SafeguardingPolicy.findByPk(policy.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Policy created successfully',
    data: { policy: createdPolicy }
  });
});

// ============================================
// UPDATE POLICY
// ============================================
export const updatePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const policy = await SafeguardingPolicy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  await policy.update(updates);

  const updatedPolicy = await SafeguardingPolicy.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Policy updated successfully',
    data: { policy: updatedPolicy }
  });
});

// ============================================
// DELETE POLICY
// ============================================
export const deletePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const policy = await SafeguardingPolicy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  // Don't allow deletion of active policies
  if (policy.status === 'Active') {
    throw new ValidationError('Cannot delete an active policy. Please archive it first.');
  }

  await policy.destroy();

  res.json({
    success: true,
    message: 'Policy deleted successfully'
  });
});

// ============================================
// ACKNOWLEDGE POLICY
// ============================================
export const acknowledgePolicy = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, userName } = req.body;

  if (!userId || !userName) {
    throw new ValidationError('User ID and name are required');
  }

  const policy = await SafeguardingPolicy.findByPk(id);
  if (!policy) {
    throw new NotFoundError('Policy not found');
  }

  const acknowledgedBy = policy.acknowledgedBy || [];
  const existingAck = acknowledgedBy.find(ack => ack.userId === userId);

  if (existingAck) {
    throw new ValidationError('User has already acknowledged this policy');
  }

  acknowledgedBy.push({
    userId,
    userName,
    acknowledgedDate: new Date().toISOString().split('T')[0]
  });

  await policy.update({ acknowledgedBy });

  const updatedPolicy = await SafeguardingPolicy.findByPk(id);

  res.json({
    success: true,
    message: 'Policy acknowledged successfully',
    data: { policy: updatedPolicy }
  });
});

// ============================================
// GET POLICY STATISTICS
// ============================================
export const getPolicyStats = asyncHandler(async (req, res) => {
  const total = await SafeguardingPolicy.count();
  const active = await SafeguardingPolicy.count({ where: { status: 'Active' } });
  const draft = await SafeguardingPolicy.count({ where: { status: 'Draft' } });
  const archived = await SafeguardingPolicy.count({ where: { status: 'Archived' } });

  // Policies due for review in next 30 days
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const reviewDueSoon = await SafeguardingPolicy.count({
    where: {
      status: 'Active',
      reviewDate: {
        [Op.lte]: thirtyDaysFromNow,
        [Op.gte]: new Date()
      }
    }
  });

  res.json({
    success: true,
    data: {
      total,
      active,
      draft,
      archived,
      reviewDueSoon
    }
  });
});
