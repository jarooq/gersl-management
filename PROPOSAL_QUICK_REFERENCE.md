# PROPOSAL MANAGEMENT SYSTEM - QUICK REFERENCE GUIDE

## Overview
**Status:** Partially implemented - Missing proposal management interface
**File:** `src/pages/CBO/CBOPage.jsx` (2,980 lines)
**Components:** ProposalsTab (732-1035), AddProposalModal (1554-2978)

---

## What's Working (8/12)

| Feature | Status | Location |
|---------|--------|----------|
| Add Proposal Form | ✓ Complete | Lines 1554-2978 |
| Proposal List/Cards | ✓ Complete | Lines 732-1035 |
| Search Proposals | ✓ Complete | Title & CBO name |
| Approval Workflow Display | ✓ Visual | Lines 911-1017 |
| MEAL Data Capture | ✓ Complete | Lines 2320-2956 |
| GER Details Display | ✓ Shows | Lines 796-864 |
| Status Tracking | ✓ Shows | Lines 920-1007 |
| Safeguarding Capture | ✓ Complete | Lines 2761-2956 |

---

## What's Missing (4/12) - CRITICAL GAPS

| Feature | Status | Impact |
|---------|--------|--------|
| Proposal Approval UI | ✗ MISSING | Cannot approve proposals |
| Detail Modal | ✗ MISSING | Cannot focus on single proposal |
| MEAL Data Display | ✗ MISSING | Budget breakdown, theory of change hidden |
| Reviewer Interface | ✗ MISSING | No way to score/comment/approve |

---

## Quick Facts

**Proposals Displayed As:**
- Inline cards (all data on one card)
- Cannot be opened in modal/detail view
- Search works on: proposal title, CBO name
- No other filtering options

**MEAL Data Captured:**
- Results Framework (indicators, baselines, targets)
- Beneficiary Breakdown (male, female, children, PWD, indirect)
- Theory of Change (inputs → activities → outputs → outcomes → impact)
- Budget Breakdown (9 categories with qty × unit cost)
- Safeguarding (6 compliance checkboxes + focal person)

**MEAL Data Displayed:**
- Results Framework: ✗ NOT SHOWN
- Beneficiary Breakdown: ✗ Only totals shown
- Theory of Change: ✗ NOT SHOWN
- Budget Breakdown: ✗ Only total shown
- Safeguarding: ✗ NOT SHOWN

---

## Key Line Numbers for Development

| Section | Lines | Purpose |
|---------|-------|---------|
| Main CBOPage | 35-215 | Container, state, tabs |
| ProposalsTab | 732-1035 | Proposal list display |
| CFMModal (Reference) | 1242-1439 | Use as modal template |
| AddProposalModal | 1554-2978 | Form with all MEAL data |
| Results Framework Form | 2320-2441 | Indicator capture |
| Beneficiary Form | 2443-2513 | Breakdown capture |
| Theory of Change Form | 2515-2759 | ToC mapping |
| Budget Form | 2048-2195 | Line items |
| Safeguarding Form | 2761-2956 | Compliance checklist |

---

## What to Build First (Implementation Roadmap)

### Phase 1: Core Proposal Management (1 week)
1. **ProposalDetailModal Component** (Reference: CFMModal lines 1242-1439)
   - Modal structure with header, tabs, body
   - Display all proposal data
   - Include action buttons

2. **Add State & Handlers**
   - `selectedProposal` state
   - `showProposalDetailModal` state
   - `handleViewProposal()`, `handleApproveProposal()`, `handleRejectProposal()`

3. **Add Action Buttons to Cards**
   - "View Full Proposal" button on each card
   - Opens ProposalDetailModal

### Phase 2: Approval Interface (1 week)
4. **Review/Approval Form**
   - Score/rating input
   - Comments textarea
   - Approve/Reject/Pending radio buttons
   - Approved budget field

5. **Display MEAL Data in Modal**
   - Collapsible Results Framework section
   - Beneficiary Breakdown table
   - Theory of Change diagram
   - Budget Details table

### Phase 3: Enhancements (2-3 weeks)
6. **Advanced Filtering**
7. **Edit Capability**
8. **CFM for Proposals**
9. **Export/Print**

---

## Code Patterns to Use

### Modal Pattern (From CFMModal)
```javascript
// State
const [showProposalDetailModal, setShowProposalDetailModal] = useState(false);
const [selectedProposal, setSelectedProposal] = useState(null);

// Handler
const handleViewProposal = (proposal) => {
  setSelectedProposal(proposal);
  setShowProposalDetailModal(true);
};

// Usage
{showProposalDetailModal && selectedProposal && (
  <ProposalDetailModal
    proposal={selectedProposal}
    onClose={() => setShowProposalDetailModal(false)}
  />
)}
```

### Action Button Pattern (From Projects)
```javascript
// Line 1210-1216 reference
<button
  onClick={() => handleViewProposal(proposal)}
  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  <FileText size={16} />
  View Full Proposal
</button>
```

---

## Data Structure (Proposal Object)

