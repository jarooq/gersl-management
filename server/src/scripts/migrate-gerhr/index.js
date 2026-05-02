#!/usr/bin/env node
/**
 * GERHR Firestore → Postgres one-shot migration.
 *
 * Usage:
 *   # Dry-run against a directory of pre-exported JSON dumps:
 *   node src/scripts/migrate-gerhr --mode=json --source=./gerhr-export --dry-run
 *
 *   # Live read from Firestore using a service account file:
 *   FIREBASE_SERVICE_ACCOUNT_PATH=/secure/path/sa.json \
 *     node src/scripts/migrate-gerhr --mode=live --source=$FIREBASE_SERVICE_ACCOUNT_PATH
 *
 *   # Limit to one collection (useful when iterating on a mapper):
 *   node src/scripts/migrate-gerhr --mode=json --source=./out --only=staff
 *
 * Idempotency:
 *   The _gerhr_migrations table records every (collection, firestoreId) we've
 *   imported. Re-running skips already-migrated docs. Drop the table to
 *   force a full re-import.
 *
 * Credential prep:
 *   Live mode requires a Firebase service account JSON. Get one from:
 *     Firebase Console → Project Settings → Service accounts → Generate new private key.
 *   Save it OUTSIDE the repo (NEVER commit). Pass the path via the
 *   FIREBASE_SERVICE_ACCOUNT_PATH env var or --source.
 */

import dotenv from 'dotenv';
import { User, GerhrMigration, sequelize } from '../../models/index.js';
import { buildReader } from './readers.js';
import { COLLECTION_PIPELINE } from './mappers.js';

dotenv.config();

const args = Object.fromEntries(process.argv.slice(2)
  .filter(a => a.startsWith('--'))
  .map(a => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }));

const MODE     = args.mode || 'json';
const SOURCE   = args.source || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const DRY_RUN  = !!args['dry-run'];
const ONLY     = args.only ? new Set(args.only.split(',')) : null;

if (!SOURCE) {
  console.error('Error: --source is required (file path for live, dir for json).');
  process.exit(1);
}

const log = (...a) => console.log('[migrate]', ...a);

const buildContext = async () => {
  const users = await User.findAll({ attributes: ['id', 'email'], raw: true });
  const usersByEmail = Object.fromEntries(
    users.filter(u => u.email).map(u => [u.email.toLowerCase(), u])
  );
  const fallbackAdmin = users.find(u => u.email)?.id ?? null;
  return {
    usersByEmail,
    staffUidToUserId: {},
    fallbackAdminId: fallbackAdmin
  };
};

const tableModelMap = {};
const ensureModelMap = async () => {
  if (Object.keys(tableModelMap).length) return;
  const all = await import('../../models/index.js');
  for (const [name, model] of Object.entries(all)) {
    if (model && model.tableName) tableModelMap[model.tableName] = model;
  }
};

let _dryIdSeq = 1_000_000; // synthesize plausible IDs in dry-run mode
const persistOne = async (mapped, fsId, collection) => {
  const Model = tableModelMap[mapped.table];
  if (!Model) throw new Error(`No model registered for table: ${mapped.table}`);
  if (DRY_RUN) {
    const fakeId = ++_dryIdSeq;
    if (mapped.onCreated) mapped.onCreated(fakeId);
    return { id: fakeId };
  }
  const row = await Model.create(mapped.payload);
  if (mapped.onCreated) mapped.onCreated(row.id);
  await GerhrMigration.create({
    collection, firestoreId: fsId,
    targetTable: mapped.table, targetId: row.id ?? null
  });
  return row;
};

const run = async () => {
  await sequelize.authenticate();
  await ensureModelMap();

  const reader = buildReader({ mode: MODE, source: SOURCE });
  const ctx = await buildContext();

  log(`mode=${MODE}  source=${SOURCE}  dry=${DRY_RUN}  only=${args.only || '(all)'}`);

  const summary = [];

  for (const [collection, mapper] of COLLECTION_PIPELINE) {
    if (ONLY && !ONLY.has(collection)) continue;

    let docs = [];
    try { docs = await reader.read(collection); }
    catch (e) { log(`  ✗ ${collection}: read failed — ${e.message}`); continue; }

    if (docs.length === 0) {
      log(`  – ${collection}: no documents`);
      summary.push({ collection, total: 0, migrated: 0, skipped: 0, errors: 0 });
      continue;
    }

    // Pre-load already-migrated firestore IDs for this collection.
    const already = new Set(
      (await GerhrMigration.findAll({
        where: { collection }, attributes: ['firestoreId'], raw: true
      })).map(r => r.firestoreId)
    );

    let migrated = 0, skipped = 0, errors = 0;

    for (const doc of docs) {
      const fsId = doc._id;
      if (!fsId) { errors++; continue; }
      if (already.has(fsId)) { skipped++; continue; }

      let mapped;
      try { mapped = await mapper(doc, ctx); }
      catch (e) { errors++; log(`    ! ${collection}/${fsId}: ${e.message}`); continue; }
      if (!mapped) { skipped++; continue; }

      const items = Array.isArray(mapped) ? mapped : [mapped];
      for (const m of items) {
        try { await persistOne(m, fsId, collection); migrated++; }
        catch (e) { errors++; log(`    ! ${collection}/${fsId} → ${m.table}: ${e.message}`); }
      }
    }
    log(`  ✓ ${collection}: migrated=${migrated} skipped=${skipped} errors=${errors}`);
    summary.push({ collection, total: docs.length, migrated, skipped, errors });
  }

  log('\nSummary:');
  console.table(summary);
  if (DRY_RUN) log('(dry-run) — no rows were written.');
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
