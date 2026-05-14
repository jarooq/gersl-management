// =============================================================================
// Attendance hours computation — net working hours from punch_in / punch_out
// rows in attendance_punches.
//
// Rule (Sri Lanka labour, 45h week):
//   net_hours(day) = (last Out − first In)
//                  − explicit (BreakOut → BreakIn) spans
//                  − 1h auto lunch deduction IF total ≥ 5h
//                    AND no explicit BreakOut/In found
//
// Forgot to punch out → day is treated as "open" with the In time stored
// but zero net hours counted. Surfaces in the UI as "missing punch out".
//
// Lives in /utils so both the controller and any cron-based weekly digest
// can call it without duplicating the logic.
// =============================================================================

import { Op } from 'sequelize';
import { AttendancePunch } from '../models/index.js';

const HOUR_MS = 60 * 60 * 1000;
const AUTO_LUNCH_MS = 60 * 60 * 1000;       // 1 hour
const AUTO_LUNCH_THRESHOLD_MS = 5 * 60 * 60 * 1000;  // applies when worked ≥ 5h

// Return YYYY-MM-DD for a Date.
const dayKey = (d) => {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const dd = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// Monday-anchored ISO week start for any date. If a YYYY-MM-DD string is
// passed we anchor it to local midnight (not UTC midnight) so a Sri Lankan
// Friday afternoon doesn't get bucketed into the previous UTC day.
export const weekStartOf = (anyDate) => {
  const d = anyDate instanceof Date
    ? new Date(anyDate)
    : new Date(String(anyDate).slice(0, 10) + 'T00:00:00');
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();                  // 0 = Sunday
  const offset = day === 0 ? -6 : 1 - day; // shift to previous Monday
  d.setDate(d.getDate() + offset);
  return d;
};

// Compute net work hours for an array of punches (one user). Returns
// { daily: [{ date, netHours, firstIn, lastOut, breakMs, autoLunchApplied, missing }], totalHours }.
export const computePunchHours = (punches) => {
  // Group punches by local day.
  const byDay = new Map();
  for (const p of punches) {
    const at = new Date(p.occurredAt);
    const k = dayKey(at);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push({ type: p.punchType, at });
  }

  const daily = [];
  let totalMs = 0;

  // Iterate in date order
  const keys = [...byDay.keys()].sort();
  for (const k of keys) {
    const list = byDay.get(k).sort((a, b) => a.at - b.at);
    const ins  = list.filter(p => p.type === 'In');
    const outs = list.filter(p => p.type === 'Out');
    const breakOuts = list.filter(p => p.type === 'BreakOut');
    const breakIns  = list.filter(p => p.type === 'BreakIn');

    if (ins.length === 0) {
      daily.push({ date: k, netHours: 0, firstIn: null, lastOut: null, breakMs: 0, autoLunchApplied: false, missing: 'no_in' });
      continue;
    }

    const firstIn = ins[0].at;
    const lastOut = outs.length > 0 ? outs[outs.length - 1].at : null;

    if (!lastOut) {
      // Punched in but never out — likely forgot. Don't credit any hours.
      daily.push({ date: k, netHours: 0, firstIn, lastOut: null, breakMs: 0, autoLunchApplied: false, missing: 'no_out' });
      continue;
    }

    let workMs = lastOut - firstIn;

    // Subtract every (BreakOut → BreakIn) span we can pair up in order.
    let breakMs = 0;
    const breakPairCount = Math.min(breakOuts.length, breakIns.length);
    for (let i = 0; i < breakPairCount; i++) {
      const out = breakOuts[i].at;
      const back = breakIns[i].at;
      if (back > out) breakMs += (back - out);
    }
    workMs -= breakMs;

    // Auto lunch: only when no explicit break was recorded and worked ≥ 5h.
    let autoLunchApplied = false;
    if (breakPairCount === 0 && workMs >= AUTO_LUNCH_THRESHOLD_MS) {
      workMs -= AUTO_LUNCH_MS;
      autoLunchApplied = true;
    }

    if (workMs < 0) workMs = 0;
    daily.push({
      date: k,
      netHours: +(workMs / HOUR_MS).toFixed(2),
      firstIn,
      lastOut,
      breakMs,
      autoLunchApplied,
      missing: null,
    });
    totalMs += workMs;
  }

  return {
    daily,
    totalHours: +(totalMs / HOUR_MS).toFixed(2),
  };
};

// Convenience: compute one user's weekly hours, given any date in the week.
// Returns the same shape as computePunchHours plus { weekStart, weekEnd,
// targetHours, balance }.
export const getWeeklyHours = async (userId, anyDateInWeek) => {
  const start = weekStartOf(anyDateInWeek);
  const end   = new Date(start);
  end.setDate(end.getDate() + 7);

  const punches = await AttendancePunch.findAll({
    where: {
      userId,
      occurredAt: { [Op.gte]: start, [Op.lt]: end },
    },
    attributes: ['id', 'punchType', 'occurredAt'],
    order: [['occurredAt', 'ASC']],
    raw: true,
  });

  const result = computePunchHours(punches);
  const targetHours = 45;
  return {
    ...result,
    weekStart: dayKey(start),
    weekEnd:   dayKey(new Date(end.getTime() - 1)),
    targetHours,
    balance: +(result.totalHours - targetHours).toFixed(2),
  };
};
