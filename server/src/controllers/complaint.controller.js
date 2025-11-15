import { Complaint, Project, User } from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// Get all complaints with filtering and pagination
export const getAllComplaints = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    category,
    priority,
    status,
    projectId,
    assignedTo,
    search,
    startDate,
    endDate,
    sortBy = 'submittedDate',
    sortOrder = 'DESC'
  } = req.query;

  const offset = (page - 1) * limit;
  const where = {};

  // Apply filters
  if (category) where.category = category;
  if (priority) where.priority = priority;
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;
  if (assignedTo) where.assignedTo = assignedTo;

  if (startDate || endDate) {
    where.submittedDate = {};
    if (startDate) where.submittedDate[Op.gte] = startDate;
    if (endDate) where.submittedDate[Op.lte] = endDate;
  }

  if (search) {
    where[Op.or] = [
      { ticketNumber: { [Op.iLike]: `%${search}%` } },
      { complainantName: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
      { projectName: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Complaint.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [[sortBy, sortOrder]],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'projectCode'],
        required: false
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'username', 'email'],
        required: false
      }
    ]
  });

  res.json({
    success: true,
    data: {
      complaints: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    }
  });
});

// Get single complaint by ID
export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'projectCode', 'status'],
        required: false
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'username', 'email'],
        required: false
      }
    ]
  });

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }

  res.json({
    success: true,
    data: { complaint }
  });
});

// Create new complaint
export const createComplaint = asyncHandler(async (req, res) => {
  const {
    ticketNumber,
    submittedDate,
    complainantName,
    contactMethod,
    contactDetails,
    category,
    priority,
    description,
    projectId,
    projectName,
    status,
    assignedTo,
    investigationNotes,
    resolution,
    resolvedDate,
    closedDate,
    satisfactionRating,
    followUpRequired,
    followUpDate,
    confidential
  } = req.body;

  // Validate required fields
  if (!ticketNumber || !submittedDate || !complainantName || !category || !description) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields: ticketNumber, submittedDate, complainantName, category, description'
    });
  }

  // Check if ticket number already exists
  const existingComplaint = await Complaint.findOne({ where: { ticketNumber } });
  if (existingComplaint) {
    return res.status(400).json({
      success: false,
      message: 'Ticket number already exists'
    });
  }

  const complaint = await Complaint.create({
    ticketNumber,
    submittedDate,
    complainantName,
    contactMethod,
    contactDetails,
    category,
    priority: priority || 'Medium',
    description,
    projectId,
    projectName,
    status: status || 'Open',
    assignedTo,
    investigationNotes,
    resolution,
    resolvedDate,
    closedDate,
    satisfactionRating,
    followUpRequired: followUpRequired || false,
    followUpDate,
    confidential: confidential || false
  });

  res.status(201).json({
    success: true,
    data: { complaint },
    message: 'Complaint created successfully'
  });
});

