// Runs once per test process before any test file is imported. We MUST set
// these env vars before src/server.js (and src/config/database.js) load,
// because the database connection is constructed at module-import time.

import path from 'node:path';
import os from 'node:os';

process.env.NODE_ENV = 'test';
// Suppress the auto-listen in src/server.js (`if (process.env.VERCEL !== '1') startServer()`).
process.env.VERCEL = '1';

// JWT secrets are validated at boot in server.js (must be ≥ 32 chars).
process.env.JWT_SECRET = 'test-jwt-secret-must-be-at-least-32-chars-long';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-also-32-chars-long-padding';
process.env.JWT_EXPIRE = '15m';
process.env.JWT_REFRESH_EXPIRE = '1d';

// CRON_SECRET so the cron routes register without throwing 503 in tests that
// may touch them indirectly.
process.env.CRON_SECRET = 'test-cron-secret';

// Quiet down the request logger and rate limiter for tests.
process.env.RATE_LIMIT_MAX_REQUESTS = '10000';

// Use SQLite for tests. One file per test process so parallel files don't
// share state and DB sync({force:true}) doesn't fight itself.
process.env.DB_USE_SQLITE = 'true';
process.env.DB_SQLITE_STORAGE = path.join(
  os.tmpdir(),
  `gersl-test-${process.pid}-${Date.now()}.sqlite`,
);
