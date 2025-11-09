# 📋 Proposal Form Integration Guide

## Global Ehsan Relief (GER) Proposal Form → GERSL CBO System Mapping

This document shows how the GER Project Proposal Form fields map to the GERSL CBO Proposal Management System.

---

## 🔗 **Form Section Mapping**

### **A. Project Identification**

| GER Form Field | GERSL System Field | Data Type | Notes |
|----------------|-------------------|-----------|-------|
| **Project Title** | `proposalTitle` | String | Main proposal title |
| **GER Country/Region** | `district` | String | Maps to Sri Lankan districts |
| **Implementing Partner(s)** | `cboName` | String | CBO organization name |
| **Proposed Start & End Date** | `duration` | String | Calculated from dates (e.g., "12 months") |
| **Total Project Budget** | `requestedBudget` | Number | Amount in LKR |
| **Donor / Funding Source** | `donorName` | String | Captured at donor approval stage |
| **Project Tier** | Custom field | String | Tier 1 (Comprehensive) or Tier 2 (Moderate) |
| **Sector/Theme** | `programmeArea` | String | Education, WASH, Seasonal Relief, Health, etc. |
| **Project Lead / Manager** | `submittedBy` | String | Person submitting proposal |
| **MEAL Focal Point** | `gerslFocalPerson` | String | Assigned during fundraising review |

---

### **B. Executive Summary**

| GER Form Field | GERSL System Field | Data Type | Notes |
|----------------|-------------------|-----------|-------|
| **The Problem** | Part of `summary` | String | Core issue description |
| **Our Solution** | Part of `summary` | String | Intervention approach |
| **Key Beneficiaries** | `targetBeneficiaries` | Number | Number of people reached |
| **Overall Goal** | `objectives[0]` | String | First objective (main goal) |
| **Full Summary** | `summary` | String | Complete 250-word overview |

---

### **C. Project Justification**

| GER Form Field | GERSL System Field | Data Type | Notes |
|----------------|-------------------|-----------|-------|
| **Problem Statement & Needs Assessment** | `summary` (extended) | String | Detailed problem context |
| **Project Rationale & Strategic Alignment** | Fundraising review notes | String | Captured during review |

---

## 📊 **Enhanced Proposal Data Structure**

To fully support the GER form, the GERSL system should include these additional fields:

```javascript
{
  // Existing fields
  id: 1,
  cboId: 1,
  cboName: "Kandy Community Development Association",
  proposalTitle: "Education Support for Vulnerable Children",
  programmeArea: "Education",
  submissionDate: "2024-10-15",
  submittedBy: "Sunil Bandara",
  submitterRole: "CBO Manager",
  requestedBudget: 2500000,
  duration: "12 months",
  targetBeneficiaries: 150,
  district: "Kandy",

  // NEW FIELDS from GER Form
  projectTier: "Tier 1", // or "Tier 2"
  sectorTheme: "Education", // matches programmeArea
  mealFocalPoint: "Thilini Silva", // MEAL person
  startDate: "2025-01-01",
  endDate: "2025-12-31",

  // Executive Summary breakdown
  problemStatement: "Low school attendance and poor learning outcomes...",
  proposedSolution: "Comprehensive education support program...",
  keyBeneficiariesDescription: "150 vulnerable children aged 6-14...",
  overallGoal: "Improve educational outcomes for vulnerable children",

  // Full proposal sections (if needed)
  needsAssessmentData: "Baseline survey shows 40% dropout rate...",
  strategicAlignment: "Aligns with GER Country Strategy 2024-2026...",

  // Existing workflow fields
  status: "Fundraising Review",
  workflowStage: "fundraising",
  fundraisingStatus: "Pending",
  ceoStatus: "Pending",
  donorStatus: "Pending",

  summary: "Proposal to provide educational materials, tutoring...",
  objectives: [
    "Improve school attendance by 25%",
    "Enhance learning outcomes through tutoring",
    "Provide school supplies to 150 children"
  ],
  keyActivities: [
    "Distribution of school supplies",
    "After-school tutoring program",
    "Parent engagement sessions"
  ],

  convertedToProject: false,
  projectId: null
}
```

