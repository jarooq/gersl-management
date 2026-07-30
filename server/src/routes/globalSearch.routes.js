import express from 'express';
import { globalSearch } from '../controllers/globalSearch.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/search?q=<query>
// Global search across beneficiaries, partners, projects, orphans, staff.
// Powers the Cmd+K command palette. Requires auth — searching the org's
// records is not something an anonymous caller should be able to do.
router.get('/', requireAuth, globalSearch);

export default router;
