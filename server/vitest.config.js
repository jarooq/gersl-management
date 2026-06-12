import { defineConfig } from 'vitest/config';

// Run server tests with vitest. Each test FILE gets its own forked process so
// the in-memory SQLite test DB never leaks between files, and the cached app
// instance inside helpers/app.js is naturally isolated.
//
// Run with: npm test (from server/)
export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/helpers/setup.js'],
    globals: false,
    testTimeout: 20000,
    hookTimeout: 30000,
    pool: 'forks',
    // The existing smoke.test.js talks to a live backend and auto-skips when
    // one isn't reachable; keep it out of CI runs by default.
    exclude: ['node_modules/**', 'dist/**', 'tests/smoke.test.js'],
  },
});
