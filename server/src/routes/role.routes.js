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
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateId } from '../middleware/validate.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// ============================================
// ROLES ROUTES
// ============================================

// @route   GET /api/roles/stats
// @desc    Get role statistics
// @access  Private
router.get('/stats', getRoleStats);

// @route   GET /api/roles
// @desc    Get all roles
// @access  Private
router.get('/', getAllRoles);

// @route   POST /api/roles
// @desc    Create new role
// @access  Private (Admin)
router.post('/', createRole);

// @route   GET /api/roles/:id
// @desc    Get role by ID
// @access  Private
router.get('/:id', validateId(), getRoleById);

// @route   PUT /api/roles/:id
// @desc    Update role
// @access  Private (Admin)
router.put('/:id', validateId(), updateRole);

// @route   PUT /api/roles/:id/permissions
// @desc    Assign permissions to role
// @access  Private (Admin)
router.put('/:id/permissions', validateId(), assignPermissions);

// @route   DELETE /api/roles/:id
// @desc    Delete role
// @access  Private (Admin)
router.delete('/:id', validateId(), deleteRole);

// ============================================
// PERMISSIONS ROUTES
// ============================================

// @route   GET /api/roles/permissions
// @desc    Get all permissions
// @access  Private
router.get('/permissions/all', getAllPermissions);

// @route   POST /api/roles/permissions
// @desc    Create new permission
// @access  Private (Admin)
router.post('/permissions', createPermission);

// @route   PUT /api/roles/permissions/:id
// @desc    Update permission
// @access  Private (Admin)
router.put('/permissions/:id', validateId(), updatePermission);

// @route   DELETE /api/roles/permissions/:id
// @desc    Delete permission
// @access  Private (Admin)
router.delete('/permissions/:id', validateId(), deletePermission);

export default router;
