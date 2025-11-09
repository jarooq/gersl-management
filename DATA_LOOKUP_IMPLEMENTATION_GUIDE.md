# GERSL Data Lookup - Implementation Guide

## Quick Reference

This document provides specific code changes needed to implement the audit recommendations.

---

## CRITICAL FIXES (Do First)

### 1. HR Department Distribution (HR Module)

**File:** `src/pages/HR/HRPage.jsx` (Lines 219-225)

**BEFORE (Hardcoded):**
```jsx
{[
  { dept: 'Program', count: 8, percent: 32, color: 'from-orange-500 to-amber-600' },
  { dept: 'Finance', count: 5, percent: 20, color: 'from-green-500 to-emerald-600' },
  { dept: 'MEAL', count: 4, percent: 16, color: 'from-blue-500 to-cyan-600' },
  // ... more hardcoded departments
].map((item, index) => (
```

**AFTER (Dynamic):**
```jsx
{useMemo(() => {
  // Group staff by department
  const deptMap = {};
  staff.forEach(member => {
    const dept = member.department;
    if (!deptMap[dept]) {
      deptMap[dept] = 0;
    }
    deptMap[dept]++;
  });

  // Convert to array and calculate percentages
  const total = staff.length;
  const colors = [
    'from-orange-500 to-amber-600',
    'from-green-500 to-emerald-600',
    'from-blue-500 to-cyan-600',
    'from-purple-500 to-indigo-600',
    'from-pink-500 to-rose-600',
    'from-yellow-500 to-orange-600',
    'from-cyan-500 to-teal-600'
  ];

  return Object.entries(deptMap).map(([dept, count], index) => ({
    dept,
    count,
    percent: Math.round((count / total) * 100),
    color: colors[index % colors.length]
  }));
}, [staff]).map((item, index) => (
```

**Added Imports:**
```jsx
import { useMemo } from 'react';
```

---

### 2. HR Leave Types Distribution (HR Module)

**File:** `src/pages/HR/HRPage.jsx` (Lines 264-268)

**BEFORE (Hardcoded):**
```jsx
{[
  { type: 'Annual Leave', count: 15, color: 'bg-green-500', approved: 12, pending: 3 },
  { type: 'Sick Leave', count: 8, color: 'bg-red-500', approved: 7, pending: 1 },
  // ... more hardcoded leave types
].map((item, index) => (
```

**AFTER (Dynamic):**
```jsx
{useMemo(() => {
  // Group leave requests by type
  const leaveMap = {};
  const colors = {
    'Annual Leave': 'bg-green-500',
    'Sick Leave': 'bg-red-500',
    'Casual Leave': 'bg-blue-500',
    'Maternity/Paternity': 'bg-purple-500',
    'Other': 'bg-gray-500'
  };

  leaveRequests.forEach(leave => {
    const type = leave.leaveType;
    if (!leaveMap[type]) {
      leaveMap[type] = { count: 0, approved: 0, pending: 0 };
    }
    leaveMap[type].count++;
    if (leave.status === 'Approved') {
      leaveMap[type].approved++;
    } else if (leave.status === 'Pending') {
      leaveMap[type].pending++;
    }
  });

  return Object.entries(leaveMap).map(([type, data]) => ({
    type,
    color: colors[type] || 'bg-gray-500',
    ...data
  }));
}, [leaveRequests]).map((item, index) => (
```

---

### 3. Project Status Distribution (Projects Module)

**File:** `src/pages/Projects/ProjectsPage.jsx` (Lines 247-250)

**BEFORE (Hardcoded):**
```jsx
{[
  { status: 'Active', count: stats.active, percent: Math.round((stats.active / stats.total) * 100), color: 'bg-green-500' },
  { status: 'Planning', count: 3, percent: 15, color: 'bg-blue-500' },
  { status: 'On Hold', count: 2, percent: 10, color: 'bg-yellow-500' },
  { status: 'Completed', count: stats.completed, percent: Math.round((stats.completed / stats.total) * 100), color: 'bg-gray-500' }
].map((item, index) => (
```

