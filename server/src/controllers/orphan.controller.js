import { Op } from 'sequelize';
import { Orphan, User } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL ORPHANS
// ============================================
export const getAllOrphans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, district, status, approvalStatus } = req.query;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};

  if (search) {
    where[Op.or] = [
      { fullName: { [Op.iLike]: `%${search}%` } },
      { guardianName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (district) {
    where.district = district;
  }

  if (status) {
    where.status = status;
  }

  if (approvalStatus) {
    where.approvalStatus = approvalStatus;
  }

  // Fetch orphans with pagination
  const { count, rows: orphans } = await Orphan.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'fullName', 'username']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      orphans,
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
// GET SINGLE ORPHAN
// ============================================
export const getOrphanById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const orphan = await Orphan.findByPk(id, {
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'fullName', 'username', 'email', 'phone']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  if (!orphan) {
    throw new NotFoundError('Orphan not found');
  }

  res.json({
    success: true,
    data: { orphan }
  });
});

// ============================================
// CREATE ORPHAN
// ============================================
export const createOrphan = asyncHandler(async (req, res) => {
  const orphanData = req.body;

  // Set coordinator to current user if not specified
  if (!orphanData.coordinatorId) {
    orphanData.coordinatorId = req.user.id;
  }

  // Calculate age from date of birth if not provided
  if (orphanData.dateOfBirth && !orphanData.age) {
    const birthDate = new Date(orphanData.dateOfBirth);
    const today = new Date();
    orphanData.age = today.getFullYear() - birthDate.getFullYear();
  }

  // Create orphan
  const orphan = await Orphan.create(orphanData);

  // Fetch with associations
  const createdOrphan = await Orphan.findByPk(orphan.id, {
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Orphan created successfully',
    data: { orphan: createdOrphan }
  });
});

// ============================================
// UPDATE ORPHAN
// ============================================
export const updateOrphan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const orphan = await Orphan.findByPk(id);

  if (!orphan) {
    throw new NotFoundError('Orphan not found');
  }

  // Check if user has permission to update this orphan
  const user = req.user;
  const isCoordinator = orphan.coordinatorId === user.id;
  const canEdit = ['Admin', 'Programme Manager', 'Project Officer'].includes(user.role) || isCoordinator;

  if (!canEdit) {
    throw new BadRequestError('You do not have permission to update this orphan');
  }

  // Update orphan
  await orphan.update(updateData);

  // Fetch updated orphan with associations
  const updatedOrphan = await Orphan.findByPk(id, {
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Orphan updated successfully',
    data: { orphan: updatedOrphan }
  });
});

// ============================================
// DELETE ORPHAN
// ============================================
export const deleteOrphan = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const orphan = await Orphan.findByPk(id);

  if (!orphan) {
    throw new NotFoundError('Orphan not found');
  }

  await orphan.destroy();

  res.json({
    success: true,
    message: 'Orphan deleted successfully'
  });
});

// ============================================
// APPROVE ORPHAN
// ============================================
export const approveOrphan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { approvalStatus, remarks } = req.body;

  const orphan = await Orphan.findByPk(id);

  if (!orphan) {
    throw new NotFoundError('Orphan not found');
  }

  if (!['Approved', 'Rejected'].includes(approvalStatus)) {
    throw new BadRequestError('Invalid approval status');
  }

  // Update approval status
  orphan.approvalStatus = approvalStatus;
  orphan.approvedBy = req.user.id;
  orphan.approvalDate = new Date();

  if (approvalStatus === 'Approved') {
    orphan.status = 'Active';
  }

  await orphan.save();

  const updatedOrphan = await Orphan.findByPk(id, {
    include: [
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    message: `Orphan ${approvalStatus.toLowerCase()} successfully`,
    data: { orphan: updatedOrphan }
  });
});

// ============================================
// GET ORPHAN STATISTICS
// ============================================
export const getOrphanStats = asyncHandler(async (req, res) => {
  const { district, coordinatorId } = req.query;

  const where = {};
  if (district) where.district = district;
  if (coordinatorId) where.coordinatorId = coordinatorId;

  // Total count
  const total = await Orphan.count({ where });

  // Status breakdown
  const byStatus = await Orphan.findAll({
    where,
    attributes: [
      'status',
      [Orphan.sequelize.fn('COUNT', Orphan.sequelize.col('id')), 'count']
    ],
    group: ['status']
  });

  // Approval status breakdown
  const byApprovalStatus = await Orphan.findAll({
    where,
    attributes: [
      'approvalStatus',
      [Orphan.sequelize.fn('COUNT', Orphan.sequelize.col('id')), 'count']
    ],
    group: ['approvalStatus']
  });

  // District breakdown
  const byDistrict = await Orphan.findAll({
    where,
    attributes: [
      'district',
      [Orphan.sequelize.fn('COUNT', Orphan.sequelize.col('id')), 'count']
    ],
    group: ['district'],
    order: [[Orphan.sequelize.fn('COUNT', Orphan.sequelize.col('id')), 'DESC']]
  });

  // Age distribution
  const ageDistribution = await Orphan.findAll({
    where,
    attributes: [
      [Orphan.sequelize.fn('AVG', Orphan.sequelize.col('age')), 'avgAge'],
      [Orphan.sequelize.fn('MIN', Orphan.sequelize.col('age')), 'minAge'],
      [Orphan.sequelize.fn('MAX', Orphan.sequelize.col('age')), 'maxAge']
    ]
  });

  // Total stipend amount
  const totalStipend = await Orphan.sum('stipendAmount', { where });

  res.json({
    success: true,
    data: {
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: parseInt(s.get('count'))
      })),
      byApprovalStatus: byApprovalStatus.map(s => ({
        approvalStatus: s.approvalStatus,
        count: parseInt(s.get('count'))
      })),
      byDistrict: byDistrict.map(d => ({
        district: d.district,
        count: parseInt(d.get('count'))
      })),
      ageStats: ageDistribution[0] || {},
      totalStipend: parseFloat(totalStipend || 0)
    }
  });
});

// ============================================
// GET ORPHANS BY COORDINATOR
// ============================================
export const getOrphansByCoordinator = asyncHandler(async (req, res) => {
  const { coordinatorId } = req.params;

  const orphans = await Orphan.findAll({
    where: { coordinatorId },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'coordinator',
        attributes: ['id', 'fullName', 'username']
      }
    ]
  });

  res.json({
    success: true,
    data: { orphans }
  });
});
