import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Mock approval data - In production, this would come from database
let approvals = [];

// Get all approvals with filtering
router.get('/', verifyToken, (req, res) => {
  try {
    const { status } = req.query;

    let filteredApprovals = approvals;

    if (status && status !== 'all') {
      filteredApprovals = approvals.filter(a => a.status === status);
    }

    // Sort by submission date (newest first)
    filteredApprovals.sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate));

    res.json({
      success: true,
      approvals: filteredApprovals
    });
  } catch (error) {
    console.error('Error fetching approvals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approvals'
    });
  }
});

// Get single approval by ID
router.get('/:id', verifyToken, (req, res) => {
  try {
    const approval = approvals.find(a => a.id === parseInt(req.params.id));

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
      message: 'Failed to fetch approval'
    });
  }
});

// Approve an item
router.post('/:id/approve', verifyToken, (req, res) => {
  try {
    const { comment, reviewedBy, reviewerRole } = req.body;
    const approval = approvals.find(a => a.id === parseInt(req.params.id));

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

    // Add to approval history
    approval.approvalHistory.push({
      reviewerRole: reviewerRole || req.user.role,
      action: 'approved',
      date: new Date(),
      comment: comment || ''
    });

    // Determine next stage or mark as approved
    const stageFlow = {
      'CEO Initial Review': 'Programme Manager Review',
      'Programme Manager Review': 'Finance Review',
      'Finance Review': 'CEO Final Approval',
      'CEO Final Approval': 'Approved'
    };

    const nextStage = stageFlow[approval.currentStage];

    if (nextStage === 'Approved') {
      approval.status = 'approved';
      approval.currentStage = 'CEO Final Approval';
    } else {
      approval.currentStage = nextStage;
    }

    res.json({
      success: true,
      message: 'Approval processed successfully',
      approval
    });
  } catch (error) {
    console.error('Error approving item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process approval'
    });
  }
});

// Reject an item
router.post('/:id/reject', verifyToken, (req, res) => {
  try {
    const { comment, reviewedBy, reviewerRole } = req.body;
    const approval = approvals.find(a => a.id === parseInt(req.params.id));

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

    if (!comment || comment.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Comment is required for rejection'
      });
    }

    // Add to approval history
    approval.approvalHistory.push({
      reviewerRole: reviewerRole || req.user.role,
      action: 'rejected',
      date: new Date(),
      comment
    });

    approval.status = 'rejected';

    res.json({
      success: true,
      message: 'Item rejected successfully',
      approval
    });
  } catch (error) {
    console.error('Error rejecting item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process rejection'
    });
  }
});

// Get approval stats
router.get('/stats/overview', verifyToken, (req, res) => {
  try {
    const stats = {
      total: approvals.length,
      pending: approvals.filter(a => a.status === 'pending').length,
      approved: approvals.filter(a => a.status === 'approved').length,
      rejected: approvals.filter(a => a.status === 'rejected').length,
      byType: {
        proposal: approvals.filter(a => a.itemType === 'proposal').length,
        project: approvals.filter(a => a.itemType === 'project').length,
        finance: approvals.filter(a => a.itemType === 'finance').length
      },
      byStage: {
        ceoInitial: approvals.filter(a => a.currentStage === 'CEO Initial Review' && a.status === 'pending').length,
        programmeManager: approvals.filter(a => a.currentStage === 'Programme Manager Review' && a.status === 'pending').length,
        finance: approvals.filter(a => a.currentStage === 'Finance Review' && a.status === 'pending').length,
        ceoFinal: approvals.filter(a => a.currentStage === 'CEO Final Approval' && a.status === 'pending').length
      }
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching approval stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch approval statistics'
    });
  }
});

export default router;
