import { Op } from 'sequelize';
import { FixedAsset, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllFixedAssets = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, assetType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { assetCode: { [Op.iLike]: `%${search}%` } },
      { assetName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (assetType) where.assetType = assetType;

  const { count, rows: assets } = await FixedAsset.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['purchaseDate', 'DESC']],
    include: [{ model: User, as: 'creator', attributes: ['id', 'fullName'] }]
  });

  res.json({
    success: true,
    data: {
      assets,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getFixedAssetById = asyncHandler(async (req, res) => {
  const asset = await FixedAsset.findByPk(req.params.id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'fullName'] }]
  });

  if (!asset) throw new NotFoundError('Fixed asset not found');
  res.json({ success: true, data: { asset } });
});

export const createFixedAsset = asyncHandler(async (req, res) => {
  const assetData = req.body;

  if (!assetData.assetCode) {
    const year = new Date().getFullYear();
    const count = await FixedAsset.count();
    assetData.assetCode = `AST-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate initial book value
  assetData.bookValue = parseFloat(assetData.purchaseCost) - parseFloat(assetData.accumulatedDepreciation || 0);
  if (req.user) assetData.createdBy = req.user.id;

  const asset = await FixedAsset.create(assetData);
  res.status(201).json({ success: true, message: 'Fixed asset created successfully', data: { asset } });
});

export const updateFixedAsset = asyncHandler(async (req, res) => {
  const asset = await FixedAsset.findByPk(req.params.id);
  if (!asset) throw new NotFoundError('Fixed asset not found');

  const updateData = req.body;

  // Recalculate book value if needed
  if (updateData.purchaseCost !== undefined || updateData.accumulatedDepreciation !== undefined) {
    const purchaseCost = updateData.purchaseCost !== undefined ? updateData.purchaseCost : asset.purchaseCost;
    const accumulatedDepreciation = updateData.accumulatedDepreciation !== undefined ? updateData.accumulatedDepreciation : asset.accumulatedDepreciation;
    updateData.bookValue = parseFloat(purchaseCost) - parseFloat(accumulatedDepreciation);
  }

  await asset.update(updateData);
  res.json({ success: true, message: 'Fixed asset updated successfully', data: { asset } });
});

export const disposeFixedAsset = asyncHandler(async (req, res) => {
  const asset = await FixedAsset.findByPk(req.params.id);
  if (!asset) throw new NotFoundError('Fixed asset not found');

  const { disposalDate, disposalValue, disposalNotes } = req.body;

  await asset.update({
    status: 'Disposed',
    disposalDate,
    disposalValue,
    disposalNotes
  });

  res.json({ success: true, message: 'Fixed asset disposed successfully', data: { asset } });
});

export const deleteFixedAsset = asyncHandler(async (req, res) => {
  const asset = await FixedAsset.findByPk(req.params.id);
  if (!asset) throw new NotFoundError('Fixed asset not found');

  await asset.destroy();
  res.json({ success: true, message: 'Fixed asset deleted successfully' });
});

export const getFixedAssetStats = asyncHandler(async (req, res) => {
  const total = await FixedAsset.count();
  const active = await FixedAsset.count({ where: { status: 'Active' } });
  const disposed = await FixedAsset.count({ where: { status: 'Disposed' } });

  const totalValue = await FixedAsset.sum('purchaseCost', { where: { status: 'Active' } }) || 0;
  const totalBookValue = await FixedAsset.sum('bookValue', { where: { status: 'Active' } }) || 0;
  const totalDepreciation = await FixedAsset.sum('accumulatedDepreciation', { where: { status: 'Active' } }) || 0;

  res.json({
    success: true,
    data: {
      total, active, disposed,
      totalValue: parseFloat(totalValue),
      totalBookValue: parseFloat(totalBookValue),
      totalDepreciation: parseFloat(totalDepreciation)
    }
  });
});
