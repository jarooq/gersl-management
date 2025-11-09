# 📊 MEAL Framework Integration Guide
## GERSL CBO Management System - Complete Implementation

**Document Version**: 1.0
**Date**: November 7, 2025
**Integration Status**: 🔄 In Progress

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [MEAL Document Analysis](#meal-document-analysis)
3. [System Integration Plan](#system-integration-plan)
4. [Enhanced Data Models](#enhanced-data-models)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Testing & Validation](#testing--validation)

---

## 1. Overview

This document guides the integration of the Global Ehsan Relief (GER) MEAL framework into the GERSL CBO Management System based on the comprehensive MEAL Document PDF.

### Key MEAL Components

- **Annex A**: Standard Indicator Bank
- **Annex B**: Safeguarding & Data Protection
- **Annex C/C-Lite**: Proposal Forms (Tier 1-2 / Tier 3)
- **Annex D/D-Lite**: Project Completion Reports
- **Annex E/E-Lite**: Deployment & Field Monitoring

---

## 2. MEAL Document Analysis

### 2.1 Project Tier System

| Tier | Description | Budget Threshold | MEAL Requirements |
|------|-------------|------------------|-------------------|
| **Tier 1** | Comprehensive projects | >£25k | All indicators, full M&E, quarterly DQA |
| **Tier 2** | Moderate projects | £10k-£25k | Core indicators, semi-annual DQA |
| **Tier 3** | Lean/seasonal projects | <£10k | Minimum indicators, basic monitoring |

### 2.2 Standard Indicator Categories

1. **Activity Indicators** (What we do)
   - Home/school visits conducted
   - Training sessions held
   - Distribution events completed

2. **Output Indicators** (What we deliver)
   - # children sponsored
   - # households reached
   - # water points constructed

3. **Outcome Indicators** (What changes)
   - School attendance rate
   - % beneficiaries reporting improved well-being
   - % water points functional after 12 months

4. **Cost-Effectiveness Indicators**
   - Cost per sponsored child
   - Cost per beneficiary served
   - Cost per household reached

5. **Accountability Indicators**
   - % complaints resolved within SLA
   - # feedback cases logged & addressed

### 2.3 Programme Areas with Standard Indicators

1. Orphan Sponsorship
2. Seasonal Relief (Food/Qurban/Winter Aid)
3. WASH / Clean Water Projects
4. Education Support
5. Livelihoods / Economic Empowerment
6. Mosques / Waqf Projects
7. Refugee Relief / Emergency Response

---

## 3. System Integration Plan

### 3.1 Enhanced Proposal Data Model

```javascript
{
  // EXISTING FIELDS
  id, cboId, cboName, proposalTitle, programmeArea, submissionDate,
  submittedBy, requestedBudget, duration, targetBeneficiaries, district,

  // TIER CLASSIFICATION
  projectTier: 'Tier 1' | 'Tier 2' | 'Tier 3',

  // GER PROPOSAL FORM FIELDS (Annex C)
  // A. Project Identification
  gerCountryRegion: 'Sri Lanka',
  implementingPartner: 'CBO Name',
  proposedStartDate: '2025-01-01',
  proposedEndDate: '2025-12-31',
  totalProjectBudget: 2500000,
  donorFundingSource: 'UNICEF',
  sectorTheme: 'Education',
  projectLead: 'Name',
  mealFocalPoint: 'MEAL Officer',

  // B. Executive Summary
  problemStatement: 'The core issue...',
  proposedSolution: 'Our intervention...',
  keyBeneficiariesDescription: '150 vulnerable children...',
  overallGoal: 'Improve educational outcomes...',
  summary: 'Full 250-word summary',

  // C. Project Justification
  needsAssessmentData: 'Baseline survey shows...',
  strategicAlignment: 'Aligns with GER Strategy...',

  // D. Theory of Change
  theoryOfChange: {
    inputs: ['Budget', 'Staff', 'Materials'],
    activities: ['Train teachers', 'Distribute supplies'],
    outputs: ['50 teachers trained', '300 kits distributed'],
    outcomes: ['Improved learning outcomes'],
    impact: ['Better educational access']
  },

  // E. Results Framework
  resultsFramework: [
    {
      level: 'Activity',
      indicator: '# school visits conducted',
      definition: 'Visits to schools to verify enrollment',
      baseline: 0,
      target: 12,
      actualAchieved: null,
      meansOfVerification: 'Visit log, photos',
      disaggregation: 'Country',
      tier: '1-3'
    },
    {
      level: 'Output',
      indicator: '# children receiving school kits',
      definition: 'Total children supported during year',
      baseline: 0,
      target: 150,
      actualAchieved: null,
      meansOfVerification: 'Distribution list',
      disaggregation: 'Gender, grade, country',
      tier: '1-3'
    },
    {
      level: 'Outcome',
      indicator: '% children retained in school 12 months',
      definition: '(Still enrolled ÷ total supported) × 100',
      baseline: 60,
      target: 85,
      actualAchieved: null,
      meansOfVerification: 'School records',
      disaggregation: 'Gender, grade',
      tier: '1-2'
    }
  ],

  // F. Target Beneficiaries (Disaggregated)
  beneficiaryBreakdown: {
    directMale: 75,
    directFemale: 75,
    directChildren: 150,
    directPWD: 20,
    indirectMale: 50,
    indirectFemale: 50,
    indirectChildren: 100,
    indirectPWD: 10,
    total: 250
  },

  // G. Implementation Plan & Timeline
  implementationPlan: [
    {
      activity: 'Beneficiary registration',
      responsible: 'Field Officers',
      startDate: '2025-01-15',
      endDate: '2025-02-15',
      status: 'Pending'
    }
  ],

  // H. Accountability & Safeguarding
  cfmChannels: ['Hotline', 'WhatsApp', 'Complaint Boxes'],
  safeguardingFocalPoint: 'Name',
  safeguardingFocalContact: '+94 XXX',
  dataProtectionCompliance: true,
  consentFormsRequired: true,

  // I. Risk Analysis
  risks: [
    {
      risk: 'Supply chain delays',
      likelihood: 'Medium',
      impact: 'High',
      mitigation: 'Pre-position materials; backup suppliers'
    }
  ],

  // J. M&E Plan
  mealPlan: [
    {
      whatToMonitor: 'Activity completion',
      how: 'Field visit reports',
      frequency: 'Monthly',
      responsible: 'Project Manager'
    }
  ],

  // K. Budget Summary
  budgetBreakdown: [
    { category: 'Personnel', amount: 800000, percentage: 32 },
    { category: 'Materials', amount: 600000, percentage: 24 },
    { category: 'MEAL Activities', amount: 250000, percentage: 10 },
    { category: 'Overheads', amount: 500000, percentage: 20 },
    { category: 'Contingency', amount: 350000, percentage: 14 }
  ],
  costPerBeneficiary: 16667, // Total budget ÷ beneficiaries

  // WORKFLOW STATUS
  status: 'Submitted',
  workflowStage: 'fundraising',
  fundraisingStatus: 'Pending',
  fundraisingReviewer: null,
  fundraisingScore: null,
  fundraisingComments: null,
  ceoStatus: 'Pending',
  donorStatus: 'Pending',

  // PROJECT CONVERSION
  convertedToProject: false,
  projectId: null
}
```

### 3.2 Enhanced Project Data Model

```javascript
{
  // EXISTING FIELDS
  id, cboId, cboName, projectTitle, programmeArea, startDate, endDate,
  budget, spent, progress, status, targetBeneficiaries, actualBeneficiaries,
  district, projectManager, gerslFocalPerson,

  // MEAL INTEGRATION
  projectTier: 'Tier 1',

  // FIELD MONITORING DATA
  fieldMonitoring: [
    {
      date: '2025-01-15',
      location: 'Kandy School A',
      monitoringOfficer: 'Field MEAL Officer',
      activitiesConducted: [...],
      outputsDelivered: [...],
      feedbackReceived: [...],
      safeguardingObservation: 'No concerns',
      lessonsLearned: [...],
      evidence: ['photos', 'distribution lists', 'receipts']
    }
  ],

  // COMMUNITY FEEDBACK MECHANISM
  cfmLog: [
    {
      date: '2025-01-20',
      source: 'Community Meeting',
      feedbackType: 'Positive',
      summary: 'Grateful for school supplies',
      category: 'Positive Feedback',
      actionTaken: 'Shared thanks with team & donors',
      responsiblePerson: 'Project Manager',
      dateResolved: '2025-01-20'
    },
    {
      date: '2025-01-22',
      source: 'Hotline',
      feedbackType: 'Complaint',
      summary: 'Missing stipend payment',
      category: 'Complaint',
      actionTaken: 'Investigated & payment issued',
      responsiblePerson: 'Finance Officer',
      dateResolved: '2025-01-25'
    }
  ],

  // LEARNING & ADAPTATION
  learningLog: [
    {
      insight: 'Pre-registering beneficiaries reduces queues',
      identifiedHow: 'Observation from distribution',
      adaptationAction: 'Implement pre-registration for all future distributions',
      responsiblePerson: 'Programme Officer',
      deadline: '2025-02-01',
      status: 'In Progress'
    }
  ],

  // INDICATOR TRACKING
  indicatorProgress: [
    {
      indicator: '# school visits conducted',
      baseline: 0,
      target: 12,
      q1Actual: 3,
      q2Actual: 3,
      q3Actual: null,
      q4Actual: null,
      percentageAchieved: 50,
      status: 'On Track'
    }
  ],

  // SAFEGUARDING
  safeguardingIncidents: [],
  safeguardingTrainingCompleted: true,

  // PROJECT COMPLETION DATA
  completionReport: {
    completionDate: null,
    finalBudgetSpent: null,
    finalBeneficiariesReached: null,
    indicatorsAchieved: [],
    lessonsLearned: [],
    recommendations: [],
    sustainabilityPlan: '',
    scalingPotential: ''
  }
}
```

---

## 4. Enhanced Data Models

### 4.1 Standard Indicator Bank (Annex A)

```javascript
const STANDARD_INDICATORS = {
  'Orphan Sponsorship': {
    activities: [
      {
        indicator: '# home or school visits conducted',
        definition: 'Number of scheduled monitoring or follow-up visits completed',
        formula: 'Count of visits',
        disaggregation: 'Country',
        mov: 'Visit log, photo evidence',
        tier: [1, 2, 3]
      },
      {
        indicator: '% scheduled disbursements completed on time',
        definition: '(On-time payments ÷ total scheduled) × 100',
        formula: '(OnTime / Total) * 100',
        disaggregation: 'Country',
        mov: 'Finance log',
        tier: [1, 2]
      }
    ],
    outputs: [
      {
        indicator: '# children sponsored',
        definition: 'Total children receiving active sponsorship',
        formula: 'Count of active sponsorships',
        disaggregation: 'Gender, age-band, country',
        mov: 'Sponsorship register, payment list',
        tier: [1, 2, 3]
      }
    ],
    outcomes: [
      {
        indicator: 'School attendance rate',
        definition: '(Children attending ≥ 90% of school days ÷ eligible) × 100',
        formula: '(Attending / Eligible) * 100',
        disaggregation: 'Gender, country',
        mov: 'School verification forms',
        tier: [1, 2]
      }
    ],
    costEffectiveness: [
      {
        indicator: 'Cost per sponsored child',
        definition: 'Total sponsorship expenditure ÷ number of children',
        formula: 'TotalExpenditure / NumberOfChildren',
        disaggregation: 'Country',
        mov: 'Finance ledger, results summary',
        tier: [1]
      }
    ],
    accountability: [
      {
        indicator: '% complaints resolved within SLA',
        definition: '(Complaints resolved within timeframe ÷ total) × 100',
        formula: '(ResolvedOnTime / Total) * 100',
        disaggregation: 'Country',
        mov: 'CFM register',
        tier: [1]
      }
    ]
  },

  'Education Support': {
    activities: [
      {
        indicator: '# school visits or monitoring sessions conducted',
        definition: 'Visits to schools to verify enrollment and attendance',
        formula: 'Count of visits',
        disaggregation: 'Country',
        mov: 'Visit log, photos',
        tier: [1, 2, 3]
      }
    ],
    outputs: [
      {
        indicator: '# children receiving school kits/support',
        definition: 'Total children supported during year',
        formula: 'Count of beneficiaries',
        disaggregation: 'Gender, grade, country',
        mov: 'Distribution list',
        tier: [1, 2, 3]
      }
    ],
    outcomes: [
      {
        indicator: '% children retained in school 12 months',
        definition: '(Still enrolled ÷ total supported) × 100',
        formula: '(Retained / Total) * 100',
        disaggregation: 'Gender, grade',
        mov: 'School records',
        tier: [1, 2]
      }
    ]
  },

  'WASH': { /* Similar structure */ },
  'Livelihood': { /* Similar structure */ },
  'Seasonal Relief': { /* Similar structure */ }
};
```

### 4.2 Safeguarding Data Model (Annex B)

```javascript
const safeguardingModel = {
  // Informed Consent
  consentForms: [
    {
      beneficiaryId: 'B001',
      beneficiaryName: 'Anonymized',
      consentType: 'Adult' | 'Child' | 'Guardian',
      dataCollectionConsent: true,
      photoVideoConsent: true,
      consentDate: '2025-01-10',
      consentMethod: 'Written' | 'Verbal',
      withdrawalRights: 'Explained',
      formCollectedBy: 'Field Officer Name'
    }
  ],

  // Data Protection
  dataProtectionCompliance: {
    piiStoredSecurely: true,
    accessRestricted: true,
    encryptionEnabled: true,
    retentionPolicy: '3 years',
    deletionScheduled: '2028-01-01',
    gdprCompliant: true
  },

  // Safeguarding Incidents
  incidents: [
    {
      incidentId: 'SI-001',
      reportDate: '2025-01-15',
      reportedBy: 'Staff Member',
      incidentType: 'Child Protection' | 'Data Breach' | 'Other',
      severity: 'Low' | 'Medium' | 'High',
      description: 'Incident details (confidential)',
      actionTaken: 'Immediate response actions',
      reportedToAuthorities: false,
      status: 'Resolved' | 'Under Investigation',
      resolutionDate: '2025-01-20',
      lessonsLearned: 'Prevention measures implemented'
    }
  ],

  // Staff Training
  staffTraining: [
    {
      staffName: 'Officer Name',
      trainingDate: '2024-12-01',
      trainingType: 'Safeguarding & Data Protection',
      certificateIssued: true,
      validUntil: '2025-12-01'
    }
  ]
};
```

---

## 5. Implementation Roadmap

### Phase 1: Core MEAL Infrastructure (Week 1-2)
- [x] Document MEAL requirements analysis
- [ ] Update CBOContext with enhanced data models
- [ ] Create MEAL indicator bank component
- [ ] Add tier classification to proposals
- [ ] Implement Results Framework form

### Phase 2: Proposal Form Enhancement (Week 3-4)
- [ ] Update AddProposalModal with full GER form sections
- [ ] Add Theory of Change builder
- [ ] Implement beneficiary disaggregation form
- [ ] Add risk analysis section
- [ ] Create budget breakdown builder

### Phase 3: Field Monitoring (Week 5-6)
- [ ] Create Field Monitoring Form component
- [ ] Implement CFM tracking system
- [ ] Add safeguarding checklist
- [ ] Build learning log interface
- [ ] Create deployment monitoring form

### Phase 4: Project Completion & Reporting (Week 7-8)
- [ ] Build Project Completion Report form
- [ ] Add indicator achievement tracking
- [ ] Implement lessons learned documentation
- [ ] Create VfM (Value for Money) calculator
- [ ] Build sustainability assessment form

### Phase 5: Data Visualization & Reports (Week 9-10)
- [ ] Create MEAL dashboard
- [ ] Build indicator progress charts
- [ ] Implement CFM analytics
- [ ] Add donor reporting templates
- [ ] Create quarterly MEAL report generator

---

## 6. Testing & Validation

### 6.1 Test Scenarios

1. **Tier 1 Project Workflow**
   - Create comprehensive proposal with all indicators
   - Submit through fundraising → CEO → donor approval
   - Convert to project
   - Conduct field monitoring
   - Complete project and generate report

2. **Tier 3 Quick Project**
   - Use simplified forms
   - Minimal indicator tracking
   - Quick completion report

3. **CFM System**
   - Log various feedback types
   - Track resolution times
   - Generate accountability reports

### 6.2 Data Quality Checks

- All mandatory fields completed
- Indicator formulas calculating correctly
- Budget breakdown totaling 100%
- Beneficiary disaggregation matching totals
- Timeline dates in logical sequence

---

## 7. Next Steps

1. ✅ Complete MEAL document analysis
2. 🔄 Update CBOContext with enhanced models
3. ⏳ Implement enhanced proposal form
4. ⏳ Build field monitoring components
5. ⏳ Create reporting infrastructure

---

**Document Status**: 📝 Living Document - Updated as implementation progresses

**Last Updated**: November 7, 2025

**Prepared By**: Claude Code Assistant

**Reviewed By**: To be completed

---

Made with ❤️ for GERSL
