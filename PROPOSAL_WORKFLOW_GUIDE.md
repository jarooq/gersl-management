# Proposal Approval Workflow Implementation

## Current State
- Proposals can be created with status "Draft"
- Only "Convert to Project" button exists (should only be available for approved proposals)
- No approval workflow buttons

## Required Workflow

### 1. Proposal Status Flow
```
Draft → Submitted → Under Review → Approved/Rejected → (if Approved) → Submitted to Donor → Donor Approved → Convert to Project
```

### 2. Status Definitions
| Status | Description | Who Can Set |
|--------|-------------|-------------|
| **Draft** | Initial creation, still being edited | System (default) |
| **Submitted** | Submitted for CEO approval | Proposal Creator |
| **Under Review** | CEO is reviewing | CEO |
| **Approved** | CEO approved | CEO |
| **Rejected** | CEO rejected | CEO |
| **Submitted to Donor** | Sent to donor for decision | Fundraising Manager |
| **Donor Approved** | Donor accepted proposal | Fundraising Manager |
| **Donor Rejected** | Donor rejected proposal | Fundraising Manager |

### 3. Workflow Actions by Role

#### Staff (Proposal Creator)
- **When status = "Draft":**
  - [Submit for CEO Approval] button → Changes status to "Submitted"

#### CEO
- **When status = "Submitted" or "Under Review":**
  - [Set Under Review] button → Changes status to "Under Review"
  - [Approve] button → Changes status to "Approved"
  - [Reject] button → Changes status to "Rejected" (with optional rejection reason)

#### Fundraising Manager
- **When status = "Approved":**
  - [Submit to Donor] button → Changes status to "Submitted to Donor"

- **When status = "Submitted to Donor":**
  - [Mark Donor Approved] button → Changes status to "Donor Approved"
  - [Mark Donor Rejected] button → Changes status to "Donor Rejected"

- **When status = "Donor Approved":**
  - [Convert to Project] button → Creates project from proposal

### 4. Permission Rules
```javascript
// Staff can submit their own proposals
if (proposal.createdBy === currentUser.id && proposal.status === 'Draft') {
  showSubmitButton = true;
}

// CEO can review/approve/reject
if (currentUser.role === 'CEO' && ['Submitted', 'Under Review'].includes(proposal.status)) {
  showReviewButtons = true;
}

// Fundraising Manager can manage donor submission
if (currentUser.role === 'Fundraising Manager' && ['Approved', 'Submitted to Donor'].includes(proposal.status)) {
  showDonorButtons = true;
}

// Only Fundraising Manager can convert approved proposals to projects
if (currentUser.role === 'Fundraising Manager' && proposal.status === 'Donor Approved') {
  showConvertButton = true;
}
```

### 5. UI Components Needed

#### Workflow Action Buttons (in ProposalViewModal)
Location: Below the proposal details, above footer

```jsx
{/* Workflow Actions */}
<div className="border-t border-gray-200 p-6 bg-gray-50">
  <h3 className="text-lg font-semibold mb-4">Workflow Actions</h3>

  {/* Staff: Submit for Approval */}
  {canSubmitForApproval && (
    <button onClick={handleSubmitForApproval}>
      Submit for CEO Approval
    </button>
  )}

  {/* CEO: Review Actions */}
  {canReview && (
    <>
      <button onClick={() => handleStatusChange('Under Review')}>
        Set Under Review
      </button>
      <button onClick={handleApprove}>
        Approve Proposal
      </button>
      <button onClick={handleReject}>
        Reject Proposal
      </button>
    </>
  )}

  {/* Fundraising Manager: Donor Actions */}
  {canSubmitToDonor && (
    <button onClick={handleSubmitToDonor}>
      Submit to Donor
    </button>
  )}

  {canMarkDonorDecision && (
    <>
      <button onClick={handleDonorApproved}>
        Mark Donor Approved
      </button>
      <button onClick={handleDonorRejected}>
        Mark Donor Rejected
      </button>
    </>
  )}

  {/* Fundraising Manager: Convert to Project */}
  {canConvertToProject && (
    <button onClick={handleConvertToProject}>
      Convert to Project
    </button>
  )}
</div>
```

### 6. API Integration

#### Update Proposal Status
```javascript
// PATCH /api/proposals/:id/status
const updateProposalStatus = async (proposalId, newStatus, comments = '') => {
  const response = await fetch(`/api/proposals/${proposalId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      status: newStatus,
      comments: comments
    })
  });
  return response.json();
};
```

### 7. Database Fields Needed

Check if these exist in Proposal model:
- `status` (ENUM) ✅ Already exists
- `submittedBy` - User who submitted
- `submittedAt` - Date submitted
- `reviewedBy` - CEO who reviewed
- `reviewedAt` - Date reviewed
- `approvalComments` - CEO comments
- `rejectionReason` - Why rejected
- `donorSubmittedBy` - Who submitted to donor
- `donorSubmittedAt` - When submitted to donor
- `donorDecisionBy` - Who marked donor decision
- `donorDecisionAt` - When donor decided
- `donorComments` - Donor feedback

### 8. Next Steps

1. ✅ Backend has `PATCH /:id/status` route
2. ⏳ Add workflow action buttons to ProposalViewModal
3. ⏳ Implement permission checks based on user role
4. ⏳ Add API calls for status changes
5. ⏳ Add comments/notes fields for approvals/rejections
6. ⏳ Update proposal list to show current status
7. ⏳ Add status filters in proposals page
8. ⏳ Add email notifications for status changes (future)

---

## Implementation Priority

**Phase 1: Essential Workflow (Current Session)**
- Add "Submit for CEO Approval" button for Draft proposals
- Add CEO approval/rejection buttons
- Add "Submit to Donor" and donor decision buttons
- Move "Convert to Project" to only show for Donor Approved status

**Phase 2: Enhanced Features (Future)**
- Add comments/notes for each status change
- Add approval history timeline
- Add email notifications
- Add bulk approval capabilities
- Add approval reports/analytics

