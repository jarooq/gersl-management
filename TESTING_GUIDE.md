# GERSL Management System - Testing Guide

## Current Status
- **Development Server**: Running at http://localhost:5174/
- **Completed Modules**: 4 of 9 (55% complete)
  - ✅ Foundation (Auth, Routing, Layout)
  - ✅ Orphan Management
  - ✅ Project Management
  - ✅ Finance Management
- **Bug Fixes Applied**:
  - Fixed FinanceStats.jsx missing `payrollData` prop
  - Fixed FinanceContext.jsx `getExpensesByProject` using wrong variable

## Test Credentials

### Administrator
- **Email**: admin@gersl.lk
- **Password**: admin123
- **Access**: All modules

### Project Manager
- **Email**: project.manager@gersl.lk
- **Password**: pm123
- **Access**: Projects, Orphans, Dashboard

### Finance Manager
- **Email**: finance.manager@gersl.lk
- **Password**: fm123
- **Access**: Finance, Dashboard

### Field Officer
- **Email**: field.officer@gersl.lk
- **Password**: fo123
- **Access**: Limited access

## Testing Checklist

### 1. Authentication Module
- [ ] Navigate to http://localhost:5174/
- [ ] Verify login page loads correctly
- [ ] Test login with admin credentials (admin@gersl.lk / admin123)
- [ ] Verify successful redirect to Dashboard
- [ ] Check navbar shows user name and role
- [ ] Test logout functionality
- [ ] Verify redirect back to login page
- [ ] Test login with different roles to verify permissions

**Expected Behavior**:
- Login form should validate email format
- Invalid credentials should show error message
- Successful login redirects to dashboard
- User info appears in navbar
- Logout clears session and redirects to login

### 2. Dashboard Module
- [ ] After login, verify dashboard loads
- [ ] Check all stat cards display correctly
- [ ] Verify quick actions buttons are visible
- [ ] Check recent activities section
- [ ] Verify navigation links work

**Expected Behavior**:
- Dashboard shows overview statistics
- All cards have proper icons and colors
- Navigation to other modules works from quick actions

### 3. Orphan Management Module

#### View Orphans
- [ ] Navigate to Orphans page from sidebar
- [ ] Verify all orphan cards display (should see 5 orphans)
- [ ] Check each card shows:
  - Photo (placeholder or actual)
  - Name and age
  - District location
  - Guardian name
  - Status badge
  - Last visit date
  - View Profile button

#### Search Functionality
- [ ] Use search bar to search for "Fatima"
- [ ] Verify only matching orphans appear
- [ ] Clear search and verify all orphans return
- [ ] Try searching by guardian name
- [ ] Try searching by district

#### Filter Functionality
- [ ] Filter by District: Select "Jaffna"
- [ ] Verify only Jaffna orphans appear
- [ ] Filter by Status: Select "Active"
- [ ] Verify only active orphans appear
- [ ] Combine filters (District + Status)
- [ ] Reset filters to "All"

#### Orphan Profile Modal
- [ ] Click "View Profile" on any orphan card
- [ ] Verify modal opens with full details:
  - Personal Information section
  - Educational Status section
  - Guardian Information section
  - Financial Information section
  - Visit History section
- [ ] Check all data displays correctly
- [ ] Verify "Record Visit" button is visible
- [ ] Close modal and verify it closes properly

#### Record Visit
- [ ] Open any orphan profile
- [ ] Click "Record Visit" button
- [ ] Verify visit form appears with:
  - Date field
  - Visit type dropdown
  - Purpose field
  - Notes textarea
  - Guardian present checkbox
  - Visited by field
- [ ] Fill out the form
- [ ] Submit the visit
- [ ] Verify new visit appears in Visit History
- [ ] Check that "Last Visited" date updates on card

#### Stats Cards
- [ ] Verify stats cards show:
  - Total Orphans count
  - Active Orphans count
  - Visited This Month count
  - Pending Actions count
- [ ] Verify numbers are accurate

#### Data Persistence
- [ ] Record a visit
- [ ] Refresh the browser (F5)
- [ ] Verify the visit is still recorded
- [ ] Navigate away and back to Orphans page
- [ ] Verify all data persists

**Expected Behavior**:
- Orphan cards display in grid layout
- Search filters immediately as you type
- Filters work individually and in combination
- Modal shows all orphan details
- Visit form validates required fields
- Visit records save and display immediately
- Data persists across page refreshes

### 4. Project Management Module

#### View Projects
- [ ] Navigate to Projects page from sidebar
- [ ] Verify all project cards display (should see 4 projects)
- [ ] Check each card shows:
  - Project title
  - Programme area badge
  - Status badge
  - Budget information
  - Progress bar
  - Timeline dates
  - Location
  - View Details button

#### Search Functionality
- [ ] Search for "Water"
- [ ] Verify only water-related projects appear
- [ ] Clear search
- [ ] Try searching by location

