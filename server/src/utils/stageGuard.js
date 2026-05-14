// =============================================================================
// Stage transition guards — shared by WASH and IGP item stage updates.
//
// Audit findings closed here:
//   - Stages could be skipped (Ordered → HandedOver, never Surveyed).
//   - Photos/GPS were optional even at HandedOver / Delivered.
//   - Any field officer could update items assigned to other supervisors.
//   - Geofence wasn't checked against beneficiary household coordinates.
//
// Geofence is a SOFT warning (does not block) — programme staff sometimes
// have to capture from the field office for connectivity reasons. The
// X-Geofence-Warning response header surfaces the discrepancy to the UI.
// =============================================================================

import { isFullView } from './programmeAccess.js';

// Crude haversine — same one used in movementAnalyzer, copied here to avoid
// a cross-module dependency. Returns metres.
const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6_371_000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const GEOFENCE_METERS = 500; // Generous — beneficiary coords are often rough.

/**
 * Ensure newStage is strictly forward in STAGE_ORDER (or Cancelled, which
 * can happen at any point). Throws on attempts to skip stages.
 */
export const assertStageForward = ({ STAGE_ORDER, currentStage, newStage }) => {
  if (newStage === 'Cancelled') return; // cancellation may happen anytime
  const fromIdx = STAGE_ORDER.indexOf(currentStage);
  const toIdx = STAGE_ORDER.indexOf(newStage);
  if (toIdx === -1) {
    const err = new Error(`Unknown stage: ${newStage}`);
    err.statusCode = 400;
    throw err;
  }
  if (toIdx < fromIdx) {
    const err = new Error(
      `Cannot move backwards from "${currentStage}" to "${newStage}".`
    );
    err.statusCode = 400;
    throw err;
  }
  if (toIdx > fromIdx + 1) {
    const expected = STAGE_ORDER[fromIdx + 1];
    const err = new Error(
      `Cannot skip stages — current "${currentStage}", next allowed "${expected}", got "${newStage}".`
    );
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Photo + GPS evidence is required at the named "evidence-critical" stages.
 * Caller passes the list; helper throws if photos array is empty or lat/lng
 * are null at one of those stages.
 */
export const assertEvidenceForStage = ({ newStage, evidenceStages, photoUrls, latitude, longitude }) => {
  if (!evidenceStages.includes(newStage)) return;
  if (!Array.isArray(photoUrls) || photoUrls.length === 0) {
    const err = new Error(`Stage "${newStage}" requires at least one photo as evidence.`);
    err.statusCode = 400;
    throw err;
  }
  if (latitude == null || longitude == null) {
    const err = new Error(`Stage "${newStage}" requires GPS coordinates (latitude/longitude).`);
    err.statusCode = 400;
    throw err;
  }
};

/**
 * Field-level access: only the assigned supervisor (or a full-view role)
 * may transition an item or append a stage update. Field officers without
 * assignment get 403.
 */
export const assertItemAssignment = ({ item, user }) => {
  if (!user) return;
  if (isFullView(user)) return;
  if (item?.assignedSupervisorId === user.id) return;
  const err = new Error('You are not assigned as supervisor for this item.');
  err.statusCode = 403;
  throw err;
};

/**
 * Soft geofence check — returns `{ warning: true, distance }` when the
 * caller's GPS is more than GEOFENCE_METERS from the beneficiary's
 * household_lat/lng. Returns null when within range or when either side
 * has no coordinates. Does NOT throw.
 */
export const geofenceWarning = ({ latitude, longitude, beneficiary }) => {
  if (
    latitude == null || longitude == null ||
    !beneficiary ||
    beneficiary.household_lat == null || beneficiary.household_lng == null
  ) return null;
  const distance = haversineMeters(
    Number(latitude), Number(longitude),
    Number(beneficiary.household_lat), Number(beneficiary.household_lng)
  );
  if (distance > GEOFENCE_METERS) {
    return { warning: true, distance: Math.round(distance) };
  }
  return null;
};