```javascript
{
  // Basic
  id, cboId, cboName, proposalTitle, status,
  
  // GER Fields
  projectTier, sectorTheme, startDate, endDate,
  overallGoal, problemStatement, proposedSolution,
  
  // Content
  objectives[], keyActivities[], summary,
  requestedBudget, duration, targetBeneficiaries,
  
  // MEAL (Captured but not displayed)
  resultsFramework[],
  beneficiaryBreakdown{},
  theoryOfChange{},
  budgetBreakdown[],
  safeguarding{},
  
  // Workflow
  workflowStage, fundraisingStatus, ceoStatus, donorStatus,
  fundraisingReviewer, ceoApprover, donorName,
  fundraisingScore, approvedBudget, ceoComments,
  
  // Metadata
  submissionDate, submittedBy, submitterRole,
  convertedToProject, projectId
}
```

---

## Component Hierarchy (Current)

```
CBOPage
├── Tabs: CBOs, Volunteers, Activities, DueDiligence, Proposals, Projects
│
├── ProposalsTab
│   └── Proposal Cards (inline display)
│       ├── Header (title, CBO, status)
│       ├── GER Details
│       ├── Budget & Beneficiaries
│       ├── Objectives & Activities
│       └── Workflow Visualization
│
└── AddProposalModal (for creating new proposals)
    ├── Basic Information
    ├── GER Fields
    ├── Results Framework
    ├── Beneficiary Breakdown
    ├── Theory of Change
    ├── Budget Breakdown
    └── Safeguarding Compliance
```

## Component Hierarchy (Needed)

```
CBOPage
├── ProposalsTab
│   ├── Proposal Cards
│   │   └── "View Full Proposal" button
│   │
│   └── ProposalDetailModal *** NEW ***
│       ├── Full Proposal Display
│       ├── MEAL Sections (collapsible)
│       └── Action Buttons (Approve, Reject, Edit)
│
└── ProposalReviewForm *** NEW ***
    ├── Score/Rating
    ├── Comments
    └── Approve/Reject Decision
```

---

## Missing Handler Functions

```javascript
// Add these to CBOPage component:

const handleViewProposal = (proposal) => {
  setSelectedProposal(proposal);
  setShowProposalDetailModal(true);
};

const handleApproveProposal = (proposalId, stage, reviewData) => {
  // Update proposal status
  // Save reviewer info, score, comments
  // Move to next stage
};

const handleRejectProposal = (proposalId, stage, reason) => {
  // Update proposal status to Rejected
  // Save rejection reason
};

const handleEditProposal = (proposalId) => {
  // Open AddProposalModal with proposal data
};

const handleDeleteProposal = (proposalId) => {
  // Remove from proposals list
};
```

---

## Testing Checklist

After implementing ProposalDetailModal:
- [ ] Click "View Full Proposal" button
- [ ] Modal opens with full proposal
- [ ] Can scroll through all sections
- [ ] Modal closes properly
- [ ] MEAL data displays correctly
- [ ] Workflow visualization shows
- [ ] Action buttons visible

After implementing approval interface:
- [ ] Can score proposal (0-100)
- [ ] Can enter comments
- [ ] Can select Approve/Reject
- [ ] Can set approved budget
- [ ] Approval saves to proposal
- [ ] Status updates in list

---

## Estimated Development Time

| Task | Days | Difficulty |
|------|------|-----------|
| ProposalDetailModal | 2-3 | Medium |
| State & Handlers | 1-2 | Easy |
| Approval Form | 2-3 | Medium |
| Display MEAL Data | 3-5 | Medium-Hard |
| Advanced Filtering | 2-3 | Easy |
| CFM for Proposals | 3-4 | Medium |
| Edit Capability | 3-5 | Medium |
| **TOTAL** | **24-40** | |

---

## Files to Modify

- `src/pages/CBO/CBOPage.jsx` (add state, handlers, modal, components)

## Files to Create

- `src/components/ProposalDetailModal.jsx` (new)
- `src/components/ProposalReviewForm.jsx` (new)
- `src/components/MEALDataDisplay.jsx` (new - optional)

---

## Key References in Code

- **CFMModal Pattern:** Lines 1242-1439 (use for ProposalDetailModal)
- **Project CFM Button:** Lines 1210-1216 (model for approval buttons)
- **MEAL Form Fields:** Lines 2320-2956 (reference for display)
- **Proposal Display:** Lines 796-864 (what's currently shown)
- **Workflow Display:** Lines 911-1017 (visual to maintain)

---

## Critical Question to Answer

**"Where do reviewers currently approve proposals?"**

The proposal object shows approval data (reviewer names, scores, comments, dates) 
but there's no UI to capture this information. This is the biggest gap.

The workflow display at lines 911-957 shows the four stages 
(Fundraising → CEO → Donor → Project) but there are no buttons to actually 
trigger these transitions or capture the review decisions.

---

## Success Criteria

System will be complete when:
1. ✓ Can view full proposal in modal/focused view
2. ✓ Can approve proposal with score and comments
3. ✓ Can reject proposal with reason
4. ✓ Can see all MEAL data (budget, results, theory of change)
5. ✓ Can edit proposal (for CBOs)
6. ✓ Can filter by status/stage
7. ✓ Can track approval history

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-07  
**Status:** Ready for Development