**AFTER (Dynamic):**
```jsx
{useMemo(() => {
  // Group projects by status
  const statusMap = {};
  const colors = {
    'Planning': 'bg-blue-500',
    'Active': 'bg-green-500',
    'Implementation': 'bg-green-500',
    'On Hold': 'bg-yellow-500',
    'Completed': 'bg-gray-500',
    'Closing': 'bg-gray-500'
  };

  projects.forEach(project => {
    const status = project.status;
    if (!statusMap[status]) {
      statusMap[status] = 0;
    }
    statusMap[status]++;
  });

  const total = stats.total;
  return Object.entries(statusMap).map(([status, count]) => ({
    status,
    count,
    percent: Math.round((count / total) * 100),
    color: colors[status] || 'bg-gray-500'
  }));
}, [projects, stats]).map((item, index) => (
```

---

### 4. Project Programme Areas (Projects Module)

**File:** `src/pages/Projects/ProjectsPage.jsx` (Lines 215-218)

**BEFORE (Hardcoded):**
```jsx
{[
  { programme: 'Child Protection', budget: 5000000, percent: 45, color: 'from-purple-500 to-indigo-600' },
  { programme: 'Education', budget: 3500000, percent: 32, color: 'from-blue-500 to-cyan-600' },
  { programme: 'Healthcare', budget: 1800000, percent: 16, color: 'from-green-500 to-emerald-600' },
  { programme: 'Livelihood', budget: 800000, percent: 7, color: 'from-orange-500 to-amber-600' }
].map((item, index) => (
```

**AFTER (Dynamic):**
```jsx
{useMemo(() => {
  // Group projects by programme area and sum budgets
  const programmeMap = {};
  const colors = {
    'WASH': 'from-blue-500 to-cyan-600',
    'Orphan Care': 'from-pink-500 to-rose-600',
    'Education': 'from-purple-500 to-indigo-600',
    'Emergency Response': 'from-red-500 to-rose-600',
    'Child Protection': 'from-purple-500 to-indigo-600',
    'Healthcare': 'from-green-500 to-emerald-600',
    'Livelihood': 'from-orange-500 to-amber-600'
  };

  projects.forEach(project => {
    const area = project.programmeArea;
    if (!programmeMap[area]) {
      programmeMap[area] = 0;
    }
    programmeMap[area] += project.budget || 0;
  });

  const totalBudget = Object.values(programmeMap).reduce((a, b) => a + b, 0);
  
  return Object.entries(programmeMap).map(([programme, budget]) => ({
    programme,
    budget,
    percent: Math.round((budget / totalBudget) * 100),
    color: colors[programme] || 'from-gray-500 to-slate-600'
  }));
}, [projects]).map((item, index) => (
```

---

## HIGH PRIORITY FIXES

### 5. Add PartnersContext to Proposals (Proposals Module)

**File:** `src/pages/Proposals/ProposalsPage.jsx`

**Add Import at Top:**
```jsx
import { usePartners } from '../../contexts/PartnersContext';
```

**In AddProposalModal Component:**
```jsx
const AddProposalModal = ({ onClose, onSubmit, error, success, isLoading }) => {
  const { partners } = usePartners(); // NEW

  const [formData, setFormData] = useState({
    // ... existing state
    donorOrganization: '',
    // ... rest
  });

  // Add this near the form inputs:
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Donor Organization <span className="text-red-500">*</span>
  </label>
  <select
    name="donorOrganization"
    value={formData.donorOrganization}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Select Donor...</option>
    {partners.map(partner => (
      <option key={partner.id} value={partner.name}>
        {partner.name}
      </option>
    ))}
  </select>
```

---

### 6. Add CBOContext to Proposals (Proposals Module)

**File:** `src/pages/Proposals/ProposalsPage.jsx`

**Add Import at Top:**
```jsx
import { useCBO } from '../../contexts/CBOContext';
```

