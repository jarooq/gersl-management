/**
 * Rule: a staff document is about to expire.
 *
 * Expired contracts, visas, police clearances and safeguarding certificates are
 * a compliance finding waiting to happen — and they always surface during an
 * audit rather than before one.
 */

import { select, hasColumns, startOfToday, addDays, toDateOnly, daysBetween } from '../db.js';
import { documentUrl, describeDays } from './shared.js';

export default {
  key: 'document_expiring',
  name: 'Staff document expiring',
  category: 'compliance',

  isAvailable: () =>
    hasColumns('staff_documents', ['id', 'user_id', 'document_name', 'document_type', 'expiry_date', 'status']),

  async detect({ config }) {
    const settings = config.rules.documentExpiring;
    if (!settings.enabled) return [];

    const horizons = [...settings.horizons].sort((a, b) => b - a);
    const today = startOfToday();
    const furthest = toDateOnly(addDays(today, horizons[0]));

    const rows = await select(
      `SELECT d.id, d.user_id AS "userId", d.document_name AS "documentName",
              d.document_type AS "documentType", d.expiry_date AS "expiryDate", d.status,
              u.full_name AS "ownerName"
         FROM staff_documents d
         JOIN users u ON u.id = d.user_id AND u.status = 'Active'
        WHERE d.expiry_date IS NOT NULL
          AND d.expiry_date <= :furthest
          AND (d.status IS NULL OR d.status <> 'Rejected')`,
      { furthest }
    );

    const findings = [];

    for (const row of rows) {
      const daysLeft = daysBetween(today, row.expiryDate);
      const label = row.documentName || row.documentType || 'Document';

      if (daysLeft < 0) {
        const daysPast = Math.abs(daysLeft);
        findings.push({
          dedupeKey: `document_expired:${row.id}`,
          severity: 'critical',
          entityType: 'staff_document',
          entityId: row.id,
          projectId: null,
          ownerUserId: Number(row.userId),
          title: `Expired: ${label}`,
          message:
            `${label} for ${row.ownerName} expired on ${row.expiryDate} (${daysPast} days ago). ` +
            `An expired document is an audit finding — please upload the renewed version.`,
          actionUrl: documentUrl(),
          actionLabel: 'Upload renewal',
          metadata: { documentType: row.documentType, expiryDate: row.expiryDate, daysPast }
        });
        continue;
      }

      const horizon = horizons.find((h) => daysLeft <= h);
      if (horizon === undefined) continue;

      findings.push({
        dedupeKey: `document_expiring:${row.id}:${horizon}`,
        severity: daysLeft <= 7 ? 'high' : daysLeft <= 30 ? 'warning' : 'info',
        entityType: 'staff_document',
        entityId: row.id,
        projectId: null,
        ownerUserId: Number(row.userId),
        title: `${label} expires ${describeDays(daysLeft)}`,
        message:
          `${label} for ${row.ownerName} expires on ${row.expiryDate} (${describeDays(daysLeft)}). ` +
          `Start the renewal now so there is no gap in compliance.`,
        actionUrl: documentUrl(),
        actionLabel: 'Open documents',
        metadata: { documentType: row.documentType, expiryDate: row.expiryDate, daysLeft, horizon }
      });
    }

    return findings;
  }
};
