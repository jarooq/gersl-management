// =============================================================================
// Proposal state machine.
//
// Donor-facing audits ask "show me the proposal lifecycle". Before this file,
// updateProposalStatus accepted ANY transition — Draft could jump straight to
// "Donor Approved", which broke that audit trail. We now enforce the allowed
// edges and gate them by role.
//
// Roles are checked by name (matches auth.middleware.js role strings).
// =============================================================================

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

// Who is allowed to drive each transition. Admin always passes; CEO can
// override any donor-side step. Programme Manager runs the internal review.
const TRANSITION_ROLES = {
  'Submitted':          ['Admin', 'CEO', 'Programme Manager', 'Project Officer', 'Fundraising Manager'],
  'Under Review':       ['Admin', 'CEO', 'Programme Manager'],
  'Approved':           ['Admin', 'CEO', 'Programme Manager'],
  'Rejected':           ['Admin', 'CEO', 'Programme Manager'],
  'Submitted to Donor': ['Admin', 'CEO', 'Programme Manager', 'Fundraising Manager'],
  'Donor Approved':     ['Admin', 'CEO', 'Fundraising Manager'],
  'Donor Rejected':     ['Admin', 'CEO', 'Fundraising Manager'],
  'Draft':              ['Admin', 'CEO', 'Programme Manager', 'Project Officer', 'Fundraising Manager'],
};

export const VALID_STATUSES = Object.keys(TRANSITIONS);

/**
 * Throw a BadRequestError-shaped Error if the transition isn't allowed.
 * Returns silently on success.
 */
export const assertProposalTransition = ({ fromStatus, toStatus, userRole }) => {
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

  const requiredRoles = TRANSITION_ROLES[toStatus] || [];
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    const err = new Error(
      `Your role (${userRole}) cannot move a proposal to "${toStatus}". ` +
      `Required: ${requiredRoles.join(', ')}`
    );
    err.statusCode = 403;
    throw err;
  }
};