#### Filter Functionality
- [ ] Filter by Programme Area: Select "WASH"
- [ ] Verify only WASH projects appear
- [ ] Filter by Status: Select "In Progress"
- [ ] Verify only in-progress projects appear
- [ ] Combine filters
- [ ] Reset to "All"

#### Project Details Modal
- [ ] Click "View Details" on any project
- [ ] Verify modal opens with:
  - Project overview
  - Budget breakdown (allocated vs spent)
  - Progress percentage
  - Task list with statuses
  - Team members (if any)
  - Timeline information
- [ ] Verify all budget calculations are correct
- [ ] Check task checkboxes work (if implemented)
- [ ] Close modal

#### Stats Cards
- [ ] Verify stats show:
  - Total Projects count
  - Active Projects count
  - Total Budget sum
  - Completed Projects count
- [ ] Verify numbers match the project data

#### Data Persistence
- [ ] Refresh browser
- [ ] Verify all projects still display
- [ ] Check filters still work after refresh

**Expected Behavior**:
- Project cards show accurate progress bars
- Budget displays in proper format (LKR)
- Status badges have correct colors
- Modal shows comprehensive project details
- Search and filters work smoothly
- Data persists across refreshes

### 5. Finance Management Module

#### Stats Dashboard
- [ ] Navigate to Finance page from sidebar
- [ ] Verify 4 stat cards display:
  - Total Budget (in millions)
  - Total Expenses (in millions)
  - Payroll (in thousands)
  - Purchase Orders (pending count)
- [ ] Verify all calculations are correct
- [ ] Check color coding (blue, green, purple, orange)

#### Budget Overview Tab
- [ ] Verify Budget Overview tab is active by default
- [ ] Check budget categories display:
  - Personnel
  - Project Implementation
  - Operations
  - Administration
- [ ] Verify each category shows:
  - Category name
  - Spent / Allocated amounts
  - Progress bar
  - Percentage used
  - Remaining amount
- [ ] Check progress bar widths match percentages

#### Expenses Tab
- [ ] Click on "Expenses" tab
- [ ] Verify expenses table displays (5 expenses)
- [ ] Check table columns:
  - Date
  - Description
  - Category
  - Amount (in LKR)
  - Status badge
- [ ] Verify status badges (Paid = green, Pending = yellow)
- [ ] Check "Add Expense" button is visible
- [ ] Click "Add Expense" (shows alert for now)

#### Payroll Tab
- [ ] Click on "Payroll" tab
- [ ] Verify payroll table displays (5 staff members)
- [ ] Check table columns:
  - Staff name
  - Position
  - Base Salary
  - Allowances (green text)
  - Deductions (red text)
  - Net Salary
  - Status badge
- [ ] Verify footer shows total payroll
- [ ] Check total calculation is correct

#### Purchase Orders Tab
- [ ] Click on "Purchase Orders" tab
- [ ] Verify PO cards display (3 purchase orders)
- [ ] Check each PO card shows:
  - PO Number
  - Vendor name
  - Description
  - Amount
  - Status badge
  - Request date
- [ ] Verify status color coding:
  - Approved = green
  - Pending CEO Approval = yellow
  - Pending = gray
- [ ] Check "Create PO" button is visible
- [ ] Click "Create PO" (shows alert for now)

#### Tab Navigation
- [ ] Switch between all 4 tabs multiple times
- [ ] Verify each tab loads instantly
- [ ] Check that stats cards remain visible across tabs
- [ ] Verify no console errors when switching

#### Data Persistence
- [ ] Refresh browser while on Finance page
- [ ] Verify all data still displays
- [ ] Check that the last active tab is remembered (or defaults to Budget)

**Expected Behavior**:
- Stats cards show correct calculations
- All amounts display in proper format (LKR with commas)
- Progress bars are proportional to percentages
- Tables are properly formatted and scrollable
- Status badges have correct colors
- Tabs switch smoothly without lag
- "Add Expense" and "Create PO" buttons show alerts (not yet implemented)
- Data persists across page refreshes

### 6. Navigation & Layout

#### Sidebar Navigation
- [ ] Verify sidebar shows all module links:
  - Dashboard
  - Orphans
  - Projects
  - Finance
  - HR (placeholder)
  - Proposals (placeholder)
  - Partners (placeholder)
  - Settings (placeholder)
- [ ] Click each link and verify it navigates correctly
- [ ] Check that active link is highlighted
- [ ] Verify icons appear next to each menu item

#### Navbar
- [ ] Verify navbar displays at top
- [ ] Check GERSL logo/title is visible
- [ ] Verify user name displays correctly
- [ ] Check user role badge displays
- [ ] Click logout button
- [ ] Verify logout redirects to login page

#### Responsive Layout
- [ ] Resize browser window to mobile size
- [ ] Check if layout adapts (basic responsiveness)
- [ ] Verify content is still accessible
- [ ] Test navigation on smaller screens

