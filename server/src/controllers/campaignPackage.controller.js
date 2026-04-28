import { asyncHandler, BadRequestError, NotFoundError } from '../middleware/error.middleware.js';
import models from '../models/index.js';
import { Op } from 'sequelize';

const { CampaignPackage, Campaign } = models;

// ============================================
// GET ALL PACKAGES FOR A CAMPAIGN
// ============================================
export const getAllPackages = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  // Verify campaign exists
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  const packages = await CampaignPackage.findAll({
    where: { campaignId },
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });

  res.json({
    success: true,
    data: { packages }
  });
});

// ============================================
// GET ACTIVE PACKAGES FOR A CAMPAIGN (PUBLIC)
// ============================================
export const getActivePackages = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;

  const packages = await CampaignPackage.findAll({
    where: {
      campaignId,
      isActive: true
    },
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });

  res.json({
    success: true,
    data: { packages }
  });
});

// ============================================
// GET SINGLE PACKAGE
// ============================================
export const getPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const package_ = await CampaignPackage.findByPk(id, {
    include: [{
      model: Campaign,
      as: 'campaign'
    }]
  });

  if (!package_) {
    throw new NotFoundError('Package not found');
  }

  res.json({
    success: true,
    data: { package: package_ }
  });
});

// ============================================
// CREATE PACKAGE
// ============================================
export const createPackage = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { name, description, amount, imageUrl, displayOrder, isActive } = req.body;

  // Verify campaign exists
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  // Validate required fields
  if (!name || !amount) {
    throw new BadRequestError('Name and amount are required');
  }

  if (isNaN(amount) || parseFloat(amount) <= 0) {
    throw new BadRequestError('Amount must be a positive number');
  }

  // Create package
  const package_ = await CampaignPackage.create({
    campaignId,
    name,
    description,
    amount: parseFloat(amount),
    imageUrl,
    displayOrder: displayOrder !== undefined ? parseInt(displayOrder) : 0,
    isActive: isActive !== undefined ? isActive : true
  });

  res.status(201).json({
    success: true,
    message: 'Package created successfully',
    data: { package: package_ }
  });
});

// ============================================
// UPDATE PACKAGE
// ============================================
export const updatePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, amount, imageUrl, displayOrder, isActive } = req.body;

  const package_ = await CampaignPackage.findByPk(id);
  if (!package_) {
    throw new NotFoundError('Package not found');
  }

  // Validate amount if provided
  if (amount !== undefined && (isNaN(amount) || parseFloat(amount) <= 0)) {
    throw new BadRequestError('Amount must be a positive number');
  }

  // Update package
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (amount !== undefined) updateData.amount = parseFloat(amount);
  if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
  if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
  if (isActive !== undefined) updateData.isActive = isActive;

  await package_.update(updateData);

  res.json({
    success: true,
    message: 'Package updated successfully',
    data: { package: package_ }
  });
});

// ============================================
// DELETE PACKAGE
// ============================================
export const deletePackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const package_ = await CampaignPackage.findByPk(id);
  if (!package_) {
    throw new NotFoundError('Package not found');
  }

  await package_.destroy();

  res.json({
    success: true,
    message: 'Package deleted successfully'
  });
});

// ============================================
// REORDER PACKAGES
// ============================================
export const reorderPackages = asyncHandler(async (req, res) => {
  const { campaignId } = req.params;
  const { packageIds } = req.body;

  if (!Array.isArray(packageIds) || packageIds.length === 0) {
    throw new BadRequestError('Package IDs array is required');
  }

  // Verify campaign exists
  const campaign = await Campaign.findByPk(campaignId);
  if (!campaign) {
    throw new NotFoundError('Campaign not found');
  }

  // Verify all packages belong to this campaign
  const packages = await CampaignPackage.findAll({
    where: {
      id: { [Op.in]: packageIds },
      campaignId
    }
  });

  if (packages.length !== packageIds.length) {
    throw new BadRequestError('One or more packages not found or do not belong to this campaign');
  }

  // Update display order
  const updatePromises = packageIds.map((id, index) =>
    CampaignPackage.update(
      { displayOrder: index },
      { where: { id } }
    )
  );

  await Promise.all(updatePromises);

  // Fetch updated packages
  const updatedPackages = await CampaignPackage.findAll({
    where: { campaignId },
    order: [['displayOrder', 'ASC']]
  });

  res.json({
    success: true,
    message: 'Packages reordered successfully',
    data: { packages: updatedPackages }
  });
});

// ============================================
// TOGGLE PACKAGE STATUS
// ============================================
export const togglePackageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const package_ = await CampaignPackage.findByPk(id);
  if (!package_) {
    throw new NotFoundError('Package not found');
  }

  await package_.update({ isActive: !package_.isActive });

  res.json({
    success: true,
    message: `Package ${package_.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { package: package_ }
  });
});
