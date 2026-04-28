import sequelize from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// ALL PERMISSIONS (matching frontend permissions.js)
// ============================================
const ALL_PERMISSIONS = [
  // Dashboard
  { key: 'dashboard:view', name: 'View Dashboard', module: 'Dashboard' },

  // Orphan Management
  { key: 'orphans:view', name: 'View Orphans', module: 'Orphans' },
  { key: 'orphans:create', name: 'Create Orphans', module: 'Orphans' },
  { key: 'orphans:edit', name: 'Edit Orphans', module: 'Orphans' },
  { key: 'orphans:delete', name: 'Delete Orphans', module: 'Orphans' },
  { key: 'orphans:approve', name: 'Approve Orphans', module: 'Orphans' },
  { key: 'orphans:assign_coordinator', name: 'Assign Coordinator', module: 'Orphans' },
  { key: 'orphans:register_beneficiary', name: 'Register Beneficiary', module: 'Orphans' },
  { key: 'orphans:sponsorship_manage', name: 'Manage Sponsorship', module: 'Orphans' },

  // Project Management
  { key: 'projects:view', name: 'View Projects', module: 'Projects' },
  { key: 'projects:create', name: 'Create Projects', module: 'Projects' },
  { key: 'projects:edit', name: 'Edit Projects', module: 'Projects' },
  { key: 'projects:delete', name: 'Delete Projects', module: 'Projects' },
  { key: 'projects:approve', name: 'Approve Projects', module: 'Projects' },
  { key: 'projects:director_approve', name: 'Director Approve Projects', module: 'Projects' },
  { key: 'projects:ceo_approve', name: 'CEO Approve Projects', module: 'Projects' },

  // Finance Management
  { key: 'finance:view', name: 'View Finance', module: 'Finance' },
  { key: 'finance:create_expense', name: 'Create Expense', module: 'Finance' },
  { key: 'finance:approve_expense', name: 'Approve Expense', module: 'Finance' },
  { key: 'finance:delete_expense', name: 'Delete Expense', module: 'Finance' },
  { key: 'finance:view_payroll', name: 'View Payroll', module: 'Finance' },
  { key: 'finance:process_payroll', name: 'Process Payroll', module: 'Finance' },
  { key: 'finance:approve_po', name: 'Approve Purchase Order', module: 'Finance' },
  { key: 'finance:manager_approve', name: 'Finance Manager Approve', module: 'Finance' },
  { key: 'finance:ceo_approve', name: 'CEO Finance Approve', module: 'Finance' },
  { key: 'finance:reconcile_accounts', name: 'Reconcile Accounts', module: 'Finance' },
  { key: 'finance:view_reports', name: 'View Finance Reports', module: 'Finance' },

  // HR Management
  { key: 'hr:view', name: 'View HR', module: 'HR' },
  { key: 'hr:create', name: 'Create HR Records', module: 'HR' },
  { key: 'hr:edit', name: 'Edit HR Records', module: 'HR' },
  { key: 'hr:delete', name: 'Delete HR Records', module: 'HR' },
  { key: 'hr:view_salary', name: 'View Salary', module: 'HR' },
  { key: 'hr:manage_recruitment', name: 'Manage Recruitment', module: 'HR' },
  { key: 'hr:manage_performance', name: 'Manage Performance', module: 'HR' },
  { key: 'hr:approve_leave', name: 'Approve Leave', module: 'HR' },
  { key: 'hr:manager_approve_leave', name: 'Manager Approve Leave', module: 'HR' },
  { key: 'hr:attendance_manage', name: 'Manage Attendance', module: 'HR' },
  { key: 'hr:view_attendance', name: 'View Attendance', module: 'HR' },
  { key: 'hr:edit_attendance', name: 'Edit Attendance', module: 'HR' },
  { key: 'hr:onboarding', name: 'View Onboarding', module: 'HR' },
  { key: 'hr:manage_onboarding', name: 'Manage Onboarding', module: 'HR' },
  { key: 'hr:appraisal', name: 'View Appraisal', module: 'HR' },
  { key: 'hr:manage_appraisals', name: 'Manage Appraisals', module: 'HR' },
  { key: 'hr:conduct_appraisals', name: 'Conduct Appraisals', module: 'HR' },
  { key: 'hr:manage_contracts', name: 'Manage Contracts', module: 'HR' },
  { key: 'hr:view_contracts', name: 'View Contracts', module: 'HR' },
  { key: 'hr:create_contracts', name: 'Create Contracts', module: 'HR' },
  { key: 'hr:renew_contracts', name: 'Renew Contracts', module: 'HR' },
  { key: 'hr:terminate_contracts', name: 'Terminate Contracts', module: 'HR' },
  { key: 'hr:documents_view', name: 'View Staff Documents', module: 'HR' },
  { key: 'hr:documents_upload', name: 'Upload Staff Documents', module: 'HR' },
  { key: 'hr:documents_delete', name: 'Delete Staff Documents', module: 'HR' },
  { key: 'hr:documents_approve', name: 'Approve Staff Documents', module: 'HR' },

  // CBO Management
  { key: 'cbo:view', name: 'View CBO', module: 'CBO' },
  { key: 'cbo:create', name: 'Create CBO', module: 'CBO' },
  { key: 'cbo:edit', name: 'Edit CBO', module: 'CBO' },
  { key: 'cbo:delete', name: 'Delete CBO', module: 'CBO' },
  { key: 'cbo:approve_proposal', name: 'Approve CBO Proposal', module: 'CBO' },
  { key: 'cbo:fundraising_review', name: 'Fundraising Review CBO', module: 'CBO' },
  { key: 'cbo:programme_manager_approve', name: 'PM Approve CBO', module: 'CBO' },
  { key: 'cbo:director_approve', name: 'Director Approve CBO', module: 'CBO' },
  { key: 'cbo:ceo_approve', name: 'CEO Approve CBO', module: 'CBO' },

  // Partners Management
  { key: 'partners:view', name: 'View Partners', module: 'Partners' },
  { key: 'partners:create', name: 'Create Partners', module: 'Partners' },
  { key: 'partners:edit', name: 'Edit Partners', module: 'Partners' },
  { key: 'partners:delete', name: 'Delete Partners', module: 'Partners' },

  // Proposals Management
  { key: 'proposals:view', name: 'View Proposals', module: 'Proposals' },
  { key: 'proposals:create', name: 'Create Proposals', module: 'Proposals' },
  { key: 'proposals:edit', name: 'Edit Proposals', module: 'Proposals' },
  { key: 'proposals:delete', name: 'Delete Proposals', module: 'Proposals' },
  { key: 'proposals:submit', name: 'Submit Proposals', module: 'Proposals' },
  { key: 'proposals:approve', name: 'Approve Proposals', module: 'Proposals' },

  // MEAL Management
  { key: 'meal:view', name: 'View MEAL', module: 'MEAL' },
  { key: 'meal:create', name: 'Create MEAL', module: 'MEAL' },
  { key: 'meal:edit', name: 'Edit MEAL', module: 'MEAL' },
  { key: 'meal:delete', name: 'Delete MEAL', module: 'MEAL' },
  { key: 'meal:approve', name: 'Approve MEAL', module: 'MEAL' },
  { key: 'meal:monitoring', name: 'MEAL Monitoring', module: 'MEAL' },
  { key: 'meal:evaluation', name: 'MEAL Evaluation', module: 'MEAL' },
  { key: 'meal:evaluation_create', name: 'Create Evaluation', module: 'MEAL' },
  { key: 'meal:evaluation_edit', name: 'Edit Evaluation', module: 'MEAL' },
  { key: 'meal:evaluation_delete', name: 'Delete Evaluation', module: 'MEAL' },
  { key: 'meal:learning_events_view', name: 'View Learning Events', module: 'MEAL' },
  { key: 'meal:learning_events_create', name: 'Create Learning Events', module: 'MEAL' },
  { key: 'meal:learning_events_edit', name: 'Edit Learning Events', module: 'MEAL' },
  { key: 'meal:learning_events_delete', name: 'Delete Learning Events', module: 'MEAL' },
  { key: 'meal:indicators_view', name: 'View Indicators', module: 'MEAL' },
  { key: 'meal:indicators_create', name: 'Create Indicators', module: 'MEAL' },
  { key: 'meal:indicators_edit', name: 'Edit Indicators', module: 'MEAL' },
  { key: 'meal:indicators_update', name: 'Update Indicators', module: 'MEAL' },
  { key: 'meal:indicators_delete', name: 'Delete Indicators', module: 'MEAL' },

  // Campaigns Management
  { key: 'campaigns:view', name: 'View Campaigns', module: 'Campaigns' },
  { key: 'campaigns:create', name: 'Create Campaigns', module: 'Campaigns' },
  { key: 'campaigns:edit', name: 'Edit Campaigns', module: 'Campaigns' },
  { key: 'campaigns:delete', name: 'Delete Campaigns', module: 'Campaigns' },
  { key: 'campaigns:approve', name: 'Approve Campaigns', module: 'Campaigns' },
  { key: 'campaigns:budget_manage', name: 'Manage Campaign Budget', module: 'Campaigns' },
  { key: 'campaigns:packages_view', name: 'View Campaign Packages', module: 'Campaigns' },
  { key: 'campaigns:packages_create', name: 'Create Campaign Packages', module: 'Campaigns' },
  { key: 'campaigns:packages_edit', name: 'Edit Campaign Packages', module: 'Campaigns' },
  { key: 'campaigns:packages_delete', name: 'Delete Campaign Packages', module: 'Campaigns' },

  // Donations
  { key: 'donations:view', name: 'View Donations', module: 'Donations' },
  { key: 'donations:create', name: 'Create Donations', module: 'Donations' },
  { key: 'donations:edit', name: 'Edit Donations', module: 'Donations' },
  { key: 'donations:delete', name: 'Delete Donations', module: 'Donations' },

  // Social Media
  { key: 'social_media:view', name: 'View Social Media', module: 'Social Media' },
  { key: 'social_media:create', name: 'Create Social Media', module: 'Social Media' },
  { key: 'social_media:publish', name: 'Publish Social Media', module: 'Social Media' },
  { key: 'social_media:delete', name: 'Delete Social Media', module: 'Social Media' },

  // Job Postings
  { key: 'job_postings:view', name: 'View Job Postings', module: 'Job Postings' },
  { key: 'job_postings:create', name: 'Create Job Postings', module: 'Job Postings' },
  { key: 'job_postings:edit', name: 'Edit Job Postings', module: 'Job Postings' },
  { key: 'job_postings:delete', name: 'Delete Job Postings', module: 'Job Postings' },

  // Vendor Calls
  { key: 'vendor_calls:view', name: 'View Vendor Calls', module: 'Vendor Calls' },
  { key: 'vendor_calls:create', name: 'Create Vendor Calls', module: 'Vendor Calls' },
  { key: 'vendor_calls:edit', name: 'Edit Vendor Calls', module: 'Vendor Calls' },
  { key: 'vendor_calls:delete', name: 'Delete Vendor Calls', module: 'Vendor Calls' },

  // Operations
  { key: 'operations:view_activities', name: 'View Activities', module: 'Operations' },
  { key: 'operations:create_activity', name: 'Create Activity', module: 'Operations' },
  { key: 'operations:edit_activity', name: 'Edit Activity', module: 'Operations' },
  { key: 'operations:delete_activity', name: 'Delete Activity', module: 'Operations' },
  { key: 'operations:view_tasks', name: 'View Tasks', module: 'Operations' },
  { key: 'operations:create_task', name: 'Create Task', module: 'Operations' },
  { key: 'operations:edit_task', name: 'Edit Task', module: 'Operations' },
  { key: 'operations:delete_task', name: 'Delete Task', module: 'Operations' },
  { key: 'operations:assign_task', name: 'Assign Task', module: 'Operations' },
  { key: 'operations:update_task_progress', name: 'Update Task Progress', module: 'Operations' },
  { key: 'operations:complete_task', name: 'Complete Task', module: 'Operations' },
  { key: 'operations:my_tasks', name: 'View My Tasks', module: 'Operations' },

  // Approvals
  { key: 'approvals:view', name: 'View Approvals', module: 'Approvals' },
  { key: 'approvals:manage', name: 'Manage Approvals', module: 'Approvals' },

  // Reports & Compliance
  { key: 'reports:view', name: 'View Reports', module: 'Reports' },
  { key: 'reports:create', name: 'Create Reports', module: 'Reports' },
  { key: 'reports:generate', name: 'Generate Reports', module: 'Reports' },
  { key: 'reports:edit', name: 'Edit Reports', module: 'Reports' },
  { key: 'reports:delete', name: 'Delete Reports', module: 'Reports' },
  { key: 'reports:export', name: 'Export Reports', module: 'Reports' },
  { key: 'compliance:view', name: 'View Compliance', module: 'Compliance' },
  { key: 'compliance:manage', name: 'Manage Compliance', module: 'Compliance' },

  // System Settings
  { key: 'settings:view', name: 'View Settings', module: 'Settings' },
  { key: 'settings:manage', name: 'Manage Settings', module: 'Settings' },
  { key: 'settings:roles_manage', name: 'Manage Roles', module: 'Settings' },
  { key: 'system:settings', name: 'System Settings', module: 'Settings' },

  // User Management
  { key: 'users:view', name: 'View Users', module: 'Users' },
  { key: 'users:create', name: 'Create Users', module: 'Users' },
  { key: 'users:edit', name: 'Edit Users', module: 'Users' },
  { key: 'users:delete', name: 'Delete Users', module: 'Users' },

  // Beneficiary Management
  { key: 'beneficiaries:view', name: 'View Beneficiaries', module: 'Beneficiaries' },
  { key: 'beneficiaries:create', name: 'Create Beneficiaries', module: 'Beneficiaries' },
  { key: 'beneficiaries:edit', name: 'Edit Beneficiaries', module: 'Beneficiaries' },
  { key: 'beneficiaries:delete', name: 'Delete Beneficiaries', module: 'Beneficiaries' },
];

