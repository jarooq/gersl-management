import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

// Subpaths exposed publicly (e.g. campaign hero images shown on the donor portal).
// Anything not listed here goes through `protect`.
const PUBLIC_SUBPATHS = ['campaigns'];

const isPublic = (relPath) => {
  const top = relPath.split(path.sep)[0];
  return PUBLIC_SUBPATHS.includes(top);
};

// Resolve & guard the requested path. Returns null if invalid / outside root.
const safeResolve = (reqPath) => {
  // strip leading slashes; decode %xx
  const decoded = decodeURIComponent(reqPath.replace(/^\/+/, ''));
  const abs = path.resolve(UPLOADS_ROOT, decoded);
  // Must stay under UPLOADS_ROOT (defeats `..` traversal and absolute paths).
  if (!abs.startsWith(UPLOADS_ROOT + path.sep) && abs !== UPLOADS_ROOT) {
    return null;
  }
  return abs;
};

const serveFile = (req, res) => {
  const abs = safeResolve(req.path);
  if (!abs) return res.status(400).json({ success: false, message: 'Invalid path' });

  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    // Inline display, sane caching for static assets, range support.
    res.sendFile(abs, {
      maxAge: '1d',
      dotfiles: 'deny',
      headers: { 'X-Content-Type-Options': 'nosniff' }
    }, (sendErr) => {
      if (sendErr && !res.headersSent) {
        res.status(500).json({ success: false, message: 'Failed to send file' });
      }
    });
  });
};

router.get('/*', (req, res, next) => {
  const abs = safeResolve(req.path);
  if (!abs) return res.status(400).json({ success: false, message: 'Invalid path' });
  const rel = path.relative(UPLOADS_ROOT, abs);

  if (isPublic(rel)) return serveFile(req, res);

  // Authenticated path
  return protect(req, res, () => serveFile(req, res));
});

export default router;