// Update complaint
export const updateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }

  const {
    ticketNumber,
    submittedDate,
    complainantName,
    contactMethod,
    contactDetails,
    category,
    priority,
    description,
    projectId,
    projectName,
    status,
    assignedTo,
    investigationNotes,
    resolution,
    resolvedDate,
    closedDate,
    satisfactionRating,
    followUpRequired,
    followUpDate,
    confidential
  } = req.body;

  // If updating ticket number, check uniqueness
  if (ticketNumber && ticketNumber !== complaint.ticketNumber) {
    const existingComplaint = await Complaint.findOne({ where: { ticketNumber } });
    if (existingComplaint) {
      return res.status(400).json({
        success: false,
        message: 'Ticket number already exists'
      });
    }
  }

  // Auto-set resolved date if status changed to Resolved
  let updatedResolvedDate = resolvedDate !== undefined ? resolvedDate : complaint.resolvedDate;
  if (status === 'Resolved' && !complaint.resolvedDate && !resolvedDate) {
    updatedResolvedDate = new Date();
  }

  // Auto-set closed date if status changed to Closed
  let updatedClosedDate = closedDate !== undefined ? closedDate : complaint.closedDate;
  if (status === 'Closed' && !complaint.closedDate && !closedDate) {
    updatedClosedDate = new Date();
  }

  await complaint.update({
    ticketNumber: ticketNumber || complaint.ticketNumber,
    submittedDate: submittedDate || complaint.submittedDate,
    complainantName: complainantName || complaint.complainantName,
    contactMethod: contactMethod !== undefined ? contactMethod : complaint.contactMethod,
    contactDetails: contactDetails !== undefined ? contactDetails : complaint.contactDetails,
    category: category || complaint.category,
    priority: priority || complaint.priority,
    description: description || complaint.description,
    projectId: projectId !== undefined ? projectId : complaint.projectId,
    projectName: projectName !== undefined ? projectName : complaint.projectName,
    status: status || complaint.status,
    assignedTo: assignedTo !== undefined ? assignedTo : complaint.assignedTo,
    investigationNotes: investigationNotes !== undefined ? investigationNotes : complaint.investigationNotes,
    resolution: resolution !== undefined ? resolution : complaint.resolution,
    resolvedDate: updatedResolvedDate,
    closedDate: updatedClosedDate,
    satisfactionRating: satisfactionRating !== undefined ? satisfactionRating : complaint.satisfactionRating,
    followUpRequired: followUpRequired !== undefined ? followUpRequired : complaint.followUpRequired,
    followUpDate: followUpDate !== undefined ? followUpDate : complaint.followUpDate,
    confidential: confidential !== undefined ? confidential : complaint.confidential
  });

  res.json({
    success: true,
    data: { complaint },
    message: 'Complaint updated successfully'
  });
});

// Delete complaint
export const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }

  await complaint.destroy();

  res.json({
    success: true,
    message: 'Complaint deleted successfully'
  });
});

// Assign complaint to user
export const assignComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findByPk(req.params.id);

  if (!complaint) {
    return res.status(404).json({
      success: false,
      message: 'Complaint not found'
    });
  }

  const { assignedTo } = req.body;

  if (!assignedTo) {
    return res.status(400).json({
      success: false,
      message: 'Please provide user ID to assign to'
    });
  }

  // Verify user exists
  const user = await User.findByPk(assignedTo);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  await complaint.update({
    assignedTo,
    status: complaint.status === 'Open' ? 'Under Investigation' : complaint.status
  });

  res.json({
    success: true,
    data: { complaint },
    message: 'Complaint assigned successfully'
  });
});

// Get complaint statistics
export const getComplaintStats = asyncHandler(async (req, res) => {
  const { projectId } = req.query;
  const where = projectId ? { projectId } : {};

  const [
    total,
    byCategory,
    byPriority,
    byStatus,
    openCount,
    resolvedCount,
    averageSatisfaction,
    pendingFollowUp
  ] = await Promise.all([
    Complaint.count({ where }),
    Complaint.findAll({
      where,
      attributes: [
        'category',
        [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    }),
    Complaint.findAll({
      where,
      attributes: [
        'priority',
        [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    }),
    Complaint.findAll({
      where,
      attributes: [
        'status',
        [Complaint.sequelize.fn('COUNT', Complaint.sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    }),
    Complaint.count({ where: { ...where, status: 'Open' } }),
    Complaint.count({ where: { ...where, status: 'Resolved' } }),
    Complaint.findOne({
      where: {
        ...where,
        satisfactionRating: { [Op.ne]: null }
      },
      attributes: [
        [Complaint.sequelize.fn('AVG', Complaint.sequelize.col('satisfactionRating')), 'avg']
      ],
      raw: true
    }),
    Complaint.count({
      where: {
        ...where,
        followUpRequired: true,
        followUpDate: { [Op.gte]: new Date() }
      }
    })
  ]);

  res.json({
    success: true,
    data: {
      total,
      openCount,
      resolvedCount,
      pendingFollowUp,
      averageSatisfaction: averageSatisfaction?.avg ? parseFloat(averageSatisfaction.avg).toFixed(1) : null,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item.category] = parseInt(item.count);
        return acc;
      }, {}),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {}),
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {})
    }
  });
});
