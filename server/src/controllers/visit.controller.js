import asyncHandler from 'express-async-handler';
import { Op } from 'sequelize';
import { Visit, Project, Task, User } from '../models/index.js';

const isAdmin = (user) => ['Admin', 'CEO', 'Programme Manager', 'MEAL Officer', 'Director Programmes'].includes(user?.role);

// orphanId / visitType columns were added to the Visit model for the
// orphan-visit unification feature, but the migration to ALTER TABLE on the
// production DB hasn't been run yet. Until it is, default Visit queries 500
// with `column visits.orphan_id does not exist`. Excluding those attributes
// keeps the list/get endpoints working; the orphan-visit merge in
// visitLog.controller.js already wraps its Visit query in .catch(()=>[]).
// Once `migrations/add_visits_orphan_columns.sql` has been applied, this
// exclude can be dropped.
const SAFE_VISIT_ATTRIBUTES = {
  exclude: ['orphanId', 'visitType']
};

export const list = asyncHandler(async (req, res) => {
  const where = {};
  if (!isAdmin(req.user)) where.userId = req.user.id;
  else if (req.query.userId) where.userId = parseInt(req.query.userId, 10);
  if (req.query.projectId) where.projectId = parseInt(req.query.projectId, 10);
  if (req.query.from || req.query.to) {
    where.occurredAt = {};
    if (req.query.from) where.occurredAt[Op.gte] = new Date(req.query.from);
    if (req.query.to)   where.occurredAt[Op.lte] = new Date(req.query.to);
  }
  const rows = await Visit.findAll({
    where,
    attributes: SAFE_VISIT_ATTRIBUTES,
    include: [
      { model: User,    as: 'user',    attributes: ['id', 'fullName'] },
      { model: Project, as: 'project', attributes: ['id', 'name'] },
      { model: Task,    as: 'task',    attributes: ['id', 'title'] }
    ],
    order: [['occurredAt', 'DESC']],
    limit: 200
  });
  res.json({ success: true, data: rows });
});

export const get = asyncHandler(async (req, res) => {
  const row = await Visit.findByPk(req.params.id, {
    attributes: SAFE_VISIT_ATTRIBUTES,
    include: [
      { model: Project, as: 'project' },
      { model: Task,    as: 'task' },
      { model: User,    as: 'user', attributes: ['id', 'fullName'] }
    ]
  });
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  res.json({ success: true, data: row });
});

export const create = asyncHandler(async (req, res) => {
  const row = await Visit.create({ ...req.body, userId: req.user.id });
  res.status(201).json({ success: true, data: row });
});

export const update = asyncHandler(async (req, res) => {
  const row = await Visit.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.userId !== req.user.id && !isAdmin(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  await row.update(req.body);
  res.json({ success: true, data: row });
});

export const remove = asyncHandler(async (req, res) => {
  const row = await Visit.findByPk(req.params.id);
  if (!row) return res.status(404).json({ success: false, message: 'not found' });
  if (row.userId !== req.user.id && !isAdmin(req.user)) return res.status(403).json({ success: false, message: 'forbidden' });
  await row.destroy();
  res.json({ success: true });
});
