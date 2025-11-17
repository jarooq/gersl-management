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

  // Process uploaded files
  const photos = [];
  const documents = [];

  if (req.files) {
    // Profile photo goes into photos array
    if (req.files.profilePhoto && req.files.profilePhoto[0]) {
      photos.push(`/uploads/orphans/${req.files.profilePhoto[0].filename}`);
    }

    // All other documents go into documents array
    const docFields = ['birthCertificate', 'deathCertificate', 'guardianNICDoc', 'schoolLetter', 'drawingLetter', 'otherDoc1', 'otherDoc2'];
    docFields.forEach(field => {
      if (req.files[field] && req.files[field][0]) {
        documents.push({
          type: field,
          url: `/uploads/orphans/${req.files[field][0].filename}`,
          filename: req.files[field][0].originalname,
          uploadedAt: new Date()
        });
      }
    });
  }

  // Add files to orphan data
  if (photos.length > 0) {
    orphanData.photos = JSON.stringify(photos);
  }
  if (documents.length > 0) {
    orphanData.documents = JSON.stringify(documents);
  }

  // Clean numeric fields - remove empty strings
  const numericFields = ['age', 'latitude', 'longitude', 'motherMonthlyIncome', 'treatmentCost', 'stipendAmount', 'totalStipendPaid'];
  numericFields.forEach(field => {
    if (orphanData[field] === '' || orphanData[field] === null) {
      delete orphanData[field];
    }
  });

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
  const updateData = { ...req.body };

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

  // Handle profile photo upload
  if (req.files?.profilePhoto) {
    const existingPhotos = orphan.photos ?
      (typeof orphan.photos === 'string' ? JSON.parse(orphan.photos) : orphan.photos) : [];
    const newPhoto = `/uploads/orphans/${req.files.profilePhoto[0].filename}`;
    updateData.photos = JSON.stringify([newPhoto, ...existingPhotos]);
  }

  // Handle document uploads
  if (req.files) {
    let existingDocuments = [];
    try {
      if (orphan.documents) {
        existingDocuments = typeof orphan.documents === 'string'
          ? JSON.parse(orphan.documents)
          : orphan.documents;
      }
    } catch (error) {
      console.error('Error parsing existing documents:', error);
    }

    const newDocuments = [];
    const docFields = ['birthCertificate', 'deathCertificate', 'guardianNICDoc', 'schoolLetter', 'drawingLetter', 'otherDoc1', 'otherDoc2'];

    docFields.forEach(field => {
      if (req.files[field] && req.files[field][0]) {
        newDocuments.push({
          type: field,
          url: `/uploads/orphans/${req.files[field][0].filename}`,
          filename: req.files[field][0].originalname,
          uploadedAt: new Date()
        });
      }
    });

    if (newDocuments.length > 0) {
      const allDocuments = [...existingDocuments, ...newDocuments];
      updateData.documents = JSON.stringify(allDocuments);
    }
  }

  // Clean numeric fields - remove empty strings
  const numericFields = ['age', 'latitude', 'longitude', 'motherMonthlyIncome', 'treatmentCost', 'stipendAmount', 'totalStipendPaid'];
  numericFields.forEach(field => {
    if (updateData[field] === '' || updateData[field] === null) {
      delete updateData[field];
    }
  });

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

// ============================================
// UPLOAD DOCUMENTS
// ============================================

// @desc    Upload additional documents for orphan
// @route   POST /api/orphans/:id/documents
// @access  Private (Edit permission)
export const uploadDocuments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const orphan = await Orphan.findByPk(id);

  if (!orphan) {
    throw new NotFoundError('Orphan not found');
  }

  // Get existing documents
  let existingDocuments = [];
  try {
    if (orphan.documents) {
      existingDocuments = typeof orphan.documents === 'string'
        ? JSON.parse(orphan.documents)
        : orphan.documents;
    }
  } catch (error) {
    console.error('Error parsing existing documents:', error);
  }

  // Process uploaded files
  const newDocuments = [];

  if (req.files) {
    const docFields = ['birthCertificate', 'deathCertificate', 'guardianNICDoc', 'schoolLetter', 'drawingLetter', 'otherDoc1', 'otherDoc2'];
    docFields.forEach(field => {
      if (req.files[field] && req.files[field][0]) {
        newDocuments.push({
          type: field,
          url: `/uploads/orphans/${req.files[field][0].filename}`,
          filename: req.files[field][0].originalname,
          uploadedAt: new Date()
        });
      }
    });
  }

  // Merge with existing documents
  const allDocuments = [...existingDocuments, ...newDocuments];

  // Update orphan with new documents
  orphan.documents = JSON.stringify(allDocuments);
  await orphan.save();

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
    message: `${newDocuments.length} document(s) uploaded successfully`,
    data: { orphan: updatedOrphan }
  });
});

// ============================================
// BULK IMPORT
// ============================================

// @desc    Bulk import orphans from Excel/CSV
// @route   POST /api/orphans/bulk-import
// @access  Private (Create permission)
export const bulkImportOrphans = asyncHandler(async (req, res) => {
  const { orphans } = req.body;

  if (!Array.isArray(orphans) || orphans.length === 0) {
    throw new BadRequestError('No orphan data provided');
  }

  const results = {
    total: orphans.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  const createdOrphans = [];

  // Process each orphan
  for (let i = 0; i < orphans.length; i++) {
    try {
      const orphanData = orphans[i];

      // Set coordinator to current user if not specified
      if (!orphanData.coordinatorId) {
        orphanData.coordinatorId = req.user.id;
      }

      // Calculate age from date of birth
      if (orphanData.dateOfBirth) {
        const birthDate = new Date(orphanData.dateOfBirth);
        const today = new Date();
        orphanData.age = today.getFullYear() - birthDate.getFullYear();
      }

      // Set default status
      if (!orphanData.status) {
        orphanData.status = 'Pending';
      }

      // Set default approval status
      if (!orphanData.approvalStatus) {
        orphanData.approvalStatus = 'pending';
      }

      // Create orphan
      const orphan = await Orphan.create(orphanData);
      createdOrphans.push(orphan.id);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        data: orphans[i],
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Bulk import completed: ${results.successful} successful, ${results.failed} failed`,
    data: results
  });
});
