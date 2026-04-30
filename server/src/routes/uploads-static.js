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

// Subpaths exposed publicly (campaign hero images on the donor portal).
const PUBLIC_SUBPATHS = ['campaigns'];

const isPublicRel = (relPath) => {
  const top = relPath.split(path.sep)[0];
  return PUBLIC_SUBPATHS.includes(top);
};

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

// When S3 is configured: redirect to the CDN URL for public keys, sign and
// redirect for protected ones. The `protect` middleware already ran for
// non-public paths.
const serveS3 = async (req, res) => {
  // Strip leading slash; the rest of the URL is the S3 key as-stored.
  const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
  if (!key) return res.status(400).json({ success: false, message: 'Invalid path' });

  try {
    if (isPublicKey(key)) {
      const url = publicUrlFor(key);
      if (!url) {
        return res.status(500).json({
          success: false,
          message: 'S3_PUBLIC_BASE_URL is not configured for public assets'
        });
      }
      return res.redirect(302, url);
    }
    const signed = await signGetUrl(key, 3600);
    return res.redirect(302, signed);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to sign URL' });
  }
};

router.get('/*', (req, res, next) => {
  // S3-backed: route by key; public keys are open, protected ones go through
  // `protect` and then receive a 302 to a signed URL.
  if (isStorageConfigured()) {
    const key = decodeURIComponent(req.path.replace(/^\/+/, ''));
    if (!key) return res.status(400).json({ success: false, message: 'Invalid path' });
    if (isPublicKey(key)) return serveS3(req, res);
    return protect(req, res, () => serveS3(req, res));
  }

  // Disk fallback (local dev / pre-R2 setup).
  const abs = safeResolve(req.path);
  if (!abs) return res.status(400).json({ success: false, message: 'Invalid path' });
  const rel = path.relative(UPLOADS_ROOT, abs);
  if (isPublicRel(rel)) return serveDiskFile(req, res);
  return protect(req, res, () => serveDiskFile(req, res));
});

export default router;