---

## 🔄 **Proposal Submission Workflow**

### **Step 1: CBO/Staff Completes GER Form**

**User Interface**: Proposal submission form with all GER fields

**Fields to Complete**:
1. Project Identification (all fields)
2. Executive Summary (250 words)
3. Project Justification
4. Problem Statement
5. Strategic Alignment

**Action**: `addCBOProposal(proposalData)`

**Result**:
- Status: "Submitted"
- Workflow Stage: "fundraising"
- Assigned to Fundraising Manager

---

### **Step 2: Fundraising Manager Review**

**Reviewer**: Thilini Silva (Fundraising Manager)

**Review Criteria**:
- ✅ Budget reasonableness
- ✅ Strategic alignment with GER priorities
- ✅ M&E framework adequacy
- ✅ Sustainability plan
- ✅ CBO capacity (check Due Diligence score)

**Scoring**: 0-100 points

**Decision Options**:
1. **Approve** → `fundraisingApproveProposal(id, score, comments, reviewer)`
   - Score ≥70: Recommended for CEO
   - Comments: Technical feedback and recommendations

2. **Reject** → `fundraisingRejectProposal(id, score, comments, reviewer)`
   - Score <70: Needs revision
   - Comments: Specific areas for improvement

**Example Approval**:
```javascript
fundraisingApproveProposal(
  1, // proposal ID
  88, // score
  "Excellent proposal with clear objectives and strong M&E framework. Budget is reasonable for 12-month duration. Recommended for CEO approval.",
  "Thilini Silva"
);
```

---

### **Step 3: CEO Approval**

**Approver**: Kasun Perera (CEO)

**Review Focus**:
- ✅ Strategic fit with organizational priorities
- ✅ Budget availability
- ✅ Risk assessment
- ✅ Donor relationships

**Decision Options**:
1. **Approve** → `ceoApproveProposal(id, comments, approver, approvedBudget)`
2. **Reject** → `ceoRejectProposal(id, comments, approver)`

**Budget Adjustment**: CEO can approve different amount than requested

**Example Approval**:
```javascript
ceoApproveProposal(
  1,
  "Approved. Strategic fit with education portfolio. Budget adjusted due to current funding constraints.",
  "Kasun Perera",
  2200000 // approved (reduced from 2,500,000)
);
```

---

### **Step 4: Donor Approval**

**Donor**: External funding organization (e.g., UN Women, UNICEF, etc.)

**Process**:
- GERSL submits approved proposal to donor
- Donor reviews and makes funding decision

**Decision Options**:
1. **Approve** → `donorApproveProposal(id, donorName, approvedBudget)`
2. **Reject** → `donorRejectProposal(id, donorName)`

**Example Approval**:
```javascript
donorApproveProposal(
  1,
  "UNICEF Sri Lanka",
  2200000 // final approved budget
);
```

---

### **Step 5: Convert to Project**

**Trigger**: After donor approval

**Action**: `convertProposalToProject(proposalId)`

**Automatic Project Creation**:
```javascript
{
  id: 4,
  cboId: 1,
  cboName: "Kandy Community Development Association",
  projectTitle: "Education Support for Vulnerable Children",
  programmeArea: "Education",
  startDate: "2025-01-01", // from proposal
  endDate: "2025-12-31", // calculated from duration
  budget: 2200000, // donor-approved amount
  spent: 0,
  progress: 0,
  status: "Active",
  targetBeneficiaries: 150,
  actualBeneficiaries: 0,
  district: "Kandy",
  projectManager: "Sunil Bandara", // proposal submitter
  gerslFocalPerson: "Thilini Silva", // fundraising reviewer
  lastReportDate: null,
  nextReportDue: "2025-02-01",
  milestones: [
    { id: 1, name: "Project inception and setup", status: "Pending" },
    { id: 2, name: "Baseline survey completed", status: "Pending" },
    { id: 3, name: "Mid-term review", status: "Pending" },
    { id: 4, name: "Final evaluation", status: "Pending" }
  ],
  issues: []
}
```

