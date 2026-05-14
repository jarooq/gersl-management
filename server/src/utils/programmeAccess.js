// =============================================================================
// Programme access helpers — uniform role-based scoping for WASH/IGP/map
// endpoints. Senior roles see everything; field staff only see what's
// assigned to them. Used by listOrders / listItems / map pins / email-donor.
// =============================================================================

// Roles that get org-wide visibility on programme data. Anyone outside this
// set is scoped to items they're directly assigned to (as supervisor) or
// items in projects they're attached to.
export const FULL_VIEW_ROLES = [
  'Admin', 'CEO', 'BOD',
  'Programme Manager', 'Director Programmes', 'Programme Officer',
  'Finance Manager', 'Finance Officer', 'Accountant',
  'MEAL Officer', 'Fundraising Manager',
];

export const isFullView = (user) =>
  !!user?.role && FULL_VIEW_ROLES.includes(user.role);

// Roles that can perform delivery-blocking actions like emailing donor
// bundles or generating proforma invoices — narrower than view.
export const PROGRAMME_DELIVERY_ROLES = [
  'Admin', 'CEO',
  'Programme Manager', 'Director Programmes', 'Programme Officer',
  'Finance Manager', 'Fundraising Manager',
];

export const canPerformDelivery = (user) =>
  !!user?.role && PROGRAMME_DELIVERY_ROLES.includes(user.role);
