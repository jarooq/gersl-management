import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { listMine, downloadMine } from '../controllers/mePayslip.controller.js';

const router = express.Router();
router.use(requireAuth);

router.get('/',          listMine);
router.get('/:id/pdf',   validateId(), downloadMine);

export default router;
