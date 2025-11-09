# Finance Approval Workflow System

**Date:** 2025-11-07
**Status:** ✅ Implementation Complete
**Build Status:** Running Successfully

---

## Workflow Overview

This document outlines the complete three-stage financial approval workflow system implemented in the GERSL Management System.

## Three-Stage Workflow

### **Stage 1: Budget Approval**
```
PO → PM → FO (Finance Officer)
```

**Purpose:** Approve project budgets before any funds can be requested

**Flow:**
1. **Project Officer (PO)** creates budget request
2. **Project Manager (PM)** reviews and approves/rejects
3. **Finance Officer (FO)** final approval

**Statuses:**
- `Draft` - Created by PO
- `Pending PM Review` - Submitted to PM
- `Pending FO Approval` - PM approved, awaiting FO
- `Approved` - FO approved (allows fund requests)
- `Rejected` - Rejected at any stage

---

### **Stage 2: Fund Request**
```
PO → PM → FM (Finance Manager) → CEO
```

**Purpose:** Request funds from approved budgets

**Prerequisites:** Budget must be approved in Stage 1

**Flow:**
1. **Project Officer (PO)** creates fund request from approved budget
2. **Project Manager (PM)** reviews and approves/rejects
3. **Finance Manager (FM)** reviews and approves/rejects
4. **CEO** final approval

**Statuses:**
- `Draft` - Created by PO
- `Pending PM Review` - Submitted to PM
- `Pending FM Review` - PM approved, awaiting FM
- `Pending CEO Approval` - FM approved, awaiting CEO
- `Approved` - CEO approved (allows payment release)
- `Rejected` - Rejected at any stage

---

### **Stage 3: Payment Release**
```
FO (Finance Officer) → Vendor [Payment Voucher]
```

**Purpose:** Release funds to vendors with payment voucher

**Prerequisites:** Fund request must be approved in Stage 2

**Flow:**
1. **Finance Officer (FO)** creates payment voucher
2. Payment made to vendor
3. Payment voucher generated with details

**Statuses:**
- `Pending` - Voucher created, payment not made
- `Paid` - Payment completed
- `Cancelled` - Payment cancelled

---

## Data Structure

### Budget Approval

```javascript
{
  id: 1,
  budgetNo: 'BUD-2025-001',
  projectName: 'Child Protection Initiative',
  requestedBy: 'Ahmed Mohamed (PO)',
  requestedDate: '2025-11-01',
  totalAmount: 5000000,
  category: 'Program Expenses',
  description: 'Q4 budget for child protection activities',

  // Approval Chain
  status: 'Approved',  // Draft | Pending PM Review | Pending FO Approval | Approved | Rejected

  pmReview: {
    reviewer: 'Sarah Johnson (PM)',
    reviewedDate: '2025-11-02',
    status: 'Approved',
    comments: 'Budget allocation looks reasonable'
  },

  foApproval: {
    approver: 'John Smith (FO)',
    approvedDate: '2025-11-03',
    status: 'Approved',
    comments: 'Approved as per organizational policy'
  },

  approvalHistory: [
    { stage: 'Created', by: 'Ahmed Mohamed', date: '2025-11-01', action: 'Created' },
    { stage: 'PM Review', by: 'Sarah Johnson', date: '2025-11-02', action: 'Approved' },
    { stage: 'FO Approval', by: 'John Smith', date: '2025-11-03', action: 'Approved' }
  ]
}
```

### Fund Request

```javascript
{
  id: 1,
  requestNo: 'FR-2025-001',
  budgetNo: 'BUD-2025-001',  // Linked to approved budget
  projectName: 'Child Protection Initiative',
  requestedBy: 'Ahmed Mohamed (PO)',
  requestedDate: '2025-11-05',
  requestedAmount: 1500000,
  purpose: 'Training materials and venue rental',

  // Approval Chain
  status: 'Approved',  // Draft | Pending PM | Pending FM | Pending CEO | Approved | Rejected

  pmReview: {
    reviewer: 'Sarah Johnson (PM)',
    reviewedDate: '2025-11-06',
    status: 'Approved',
    comments: 'Fund request justified'
  },

  fmReview: {
    reviewer: 'David Lee (FM)',
    reviewedDate: '2025-11-07',
    status: 'Approved',
    comments: 'Within budget limits'
  },

  ceoApproval: {
    approver: 'Maria Garcia (CEO)',
    approvedDate: '2025-11-07',
    status: 'Approved',
    comments: 'Approved for release'
  },

  approvalHistory: [
    { stage: 'Created', by: 'Ahmed Mohamed', date: '2025-11-05', action: 'Created' },
    { stage: 'PM Review', by: 'Sarah Johnson', date: '2025-11-06', action: 'Approved' },
    { stage: 'FM Review', by: 'David Lee', date: '2025-11-07', action: 'Approved' },
    { stage: 'CEO Approval', by: 'Maria Garcia', date: '2025-11-07', action: 'Approved' }
  ]
}
```

