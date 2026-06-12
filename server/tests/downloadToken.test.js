// Tests for the short-lived download-token kind-scoping the audit found
// missing and we wired up earlier this session.
//
// Two specific failure modes are guarded:
//   1. A leaked download token must NOT work as a full session token on
//      arbitrary endpoints. (`kind: 'download'` claim is now enforced in
//      verifyToken.)
//   2. The download-URL allow-list match must run on `req.path`, not
//      `req.originalUrl`. Otherwise an attacker could smuggle "/pdf" into
//      the query string of a non-download URL and pass the gate:
//
//        GET /api/users?x=/pdf&token=<download>   ← must 401
//
// If either of these regress, finance staff lose the most consequential
// hardening from the audit.

import { describe, it, beforeAll, beforeEach, expect } from 'vitest';
import request from 'supertest';
import { getApp, clearDb } from './helpers/app.js';
import { seedTestUsers, loginAs } from './helpers/seed.js';

let app;
let models;
let admin;

beforeAll(async () => {
  ({ app, models } = await getApp());
});

beforeEach(async () => {
  await clearDb();
  const users = await seedTestUsers(models);
  admin = await loginAs(app, users.admin);
});

async function mintDownloadToken() {
  const res = await admin.auth(request(app).get('/api/auth/download-token'));
  expect(res.status, 'mint /api/auth/download-token').toBe(200);
  expect(res.body.data.token, 'token in response body').toBeTypeOf('string');
  expect(res.body.data.expiresIn, 'TTL field').toBe(120);
  return res.body.data.token;
}

describe('download-token endpoint', () => {
  it('issues a token only when authenticated', async () => {
    const anon = await request(app).get('/api/auth/download-token');
    expect(anon.status).toBe(401);
  });

  it('issues a 120-second token for an authenticated user', async () => {
    const token = await mintDownloadToken();
    expect(token.length).toBeGreaterThan(20); // sanity — looks like a JWT
  });
});

describe('download-token kind scoping (verifyToken)', () => {
  it('REJECTS a download token on a non-download endpoint', async () => {
    const token = await mintDownloadToken();
    // /api/users is a fully-fledged endpoint that has no whiff of a download
    // URL — the token must not authenticate here.
    const res = await request(app)
      .get(`/api/users?token=${encodeURIComponent(token)}`);
    expect(res.status, 'download token on /api/users').toBe(401);
    expect((res.body.message || '').toLowerCase())
      .toMatch(/download urls? only|access denied|token/);
  });

  it('REJECTS a download token used as a Bearer on a non-download endpoint', async () => {
    const token = await mintDownloadToken();
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status, 'download token as Bearer on /api/users').toBe(401);
  });
});

describe('download-URL smuggling via query string', () => {
  it('a "/pdf" substring in the query MUST NOT bypass the gate', async () => {
    // The classic attack: append something that looks download-ish to the
    // query string of a sensitive endpoint and use a download token to hit
    // it. The middleware fix tests req.path, which excludes the query.
    const token = await mintDownloadToken();
    const res = await request(app)
      .get(`/api/users?cover=/pdf&token=${encodeURIComponent(token)}`);
    expect(res.status, 'smuggled /pdf in querystring').toBe(401);
  });
});

describe('regular access tokens still work', () => {
  it('Admin\'s session Bearer authenticates /api/users normally', async () => {
    // Sanity check — this regression test would scream loudly if the
    // kind-scoping accidentally rejected all tokens, not just download ones.
    const res = await admin.auth(request(app).get('/api/users'));
    expect(res.status, 'admin Bearer on /api/users').not.toBe(401);
    expect(res.status, 'admin Bearer on /api/users').not.toBe(403);
  });
});
