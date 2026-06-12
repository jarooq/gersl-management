import { Approval, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all approvals with filtering
 * GET /api/approvals?status=pending
 */
export const getAllApprovals = async (req, res) => {
  try {
    const { status, type, entityType } = req.query;

    const where = {};

    // Filter by status
    if (status && status !== 'all') {
      where.status = status;
    }

    // Filter by type (PROPOSAL_SUBMISSION, PROJECT_ACTIVITY, etc.)
    if (type) {
      where.type = type;
    }

    // Filter by entity type (proposal, project, expense, etc.)
    if (entityType) {
      where.entityType = entityType;
    }

    const approvals = await Approval.findAll({
      where,
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ],
      order: [['initiatedAt', 'DESC']]
    });

    res.json({
      success: true,
      approvals
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approvals',
      error: error.message
    });
  }
};

/**
 * Get single approval by ID
 * GET /api/approvals/:id
 */
export const getApprovalById = async (req, res) => {
  try {
    const { id } = req.params;

    const approval = await Approval.findByPk(id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval not found'
      });
    }

    res.json({
      success: true,
      approval
    });
  } catch (error) {
    console.error('Error fetching approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval',
      error: error.message
    });
  }
};

/**
 * Create new approval workflow
 * POST /api/approvals
 */
export const createApproval = async (req, res) => {
  try {
    const {
      type,
      entityType,
      entityId,
      amount,
      approvalChain,
      metadata
    } = req.body;

    // Validate required fields
    if (!type || !entityType || !entityId || !approvalChain) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: type, entityType, entityId, approvalChain'
      });
    }

    // Create approval
    const approval = await Approval.create({
      type,
      entityType,
      entityId,
      amount: amount || null,
      approvalChain,
      currentLevel: 0,
      status: 'pending',
      initiatedBy: req.user.id,
      initiatedAt: new Date(),
      metadata: metadata || {}
    });

    // Fetch with relationships
    const fullApproval = await Approval.findByPk(approval.id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Approval workflow created successfully',
      approval: fullApproval
    });
  } catch (error) {
    console.error('Error creating approval:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create approval',
      error: error.message
    });
  }
};

/**
 * Approve current level
 * POST /api/approvals/:id/approve
 */
export const approveApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, reviewerRole } = req.body;

    const approval = await Approval.findByPk(id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This approval has already been processed'
      });
    }

    // Get current level from approval chain
    const currentLevel = approval.currentLevel;
    const approvalChain = approval.approvalChain;

    if (!approvalChain[currentLevel]) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval level'
      });
    }

    // Enforce that the caller's role matches the role expected at this level.
    // Without this, any authenticated user could advance the chain.
    if (approvalChain[currentLevel].role !== req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Your role cannot approve this level.'
      });
    }

    // Update approval chain - mark current level as approved
    approvalChain[currentLevel].status = 'approved';
    approvalChain[currentLevel].approverId = req.user.id;
    approvalChain[currentLevel].approvedAt = new Date();
    approvalChain[currentLevel].comments = comment || '';

    // Add to approval history
    const history = approval.approvalHistory || [];
    history.push({
      level: currentLevel,
      action: 'approved',
      approverId: req.user.id,
      approverName: req.user.fullName,
      reviewerRole: reviewerRole || req.user.role,
      timestamp: new Date(),
      comments: comment || ''
    });

    // Check if there are more levels
    const nextLevel = currentLevel + 1;
    let newStatus = approval.status;
    let completedAt = null;

    if (nextLevel >= approvalChain.length) {
      // All levels approved - mark as approved
      newStatus = 'approved';
      completedAt = new Date();
    }

    // Update approval
    await approval.update({
      approvalChain,
      approvalHistory: history,
      currentLevel: nextLevel < approvalChain.length ? nextLevel : currentLevel,
      status: newStatus,
      completedAt
    });

    // Fetch updated approval
    const updatedApproval = await Approval.findByPk(id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: newStatus === 'approved' ? 'Approval workflow completed' : 'Approval processed successfully',
      approval: updatedApproval
    });
  } catch (error) {
    console.error('Error approving:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval',
      error: error.message
    });
  }
};