**Expected Behavior**:
- Navigation is smooth and instant
- Active page is clearly indicated
- Layout remains consistent across modules
- No broken links or 404 errors

### 7. Browser Console Testing

#### Check for Errors
- [ ] Open browser DevTools (F12)
- [ ] Go to Console tab
- [ ] Navigate through all modules
- [ ] Verify NO red error messages appear
- [ ] Check for warnings (yellow) - minor warnings are acceptable

#### Check Network Requests
- [ ] Go to Network tab
- [ ] Refresh page
- [ ] Verify all assets load successfully (no 404s)
- [ ] Check that no unnecessary requests are made

#### Check localStorage
- [ ] Go to Application tab (Chrome) or Storage tab (Firefox)
- [ ] Expand localStorage
- [ ] Verify these keys exist:
  - `gersl_user` (user session)
  - `gersl_orphans` (orphan data)
  - `gersl_visits` (visit records)
  - `gersl_projects` (project data)
  - `gersl_tasks` (task data)
  - `gersl_expenses` (expense data)
  - `gersl_payroll` (payroll data)
  - `gersl_budgets` (budget data)
  - `gersl_purchase_orders` (PO data)
- [ ] Verify data is stored as valid JSON
- [ ] Clear localStorage and refresh
- [ ] Verify app loads default sample data

**Expected Behavior**:
- No console errors during normal usage
- All assets load successfully
- localStorage contains all expected data
- Data structure is valid JSON
- App functions correctly after clearing localStorage

## Common Issues & Solutions

### Issue: Page shows "Loading..."
**Solution**: Check if dev server is running. Navigate to http://localhost:5174/

### Issue: Login doesn't work
**Solution**:
1. Check console for errors
2. Verify you're using correct credentials
3. Clear localStorage and try again
4. Check AuthContext.jsx is properly imported in App.jsx

### Issue: Data doesn't persist
**Solution**:
1. Check browser console for localStorage errors
2. Verify localStorage is not disabled
3. Check if browser is in private/incognito mode
4. Try different browser

### Issue: Module not loading
**Solution**:
1. Check if route is defined in AppRouter.jsx
2. Verify context provider is wrapped in App.jsx
3. Check component import paths
4. Look for console errors

### Issue: Styling looks broken
**Solution**:
1. Verify Tailwind CSS is loading
2. Check if custom components are imported correctly
3. Clear browser cache
4. Check for CSS conflicts

## Performance Notes

- Initial page load: < 1 second
- Navigation between pages: Instant (client-side routing)
- Search/filter operations: Real-time
- Modal open/close: Smooth animations
- Data persistence: Automatic on changes

## Next Steps After Testing

Once testing is complete and issues are identified:

1. **Report bugs** with:
   - Module name
   - Steps to reproduce
   - Expected vs actual behavior
   - Console errors (if any)
   - Screenshot (if helpful)

2. **Continue development** with remaining modules:
   - HR Module (4h)
   - Proposals Module (7h)
   - Partners Module (3h)
   - MEAL Module (3h)
   - Settings Module (3h)

3. **Enhancements** to consider:
   - Add form dialogs for creating/editing records
   - Implement backend API integration
   - Add export to Excel/PDF
   - Add file upload functionality
   - Improve mobile responsiveness
   - Add data validation
   - Add loading states
   - Add error boundaries

## Testing Completion Checklist

- [ ] All authentication flows tested
- [ ] All navigation links work
- [ ] All 4 modules tested thoroughly
- [ ] Search functionality works in all modules
- [ ] Filter functionality works in all modules
- [ ] Modals open and close properly
- [ ] Forms submit successfully
- [ ] Data persists across refreshes
- [ ] No console errors
- [ ] localStorage working correctly
- [ ] Responsive layout tested
- [ ] Logout works correctly

## Test Results Log

Use this section to log test results:

### Module: Authentication
- **Date**: _________
- **Tested By**: _________
- **Status**: ⬜ Pass / ⬜ Fail
- **Notes**: _________________________________________

### Module: Dashboard
- **Date**: _________
- **Tested By**: _________
- **Status**: ⬜ Pass / ⬜ Fail
- **Notes**: _________________________________________

### Module: Orphans
- **Date**: _________
- **Tested By**: _________
- **Status**: ⬜ Pass / ⬜ Fail
- **Notes**: _________________________________________

### Module: Projects
- **Date**: _________
- **Tested By**: _________
- **Status**: ⬜ Pass / ⬜ Fail
- **Notes**: _________________________________________

### Module: Finance
- **Date**: _________
- **Tested By**: _________
- **Status**: ⬜ Pass / ⬜ Fail
- **Notes**: _________________________________________

---

**Happy Testing!**

For questions or issues, refer to the documentation files:
- README.md
- ARCHITECTURE.md
- ORPHAN_MODULE_COMPLETE.md
- PROJECTS_MODULE_COMPLETE.md
- FINANCE_MODULE_COMPLETE.md