// ============================================
// ALL ROLES
// ============================================
const ALL_ROLES = [
  { name: 'Admin', description: 'System Administrator - Full access to all features', is_system_role: true, level: 0 },
  { name: 'BOD', description: 'Board of Directors - Strategic oversight and governance', is_system_role: true, level: 1 },
  { name: 'CEO', description: 'Chief Executive Officer - Executive authority and approvals', is_system_role: true, level: 2 },
  { name: 'Director Programmes', description: 'Director of Programmes - Programme oversight and approval', is_system_role: true, level: 3 },
  { name: 'Programme Manager', description: 'Programme Manager - Manages all programme activities', is_system_role: true, level: 4 },
  { name: 'Finance Manager', description: 'Finance Manager - Full finance management', is_system_role: true, level: 4 },
  { name: 'Fundraising Manager', description: 'Fundraising Manager - Campaigns and donor management', is_system_role: true, level: 4 },
  { name: 'HR Manager', description: 'HR Manager - Full human resources management', is_system_role: true, level: 4 },
  { name: 'Project Officer WASH', description: 'Project Officer - Water, Sanitation and Hygiene', is_system_role: true, level: 5 },
  { name: 'Project Officer Orphans', description: 'Project Officer - Orphan Care and Protection', is_system_role: true, level: 5 },
  { name: 'Project Officer Livelihoods', description: 'Project Officer - Livelihoods and Economic Development', is_system_role: true, level: 5 },
  { name: 'Project Officer Infrastructure', description: 'Project Officer - Infrastructure and Construction', is_system_role: true, level: 5 },
  { name: 'Project Officer Education', description: 'Project Officer - Education Programmes', is_system_role: true, level: 5 },
  { name: 'Project Officer Women', description: 'Project Officer - Women Development', is_system_role: true, level: 5 },
  { name: 'Project Officer', description: 'Generic Project Officer', is_system_role: true, level: 5 },
  { name: 'Field Officer', description: 'Field Officer - Field operations and data collection', is_system_role: true, level: 5 },
  { name: 'Finance Officer', description: 'Finance Officer - Finance operations support', is_system_role: true, level: 5 },
  { name: 'HR Officer', description: 'HR Officer - HR operations support', is_system_role: true, level: 5 },
  { name: 'MEAL Officer', description: 'MEAL Officer - Monitoring, Evaluation, Accountability and Learning', is_system_role: true, level: 5 },
  { name: 'Media Production Officer', description: 'Media Production Officer - Content creation and publishing', is_system_role: true, level: 5 },
  { name: 'Media Officer', description: 'Media Officer - Media support', is_system_role: true, level: 5 },
  { name: 'Accountant', description: 'Accountant - Financial record keeping and reconciliation', is_system_role: true, level: 5 },
  { name: 'Project Assistant', description: 'Project Assistant - Project support', is_system_role: true, level: 6 },
  { name: 'Finance Assistant', description: 'Finance Assistant - Finance support', is_system_role: true, level: 6 },
  { name: 'Fundraising Assistant', description: 'Fundraising Assistant - Fundraising support', is_system_role: true, level: 6 },
  { name: 'HR Assistant', description: 'HR Assistant - HR support', is_system_role: true, level: 6 },
  { name: 'Orphan Coordinator', description: 'Orphan Coordinator - Orphan care coordination', is_system_role: true, level: 7 },
  { name: 'Guest', description: 'Guest - Minimal read-only access', is_system_role: true, level: 99 },
];

