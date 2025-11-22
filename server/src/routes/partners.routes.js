import express from 'express';
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
  getPartnerContributions,
  createPartnerContribution,
  updatePartnerContribution,
  deletePartnerContribution,
  getPartnerCommunications,
  createPartnerCommunication,
  updatePartnerCommunication,
  deletePartnerCommunication,
  getPartnerStats
} from '../controllers/partners.controller.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// ============================================
// PARTNER ROUTES
// ============================================

// Get all partners and create new partner
router
  .route('/')
  .get(getAllPartners)
  .post(authorize('Admin', 'Manager'), createPartner);

// Get statistics
router.get('/stats', getPartnerStats);

// Get, update, delete specific partner
router
  .route('/:id')
  .get(getPartnerById)
  .put(authorize('Admin', 'Manager'), updatePartner)
  .delete(authorize('Admin'), deletePartner);

// ============================================
// PARTNER CONTRIBUTION ROUTES
// ============================================

// Get all contributions for a partner and create new contribution
router
  .route('/:partnerId/contributions')
  .get(getPartnerContributions)
  .post(authorize('Admin', 'Manager', 'Finance'), createPartnerContribution);

// Update and delete specific contribution
router
  .route('/contributions/:id')
  .put(authorize('Admin', 'Manager', 'Finance'), updatePartnerContribution)
  .delete(authorize('Admin', 'Finance'), deletePartnerContribution);

// ============================================
// PARTNER COMMUNICATION ROUTES
// ============================================

// Get all communications for a partner and create new communication
router
  .route('/:partnerId/communications')
  .get(getPartnerCommunications)
  .post(authorize('Admin', 'Manager'), createPartnerCommunication);

// Update and delete specific communication
router
  .route('/communications/:id')
  .put(authorize('Admin', 'Manager'), updatePartnerCommunication)
  .delete(authorize('Admin'), deletePartnerCommunication);

export default router;
