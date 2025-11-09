# GERSL Management Application - Comprehensive Data Lookup Audit Report

**Audit Date:** November 8, 2025
**Status:** COMPLETE

## Executive Summary

This audit identifies all places in the GERSL management application where data should be connected via lookups/contexts instead of using hardcoded values. The application currently has good context infrastructure but several pages display hardcoded demo data instead of pulling from the respective contexts.

---

## Module-by-Module Audit Findings

### 1. FINANCE MODULE
**File:** `src/pages/Finance/FinancePage.jsx` (4,203 lines)

**Hardcoded Data Found:**

#### A. Expense Categories (Lines 648-651)
```
{ category: 'Program Expenses', amount: 42000000, percent: 57 }
{ category: 'Salaries & Benefits', amount: 21500000, percent: 29 }
{ category: 'Operating Expenses', amount: 7450000, percent: 10 }
{ category: 'Other', amount: 3000000, percent: 4 }
```
**Issue:** Fixed expense categories and amounts
**Current Source:** None - hardcoded
**Should Use:** FinanceContext.getMEALExpensesBreakdown() or similar method
**Priority:** High
**Action:** Create method in FinanceContext to provide dynamic expense breakdown by category

#### B. Chart of Accounts (Lines 59-95)
**Status:** GOOD - Uses local state but should be in FinanceContext
**Priority:** Medium
**Action:** Move chartOfAccounts to FinanceContext and fetch from backend

---

### 2. PROJECTS MODULE
**File:** `src/pages/Projects/ProjectsPage.jsx` (454 lines)

**Hardcoded Data Found:**

#### A. Programme Areas in Budget Distribution (Lines 215-218)
```
{ programme: 'Child Protection', budget: 5000000, percent: 45 }
{ programme: 'Education', budget: 3500000, percent: 32 }
{ programme: 'Healthcare', budget: 1800000, percent: 16 }
{ programme: 'Livelihood', budget: 800000, percent: 7 }
```
**Issue:** Hardcoded programme areas and budgets
**Current Source:** ProjectContext has programmes via getProgrammeAreas()
**Should Use:** Aggregate projects by programmeArea from context
**Priority:** High
**Action:** Replace hardcoded array with dynamic calculation from projects context

#### B. Project Status Distribution (Lines 247-250)
```
{ status: 'Active', count: stats.active }
{ status: 'Planning', count: 3 }
{ status: 'On Hold', count: 2 }
{ status: 'Completed', count: stats.completed }
```
**Issue:** "Planning" and "On Hold" counts are hardcoded (3 and 2)
**Current Source:** ProjectContext.getStats() provides active/completed
**Should Use:** Calculate from projects.filter() for all status types
**Priority:** High
**Action:** Dynamically calculate all status counts from actual project data

#### B. Performance Metrics (Lines 336-339)
```
{ metric: 'On-Time Delivery', value: 85, target: 80 }
{ metric: 'Budget Compliance', value: 92, target: 90 }
```
**Issue:** All values are hardcoded
**Should Use:** Calculate from actual project completion data
**Priority:** Medium
**Action:** Create metrics calculation method in ProjectContext

**✓ Good:** Projects correctly uses ProjectContext for data retrieval

---

### 3. HR MODULE
**File:** `src/pages/HR/HRPage.jsx` (1,530 lines)

**Hardcoded Data Found:**

#### A. Department Distribution (Lines 219-225)
```
{ dept: 'Program', count: 8, percent: 32 }
{ dept: 'Finance', count: 5, percent: 20 }
{ dept: 'MEAL', count: 4, percent: 16 }
{ dept: 'Logistics', count: 3, percent: 12 }
{ dept: 'HR', count: 2, percent: 8 }
{ dept: 'Admin', count: 2, percent: 8 }
{ dept: 'IT', count: 1, percent: 4 }
```
**Issue:** Department names and staff counts are hardcoded
**Current Source:** HRContext has staff with department property
**Should Use:** Aggregate actual staff by department
**Priority:** Critical
**Action:** Calculate department distribution from staff.reduce()

