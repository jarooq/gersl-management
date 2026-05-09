// Public self-registration route. No requireAuth — anyone with the form URL
// can submit, but the controller forces status='Pending' + role='Guest' so
// the new account can't actually log in until HR activates it.

import express from 'express';
import { publicRegisterStaff } from '../controllers/hr.controller.js';

const router = express.Router();

// POST /api/staff-register
router.post('/', publicRegisterStaff);

export default router;
