import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { list, create, update, remove } from '../controllers/shift.controller.js';

const router = express.Router();
router.use(requireAuth);

router.get   ('/',     list);
router.post  ('/',     create);
router.put   ('/:id',  validateId(), update);
router.delete('/:id',  validateId(), remove);

export default router;
