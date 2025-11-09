# CBO PROPOSAL MANAGEMENT - VISUAL GAP ANALYSIS

## FEATURE MATRIX

```
FEATURE                          | IMPLEMENTED | MISSING | LOCATION/NOTES
================================|=============|=========|================
1. PROPOSAL CREATION
   - Add proposal form           |     ✓       |         | Lines 1554-2978
   - Form validation             |     ~       |    ✓    | Basic validation only
   - Draft save option           |             |    ✓    | Must submit fully
   
2. PROPOSAL DISPLAY
   - List view                   |     ✓       |         | Lines 732-1035
   - Card layout                 |     ✓       |         | Inline cards
   - Search capability           |     ✓       |         | Title & CBO name
   - Basic info display          |     ✓       |         | Title, CBO, date
   - Approval workflow display   |     ✓       |         | Visual timeline
   
3. PROPOSAL DETAILS
   - Detail modal                |             |    ✓    | CRITICAL GAP
   - Full proposal view          |     ~       |    ✓    | Inline only, can't focus
   - Print functionality         |             |    ✓    |
   - PDF export                  |             |    ✓    |
   
4. MEAL DATA CAPTURE
   - Results framework           |     ✓       |         | Lines 2320-2441
   - Beneficiary breakdown       |     ✓       |         | Lines 2443-2513
   - Theory of Change            |     ✓       |         | Lines 2515-2759
   - Budget breakdown            |     ✓       |         | Lines 2048-2195
   - Safeguarding compliance     |     ✓       |         | Lines 2761-2956
   
5. MEAL DATA DISPLAY
   - Results framework display   |             |    ✓    | CRITICAL GAP
   - Beneficiary breakdown view  |             |    ✓    | Only totals shown
   - Theory of Change display    |             |    ✓    | NOT VISIBLE
   - Budget details              |             |    ✓    | Only total shown
   - Safeguarding status         |             |    ✓    | NOT VISIBLE
   
6. PROPOSAL ACTIONS
   - View details                |     ~       |    ✓    | Inline only
   - Edit proposal               |             |    ✓    | No edit interface
   - Delete proposal             |             |    ✓    |
   - Approve proposal            |             |    ✓    | CRITICAL GAP
   - Reject proposal             |             |    ✓    | CRITICAL GAP
   - Resubmit after rejection    |             |    ✓    |
   
7. REVIEWER INTERFACE
   - Review form                 |             |    ✓    | CRITICAL GAP
   - Scoring/rating              |     ~       |    ✓    | Stored but no form
   - Comments input              |     ~       |    ✓    | Stored but no form
   - Assignment tracking         |             |    ✓    |
   - Feedback mechanism          |             |    ✓    |
   
8. CFM (COMMUNITY FEEDBACK)
   - CFM for proposals           |             |    ✓    | Only for projects
   - CFM button on proposal      |             |    ✓    |
   - Feedback log                |             |    ✓    |
   - Feedback resolution         |             |    ✓    |
   
9. FILTERING & SEARCH
   - Text search                 |     ✓       |         | Title & CBO
   - Filter by status            |             |    ✓    |
   - Filter by stage             |             |    ✓    | Fundraising/CEO/Donor
   - Filter by CBO               |             |    ✓    |
   - Filter by programme area    |             |    ✓    |
   - Date range filter           |             |    ✓    |
   - Budget range filter         |             |    ✓    |
   
10. BULK OPERATIONS
    - Multi-select               |             |    ✓    |
    - Batch approve/reject       |             |    ✓    |
    - Export selected            |             |    ✓    |
    - Generate report            |             |    ✓    |
    
11. PROPOSAL HISTORY
    - Version tracking           |             |    ✓    |
    - Change audit trail         |             |    ✓    |
    - Revision comments          |             |    ✓    |
    - Timeline view              |             |    ✓    |
    
12. ATTACHMENTS
    - Upload documents           |             |    ✓    |
    - Attach supporting files    |             |    ✓    |
    - View attachments           |             |    ✓    |
    - Evidence tracking          |             |    ✓    |

Legend: ✓ = Fully implemented, ~ = Partially implemented, (blank) = Not implemented
```

---

## WORKFLOW VISUALIZATION

### Current Workflow (Broken)
```
┌─────────────────────┐
│ CBO Creates         │
│ Proposal Form       │
│ (2320 lines!)       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Proposal Added to   │
│ ProposalsTab List   │
│ (Cards display)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ ??? MISSING ???     │  ← WHERE DO APPROVALS HAPPEN?
│ Reviewer Interface  │     No approve/reject buttons
│ Missing!            │     No review form
└──────────┬──────────┘     No scoring/comments
           │                No status change
           ▼
┌─────────────────────┐
│ Proposal Shows      │
│ Updated Status      │
│ (appears magically?)│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Convert to Project  │
│ (when donor        │
│  approves)          │
└─────────────────────┘
```