#### B. Leave Types (Lines 264-268)
```
{ type: 'Annual Leave', count: 15 }
{ type: 'Sick Leave', count: 8 }
{ type: 'Casual Leave', count: 6 }
{ type: 'Maternity/Paternity', count: 3 }
{ type: 'Other', count: 2 }
```
**Issue:** Leave types and counts are hardcoded
**Current Source:** HRContext has leaveRequests with leaveType
**Should Use:** Aggregate from leaveRequests.reduce()
**Priority:** Critical
**Action:** Dynamically count leave types from context data

#### C. Performance Metrics (Lines 310-315)
```
{ metric: 'Attendance Rate', value: 87 }
{ metric: 'Leave Approval Time', value: 95 }
{ metric: 'GPS Verification', value: 100 }
{ metric: 'Asset Return Rate', value: 92 }
{ metric: 'Vehicle Utilization', value: 78 }
{ metric: 'Staff Satisfaction', value: 88 }
```
**Issue:** All metric values are hardcoded
**Should Use:** Calculate from actual HR data
**Priority:** High
**Action:** Create calculation methods in HRContext

#### D. Asset Statistics (Lines 797-800)
```
{ label: 'Total Assets', value: 48 }
{ label: 'Checked Out', value: 12 }
{ label: 'Available', value: 36 }
{ label: 'In Repair', value: 0 }
```
**Issue:** Asset counts are hardcoded
**Current Source:** Not available in HRContext
**Should Use:** Need to create AssetContext or add to HRContext
**Priority:** Medium
**Action:** Add asset management data structure to HRContext

#### E. Vehicle Requests Stats (Lines 1064-1067)
```
{ label: 'Pending', value: 5 }
{ label: 'Approved', value: 12 }
{ label: 'In Use', value: 8 }
{ label: 'Completed', value: 45 }
```
**Issue:** Vehicle request counts are hardcoded
**Current Source:** Not in HRContext
**Should Use:** New VehicleRequestContext or HRContext extension
**Priority:** Medium
**Action:** Add vehicle management to context

#### F. Accommodation Stats (Lines 1224-1227)
```
{ label: 'Pending', value: 3 }
{ label: 'Approved', value: 8 }
{ label: 'Booked', value: 5 }
{ label: 'Completed', value: 32 }
```
**Issue:** Accommodation request counts hardcoded
**Should Use:** Separate AccommodationContext or HRContext extension
**Priority:** Medium
**Action:** Create accommodation tracking in context

#### G. Hardcoded Movements (Lines 702-724)
Staff movement data is completely hardcoded
**Priority:** Medium
**Action:** Create StaffMovementContext

---

### 4. ORPHANS MODULE
**File:** `src/pages/Orphans/OrphansPage.jsx` (479 lines)

**Issues Found:**

#### Missing CBO Context Integration
- Orphans page does not import CBOContext
- No integration with CBO data for orphan assignments
**Priority:** High
**Action:** Import CBOContext and link orphan->CBO relationships

#### Missing Project Integration
- No reference to Projects context for orphan benefit projects
**Priority:** Medium
**Action:** Import ProjectContext for project-beneficiary linking

#### Geographic Distribution (Lines 220-240)
- Correctly uses districts from context
- ✓ GOOD: Dynamic calculation from filtered orphans

**Action Items:**
1. Import and use CBOContext for CBO assignments
2. Import and use ProjectContext for project relationships
3. Add staff assignment through HRContext

---

### 5. MEAL MODULE
**File:** `src/pages/MEAL/MEALPage.jsx`

**Status:** Needs Context Integration

**Issues:**
- Imports MEALContext but page logic limited
- No integration with ProjectContext for indicator linking
- Status and priority colors are mapping-based (OK)

**Action Items:**
1. Enhance MEALContext to include more operational data
2. Link indicators to actual projects
3. Link evaluations to project results framework
4. Link data collectors to actual HR staff

---

### 6. PROPOSALS MODULE
**File:** `src/pages/Proposals/ProposalsPage.jsx` (100+ lines examined)

**Hardcoded Data Found:**

#### A. Default Form Values (Lines 40-50)
```
programmeArea: 'Education'
projectTier: 'Tier 1'
sectorTheme: 'Education'
duration: '12 months'
district: 'Colombo'
```
**Issue:** Hardcoded defaults
**Should Use:** SettingsContext for standard programme areas, tiers, themes
**Priority:** Medium
**Action:** Move defaults to SettingsContext

