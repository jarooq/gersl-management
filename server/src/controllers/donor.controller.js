import { Donor } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// @desc    Get all donors
// @route   GET /api/donors
// @access  Private
export const getAllDonors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, search, type } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (search) {
    where[Op.or] = [
      { donor_name: { [Op.iLike]: `%${search}%` } },
      { contact_person: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (type) {
    where.donor_type = type;
  }

  const { rows: donors, count: total } = await Donor.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset,
    order: [['donor_name', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      donors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
});

// @desc    Get donor by ID
// @route   GET /api/donors/:id
// @access  Private
export const getDonorById = asyncHandler(async (req, res) => {
  const donor = await Donor.findByPk(req.params.id);

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  res.json({
    success: true,
    data: { donor }
  });
});

// @desc    Create new donor
// @route   POST /api/donors
// @access  Private
export const createDonor = asyncHandler(async (req, res) => {
  const {
    donor_name,
    donor_type,
    contact_person,
    email,
    phone,
    address,
    country,
    website,
    notes
  } = req.body;

  if (!donor_name || !donor_type) {
    throw new ValidationError('Donor name and type are required');
  }

  const donor = await Donor.create({
    donor_name,
    donor_type,
    contact_person,
    email,
    phone,
    address,
    country,
    website,
    notes,
    created_by: req.user.id
  });

  res.status(201).json({
    success: true,
    data: { donor }
  });
});

// @desc    Update donor
// @route   PUT /api/donors/:id
// @access  Private
export const updateDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findByPk(req.params.id);

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  const {
    donor_name,
    donor_type,
    contact_person,
    email,
    phone,
    address,
    country,
    website,
    notes
  } = req.body;

  await donor.update({
    donor_name,
    donor_type,
    contact_person,
    email,
    phone,
    address,
    country,
    website,
    notes
  });

  res.json({
    success: true,
    data: { donor }
  });
});

// @desc    Delete donor
// @route   DELETE /api/donors/:id
// @access  Private
export const deleteDonor = asyncHandler(async (req, res) => {
  const donor = await Donor.findByPk(req.params.id);

  if (!donor) {
    throw new NotFoundError('Donor not found');
  }

  await donor.destroy();

  res.json({
    success: true,
    message: 'Donor deleted successfully'
  });
});

// @desc    Get donor statistics
// @route   GET /api/donors/stats
// @access  Private
export const getDonorStats = asyncHandler(async (req, res) => {
  const totalDonors = await Donor.count();
  const activeDonors = await Donor.count({ where: { status: 'Active' } });

  const donorsByType = await Donor.findAll({
    attributes: [
      'donor_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['donor_type']
  });

  res.json({
    success: true,
    data: {
      total_donors: totalDonors,
      active_donors: activeDonors,
      donors_by_type: donorsByType
    }
  });
});
