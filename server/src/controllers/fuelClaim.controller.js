import {
  FuelClaim,
  FuelClaimPassenger,
  FuelRate,
  MovementLog,
  Vehicle,
  User
} from '../models/index.js';
import sequelize from '../config/database.js';
import { Op } from 'sequelize';
import {
  asyncHandler,
  BadRequestError,
  NotFoundError,
  ConflictError,
  ForbiddenError
} from '../middleware/error.middleware.js';

const claimInclude = [
  { model: User,        as: 'staff',    attributes: ['id', 'fullName', 'role', 'email'] },
  { model: User,        as: 'approver', attributes: ['id', 'fullName', 'role'] },
  { model: MovementLog, as: 'movement' },
  { model: Vehicle,     as: 'vehicle' },
  { model: FuelRate,    as: 'fuelRate' },
  { model: FuelClaim,   as: 'primaryClaim', attributes: ['id', 'userId', 'status'] },
  { model: FuelClaimPassenger, as: 'passengers',
    include: [{ model: User, as: 'passenger', attributes: ['id', 'fullName'] }] }
];

const APPROVE_ROLES = [
  'Admin', 'CEO', 'Director Programmes',
  'Programme Manager', 'HR Manager', 'Finance Manager', 'Procurement Manager'
];

const isApprover = (u) => APPROVE_ROLES.includes(u?.role);

// Lunch policy: 12:30 - 13:30 (60 min). If movement spans this window, deduct
// pro-rated km. Bypassed when bypassLunchReason is provided.
const lunchOverlapMinutes = (startISO, endISO) => {
  if (!startISO || !endISO) return 0;
  const start = new Date(startISO);
  const end = new Date(endISO);
  if (!(start < end)) return 0;
  // Walk day-by-day; the movement could span days.
  let total = 0;
  const day = new Date(start);
  day.setHours(0, 0, 0, 0);
  while (day < end) {
    const lunchStart = new Date(day);
    lunchStart.setHours(12, 30, 0, 0);
    const lunchEnd = new Date(day);
    lunchEnd.setHours(13, 30, 0, 0);
    const overlapStart = lunchStart > start ? lunchStart : start;
    const overlapEnd   = lunchEnd   < end   ? lunchEnd   : end;
    if (overlapEnd > overlapStart) {
      total += (overlapEnd - overlapStart) / 60000;
    }
    day.setDate(day.getDate() + 1);
  }
  return Math.max(0, Math.round(total));
};

const findApplicableRate = async (vehicleType, onDate) => {
  const date = onDate ? new Date(onDate) : new Date();
  const dateStr = date.toISOString().slice(0, 10);
  return FuelRate.findOne({
    where: {
      vehicleType,
      effectiveFrom: { [Op.lte]: dateStr },
      [Op.or]: [{ effectiveTo: null }, { effectiveTo: { [Op.gte]: dateStr } }]
    },
    order: [['effectiveFrom', 'DESC']]
  });
};

const computeDuplicateOverlap = async (movement) => {
  // Returns potential matching claims/movements that look like the same trip
  // performed by another staff member around the same time on the same route.
  if (!movement.departureAt || !movement.returnAt) return [];
  const window = 30 * 60 * 1000; // 30 min tolerance either side
  const start = new Date(new Date(movement.departureAt).getTime() - window);
  const end   = new Date(new Date(movement.returnAt).getTime()   + window);

  const others = await MovementLog.findAll({
    where: {
      id: { [Op.ne]: movement.id },
      userId: { [Op.ne]: movement.userId },
      status: { [Op.in]: ['Returned', 'Arrived'] },
      fromLocation: movement.fromLocation,
      toLocation: movement.toLocation,
      departureAt: { [Op.lte]: end },
      returnAt:    { [Op.gte]: start }
    },
    include: [
      { model: User,    as: 'staff',   attributes: ['id', 'fullName'] },
      { model: Vehicle, as: 'vehicle', attributes: ['id', 'type', 'plateNo'] },
      { model: FuelClaim, as: 'fuelClaim', attributes: ['id', 'status', 'netAmount', 'currency', 'userId'] }
    ]
  });

  // Score: same route + bike type + ≥80% time overlap
  const movementMs = new Date(movement.returnAt) - new Date(movement.departureAt);
  return others.map(o => {
    const overlapStart = new Date(Math.max(new Date(o.departureAt), new Date(movement.departureAt)));
    const overlapEnd   = new Date(Math.min(new Date(o.returnAt),    new Date(movement.returnAt)));
    const overlapMs = Math.max(0, overlapEnd - overlapStart);
    const overlapPct = movementMs > 0 ? (overlapMs / movementMs) * 100 : 0;
    const sameVehicleType = movement.vehicle?.type && o.vehicle?.type
      ? movement.vehicle.type === o.vehicle.type
      : null;
    return {
      otherMovementId: o.id,
      otherUserId: o.userId,
      otherUserName: o.staff?.fullName,
      otherVehicle: o.vehicle ? { id: o.vehicle.id, type: o.vehicle.type, plateNo: o.vehicle.plateNo } : null,
      sameVehicleType,
      overlapPct: Number(overlapPct.toFixed(1)),
      otherClaimId: o.fuelClaim?.id || null,
      otherClaimStatus: o.fuelClaim?.status || null
    };
  }).filter(d => d.overlapPct >= 80);
};

