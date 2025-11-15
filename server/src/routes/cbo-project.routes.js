import express from 'express';
import {
  getAllProjects,
  getProjectById,
  getProjectsByCBO,
  createProject,
  updateProject,
  updateProjectProgress,
  addProjectIssue,
  updateProjectIssue,
  addCFMFeedback,
  updateCFMFeedback,
  deleteProject,
  getProjectStats
} from '../controllers/cbo-project.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getProjectStats);

// CBO-specific projects
router.get('/cbo/:cboPartnerId', getProjectsByCBO);

// CRUD routes
router.get('/', getAllProjects);
router.post('/', createProject);
router.get('/:id', getProjectById);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

// Progress update route
router.put('/:id/progress', updateProjectProgress);

// Issue management routes
router.post('/:id/issues', addProjectIssue);
router.put('/:id/issues/:issueId', updateProjectIssue);

// CFM Feedback routes
router.post('/:id/cfm-feedback', addCFMFeedback);
router.put('/:id/cfm-feedback/:feedbackId', updateCFMFeedback);

export default router;
