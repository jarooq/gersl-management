import { Vehicle, User } from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const include = [
  { model: User, as: 'owner', attributes: ['id', 'fullName', 'role', 'email'] }
];

const VALID_TYPES = ['Bike', 'Car', 'Van', 'PublicTransport'];

// ============================================
// LIST
// ============================================
export const listVehicles = asyncHandler(async (req, res) => {
  const { mine, type, isActive, q } = req.query;
  const where = {};
  if (mine === 'true') where.ownerUserId = req.user.id;
  if (type) where.type = type;
  if (isActive !== undefined) where.isActive = String(isActive) === 'true';
  if (q) where.plateNo = { [Op.iLike]: `%${q}%` };
  const rows = await Vehicle.findAll({ where, include, order: [['type', 'ASC'], ['plateNo', 'ASC']] });
  res.json({ success: true, data: { vehicles: rows } });
});

export const getVehicle = asyncHandler(async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id, { include });
  if (!v) throw new NotFoundError('Vehicle not found');
  res.json({ success: true, data: { vehicle: v } });
});

// ============================================
// CREATE
// ============================================
export const createVehicleRecord = asyncHandler(async (req, res) => {
  const { type, plateNo, ownerUserId, isPersonal = true, fuelEfficiencyKmpl, notes } = req.body;
  if (!VALID_TYPES.includes(type)) {
    throw new BadRequestError(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  // Default owner = creator unless explicitly set.
  const owner = ownerUserId ?? (isPersonal ? req.user.id : null);
  if (owner) {
    const u = await User.findByPk(owner);
    if (!u) throw new BadRequestError('ownerUserId is invalid');
  }
  const v = await Vehicle.create({
    type,
    plateNo: plateNo || null,
    ownerUserId: owner,
    isPersonal: !!isPersonal,
    fuelEfficiencyKmpl: fuelEfficiencyKmpl != null ? Number(fuelEfficiencyKmpl) : null,
    notes: notes || null,
    isActive: true,
    createdBy: req.user.id
  });
  const reloaded = await Vehicle.findByPk(v.id, { include });
  res.status(201).json({ success: true, data: { vehicle: reloaded } });
});

// ============================================
// UPDATE
// ============================================
export const updateVehicleRecord = asyncHandler(async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vehicle not found');
  // Owners can edit their own personal vehicles; admins/managers can edit any.
  const isOwner = v.ownerUserId === req.user.id;
  const isManager = ['Admin', 'CEO', 'HR Manager', 'Finance Manager'].includes(req.user.role);
  if (!isOwner && !isManager) {
    throw new ForbiddenError('Only the owner or a manager can edit this vehicle');
  }
  if (req.body.type && !VALID_TYPES.includes(req.body.type)) {
    throw new BadRequestError(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  await v.update(req.body);
  const reloaded = await Vehicle.findByPk(v.id, { include });
  res.json({ success: true, data: { vehicle: reloaded } });
});

// ============================================
// DEACTIVATE / DELETE
// ============================================
export const deactivateVehicleRecord = asyncHandler(async (req, res) => {
  const v = await Vehicle.findByPk(req.params.id);
  if (!v) throw new NotFoundError('Vehicle not found');
  await v.update({ isActive: false });
  res.json({ success: true, data: { vehicle: v } });
});
