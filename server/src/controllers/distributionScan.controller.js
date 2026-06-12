import {
  sequelize,
  DistributionScan,
  DistributionEvent,
  ProjectBeneficiary,
  Beneficiary,
  User
} from '../models/index.js';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// DISTRIBUTION SCAN CONTROLLER
// ============================================
// Records QR scans made by field staff at distribution events. Designed for
// offline-queue retries from mobile:
//   - clientUuid match            → 200 with the existing scan (safe retry)
//   - (event, beneficiary) dup    → 409 "already scanned" with existing scan
//   - fresh scan                  → 201

const scanIncludes = [
  {
    model: ProjectBeneficiary,
    as: 'enrolment',
    include: [{
      model: Beneficiary,
      as: 'beneficiary',
      attributes: ['id', 'fullName', 'beneficiaryId', 'gender', 'district']
    }]
  },
  { model: User, as: 'scanner', attributes: ['id', 'fullName'] }
];

const findByClientUuid = (clientUuid) =>
  DistributionScan.findOne({ where: { clientUuid }, include: scanIncludes });

// ============================================
// POST /api/distribution-scans
// Body: { token, eventId, latitude, longitude, notes, clientUuid }
// ============================================
export const scan = asyncHandler(async (req, res) => {
  const { token, eventId, latitude, longitude, notes, clientUuid } = req.body;

  if (!token || !eventId) throw new ValidationError('token and eventId are required');

  // Offline-queue retry: same clientUuid means this exact scan was already
  // accepted — hand it back so the mobile app can clear its queue item.
  if (clientUuid) {
    const prior = await findByClientUuid(clientUuid);
    if (prior) {
      return res.status(200).json({
        success: true,
        message: 'Scan already recorded (retry acknowledged)',
        data: { scan: prior, duplicate: true }
      });
    }
  }

  const event = await DistributionEvent.findByPk(eventId);
  if (!event) throw new NotFoundError('Distribution event not found');
  if (event.status === 'Closed') throw new ValidationError('This distribution event is closed');

  // Two ways to resolve an enrolment:
  //   1. Normal scan: the token is a 12-char QR code on a ProjectBeneficiary
  //      row (Active for this project).
  //   2. Manual entry (lost card): the mobile app sends `beneficiary:<id>`,
  //      meaning staff looked the person up by name in the beneficiary
  //      search. Resolve the active enrolment for this event's project.
  const rawToken = String(token || '').trim();
  const manualMatch = rawToken.match(/^beneficiary:(\d+)$/i);

  const includeBeneficiary = [{
    model: Beneficiary,
    as: 'beneficiary',
    attributes: ['id', 'fullName', 'beneficiaryId', 'gender', 'district']
  }];

  // Look up the enrolment WITHOUT filtering by status, so we can give a
  // precise error per state ('Distributed' / 'Replaced' / 'Withdrawn') rather
  // than the generic "no active enrolment". Order by id DESC so a Replaced
  // row never shadows a newer Active row for the same beneficiary.
  const enrolment = manualMatch
    ? await ProjectBeneficiary.findOne({
        where: {
          beneficiaryId: parseInt(manualMatch[1], 10),
          projectId: event.projectId,
        },
        include: includeBeneficiary,
        order: [['id', 'DESC']],
      })
    : await ProjectBeneficiary.findOne({
        where: { qrToken: rawToken.toUpperCase() },
        include: includeBeneficiary,
      });
  if (!enrolment) {
    throw new NotFoundError(
      manualMatch
        ? 'No enrolment found for this beneficiary in this event\'s project'
        : 'No enrolment found for this QR token'
    );
  }
  if (enrolment.projectId !== event.projectId) {
    throw new ValidationError('This QR code belongs to a different project than this event');
  }

  const who = enrolment.beneficiary?.fullName || 'This beneficiary';

  // Per-project "one aid, ever" rule. Enrolment transitions to 'Distributed'
  // after the successful scan below; a second scan attempt finds that status
  // and is rejected here with a precise message before we even touch the
  // distribution_scans table.
  if (enrolment.status === 'Distributed') {
    return res.status(409).json({
      success: false,
      message: `${who} has already received aid for this project`,
      data: { duplicate: true, alreadyAided: true, beneficiaryName: who }
    });
  }
  if (enrolment.status === 'Replaced') {
    throw new ValidationError('This QR code has been replaced — use the new card');
  }
  if (enrolment.status === 'Withdrawn') {
    throw new ValidationError('This beneficiary has been withdrawn from the project');
  }
  if (enrolment.status !== 'Active') {
    throw new ValidationError(`Enrolment status is ${enrolment.status}`);
  }

  try {
    // Insert the scan AND consume the enrolment in one transaction so a
    // concurrent second scan can't slip past the status check above.
    const created = await sequelize.transaction(async (t) => {
      const scan = await DistributionScan.create({
        eventId: event.id,
        projectBeneficiaryId: enrolment.id,
        scannedBy: req.user?.id || null,
        scannedAt: new Date(),
        latitude: latitude != null && latitude !== '' ? latitude : null,
        longitude: longitude != null && longitude !== '' ? longitude : null,
        notes: notes || null,
        clientUuid: clientUuid || null
      }, { transaction: t });
      await enrolment.update({ status: 'Distributed' }, { transaction: t });
      return scan;
    });

    return res.status(201).json({
      success: true,
      message: `Scan recorded for ${who}`,
      data: {
        scan: created,
        enrolment,
        beneficiaryName: enrolment.beneficiary?.fullName || null
      }
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      // Race on clientUuid: another retry of the same queue item won.
      if (clientUuid) {
        const prior = await findByClientUuid(clientUuid);
        if (prior) {
          return res.status(200).json({
            success: true,
            message: 'Scan already recorded (retry acknowledged)',
            data: { scan: prior, duplicate: true }
          });
        }
      }
      // Race on (project_beneficiary_id) — two concurrent scans for the same
      // enrolment both passed the status check before either committed. The
      // first one won; report 409 with whichever scan landed.
      const existing = await DistributionScan.findOne({
        where: { projectBeneficiaryId: enrolment.id },
        include: scanIncludes
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `${who} has already received aid for this project`,
          data: { scan: existing, duplicate: true, alreadyAided: true, beneficiaryName: who }
        });
      }
    }
    throw err;
  }
});

// ============================================
// GET /api/distribution-events/:id/scans?page=&limit=
// ============================================
export const listByEvent = asyncHandler(async (req, res) => {
  const eventId = parseInt(req.params.id, 10);
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);

  const event = await DistributionEvent.findByPk(eventId, { attributes: ['id'] });
  if (!event) throw new NotFoundError('Distribution event not found');

  const { rows, count } = await DistributionScan.findAndCountAll({
    where: { eventId },
    include: scanIncludes,
    order: [['scannedAt', 'DESC'], ['id', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true
  });

  res.json({
    success: true,
    data: {
      scans: rows,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
    }
  });
});
