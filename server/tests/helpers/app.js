// Boots the Express app + a fresh SQLite schema for tests. Memoised so multiple
// test files in the same process reuse one app instance.

import { DataTypes } from 'sequelize';
import sequelize from '../../src/config/database.js';
import * as models from '../../src/models/index.js';

let _app = null;
let _ready = null;

// SQLite can't render `INTEGER[]` / `TEXT[]` etc. (Postgres-only). Several
// models (Task, AggregateDistribution, AuditLog, …) use ARRAY columns that
// are tangential to the money paths we test. Rewrite those columns to JSON
// text before sync so the schema builds.
function sqliteifyArrayColumns() {
  for (const Model of Object.values(sequelize.models)) {
    const attrs = Model.rawAttributes;
    for (const [name, attr] of Object.entries(attrs)) {
      const t = attr.type;
      // Detect Sequelize's ARRAY type via constructor key or runtime shape.
      const isArray = t && (t.key === 'ARRAY' || t.constructor?.name === 'ARRAY');
      if (isArray) {
        attr.type = DataTypes.TEXT;
        // The original column had `defaultValue: []`; once the type is TEXT
        // Sequelize would render `DEFAULT ` (empty) → SQLite syntax error.
        if (Array.isArray(attr.defaultValue)) {
          attr.defaultValue = JSON.stringify(attr.defaultValue);
        }
        attr._isPatchedArray = true;
      }
    }
    // Re-index the changes so Sequelize picks them up on sync.
    Model.refreshAttributes();
  }
}

export async function getApp() {
  if (_app) return { app: _app, sequelize, models };
  if (!_ready) {
    _ready = (async () => {
      // Import after env is set up — server.js exports `app` as default and
      // does NOT call listen() because VERCEL=1 (see setup.js).
      const mod = await import('../../src/server.js');
      _app = mod.default;
      sqliteifyArrayColumns();
      // Build the schema from model definitions. Migrations don't run in
      // tests; the models ARE the schema.
      await sequelize.sync({ force: true });
    })();
  }
  await _ready;
  return { app: _app, sequelize, models };
}

// Wipe every table between tests inside a single file. Cheaper than
// sync({force:true}) each time. Foreign keys are toggled off so we don't
// have to delete in a strict dependency order.
export async function clearDb() {
  await sequelize.query('PRAGMA foreign_keys = OFF');
  try {
    for (const m of Object.values(sequelize.models)) {
      await m.destroy({ where: {}, truncate: false, force: true });
    }
  } finally {
    await sequelize.query('PRAGMA foreign_keys = ON');
  }
}
