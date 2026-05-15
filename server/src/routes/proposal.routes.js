import express from 'express';
import {
  getAllProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  updateProposalStatus,
  linkProposalToProject,
  getProposalStats,
  convertProposalToProject
} from '../controllers/proposal.controller.js';
import { convertProposalToOrder } from '../controllers/orderConversion.controller.js';
import { requireAuth, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication. Anything that mutates is now gated by
// permissions, not hardcoded role names — admins can re-wire which roles
// hold each permission via Settings → Roles & Permissions. The state
// machine inside updateProposalStatus does the fine-grained per-state
// permission check (internal vs donor approve).
router.use(requireAuth);

// Stats route (must be before /:id routes)
router.get('/stats', getProposalStats);

// CRUD routes
router.get   ('/',     getAllProposals);
router.post  ('/',     requirePermission(PERMISSIONS.PROPOSALS_CREATE), createProposal);
router.get   ('/:id',  getProposalById);
router.put   ('/:id',  requirePermission(PERMISSIONS.PROPOSALS_EDIT),   updateProposal);
router.delete('/:id',  requirePermission(PERMISSIONS.PROPOSALS_DELETE), deleteProposal);

// Special operations — middleware checks the umbrella perm; the SM enforces
// the per-state perm (PROPOSALS_INTERNAL_APPROVE vs PROPOSALS_DONOR_APPROVE).
router.patch('/:id/status',
  requirePermission(PERMISSIONS.PROPOSALS_STATUS_CHANGE),
  updateProposalStatus);
router.patch('/:id/link-project',
  requirePermission(PERMISSIONS.PROPOSALS_CONVERT),
  linkProposalToProject);

// Atomic conversion endpoints
router.post('/:id/convert',
  requirePermission(PERMISSIONS.PROPOSALS_CONVERT),
  convertProposalToProject);
// Convert proposal to a WASH or IGP order (instead of a Project). Body must
// include { kind: 'wash' | 'igp', deadline, ... }. Stamps the proposal with
// convertedOrderType + convertedOrderId so the link is bidirectional.
router.post('/:id/convert-to-order',
  requirePermission(PERMISSIONS.PROPOSALS_CONVERT),
  convertProposalToOrder);

export default router;
