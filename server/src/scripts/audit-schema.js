// Audit — model definitions vs. the actual database.
//
// Loads every Sequelize model, queries information_schema for what's really
// in Postgres, and reports:
//   • tables the app expects but the DB doesn't have
//   • columns the app expects but the DB doesn't have
//   • DB columns nothing in the app references (orphans from renames)
//   • unique indexes the model declares but the DB is missing
//
// Run: node server/src/scripts/audit-schema.js

import sequelize from '../config/database.js';
import * as models from '../models/index.js';

const nonModelExports = new Set(['default', 'sequelize', 'Sequelize', 'DataTypes', 'Op']);

const report = { missingTables: [], missingColumns: [], orphanColumns: [], missingUniqueIndexes: [], ok: 0 };

async function fetchDbColumns(tableName) {
  const [rows] = await sequelize.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    { bind: [tableName] }
  );
  return new Set(rows.map(r => r.column_name));
}

async function fetchDbUniqueIndexes(tableName) {
  const [rows] = await sequelize.query(
    `SELECT indexname, indexdef FROM pg_indexes
     WHERE schemaname = 'public' AND tablename = $1 AND indexdef ILIKE '%UNIQUE%'`,
    { bind: [tableName] }
  );
  // Extract column lists from the UNIQUE INDEX definitions.
  return rows.map(r => {
    const m = r.indexdef.match(/\(([^)]+)\)/);
    return m ? m[1].split(',').map(c => c.trim().replace(/"/g, '')) : [];
  });
}

async function audit() {
  await sequelize.authenticate();

  const modelList = Object.entries(models).filter(([name, m]) =>
    !nonModelExports.has(name) &&
    m && typeof m === 'function' &&
    m.tableName && m.rawAttributes
  );

  console.log(`Auditing ${modelList.length} models against database...\n`);

  for (const [modelName, Model] of modelList) {
    const tableName = Model.tableName;
    const modelCols = new Set(
      Object.values(Model.rawAttributes).map(a => a.field || a.fieldName)
    );

    const dbCols = await fetchDbColumns(tableName);
    if (dbCols.size === 0) {
      report.missingTables.push({ model: modelName, table: tableName });
      continue;
    }

    for (const col of modelCols) {
      if (!dbCols.has(col)) {
        report.missingColumns.push({ table: tableName, column: col });
      }
    }
    for (const col of dbCols) {
      // 'id' and Sequelize's created_at/updated_at may not be in rawAttributes
      if (col === 'id' || col === 'created_at' || col === 'updated_at') continue;
      if (!modelCols.has(col)) {
        report.orphanColumns.push({ table: tableName, column: col });
      }
    }

    // Compare model-declared unique indexes with DB reality.
    const modelIndexes = (Model.options.indexes || []).filter(i => i.unique);
    if (modelIndexes.length > 0) {
      const dbIndexes = await fetchDbUniqueIndexes(tableName);
      for (const mi of modelIndexes) {
        const wantedCols = (mi.fields || []).map(f => typeof f === 'string' ? f : f.name);
        const found = dbIndexes.some(dbCols =>
          dbCols.length === wantedCols.length &&
          dbCols.every((c, i) => c === wantedCols[i])
        );
        if (!found) {
          report.missingUniqueIndexes.push({ table: tableName, columns: wantedCols });
        }
      }
    }

    report.ok++;
  }

  console.log('=== SCHEMA AUDIT REPORT ===\n');

  console.log(`✓ ${report.ok - report.missingTables.length}/${report.ok} models have their table + all model columns present.\n`);

  if (report.missingTables.length) {
    console.log(`❌ ${report.missingTables.length} MISSING TABLES:`);
    for (const r of report.missingTables) console.log(`   • ${r.model} → ${r.table}`);
    console.log();
  }

  if (report.missingColumns.length) {
    console.log(`⚠️  ${report.missingColumns.length} MODEL COLUMNS NOT IN DB:`);
    for (const r of report.missingColumns) console.log(`   • ${r.table}.${r.column}`);
    console.log();
  }

  if (report.orphanColumns.length) {
    console.log(`ℹ️  ${report.orphanColumns.length} DB COLUMNS NOT REFERENCED BY ANY MODEL (probably renames or removed features — harmless but stale):`);
    for (const r of report.orphanColumns) console.log(`   • ${r.table}.${r.column}`);
    console.log();
  }

  if (report.missingUniqueIndexes.length) {
    console.log(`⚠️  ${report.missingUniqueIndexes.length} UNIQUE INDEXES DECLARED BY MODEL BUT MISSING IN DB:`);
    for (const r of report.missingUniqueIndexes) console.log(`   • ${r.table} (${r.columns.join(', ')})`);
    console.log();
  }

  const issues = report.missingTables.length + report.missingColumns.length + report.missingUniqueIndexes.length;
  if (issues === 0) {
    console.log('✅ No blocking drift — model definitions and DB schema match.');
  } else {
    console.log(`❌ ${issues} substantive drift item(s) — fix before shipping.`);
  }

  process.exit(0);
}

audit().catch(err => {
  console.error('Audit failed:', err.message);
  process.exit(1);
});
