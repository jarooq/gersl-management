// =============================================================================
// Movement deviation analyzer — fraud-detection for personal use of org
// vehicles. Runs against the GPS points captured by the mobile background
// location service while a movement was "in motion" (departureAt → returnAt).
//
// We can't trust the typed from/to names (free text), so analysis is pure-
// GPS:
//   1. Total path length     — sum of haversine between consecutive points
//   2. Straight-line span    — haversine between first and last GPS point
//   3. Detour ratio          — total / span. > 1.5 flags as a detour.
//   4. Extended stops        — clusters of >30 min where the device sat
//                              within ~200m, NOT near the first/last point
//                              (those are origin/destination dwell time).
//   5. Planned vs actual     — actual > planned × 1.5 (when planned exists)
//
// All output is best-effort; if there are fewer than 3 GPS points we mark
// analyzedAt and skip flagging (not enough signal to be fair).
// =============================================================================

import { Op } from 'sequelize';
import { LocationPoint, MovementLog } from '../models/index.js';

const EARTH_RADIUS_M = 6371000;
const DETOUR_RATIO_THRESHOLD     = 1.5;   // 1.5x straight-line = suspicious
const PLANNED_OVERAGE_THRESHOLD  = 1.5;   // actual 1.5× planned distanceKm
const STOP_RADIUS_M              = 200;   // points within 200m count as same place
const STOP_MIN_DURATION_MIN      = 30;    // 30 min counts as "extended"
const ENDPOINT_DWELL_RADIUS_M    = 400;   // ignore stops within 400m of first/last GPS

// Haversine distance between two {lat, lng} (in metres).
const dist = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) *
            Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
};

// Find "extended stops" — windows of consecutive points all within
// STOP_RADIUS_M of their cluster centroid spanning at least
// STOP_MIN_DURATION_MIN, excluding endpoints.
const findExtendedStops = (points) => {
  const stops = [];
  if (points.length < 3) return stops;
  const first = points[0], last = points[points.length - 1];
  let i = 0;
  while (i < points.length) {
    let j = i + 1;
    while (j < points.length && dist(points[i], points[j]) <= STOP_RADIUS_M) j++;
    // [i .. j-1] is a candidate stop window
    const start = points[i].ts;
    const end   = points[j - 1].ts;
    const minutes = (end - start) / 60000;
    if (minutes >= STOP_MIN_DURATION_MIN) {
      // Exclude stops that hug origin or destination — those are the
      // start/end of trip dwell time, not a detour.
      const center = points[i];
      const nearStart = dist(center, first) <= ENDPOINT_DWELL_RADIUS_M;
      const nearEnd   = dist(center, last)  <= ENDPOINT_DWELL_RADIUS_M;
      if (!nearStart && !nearEnd) {
        stops.push({
          lat: +center.lat.toFixed(6),
          lng: +center.lng.toFixed(6),
          startAt: new Date(start).toISOString(),
          endAt:   new Date(end).toISOString(),
          minutes: Math.round(minutes),
        });
      }
    }
    i = Math.max(j, i + 1);
  }
  return stops;
};

/**
 * Analyse one movement, populate the analysis columns, persist flags.
 * Returns the updated movement row. Never throws; on any error it
 * leaves the movement untouched and returns null.
 */
export const analyzeMovement = async (movement) => {
  try {
    if (!movement.departureAt || !movement.returnAt) return null;
    if (movement.isPassenger) return null;  // passengers ride someone else's trip

    const pts = await LocationPoint.findAll({
      where: {
        userId: movement.userId,
        recordedAt: {
          [Op.gte]: movement.departureAt,
          [Op.lte]: movement.returnAt,
        },
      },
      attributes: ['recordedAt', 'latitude', 'longitude'],
      order: [['recordedAt', 'ASC']],
      raw: true,
    });

    const points = pts.map(p => ({
      lat: Number(p.latitude),
      lng: Number(p.longitude),
      ts:  new Date(p.recordedAt).getTime(),
    })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));

    // Not enough signal to fairly analyse.
    if (points.length < 3) {
      await MovementLog.update(
        { analyzedAt: new Date(), flagReasons: null, flaggedAt: null },
        { where: { id: movement.id } }
      );
      return { movementId: movement.id, skipped: 'not_enough_gps' };
    }

    // Total path length.
    let pathM = 0;
    for (let i = 1; i < points.length; i++) pathM += dist(points[i - 1], points[i]);

    // Straight-line span between first and last GPS sample.
    const spanM = dist(points[0], points[points.length - 1]);
    const detourRatio = spanM > 0 ? pathM / spanM : null;

    const actualKm = +(pathM / 1000).toFixed(2);

    const flags = [];

    // Detour ratio flag.
    if (detourRatio != null && detourRatio > DETOUR_RATIO_THRESHOLD) {
      flags.push({
        kind: 'detour_ratio',
        actualKm,
        spanKm: +(spanM / 1000).toFixed(2),
        ratio:  +detourRatio.toFixed(2),
        message: `Actual route is ${detourRatio.toFixed(2)}× longer than ` +
                 `straight-line distance — possible detour`,
      });
    }

    // Planned vs actual flag.
    const plannedKm = Number(movement.distanceKm);
    if (Number.isFinite(plannedKm) && plannedKm > 0 &&
        actualKm > plannedKm * PLANNED_OVERAGE_THRESHOLD) {
      flags.push({
        kind: 'over_planned_distance',
        plannedKm,
        actualKm,
        message: `Actual distance ${actualKm}km exceeds planned ${plannedKm}km ` +
                 `by more than ${Math.round((PLANNED_OVERAGE_THRESHOLD - 1) * 100)}%`,
      });
    }

    // Extended stops.
    const stops = findExtendedStops(points);
    if (stops.length > 0) {
      flags.push({
        kind: 'extended_stops',
        count: stops.length,
        message: `${stops.length} extended stop${stops.length === 1 ? '' : 's'} ` +
                 'within trip window (not at origin/destination)',
      });
    }

    const flagged = flags.length > 0;
    await MovementLog.update({
      actualDistanceKm: actualKm,
      deviationPct:     detourRatio != null ? +((detourRatio - 1) * 100).toFixed(2) : null,
      extendedStops:    stops.length ? stops : null,
      flagReasons:      flagged ? flags : null,
      flaggedAt:        flagged ? new Date() : null,
      analyzedAt:       new Date(),
    }, { where: { id: movement.id } });

    return { movementId: movement.id, flagged, flags, actualKm, detourRatio, stops };
  } catch (err) {
    console.error('[movementAnalyzer]', err.message);
    return null;
  }
};

/**
 * Analyse all movements that finished within the past N days and haven't
 * been analysed yet. Designed to be called from a daily cron AND ad-hoc.
 */
export const analyzePendingMovements = async ({ sinceDays = 7 } = {}) => {
  const since = new Date(Date.now() - sinceDays * 86400_000);
  const candidates = await MovementLog.findAll({
    where: {
      status: { [Op.in]: ['Returned', 'Arrived'] },
      analyzedAt: null,
      returnAt:  { [Op.gte]: since },
    },
    attributes: ['id', 'userId', 'departureAt', 'returnAt', 'distanceKm', 'isPassenger'],
  });
  const out = { processed: 0, flagged: 0, skipped: 0 };
  for (const m of candidates) {
    const result = await analyzeMovement(m);
    if (!result) { out.skipped += 1; continue; }
    out.processed += 1;
    if (result.flagged) out.flagged += 1;
  }
  return out;
};
