import { Department } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Department Controller
 * Handles CRUD operations for departments in System Settings
 */

// ============================================
// GET ALL DEPARTMENTS
// ============================================
export const getAllDepartments = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const whereClause = {};

    // By default, only show active departments
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const departments = await Department.findAll({
      where: whereClause,
      order: [
        ['sortOrder', 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json({
      success: true,
      departments,
      count: departments.length
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
      error: error.message
    });
  }
};

// ============================================
// GET SINGLE DEPARTMENT
// ============================================
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({
      success: true,
      department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch department',
      error: error.message
    });
  }
};

// ============================================
// CREATE DEPARTMENT
// ============================================
export const createDepartment = async (req, res) => {
  try {
    const {
      name,
      description,
      code,
      color,
      icon,
      isActive,
      sortOrder
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Department name is required'
      });
    }

    // Check for duplicate name
    const existingName = await Department.findOne({
      where: { name }
    });

    if (existingName) {
      return res.status(400).json({
        success: false,
        message: 'A department with this name already exists'
      });
    }

    // Check for duplicate code if provided
    if (code) {
      const existingCode = await Department.findOne({
        where: { code }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A department with this code already exists'
        });
      }
    }

    const department = await Department.create({
      name,
      description,
      code,
      color: color || 'from-blue-500 to-cyan-600',
      icon,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create department',
      error: error.message
    });
  }
};

// ============================================
// UPDATE DEPARTMENT
// ============================================
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      code,
      color,
      icon,
      isActive,
      sortOrder
    } = req.body;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Check for duplicate name (excluding current department)
    if (name && name !== department.name) {
      const existingName = await Department.findOne({
        where: {
          name,
          id: { [Op.ne]: id }
        }
      });

      if (existingName) {
        return res.status(400).json({
          success: false,
          message: 'A department with this name already exists'
        });
      }
    }

    // Check for duplicate code (excluding current department)
    if (code && code !== department.code) {
      const existingCode = await Department.findOne({
        where: {
          code,
          id: { [Op.ne]: id }
        }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A department with this code already exists'
        });
      }
    }

    // Update fields
    await department.update({
      name: name || department.name,
      description: description !== undefined ? description : department.description,
      code: code !== undefined ? code : department.code,
      color: color || department.color,
      icon: icon !== undefined ? icon : department.icon,
      isActive: isActive !== undefined ? isActive : department.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : department.sortOrder
    });

    res.json({
      success: true,
      message: 'Department updated successfully',
      department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update department',
      error: error.message
    });
  }
};

// ============================================
// DELETE DEPARTMENT
// ============================================
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Soft delete - just set to inactive
    await department.update({ isActive: false });

    res.json({
      success: true,
      message: 'Department deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete department',
      error: error.message
    });
  }
};

// ============================================
// HARD DELETE DEPARTMENT
// ============================================
export const hardDeleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByPk(id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    await department.destroy();

    res.json({
      success: true,
      message: 'Department permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting department:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete department',
      error: error.message
    });
  }
};

// ============================================
// REORDER DEPARTMENTS
// ============================================
export const reorderDepartments = async (req, res) => {
  try {
    const { departmentIds } = req.body;

    if (!Array.isArray(departmentIds)) {
      return res.status(400).json({
        success: false,
        message: 'departmentIds must be an array'
      });
    }

    // Update sort order for each department
    const updatePromises = departmentIds.map((id, index) =>
      Department.update(
        { sortOrder: index },
        { where: { id } }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Departments reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering departments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder departments',
      error: error.message
    });
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  hardDeleteDepartment,
  reorderDepartments
};
