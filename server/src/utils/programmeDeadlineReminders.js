// =============================================================================
// Programme deadline reminders
//
// Runs once a day and:
//   1. Finds WASH and IGP items whose plannedCompletion is in 7 days, 1 day,
//      or already overdue (and stage hasn't reached Reported/Cancelled).
//   2. Groups items by assigned supervisor.
//   3. Emails each supervisor a single digest of their at-risk items.
//   4. Emails any item without a supervisor to a fallback Programme Manager
//      pool.
//
// Best-effort: each email is dispatched through the existing email service,
// which short-circuits silently when SMTP isn't configured.
// =============================================================================

import { Op } from 'sequelize';
import {
  WashItem, IgpItem, WashOrder, IgpOrder, User,
} from '../models/index.js';
import { sendEmail, getRoleEmails } from '../services/email.service.js';

const TERMINAL_WASH = ['Reported', 'Cancelled'];
const TERMINAL_IGP  = ['Reported', 'Cancelled'];

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

const fmtRow = (kind, item) => {
  const code = item.itemCode || `#${item.id}`;
  const ben  = item.beneficiaryName || 'unnamed beneficiary';
  const dist = item.district ? ` · ${item.district}` : '';
  const type = kind === 'wash' ? item.unitType : item.assetType;
  return `<tr>
    <td style="padding:6px 10px 6px 0;font-family:monospace;font-size:12px;color:#666;">${code}</td>
    <td style="padding:6px 10px 6px 0;font-weight:600;">${ben}</td>
    <td style="padding:6px 10px 6px 0;color:#666;">${type}${dist}</td>
    <td style="padding:6px 10px 6px 0;font-weight:bold;">${item.plannedCompletion || '—'}</td>
  </tr>`;
};

const wrapDigest = (bucketLabel, totalCount, sections) => `
<!doctype html><html><body style="font-family:Arial,Helvetica,sans-serif;background:#f5f5f5;padding:20px;color:#222;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <div style="background:#0D1D3D;color:#fff;padding:14px 20px;">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#a4f056;font-weight:700;">GERSL · Deadline reminder</div>
      <div style="font-size:17px;font-weight:700;margin-top:4px;">${bucketLabel}</div>
      <div style="font-size:12px;color:#cbd5e1;margin-top:2px;">${totalCount} item${totalCount === 1 ? '' : 's'} need your attention</div>
    </div>
    <div style="padding:18px 20px;font-size:14px;line-height:1.55;">
      ${sections.join('')}
      <p style="margin-top:18px;color:#666;font-size:12px;">Open the GERSL admin or mobile app to advance these items.</p>
    </div>
    <div style="padding:12px 20px;background:#f9fafb;border-top:1px solid #f0f0f0;font-size:11px;color:#666;">
      Global Ehsan Relief Sri Lanka · automated daily reminder.
    </div>
  </div>
</body></html>`;

const sectionFor = (kind, label, items) => {
  if (items.length === 0) return '';
  const colour = label.toLowerCase().includes('overdue') ? '#dc2626'
               : label.toLowerCase().includes('tomorrow') ? '#f59e0b'
               : '#0D1D3D';
  return `
    <h3 style="font-size:13px;color:${colour};text-transform:uppercase;letter-spacing:0.05em;margin:14px 0 6px;">
      ${kind.toUpperCase()} · ${label} (${items.length})
    </h3>
    <table style="border-collapse:collapse;font-size:13px;width:100%;">
      <tbody>${items.map(it => fmtRow(kind, it)).join('')}</tbody>
    </table>`;
};

/**
 * Pull at-risk items across both modules, bucketed by supervisor.
 * Returns { bySupervisor: Map<userId, {user, washOverdue, washTomorrow, washWeek, igpOverdue, igpTomorrow, igpWeek}>, unassigned: same shape }
 */
