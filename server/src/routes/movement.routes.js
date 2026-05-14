import express from 'express';
import {
  listMovements,
  getMovement,
  createMovement,
  approveMovement,
  rejectMovement,
  departMovement,
  arriveMovement,
  returnMovement,
  cancelMovement,
  pingMovement
} from '../controllers/movement.controller.js';
import {
  listVehicles,
  getVehicle,
  createVehicleRecord,
  updateVehicleRecord,
  deactivateVehicleRecord
} from '../controllers/vehicle.controller.js';
import {
  listFuelRates,
  getFuelRate,
  createFuelRate,
  updateFuelRate,
  deleteFuelRate
} from '../controllers/fuelRate.controller.js';
import {
  listClaims,
  getClaim,
  deriveClaim,
  duplicateCheck,
  submitClaim,
  approveClaim,
  rejectClaim,
  mergeClaim,
  cancelClaim,
  reviewFlags
} from '../controllers/fuelClaim.controller.js';
import { renderFuelClaimPdf } from '../controllers/fuelClaimPdf.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();
router.use(requireAuth);

const requireApprover = requireRole(
  'Admin', 'CEO', 'Director Programmes',
  'Programme Manager', 'HR Manager', 'Finance Manager', 'Procurement Manager'
);

// Vehicles (everyone can list+create personal; lifecycle by owner/manager)
router.get   ('/vehicles',          listVehicles);
router.post  ('/vehicles',          createVehicleRecord);
router.get   ('/vehicles/:id',      validateId(), getVehicle);
router.put   ('/vehicles/:id',      validateId(), updateVehicleRecord);
router.patch ('/vehicles/:id/deactivate', validateId(), deactivateVehicleRecord);

// Movements
router.get   ('/movements',                 listMovements);
router.post  ('/movements',                 createMovement);
router.get   ('/movements/:id',             validateId(), getMovement);
router.patch ('/movements/:id/approve',     validateId(), requireApprover, approveMovement);
router.patch ('/movements/:id/reject',      validateId(), requireApprover, rejectMovement);
router.patch ('/movements/:id/depart',      validateId(), departMovement);
router.patch ('/movements/:id/arrive',      validateId(), arriveMovement);
router.patch ('/movements/:id/return',      validateId(), returnMovement);
router.patch ('/movements/:id/cancel',      validateId(), cancelMovement);
router.post  ('/movements/:id/ping',        validateId(), pingMovement);

// Fuel rates
const requireFinanceManager = requireRole('Admin', 'CEO', 'Finance Manager', 'HR Manager');
router.get   ('/fuel-rates',          listFuelRates);
router.post  ('/fuel-rates',          requireFinanceManager, createFuelRate);
router.get   ('/fuel-rates/:id',      validateId(), getFuelRate);
router.put   ('/fuel-rates/:id',      validateId(), requireFinanceManager, updateFuelRate);
router.delete('/fuel-rates/:id',      validateId(), requireFinanceManager, deleteFuelRate);

// Fuel claims
router.get   ('/fuel-claims',                       listClaims);
router.post  ('/fuel-claims',                       deriveClaim);
router.get   ('/fuel-claims/:id',                   validateId(), getClaim);
router.get   ('/fuel-claims/:id/duplicate-check',   validateId(), duplicateCheck);
router.get   ('/fuel-claims/:id/pdf',                validateId(), renderFuelClaimPdf);
router.patch ('/fuel-claims/:id/submit',            validateId(), submitClaim);
router.patch ('/fuel-claims/:id/approve',           validateId(), requireApprover, approveClaim);
router.patch ('/fuel-claims/:id/reject',            validateId(), requireApprover, rejectClaim);
router.patch ('/fuel-claims/:id/merge',             validateId(), requireApprover, mergeClaim);
router.patch ('/fuel-claims/:id/review-flags',      validateId(), requireApprover, reviewFlags);
router.patch ('/fuel-claims/:id/cancel',            validateId(), cancelClaim);

export default router;
