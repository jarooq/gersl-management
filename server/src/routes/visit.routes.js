import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';
import { list, get, create, update, remove } from '../controllers/visit.controller.js';

const router = express.Router();
router.use(requireAuth);

router.get   ('/',     list);
router.post  ('/',     create);
router.get   ('/:id',  validateId(), get);
router.put   ('/:id',  validateId(), update);
router.delete('/:id',  validateId(), remove);

export default router;
