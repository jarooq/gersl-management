// Minimal control test — proves Vercel functions work in this project.
// If /api/ping returns 200 fast but /api/health hangs, the issue is inside
// the Express app, not Vercel runtime.
export default function handler(req, res) {
  res.status(200).json({ ok: true, ts: Date.now() });
}
