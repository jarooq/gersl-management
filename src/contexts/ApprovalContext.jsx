import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as approvalService from '../services/approvalService';

// Approval status constants
export const APPROVAL_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
};

const ApprovalContext = createContext(null);

export const useApproval = () => {
  const context = useContext(ApprovalContext);
  if (!context) {
    throw new Error('useApproval must be used within an ApprovalProvider');
  }
  return context;
};

export const ApprovalProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all approvals from database
   */
  const fetchApprovals = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const result = await approvalService.fetchApprovals(filters);

      if (result.success) {
        setApprovals(result.data.approvals || []);
        return { success: true, data: result.data };
      }

      throw new Error(result.message || 'Failed to fetch approvals');
    } catch (err) {
      console.error('Error fetching approvals:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Fetch pending approvals for current user
   */
  const fetchPendingApprovals = useCallback(async () => {
    if (!currentUser) return { success: false, message: 'User not authenticated' };

    try {
      setLoading(true);
      setError(null);
      const result = await approvalService.fetchPendingApprovals();

      if (result.success) {
        return { success: true, data: result.data.approvals || [] };
      }

      throw new Error(result.message || 'Failed to fetch pending approvals');
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Create a new approval request
   */
  const createApproval = useCallback(async ({ type, entityType, entityId, amount, approvalChain, metadata }) => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const approvalData = {
        type,
        entityType,
        entityId,
        amount: amount || null,
        approvalChain: approvalChain || [],
        metadata: {
          ...metadata,
          initiatorId: currentUser.id,
          initiatorName: currentUser.fullName,
        },
      };

      const result = await approvalService.createApproval(approvalData);

      if (result.success) {
        // Add to local state
        setApprovals(prev => [...prev, result.data.approval]);
        console.log(`✅ Created approval workflow: ${result.data.approval.id} (${type})`);
        return { success: true, approval: result.data.approval };
      }

      throw new Error(result.message || 'Failed to create approval');
    } catch (err) {
      console.error('Create approval error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  /**
   * Approve a workflow step
   */
  const approve = useCallback(async (approvalId, comment = '') => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await approvalService.approveApproval(approvalId, comment, currentUser.role);

      if (result.success) {
        // Update local state
        setApprovals(prev => prev.map(approval =>
          approval.id === approvalId ? result.data.approval : approval
        ));

        console.log(`✅ Approval workflow step approved: ${approvalId}`);

        // Refresh approvals to get latest state
        await fetchApprovals();

        return { success: true, approval: result.data.approval };
      }

      throw new Error(result.message || 'Failed to approve');
    } catch (err) {
      console.error('Approve workflow error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchApprovals]);

  /**
   * Reject a workflow
   */
  const reject = useCallback(async (approvalId, reason = '') => {
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      setError(null);

      const result = await approvalService.rejectApproval(approvalId, reason, currentUser.role);

      if (result.success) {
        // Update local state
        setApprovals(prev => prev.map(approval =>
          approval.id === approvalId ? result.data.approval : approval
        ));

        console.log(`❌ Approval workflow rejected: ${approvalId}`);

        // Refresh approvals to get latest state
        await fetchApprovals();

        return { success: true, approval: result.data.approval };
      }

      throw new Error(result.message || 'Failed to reject');
    } catch (err) {
      console.error('Reject workflow error:', err);
      setError(err.message);
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, fetchApprovals]);

  /**
   * Get all approvals
   */
  const getAllApprovals = useCallback(() => {
    return approvals;
  }, [approvals]);

  /**
   * Get pending approvals for current user (from local state)
   */
  const getPendingApprovals = useCallback(() => {
    if (!currentUser) return [];
    return approvals.filter(approval =>
      approval.status === APPROVAL_STATUS.PENDING &&
      approval.approvalChain &&
      approval.approvalChain[approval.currentLevel]?.userId === currentUser.id
    );
  }, [approvals, currentUser]);

  /**
   * Get approvals by status
   */
  const getApprovalsByStatus = useCallback((status) => {
    return approvals.filter(approval => approval.status === status);
  }, [approvals]);

  /**
   * Get approvals by type
   */
  const getApprovalsByType = useCallback((type) => {
    return approvals.filter(approval => approval.type === type);
  }, [approvals]);

  /**
   * Get approval by ID
   */
  const getApprovalById = useCallback(async (id) => {
    try {
      const result = await approvalService.fetchApprovalById(id);
      if (result.success) {
        return result.data.approval;
      }
      return null;
    } catch (err) {
      console.error('Error fetching approval by ID:', err);
      return null;
    }
  }, []);

  /**
   * Get approval statistics
   */
  const getStats = useCallback(async () => {
    try {
      const result = await approvalService.fetchApprovalStats();
      if (result.success) {
        return result.data;
      }
      return null;
    } catch (err) {
      console.error('Error fetching approval stats:', err);
      return null;
    }
  }, []);

  /**
   * Get pending approvals count
   */
  const getPendingApprovalsCount = useCallback(() => {
    if (!currentUser) return 0;
    return getPendingApprovals().length;
  }, [currentUser, getPendingApprovals]);

  const value = {
    approvals,
    loading,
    error,
    // Actions
    createApproval,
    approve,
    reject,
    fetchApprovals,
    fetchPendingApprovals,
    // Getters
    getAllApprovals,
    getPendingApprovals,
    getApprovalsByStatus,
    getApprovalsByType,
    getApprovalById,
    getStats,
    getPendingApprovalsCount,
    // Constants
    APPROVAL_STATUS,
  };

  return (
    <ApprovalContext.Provider value={value}>
      {children}
    </ApprovalContext.Provider>
  );
};

export default ApprovalContext;