---

## 📋 **GER Form Sections Not Yet in System**

The following GER form sections could be added as enhancements:

### **Additional Sections to Consider**:

1. **D. Target Beneficiaries**
   - Demographic breakdown
   - Vulnerability criteria
   - Selection methodology

2. **E. Project Objectives**
   - SMART objectives
   - Expected outcomes
   - Impact indicators

3. **F. Project Activities**
   - Detailed activity plan
   - Timeline/Gantt chart
   - Resource allocation

4. **G. Budget Breakdown**
   - Line-item budget
   - Cost per beneficiary
   - Co-funding details

5. **H. Monitoring & Evaluation**
   - Indicators and targets
   - Data collection methods
   - Reporting frequency

6. **I. Risk Management**
   - Risk matrix
   - Mitigation strategies
   - Contingency plans

7. **J. Sustainability**
   - Exit strategy
   - Handover plan
   - Long-term impact

8. **K. Safeguarding**
   - Child protection measures
   - Complaint mechanism
   - Do No Harm assessment

---

## 🎯 **Recommended System Enhancements**

### **1. Add Proposal Form Builder**

Create a comprehensive form in the CBO Proposals tab:

```javascript
<AddProposalForm>
  <Section id="project-identification">
    <Input name="projectTitle" required />
    <Select name="district" options={districts} />
    <Select name="cboName" options={cbos} />
    <DateRange name="projectDates" />
    <Input name="budget" type="number" />
    <Select name="projectTier" options={["Tier 1", "Tier 2"]} />
    <Select name="programmeArea" />
  </Section>

  <Section id="executive-summary">
    <TextArea name="summary" maxLength={250} />
    <TextArea name="problemStatement" />
    <TextArea name="proposedSolution" />
    <Input name="targetBeneficiaries" type="number" />
  </Section>

  <Section id="objectives">
    <DynamicList name="objectives" />
  </Section>

  <Section id="activities">
    <DynamicList name="keyActivities" />
  </Section>
</AddProposalForm>
```

---

### **2. Add Budget Breakdown Table**

Track detailed budget categories:

| Category | Amount (LKR) | % of Total |
|----------|-------------|------------|
| Personnel | 800,000 | 32% |
| Materials/Supplies | 600,000 | 24% |
| Training | 400,000 | 16% |
| M&E | 200,000 | 8% |
| Overhead (15%) | 500,000 | 20% |
| **Total** | **2,500,000** | **100%** |

---

### **3. Add Document Attachments**

Allow users to upload:
- ✅ Budget breakdown Excel
- ✅ Logical framework
- ✅ Risk matrix
- ✅ CBO registration certificate
- ✅ Recent audit report
- ✅ MOU with GERSL

---

### **4. Add Approval Comments Thread**

Show full approval history:

```
Fundraising Review - Thilini Silva - 2024-10-20
Score: 88/100
✓ Approved
"Excellent proposal with clear objectives and strong M&E framework..."

CEO Approval - Kasun Perera - 2024-10-25
✓ Approved (Budget adjusted to LKR 2,200,000)
"Strategic fit with education portfolio. Budget adjusted due to current funding constraints."

Donor Decision - UNICEF Sri Lanka - 2024-11-10
✓ Approved (Final budget: LKR 2,200,000)
"Approved for funding under Education in Emergencies program."
```

---

## 🔄 **Integration with Due Diligence**

Before proposal submission, system should check:

