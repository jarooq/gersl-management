import { useEffect } from 'react';

/**
 * WorkflowIntegration Component
 *
 * This component is a placeholder for workflow integrations.
 * With the database-backed workflow system, all integrations happen
 * server-side through the API endpoints:
 * - Proposal conversion creates projects, indicators, approvals, and notifications
 * - Approval workflows automatically route to next approvers
 * - Notifications are generated server-side for all workflow events
 * - Tasks are managed through the Task API
 *
 * No client-side callback registration is needed.
 */
const WorkflowIntegration = ({ children }) => {
  useEffect(() => {
    console.log('🔗 Workflow system ready (database-backed)');
  }, []);

  // This component just renders children - all workflow logic is server-side
  return <>{children}</>;
};

export default WorkflowIntegration;
