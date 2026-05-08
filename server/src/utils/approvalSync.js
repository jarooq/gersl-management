// =============================================================================
// approvalSync — keep the central `Approval` table in sync with mobile-side
// HR submissions (LeaveRequest / Expense / SalaryAdvance) so the web admin's
// Approvals Centre actually surfaces them.
//
// Each helper returns the created Approval row (or undefined on failure).
// Failures are logged but not thrown — the underlying domain insert has
// already succeeded by the time we're called.
// =============================================================================

import { Approval } from '../models/index.js';

const APPROVER_ROLE_FOR_TYPE = {
  HR_LEAVE_REQUEST:        'HR Manager',
  FINANCE_EXPENSE:         'Finance Manager',
  HR_SALARY_ADVANCE:       'HR Manager',
  HR_VEHICLE_REQUEST:      'HR Manager',
  HR_ACCOMMODATION_REQUEST:'HR Manager',
  HR_ASSET_ASSIGNMENT:     'HR Manager',
};

function buildSingleStepChain(role) {
  return [{
    level: 0,
    role,
    approverId: null,
    approvedAt: null,
    status: 'pending',
    comments: '',
  }];
}

/**
 * Create an Approval row attached to a domain entity.
 * @param {Object} opts
 * @param {string} opts.type        e.g. 'HR_LEAVE_REQUEST'
 * @param {string} opts.entityType  e.g. 'leave_request'
 * @param {number} opts.entityId    the domain row's id
 * @param {number} opts.requestedBy  user id of the submitter
 * @param {number} [opts.amount]    optional financial amount
 * @param {string} [opts.title]     human label
 * @param {string} [opts.description]
 */
export async function createApprovalRow(opts) {
  try {
    const role = APPROVER_ROLE_FOR_TYPE[opts.type];
    if (!role) {
      console.warn(`[approvalSync] no approver role configured for type=${opts.type}`);
      return undefined;
    }
    return await Approval.create({
      type:           opts.type,
      status:         'pending',
      entityType:     opts.entityType,
      entityId:       opts.entityId,
      amount:         opts.amount ?? null,
      currentLevel:   0,
      approvalChain:  buildSingleStepChain(role),
      approvalHistory: [],
      title:          opts.title ?? null,
      description:    opts.description ?? null,
      requestedBy:    opts.requestedBy,
    });
  } catch (err) {
    console.error('[approvalSync] failed to create Approval row:', err.message);
    return undefined;
  }
}

/**
 * Update the matching Approval row when the domain entity is decided
 * (approved / rejected / cancelled). Best-effort.
 */
export async function syncApprovalDecision({
  entityType,
  entityId,
  status,        // 'Approved' | 'Rejected' | 'Cancelled'
  decidedBy,     // user id
  notes,
}) {
  try {
    const row = await Approval.findOne({ where: { entityType, entityId } });
    if (!row) return undefined;
    const lcStatus = status.toLowerCase(); // approved | rejected | cancelled
    row.status = lcStatus;
    const chain = Array.isArray(row.approvalChain) ? [...row.approvalChain] : [];
    if (chain[0]) {
      chain[0].status     = lcStatus;
      chain[0].approverId = decidedBy ?? chain[0].approverId;
      chain[0].approvedAt = new Date();
      chain[0].comments   = notes ?? chain[0].comments;
    }
    row.approvalChain = chain;
    const hist = Array.isArray(row.approvalHistory) ? [...row.approvalHistory] : [];
    hist.push({
      action: lcStatus,
      actorId: decidedBy ?? null,
      at: new Date(),
      notes: notes ?? null,
    });
    row.approvalHistory = hist;
    await row.save();
    return row;
  } catch (err) {
    console.error('[approvalSync] failed to sync Approval decision:', err.message);
    return undefined;
  }
}
