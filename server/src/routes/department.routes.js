import express from 'express';
import departmentController from '../controllers/department.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// DEPARTMENT CRUD ROUTES
// ============================================

// Get all departments (with optional includeInactive query param)
router.get('/', protect, departmentController.getAllDepartments);

// Get single department by ID
router.get('/:id', protect, departmentController.getDepartmentById);

// Create new department
router.post('/', protect, departmentController.createDepartment);

// Update department
router.put('/:id', protect, departmentController.updateDepartment);

// Soft delete (deactivate) department
router.delete('/:id', protect, departmentController.deleteDepartment);

// Hard delete department (permanent)
router.delete('/:id/hard', protect, departmentController.hardDeleteDepartment);

// Reorder departments
router.put('/reorder', protect, departmentController.reorderDepartments);

export default router;
