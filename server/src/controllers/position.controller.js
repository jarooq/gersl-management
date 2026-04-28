import { Position } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Position Controller
 * Handles CRUD operations for positions in System Settings
 */

// ============================================
// GET ALL POSITIONS
// ============================================
export const getAllPositions = async (req, res) => {
  try {
    const { includeInactive } = req.query;

    const whereClause = {};

    // By default, only show active positions
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const positions = await Position.findAll({
      where: whereClause,
      order: [
        ['sortOrder', 'ASC'],
        ['title', 'ASC']
      ]
    });

    res.json({
      success: true,
      positions,
      count: positions.length
    });
  } catch (error) {
    console.error('Error fetching positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch positions',
      error: error.message
    });
  }
};

// ============================================
// GET SINGLE POSITION
// ============================================
export const getPositionById = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    res.json({
      success: true,
      position
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch position',
      error: error.message
    });
  }
};

// ============================================
// CREATE POSITION
// ============================================
export const createPosition = async (req, res) => {
  try {
    const {
      title,
      description,
      code,
      level,
      departmentId,
      isActive,
      sortOrder
    } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Position title is required'
      });
    }

    // Check for duplicate title
    const existingTitle = await Position.findOne({
      where: { title }
    });

    if (existingTitle) {
      return res.status(400).json({
        success: false,
        message: 'A position with this title already exists'
      });
    }

    // Check for duplicate code if provided
    if (code) {
      const existingCode = await Position.findOne({
        where: { code }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A position with this code already exists'
        });
      }
    }

    const position = await Position.create({
      title,
      description,
      code,
      level,
      departmentId,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0
    });

    res.status(201).json({
      success: true,
      message: 'Position created successfully',
      position
    });
  } catch (error) {
    console.error('Error creating position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create position',
      error: error.message
    });
  }
};

// ============================================
// UPDATE POSITION
// ============================================
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      code,
      level,
      departmentId,
      isActive,
      sortOrder
    } = req.body;

    const position = await Position.findByPk(id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Check for duplicate title (excluding current position)
    if (title && title !== position.title) {
      const existingTitle = await Position.findOne({
        where: {
          title,
          id: { [Op.ne]: id }
        }
      });

      if (existingTitle) {
        return res.status(400).json({
          success: false,
          message: 'A position with this title already exists'
        });
      }
    }

    // Check for duplicate code (excluding current position)
    if (code && code !== position.code) {
      const existingCode = await Position.findOne({
        where: {
          code,
          id: { [Op.ne]: id }
        }
      });

      if (existingCode) {
        return res.status(400).json({
          success: false,
          message: 'A position with this code already exists'
        });
      }
    }

    // Update fields
    await position.update({
      title: title || position.title,
      description: description !== undefined ? description : position.description,
      code: code !== undefined ? code : position.code,
      level: level !== undefined ? level : position.level,
      departmentId: departmentId !== undefined ? departmentId : position.departmentId,
      isActive: isActive !== undefined ? isActive : position.isActive,
      sortOrder: sortOrder !== undefined ? sortOrder : position.sortOrder
    });

    res.json({
      success: true,
      message: 'Position updated successfully',
      position
    });
  } catch (error) {
    console.error('Error updating position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update position',
      error: error.message
    });
  }
};

// ============================================
// DELETE POSITION
// ============================================
export const deletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    // Soft delete - just set to inactive
    await position.update({ isActive: false });

    res.json({
      success: true,
      message: 'Position deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete position',
      error: error.message
    });
  }
};

// ============================================
// HARD DELETE POSITION
// ============================================
export const hardDeletePosition = async (req, res) => {
  try {
    const { id } = req.params;

    const position = await Position.findByPk(id);

    if (!position) {
      return res.status(404).json({
        success: false,
        message: 'Position not found'
      });
    }

    await position.destroy();

    res.json({
      success: true,
      message: 'Position permanently deleted'
    });
  } catch (error) {
    console.error('Error permanently deleting position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to permanently delete position',
      error: error.message
    });
  }
};

// ============================================
// REORDER POSITIONS
// ============================================
export const reorderPositions = async (req, res) => {
  try {
    const { positionIds } = req.body;

    if (!Array.isArray(positionIds)) {
      return res.status(400).json({
        success: false,
        message: 'positionIds must be an array'
      });
    }

    // Update sort order for each position
    const updatePromises = positionIds.map((id, index) =>
      Position.update(
        { sortOrder: index },
        { where: { id } }
      )
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'Positions reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering positions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder positions',
      error: error.message
    });
  }
};

export default {
  getAllPositions,
  getPositionById,
  createPosition,
  updatePosition,
  deletePosition,
  hardDeletePosition,
  reorderPositions
};
