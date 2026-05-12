// =============================================================================
// Email service — thin wrapper around nodemailer.
//
// Configuration (env vars):
//   SMTP_HOST       — required for actual sending (e.g. smtp.sendgrid.net)
//   SMTP_PORT       — defaults to 587
//   SMTP_SECURE     — 'true' to force TLS (port 465). Defaults false (STARTTLS).
//   SMTP_USER       — SMTP auth username
//   SMTP_PASS       — SMTP auth password
//   EMAIL_FROM      — sender address, e.g. "GERSL <noreply@gersl.org>"
//   APP_BASE_URL    — used to build deep links in email bodies (no trailing /)
//
// If SMTP_HOST or EMAIL_FROM is missing, every call short-circuits with a
// console.log("[email] skipped"). This makes the service safe to leave wired
// to all events even before SMTP credentials are provisioned. Operationally
// you wire SMTP env vars on Vercel and the same code starts sending.
// =============================================================================

import { Op } from 'sequelize';
import { User } from '../models/index.js';

let _transporter = null;
let _transporterInitTried = false;

const fromAddr = process.env.EMAIL_FROM || '';
const baseUrl  = (process.env.APP_BASE_URL || 'https://gersl-management-jet.vercel.app').replace(/\/+$/, '');

const enabled = () =>
  Boolean(process.env.SMTP_HOST) && Boolean(process.env.EMAIL_FROM);

const getTransporter = async () => {
  if (_transporter) return _transporter;
  if (_transporterInitTried) return null;
  _transporterInitTried = true;
  if (!enabled()) return null;
  try {
    const { default: nodemailer } = await import('nodemailer');
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: (process.env.SMTP_USER && process.env.SMTP_PASS)
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    return _transporter;
  } catch (err) {
    console.error('[email] failed to init nodemailer:', err.message);
    return null;
  }
};

/**
 * Send a single email. Returns a Promise that resolves to true on success,
 * false on any failure. NEVER throws — callers can `await` without try/catch
 * and proceed even when email delivery fails. Business logic should not
 * depend on email success.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  if (!enabled()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email] skipped (SMTP not configured): to=${to} subject="${subject}"`);
    }
    return false;
  }
  if (!to || (Array.isArray(to) && to.length === 0)) return false;

  const transporter = await getTransporter();
  if (!transporter) return false;

  try {
    await transporter.sendMail({
      from: fromAddr,
      to: Array.isArray(to) ? to.filter(Boolean).join(', ') : to,
      subject,
      text: text || stripHtml(html || ''),
      html,
    });
    return true;
  } catch (err) {
    console.error(`[email] send failed (subject="${subject}"):`, err.message);
    return false;
  }
};

// Strip tags for the plain-text fallback. Tiny — not RFC-strict.
const stripHtml = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

/**
 * Find email addresses of users with any of the given roles. Used to fan out
 * approval notifications to HR / Finance teams without hard-coding addresses.
 */
export const getRoleEmails = async (roles) => {
  if (!Array.isArray(roles) || roles.length === 0) return [];
  const users = await User.findAll({
    where: { role: { [Op.in]: roles }, status: 'Active' },
    attributes: ['email'],
  });
  return [...new Set(users.map(u => u.email).filter(Boolean))];
};

// ----------------------------------------------------------------------------
// Templating helpers — kept simple. Each notification gets its own helper so
// the wording is consistent and easy to tweak in one place.
// ----------------------------------------------------------------------------

const wrap = (title, bodyHtml) => `
<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;padding:20px;color:#222;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <div style="background:#0D1D3D;color:#fff;padding:14px 20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a4f056;font-weight:700;">GERSL · Notification</div>
      <div style="font-size:17px;font-weight:700;margin-top:4px;">${escape(title)}</div>
    </div>
    <div style="padding:18px 20px;font-size:14px;line-height:1.55;">${bodyHtml}</div>
    <div style="padding:12px 20px;background:#f9fafb;border-top:1px solid #f0f0f0;font-size:11px;color:#666;">
      Global Ehsan Relief Sri Lanka · automated message from the management system.
    </div>
  </div>
</body></html>`;