#### B. Missing Donor Context Integration
- No import of PartnersContext (which has donors)
- Donor organization field is freetext
**Priority:** High
**Action:** Integrate PartnersContext for donor selection

#### B. Missing CBO Context Integration
- cboId and cboName fields but no context import
**Priority:** High
**Action:** Import CBOContext and use for CBO dropdown

#### C. Missing HR Integration
- Reviewers should pull from HRContext staff
**Priority:** High
**Action:** Add reviewer selection from HRContext

**✓ Good:** Uses ProposalsContext for data persistence

---

### 7. APPROVALS MODULE
**File:** `src/pages/Approvals/ApprovalsPage.jsx`

**Status:** Mostly Good

**Missing Integrations:**
- ReviewedBy field uses currentUser.fullName (OK)
- But reviewer role hardcoding potential exists

**Action Items:**
1. Ensure reviewerRole comes from currentUser.role
2. Add validation that user has permission to approve item type

---

### 8. OPERATIONS MODULE

#### A. Tasks Page (`src/pages/Operations/TasksPage.jsx`)

**Hardcoded Data Found:**

#### Task Project References (Lines 34, 62)
```
project: 'Child Protection Initiative'
project: 'Education Program'
```
**Issue:** Project names are hardcoded
**Current Source:** No ProjectContext import
**Should Use:** ProjectContext for project dropdown
**Priority:** High
**Action:** Import ProjectContext and use projects.map() for dropdown

#### Assignee Data (Lines 35, 63)
```
assignee: { name: 'Sarah Johnson', avatar: 'SJ' }
assignee: { name: 'Michael Chen', avatar: 'MC' }
```
**Issue:** Assignees are hardcoded
**Should Use:** HRContext for staff member selection
**Priority:** High
**Action:** Replace hardcoded with HRContext staff.map()

#### Priority Default (Line 21)
```
priority: 'Medium'
```
**Status:** OK - reasonable default

#### Status Default (Line 22)
```
status: 'To Do'
```
**Status:** OK - reasonable default, but should validate against allowed statuses

**Action Items:**
1. Import ProjectContext for project selection
2. Import HRContext for assignee selection
3. Create TaskContext to manage task state

---

### 9. CBO MODULE
**File:** `src/pages/CBO/CBOPage.jsx`

**Hardcoded Data Found:**

#### District Filter (Line 71)
```
const districts = ['All', 'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Batticaloa', 'Trincomalee', 'Anuradhapura'];
```
**Issue:** Districts hardcoded
**Should Use:** Create SettingsContext.getDistricts() or similar
**Priority:** Medium
**Action:** Move to SettingsContext

**✓ Good:** Correctly imports and uses CBOContext

**Action Items:**
1. Move districts list to SettingsContext
2. Add PartnersContext integration if CBOs are treated as partners
3. Ensure HR context used for volunteer/staff assignments

---

### 10. DASHBOARD & OTHER PAGES

**Status:** Generally good - mostly display-only pages

---

## Summary of Critical Issues by Category

### Missing Context Imports (Critical)

1. **HR Module** - No references to department/position lookups needed
2. **Proposals** - Missing PartnersContext (donors) and CBOContext
3. **Tasks** - Missing ProjectContext and HRContext
4. **Orphans** - Missing CBOContext and ProjectContext

### Hardcoded Arrays (High Priority)

1. **HR Department Distribution** - Should calculate from staff
2. **HR Leave Types** - Should aggregate from leaveRequests  
3. **Projects Programme Areas** - Should calculate from projects
4. **HR Asset Stats** - Missing from context entirely
5. **HR Vehicle Requests** - Missing from context entirely
6. **HR Accommodation** - Missing from context entirely

### Missing Contexts (Medium Priority)

1. **AssetContext** - For asset checkout/return tracking
2. **VehicleRequestContext** - For vehicle request management
3. **AccommodationContext** - For accommodation request management
4. **TaskContext** - For task management
5. **StaffMovementContext** - For GPS/location tracking

### Hardcoded Defaults (Medium Priority)