```javascript
const canSubmitProposal = (cboId) => {
  const assessment = dueDiligence.find(dd => dd.cboId === cboId);

  if (!assessment) {
    return {
      allowed: false,
      reason: "No due diligence assessment found. CBO must be assessed first."
    };
  }

  if (assessment.status !== 'Approved') {
    return {
      allowed: false,
      reason: "CBO due diligence not approved. Assessment status: " + assessment.status
    };
  }

  if (assessment.overallScore < 70) {
    return {
      allowed: false,
      reason: "CBO due diligence score too low. Minimum 70 required, current: " + assessment.overallScore
    };
  }

  // Check if assessment is still valid
  const validUntil = new Date(assessment.validUntil);
  const today = new Date();
  if (validUntil < today) {
    return {
      allowed: false,
      reason: "Due diligence assessment expired. Valid until: " + assessment.validUntil
    };
  }

  return {
    allowed: true,
    assessment: assessment
  };
};
```

---

## 📊 **Sample Complete Proposal**

```javascript
{
  // Basic Info
  id: 5,
  cboId: 1,
  cboName: "Kandy Community Development Association",
  proposalTitle: "Education Support for Vulnerable Children in Kandy District",

  // Project Details
  programmeArea: "Education",
  sectorTheme: "Education",
  projectTier: "Tier 1",
  district: "Kandy",
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  duration: "12 months",

  // Budget
  requestedBudget: 2500000,
  approvedBudget: 2200000,

  // Team
  submittedBy: "Sunil Bandara",
  submitterRole: "CBO Manager",
  submissionDate: "2024-10-15",

  // Beneficiaries
  targetBeneficiaries: 150,
  beneficiariesDescription: "Vulnerable children aged 6-14 from low-income families",

  // Executive Summary
  summary: "This project provides comprehensive education support to 150 vulnerable children in Kandy district through school supplies, tutoring, and scholarships. The intervention addresses high dropout rates and poor learning outcomes in marginalized communities.",

  problemStatement: "Baseline survey shows 40% dropout rate among vulnerable children due to lack of school materials, poor academic support, and financial constraints.",

  proposedSolution: "Multi-pronged approach combining material support, academic tutoring, parent engagement, and scholarships to address root causes of poor educational outcomes.",

  overallGoal: "Improve educational access, retention, and learning outcomes for vulnerable children in Kandy district",

  // Objectives
  objectives: [
    "Improve school attendance by 25% among target beneficiaries",
    "Enhance learning outcomes through after-school tutoring program",
    "Provide school supplies to 150 children",
    "Award scholarships to 20 most vulnerable children"
  ],

  // Activities
  keyActivities: [
    "Distribution of school supplies (backpacks, books, uniforms)",
    "After-school tutoring program (5 days/week)",
    "Parent engagement sessions (monthly)",
    "Scholarship provision for 20 children",
    "Baseline and endline assessments"
  ],

  // Workflow Status
  status: "Converted to Project",
  workflowStage: "converted",

  // Approvals
  fundraisingReviewer: "Thilini Silva",
  fundraisingReviewDate: "2024-10-20",
  fundraisingScore: 88,
  fundraisingComments: "Excellent proposal with clear objectives and strong M&E framework.",
  fundraisingStatus: "Approved",

  ceoApprover: "Kasun Perera",
  ceoApprovalDate: "2024-10-25",
  ceoComments: "Strategic fit. Budget adjusted.",
  ceoStatus: "Approved",

  donorName: "UNICEF Sri Lanka",
  donorApprovalDate: "2024-11-10",
  donorStatus: "Approved",

  // Conversion
  convertedToProject: true,
  projectId: 4,
  projectStartDate: "2025-01-01"
}
```

---

## ✅ **Implementation Checklist**

To fully integrate GER form with GERSL system:

- [x] Basic proposal structure
- [x] 4-stage approval workflow
- [x] Visual workflow display
- [x] Automatic project conversion
- [ ] Enhanced form fields (project tier, sector theme, etc.)
- [ ] Budget breakdown table
- [ ] Document attachments
- [ ] Approval comments thread
- [ ] Due diligence validation check
- [ ] M&E framework section
- [ ] Risk management section
- [ ] Sustainability plan section

---

**Created**: November 7, 2025
**Status**: ✅ Ready for Enhancement
**Next Steps**: Add enhanced form fields and validation

Made with ❤️ for GERSL
