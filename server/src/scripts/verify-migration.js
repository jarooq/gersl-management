#!/usr/bin/env node
/**
 * Post-migration health check. Run AFTER `migrate-gerhr` finishes a live
 * import. Prints a report of:
 *   - per-collection migration counts (from _gerhr_migrations)
 *   - orphan rows (FKs pointing at users that no longer exist, etc.)
 *   - users with placeholder passwords (need reset emails)
 *   - location_points spanning unexpected date ranges
 *   - days that have location_points but no clustered movement_segments
 *
 * Exits 0 even if issues are found — this is a diagnostic, not a gate.
 *
 *   node src/scripts/verify-migration.js
 */

import dotenv from 'dotenv';
import sequelize from '../config/database.js';
import {
  GerhrMigration, User, AttendancePunch, LocationPoint,
  MovementSegment, Visit, LeaveRequest, SalaryAdvance, Expense
} from '../models/index.js';
import { Op, fn, col } from 'sequelize';

dotenv.config();

const SECTION = (title) => console.log(`\n=== ${title} ===`);

const fmt = (n) => Number(n).toLocaleString();

(async () => {
  await sequelize.authenticate();

  // ---------- Migration ledger summary ----------
  SECTION('Migration ledger');
  const ledger = await GerhrMigration.findAll({
    attributes: [
      'collection',
      [fn('COUNT', col('id')), 'count'],
      [fn('MIN', col('migrated_at')), 'firstAt'],
      [fn('MAX', col('migrated_at')), 'lastAt']
    ],
    group: ['collection'],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true
  });
  if (ledger.length === 0) {
    console.log('  (no migrations recorded — has the live run completed?)');
  } else {
    console.table(ledger.map(r => ({
      collection: r.collection,
      count:      fmt(r.count),
      firstAt:    new Date(r.firstAt).toISOString(),
      lastAt:     new Date(r.lastAt).toISOString()
    })));
  }

  // ---------- Migrated users without proper passwords ----------
  SECTION('Migrated users needing password reset');
  const migratedUserIds = (await GerhrMigration.findAll({
    where: { collection: 'staff', targetTable: 'users' },
    attributes: ['targetId'],
    raw: true
  })).map(r => r.targetId).filter(Boolean);
  console.log(`  ${migratedUserIds.length} migrated user account(s) — all need a password reset email.`);
  if (migratedUserIds.length > 0) {
    const sample = await User.findAll({
      where: { id: migratedUserIds.slice(0, 5) },
      attributes: ['id', 'email', 'fullName', 'role'],
      raw: true
    });
    console.log('  First 5:');
    console.table(sample);
    console.log('  Run `node src/scripts/reset-migrated-users.js` to send bulk reset links.');
  }

  // ---------- Orphan FK detection ----------
  SECTION('Orphan FK rows');
  const orphanCheck = async (Model, fkField, parentTable, label) => {
    const rows = await sequelize.query(
      `SELECT COUNT(*) AS n FROM ${Model.tableName} t
        WHERE t.${fkField} IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM ${parentTable} p WHERE p.id = t.${fkField})`,
      { type: sequelize.QueryTypes.SELECT }
    );
    const n = Number(rows[0].n);
    console.log(`  ${label.padEnd(45)} ${n}`);
    return n;
  };
  await orphanCheck(AttendancePunch, 'user_id',     'users', 'attendance_punches → users');
  await orphanCheck(LocationPoint,   'user_id',     'users', 'location_points → users');
  await orphanCheck(Visit,           'user_id',     'users', 'visits → users');
  await orphanCheck(LeaveRequest,    'user_id',     'users', 'leave_requests → users');
  await orphanCheck(SalaryAdvance,   'user_id',     'users', 'salary_advances → users');
  await orphanCheck(Expense,         'submitted_by','users', 'expenses → users (submitter)');
  await orphanCheck(MovementSegment, 'user_id',     'users', 'movement_segments → users');

  // ---------- Date sanity ----------
  SECTION('Date range sanity');
  const oldestPoint = await LocationPoint.findOne({
    order: [['recordedAt', 'ASC']], attributes: ['recordedAt'], raw: true
  });
  const newestPoint = await LocationPoint.findOne({
    order: [['recordedAt', 'DESC']], attributes: ['recordedAt'], raw: true
  });
  if (oldestPoint) {
    console.log(`  location_points span: ${oldestPoint.recordedAt} → ${newestPoint.recordedAt}`);
    const future = await LocationPoint.count({
      where: { recordedAt: { [Op.gt]: new Date() } }
    });
    if (future > 0) console.log(`  ⚠  ${future} location_points have future timestamps — Firestore tz mismatch?`);
  } else {
    console.log('  (no location_points)');
  }

  // ---------- Days with points but no segments ----------
  SECTION('Days with location_points but no movement_segments');
  const unclustered = await sequelize.query(
    `WITH days AS (
       SELECT DISTINCT user_id, DATE(recorded_at AT TIME ZONE 'UTC') AS day
       FROM location_points
     )
     SELECT user_id, day, (SELECT COUNT(*) FROM location_points lp
                            WHERE lp.user_id = days.user_id
                              AND DATE(lp.recorded_at AT TIME ZONE 'UTC') = days.day) AS points
     FROM days
     WHERE NOT EXISTS (
       SELECT 1 FROM movement_segments ms
       WHERE ms.user_id = days.user_id AND ms.date = days.day
     )
     ORDER BY day DESC, user_id
     LIMIT 20`,
    { type: sequelize.QueryTypes.SELECT }
  );
  if (unclustered.length === 0) {
    console.log('  ✓ all days fully clustered');
  } else {
    console.log(`  ${unclustered.length} day/user combination(s) need clustering. First 20:`);
    console.table(unclustered);
    console.log('\n  Backfill with:');
    console.log('    POST /api/movement-segments/cluster  body: {"date":"YYYY-MM-DD","userId":N}');
  }

  // ---------- Per-feature totals ----------
  SECTION('Per-feature row totals');
  const counts = await Promise.all([
    User.count(),
    AttendancePunch.count(),
    LocationPoint.count(),
    MovementSegment.count(),
    Visit.count(),
    LeaveRequest.count(),
    SalaryAdvance.count(),
    Expense.count()
  ]);
  const labels = [
    'users', 'attendance_punches', 'location_points', 'movement_segments',
    'visits', 'leave_requests', 'salary_advances', 'expenses'
  ];
  console.table(labels.map((l, i) => ({ table: l, rows: fmt(counts[i]) })));

  console.log('\nDone.');
  process.exit(0);
})().catch(err => { console.error(err); process.exit(1); });
