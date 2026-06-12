import { sequelize, ProjectBeneficiary, Beneficiary, Project } from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';
import { unique } from '../services/qrToken.service.js';

// ============================================
// PROJECT BENEFICIARY (QR ENROLMENT) CONTROLLER
// ============================================
// Direct project↔beneficiary enrolment. Each Active enrolment carries a
// unique QR token scanned at distribution events.

const beneficiaryInclude = {
  model: Beneficiary,
  as: 'beneficiary',
  attributes: ['id', 'fullName', 'beneficiaryId', 'gender', 'contactNumber', 'district', 'status']
};

// ============================================
// POST /api/projects/:projectId/beneficiaries
// Body: { beneficiaryIds: [1, 2, ...] }
// Bulk enrol — mints a unique QR token per beneficiary. Beneficiaries that
// already have an Active enrolment on this project are skipped, not errored,
// so the UI can submit mixed batches safely.
// ============================================
export const enroll = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const { beneficiaryIds } = req.body;

  if (!Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
    throw new ValidationError('beneficiaryIds must be a non-empty array');
  }

  const project = await Project.findByPk(projectId, { attributes: ['id'] });
  if (!project) throw new NotFoundError('Project not found');

  // De-dupe and sanitise the incoming ids.
  const ids = [...new Set(
    beneficiaryIds.map((v) => parseInt(v, 10)).filter((n) => Number.isInteger(n) && n > 0)
  )];
  if (ids.length === 0) throw new ValidationError('beneficiaryIds contains no valid ids');

  const found = await Beneficiary.findAll({ where: { id: ids }, attributes: ['id'] });
  const foundIds = new Set(found.map((b) => b.id));

  const active = await ProjectBeneficiary.findAll({
    where: { projectId, beneficiaryId: ids, status: 'Active' },
    attributes: ['beneficiaryId']
  });
  const alreadyActive = new Set(active.map((e) => e.beneficiaryId));

  const enrolments = [];
  const skipped = [];
  for (const beneficiaryId of ids) {
    if (!foundIds.has(beneficiaryId)) {
      skipped.push({ beneficiaryId, reason: 'Beneficiary not found' });
      continue;
    }
    if (alreadyActive.has(beneficiaryId)) {
      skipped.push({ beneficiaryId, reason: 'Already enrolled (Active) on this project' });
      continue;
    }
    const qrToken = await unique(ProjectBeneficiary, 'qrToken');
    const row = await ProjectBeneficiary.create({
      projectId,
      beneficiaryId,
      qrToken,
      status: 'Active',
      createdBy: req.user?.id || null
    });
    enrolments.push(row);
  }

  res.status(201).json({
    success: true,
    message: `Enrolled ${enrolments.length} beneficiar${enrolments.length === 1 ? 'y' : 'ies'}, skipped ${skipped.length}`,
    data: { enrolments, skipped }
  });
});

// ============================================
// GET /api/projects/:projectId/beneficiaries?page=&limit=&status=
// List enrolments (with beneficiary details + QR token), paginated.
// ============================================
export const list = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);

  const where = { projectId };
  if (req.query.status) where.status = req.query.status;

  const { rows, count } = await ProjectBeneficiary.findAndCountAll({
    where,
    include: [beneficiaryInclude],
    order: [['enrolledAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit
  });

  res.json({
    success: true,
    data: {
      enrolments: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    }
  });
});

// ============================================
// POST /api/project-beneficiaries/:id/regenerate-token
// Voids the existing token (status → 'Replaced') and creates a fresh Active
// row with a new token for the same project + beneficiary. Transactional so
// a beneficiary is never left without an Active enrolment mid-swap.
// ============================================
export const regenerateToken = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const fresh = await sequelize.transaction(async (t) => {
    const row = await ProjectBeneficiary.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) throw new NotFoundError('Enrolment not found');
    if (row.status !== 'Active') {
      throw new ValidationError(`Only Active enrolments can be regenerated (this one is ${row.status})`);
    }

    await row.update({ status: 'Replaced' }, { transaction: t });

    const qrToken = await unique(ProjectBeneficiary, 'qrToken');
    return ProjectBeneficiary.create({
      projectId: row.projectId,
      beneficiaryId: row.beneficiaryId,
      qrToken,
      status: 'Active',
      createdBy: req.user?.id || null
    }, { transaction: t });
  });

  const enrolment = await ProjectBeneficiary.findByPk(fresh.id, { include: [beneficiaryInclude] });
  res.status(201).json({ success: true, message: 'QR token regenerated', data: { enrolment } });
});

// ============================================
// PATCH /api/project-beneficiaries/:id/withdraw
// Marks the enrolment Withdrawn — its token stops scanning.
// ============================================
export const withdraw = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  const row = await ProjectBeneficiary.findByPk(id);
  if (!row) throw new NotFoundError('Enrolment not found');
  if (row.status === 'Withdrawn') {
    return res.json({ success: true, message: 'Enrolment already withdrawn', data: { enrolment: row } });
  }
  if (row.status !== 'Active') {
    throw new ValidationError(`Only Active enrolments can be withdrawn (this one is ${row.status})`);
  }

  await row.update({ status: 'Withdrawn' });
  res.json({ success: true, message: 'Enrolment withdrawn', data: { enrolment: row } });
});
