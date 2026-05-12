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
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Stats route (must be before /:id routes)
router.get('/stats', getProposalStats);

// CRUD routes
router.get('/', getAllProposals);
router.post('/', createProposal);
router.get('/:id', getProposalById);
router.put('/:id', updateProposal);
router.delete('/:id', deleteProposal);

// Special operations
router.patch('/:id/status', updateProposalStatus);
router.patch('/:id/link-project', linkProposalToProject);

// Atomic conversion endpoint
router.post('/:id/convert', convertProposalToProject);

// Convert proposal to a WASH or IGP order (instead of a Project). Body must
// include { kind: 'wash' | 'igp', deadline, ... }. Stamps the proposal with
// convertedOrderType + convertedOrderId so the link is bidirectional.
router.post('/:id/convert-to-order', convertProposalToOrder);

export default router;
