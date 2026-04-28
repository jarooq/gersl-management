// Mock user list kept for legacy references in dev fixtures.
// Real authentication goes through /api/auth/login — these passwords are not used.
export const USERS = [];

export const USER_ROLES = {
  ADMIN: "Administrator",
  CEO: "CEO",
  PROGRAMME_MANAGER: "Programme Manager",
  FINANCE_MANAGER: "Finance Manager",
  MEAL: "MEAL",
  COORDINATOR: "Coordinator",
  DONOR: "Donor",
  HR_MANAGER: "HR Manager",
  FUNDRAISING_OFFICER: "Fundraising Officer",
  ORPHAN_MANAGER: "Orphan Manager"
};

export const ROLE_PERMISSIONS = {
  [USER_ROLES.ADMIN]: ["all"],
  [USER_ROLES.CEO]: ["approve_proposals", "view_all", "approve_budgets"],
  [USER_ROLES.PROGRAMME_MANAGER]: ["manage_projects", "approve_orphans", "view_reports"],
  [USER_ROLES.FINANCE_MANAGER]: ["manage_finance", "view_budgets", "create_pos"],
  [USER_ROLES.MEAL]: ["view_projects", "create_reports", "track_metrics"],
  [USER_ROLES.COORDINATOR]: ["manage_orphans", "field_visits", "view_projects"],
  [USER_ROLES.DONOR]: ["view_projects", "view_reports", "view_impact"],
  [USER_ROLES.HR_MANAGER]: ["manage_staff", "view_attendance", "approve_leave"],
  [USER_ROLES.FUNDRAISING_OFFICER]: ["manage_proposals", "manage_donors", "view_partners"],
  [USER_ROLES.ORPHAN_MANAGER]: ["manage_orphans", "track_visits", "manage_stipends"]
};
