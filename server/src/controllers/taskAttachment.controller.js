import { TaskAttachment, Task, User } from '../models/index.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload file attachment to task
 * POST /api/tasks/:taskId/attachments
 */
export const uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, fileCategory } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      // Delete uploaded file if task doesn't exist
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Create attachment record
    const attachment = await TaskAttachment.create({
      taskId,
      uploadedBy: req.user.id,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileCategory: fileCategory || categorizeFile(req.file.mimetype),
      description: description || null
    });

    // Fetch attachment with uploader details
    const attachmentWithUser = await TaskAttachment.findByPk(attachment.id, {
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      attachment: attachmentWithUser
    });
  } catch (error) {
    // Delete uploaded file if database operation fails
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Error uploading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

/**
 * Get all attachments for a task
 * GET /api/tasks/:taskId/attachments
 */
export const getTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Get all attachments for this task
    const attachments = await TaskAttachment.findAll({
      where: { taskId },
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'fullName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      attachments
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attachments',
      error: error.message
    });
  }
};

/**
 * Download attachment
 * GET /api/tasks/:taskId/attachments/:attachmentId/download
 */
export const downloadAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;

    // Find attachment
    const attachment = await TaskAttachment.findOne({
      where: {
        id: attachmentId,
        taskId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(attachment.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file
    res.download(attachment.filePath, attachment.originalName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).json({
          success: false,
          message: 'Error downloading file'
        });
      }
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};

/**
 * Delete attachment
 * DELETE /api/tasks/:taskId/attachments/:attachmentId
 */
export const deleteAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;

    // Find attachment
    const attachment = await TaskAttachment.findOne({
      where: {
        id: attachmentId,
        taskId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if user is the uploader or has permission
    if (attachment.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this attachment'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }

    // Delete attachment record
    await attachment.destroy();

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attachment',
      error: error.message
    });
  }
};

/**
 * Update attachment description
 * PUT /api/tasks/:taskId/attachments/:attachmentId
 */
export const updateAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;
    const { description, fileCategory } = req.body;

    // Find attachment
    const attachment = await TaskAttachment.findOne({
      where: {
        id: attachmentId,
        taskId
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Check if user is the uploader or has permission
    if (attachment.uploadedBy !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this attachment'
      });
    }

    // Update attachment
    await attachment.update({
      description: description !== undefined ? description : attachment.description,
      fileCategory: fileCategory || attachment.fileCategory
    });

    // Fetch updated attachment with user details
    const updatedAttachment = await TaskAttachment.findByPk(attachment.id, {
      include: [{
        model: User,
        as: 'uploader',
        attributes: ['id', 'fullName', 'email']
      }]
    });

    res.json({
      success: true,
      message: 'Attachment updated successfully',
      attachment: updatedAttachment
    });
  } catch (error) {
    console.error('Error updating attachment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update attachment',
      error: error.message
    });
  }
};

/**
 * Helper function to categorize file by MIME type
 */
function categorizeFile(mimeType) {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'document';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'document';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'document';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) return 'archive';
  return 'other';
}
