import { ProcurementThreshold } from '../models/index.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError
} from '../middleware/error.middleware.js';

const VALID_METHODS = ['Direct', 'RFQ-3', 'Sealed-Tender', 'Framework'];

const validate = (body) => {
  const { scopeType = 'global', minAmount, maxAmount, requiredMethod } = body;
  if (!['global', 'donor', 'project'].includes(scopeType)) {
    throw new BadRequestError('scopeType must be global, donor, or project');
  }
  if (minAmount == null || Number(minAmount) < 0) {
    throw new BadRequestError('minAmount is required and must be >= 0');
  }
  if (maxAmount != null && Number(maxAmount) < Number(minAmount)) {
    throw new BadRequestError('maxAmount must be >= minAmount');
  }
  if (requiredMethod && !VALID_METHODS.includes(requiredMethod)) {
    throw new BadRequestError(`requiredMethod must be one of: ${VALID_METHODS.join(', ')}`);
  }
};

export const listThresholds = asyncHandler(async (req, res) => {
  const { scopeType, scopeId } = req.query;
  const where = {};
  if (scopeType) where.scopeType = scopeType;
  if (scopeId)   where.scopeId   = parseInt(scopeId, 10);
  const rows = await ProcurementThreshold.findAll({
    where,
    order: [['scopeType', 'ASC'], ['minAmount', 'ASC']]
  });
  res.json({ success: true, data: { thresholds: rows } });
});

export const getThreshold = asyncHandler(async (req, res) => {
  const t = await ProcurementThreshold.findByPk(req.params.id);
  if (!t) throw new NotFoundError('Threshold not found');
  res.json({ success: true, data: { threshold: t } });
});

export const createThreshold = asyncHandler(async (req, res) => {
  validate(req.body);
  const t = await ProcurementThreshold.create({
    ...req.body,
    createdBy: req.user.id
  });
  res.status(201).json({ success: true, data: { threshold: t } });
});

export const updateThreshold = asyncHandler(async (req, res) => {
  const t = await ProcurementThreshold.findByPk(req.params.id);
  if (!t) throw new NotFoundError('Threshold not found');
  validate({ ...t.toJSON(), ...req.body });
  await t.update(req.body);
  res.json({ success: true, data: { threshold: t } });
});

export const deleteThreshold = asyncHandler(async (req, res) => {
  const t = await ProcurementThreshold.findByPk(req.params.id);
  if (!t) throw new NotFoundError('Threshold not found');
  await t.destroy();
  res.json({ success: true, message: 'Threshold deleted' });
});

// Lookup helper: which threshold applies for a given amount (+ optional scope)?
export const resolveThreshold = asyncHandler(async (req, res) => {
  const { amount, scopeType = 'global', scopeId, currency = 'LKR' } = req.query;
  if (amount == null) throw new BadRequestError('amount is required');
  const today = new Date().toISOString().slice(0, 10);

  // Most-specific scope wins (project → donor → global).
  const scopes = scopeType === 'project'
    ? ['project', 'donor', 'global']
    : scopeType === 'donor'
      ? ['donor', 'global']
      : ['global'];

  let chosen = null;
  for (const s of scopes) {
    const where = {
      scopeType: s,
      currency,
      minAmount: { [Op.lte]: amount },
      [Op.or]: [
        { maxAmount: null },
        { maxAmount: { [Op.gte]: amount } }
      ],
      [Op.and]: [
        { [Op.or]: [{ effectiveFrom: null }, { effectiveFrom: { [Op.lte]: today } }] },
        { [Op.or]: [{ effectiveTo:   null }, { effectiveTo:   { [Op.gte]: today } }] }
      ]
    };
    if (s !== 'global' && scopeId) where.scopeId = parseInt(scopeId, 10);
    chosen = await ProcurementThreshold.findOne({ where, order: [['minAmount', 'DESC']] });
    if (chosen) break;
  }

  res.json({ success: true, data: { threshold: chosen } });
});
