// =============================================================================
// Proposal state machine.
//
// Donor-facing audits ask "show me the proposal lifecycle". Before this file,
// updateProposalStatus accepted ANY transition — Draft could jump straight to
// "Donor Approved", which broke that audit trail. We enforce allowed edges
// and gate them by *permission* (so admin can re-wire roles via Settings →
// Roles & Permissions without code changes).
// =============================================================================

import { hasPermission, PERMISSIONS } from '../middleware/auth.middleware.js';

// Forward transitions allowed for each status. `[]` means terminal — no
// further moves except Draft (re-open) which is handled separately.
const TRANSITIONS = {
  'Draft':              ['Submitted'],
  'Submitted':          ['Under Review', 'Rejected', 'Draft'],
  'Under Review':       ['Approved', 'Rejected'],
  'Approved':           ['Submitted to Donor', 'Rejected'],
  'Submitted to Donor': ['Donor Approved', 'Donor Rejected'],
  'Donor Approved':     [],                  // terminal forward state
  'Donor Rejected':     ['Submitted to Donor'], // can retry with revised pitch
  'Rejected':           ['Draft'],           // can revise & re-submit
};

// Permission required to drive each transition. STATUS_CHANGE is the basic
// umbrella; INTERNAL_APPROVE covers the internal review track, DONOR_APPROVE
// the donor-facing side. Admin holds all permissions by default.
const TRANSITION_PERMISSIONS = {
  'Submitted':          PERMISSIONS.PROPOSALS_STATUS_CHANGE,
  'Under Review':       PERMISSIONS.PROPOSALS_INTERNAL_APPROVE,
  'Approved':           PERMISSIONS.PROPOSALS_INTERNAL_APPROVE,
  'Rejected':           PERMISSIONS.PROPOSALS_INTERNAL_APPROVE,
  'Submitted to Donor': PERMISSIONS.PROPOSALS_DONOR_APPROVE,
  'Donor Approved':     PERMISSIONS.PROPOSALS_DONOR_APPROVE,
  'Donor Rejected':     PERMISSIONS.PROPOSALS_DONOR_APPROVE,
  'Draft':              PERMISSIONS.PROPOSALS_STATUS_CHANGE,
};

export const VALID_STATUSES = Object.keys(TRANSITIONS);

/**
 * Throw a 400/403-shaped Error if the transition isn't allowed.
 * Caller signature: ({ fromStatus, toStatus, user }) — `user` is the full
 * req.user object so hasPermission can do role normalisation.
 */
export const assertProposalTransition = ({ fromStatus, toStatus, user }) => {
  if (!VALID_STATUSES.includes(toStatus)) {
    const err = new Error(`Invalid proposal status: ${toStatus}`);
    err.statusCode = 400;
    throw err;
  }
  if (fromStatus === toStatus) return; // no-op

  const allowedNext = TRANSITIONS[fromStatus] || [];
  if (!allowedNext.includes(toStatus)) {
    const err = new Error(
      `Cannot move proposal from "${fromStatus}" to "${toStatus}". ` +
      `Allowed transitions: ${allowedNext.join(', ') || '(none — terminal)'}`
    );
    err.statusCode = 400;
    throw err;
  }

  const requiredPerm = TRANSITION_PERMISSIONS[toStatus];
  if (requiredPerm && !hasPermission(user, requiredPerm)) {
    const err = new Error(
      `Your role (${user?.role}) lacks permission "${requiredPerm}" required ` +
      `to move a proposal to "${toStatus}".`
    );
    err.statusCode = 403;
    throw err;
  }
};
