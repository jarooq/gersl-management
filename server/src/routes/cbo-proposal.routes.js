import express from 'express';
import {
  getAllProposals,
  getProposalById,
  getProposalsByCBO,
  createProposal,
  updateProposal,
  fundraisingApprove,
  fundraisingReject,
  ceoApprove,
  ceoReject,
  donorApprove,
  donorReject,
  deleteProposal,
  getProposalStats
} from '../controllers/cbo-proposal.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(requireAuth);

// Statistics route (before /:id to avoid conflict)
router.get('/stats', getProposalStats);

// CBO-specific proposals
router.get('/cbo/:cboPartnerId', getProposalsByCBO);

// CRUD routes
router.get('/', getAllProposals);
router.post('/', createProposal);
router.get('/:id', getProposalById);
router.put('/:id', updateProposal);
router.delete('/:id', deleteProposal);

// Fundraising workflow routes
router.put('/:id/fundraising/approve', fundraisingApprove);
router.put('/:id/fundraising/reject', fundraisingReject);

// CEO workflow routes
router.put('/:id/ceo/approve', ceoApprove);
router.put('/:id/ceo/reject', ceoReject);

// Donor workflow routes
router.put('/:id/donor/approve', donorApprove);
router.put('/:id/donor/reject', donorReject);

export default router;
