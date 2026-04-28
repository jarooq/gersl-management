import express from 'express';
import projectTeamController from '../controllers/projectTeam.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// PROJECT TEAM ROUTES
// ============================================

// Get team members for a project
router.get('/projects/:projectId/team', protect, projectTeamController.getProjectTeam);

// Get available staff for a project (filtered by department)
router.get('/projects/:projectId/team/available', protect, projectTeamController.getAvailableStaff);

// Add team member to project
router.post('/projects/:projectId/team', protect, projectTeamController.addTeamMember);

// Update team member
router.put('/team-members/:teamMemberId', protect, projectTeamController.updateTeamMember);

// Remove team member from project
router.delete('/team-members/:teamMemberId', protect, projectTeamController.removeTeamMember);

export default router;
