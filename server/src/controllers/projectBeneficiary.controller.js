import { sequelize, ProjectBeneficiary, Beneficiary, Project, DistributionEvent, DistributionScan } from '../models/index.js';
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

// ============================================
// GET /api/projects/:projectId/distribution-stats
// Aggregate progress numbers for the project's distribution flow —
// enrolment status counts, event lifecycle counts, and scan totals
// (both raw scans and distinct beneficiaries served).
//
// Powers the DistributionProgressCard on the Project detail page.
// One query per aggregate for clarity; each is cheap because they're
// indexed count queries — no rows selected.
// ============================================
export const stats = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new ValidationError('Invalid project id');
  }
  const project = await Project.findByPk(projectId, { attributes: ['id'] });
  if (!project) throw new NotFoundError('Project not found');

  // Enrolment breakdown by status.
  const enrolmentRows = await ProjectBeneficiary.findAll({
    where: { projectId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });
  const enrolments = { total: 0, active: 0, withdrawn: 0, replaced: 0 };
  for (const r of enrolmentRows) {
    const count = parseInt(r.count, 10);
    enrolments.total += count;
    if (r.status === 'Active')    enrolments.active += count;
    if (r.status === 'Withdrawn') enrolments.withdrawn += count;
    if (r.status === 'Replaced')  enrolments.replaced += count;
  }

  // Event breakdown by status.
  const eventRows = await DistributionEvent.findAll({
    where: { projectId },
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    group: ['status'],
    raw: true,
  });
  const events = { total: 0, planned: 0, active: 0, closed: 0 };
  for (const r of eventRows) {
    const count = parseInt(r.count, 10);
    events.total += count;
    if (r.status === 'Planned') events.planned += count;
    if (r.status === 'Active')  events.active  += count;
    if (r.status === 'Closed')  events.closed  += count;
  }

  // Scans — need event ids first, then two counts on scans.
  const eventIds = (await DistributionEvent.findAll({
    where: { projectId },
    attributes: ['id'],
    raw: true,
  })).map((e) => e.id);

  let totalScans = 0;
  let beneficiariesServed = 0;
  let scannedEnrolmentIds = [];
  if (eventIds.length > 0) {
    totalScans = await DistributionScan.count({ where: { eventId: eventIds } });
    // Fetch DISTINCT scanned enrolment ids — used to compute served count
    // AND the per-district breakdown below.
    const scannedRows = await DistributionScan.findAll({
      where: { eventId: eventIds },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('projectBeneficiaryId')), 'projectBeneficiaryId'],
      ],
      raw: true,
    });
    scannedEnrolmentIds = scannedRows.map((r) => r.projectBeneficiaryId).filter(Boolean);
    beneficiariesServed = scannedEnrolmentIds.length;
  }

  // Coverage — served / active enrolment. Guarded against div/0.
  const coveragePct = enrolments.active > 0
    ? Math.round((beneficiariesServed / enrolments.active) * 1000) / 10
    : 0;

  // Per-event scan counts + per-district coverage — the two breakdowns
  // that let a manager see which event is drawing crowds and which
  // districts are lagging.
  let byEvent = [];
  if (eventIds.length > 0) {
    // Single query: LEFT JOIN scans onto events, group by event.id.
    // Sequelize `attributes: [[fn(...), alias]]` + `include` mode is the
    // shortest way; separate queries would be clearer but N+1 for lots
    // of events.
    const eventRowsRaw = await DistributionEvent.findAll({
      where: { projectId },
      attributes: [
        'id', 'name', 'scheduledDate', 'location', 'status',
        [sequelize.fn('COUNT', sequelize.col('scans.id')), 'scanCount'],
      ],
      include: [{
        model: DistributionScan,
        as: 'scans',
        attributes: [],
        required: false,
      }],
      group: ['DistributionEvent.id'],
      order: [['scheduledDate', 'DESC'], ['id', 'DESC']],
      raw: true,
      subQuery: false,
    });
    byEvent = eventRowsRaw.map((r) => ({
      id: r.id,
      name: r.name,
      scheduledDate: r.scheduledDate,
      location: r.location,
      status: r.status,
      scanCount: parseInt(r.scanCount, 10) || 0,
    }));
  }

  // Per-district: group active enrolments by beneficiary.district and
  // count how many of those enrolments have been scanned.
  const districtRowsRaw = await ProjectBeneficiary.findAll({
    where: { projectId, status: 'Active' },
    attributes: [
      [sequelize.col('beneficiary.district'), 'district'],
      [sequelize.fn('COUNT', sequelize.col('ProjectBeneficiary.id')), 'active'],
    ],
    include: [{
      model: Beneficiary,
      as: 'beneficiary',
      attributes: [],
    }],
    group: ['beneficiary.district'],
    raw: true,
  });
  const districtActive = new Map();
  for (const r of districtRowsRaw) {
    const key = r.district || 'Unknown';
    districtActive.set(key, parseInt(r.active, 10) || 0);
  }
  // Scanned per district — need to count distinct scanned enrolments per
  // beneficiary.district.
  const scannedByDistrict = new Map();
  if (eventIds.length > 0 && scannedEnrolmentIds.length > 0) {
    // Fetch just the scanned enrolments with their beneficiary district
    // (we already have the ids; enrich in one query).
    const scannedRows = await ProjectBeneficiary.findAll({
      where: { id: scannedEnrolmentIds },
      attributes: [[sequelize.col('beneficiary.district'), 'district']],
      include: [{ model: Beneficiary, as: 'beneficiary', attributes: [] }],
      raw: true,
    });
    for (const r of scannedRows) {
      const key = r.district || 'Unknown';
      scannedByDistrict.set(key, (scannedByDistrict.get(key) || 0) + 1);
    }
  }
  const byDistrict = [...districtActive.entries()]
    .map(([district, active]) => {
      const served = scannedByDistrict.get(district) || 0;
      const pct = active > 0 ? Math.round((served / active) * 1000) / 10 : 0;
      return { district, active, served, remaining: Math.max(active - served, 0), coveragePct: pct };
    })
    .sort((a, b) => b.active - a.active);

  res.json({
    success: true,
    data: {
      projectId,
      enrolments,
      events,
      scans: {
        totalScans,
        beneficiariesServed,
        remaining: Math.max(enrolments.active - beneficiariesServed, 0),
        coveragePct,
      },
      byEvent,
      byDistrict,
    },
  });
});

