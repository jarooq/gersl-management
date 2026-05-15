import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { protect } from '../middleware/auth.middleware.js';
import {
  isStorageConfigured,
  isPublicKey,
  publicUrlFor,
  signGetUrl
} from '../services/storage.js';

const router = express.Router();

const UPLOADS_ROOT = path.resolve(process.cwd(), 'uploads');

// Subpaths served WITHOUT a logged-in user. These are reached by plain
// <img> tags / Image.network in the web + mobile apps, which cannot attach
// a JWT — so requiring auth here just makes the image fail to load.
//   - campaigns : donor-portal hero images (genuinely public).
//   - profiles  : staff avatars. The R2 object itself stays PRIVATE; it is
//                 reached via a short-lived signed redirect, and filenames
//                 carry a random suffix, so this is low-risk.
const OPEN_SUBPATHS = ['campaigns', 'profiles'];

const topSegment = (p, sep) => p.replace(/^\/+/, '').split(sep)[0];

// Disk path resolver — defeats `..` traversal and absolute paths.
const safeResolve = (reqPath) => {
  const decoded = decodeURIComponent(reqPath.replace(/^\/+/, ''));
  const abs = path.resolve(UPLOADS_ROOT, decoded);
  if (!abs.startsWith(UPLOADS_ROOT + path.sep) && abs !== UPLOADS_ROOT) {
    return null;
  }
  return abs;
};

const serveDiskFile = (req, res) => {
  const abs = safeResolve(req.path);
  if (!abs) return res.status(400).json({ success: false, message: 'Invalid path' });
  fs.stat(abs, (err, stat) => {
    if (err || !stat.isFile()) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
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

// When S3 is configured: redirect to the public CDN URL when one is
// available, otherwise sign the object and redirect. The signed URL is
// self-authenticating, so the actual R2 object can stay private.
const serveS3 = async (req, res) => {
  const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
  if (!key) return res.status(400).json({ success: false, message: 'Invalid path' });

  try {
    if (isPublicKey(key)) {
      const url = publicUrlFor(key);
      // Only when S3_PUBLIC_BASE_URL is set. Without it, fall through to a
      // signed redirect so the asset still loads (just not CDN-cacheable).
      if (url) return res.redirect(302, url);
    }
    const signed = await signGetUrl(key, 3600);
    return res.redirect(302, signed);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to sign URL' });
  }
};

router.get('/*', (req, res, next) => {
  // S3-backed: keys under OPEN_SUBPATHS skip the auth gate; everything else
  // requires a valid session before receiving a 302 to a signed URL.
  if (isStorageConfigured()) {
    const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
    if (!key) return res.status(400).json({ success: false, message: 'Invalid path' });
    if (OPEN_SUBPATHS.includes(topSegment(key, '/'))) return serveS3(req, res);
    return protect(req, res, () => serveS3(req, res));
  }

  // Disk fallback (local dev / pre-R2 setup).
  const abs = safeResolve(req.path);
  if (!abs) return res.status(400).json({ success: false, message: 'Invalid path' });
  const rel = path.relative(UPLOADS_ROOT, abs);
  if (OPEN_SUBPATHS.includes(topSegment(rel, path.sep))) return serveDiskFile(req, res);
  return protect(req, res, () => serveDiskFile(req, res));
});

export default router;
