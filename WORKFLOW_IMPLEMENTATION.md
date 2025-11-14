# Workflow Automation Implementation

## Overview

This document describes the implementation of automated workflows in the GERSL Management System. The workflow automation connects proposals, approvals, and projects to create a seamless process from proposal submission to project implementation.

## Workflow Architecture

### Components

1. **Workflow Orchestrator** (`src/utils/workflowOrchestrator.js`)
   - Central coordination utility
   - Handles proposal-to-project conversion
   - Manages workflow callbacks and triggers

2. **Workflow Integration Component** (`src/components/workflow/WorkflowIntegration.jsx`)
   - Connects all context providers
   - Registers callback functions with ApprovalContext
   - Enables automatic workflow execution

3. **Enhanced Context Providers**
   - **ProposalsContext**: Added workflow submission methods
   - **ApprovalContext**: Added workflow completion handlers
   - **ProjectContext**: Accepts automated project creation

## Automated Workflow Process

### 1. Proposal Submission to Approval

**Flow:**
```
Fundraising Department Creates Proposal (Draft)
    ↓
Proposal Submitted for Approval
    ↓
Automatic Approval Workflow Created
    ↓
Proposal Status: "Submitted"
```

**Implementation:**

The `ProposalsContext` now includes a `submitProposalForApproval()` method:

```javascript
const submitProposalForApproval = (proposalId, currentUser, createApprovalCallback);
```

This method:
1. Updates proposal status to "Submitted"
2. Creates approval workflow data
3. Returns approval data for the ApprovalContext to process

**Usage Example:**

```javascript
const { submitProposalForApproval } = useProposals();
const { createApproval } = useApproval();
const { currentUser } = useAuth();

// Submit proposal
const result = submitProposalForApproval(proposalId, currentUser);

if (result.success) {
  // Create the approval workflow
  await createApproval(result.approvalData);
}
```

### 2. Multi-Level Approval Process

**Flow:**
```
Approval Workflow Created
    ↓
Level 1: Fundraising Manager Reviews
    ↓
Level 2: Director of Programmes Reviews (if budget > $50,000)
    ↓
Level 3: CEO Reviews (if budget > $100,000)
    ↓
All Levels Approved
```

**Approval Thresholds:**

| Budget Amount | Required Approvals |
|--------------|-------------------|
| < $50,000 | Fundraising Manager |
| $50,000 - $100,000 | Fundraising Manager → Director of Programmes |
| > $100,000 | Fundraising Manager → Director of Programmes → CEO |

**Implementation:**

The approval workflow is defined in `src/utils/approvalWorkflow.js`:

```javascript
PROPOSAL_SUBMISSION: {
  name: 'Proposal Submission',
  levels: [
    { role: 'FUNDRAISING_MANAGER', threshold: 0 },
    { role: 'DIRECTOR_PROGRAMMES', threshold: 50000 },
    { role: 'CEO', threshold: 100000 },
  ],
  approvalType: 'proposals',
}
```

### 3. Automatic Proposal-to-Project Conversion

**Flow:**
```
All Approval Levels Completed
    ↓
Workflow Status: "Approved"
    ↓
Automatic Trigger: handleProposalApprovalComplete()
    ↓
Proposal Data Converted to Project Format
    ↓
New Project Created Automatically
    ↓
Proposal Status Updated: "Approved" + Linked to Project
```

**Implementation:**

The `ApprovalContext` monitors approval completion and triggers conversion:

```javascript
// In ApprovalContext approve() method
if (updatedWorkflow && updatedWorkflow.status === APPROVAL_STATUS.APPROVED) {
  if (updatedWorkflow.type === 'PROPOSAL_SUBMISSION') {
    const result = await handleProposalApprovalComplete(
      updatedWorkflow,
      workflowCallbacks.createProject,
      workflowCallbacks.updateProposal
    );
  }
}
```

**Conversion Mapping:**

