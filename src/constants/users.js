export const USERS = [
  { id: 1, username: "admin", password: "admin123", name: "Admin User", role: "Administrator", avatar: "👑" },
  { id: 2, username: "ceo", password: "ceo123", name: "CEO", role: "CEO", avatar: "👔" },
  { id: 3, username: "pm", password: "pm123", name: "Programme Manager", role: "Programme Manager", avatar: "🎯" },
  { id: 4, username: "finance", password: "fin123", name: "Michael Chen", role: "Finance Manager", avatar: "📊" },
  { id: 5, username: "meal", password: "meal123", name: "MEAL Officer", role: "MEAL", avatar: "📈" },
  { id: 6, username: "coord", password: "coord123", name: "Field Coordinator", role: "Coordinator", avatar: "👤" },
  { id: 7, username: "donor", password: "donor123", name: "John Donor", role: "Donor", avatar: "💝" },
  { id: 8, username: "hr", password: "hr123", name: "HR Manager", role: "HR Manager", avatar: "👥" },
  { id: 9, username: "fundraising", password: "fund123", name: "Emma Thompson", role: "Fundraising Officer", avatar: "💰" },
  { id: 10, username: "orphan", password: "orphan123", name: "Sarah Care", role: "Orphan Manager", avatar: "👶" }
];

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
