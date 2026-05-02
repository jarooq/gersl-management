import express from 'express';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions,
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getRoleStats
} from '../controllers/role.controller.js';
import { requireAuth, authorize } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication; mutations require Admin.
router.use(requireAuth);
const requireAdmin = authorize('Admin');

// Roles
router.get   ('/stats',                getRoleStats);
router.get   ('/',                     getAllRoles);
router.post  ('/',                     requireAdmin, createRole);
router.get   ('/:id',                  validateId(), getRoleById);
router.put   ('/:id',                  validateId(), requireAdmin, updateRole);
router.put   ('/:id/permissions',      validateId(), requireAdmin, assignPermissions);
router.delete('/:id',                  validateId(), requireAdmin, deleteRole);

// Permissions
router.get   ('/permissions/all',      getAllPermissions);
router.post  ('/permissions',          requireAdmin, createPermission);
router.put   ('/permissions/:id',      validateId(), requireAdmin, updatePermission);
router.delete('/permissions/:id',      validateId(), requireAdmin, deletePermission);

export default router;