**In AddProposalModal Component:**
```jsx
const AddProposalModal = ({ onClose, onSubmit, error, success, isLoading }) => {
  const { cboPartners } = useCBO(); // NEW

  // Add this near the form inputs for CBO selection:
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    CBO Partner <span className="text-red-500">*</span>
  </label>
  <select
    name="cboName"
    value={formData.cboName}
    onChange={handleInputChange}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Select CBO...</option>
    {cboPartners.map(cbo => (
      <option key={cbo.id} value={cbo.name}>
        {cbo.name}
      </option>
    ))}
  </select>
```

---

### 7. Add ProjectContext to Tasks (Tasks Module)

**File:** `src/pages/Operations/TasksPage.jsx`

**Add Import at Top:**
```jsx
import { useProjects } from '../../contexts/ProjectContext';
import { useHR } from '../../contexts/HRContext';
```

**In TasksPage Component:**
```jsx
const TasksPage = () => {
  const { projects } = useProjects(); // NEW
  const { staff } = useHR(); // NEW

  // Update the newTask state for project selection:
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project: projects.length > 0 ? projects[0].name : '', // Use first project as default
    priority: 'Medium',
    status: 'To Do',
    dueDate: '',
    assignee: staff.length > 0 ? staff[0].fullName : '', // Use first staff as default
    timeEstimate: '',
    tags: ''
  });

  // Replace hardcoded project field in form:
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Project
  </label>
  <select
    name="project"
    value={newTask.project}
    onChange={(e) => setNewTask({...newTask, project: e.target.value})}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    {projects.map(project => (
      <option key={project.id} value={project.name}>
        {project.name}
      </option>
    ))}
  </select>

  // Replace hardcoded assignee field:
  <label className="block text-sm font-semibold text-gray-700 mb-2">
    Assignee
  </label>
  <select
    name="assignee"
    value={newTask.assignee}
    onChange={(e) => setNewTask({...newTask, assignee: e.target.value})}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
  >
    <option value="">Select assignee...</option>
    {staff.map(member => (
      <option key={member.id} value={member.fullName}>
        {member.fullName}
      </option>
    ))}
  </select>
```

---

### 8. Add CBOContext to Orphans (Orphans Module)

**File:** `src/pages/Orphans/OrphansPage.jsx`

**Add Import at Top:**
```jsx
import { useCBO } from '../../contexts/CBOContext';
```

**In OrphansPage Component:**
```jsx
const OrphansPage = () => {
  const { orphans, /* ... other methods ... */ } = useOrphans();
  const { cboPartners } = useCBO(); // NEW

  // Now you can use cboPartners to validate CBO assignments
  // or display CBO information for orphans
  
  // In OrphanProfile component or orphan details:
  {selectedOrphan?.cboName && (
    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-2">CBO Assignment</h3>
      <p className="text-sm text-gray-700">
        {cboPartners.find(c => c.name === selectedOrphan.cboName)?.name || 'Unknown CBO'}
      </p>
    </div>
  )}
```

---

## MEDIUM PRIORITY FIXES

### 9. Enhance HRContext with Metrics Calculations

**File:** `src/contexts/HRContext.jsx`

**Add Method to HRProvider:**
```jsx
// Add to the return object of HRProvider:

const calculateMetrics = () => {
  const totalStaff = staff.length;
  const presentToday = attendance.filter(
    a => a.date === new Date().toISOString().split('T')[0] && a.status === 'Present'
  ).length;
  
  const attendanceRate = totalStaff > 0 
    ? Math.round((presentToday / totalStaff) * 100) 
    : 0;

  return {
    attendanceRate,
    presentToday,
    totalStaff,
    pendingLeaves: leaveRequests.filter(l => l.status === 'Pending').length,
    activeStaff: staff.filter(s => s.status === 'Active').length,
    departments: [...new Set(staff.map(s => s.department))],
    leaveTypes: [...new Set(leaveRequests.map(l => l.leaveType))]
  };
};

// Update getStats to use this:
const getStats = () => {
  return {
    ...calculateMetrics(),
    // ... existing stats
  };
};
```

---

### 10. Add Asset Management to HRContext

**File:** `src/contexts/HRContext.jsx`