// ============================================
// ROLE-PERMISSION MAPPINGS (matching frontend)
// ============================================
const allPermKeys = ALL_PERMISSIONS.map(p => p.key);

const ROLE_PERMISSIONS = {
  'Admin': allPermKeys, // Full access
  'BOD': [
    'dashboard:view', 'orphans:view', 'beneficiaries:view', 'projects:view',
    'finance:view', 'finance:view_reports', 'hr:view', 'cbo:view', 'partners:view',
    'proposals:view', 'meal:view', 'campaigns:view', 'donations:view',
    'reports:view', 'reports:generate', 'reports:export',
    'compliance:view', 'settings:view',
  ],
  'CEO': [
    'dashboard:view',
    'orphans:view', 'orphans:approve', 'orphans:sponsorship_manage',
    'beneficiaries:view', 'beneficiaries:create', 'beneficiaries:edit', 'beneficiaries:delete',
    'projects:view', 'projects:ceo_approve',
    'finance:view', 'finance:ceo_approve', 'finance:view_reports', 'finance:view_payroll',
    'hr:view', 'hr:manager_approve_leave', 'hr:view_salary',
    'cbo:view', 'cbo:ceo_approve',
    'partners:view', 'partners:create', 'partners:edit',
    'proposals:view', 'proposals:approve',
    'meal:view', 'meal:approve', 'meal:evaluation', 'meal:evaluation_create', 'meal:evaluation_edit', 'meal:evaluation_delete',
    'meal:learning_events_view', 'meal:learning_events_create', 'meal:learning_events_edit', 'meal:learning_events_delete',
    'meal:indicators_view', 'meal:indicators_create', 'meal:indicators_edit', 'meal:indicators_update',
    'campaigns:view', 'campaigns:approve', 'campaigns:packages_view', 'campaigns:packages_create', 'campaigns:packages_edit',
    'donations:view', 'social_media:view', 'job_postings:view', 'vendor_calls:view',
    'operations:view_activities', 'operations:create_activity', 'operations:edit_activity', 'operations:delete_activity',
    'operations:view_tasks', 'operations:create_task', 'operations:edit_task', 'operations:delete_task',
    'operations:assign_task', 'operations:update_task_progress', 'operations:complete_task', 'operations:my_tasks',
    'approvals:view', 'approvals:manage',
    'reports:view', 'reports:generate', 'reports:export',
    'compliance:view', 'compliance:manage',
    'settings:view', 'settings:manage', 'users:view',
  ],
  'Director Programmes': [
    'dashboard:view',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:approve', 'orphans:assign_coordinator',
    'beneficiaries:view', 'beneficiaries:create', 'beneficiaries:edit', 'beneficiaries:delete',
    'projects:view', 'projects:create', 'projects:edit', 'projects:director_approve',
    'cbo:view', 'cbo:director_approve',
    'proposals:view', 'proposals:create', 'proposals:edit', 'proposals:approve',
    'meal:view', 'meal:approve', 'meal:evaluation', 'meal:evaluation_create', 'meal:evaluation_edit',
    'meal:learning_events_view', 'meal:learning_events_create', 'meal:learning_events_edit',
    'meal:indicators_view', 'meal:indicators_update',
    'operations:view_activities', 'operations:create_activity', 'operations:edit_activity',
    'operations:view_tasks', 'operations:create_task', 'operations:edit_task', 'operations:assign_task', 'operations:my_tasks',
    'partners:view', 'finance:view',
    'reports:view', 'reports:generate', 'reports:export',
    'settings:view',
  ],
  'Programme Manager': [
    'dashboard:view',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:approve', 'orphans:assign_coordinator', 'orphans:register_beneficiary',
    'beneficiaries:view', 'beneficiaries:create', 'beneficiaries:edit', 'beneficiaries:delete',
    'projects:view', 'projects:create', 'projects:edit', 'projects:approve',
    'cbo:view', 'cbo:edit', 'cbo:programme_manager_approve',
    'proposals:view', 'proposals:create', 'proposals:edit',
    'meal:view', 'meal:create', 'meal:edit', 'meal:approve', 'meal:evaluation', 'meal:evaluation_create', 'meal:evaluation_edit',
    'meal:learning_events_view', 'meal:learning_events_create', 'meal:learning_events_edit',
    'meal:indicators_view', 'meal:indicators_create', 'meal:indicators_edit', 'meal:indicators_update',
    'operations:view_activities', 'operations:create_activity', 'operations:edit_activity',
    'operations:view_tasks', 'operations:create_task', 'operations:edit_task', 'operations:delete_task',
    'operations:assign_task', 'operations:update_task_progress', 'operations:complete_task', 'operations:my_tasks',
    'partners:view', 'finance:view', 'finance:approve_expense',
    'reports:view', 'reports:generate', 'reports:export',
    'approvals:view',
  ],
  'Finance Manager': [
    'dashboard:view',
    'finance:view', 'finance:create_expense', 'finance:approve_expense', 'finance:delete_expense',
    'finance:view_payroll', 'finance:process_payroll', 'finance:approve_po',
    'finance:manager_approve', 'finance:reconcile_accounts', 'finance:view_reports',
    'orphans:view', 'beneficiaries:view', 'projects:view', 'cbo:view', 'partners:view',
    'reports:view', 'reports:generate', 'reports:export',
    'approvals:view', 'settings:view',
  ],
  'Fundraising Manager': [
    'dashboard:view',
    'cbo:view', 'cbo:fundraising_review',
    'partners:view', 'partners:create', 'partners:edit',
    'proposals:view', 'proposals:create', 'proposals:edit',
    'campaigns:view', 'campaigns:create', 'campaigns:edit', 'campaigns:approve', 'campaigns:budget_manage',
    'donations:view', 'donations:create', 'donations:edit',
    'social_media:view', 'social_media:create',
    'projects:view', 'meal:view',
    'reports:view', 'reports:generate',
    'approvals:view',
  ],
  'HR Manager': [
    'dashboard:view',
    'hr:view', 'hr:create', 'hr:edit', 'hr:delete',
    'hr:approve_leave', 'hr:manager_approve_leave', 'hr:view_salary',
    'hr:manage_recruitment', 'hr:manage_performance',
    'hr:attendance_manage', 'hr:onboarding', 'hr:appraisal',
    'hr:view_attendance', 'hr:manage_onboarding', 'hr:manage_appraisals', 'hr:manage_contracts',
    'finance:view_payroll', 'finance:process_payroll',
    'job_postings:view', 'job_postings:create', 'job_postings:edit', 'job_postings:delete',
    'projects:view', 'orphans:view',
    'reports:view', 'reports:generate',
    'approvals:view', 'settings:view', 'users:view',
  ],
  'Project Officer WASH': [
    'dashboard:view', 'operations:my_tasks',
    'projects:view', 'projects:create', 'projects:edit',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:register_beneficiary',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit', 'meal:monitoring',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer Orphans': [
    'dashboard:view', 'operations:my_tasks',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:register_beneficiary',
    'orphans:assign_coordinator', 'orphans:sponsorship_manage',
    'projects:view', 'projects:create', 'projects:edit',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer Livelihoods': [
    'dashboard:view', 'operations:my_tasks',
    'projects:view', 'projects:create', 'projects:edit',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:register_beneficiary',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer Infrastructure': [
    'dashboard:view', 'operations:my_tasks',
    'projects:view', 'projects:create', 'projects:edit',
    'vendor_calls:view', 'vendor_calls:create', 'vendor_calls:edit',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer Education': [
    'dashboard:view', 'operations:my_tasks',
    'projects:view', 'projects:create', 'projects:edit',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:register_beneficiary',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer Women': [
    'dashboard:view', 'operations:my_tasks',
    'projects:view', 'projects:create', 'projects:edit',
    'orphans:view', 'orphans:create', 'orphans:edit', 'orphans:register_beneficiary',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Project Officer': [
    'dashboard:view',
    'orphans:view', 'orphans:create', 'orphans:edit',
    'projects:view', 'projects:create', 'projects:edit',
    'cbo:view',
    'meal:view', 'meal:create', 'meal:edit',
    'finance:view', 'finance:create_expense',
    'reports:view',
  ],
  'Field Officer': [
    'dashboard:view', 'operations:my_tasks',
    'orphans:view', 'orphans:edit',
    'projects:view',
    'meal:view', 'meal:create',
    'cbo:view',
    'reports:view',
  ],
  'Finance Officer': [
    'dashboard:view', 'operations:my_tasks',
    'finance:view', 'finance:create_expense', 'finance:view_payroll',
    'orphans:view', 'projects:view',
    'reports:view',
  ],
  'HR Officer': [
    'dashboard:view', 'operations:my_tasks',
    'hr:view', 'hr:create', 'hr:edit',
    'hr:approve_leave', 'hr:attendance_manage', 'hr:view_attendance',
    'hr:onboarding', 'hr:manage_onboarding', 'hr:manage_contracts',
    'job_postings:view', 'job_postings:create', 'job_postings:edit',
    'projects:view',
    'reports:view',
    'users:view',
  ],
  'MEAL Officer': [
    'dashboard:view',
    'meal:view', 'meal:create', 'meal:edit', 'meal:delete', 'meal:monitoring', 'meal:evaluation',
    'orphans:view', 'projects:view', 'cbo:view', 'finance:view',
    'reports:view', 'reports:generate', 'reports:export',
  ],
  'Media Production Officer': [
    'dashboard:view', 'operations:my_tasks',
    'social_media:view', 'social_media:create', 'social_media:publish',
    'campaigns:view', 'campaigns:create', 'campaigns:edit',
    'donations:view',
    'projects:view', 'orphans:view',
    'reports:view',
  ],
  'Media Officer': [
    'dashboard:view', 'operations:my_tasks',
    'social_media:view', 'social_media:create',
    'campaigns:view',
    'projects:view',
    'reports:view',
  ],
  'Accountant': [
    'dashboard:view', 'operations:my_tasks',
    'finance:view', 'finance:create_expense', 'finance:view_payroll', 'finance:reconcile_accounts',
    'projects:view',
    'reports:view', 'reports:generate',
  ],
  'Project Assistant': [
    'dashboard:view',
    'orphans:view', 'orphans:create', 'orphans:edit',
    'projects:view', 'projects:create', 'projects:edit',
    'meal:view', 'meal:create',
    'cbo:view',
    'finance:view',
    'reports:view',
  ],
  'Finance Assistant': [
    'dashboard:view',
    'finance:view', 'finance:create_expense',
    'projects:view',
    'reports:view',
  ],
  'Fundraising Assistant': [
    'dashboard:view',
    'campaigns:view', 'campaigns:create',
    'donations:view', 'donations:create',
    'social_media:view',
    'partners:view',
    'reports:view',
  ],
  'HR Assistant': [
    'dashboard:view',
    'hr:view', 'hr:create',
    'hr:attendance_manage', 'hr:view_attendance',
    'job_postings:view',
    'reports:view',
  ],
  'Orphan Coordinator': [
    'dashboard:view',
    'orphans:view', 'orphans:edit',
    'projects:view',
    'meal:view',
    'reports:view',
  ],
  'Guest': [
    'dashboard:view',
    'projects:view',
    'partners:view',
    'reports:view',
  ],
};

// ============================================
// SEED FUNCTION
// ============================================
async function seedRolesAndPermissions() {
  console.log('🌱 Starting roles and permissions seed...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connected\n');

    // 1. Seed Permissions
    console.log('📋 Seeding permissions...');
    const permissionMap = {};

    for (const perm of ALL_PERMISSIONS) {
      const [result] = await sequelize.query(
        `INSERT INTO permissions (permission_key, permission_name, module)
         VALUES (:key, :name, :module)
         ON CONFLICT (permission_key) DO UPDATE SET permission_name = :name, module = :module
         RETURNING id`,
        {
          replacements: { key: perm.key, name: perm.name, module: perm.module },
          type: sequelize.QueryTypes.SELECT
        }
      );
      permissionMap[perm.key] = result.id;
    }
    console.log(`   ✅ ${Object.keys(permissionMap).length} permissions seeded\n`);

    // 2. Seed Roles
    console.log('👥 Seeding roles...');
    const roleMap = {};

    for (const role of ALL_ROLES) {
      const [result] = await sequelize.query(
        `INSERT INTO roles (name, description, is_system_role, is_active, created_at, updated_at)
         VALUES (:name, :description, :is_system_role, true, NOW(), NOW())
         ON CONFLICT (name) DO UPDATE SET description = :description, is_system_role = :is_system_role
         RETURNING id`,
        {
          replacements: { name: role.name, description: role.description, is_system_role: role.is_system_role },
          type: sequelize.QueryTypes.SELECT
        }
      );
      roleMap[role.name] = result.id;
    }
    console.log(`   ✅ ${Object.keys(roleMap).length} roles seeded\n`);

    // 3. Seed Role-Permission Mappings
    console.log('🔗 Seeding role-permission mappings...');
    let mappingCount = 0;

    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleMap[roleName];
      if (!roleId) {
        console.log(`   ⚠️  Role "${roleName}" not found in roleMap, skipping`);
        continue;
      }

      // Clear existing mappings for this role
      await sequelize.query(
        `DELETE FROM role_permissions WHERE role_id = :roleId`,
        { replacements: { roleId } }
      );

      for (const permKey of permKeys) {
        const permId = permissionMap[permKey];
        if (!permId) {
          console.log(`   ⚠️  Permission "${permKey}" not found, skipping`);
          continue;
        }

        await sequelize.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES (:roleId, :permId)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          { replacements: { roleId, permId } }
        );
        mappingCount++;
      }
    }
    console.log(`   ✅ ${mappingCount} role-permission mappings seeded\n`);

    // 4. Summary
    console.log('🎉 ====================================');
    console.log('   Seed Complete!');
    console.log('   ====================================');
    console.log(`   Permissions: ${Object.keys(permissionMap).length}`);
    console.log(`   Roles: ${Object.keys(roleMap).length}`);
    console.log(`   Mappings: ${mappingCount}`);
    console.log('   ====================================\n');

    // Print role summary
    console.log('📊 Role Summary:');
    for (const role of ALL_ROLES) {
      const permCount = (ROLE_PERMISSIONS[role.name] || []).length;
      console.log(`   ${role.name.padEnd(30)} Level ${String(role.level).padEnd(3)} ${permCount} permissions`);
    }

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

seedRolesAndPermissions();