// ============================================
// LIST
// ============================================
export const listClaims = asyncHandler(async (req, res) => {
  const { scope = 'mine', status, flagged } = req.query;
  const where = {};
  if (status) where.status = status;
  if (scope === 'mine') where.userId = req.user.id;
  if (scope === 'pending') {
    if (!isApprover(req.user)) throw new ForbiddenError('Only managers can see pending fuel claims');
    where.status = 'Submitted';
  }
  // Flagged filter — only available to approvers. Used by the HR review
  // screen to surface claims with fraud-detection signals.
  if (flagged === 'true' || flagged === '1') {
    if (!isApprover(req.user)) throw new ForbiddenError('Approvers only');
    where.flaggedAt = { [Op.ne]: null };
  }
  if (scope === 'all' && !['Admin', 'CEO', 'Finance Manager'].includes(req.user.role)) {
    throw new ForbiddenError('Only Admin / CEO / Finance Manager can list all claims');
  }

  const rows = await FuelClaim.findAll({
    where,
    include: claimInclude,
    order: [['createdAt', 'DESC']]
  });
  res.json({ success: true, data: { claims: rows } });
});

export const getClaim = asyncHandler(async (req, res) => {
  const c = await FuelClaim.findByPk(req.params.id, { include: claimInclude });
  if (!c) throw new NotFoundError('Fuel claim not found');
  res.json({ success: true, data: { claim: c } });
});

