import { asyncHandler, BadRequestError } from '../middleware/error.middleware.js';
import { deleteFile } from '../middleware/upload.middleware.js';

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
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${req.file.filename}`,
      url: `${req.protocol}://${req.get('host')}/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${req.file.filename}`
    }
  });
});

// ============================================
// UPLOAD MULTIPLE FILES
// ============================================
export const uploadMultipleFiles = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new BadRequestError('No files uploaded');
  }

  const files = req.files.map(file => ({
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    path: `/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${file.filename}`,
    url: `${req.protocol}://${req.get('host')}/uploads/${req.uploadPath ? req.uploadPath + '/' : ''}${file.filename}`
  }));

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
  const { filepath } = req.body;

  if (!filepath) {
    throw new BadRequestError('File path is required');
  }

  // Remove leading slash and /uploads/ prefix if present
  const cleanPath = filepath.replace(/^\/uploads\//, '');

  const deleted = deleteFile(cleanPath);

  if (!deleted) {
    throw new BadRequestError('File not found or already deleted');
  }

  res.json({
    success: true,
    message: 'File deleted successfully'
  });
});