**Add State:**
```jsx
const [assets, setAssets] = useState([
  {
    id: 1,
    name: 'GPS Device - Garmin eTrex',
    code: 'GPS-001',
    category: 'Electronics',
    status: 'Available',
    assignedTo: null,
    value: 45000
  },
  // ... more assets
]);

const checkoutAsset = (assetId, employeeId, purpose) => {
  setAssets(assets.map(asset =>
    asset.id === assetId
      ? { ...asset, status: 'Checked Out', assignedTo: employeeId }
      : asset
  ));
};

const returnAsset = (assetId) => {
  setAssets(assets.map(asset =>
    asset.id === assetId
      ? { ...asset, status: 'Available', assignedTo: null }
      : asset
  ));
};

// Return in context:
return (
  <HRContext.Provider value={{
    // ... existing
    assets,
    checkoutAsset,
    returnAsset
  }}>
    {children}
  </HRContext.Provider>
);
```

---

### 11. Create SettingsContext for Global Lookups

**File:** `src/contexts/SettingsContext.jsx` (NEW)

```jsx
import React, { createContext, useContext } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const DISTRICTS = [
    'Colombo', 'Kandy', 'Galle', 'Jaffna', 'Batticaloa',
    'Trincomalee', 'Anuradhapura', 'Matara', 'Negombo',
    'Kurunegala', 'Ratnapura'
  ];

  const PROGRAMME_AREAS = [
    'Child Protection',
    'Education',
    'Healthcare',
    'Livelihood',
    'WASH',
    'Orphan Care',
    'Emergency Response'
  ];

  const PROJECT_TIERS = [
    'Tier 1 - National',
    'Tier 2 - Regional',
    'Tier 3 - Local'
  ];

  const SECTOR_THEMES = [
    'Education',
    'Health',
    'WASH',
    'Protection',
    'Livelihood',
    'Nutrition'
  ];

  const PROJECT_STATUSES = [
    'Planning',
    'Active',
    'Implementation',
    'On Hold',
    'Closing',
    'Completed'
  ];

  const getDistricts = () => DISTRICTS;
  const getProgrammeAreas = () => PROGRAMME_AREAS;
  const getProjectTiers = () => PROJECT_TIERS;
  const getSectorThemes = () => SECTOR_THEMES;
  const getProjectStatuses = () => PROJECT_STATUSES;

  return (
    <SettingsContext.Provider value={{
      DISTRICTS,
      PROGRAMME_AREAS,
      PROJECT_TIERS,
      SECTOR_THEMES,
      PROJECT_STATUSES,
      getDistricts,
      getProgrammeAreas,
      getProjectTiers,
      getSectorThemes,
      getProjectStatuses
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
```

---

### 12. Update CBO Module to Use SettingsContext

**File:** `src/pages/CBO/CBOPage.jsx`

**Add Import:**
```jsx
import { useSettings } from '../../contexts/SettingsContext';
```

**Replace Hardcoded Districts:**
```jsx
const CBOPage = () => {
  const { cboPartners, /* ... */ } = useCBO();
  const { getDistricts } = useSettings(); // NEW

  const districts = ['All', ...getDistricts()]; // Use from settings

  // Rest of component...
```

---

## IMPLEMENTATION PRIORITY ORDER

1. **Week 1 (Critical):**
   - Fix HR department distribution
   - Fix HR leave types distribution
   - Fix Projects status distribution
   - Fix Projects programme areas
   - Add PartnersContext to Proposals
   - Add CBOContext to Proposals
   - Add ProjectContext to Tasks
   - Add CBOContext to Orphans

2. **Week 2 (High):**
   - Enhance HRContext with metrics
   - Add asset management to HRContext
   - Create SettingsContext
   - Update CBO to use SettingsContext

3. **Week 3+ (Medium/Low):**
   - Create TaskContext
   - Create VehicleRequestContext
   - Create AccommodationContext
   - Optimize context performance

---

## Testing Checklist

After each change:
- [ ] Data displays correctly from context
- [ ] No console errors
- [ ] Filtering works with dynamic data
- [ ] Calculations match expectations
- [ ] Performance acceptable with large datasets