// ============================================
// DERIVE — auto-create a draft fuel claim from a Returned movement
// Body: { movementId, distanceKm?, bypassLunchReason? }
// ============================================
export const deriveClaim = asyncHandler(async (req, res) => {
  const { movementId, distanceKm, bypassLunchReason } = req.body || {};
  if (!movementId) throw new BadRequestError('movementId is required');

  const movement = await MovementLog.findByPk(movementId, { include: [{ model: Vehicle, as: 'vehicle' }] });
  if (!movement) throw new NotFoundError('Movement not found');
  if (movement.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the movement owner can derive a fuel claim');
  }
  if (movement.isPassenger) {
    throw new BadRequestError('Passenger movements are linked to the rider\'s claim, not their own');
  }
  if (!['Returned', 'Arrived'].includes(movement.status)) {
    throw new BadRequestError(`Movement must be Returned (current: ${movement.status})`);
  }
  const km = Number(distanceKm ?? movement.distanceKm);
  if (!Number.isFinite(km) || km <= 0) {
    throw new BadRequestError('distanceKm must be > 0');
  }
  const vehicleType = movement.vehicle?.type || 'Bike';
  if (vehicleType === 'PublicTransport') {
    throw new BadRequestError('Public transport claims are flat-amount; not supported here');
  }

  const existing = await FuelClaim.findOne({ where: { movementId: movement.id } });
  if (existing) throw new ConflictError(`Fuel claim ${existing.id} already exists for this movement`);

  const rate = await findApplicableRate(vehicleType, movement.departureAt || movement.createdAt);
  if (!rate) {
    throw new BadRequestError(`No active fuel rate configured for ${vehicleType} on the trip date`);
  }

  // Lunch deduction: pro-rated km * rate, unless bypassed.
  let lunchDeductedKm = 0;
  if (!bypassLunchReason) {
    const overlap = lunchOverlapMinutes(movement.departureAt, movement.returnAt);
    if (overlap > 0) {
      const totalMin = (new Date(movement.returnAt) - new Date(movement.departureAt)) / 60000;
      if (totalMin > 0) {
        lunchDeductedKm = Number(((overlap / totalMin) * km).toFixed(2));
      }
    }
  }
  const claimableKm = Math.max(0, km - lunchDeductedKm);
  const grossAmount = Number((km * Number(rate.ratePerKm)).toFixed(2));
  const lunchDeduction = Number((lunchDeductedKm * Number(rate.ratePerKm)).toFixed(2));
  const netAmount = Number((claimableKm * Number(rate.ratePerKm)).toFixed(2));

  const t = await sequelize.transaction();
  try {
    const claim = await FuelClaim.create({
      userId: movement.userId,
      movementId: movement.id,
      vehicleId: movement.vehicleId,
      vehicleType,
      distanceKm: km,
      ratePerKm: rate.ratePerKm,
      fuelRateId: rate.id,
      currency: rate.currency,
      grossAmount,
      lunchDeduction,
      netAmount,
      bypassLunchReason: bypassLunchReason || null,
      status: 'Draft'
    }, { transaction: t });

    // Auto-attach passenger movements that were registered against this trip.
    const passengerMovements = await MovementLog.findAll({
      where: { primaryMovementId: movement.id, isPassenger: true },
      transaction: t
    });
    if (passengerMovements.length > 0) {
      await FuelClaimPassenger.bulkCreate(
        passengerMovements.map(p => ({
          fuelClaimId: claim.id,
          passengerUserId: p.userId,
          passengerMovementId: p.id,
          sharePct: 0
        })),
        { transaction: t }
      );
    }

    await t.commit();
    const reloaded = await FuelClaim.findByPk(claim.id, { include: claimInclude });
    res.status(201).json({ success: true, data: { claim: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// DUPLICATE CHECK
// ============================================
export const duplicateCheck = asyncHandler(async (req, res) => {
  const claim = await FuelClaim.findByPk(req.params.id, { include: [{ model: MovementLog, as: 'movement', include: [{ model: Vehicle, as: 'vehicle' }] }] });
  if (!claim) throw new NotFoundError('Fuel claim not found');
  const overlaps = await computeDuplicateOverlap(claim.movement);
  res.json({ success: true, data: { overlaps } });
});

// ============================================================================
// Fraud detection — runs on submit. Returns { hardBlock, flags } where:
//
//   hardBlock: { kind, message }   — throws 409, claim stays Draft
//   flags:     [{ kind, ... }, ...] — persisted to flag_reasons,
//                                     claim is Submitted but visible in
//                                     the HR review queue
//
// Rules (defaults locked in with the user):
//   HARD blocks:
//     - same vehicle + same date already submitted/approved/paid by anyone
//     - claimant is already listed as a passenger on another date-matching claim
//     - claimant has another submitted/approved claim on the same date (self-duplicate)
//   SOFT flags:
//     - route overlap with another user's same-day claim (existing 30-min window
//       + 80% time-overlap logic) — already implemented; we now persist results
//     - vehicle.ownerUserId is set and claimant is not that user
//
// Reviewers see the flags inline on the HR review screen and can approve
// with note (override), reject, or merge into the primary claim.
// ============================================================================
const runFraudChecks = async (claim, movement) => {
  const flags = [];
  const claimDate = movement.departureAt
    ? new Date(movement.departureAt).toISOString().slice(0, 10)
    : null;

  // HARD #1 — same vehicle + same date already claimed by anyone else.
  if (claim.vehicleId && claimDate) {
    const sameVehicleSameDay = await FuelClaim.findAll({
      where: {
        id:        { [Op.ne]: claim.id },
        vehicleId: claim.vehicleId,
        status:    { [Op.in]: ['Submitted', 'Approved', 'Paid'] },
      },
      include: [{
        model: MovementLog, as: 'movement', required: true,
        where: sequelize.where(
          sequelize.fn('DATE', sequelize.col('movement.departure_at')),
          claimDate
        ),
      }, { model: User, as: 'staff', attributes: ['id', 'fullName'] }],
    });
    if (sameVehicleSameDay.length > 0) {
      const other = sameVehicleSameDay[0];
      return {
        hardBlock: {
          kind: 'same_vehicle_same_date',
          message: `Vehicle already has a fuel claim on ${claimDate} by ` +
                   `${other.staff?.fullName || 'another user'} ` +
                   `(claim #${other.id}, status: ${other.status}). ` +
                   `Add yourself as a passenger to that claim instead.`,
          otherClaimId: other.id,
          otherUserId:  other.userId,
        },
        flags: [],
      };
    }
  }

  // HARD #2 — claimant is already declared as a passenger on another claim
  // for the same date.
  if (claimDate) {
    const asPassenger = await FuelClaimPassenger.findAll({
      where: { passengerUserId: claim.userId },
      include: [{
        model: FuelClaim, as: 'fuelClaim', required: true,
        where: {
          id: { [Op.ne]: claim.id },
          status: { [Op.in]: ['Submitted', 'Approved', 'Paid'] },
        },
        include: [{
          model: MovementLog, as: 'movement', required: true,
          where: sequelize.where(
            sequelize.fn('DATE', sequelize.col('fuelClaim->movement.departure_at')),
            claimDate
          ),
        }, { model: User, as: 'staff', attributes: ['id', 'fullName'] }],
      }],
    });
    if (asPassenger.length > 0) {
      const p = asPassenger[0].fuelClaim;
      return {
        hardBlock: {
          kind: 'already_a_passenger',
          message: `You are already a passenger on claim #${p.id} ` +
                   `(${p.staff?.fullName}, ${claimDate}). One claim per trip.`,
          otherClaimId: p.id,
          otherUserId:  p.userId,
        },
        flags: [],
      };
    }
  }

  // HARD #3 — same user, multiple claims same date.
  if (claimDate) {
    const selfDup = await FuelClaim.findAll({
      where: {
        id:     { [Op.ne]: claim.id },
        userId: claim.userId,
        status: { [Op.in]: ['Submitted', 'Approved', 'Paid'] },
      },
      include: [{
        model: MovementLog, as: 'movement', required: true,
        where: sequelize.where(
          sequelize.fn('DATE', sequelize.col('movement.departure_at')),
          claimDate
        ),
      }],
    });
    if (selfDup.length > 0) {
      // Not strictly fraud — two trips in one day can be legit — but worth
      // flagging for review rather than blocking. Demoted to a soft flag.
      flags.push({
        kind: 'multiple_claims_same_day',
        otherClaimIds: selfDup.map(c => c.id),
        message: `Multiple claims on ${claimDate}`,
      });
    }
  }

  // SOFT — vehicle has an owner and claimant is not them.
  if (claim.vehicleId) {
    const vehicle = await Vehicle.findByPk(claim.vehicleId,
      { attributes: ['id', 'ownerUserId', 'plateNo', 'isPersonal'] });
    if (vehicle?.ownerUserId && vehicle.ownerUserId !== claim.userId) {
      flags.push({
        kind: 'not_vehicle_owner',
        vehicleId: vehicle.id,
        vehiclePlateNo: vehicle.plateNo,
        ownerUserId: vehicle.ownerUserId,
        message: 'Claimant is not the registered owner of this vehicle',
      });
    }
  }

  // SOFT — route overlap with another user's same-day claim (≥80% time overlap).
  // Reuses existing helper; persists the result so reviewer can see it.
  const overlaps = await computeDuplicateOverlap(movement);
  for (const o of overlaps) {
    flags.push({
      kind: 'route_overlap_other_user',
      otherUserId:   o.otherUserId,
      otherUserName: o.otherUserName,
      otherClaimId:  o.otherClaimId,
      otherClaimStatus: o.otherClaimStatus,
      overlapPct:    o.overlapPct,
      sameVehicleType: o.sameVehicleType,
      message: `Route overlaps ${o.overlapPct}% with ${o.otherUserName}'s same-day claim`,
    });
  }

  return { hardBlock: null, flags };
};

// ============================================
// SUBMIT (Draft -> Submitted)
// ============================================
export const submitClaim = asyncHandler(async (req, res) => {
  const c = await FuelClaim.findByPk(req.params.id, {
    include: [{ model: MovementLog, as: 'movement', include: [{ model: Vehicle, as: 'vehicle' }] }],
  });
  if (!c) throw new NotFoundError('Fuel claim not found');
  if (c.userId !== req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only the claimant can submit');
  }
  if (c.status !== 'Draft') throw new ConflictError(`Cannot submit a ${c.status} claim`);

  // Fraud detection. Hard blocks throw and the claim stays in Draft so the
  // user can fix (e.g. join the existing claim as a passenger).
  const { hardBlock, flags } = await runFraudChecks(c, c.movement);
  if (hardBlock) {
    throw new ConflictError(hardBlock.message);
  }

  await c.update({
    status: 'Submitted',
    flagReasons: flags.length > 0 ? flags : null,
    flaggedAt:   flags.length > 0 ? new Date() : null,
  });
  const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
  res.json({ success: true, data: { claim: reloaded, flags } });
});

// ============================================
// APPROVE
// ============================================
export const approveClaim = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) throw new ForbiddenError('Your role cannot approve fuel claims');
  const c = await FuelClaim.findByPk(req.params.id);
  if (!c) throw new NotFoundError('Fuel claim not found');
  if (c.status !== 'Submitted') throw new ConflictError(`Cannot approve a ${c.status} claim`);
  if (c.userId === req.user.id && req.user.role !== 'Admin') {
    throw new ForbiddenError('Cannot approve your own claim');
  }
  await c.update({ status: 'Approved', approvedBy: req.user.id, approvedAt: new Date() });
  const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
  res.json({ success: true, data: { claim: reloaded } });
});

// ============================================
// REJECT
// ============================================
export const rejectClaim = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) throw new ForbiddenError('Your role cannot reject fuel claims');
  const { reason } = req.body || {};
  if (!reason) throw new BadRequestError('reason is required');
  const c = await FuelClaim.findByPk(req.params.id);
  if (!c) throw new NotFoundError('Fuel claim not found');
  if (c.status !== 'Submitted') throw new ConflictError(`Cannot reject a ${c.status} claim`);
  await c.update({
    status: 'Rejected',
    approvedBy: req.user.id,
    approvedAt: new Date(),
    rejectionReason: reason
  });
  const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
  res.json({ success: true, data: { claim: reloaded } });
});