### What Should Exist
```
┌──────────────────────────────────────────────────────────┐
│ PROPOSAL LIFECYCLE                                       │
└──────────────────────────────────────────────────────────┘

CBO Side:
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │ Create Draft │────▶│ Submit       │────▶│ View Status  │
  │ (optional)   │     │ Proposal     │     │ & Feedback   │
  └──────────────┘     └──────────────┘     └──────────────┘

Fundraising Stage:
  ┌──────────────┐     ┌──────────────────────┐
  │ Proposal in  │────▶│ Fundraiser Reviews:  │
  │ Queue        │     │ - Reads proposal     │
  └──────────────┘     │ - Scores (1-100)     │
                       │ - Adds comments      │
                       │ - Approve/Reject     │
                       └──────────────────────┘

CEO Stage:
  ┌──────────────┐     ┌──────────────────────┐
  │ Approved by  │────▶│ CEO Reviews:         │
  │ Fundraising  │     │ - Checks strategy    │
  └──────────────┘     │ - Checks budget      │
                       │ - Approve/Reject     │
                       └──────────────────────┘

Donor Stage:
  ┌──────────────┐     ┌──────────────────────┐
  │ Approved by  │────▶│ Donor Reviews:       │
  │ CEO          │     │ - Final approval     │
  └──────────────┘     │ - Sets final budget  │
                       │ - Approve/Reject     │
                       └──────────────────────┘

Conversion:
  ┌──────────────┐     ┌──────────────────────┐
  │ Approved by  │────▶│ Convert to Project   │
  │ Donor        │     │ - Create project     │
  └──────────────┘     │ - Link resources     │
                       └──────────────────────┘
```

---

## DATA FLOW GAP

### Current: Form to Display Disconnect

```
ADD PROPOSAL FORM FIELDS              →    PROPOSAL DISPLAY FIELDS
(Captured & Stored)                         (Actually Shown)
================================            =========================

✓ Results Framework                    ✗    (hidden)
✓ Beneficiary Breakdown                ✗    (only totals: 150 beneficiaries)
✓ Theory of Change                     ✗    (hidden)
✓ Budget Breakdown (9 categories)      ✗    (only total: LKR 500,000)
✓ Safeguarding (6 checkboxes)          ✗    (hidden)
✓ 20+ GER fields                       ✓    (shown in card)
✓ Objectives array                     ✓    (shown as list)
✓ Key Activities array                 ✓    (shown as tags)
✓ Approval workflow fields             ✓    (shown as timeline)

IMPACT: User loses detailed MEAL data after submission!
DATA LOSS: Budget detail, beneficiary breakdown, theory of change
```

---

## MISSING INTERACTION PATTERNS

### Missing: Proposal Detail Modal (Should Follow Project CFM Pattern)

**For Projects (IMPLEMENTED):**
```javascript
// Line 1211
<button onClick={() => handleOpenCFM(project)} className="...">
  <MessageSquare size={16} />
  Community Feedback & Complaints ({project.cfmLog?.length || 0})
</button>

// Lines 1230-1236
{showCFMModal && selectedProject && (
  <CFMModal
    project={selectedProject}
    onClose={handleCloseCFM}
    addCFMFeedback={addCFMFeedback}
    resolveCFMFeedback={resolveCFMFeedback}
  />
)}
```

**For Proposals (MISSING):**
```javascript
// Should exist but doesn't:
<button onClick={() => handleViewProposal(proposal)} className="...">
  <FileText size={16} />
  View Full Proposal
</button>

// Should exist but doesn't:
{showProposalDetailModal && selectedProposal && (
  <ProposalDetailModal
    proposal={selectedProposal}
    onClose={handleCloseProposalDetail}
    onApprove={handleApproveProposal}
    onReject={handleRejectProposal}
  />
)}
```

---

## MISSING STATE & HANDLERS

### State Hooks Needed:
```javascript
// In CBOPage component (line 54-57):
const [activeTab, setActiveTab] = useState('cbos');
const [searchTerm, setSearchTerm] = useState('');
const [filterDistrict, setFilterDistrict] = useState('All');
const [showAddModal, setShowAddModal] = useState(false);

// MISSING - needed for proposal management:
const [selectedProposal, setSelectedProposal] = useState(null);
const [showProposalDetailModal, setShowProposalDetailModal] = useState(false);
const [proposalBeingReviewed, setProposalBeingReviewed] = useState(null);
const [reviewForm, setReviewForm] = useState({
  status: 'Pending',
  score: '',
  comments: '',
  approvedBudget: ''
});
```

