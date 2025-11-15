import express from 'express';
import * as grantController from '../controllers/grantReceivable.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', grantController.getAllGrantReceivables);
router.get('/:id', grantController.getGrantReceivableById);
router.post('/', grantController.createGrantReceivable);
router.put('/:id', grantController.updateGrantReceivable);
router.post('/:id/receipt', grantController.recordGrantReceipt);
router.delete('/:id', authorize('Admin'), grantController.deleteGrantReceivable);

export default router;