// ============================================
// MERGE — link a passenger claim into a primary rider claim
// Body: { primaryClaimId, sharePct? } where this claim becomes Merged
// ============================================
export const mergeClaim = asyncHandler(async (req, res) => {
  if (!isApprover(req.user) && req.user.role !== 'Admin') {
    throw new ForbiddenError('Only managers can merge fuel claims');
  }
  const { primaryClaimId, sharePct = 0 } = req.body || {};
  if (!primaryClaimId) throw new BadRequestError('primaryClaimId is required');

  const c = await FuelClaim.findByPk(req.params.id);
  if (!c) throw new NotFoundError('Fuel claim not found');
  if (c.status === 'Paid' || c.status === 'Merged') {
    throw new ConflictError(`Cannot merge a ${c.status} claim`);
  }
  const primary = await FuelClaim.findByPk(primaryClaimId);
  if (!primary || primary.id === c.id) throw new BadRequestError('primaryClaimId is invalid');
  if (primary.status === 'Rejected' || primary.status === 'Cancelled') {
    throw new BadRequestError('Cannot merge into a rejected/cancelled claim');
  }

  const t = await sequelize.transaction();
  try {
    await c.update({ status: 'Merged', primaryClaimId: primary.id }, { transaction: t });
    // Track passenger record on the primary so the trail is visible.
    await FuelClaimPassenger.findOrCreate({
      where: { fuelClaimId: primary.id, passengerUserId: c.userId },
      defaults: {
        fuelClaimId: primary.id,
        passengerUserId: c.userId,
        passengerMovementId: c.movementId,
        sharePct: Number(sharePct) || 0
      },
      transaction: t
    });
    await t.commit();
    const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
    res.json({ success: true, data: { claim: reloaded } });
  } catch (err) {
    if (!t.finished) await t.rollback();
    throw err;
  }
});

