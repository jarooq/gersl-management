/**
 * AI Employee — database helpers
 *
 * The Watcher reads across ~10 tables that have evolved a lot over time, so
 * every rule checks that the columns it needs actually exist before running.
 * A rule whose table has drifted disables itself instead of crashing the sweep.
 *
 * All date arithmetic is done in JavaScript and passed as bind parameters, so
 * the same SQL runs on both Postgres (production) and SQLite (local dev).
 */

import sequelize from '../../config/database.js';

const dialect = sequelize.getDialect();
export const isPostgres = dialect === 'postgres';

/** Run a parameterised SELECT and return plain rows. */
export const select = (sql, replacements = {}) =>
  sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });

/** Run a parameterised INSERT/UPDATE/DELETE. */
export const execute = (sql, replacements = {}) =>
  sequelize.query(sql, { replacements });

// ── Schema introspection (cached for the lifetime of the process) ─────────
const schemaCache = new Map();

/** Column names present on a table, lowercased. Empty set if table missing. */
export const getColumns = async (table) => {
  if (schemaCache.has(table)) return schemaCache.get(table);

  let columns = new Set();
  try {
    const rows = isPostgres
      ? await select(
          `SELECT column_name AS name
             FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = :table`,
          { table }
        )
      : await select(`SELECT name FROM pragma_table_info(:table)`, { table });

    columns = new Set(rows.map((r) => String(r.name).toLowerCase()));
  } catch {
    // Introspection itself failed — treat as "table unusable".
    columns = new Set();
  }

  schemaCache.set(table, columns);
  return columns;
};

export const tableExists = async (table) => (await getColumns(table)).size > 0;

/**
 * True when `table` exists and has every column in `required`.
 * Rules call this in their `isAvailable()` so a drifted schema degrades
 * gracefully to "this rule is skipped" rather than a failed run.
 */
export const hasColumns = async (table, required = []) => {
  const columns = await getColumns(table);
  if (columns.size === 0) return false;
  return required.every((c) => columns.has(c.toLowerCase()));
};

/** Clear the cache — used after migrations run in the same process. */
export const resetSchemaCache = () => schemaCache.clear();

// ── JSON round-tripping ──────────────────────────────────────────────────
// Postgres gives back parsed JSONB; SQLite gives back a TEXT blob.

export const toJsonColumn = (value) =>
  value === null || value === undefined ? null : JSON.stringify(value);

export const fromJsonColumn = (value, fallback = null) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ── Date helpers ─────────────────────────────────────────────────────────

/** `YYYY-MM-DD` for a Date, in UTC. Task/project dates are DATEONLY columns. */
export const toDateOnly = (date) => date.toISOString().slice(0, 10);

/** Today at 00:00 UTC. */
export const startOfToday = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/** A new Date `days` from `from` (negative works). */
export const addDays = (from, days) => {
  const d = new Date(from.getTime());
  d.setUTCDate(d.getUTCDate() + days);
  return d;
};

/** Whole days between two dates (b - a), positive when b is later. */
export const daysBetween = (a, b) =>
  Math.round((new Date(b).setUTCHours(0, 0, 0, 0) - new Date(a).setUTCHours(0, 0, 0, 0)) / 86400000);
