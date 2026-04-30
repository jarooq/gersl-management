import { FuelRate } from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError
} from '../middleware/error.middleware.js';

const VALID_TYPES = ['Bike', 'Car', 'Van', 'PublicTransport'];

const validate = (body) => {
  if (!VALID_TYPES.includes(body.vehicleType)) {
    throw new BadRequestError(`vehicleType must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (body.ratePerKm == null || Number(body.ratePerKm) < 0) {
    throw new BadRequestError('ratePerKm must be >= 0');
  }
  if (!body.effectiveFrom) throw new BadRequestError('effectiveFrom is required');
  if (body.effectiveTo && new Date(body.effectiveTo) < new Date(body.effectiveFrom)) {
    throw new BadRequestError('effectiveTo must be >= effectiveFrom');
  }
};

export const listFuelRates = asyncHandler(async (req, res) => {
  const { vehicleType, currentOnly } = req.query;
  const where = {};
  if (vehicleType) where.vehicleType = vehicleType;
  if (String(currentOnly) === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    where.effectiveFrom = { [Op.lte]: today };
    where[Op.or] = [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: today } }];
  }
  const rows = await FuelRate.findAll({ where, order: [['vehicleType', 'ASC'], ['effectiveFrom', 'DESC']] });
  res.json({ success: true, data: { rates: rows } });
});

export const getFuelRate = asyncHandler(async (req, res) => {
  const r = await FuelRate.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Fuel rate not found');
  res.json({ success: true, data: { rate: r } });
});

export const createFuelRate = asyncHandler(async (req, res) => {
  validate(req.body);
  const r = await FuelRate.create({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, data: { rate: r } });
});

export const updateFuelRate = asyncHandler(async (req, res) => {
  const r = await FuelRate.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Fuel rate not found');
  validate({ ...r.toJSON(), ...req.body });
  await r.update(req.body);
  res.json({ success: true, data: { rate: r } });
});

export const deleteFuelRate = asyncHandler(async (req, res) => {
  const r = await FuelRate.findByPk(req.params.id);
  if (!r) throw new NotFoundError('Fuel rate not found');
  await r.destroy();
  res.json({ success: true, message: 'Fuel rate deleted' });
});
