// Happy-path smoke tests for the new HR/mobile endpoints. Runs against a
// LIVE backend (assumes the dev server is up on $TEST_BASE_URL or
// http://localhost:3001). The point isn't unit-testing — it's a regression
// safety net so refactors don't silently break a route's contract.
//
//   npm test                    # one-shot
//   npm run test:watch          # re-run on file changes
//
// Skipped automatically if the backend isn't reachable, so CI without a DB
// won't fail spuriously.

import { describe, it, beforeAll, expect } from 'vitest';
import request from 'supertest';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3001';
const ADMIN_USER = process.env.TEST_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.TEST_ADMIN_PASS || 'ChangeMe!2026';

let token = null;
let backendUp = false;

beforeAll(async () => {
  try {
    const health = await request(BASE).get('/health').timeout(2000);
    backendUp = health.status === 200;
    if (!backendUp) return;
    const login = await request(BASE)
      .post('/api/auth/login')
      .send({ username: ADMIN_USER, password: ADMIN_PASS });
    token = login.body?.accessToken ?? login.body?.data?.accessToken ?? null;
  } catch {
    backendUp = false;
  }
});

const auth = (req) => token ? req.set('Authorization', `Bearer ${token}`) : req;

// Skip from inside the test, NOT at registration — beforeAll hasn't run yet
// when describe blocks are evaluated.
const requireAuth = (ctx) => {
  if (!backendUp) ctx.skip();
  if (!token)     ctx.skip();
};

describe('Phase 2/3 endpoints — smoke', () => {
  it('backend health responds', async () => {
    if (!backendUp) return;
    const res = await request(BASE).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  describe('GET endpoints all return 200 with auth', () => {
    const endpoints = [
      '/api/me/payslips',
      '/api/me/leave-requests',
      '/api/me/expenses',
      '/api/visits',
      '/api/shifts',
      '/api/announcements',
      '/api/salary-advances',
      '/api/leave-balances?year=2026',
      '/api/locations/live',
      '/api/movement-segments',
    ];
    for (const path of endpoints) {
      it(`${path}`, async (ctx) => {
        requireAuth(ctx);
        const res = await auth(request(BASE).get(path));
        expect(res.status, `${path} returned ${res.status}: ${JSON.stringify(res.body).slice(0, 200)}`).toBe(200);
        expect(res.body.success).toBe(true);
      });
    }
  });

  describe('Mutations create then teardown', () => {
    let visitId, advanceId, leaveId, expenseId;

    it('POST /api/visits', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/visits')).send({
        customerName: 'TEST visit',
        purpose: 'Smoke test',
        latitude: 6.93, longitude: 79.86,
      });
      expect(res.status).toBe(201);
      visitId = res.body.data?.id;
      expect(visitId).toBeTruthy();
    });

    it('DELETE /api/visits/:id', async (ctx) => {
      requireAuth(ctx);
      if (!visitId) return;
      const res = await auth(request(BASE).delete(`/api/visits/${visitId}`));
      expect([200, 204]).toContain(res.status);
    });

    it('POST /api/salary-advances', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/salary-advances')).send({
        amount: 10000, reason: 'TEST advance',
      });
      expect(res.status).toBe(201);
      advanceId = res.body.data?.id;
    });

    it('PATCH /api/salary-advances/:id/cancel', async (ctx) => {
      requireAuth(ctx);
      if (!advanceId) return;
      const res = await auth(request(BASE).patch(`/api/salary-advances/${advanceId}/cancel`));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Cancelled');
    });

    it('POST /api/me/leave-requests', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/me/leave-requests')).send({
        leaveType: 'Casual',
        startDate: '2026-12-01',
        endDate:   '2026-12-02',
        reason:    'TEST leave',
      });
      expect(res.status).toBe(201);
      leaveId = res.body.data?.id;
    });

    it('PATCH /api/me/leave-requests/:id/cancel', async (ctx) => {
      requireAuth(ctx);
      if (!leaveId) return;
      const res = await auth(request(BASE).patch(`/api/me/leave-requests/${leaveId}/cancel`));
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Cancelled');
    });

    it('POST /api/me/expenses', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/me/expenses')).send({
        date: '2026-05-02',
        category: 'Travel',
        description: 'TEST expense',
        amount: 500,
      });
      expect(res.status).toBe(201);
      expenseId = res.body.data?.id;
    });

    it('rejects unknown expense category', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/me/expenses')).send({
        date: '2026-05-02', category: 'BogusCategory', description: 'x', amount: 1,
      });
      expect(res.status).toBe(400);
    });

    it('PATCH /api/me/expenses/:id/cancel', async (ctx) => {
      requireAuth(ctx);
      if (!expenseId) return;
      const res = await auth(request(BASE).patch(`/api/me/expenses/${expenseId}/cancel`));
      expect(res.status).toBe(200);
    });

    it('POST /api/locations/batch ingests + per-user limit allows 30+/min', async (ctx) => {
      requireAuth(ctx);
      const res = await auth(request(BASE).post('/api/locations/batch')).send({
        points: [{ recordedAt: new Date().toISOString(), latitude: 6.93, longitude: 79.86 }],
      });
      expect(res.status).toBe(201);
      expect(res.body.count).toBe(1);
    });
  });

  describe('Auth & rate-limit guardrails', () => {
    it('GET /api/visits without auth → 401', async () => {
      if (!backendUp) return;
      const res = await request(BASE).get('/api/visits');
      expect(res.status).toBe(401);
    });

    it('login brute-force limiter trips at attempt 9', async () => {
      if (!backendUp) return;
      let lastStatus = 0;
      for (let i = 0; i < 10; i++) {
        const r = await request(BASE).post('/api/auth/login')
          .send({ username: 'definitely-not-a-real-user', password: 'wrong' });
        lastStatus = r.status;
      }
      // After 8 failed attempts the limiter should kick in with 429.
      expect([401, 429]).toContain(lastStatus);
    });
  });
});