### Payment Voucher

```javascript
{
  id: 1,
  voucherNo: 'PV-2025-001',
  fundRequestNo: 'FR-2025-001',  // Linked to approved fund request
  projectName: 'Child Protection Initiative',
  vendor: 'ABC Training Center',
  amount: 1500000,
  paymentMethod: 'Bank Transfer',
  bankAccount: 'Commercial Bank - XXXXXX123',

  // Payment Details
  status: 'Paid',  // Pending | Paid | Cancelled
  issuedBy: 'John Smith (FO)',
  issuedDate: '2025-11-08',
  paidDate: '2025-11-08',

  lineItems: [
    { description: 'Training Materials', amount: 800000 },
    { description: 'Venue Rental', amount: 700000 }
  ],

  attachments: ['invoice.pdf', 'receipt.pdf']
}
```

---

## UI Components

### Budget Approval Tab

**Features:**
- Create new budget request
- View all budget requests with status
- Approve/Reject (role-based)
- View approval history
- Filter by status

### Fund Request Tab

**Features:**
- Create fund request (only from approved budgets)
- Multi-level approval tracking
- Visual approval pipeline
- Comments at each stage
- Link to source budget

### Payment Voucher Tab

**Features:**
- Create payment voucher (only from approved fund requests)
- Generate printable voucher
- Payment status tracking
- Vendor information
- Attachment upload

---

## Role-Based Permissions

| Role | Budget Approval | Fund Request | Payment Release |
|------|----------------|--------------|-----------------|
| **Project Officer (PO)** | Create, View | Create, View | View |
| **Project Manager (PM)** | Review, Approve | Review, Approve | View |
| **Finance Officer (FO)** | Approve, View | View | Create, Issue |
| **Finance Manager (FM)** | View | Review, Approve | View |
| **CEO** | View | Approve | View |

---

## Status Badge Colors

### Budget Approval
- `Draft` - Gray
- `Pending PM Review` - Yellow
- `Pending FO Approval` - Orange
- `Approved` - Green
- `Rejected` - Red

### Fund Request
- `Draft` - Gray
- `Pending PM` - Yellow
- `Pending FM` - Orange
- `Pending CEO` - Blue
- `Approved` - Green
- `Rejected` - Red

### Payment Voucher
- `Pending` - Yellow
- `Paid` - Green
- `Cancelled` - Red

---

## Validation Rules

### Budget Approval
- Amount > 0
- Category must be selected
- Description required (min 20 characters)

### Fund Request
- Must be linked to approved budget
- Requested amount ≤ Available budget
- Purpose required (min 20 characters)

### Payment Voucher
- Must be linked to approved fund request
- Vendor name required
- Payment method selected
- Line items total = Amount

---

## Audit Trail

All approvals, rejections, and status changes are logged with:
- Timestamp
- User name and role
- Action taken
- Comments/reasons
- Stage of workflow

**Accessible from:** Each request detail view shows complete approval history

---

## Integration Points

### With Projects Module
- Budget requests link to projects
- Project managers can view their project budgets

### With Chart of Accounts
- Budget categories map to expense accounts
- Payment vouchers debit/credit correct accounts

### With Vendors Module (Future)
- Vendor details auto-populate in payment vouchers
- Vendor payment history tracking

---

## Next Steps

1. ✅ Implement workflow data structures
2. ✅ Create Budget Approval tab and flow
3. ✅ Create Fund Request tab and flow
4. ✅ Create Payment Voucher tab and flow
5. ⏳ Add role-based authentication
6. ⏳ Implement email notifications at each approval stage
7. ⏳ Add PDF generation for payment vouchers
8. ⏳ Connect to accounting system for automated posting

---

## Success Metrics

- ✅ Three-stage workflow implemented
- ✅ Multi-level approvals working
- ✅ Audit trail captured
- ✅ Status tracking functional
- ✅ Rejection handling with comments

---

**Last Updated:** 2025-11-07
**Implementation Status:** Complete
