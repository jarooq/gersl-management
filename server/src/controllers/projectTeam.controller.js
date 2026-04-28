import { ProjectTeamMember, Project, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Project Team Management Controller
 * Handles adding/removing staff members from projects
 */

// ============================================
// GET PROJECT TEAM MEMBERS
// ============================================
export const getProjectTeam = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { includeInactive } = req.query;

    const whereClause = { projectId };

    // By default, only show active team members
    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    const teamMembers = await ProjectTeamMember.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'username', 'email', 'role', 'department', 'position', 'phone']
        }
      ],
      order: [['joinedAt', 'DESC']]
    });

    res.json({
      success: true,
      teamMembers,
      count: teamMembers.length
    });
  } catch (error) {
    console.error('Error fetching project team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch project team',
      error: error.message
    });
  }
};

// ============================================
// ADD TEAM MEMBER TO PROJECT
// ============================================
export const addTeamMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role, responsibilities } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Check if project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is already a team member
    const existingMember = await ProjectTeamMember.findOne({
      where: { projectId, userId, isActive: true }
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a team member of this project'
      });
    }

    // Add team member
    const teamMember = await ProjectTeamMember.create({
      projectId,
      userId,
      role: role || user.role, // Use provided role or user's default role
      responsibilities,
      joinedAt: new Date(),
      isActive: true
    });

    // Fetch the created team member with user details
    const createdTeamMember = await ProjectTeamMember.findByPk(teamMember.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'username', 'email', 'role', 'department', 'position', 'phone']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Team member added successfully',
      teamMember: createdTeamMember
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add team member',
      error: error.message
    });
  }
};

// ============================================
// UPDATE TEAM MEMBER
// ============================================
export const updateTeamMember = async (req, res) => {
  try {
    const { teamMemberId } = req.params;
    const { role, responsibilities } = req.body;

    const teamMember = await ProjectTeamMember.findByPk(teamMemberId);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Update fields
    await teamMember.update({
      role: role !== undefined ? role : teamMember.role,
      responsibilities: responsibilities !== undefined ? responsibilities : teamMember.responsibilities
    });

    // Fetch updated team member with user details
    const updatedTeamMember = await ProjectTeamMember.findByPk(teamMemberId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'fullName', 'username', 'email', 'role', 'department', 'position', 'phone']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Team member updated successfully',
      teamMember: updatedTeamMember
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update team member',
      error: error.message
    });
  }
};

// ============================================
// REMOVE TEAM MEMBER FROM PROJECT
// ============================================
export const removeTeamMember = async (req, res) => {
  try {
    const { teamMemberId } = req.params;

    const teamMember = await ProjectTeamMember.findByPk(teamMemberId);

    if (!teamMember) {
      return res.status(404).json({
        success: false,
        message: 'Team member not found'
      });
    }

    // Soft delete - mark as inactive and set leftAt date
    await teamMember.update({
      isActive: false,
      leftAt: new Date()
    });

    res.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove team member',
      error: error.message
    });
  }
};

// ============================================
// GET AVAILABLE STAFF FOR PROJECT
// (Filter by department if specified)
// ============================================
export const getAvailableStaff = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { department } = req.query;

    // Get project to check its department
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Build where clause for users
    const whereClause = {
      status: 'Active'
    };

    // Filter by department if specified or use project's department
    const filterDepartment = department || project.department;
    if (filterDepartment) {
      whereClause.department = filterDepartment;
    }

    // Get all active users in the department
    const allUsers = await User.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'username', 'email', 'role', 'department', 'position', 'phone'],
      order: [['fullName', 'ASC']]
    });

    // Get current team members
    const currentTeamMembers = await ProjectTeamMember.findAll({
      where: { projectId, isActive: true },
      attributes: ['userId']
    });

    const currentMemberIds = currentTeamMembers.map(tm => tm.userId);

    // Filter out users who are already team members
    const availableStaff = allUsers.filter(user => !currentMemberIds.includes(user.id));

    res.json({
      success: true,
      staff: availableStaff,
      count: availableStaff.length,
      filterDepartment
    });
  } catch (error) {
    console.error('Error fetching available staff:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available staff',
      error: error.message
    });
  }
};

export default {
  getProjectTeam,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  getAvailableStaff
};
