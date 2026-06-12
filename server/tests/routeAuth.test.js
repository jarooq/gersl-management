// Route authorization matrix.
//
// This file is the structural assessment's headline ask: a test that would
// have caught the "Manager ghost role" and "no permission gate at all"
// classes of bug at PR-time, before any of them shipped.
//
// Pattern: for every high-stakes write endpoint, assert
//   - the role(s) that SHOULD have access actually get 2xx
//   - a role that should NOT have access gets 403 (never 200 or 401)
//
// The active block below covers the finance routes PR #2 added gates to.
// The .todo block names the routes PR #5 will gate; flip them to .it() once
// this branch rebases past that merge — the assertions are already correct.

import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import request from 'supertest';
import { getApp, clearDb } from './helpers/app.js';
import { seedTestUsers, loginAs } from './helpers/seed.js';

let app;
let models;
let users;
let admin, financeManager, guest;
let invoiceId; // resource id used by the invoice rows

beforeAll(async () => {
  ({ app, models } = await getApp());
});

beforeEach(async () => {
  await clearDb();
  users = await seedTestUsers(models);
  admin = await loginAs(app, users.admin);
  financeManager = await loginAs(app, users.financeManager);
  guest = await loginAs(app, users.guest);
  // Seed one invoice so PUT/DELETE/payment rows have a target.
  const inv = await models.Invoice.create({
    invoiceNumber: `INV-AUTH-${Date.now()}`,
    invoiceDate: '2026-06-01',
    customerName: 'Authz Test Donor',
    totalAmount: 100,
    paidAmount: 0,
    balanceDue: 100,
    status: 'Sent',
    currency: 'LKR',
    originalAmount: 100,
    exchangeRate: 1,
    amountLkr: 100,
    rateSource: 'identity',
    createdBy: users.admin.id,
  });
  invoiceId = inv.id;
});

// ---- helpers -------------------------------------------------------------

const fire = (session, method, path, body) => {
  let req = session.auth(request(app)[method.toLowerCase()](path));
  if (body) req = req.send(body);
  return req;
};

// 2xx or 4xx-non-auth — anything except 401/403 means the gate let them in.
const assertAuthorised = (res, label) => {
  expect(res.status, `${label}: expected 2xx/4xx-business, got ${res.status} ${JSON.stringify(res.body)}`).not.toBe(401);
  expect(res.status, `${label}: expected 2xx/4xx-business, got 403`).not.toBe(403);
};

const assertForbidden = (res, label) => {
  expect(res.status, `${label}: expected 403, got ${res.status} ${JSON.stringify(res.body)}`).toBe(403);
};

// ---- matrix (active — gates ALREADY landed in PR #2) ---------------------

describe('Authorization matrix — invoice write routes (FINANCE_* gates)', () => {
  const row = (label, method, path, body) =>
    it(label, async () => {
      const url = path.replace('{invoiceId}', invoiceId);
      assertAuthorised(await fire(admin, method, url, body), `${label} — Admin`);
      assertForbidden(await fire(guest, method, url, body), `${label} — Guest`);
    });

  // FINANCE_CREATE
  row('POST /api/invoices — only finance-tier can create',
    'POST', '/api/invoices', {
      invoiceNumber: `INV-AUTHX-${Date.now()}`,
      invoiceDate: '2026-06-01',
      customerName: 'Test',
      totalAmount: 50,
      currency: 'LKR',
    });

  // FINANCE_EDIT
  row('PUT /api/invoices/:id — only finance-tier can edit',
    'PUT', '/api/invoices/{invoiceId}', { customerName: 'Renamed' });

  // FINANCE_EDIT (payment is an edit)
  row('POST /api/invoices/:id/payment — only finance-tier can record',
    'POST', '/api/invoices/{invoiceId}/payment', { originalAmount: 10 });

  // FINANCE_DELETE — tighter than CREATE/EDIT. Finance Manager has DELETE,
  // but a vanilla Guest does NOT.
  it('DELETE /api/invoices/:id — Guest cannot delete', async () => {
    const res = await fire(guest, 'DELETE', `/api/invoices/${invoiceId}`);
    assertForbidden(res, 'DELETE invoice — Guest');
  });

  it('DELETE /api/invoices/:id — Admin can delete', async () => {
    const res = await fire(admin, 'DELETE', `/api/invoices/${invoiceId}`);
    assertAuthorised(res, 'DELETE invoice — Admin');
  });
});

describe('Authorization matrix — exchange-rate write routes (FINANCE_EDIT)', () => {
  it('POST /api/exchange-rates/refresh — Admin allowed, Guest forbidden', async () => {
    assertAuthorised(await fire(admin, 'POST', '/api/exchange-rates/refresh'), 'refresh — Admin');
    assertForbidden(await fire(guest, 'POST', '/api/exchange-rates/refresh'), 'refresh — Guest');
  });

  it('POST /api/exchange-rates — Finance Manager allowed, Guest forbidden', async () => {
    const body = { currency: 'USD', odBuyingRate: 325 };
    assertAuthorised(await fire(financeManager, 'POST', '/api/exchange-rates', body), 'manual rate — FinanceManager');
    assertForbidden(await fire(guest, 'POST', '/api/exchange-rates', body), 'manual rate — Guest');
  });
});

describe('Authorization matrix — protect middleware sanity', () => {
  it('Unauthenticated requests to protected routes are 401, never 200', async () => {
    const endpoints = [
      ['GET',  '/api/invoices'],
      ['POST', '/api/invoices'],
      ['GET',  '/api/exchange-rates'],
      ['POST', '/api/auth/download-token'],
    ];
    for (const [method, path] of endpoints) {
      const res = await request(app)[method.toLowerCase()](path).send({});
      expect(res.status, `${method} ${path} unauth`).toBe(401);
    }
  });
});

// ---- todo rows (waiting on PR #5 merge into this branch's base) ----------
//
// These describe the bug PR #5 fixes. Flip each to `it(...)` after rebase.
// The assertion shapes are already correct — just remove the .todo.

describe.todo('Authorization matrix — finance routes gated by PR #5', () => {
  it.todo('POST /api/bank-accounts — Finance Manager allowed (currently 403 via ghost Manager role)');
  it.todo('PUT  /api/bank-accounts/:id — Finance Manager allowed');
  it.todo('DELETE /api/bank-transactions/:id — Finance Manager allowed');
  it.todo('DELETE /api/bills/:id — Finance Manager allowed');
  it.todo('PUT  /api/budgets/:id/approve — CEO allowed');
  it.todo('POST /api/chart-of-accounts — Finance Manager allowed');
  it.todo('PUT  /api/journal-entries/:id/post — CEO allowed');
  it.todo('PUT  /api/purchase-orders/:id/approve — Finance Manager allowed');
});

describe.todo('Authorization matrix — HR routes gated by PR #5', () => {
  it.todo('PUT /api/attendance/leave/requests/:id — HR Manager allowed');
  it.todo('DELETE /api/attendance/:id — HR Manager allowed');
  it.todo('POST /api/job-postings — HR Manager allowed');
  it.todo('POST /api/payroll — HR Manager allowed');
  it.todo('PUT /api/payroll/:id/process — HR Manager allowed');
});

describe.todo('Authorization matrix — Fundraising/Programme routes gated by PR #5', () => {
  it.todo('POST /api/campaigns — Fundraising Manager allowed');
  it.todo('DELETE /api/donations/:id — Fundraising Manager allowed');
  it.todo('POST /api/donors — Fundraising Manager allowed');
  it.todo('POST /api/vendor-calls — Programme Manager allowed');
});
