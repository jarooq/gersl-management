/**
 * AI Employee — runtime settings
 *
 * Defaults live in config.js. An admin can override any subset of them by
 * saving a partial config into `ai_employee_settings`; the two are deep-merged
 * so new defaults added in code still apply to existing installs.
 */

import { DEFAULT_CONFIG } from './config.js';
import { select, execute, tableExists, toJsonColumn, fromJsonColumn } from './db.js';

const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

const deepMerge = (base, override) => {
  if (!isPlainObject(override)) return base;
  const out = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = isPlainObject(value) && isPlainObject(base[key])
      ? deepMerge(base[key], value)
      : value;
  }
  return out;
};

let cached = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

/** Effective config: defaults overlaid with whatever admins have saved. */
export const getConfig = async ({ fresh = false } = {}) => {
  if (!fresh && cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;

  let overrides = {};
  try {
    if (await tableExists('ai_employee_settings')) {
      const [row] = await select(`SELECT config FROM ai_employee_settings WHERE id = 1`);
      overrides = fromJsonColumn(row?.config, {}) || {};
    }
  } catch (err) {
    console.error('[AI Employee] Failed to load settings, using defaults:', err.message);
  }

  cached = deepMerge(DEFAULT_CONFIG, overrides);
  cachedAt = Date.now();
  return cached;
};

/** Persist a partial config override. Returns the new effective config. */
export const saveConfig = async (partial, userId = null) => {
  const existing = await tableExists('ai_employee_settings');
  if (!existing) throw new Error('ai_employee_settings table is missing — run the migration first');

  const [row] = await select(`SELECT config FROM ai_employee_settings WHERE id = 1`);
  const merged = deepMerge(fromJsonColumn(row?.config, {}) || {}, partial);

  if (row) {
    await execute(
      `UPDATE ai_employee_settings SET config = :config, updated_by = :userId, updated_at = :now WHERE id = 1`,
      { config: toJsonColumn(merged), userId, now: new Date() }
    );
  } else {
    await execute(
      `INSERT INTO ai_employee_settings (id, config, updated_by, updated_at)
       VALUES (1, :config, :userId, :now)`,
      { config: toJsonColumn(merged), userId, now: new Date() }
    );
  }

  cached = null;
  return getConfig({ fresh: true });
};

export const invalidateConfigCache = () => {
  cached = null;
};
