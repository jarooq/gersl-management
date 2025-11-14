import React, { useEffect } from 'react';
import { useApproval } from '../../contexts/ApprovalContext';
import { useProjects } from '../../contexts/ProjectContext';
import { useProposals } from '../../contexts/ProposalsContext';

/**
 * WorkflowIntegration Component
 *
 * This component is responsible for wiring together the different contexts
 * to enable automated workflows between proposals, approvals, and projects.
 *
 * It registers callback functions with the ApprovalContext so that when
 * approvals are completed, the appropriate actions can be taken automatically
 * (e.g., converting an approved proposal to a project).
 */
const WorkflowIntegration = ({ children }) => {
  const { registerWorkflowCallbacks } = useApproval();
  const { addProject, updateProject, updateTask } = useProjects();
  const { updateProposal, getProposalById } = useProposals();

  useEffect(() => {
    // Register callbacks with the ApprovalContext
    registerWorkflowCallbacks({
      /**
       * Create a new project from an approved proposal
       */
      createProject: async (projectData) => {
        try {
          const newProject = addProject(projectData);
          console.log(`📁 Project created from proposal: ${newProject.code || newProject.name}`);
          return newProject;
        } catch (error) {
          console.error('Error creating project from proposal:', error);
          throw error;
        }
      },

      /**
       * Update a proposal (e.g., mark as approved or rejected)
       */
      updateProposal: async (proposalId, updates) => {
        try {
          updateProposal(proposalId, updates);
          console.log(`📝 Proposal updated: ${proposalId}`, updates);
        } catch (error) {
          console.error('Error updating proposal:', error);
          throw error;
        }
      },

      /**
       * Update a project (e.g., update status after approval)
       */
      updateProject: async (projectId, updates) => {
        try {
          updateProject(projectId, updates);
          console.log(`📁 Project updated: ${projectId}`, updates);
        } catch (error) {
          console.error('Error updating project:', error);
          throw error;
        }
      },

      /**
       * Update a project task (e.g., mark as approved)
       */
      updateTask: async (projectId, taskId, updates) => {
        try {
          updateTask(projectId, taskId, updates);
          console.log(`✅ Task updated: ${taskId} in project ${projectId}`, updates);
        } catch (error) {
          console.error('Error updating task:', error);
          throw error;
        }
      }
    });

    console.log('🔗 Workflow integration initialized');
  }, [registerWorkflowCallbacks, addProject, updateProject, updateProposal, updateTask, getProposalById]);

  // This component doesn't render anything, it just sets up the workflow connections
  return <>{children}</>;
};

export default WorkflowIntegration;