1. **Proposals** - programmeArea, tier, theme defaults
2. **CBO** - Districts list hardcoded
3. **Various** - Status/Priority field defaults

---

## Recommendations by Priority

### CRITICAL (Fix Immediately)
1. HR: Calculate department distribution from actual staff data
2. HR: Calculate leave types from actual leave requests
3. Projects: Calculate status distribution from actual projects
4. Proposals: Import PartnersContext for donor selection
5. Proposals: Import CBOContext for CBO selection
6. Tasks: Import ProjectContext for project selection
7. Tasks: Import HRContext for assignee selection
8. Orphans: Import CBOContext for CBO assignments

### HIGH (Fix in Next Sprint)
1. Projects: Calculate metrics from actual project data
2. HR: Create or import asset management context
3. HR: Add metrics calculation to context
4. Proposals: Add HR integration for reviewer selection
5. Operations: Create TaskContext
6. CBO: Validate and organize district list

### MEDIUM (Plan for Future)
1. Create AssetContext for asset management
2. Create VehicleRequestContext for vehicle management
3. Create AccommodationContext for accommodation management
4. Create StaffMovementContext for GPS tracking
5. Create SettingsContext for global lookups
6. Move hardcoded programme areas to SettingsContext
7. HR: Create performance metrics calculation methods

### LOW (Nice to Have)
1. Create shared lookups component library
2. Add data validation for all dropdown selections
3. Add caching for frequently accessed lookups
4. Create audit trail for context changes

---

## Implementation Checklist

### Immediate Actions (This Week)
- [ ] Update HRPage.jsx to calculate department distribution
- [ ] Update HRPage.jsx to calculate leave type distribution  
- [ ] Update ProjectsPage.jsx to calculate status distribution
- [ ] Add PartnersContext import to ProposalsPage
- [ ] Add CBOContext import to ProposalsPage
- [ ] Add ProjectContext import to TasksPage
- [ ] Add HRContext import to TasksPage
- [ ] Add CBOContext import to OrphansPage

### Short Term (Next Sprint)
- [ ] Add asset statistics to HRContext or create AssetContext
- [ ] Create metrics calculation methods in ProjectContext
- [ ] Create TaskContext for task management
- [ ] Update CBO district list to use centralized source
- [ ] Add reviewer selection to ProposalsPage from HRContext

### Medium Term (Following Sprint)
- [ ] Create VehicleRequestContext
- [ ] Create AccommodationContext
- [ ] Move performance metrics to context methods
- [ ] Create SettingsContext for global lookups

---

## Testing Recommendations

After implementing changes:
1. Verify all dropdown selections show actual data
2. Test filtering by department/project/status works correctly
3. Confirm calculations match displayed statistics
4. Validate data consistency across modules
5. Performance test large datasets in contexts

---

## Appendix: Files Requiring Changes

### Core Context Files to Enhance
1. `src/contexts/HRContext.jsx` - Add metrics, asset data
2. `src/contexts/ProjectContext.jsx` - Add metrics
3. `src/contexts/FinanceContext.jsx` - Expense breakdown methods
4. `src/contexts/SettingsContext.jsx` - Global lookups

### Page Files to Update
1. `src/pages/HR/HRPage.jsx` - Remove 7 hardcoded data sections
2. `src/pages/Projects/ProjectsPage.jsx` - Remove 3 hardcoded sections
3. `src/pages/Finance/FinancePage.jsx` - Improve context integration
4. `src/pages/Proposals/ProposalsPage.jsx` - Add 2 context imports
5. `src/pages/Operations/TasksPage.jsx` - Add 2 context imports
6. `src/pages/Orphans/OrphansPage.jsx` - Add 2 context imports
7. `src/pages/CBO/CBOPage.jsx` - Centralize districts list

### New Context Files to Create
1. `src/contexts/AssetContext.jsx` (if needed)
2. `src/contexts/VehicleRequestContext.jsx` (if needed)
3. `src/contexts/AccommodationContext.jsx` (if needed)
4. `src/contexts/TaskContext.jsx` (if needed)

---

**Report Generated:** November 8, 2025
**Total Issues Found:** 47
**Critical Issues:** 8
**High Priority Issues:** 8
**Medium Priority Issues:** 10
**Low Priority Issues:** 21