const collectAtRiskItems = async () => {
  const t1  = addDays(1);
  const t7  = addDays(7);
  const t0  = today();

  const includeOrder = (OrderModel) => ({
    model: OrderModel, as: 'order', attributes: ['id', 'orderCode', 'deadline', 'status'],
    where: { status: 'Active' },     // ignore items under cancelled/completed orders
    required: true,
  });

  const washWhere = {
    stage: { [Op.notIn]: TERMINAL_WASH },
    plannedCompletion: { [Op.lte]: t7 },
  };
  const igpWhere = {
    stage: { [Op.notIn]: TERMINAL_IGP },
    plannedCompletion: { [Op.lte]: t7 },
  };

  const [washItems, igpItems] = await Promise.all([
    WashItem.findAll({
      where: washWhere,
      include: [includeOrder(WashOrder), { model: User, as: 'supervisor', attributes: ['id', 'fullName', 'email'] }],
      attributes: ['id', 'itemCode', 'beneficiaryName', 'district', 'unitType', 'stage', 'plannedCompletion', 'assignedSupervisorId'],
    }),
    IgpItem.findAll({
      where: igpWhere,
      include: [includeOrder(IgpOrder), { model: User, as: 'supervisor', attributes: ['id', 'fullName', 'email'] }],
      attributes: ['id', 'itemCode', 'beneficiaryName', 'district', 'assetType', 'stage', 'plannedCompletion', 'assignedSupervisorId'],
    }),
  ]);

  const buckets = new Map(); // key: userId | 'unassigned'
  const pushTo = (key, sup, kind, label, item) => {
    if (!buckets.has(key)) {
      buckets.set(key, {
        supervisor: sup, kind: { wash: { overdue: [], tomorrow: [], week: [] }, igp: { overdue: [], tomorrow: [], week: [] } },
      });
    }
    buckets.get(key).kind[kind][label].push(item);
  };

  const classify = (plannedCompletion) => {
    if (!plannedCompletion) return null;
    const s = String(plannedCompletion);
    if (s < t0)       return 'overdue';
    if (s === t0 || s === t1) return 'tomorrow';
    if (s <= t7)      return 'week';
    return null;
  };

  for (const it of washItems) {
    const bucket = classify(it.plannedCompletion);
    if (!bucket) continue;
    const key = it.supervisor?.id ? `u${it.supervisor.id}` : 'unassigned';
    pushTo(key, it.supervisor || null, 'wash', bucket, it);
  }
  for (const it of igpItems) {
    const bucket = classify(it.plannedCompletion);
    if (!bucket) continue;
    const key = it.supervisor?.id ? `u${it.supervisor.id}` : 'unassigned';
    pushTo(key, it.supervisor || null, 'igp', bucket, it);
  }

  return buckets;
};

/**
 * Send one digest email per supervisor. Returns a summary of what was sent.
 */
export const sendDeadlineReminders = async () => {
  const buckets = await collectAtRiskItems();
  const summary = { emailsSent: 0, recipients: [], totalItems: 0 };

  for (const [key, bucket] of buckets.entries()) {
    const sections = [];
    let totalCount = 0;
    for (const kind of ['wash', 'igp']) {
      const counts = bucket.kind[kind];
      if (counts.overdue.length)  sections.push(sectionFor(kind, 'Overdue',     counts.overdue));
      if (counts.tomorrow.length) sections.push(sectionFor(kind, 'Due tomorrow', counts.tomorrow));
      if (counts.week.length)     sections.push(sectionFor(kind, 'Due this week', counts.week));
      totalCount += counts.overdue.length + counts.tomorrow.length + counts.week.length;
    }
    if (totalCount === 0) continue;

    let recipients = [];
    let bucketLabel = '';
    if (key === 'unassigned') {
      recipients = await getRoleEmails(['Programme Manager', 'Director Programmes', 'Admin', 'CEO']);
      bucketLabel = 'Items without a supervisor';
    } else if (bucket.supervisor?.email) {
      recipients = [bucket.supervisor.email];
      bucketLabel = `Hi ${bucket.supervisor.fullName?.split(' ')[0] || ''} — items at risk`;
    } else {
      continue;
    }
    if (recipients.length === 0) continue;

    const sent = await sendEmail({
      to: recipients,
      subject: `[GERSL] ${totalCount} programme item${totalCount === 1 ? '' : 's'} need attention`,
      html: wrapDigest(bucketLabel, totalCount, sections),
    });
    if (sent) {
      summary.emailsSent += 1;
      summary.recipients.push(...recipients);
      summary.totalItems += totalCount;
    }
  }
  return summary;
};
