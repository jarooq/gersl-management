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

  const enrolment = await ProjectBeneficiary.findOne({
    where: { qrToken: String(token).trim().toUpperCase(), status: 'Active' },
    include: [{
      model: Beneficiary,
      as: 'beneficiary',
      attributes: ['id', 'fullName', 'beneficiaryId', 'gender', 'district']
    }]
  });
  if (!enrolment) throw new NotFoundError('No active enrolment found for this QR token');
  if (enrolment.projectId !== event.projectId) {
    throw new ValidationError('This QR code belongs to a different project than this event');
  }

  try {
    const created = await sequelize.transaction(async (t) =>
      DistributionScan.create({
        eventId: event.id,
        projectBeneficiaryId: enrolment.id,
        scannedBy: req.user?.id || null,
        scannedAt: new Date(),
        latitude: latitude != null && latitude !== '' ? latitude : null,
        longitude: longitude != null && longitude !== '' ? longitude : null,
        notes: notes || null,
        clientUuid: clientUuid || null
      }, { transaction: t })
    );

    return res.status(201).json({
      success: true,
      message: `Scan recorded for ${enrolment.beneficiary?.fullName || 'beneficiary'}`,
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
      // (event_id, project_beneficiary_id) duplicate — already served.
      const existing = await DistributionScan.findOne({
        where: { eventId: event.id, projectBeneficiaryId: enrolment.id },
        include: scanIncludes
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `${enrolment.beneficiary?.fullName || 'This beneficiary'} has already been scanned for this event`,
          data: { scan: existing, duplicate: true }
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
