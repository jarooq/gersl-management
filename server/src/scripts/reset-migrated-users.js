#!/usr/bin/env node
/**
 * Bulk password-reset for users created by the GERHR migration. The migrator
 * sets a placeholder bcrypt hash; this script generates a one-time reset
 * token for each migrated account and writes it back as
 * password_reset_token / password_reset_expires.
 *
 * The frontend's "Forgot password" flow already accepts these tokens via
 * /api/auth/reset-password — so the workflow is:
 *   1. Run this script  →  prints reset URLs
 *   2. Email those URLs to staff (mail merge or copy-paste)
 *   3. Staff clicks → sets a real password → can log in
 *
 * SMTP integration is optional — if EMAIL_FROM + SMTP_HOST are set the
 * script will offer to send the emails directly (requires nodemailer).
 *
 *   node src/scripts/reset-migrated-users.js          # print URLs only
 *   node src/scripts/reset-migrated-users.js --send   # also send via SMTP
 */

import crypto from 'node:crypto';
import dotenv from 'dotenv';
import sequelize from '../config/database.js';
import { GerhrMigration, User } from '../models/index.js';

dotenv.config();

const SEND = process.argv.includes('--send');
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const EXPIRES_HOURS = 24 * 7; // 1 week

(async () => {
  await sequelize.authenticate();

  const migrated = await GerhrMigration.findAll({
    where: { collection: 'staff', targetTable: 'users' },
    attributes: ['targetId'],
    raw: true
  });
  const ids = migrated.map(r => r.targetId).filter(Boolean);
  if (ids.length === 0) {
    console.log('No migrated users found. Has migrate-gerhr run?');
    process.exit(0);
  }

  console.log(`Generating reset tokens for ${ids.length} migrated user(s)…`);
  const expiresAt = new Date(Date.now() + EXPIRES_HOURS * 60 * 60 * 1000);

  const lines = [];
  for (const id of ids) {
    const user = await User.findByPk(id);
    if (!user) continue;
    const token = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = token;
    user.passwordResetExpires = expiresAt;
    await user.save();
    const url = `${FRONTEND_URL}/admin/reset-password?token=${token}`;
    lines.push({ name: user.fullName, email: user.email, url });
  }
  console.table(lines);

  if (!SEND) {
    console.log('\nDry mode. Re-run with --send to dispatch via SMTP.');
    process.exit(0);
  }

  // SMTP send path — requires nodemailer (already in dependencies).
  if (!process.env.SMTP_HOST || !process.env.EMAIL_FROM) {
    console.error('SMTP_HOST and EMAIL_FROM env vars required to send.');
    process.exit(1);
  }
  const { default: nodemailer } = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: process.env.SMTP_USER ? {
      user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD
    } : undefined
  });

  for (const { name, email, url } of lines) {
    if (!email) continue;
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Set your GERSL password',
      text:
`Hi ${name},

Your GERSL HR / field-staff account has been migrated to the new platform.
Click the link below to set a password (valid for 7 days):

${url}

If you didn't expect this email, please contact HR.`,
    });
    console.log(`  → sent to ${email}`);
  }
  console.log('Done.');
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