| Proposal Field | Project Field |
|---------------|---------------|
| title | name |
| proposalCode | sourceProposalCode |
| budgetRequested | budget |
| programmeArea | programmeArea |
| donor | donor |
| startDate | startDate |
| endDate | endDate |
| targetBeneficiaries | targetBeneficiaries |
| resultsFramework | resultsFramework |
| theoryOfChange | theoryOfChange |

### 4. Rejection Handling

**Flow:**
```
Approver Rejects Proposal
    ↓
Workflow Status: "Rejected"
    ↓
Automatic Trigger: handleProposalRejection()
    ↓
Proposal Status Updated: "Rejected"
    ↓
Rejection Reason Stored
```

**Implementation:**

```javascript
// In ApprovalContext reject() method
if (rejectedWorkflow && rejectedWorkflow.type === 'PROPOSAL_SUBMISSION') {
  const result = await handleProposalRejection(
    rejectedWorkflow,
    workflowCallbacks.updateProposal
  );
}
```

## Project Implementation Workflows

### Project Activity Approvals

**Flow:**
```
Project Manager Creates Activity/Task
    ↓
Activity Requires Budget Approval
    ↓
Automatic Approval Workflow Created
    ↓
Project Officer → Programme Manager Approval
    ↓
Activity Status: "Approved"
```

**Approval Thresholds:**

| Activity Budget | Required Approvals |
|----------------|-------------------|
| < $10,000 | Project Officer |
| > $10,000 | Project Officer → Programme Manager |

**Implementation:**

Use `createProjectActivityApprovalWorkflow()` from the workflow orchestrator:

```javascript
const approvalData = createProjectActivityApprovalWorkflow(
  activity,
  project,
  currentUser
);

await createApproval(approvalData);
```

## Key Features

### 1. Automatic Workflow Creation

When a proposal is submitted, an approval workflow is automatically created based on the proposal's budget amount. The system determines the required approval levels and creates the appropriate workflow structure.

### 2. Role-Based Approval Routing

The system routes approval requests to the appropriate roles based on:
- Budget thresholds
- Organizational hierarchy
- Approval type

### 3. Status Tracking

All entities track their workflow status:
- **Proposals**: Draft → Submitted → Approved/Rejected
- **Approvals**: Pending → In Review → Approved/Rejected/Cancelled
- **Projects**: Created from approved proposals with full audit trail

### 4. Audit Trail

Every workflow action is tracked:
- Who initiated the request
- Who approved/rejected at each level
- Timestamps for all actions
- Comments and reasons for decisions

## Console Logging

The workflow system provides detailed console logging for debugging and monitoring:

```
✅ Created approval workflow: APR-1234567890-ABC (Proposal Submission)
🎉 Workflow fully approved: APR-1234567890-ABC (Proposal Submission)
✅ Proposal PROP-2025-001 converted to project
📁 Project created from proposal: PRJ-2025-001
📝 Proposal updated: 1 {status: 'Approved', linkedProjectId: 2, ...}
```

## Error Handling

The workflow system includes comprehensive error handling:

1. **Missing Callbacks**: Warns if required callbacks are not registered
2. **Invalid Status**: Validates workflow status before triggering actions
3. **Conversion Failures**: Catches and logs errors during proposal-to-project conversion
4. **Permission Errors**: Validates user permissions before allowing approval actions

## Testing the Workflow

### Test Scenario 1: Small Proposal (< $50,000)

1. Create a proposal with budget $30,000
2. Submit the proposal
3. Verify approval workflow created with 1 level (Fundraising Manager)
4. Fundraising Manager approves
5. Verify project is automatically created
6. Check proposal is linked to the new project

### Test Scenario 2: Medium Proposal ($50,000 - $100,000)

1. Create a proposal with budget $75,000
2. Submit the proposal
3. Verify approval workflow created with 2 levels
4. Fundraising Manager approves → moves to Director of Programmes
5. Director of Programmes approves
6. Verify project is automatically created

### Test Scenario 3: Large Proposal (> $100,000)

1. Create a proposal with budget $150,000
2. Submit the proposal
3. Verify approval workflow created with 3 levels
4. Fundraising Manager approves
5. Director of Programmes approves
6. CEO approves
7. Verify project is automatically created