// ============================================
// CANCEL
// ============================================
export const cancelClaim = asyncHandler(async (req, res) => {
  const c = await FuelClaim.findByPk(req.params.id);
  if (!c) throw new NotFoundError('Fuel claim not found');
  const isOwner = c.userId === req.user.id;
  if (!isOwner && !isApprover(req.user)) {
    throw new ForbiddenError('Only the claimant or a manager can cancel');
  }
  if (['Paid', 'Cancelled', 'Rejected', 'Merged'].includes(c.status)) {
    throw new ConflictError(`Cannot cancel a ${c.status} claim`);
  }
  await c.update({ status: 'Cancelled' });
  const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
  res.json({ success: true, data: { claim: reloaded } });
});

// ============================================
// REVIEW FLAGS — approver acknowledges or clears fraud flags
//
// PATCH /api/fuel-claims/:id/review-flags
// Body: { notes }
//
// Sets reviewedBy/reviewedAt/reviewNotes but DOES NOT change status. The
// approver then either approves, rejects, or merges through the existing
// actions. This split lets HR maintain a defensible trail: "I saw the flag,
// I noted it, I made this decision."
// ============================================
export const reviewFlags = asyncHandler(async (req, res) => {
  if (!isApprover(req.user)) throw new ForbiddenError('Approvers only');
  const c = await FuelClaim.findByPk(req.params.id);
  if (!c) throw new NotFoundError('Fuel claim not found');
  if (!c.flaggedAt) throw new BadRequestError('This claim has no flags to review');
  const notes = (req.body?.notes || '').toString().trim();
  if (!notes) throw new BadRequestError('Review notes are required');
  await c.update({
    reviewedBy:  req.user.id,
    reviewedAt:  new Date(),
    reviewNotes: notes,
  });
  const reloaded = await FuelClaim.findByPk(c.id, { include: claimInclude });
  res.json({ success: true, data: { claim: reloaded } });
});
