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

export default router;
