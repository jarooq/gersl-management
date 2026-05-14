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
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require authentication.
router.use(requireAuth);

// Anyone with a login may read; mutating endpoints are role-gated. Status
// transitions are additionally checked by the state machine inside the
// controller — middleware here is the first defence so junior roles can't
// even reach the SM.
const requireProposalWrite = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Project Officer', 'Fundraising Manager'
);
const requireProposalDelete = requireRole(
  'Admin', 'CEO', 'Programme Manager'
);
const requireProposalStatus = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Fundraising Manager', 'Project Officer'
);
const requireProposalConvert = requireRole(
  'Admin', 'CEO', 'Programme Manager', 'Fundraising Manager'
);

// Stats route (must be before /:id routes)
router.get('/stats', getProposalStats);

// CRUD routes
router.get   ('/',     getAllProposals);
router.post  ('/',     requireProposalWrite,  createProposal);
router.get   ('/:id',  getProposalById);
router.put   ('/:id',  requireProposalWrite,  updateProposal);
router.delete('/:id',  requireProposalDelete, deleteProposal);

// Special operations — status is doubly gated (role here, SM inside controller).
router.patch('/:id/status',        requireProposalStatus,  updateProposalStatus);
router.patch('/:id/link-project',  requireProposalConvert, linkProposalToProject);

// Atomic conversion endpoint
router.post('/:id/convert',          requireProposalConvert, convertProposalToProject);
// Convert proposal to a WASH or IGP order (instead of a Project). Body must
// include { kind: 'wash' | 'igp', deadline, ... }. Stamps the proposal with
// convertedOrderType + convertedOrderId so the link is bidirectional.
router.post('/:id/convert-to-order', requireProposalConvert, convertProposalToOrder);

export default router;
