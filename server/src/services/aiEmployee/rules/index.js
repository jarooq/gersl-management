/**
 * The Watcher's rule set.
 *
 * A rule is a small module with:
 *   key          stable identifier, used in dedupe keys and settings
 *   name         human label
 *   category     maps onto notifications.category
 *   isAvailable  () => boolean — false disables the rule (e.g. schema drift)
 *   detect       ({ config }) => finding[]
 *
 * Adding a rule is adding a file here. The engine handles dedupe, escalation,
 * quiet hours, rate limiting and auto-resolution for every rule uniformly.
 */

import taskDueSoon from './taskDueSoon.js';
import taskOverdue from './taskOverdue.js';
import taskDependencyBlocked from './taskDependencyBlocked.js';
import taskApprovalPending from './taskApprovalPending.js';
import approvalPending from './approvalPending.js';
import projectBudgetBurn from './projectBudgetBurn.js';
import projectEndingSoon from './projectEndingSoon.js';
import documentExpiring from './documentExpiring.js';

export const RULES = [
  taskOverdue,
  taskDueSoon,
  taskDependencyBlocked,
  taskApprovalPending,
  approvalPending,
  projectBudgetBurn,
  projectEndingSoon,
  documentExpiring
];

export const getRule = (key) => RULES.find((r) => r.key === key) ?? null;