### Handler Functions Needed:
```javascript
// MISSING in CBOPage:

// View/Detail
const handleViewProposal = (proposal) => {
  setSelectedProposal(proposal);
  setShowProposalDetailModal(true);
};

// Approve
const handleApproveProposal = (proposalId, stage, reviewData) => {
  // Update proposal status for the stage
  // Save reviewer info, score, comments
  // Move to next stage
};

// Reject
const handleRejectProposal = (proposalId, stage, reason) => {
  // Update proposal status to 'Rejected'
  // Save rejection reason
  // Notify CBO
};

// Edit
const handleEditProposal = (proposalId) => {
  // Open edit form with proposal data
  // Allow updating all fields
};

// Delete
const handleDeleteProposal = (proposalId) => {
  // Remove proposal from list
  // Keep audit trail
};
```

---

## CONTEXTUAL COMPARISON

### Projects Tab Features (Already Built)
```
✓ CFM Modal                    (Lines 1242-1439)
✓ Feedback logging             (Shows cfmLog count)
✓ Feedback resolution          (Prompts for action taken)
✓ Severity tracking            (High/Medium/Low)
✓ Multiple feedback types      (Complaint/Suggestion/Positive/Query)
✓ Feedback channels            (Hotline, WhatsApp, Email, etc.)
✓ Status transitions           (Open → Resolved)
✓ Action buttons               (Line 1210 "Community Feedback" button)
```

### What Proposals Need (Doesn't Have Projects)
```
✓ Multi-stage approval         (Fundraising → CEO → Donor)
✓ MEAL data capture            (Results, beneficiary, ToC, budget)
✓ Safeguarding compliance      (6 checkboxes + focal person)
✓ Standard indicator bank      (getIndicatorsForProgramme)
✓ Theory of Change mapping     (Inputs → Activities → Outputs → Outcomes → Impact)
✓ Tier-based requirements      (Tier 1/2/3 validation)

✗ Reviewer interface           (MISSING - no approve/reject UI)
✗ Detail modal                 (MISSING - can't focus view)
✗ Action buttons               (MISSING - no approval buttons)
✗ MEAL display                 (MISSING - data hidden)
```

---

## SEVERITY ASSESSMENT

### CRITICAL (Blocks Functionality)
- [ ] No approval buttons (how do reviewers approve?)
- [ ] No detail modal (can't focus on single proposal)
- [ ] No review interface (no form to capture scores/comments)
- [ ] MEAL data hidden (budget breakdown, results framework, etc.)

### HIGH (Major UX Issues)
- [ ] No edit capability
- [ ] No advanced filtering
- [ ] No CFM for proposals
- [ ] No approval feedback to CBO

### MEDIUM (Enhancement)
- [ ] No bulk operations
- [ ] No audit trail
- [ ] No export/print
- [ ] No version history

### LOW (Nice to Have)
- [ ] Dashboard metrics
- [ ] Notification system
- [ ] Template library
- [ ] Proposal comparison

---

## ESTIMATED EFFORT

| Feature | Priority | Effort | Dependencies |
|---------|----------|--------|--------------|
| Detail Modal | CRITICAL | 2-3 days | CFMModal pattern |
| Approve/Reject Buttons | CRITICAL | 2-3 days | Detail modal, handlers |
| Display MEAL Data | CRITICAL | 3-5 days | Extract from proposal |
| Review Interface | CRITICAL | 3-5 days | Form state, handlers |
| Advanced Filtering | HIGH | 2-3 days | Search component |
| CFM for Proposals | HIGH | 3-4 days | Clone from projects |
| Edit Capability | HIGH | 3-5 days | Form handling, validation |
| Bulk Operations | MEDIUM | 2-3 days | Multi-select component |
| Audit Trail | MEDIUM | 2-3 days | Change tracking |
| Export/Print | MEDIUM | 2-3 days | PDF library |

**Total Estimated: 24-40 development days**

---

## FILE REFERENCES

### Lines to Review:
- **1047-1055**: handleOpenCFM pattern (use as template)
- **1210-1216**: CFM button implementation (model for approval buttons)
- **1230-1236**: Modal usage pattern
- **1242-1439**: CFMModal component (detailed implementation reference)
- **732-1035**: ProposalsTab (where to add improvements)
- **764**: Proposal card start (where to add buttons)
- **1024**: Proposal card end (where buttons could go)
- **1554-2978**: AddProposalModal (shows all MEAL data captured)

---

**End of Visual Analysis**
