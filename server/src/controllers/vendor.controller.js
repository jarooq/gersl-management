import { Vendor, User } from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError
} from '../middleware/error.middleware.js';

// ============================================
// LIST with filters / search
// ============================================
export const listVendors = asyncHandler(async (req, res) => {
  const {
    q,
    status,
    dueDiligenceStatus,
    category,
    page = 1,
    limit = 50
  } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const where = {};
  if (status) where.status = status;
  if (dueDiligenceStatus) where.dueDiligenceStatus = dueDiligenceStatus;
  if (q) {
    where[Op.or] = [
      { vendorName: { [Op.iLike]: `%${q}%` } },
      { vendorCode: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { phone: { [Op.iLike]: `%${q}%` } }
    ];
  }
  if (category) {
    where.categories = { [Op.contains]: [category] };
  }

  const { rows, count } = await Vendor.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset,
    order: [['vendorName', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      vendors: rows,
      pagination: { total: count, page: parseInt(page, 10), pages: Math.ceil(count / parseInt(limit, 10)) }
    }
  });
});

export const getVendor = asyncHandler(async (req, res) => {
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');
  res.json({ success: true, data: { vendor: v } });
});

// ============================================
// CREATE
// ============================================
const generateVendorCode = async (vendorName) => {
  // Slug + counter for collision safety.
  const slug = vendorName
    ?.toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20) || 'VENDOR';
  const year = new Date().getFullYear();
  const count = await Vendor.count();
  return `${slug}-${year}-${String(count + 1).padStart(3, '0')}`;
};

export const createVendor = asyncHandler(async (req, res) => {
  const { vendorCode, vendorName, ...rest } = req.body;
  if (!vendorName) throw new BadRequestError('vendorName is required');

  if (vendorCode) {
    const existing = await Vendor.findOne({ where: { vendorCode } });
    if (existing) throw new ConflictError('vendorCode already in use');
  }

  const v = await Vendor.create({
    vendorCode: vendorCode || (await generateVendorCode(vendorName)),
    vendorName,
    ...rest,
    createdBy: req.user.id
  });
  res.status(201).json({ success: true, data: { vendor: v } });
});

// ============================================
// UPDATE
// ============================================
export const updateVendorRecord = asyncHandler(async (req, res) => {
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');

  // Status transitions handled separately (blacklist / unblacklist).
  const { status, blacklistReason, blacklistedBy, blacklistedAt, ...patch } = req.body;
  await v.update(patch);
  res.json({ success: true, data: { vendor: v } });
});

// ============================================
// BLACKLIST / UNBLACKLIST
// ============================================
export const blacklistVendor = asyncHandler(async (req, res) => {
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');
  await v.update({
    status: 'Blacklisted',
    blacklistReason: reason,
    blacklistedBy: req.user.id,
    blacklistedAt: new Date()
  });
  res.json({ success: true, data: { vendor: v } });
});

export const unblacklistVendor = asyncHandler(async (req, res) => {
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');
  if (v.status !== 'Blacklisted') {
    throw new BadRequestError('Vendor is not blacklisted');
  }
  await v.update({
    status: 'Active',
    blacklistReason: null,
    blacklistedBy: null,
    blacklistedAt: null
  });
  res.json({ success: true, data: { vendor: v } });
});

// ============================================
// DUE DILIGENCE — Cleared / Failed with notes
// ============================================
export const setDueDiligence = asyncHandler(async (req, res) => {
  const { status, notes } = req.body || {};
  if (!['Cleared', 'Failed', 'Pending'].includes(status)) {
    throw new BadRequestError('status must be Pending, Cleared, or Failed');
  }
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');

  await v.update({
    dueDiligenceStatus: status,
    dueDiligenceNotes: notes || null,
    dueDiligenceCheckedBy: req.user.id,
    dueDiligenceCheckedAt: new Date()
  });
  res.json({ success: true, data: { vendor: v } });
});

// ============================================
// DELETE
// ============================================
export const deleteVendorRecord = asyncHandler(async (req, res) => {
  const v = await Vendor.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vendor not found');
  await v.destroy();
  res.json({ success: true, message: 'Vendor deleted' });
});
