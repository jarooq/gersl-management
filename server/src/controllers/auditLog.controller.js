import { AuditLog, User } from '../models/index.js';
import { Op } from 'sequelize';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware.js';

const MAX_LIMIT = 200;

export const listAuditLogs = asyncHandler(async (req, res) => {
  const {
    entityType,
    entityId,
    userId,
    action,
    from,
    to,
    page = 1,
    limit = 50
  } = req.query;

  const lim = Math.min(parseInt(limit, 10) || 50, MAX_LIMIT);
  const offset = (Math.max(parseInt(page, 10) || 1, 1) - 1) * lim;

  const where = {};
  if (entityType) where.entityType = entityType;
  if (entityId) where.entityId = String(entityId);
  if (userId) where.userId = parseInt(userId, 10);
  if (action) where.action = action;
  if (from || to) {
    where.occurredAt = {};
    if (from) where.occurredAt[Op.gte] = new Date(from);
    if (to) where.occurredAt[Op.lte] = new Date(to);
  }

  const { rows, count } = await AuditLog.findAndCountAll({
    where,
    limit: lim,
    offset,
    order: [['occurredAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'actor',
        required: false,
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ]
  });

  res.json({
    success: true,
    data: rows,
    pagination: { page: parseInt(page, 10), limit: lim, total: count, pages: Math.ceil(count / lim) }
  });
});

export const getEntityHistory = asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  if (!entityType || !entityId) {
    throw new BadRequestError('entityType and entityId are required');
  }
  const rows = await AuditLog.findAll({
    where: { entityType, entityId: String(entityId) },
    order: [['occurredAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'actor',
        required: false,
        attributes: ['id', 'username', 'fullName', 'email', 'role']
      }
    ],
    limit: MAX_LIMIT
  });
  res.json({ success: true, data: rows });
});