const escape = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fmtAmount = (amount, currency = 'LKR') =>
  `${currency} ${Number(amount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const btn = (label, href) =>
  `<a href="${href}" style="display:inline-block;background:#0D1D3D;color:#fff;text-decoration:none;padding:8px 14px;border-radius:6px;font-weight:600;font-size:13px;">${escape(label)}</a>`;

// ----------------------------------------------------------------------------
// Submission notifications (to approvers)
// ----------------------------------------------------------------------------

export const notifyLeaveSubmitted = async ({ leave, requester }) => {
  const recipients = await getRoleEmails(['HR Manager', 'HR Officer', 'Admin', 'CEO']);
  if (recipients.length === 0) return false;
  const body = `
    <p><strong>${escape(requester.fullName)}</strong> submitted a leave request.</p>
    <table style="font-size:13px;margin:8px 0;">
      <tr><td style="color:#666;padding:2px 12px 2px 0;">Type</td><td>${escape(leave.leaveType || '')}</td></tr>
      <tr><td style="color:#666;padding:2px 12px 2px 0;">Period</td><td>${escape(leave.startDate)} → ${escape(leave.endDate)}</td></tr>
      ${leave.daysCount ? `<tr><td style="color:#666;padding:2px 12px 2px 0;">Days</td><td>${leave.daysCount}</td></tr>` : ''}
      ${leave.reason   ? `<tr><td style="color:#666;padding:2px 12px 2px 0;">Reason</td><td>${escape(leave.reason)}</td></tr>` : ''}
    </table>
    <p style="margin-top:14px;">${btn('Open Approvals', baseUrl + '/admin/approvals')}</p>`;
  return sendEmail({
    to: recipients,
    subject: `Leave request from ${requester.fullName}`,
    html: wrap('New leave request', body),
  });
};

export const notifyExpenseSubmitted = async ({ expense, requester }) => {
  const recipients = await getRoleEmails(['Finance Manager', 'Finance Officer', 'Admin', 'CEO']);
  if (recipients.length === 0) return false;
  const body = `
    <p><strong>${escape(requester.fullName)}</strong> submitted an expense claim.</p>
    <table style="font-size:13px;margin:8px 0;">
      <tr><td style="color:#666;padding:2px 12px 2px 0;">Amount</td><td><strong>${fmtAmount(expense.amount, expense.currency)}</strong></td></tr>
      <tr><td style="color:#666;padding:2px 12px 2px 0;">Category</td><td>${escape(expense.category || '')}</td></tr>
      ${expense.description ? `<tr><td style="color:#666;padding:2px 12px 2px 0;">Description</td><td>${escape(expense.description)}</td></tr>` : ''}
      ${expense.date        ? `<tr><td style="color:#666;padding:2px 12px 2px 0;">Date</td><td>${escape(expense.date)}</td></tr>` : ''}
    </table>
    <p style="margin-top:14px;">${btn('Open Staff Expenses', baseUrl + '/admin/hr/staff-expenses')}</p>`;
  return sendEmail({
    to: recipients,
    subject: `Expense claim from ${requester.fullName} — ${fmtAmount(expense.amount, expense.currency)}`,
    html: wrap('New expense claim', body),
  });
};

export const notifySalaryAdvanceSubmitted = async ({ advance, requester }) => {
  const recipients = await getRoleEmails(['HR Manager', 'HR Officer', 'Finance Manager', 'Admin', 'CEO']);
  if (recipients.length === 0) return false;
  const body = `
    <p><strong>${escape(requester.fullName)}</strong> requested a salary advance.</p>
    <table style="font-size:13px;margin:8px 0;">
      <tr><td style="color:#666;padding:2px 12px 2px 0;">Amount</td><td><strong>${fmtAmount(advance.amount)}</strong></td></tr>
      ${advance.reason ? `<tr><td style="color:#666;padding:2px 12px 2px 0;">Reason</td><td>${escape(advance.reason)}</td></tr>` : ''}
    </table>
    <p style="margin-top:14px;">${btn('Open Salary Advances', baseUrl + '/admin/hr/salary-advances')}</p>`;
  return sendEmail({
    to: recipients,
    subject: `Salary advance request from ${requester.fullName} — ${fmtAmount(advance.amount)}`,
    html: wrap('New salary advance request', body),
  });
};

// ----------------------------------------------------------------------------
// Decision notifications (to requesters)
// ----------------------------------------------------------------------------

export const notifyDecision = async ({ to, kind, decision, reason }) => {
  if (!to) return false;
  const approved = decision === 'Approved' || decision === 'approve';
  const label = approved ? 'approved' : 'rejected';
  const heading = approved ? '✓ Approved' : '✗ Rejected';
  const accent  = approved ? '#16a34a'   : '#dc2626';
  const body = `
    <p>Your <strong>${escape(kind)}</strong> request has been <span style="color:${accent};font-weight:700;">${label}</span>.</p>
    ${reason ? `<p style="background:#f9fafb;border-left:3px solid #d1d5db;padding:8px 10px;margin:8px 0;font-size:13px;"><em>Note:</em> ${escape(reason)}</p>` : ''}
    <p style="margin-top:12px;color:#666;font-size:12px;">Open the GERSL mobile app to see the latest status.</p>`;
  return sendEmail({
    to,
    subject: `Your ${kind} request was ${label}`,
    html: wrap(heading + ' — ' + kind, body),
  });
};
