// AuditLog retention sweep. Deletes entries older than AUDIT_LOG_RETENTION_DAYS
// (default: 730 days / 2 years). Run via Vercel cron weekly.
//
// We delete instead of archive because the AuditLog is a write-once,
// occasionally-read trail; if you need long-term retention, point this at a
// separate `audit_log_archive` table or push to S3 before delete.

import { AuditLog } from '../../server/src/models/index.js';
import { Op } from 'sequelize';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (req.headers.authorization !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const days = Number(process.env.AUDIT_LOG_RETENTION_DAYS) || 730;
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const deleted = await AuditLog.destroy({
      where: { createdAt: { [Op.lt]: cutoff } },
    });
    return res.status(200).json({
      ok: true,
      retentionDays: days,
      cutoff: cutoff.toISOString(),
      deleted,
    });
  } catch (err) {
    console.error('cron/audit-prune failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
