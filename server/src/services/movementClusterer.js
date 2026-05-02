// Single-pass clusterer: turns a day's raw GPS stream for one user into
// alternating STOP / TRIP segments persisted to movement_segments.
//
// Heuristics (tuned to GERHR's defaults; revisit per-org if needed):
//   - STOP_RADIUS_M: points within this radius of a stop's centroid extend
//     the stop. Larger → fewer, longer stops. 60m = small office building.
//   - MIN_STOP_MS:   minimum dwell time before a cluster qualifies as a STOP.
//     Shorter clusters (e.g. red lights) get rolled back into TRIPs.
//   - MAX_STOP_GAP_MS: max time-gap inside a stop. If the GPS goes silent
//     for > this, treat as the stop ended (battery saver, tunnel, etc.).

import { Op } from 'sequelize';
import { LocationPoint, MovementSegment } from '../models/index.js';

const STOP_RADIUS_M    = 60;
const MIN_STOP_MS      = 5 * 60 * 1000;   // 5 minutes
const MAX_STOP_GAP_MS  = 10 * 60 * 1000;  // 10 minutes
const EARTH_R_M        = 6_371_000;

const haversineM = (a, b) => {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R_M * Math.asin(Math.sqrt(h));
};

const dayBounds = (date) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return [start, end];
};

const ymd = (d) => d.toISOString().slice(0, 10);

/**
 * Cluster a single user's points for a single day.
 * Returns the array of segments persisted (already saved to DB).
 */
export async function clusterDay({ userId, date }) {
  const [from, to] = dayBounds(date);

  const rows = await LocationPoint.findAll({
    where: { userId, recordedAt: { [Op.gte]: from, [Op.lt]: to } },
    order: [['recordedAt', 'ASC']],
    raw: true
  });
  if (rows.length < 2) return [];

  // Wipe existing segments for this user/day so re-runs are idempotent.
  await MovementSegment.destroy({ where: { userId, date } });

  const segments = [];

  // Working segment state.
  let mode = 'TRIP'; // start in TRIP until we accumulate a viable stop
  let segPoints = [];
  let stopCenter = null; // { lat, lng } during STOP

  const closeSegment = () => {
    if (segPoints.length === 0) return;
    const startedAt = new Date(segPoints[0].recordedAt);
    const endedAt   = new Date(segPoints[segPoints.length - 1].recordedAt);
    const durationMinutes = Math.round((endedAt - startedAt) / 60000);

    if (mode === 'STOP') {
      segments.push({
        userId, date, segmentType: 'STOP',
        startedAt, endedAt, durationMinutes,
        startLat: stopCenter.lat, startLng: stopCenter.lng,
        endLat:   stopCenter.lat, endLng:   stopCenter.lng,
        distanceKm: 0,
        pointCount: segPoints.length
      });
    } else {
      let dist = 0;
      for (let i = 1; i < segPoints.length; i++) {
        dist += haversineM(
          { lat: +segPoints[i - 1].latitude, lng: +segPoints[i - 1].longitude },
          { lat: +segPoints[i].latitude,     lng: +segPoints[i].longitude }
        );
      }
      segments.push({
        userId, date, segmentType: 'TRIP',
        startedAt, endedAt, durationMinutes,
        startLat: +segPoints[0].latitude,                    startLng: +segPoints[0].longitude,
        endLat:   +segPoints[segPoints.length - 1].latitude, endLng:   +segPoints[segPoints.length - 1].longitude,
        distanceKm: +(dist / 1000).toFixed(3),
        pointCount: segPoints.length
      });
    }
  };

  // Start with the first point.
  segPoints.push(rows[0]);

  for (let i = 1; i < rows.length; i++) {
    const p = rows[i];
    const prev = rows[i - 1];
    const ts = new Date(p.recordedAt).getTime();

    // Detect a new STOP forming: when the LAST K points cluster around the same area.
    // Cheap test: see if this point is within radius of the segment's anchor.
    const anchor = mode === 'STOP'
      ? stopCenter
      : { lat: +segPoints[0].latitude, lng: +segPoints[0].longitude };
    const dM = haversineM(
      anchor,
      { lat: +p.latitude, lng: +p.longitude }
    );
    const gap = ts - new Date(prev.recordedAt).getTime();

    if (mode === 'TRIP') {
      // Check whether the TRIP has effectively halted: look back N≥3 points all
      // within stop radius of each other AND covering ≥ MIN_STOP_MS.
      // We approximate with: is current point within 2× radius of the previous
      // segment-tail point? If yes, accumulate; if a quiet window ≥ MIN_STOP_MS
      // forms within radius, switch mode.
      segPoints.push(p);

      // Look at the trailing run of points within radius of the latest point.
      let tailStart = segPoints.length - 1;
      while (tailStart > 0) {
        const t = segPoints[tailStart - 1];
        const m = haversineM(
          { lat: +t.latitude, lng: +t.longitude },
          { lat: +p.latitude, lng: +p.longitude }
        );
        if (m > STOP_RADIUS_M) break;
        tailStart--;
      }
      const tailDuration =
        new Date(segPoints[segPoints.length - 1].recordedAt).getTime() -
        new Date(segPoints[tailStart].recordedAt).getTime();

      if (segPoints.length - tailStart >= 3 && tailDuration >= MIN_STOP_MS) {
        // Split: close the TRIP up to (but excluding) the tail run; start a STOP.
        const stopRun = segPoints.slice(tailStart);
        segPoints = segPoints.slice(0, tailStart);
        if (segPoints.length >= 2) {
          closeSegment(); // closes TRIP
        }
        // Recompute stop center from stopRun.
        stopCenter = {
          lat: stopRun.reduce((s, x) => s + +x.latitude,  0) / stopRun.length,
          lng: stopRun.reduce((s, x) => s + +x.longitude, 0) / stopRun.length
        };
        segPoints = stopRun;
        mode = 'STOP';
      }
    } else {
      // mode === STOP
      if (dM <= STOP_RADIUS_M && gap < MAX_STOP_GAP_MS) {
        segPoints.push(p);
        // Adjust center incrementally.
        const n = segPoints.length;
        stopCenter = {
          lat: (stopCenter.lat * (n - 1) + +p.latitude)  / n,
          lng: (stopCenter.lng * (n - 1) + +p.longitude) / n
        };
      } else {
        closeSegment(); // close STOP
        mode = 'TRIP';
        segPoints = [p];
        stopCenter = null;
      }
    }
  }

  closeSegment();

  if (segments.length) {
    await MovementSegment.bulkCreate(segments);
  }
  return segments;
}

/**
 * Cluster every user that has location_points on the given date.
 * Used by the daily cron and by the manual /api/locations/cluster endpoint.
 */
export async function clusterAllUsersForDate(dateStr) {
  const [from, to] = dayBounds(dateStr);
  const distinctUsers = await LocationPoint.findAll({
    attributes: ['userId'],
    where: { recordedAt: { [Op.gte]: from, [Op.lt]: to } },
    group: ['userId'],
    raw: true
  });
  const summary = [];
  for (const { userId } of distinctUsers) {
    const segs = await clusterDay({ userId, date: dateStr });
    summary.push({ userId, segments: segs.length });
  }
  return summary;
}

export const _internal = { haversineM, ymd, dayBounds, STOP_RADIUS_M, MIN_STOP_MS };
