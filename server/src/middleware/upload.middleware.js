import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { BadRequestError } from './error.middleware.js';
import { isStorageConfigured, s3ClientForUploads, isPublicKey } from '../services/storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Disk fallback (used when S3 env vars are missing — local dev / first deploy).
// On serverless platforms (Vercel) the filesystem is read-only outside /tmp,
// so mkdir will throw. Swallow the error — if disk storage is then used at
// runtime, the upload itself will fail with a clearer error.
const uploadsDir = path.join(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn(`[upload] uploads/ dir unavailable (${err.code}); S3 storage required.`);
}

const buildKey = (req, file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname).replace(/[^a-zA-Z0-9.]/g, '');
  const nameWithoutExt = path.basename(file.originalname, path.extname(file.originalname));
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  const filename = `${sanitizedName}-${uniqueSuffix}${ext}`;
  const sub = (req.uploadPath || '').replace(/^\/+|\.\.+/g, '');
  const key = sub ? `${sub}/${filename}` : filename;
  // Defense-in-depth: refuse anything that resolves outside the upload root.
  if (key.includes('..') || key.startsWith('/') || key.includes('\\')) {
    throw new BadRequestError('Invalid upload path');
  }
  return key;
};

// S3 storage if configured, disk otherwise. multer-s3 stamps file.location +
// file.key on the multer file object so callers can persist either an S3 key
// or a /uploads/<path> URL — the upload controller normalizes both shapes.
const storage = isStorageConfigured()
  ? multerS3({
      s3: s3ClientForUploads().client,
      bucket: s3ClientForUploads().bucket,
      // ACL is not supported on R2; multer-s3 will skip it harmlessly.
      contentType: multerS3.AUTO_CONTENT_TYPE,
      cacheControl: (req, file, cb) => {
        cb(null, isPublicKey(req.uploadPath || '') ? 'public, max-age=86400' : 'private, max-age=3600');
      },
      key: (req, file, cb) => cb(null, buildKey(req, file))
    })
  : multer.diskStorage({
      destination: function (req, file, cb) {
        const uploadPath = path.join(uploadsDir, req.uploadPath || '');
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
      },
      filename: function (req, file, cb) {
        cb(null, path.basename(buildKey(req, file)));
      }
    });

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text
    'text/plain',
    'text/csv'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestError(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per request
  }
});

// Middleware to set upload path based on category
export const setUploadPath = (category) => {
  return (req, res, next) => {
    req.uploadPath = category;
    next();
  };
};

// Upload single file
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Upload multiple files
export const uploadMultiple = (fieldName, maxCount = 10) => {
  return upload.array(fieldName, maxCount);
};

// Upload multiple fields
export const uploadFields = (fields) => {
  return upload.fields(fields);
};

// Delete file helper
export const deleteFile = (filePath) => {
  const fullPath = path.join(uploadsDir, filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    return true;
  }
  return false;
};

export default upload;
