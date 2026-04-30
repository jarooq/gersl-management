import { asyncHandler, BadRequestError } from '../middleware/error.middleware.js';
import { deleteFile } from '../middleware/upload.middleware.js';
import {
  isStorageConfigured,
  isPublicKey,
  publicUrlFor,
  signGetUrl,
  deleteObject
} from '../services/storage.js';

// multer-s3 stamps file.key + file.location; multer disk stamps file.filename
// + file.path. This helper normalizes both into the shape the frontend has
// always consumed: { path, url, filename }.
const fileToResponse = async (req, file) => {
  // S3 / R2 path (multer-s3)
  if (file.key) {
    const isPublic = isPublicKey(file.key);
    const directUrl = isPublic ? publicUrlFor(file.key) : null;
    // For protected objects we return a /uploads/<key> URL on our own host;
    // the GET handler will sign it on access. This keeps the API stable
    // for the frontend whether storage is local disk or R2.
    return {
      filename: file.key.split('/').pop(),
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      key: file.key,
      path: `/uploads/${file.key}`,
      url: directUrl
        ? directUrl
        : `${req.protocol}://${req.get('host')}/uploads/${file.key}`
    };
  }
  // Local disk path (multer.diskStorage)
  return {
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${file.filename}`,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${file.filename}`
  };
};

// ============================================
// UPLOAD SINGLE FILE
// ============================================
export const uploadSingleFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new BadRequestError('No file uploaded');
  }
  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: await fileToResponse(req, req.file)
  });
});

// ============================================
// UPLOAD MULTIPLE FILES
// ============================================
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('No files uploaded');
  }
  const files = await Promise.all(req.files.map(f => fileToResponse(req, f)));
  res.status(201).json({
    success: true,
    message: `${files.length} file(s) uploaded successfully`,
    data: { files }
  });
});

// ============================================
// DELETE FILE
// ============================================
export const deleteUploadedFile = asyncHandler(async (req, res) => {
  const { filepath, key } = req.body;
  const target = key || filepath;
  if (!target) throw new BadRequestError('File path or key is required');

  const cleanKey = String(target).replace(/^\/uploads\//, '').replace(/^\/+/, '');

  if (isStorageConfigured()) {
    await deleteObject(cleanKey);
  } else {
    const ok = deleteFile(cleanKey);
    if (!ok) throw new BadRequestError('File not found or already deleted');
  }
  res.json({ success: true, message: 'File deleted successfully' });
});

// Optional helper used by feature code that needs a fresh signed URL for an
// existing protected object (e.g. the audit-log viewer linking back to a
// staff document). Not currently mounted.
export const signedGetUrlFor = async (key, ttlSec = 3600) => {
  if (!isStorageConfigured()) return null;
  if (isPublicKey(key)) return publicUrlFor(key);
  return signGetUrl(key, ttlSec);
};
