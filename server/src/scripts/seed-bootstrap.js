// First-run bootstrap. Creates a single Admin user when the users table is
// empty so a fresh deploy is loginable. Refuses to run if ANY user already
// exists — this is intentional; never overwrite real data.
//
// Run with:
//   node server/src/scripts/seed-bootstrap.js
//
// Required env (see .env.example):
//   BOOTSTRAP_ADMIN_USERNAME   default: 'admin'
//   BOOTSTRAP_ADMIN_EMAIL      required, must be a valid email
//   BOOTSTRAP_ADMIN_PASSWORD   required, min 12 chars
//   BOOTSTRAP_ADMIN_FULLNAME   default: 'Bootstrap Administrator'

import dotenv from 'dotenv';
dotenv.config();

import { User, sequelize } from '../models/index.js';

const ok = (m) => console.log(`✓ ${m}`);
const warn = (m) => console.warn(`! ${m}`);
const fail = (m, code = 1) => { console.error(`✗ ${m}`); process.exit(code); };

const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

async function run() {
  const username  = (process.env.BOOTSTRAP_ADMIN_USERNAME || 'admin').trim();
  const email     = (process.env.BOOTSTRAP_ADMIN_EMAIL || '').trim();
  const password  = process.env.BOOTSTRAP_ADMIN_PASSWORD || '';
  const fullName  = (process.env.BOOTSTRAP_ADMIN_FULLNAME || 'Bootstrap Administrator').trim();

  if (!isEmail(email)) {
    fail('BOOTSTRAP_ADMIN_EMAIL is required and must be a valid email address.');
  }
  if (!password || password.length < 12) {
    fail('BOOTSTRAP_ADMIN_PASSWORD is required and must be at least 12 characters.');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    fail('BOOTSTRAP_ADMIN_PASSWORD must contain upper, lower, and a digit.');
  }

  try {
    await sequelize.authenticate();
    ok('DB connection OK');
  } catch (err) {
    fail(`Cannot connect to DB: ${err.message}`);
  }

  const existing = await User.count();
  if (existing > 0) {
    warn(`Users table already has ${existing} row(s). Bootstrap skipped — refusing to modify a populated database.`);
    process.exit(0);
  }

  const conflict = await User.findOne({ where: { username } });
  if (conflict) {
    fail(`Username "${username}" already exists somehow even though count was 0. Aborting.`);
  }

  // Password is hashed by the User model's beforeCreate hook.
  const user = await User.create({
    username,
    email,
    password,
    fullName,
    role: 'Admin',
    status: 'Active'
  });

  ok(`Created Admin user #${user.id} (${user.username}, ${user.email})`);
  ok('Login at /admin/login with the credentials you set in env.');
  warn('Rotate this password on first login — it currently lives in your environment.');
  process.exit(0);
}

run().catch((err) => fail(err.stack || err.message || String(err)));