/**
 * Reject approval
 * POST /api/approvals/:id/reject
 */
export const rejectApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, reviewerRole } = req.body;

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment is required for rejection'
      });
    }

    const approval = await Approval.findByPk(id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!approval) {
      return res.status(404).json({
        success: false,
        message: 'Approval not found'
      });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This approval has already been processed'
      });
    }

    // Get current level
    const currentLevel = approval.currentLevel;
    const approvalChain = approval.approvalChain;

    // Update approval chain - mark current level as rejected
    if (approvalChain[currentLevel]) {
      approvalChain[currentLevel].status = 'rejected';
      approvalChain[currentLevel].approverId = req.user.id;
      approvalChain[currentLevel].approvedAt = new Date();
      approvalChain[currentLevel].comments = comment;
    }

    // Add to approval history
    const history = approval.approvalHistory || [];
    history.push({
      level: currentLevel,
      action: 'rejected',
      approverId: req.user.id,
      approverName: req.user.fullName,
      reviewerRole: reviewerRole || req.user.role,
      timestamp: new Date(),
      comments: comment
    });

    // Update approval
    await approval.update({
      approvalChain,
      approvalHistory: history,
      status: 'rejected',
      completedAt: new Date()
    });

    // Fetch updated approval
    const updatedApproval = await Approval.findByPk(id, {
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Item rejected successfully',
      approval: updatedApproval
    });
  } catch (error) {
    console.error('Error rejecting:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process rejection',
      error: error.message
    });
  }
};

/**
 * Get approval statistics
 * GET /api/approvals/stats/overview
 */
export const getApprovalStats = async (req, res) => {
  try {
    const total = await Approval.count();
    const pending = await Approval.count({ where: { status: 'pending' } });
    const approved = await Approval.count({ where: { status: 'approved' } });
    const rejected = await Approval.count({ where: { status: 'rejected' } });

    // Count by type
    const byType = {
      proposal: await Approval.count({ where: { entityType: 'proposal' } }),
      project: await Approval.count({ where: { entityType: 'project' } }),
      finance: await Approval.count({ where: { entityType: 'expense' } })
    };

    // Get pending approvals by level
    const pendingApprovals = await Approval.findAll({
      where: { status: 'pending' },
      attributes: ['currentLevel', 'approvalChain']
    });

    // Count by stage (current level role)
    const byStage = {
      ceoInitial: 0,
      programmeManager: 0,
      finance: 0,
      ceoFinal: 0
    };

    pendingApprovals.forEach(approval => {
      const currentLevelData = approval.approvalChain[approval.currentLevel];
      if (currentLevelData) {
        const role = currentLevelData.role;
        if (role === 'CEO') {
          if (approval.currentLevel === 0) {
            byStage.ceoInitial++;
          } else {
            byStage.ceoFinal++;
          }
        } else if (role === 'Programme Manager') {
          byStage.programmeManager++;
        } else if (role === 'Finance') {
          byStage.finance++;
        }
      }
    });

    const stats = {
      total,
      pending,
      approved,
      rejected,
      byType,
      byStage
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval statistics',
      error: error.message
    });
  }
};

/**
 * Get pending approvals for current user
 * GET /api/approvals/pending
 */
export const getPendingApprovalsForUser = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Get all pending approvals
    const pendingApprovals = await Approval.findAll({
      where: { status: 'pending' },
      include: [
        {
          model: User,
          as: 'initiator',
          attributes: ['id', 'fullName', 'email', 'role']
        }
      ],
      order: [['initiatedAt', 'DESC']]
    });

    // Filter to only those where current user's role matches current approval level
    const userApprovals = pendingApprovals.filter(approval => {
      const currentLevelData = approval.approvalChain[approval.currentLevel];
      return currentLevelData && currentLevelData.role === userRole;
    });

    res.json({
      success: true,
      approvals: userApprovals
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending approvals',
      error: error.message
    });
  }
};
