// Vercel Cron entrypoint — replaces the node-cron job in server.js (cron
// only runs in long-lived processes; Vercel functions are stateless).
// Vercel hits this URL on the schedule defined in vercel.json `crons`.
//
// Authz: Vercel sets x-vercel-cron header on cron-triggered invocations.
// Optionally validate CRON_SECRET to refuse manual probes.

import { clusterAllUsersForDate } from '../../server/src/services/movementClusterer.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (process.env.CRON_SECRET) {
    const expected = `Bearer ${process.env.CRON_SECRET}`;
    if (req.headers.authorization !== expected) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  const dateStr = d.toISOString().slice(0, 10);

  try {
    const summary = await clusterAllUsersForDate(dateStr);
    return res.status(200).json({ ok: true, date: dateStr, processed: summary.length, summary });
  } catch (err) {
    console.error('cron/cluster failed:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