// ============================================
// GET /api/projects/:projectId/unreached-beneficiaries?page=&limit=
// The list version of the "remaining" number on the progress card:
// active enrolments that don't yet have a scan against any of this
// project's distribution events. Managers use it to call/visit
// families who haven't shown up.
// ============================================
export const unreached = asyncHandler(async (req, res) => {
  const projectId = parseInt(req.params.projectId, 10);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new ValidationError('Invalid project id');
  }
  const project = await Project.findByPk(projectId, { attributes: ['id'] });
  if (!project) throw new NotFoundError('Project not found');

  const page  = Math.max(parseInt(req.query.page,  10) || 1,  1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

  // Collect this project's event ids so we can look up scanned enrolments.
  const eventIds = (await DistributionEvent.findAll({
    where: { projectId },
    attributes: ['id'],
    raw: true,
  })).map((e) => e.id);

  // enrolments that have been scanned at least once for this project.
  let scannedEnrolmentIds = [];
  if (eventIds.length > 0) {
    const rows = await DistributionScan.findAll({
      where: { eventId: eventIds },
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('projectBeneficiaryId')), 'projectBeneficiaryId'],
      ],
      raw: true,
    });
    scannedEnrolmentIds = rows.map((r) => r.projectBeneficiaryId).filter(Boolean);
  }

  const { Op } = await import('sequelize');
  const where = { projectId, status: 'Active' };
  if (scannedEnrolmentIds.length > 0) {
    where.id = { [Op.notIn]: scannedEnrolmentIds };
  }

  const { rows, count } = await ProjectBeneficiary.findAndCountAll({
    where,
    include: [beneficiaryInclude],
    order: [['enrolledAt', 'ASC'], ['id', 'ASC']],
    limit,
    offset: (page - 1) * limit,
  });

  res.json({
    success: true,
    data: {
      enrolments: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
    },
  });
});
