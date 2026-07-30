import express from 'express';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { create, list, getById, update, close } from '../controllers/distributionEvent.controller.js';
import { listByEvent } from '../controllers/distributionScan.controller.js';

// Mounted at /api/distribution-events
const router = express.Router();

router.use(protect);

const canManageEvents = authorize(
  'Admin', 'CEO', 'Director Programmes', 'Programme Manager',
  'MEAL Officer', 'Project Officer'
);

router.post('/', canManageEvents, create);
router.get('/', list);
router.get('/:id', validateId(), getById);
router.put('/:id', validateId(), canManageEvents, update);
router.patch('/:id/close', validateId(), canManageEvents, close);
router.get('/:id/scans', validateId(), listByEvent);

export default router;
