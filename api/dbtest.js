// Diagnostic — connects to Supabase with HARDCODED creds, completely
// bypassing the Express app + env-var chain. Tells us whether the
// problem is the env pipe or Supabase rejecting the connection itself.
// REMOVE this file once login works.

import pg from 'pg';

export default async function handler(req, res) {
  const out = {};

  // 1. Confirm what env says
  out.env = {
    DATABASE_URL_present: !!process.env.DATABASE_URL,
    DATABASE_URL_length:  (process.env.DATABASE_URL || '').length,
    DATABASE_URL_prefix:  (process.env.DATABASE_URL || '').slice(0, 50),
    DB_USER:    process.env.DB_USER ?? null,
    DB_PASSWORD_length: (process.env.DB_PASSWORD || '').length,
    DB_PASSWORD_first2: (process.env.DB_PASSWORD || '').slice(0, 2),
    DB_PASSWORD_last3:  (process.env.DB_PASSWORD || '').slice(-3),
  };

  // 2. Hardcoded connection — same string we use locally
  const HARDCODED = 'postgresql://postgres.jkmkeycwpqvhgjmkwyap:%23%23Assal%40%402026@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres';
  const client = new pg.Client({ connectionString: HARDCODED, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const r = await client.query('SELECT current_user AS u, version() AS v');
    out.hardcoded = { ok: true, current_user: r.rows[0].u, version: r.rows[0].v.slice(0, 60) };
    await client.end();
  } catch (e) {
    out.hardcoded = { ok: false, error: e.message, code: e.code };
    try { await client.end(); } catch {}
  }

  // 3. Env-driven connection
  if (process.env.DATABASE_URL) {
    const c2 = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    try {
      await c2.connect();
      const r2 = await c2.query('SELECT current_user AS u');
      out.envDriven = { ok: true, current_user: r2.rows[0].u };
      await c2.end();
    } catch (e) {
      out.envDriven = { ok: false, error: e.message, code: e.code };
      try { await c2.end(); } catch {}
    }
  }

  res.status(200).json(out);
}
