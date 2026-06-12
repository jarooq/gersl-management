import express from 'express';
import contractController from '../controllers/contract.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

// 'HR Officer' was a ghost role (not defined in ROLE_PERMISSIONS) — dropped.
const requireHRorAdmin = requireRole('Admin', 'HR Manager');

const router = express.Router();

// ============================================
// EMPLOYMENT AGREEMENTS
// ============================================

// Create employment agreement with AI generation
router.post('/agreements', protect, contractController.createEmploymentAgreement);

// Get all employment agreements (with filters)
router.get('/agreements', protect, contractController.getAllAgreements);

// Get single agreement
router.get('/agreements/:id', protect, contractController.getAgreementById);

// Sign employment agreement
router.put('/agreements/:id/sign', protect, contractController.signAgreement);

// Delete employment agreement (HR/Admin only — and controller still enforces Draft-only)
router.delete('/agreements/:id', protect, requireHRorAdmin, contractController.deleteAgreement);

// ============================================
// CONTRACT RENEWALS (1 Year Expiry Tracking)
// ============================================

// Get expiring contracts
router.get('/renewals/expiring', protect, contractController.getExpiringContracts);

// Create contract renewal request
router.post('/renewals', protect, contractController.createContractRenewal);

// Approve contract renewal
router.put('/renewals/:id/approve', protect, contractController.approveContractRenewal);

// ============================================
// TERMINATIONS
// ============================================

// Get all terminations
router.get('/terminations', protect, contractController.getAllTerminations);

// Create termination (with final settlement calculation)
router.post('/terminations', protect, contractController.createTermination);

// Approve termination
router.put('/terminations/:id/approve', protect, contractController.approveTermination);

// ============================================
// RESIGNATIONS (2 Months Notice)
// ============================================

// Get all resignations
router.get('/resignations', protect, contractController.getAllResignations);

// Submit resignation
router.post('/resignations', protect, contractController.submitResignation);

// Accept resignation (with AI-generated acceptance letter)
router.put('/resignations/:id/accept', protect, contractController.acceptResignation);

// ============================================
// JOB DESCRIPTION GENERATOR
// ============================================

// Generate job description with AI
router.post('/job-description/generate', protect, contractController.generateJobDescription);

// ============================================
// INTEGRATED STAFF CREATION
// ============================================

// Create staff with automatic employment agreement generation
router.post('/staff/create-with-agreement', protect, contractController.createStaffWithAgreement);

// ============================================
// EMPLOYEE SELF-SERVICE
// ============================================

// Get my HR data (for logged-in employee)
router.get('/my-data', protect, contractController.getMyHRData);

export default router;
