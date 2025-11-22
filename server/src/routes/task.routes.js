import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  assignTask,
  updateTaskStatus,
  updateTaskProgress,
  getMyTasks,
  requestBudget,
  approveBudget,
  rejectBudget,
  assignMediaTeam,
  updateMediaCoverageStatus
} from '../controllers/task.controller.js';
import {
  getTaskComments,
  createTaskComment,
  updateTaskComment,
  deleteTaskComment
} from '../controllers/taskComment.controller.js';
import {
  uploadAttachment,
  getTaskAttachments,
  downloadAttachment,
  deleteAttachment,
  updateAttachment
} from '../controllers/taskAttachment.controller.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// Get current user's tasks (must be before /:id route)
router.get('/my-tasks', verifyToken, getMyTasks);

// Get all tasks with filtering
router.get('/', verifyToken, getAllTasks);

// Get single task by ID
router.get('/:id', verifyToken, getTaskById);

// Create new task
router.post('/', verifyToken, createTask);

// Update task
router.put('/:id', verifyToken, updateTask);

// Delete task
router.delete('/:id', verifyToken, deleteTask);

// Assign task to user
router.put('/:id/assign', verifyToken, assignTask);

// Update task status
router.put('/:id/status', verifyToken, updateTaskStatus);

// Update task progress
router.put('/:id/progress', verifyToken, updateTaskProgress);

// Budget request endpoints
router.post('/:id/budget-request', verifyToken, requestBudget);
router.put('/:id/budget-approve', verifyToken, approveBudget);
router.put('/:id/budget-reject', verifyToken, rejectBudget);

// Media team endpoints
router.put('/:id/media-team', verifyToken, assignMediaTeam);
router.put('/:id/media-status', verifyToken, updateMediaCoverageStatus);

// Comment endpoints
router.get('/:taskId/comments', verifyToken, getTaskComments);
router.post('/:taskId/comments', verifyToken, createTaskComment);
router.put('/:taskId/comments/:commentId', verifyToken, updateTaskComment);
router.delete('/:taskId/comments/:commentId', verifyToken, deleteTaskComment);

// Attachment endpoints
router.post('/:taskId/attachments', verifyToken, uploadSingle, uploadAttachment);
router.get('/:taskId/attachments', verifyToken, getTaskAttachments);
router.get('/:taskId/attachments/:attachmentId/download', verifyToken, downloadAttachment);
router.put('/:taskId/attachments/:attachmentId', verifyToken, updateAttachment);
router.delete('/:taskId/attachments/:attachmentId', verifyToken, deleteAttachment);

export default router;