### Test Scenario 4: Proposal Rejection

1. Create and submit a proposal
2. Fundraising Manager rejects with reason
3. Verify proposal status is "Rejected"
4. Verify rejection reason is stored
5. Verify no project is created

## Future Enhancements

### Phase 2: Implementation Approvals

- Multi-stage approvals during project implementation
- PM → PO → Finance approval chains for activities
- Budget change approvals
- Procurement approvals

### Phase 3: Project Completion Workflows

- Completion documentation requirements
- Automatic report generation on completion
- Project closure validation
- Lessons learned capture

### Phase 4: Advanced Features

- Approval delegation
- Approval reminders and notifications
- Workflow templates
- Custom approval chains per donor
- Conditional approval routing

## File Structure

```
src/
├── utils/
│   ├── workflowOrchestrator.js      # Core workflow logic
│   └── approvalWorkflow.js           # Approval workflow engine
├── contexts/
│   ├── ProposalsContext.jsx          # Enhanced with workflow methods
│   ├── ApprovalContext.jsx           # Enhanced with callbacks
│   └── ProjectContext.jsx            # Accepts automated creation
├── components/
│   └── workflow/
│       └── WorkflowIntegration.jsx   # Context wiring component
└── App.jsx                           # Includes WorkflowIntegration
```

## API Reference

### WorkflowOrchestrator Functions

#### `convertProposalToProject(proposal)`
Converts a proposal object to project data format.

**Parameters:**
- `proposal` (Object): The approved proposal object

**Returns:**
- (Object): Project data ready for creation

#### `createProposalApprovalWorkflow(proposal, currentUser)`
Creates approval workflow data for a proposal submission.

**Parameters:**
- `proposal` (Object): The proposal object
- `currentUser` (Object): Current user submitting the proposal

**Returns:**
- (Object): Approval creation parameters

#### `handleProposalApprovalComplete(workflow, createProjectCallback, updateProposalCallback)`
Handles the completion of a proposal approval workflow.

**Parameters:**
- `workflow` (Object): The completed approval workflow
- `createProjectCallback` (Function): Callback to create a project
- `updateProposalCallback` (Function): Callback to update proposal status

**Returns:**
- (Object): Result object with success status and created project info

### ProposalsContext Methods

#### `submitProposalForApproval(proposalId, currentUser, createApprovalCallback)`
Submits a proposal for approval and creates the approval workflow.

**Parameters:**
- `proposalId` (number): ID of the proposal to submit
- `currentUser` (Object): Current user submitting the proposal
- `createApprovalCallback` (Function): Optional callback to create approval workflow

**Returns:**
- (Object): Result with success status and approval data

### ApprovalContext Methods

#### `registerWorkflowCallbacks(callbacks)`
Registers callback functions for workflow completion handlers.

**Parameters:**
- `callbacks` (Object): Object containing callback functions
  - `createProject` (Function): Create project callback
  - `updateProposal` (Function): Update proposal callback
  - `updateProject` (Function): Update project callback
  - `updateTask` (Function): Update task callback

## Troubleshooting

### Workflow Not Creating Project

**Check:**
1. Verify WorkflowIntegration component is included in App.jsx
2. Check console for callback registration message: "🔗 Workflow integration initialized"
3. Verify all approval levels are completed
4. Check for error messages in console

### Callbacks Not Registered

**Solution:**
Ensure WorkflowIntegration is wrapped inside all required context providers:
- Must be inside ApprovalProvider
- Must be inside ProposalsProvider
- Must be inside ProjectProvider

### Project Created with Missing Data

**Check:**
1. Verify proposal has all required fields
2. Check workflowOrchestrator.js conversion mapping
3. Review console logs for conversion warnings

## Support

For issues or questions about the workflow implementation, please:
1. Check the console logs for detailed error messages
2. Review this documentation
3. Check the implementation files listed in the File Structure section
4. Contact the development team

---

**Last Updated:** January 2025
**Version:** 1.0.0
**Author:** Development Team
