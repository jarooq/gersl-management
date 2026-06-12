import express from 'express';
import * as jeController from '../controllers/journalEntry.controller.js';
import { protect, authorize, requirePermission, PERMISSIONS } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use(protect);

router.get('/', jeController.getAllJournalEntries);
router.get('/:id', jeController.getJournalEntryById);
router.post('/', jeController.createJournalEntry);
router.put('/:id', jeController.updateJournalEntry);
router.put('/:id/post', requirePermission(PERMISSIONS.FINANCE_APPROVE), jeController.postJournalEntry);
router.delete('/:id', authorize('Admin'), jeController.deleteJournalEntry);

export default router;
