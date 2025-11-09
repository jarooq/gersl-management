# GERSL Management System - Architecture Documentation

## 🏗️ Application Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    React Application                       │ │
│  │  ┌─────────────────────────────────────────────────────┐  │ │
│  │  │            App.jsx (Root Component)                  │  │ │
│  │  │  ┌───────────────────────────────────────────────┐  │  │ │
│  │  │  │         AuthProvider (Context)                │  │  │ │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │ │
│  │  │  │  │         AppRouter (Routes)             │  │  │  │ │
│  │  │  │  │  ┌───────────────────────────────────┐ │  │  │  │ │
│  │  │  │  │  │   Protected Routes              │ │  │  │  │ │
│  │  │  │  │  │                                   │ │  │  │  │ │
│  │  │  │  │  │   ┌─────────────────────────┐   │ │  │  │  │ │
│  │  │  │  │  │   │   MainLayout            │   │ │  │  │  │ │
│  │  │  │  │  │   │  ┌─────────┬──────────┐ │   │ │  │  │  │ │
│  │  │  │  │  │   │  │ Navbar  │          │ │   │ │  │  │  │ │
│  │  │  │  │  │   │  ├─────────┤  Pages   │ │   │ │  │  │  │ │
│  │  │  │  │  │   │  │ Sidebar │ (Outlet) │ │   │ │  │  │  │ │
│  │  │  │  │  │   │  │         │          │ │   │ │  │  │  │ │
│  │  │  │  │  │   │  └─────────┴──────────┘ │   │ │  │  │  │ │
│  │  │  │  │  │   └─────────────────────────┘   │ │  │  │  │ │
│  │  │  │  │  └───────────────────────────────────┘ │  │  │  │ │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │ │
│  │  │  └───────────────────────────────────────────────┘  │  │ │
│  │  └─────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Component Hierarchy

```
App
└── AuthProvider
    └── AppRouter (BrowserRouter)
        ├── /login → Login Page
        └── / → MainLayout (Protected)
            ├── Navbar
            ├── Sidebar
            └── Outlet (Page Content)
                ├── /dashboard → Dashboard
                ├── /orphans → OrphansPage
                ├── /projects → ProjectsPage
                ├── /finance → FinancePage
                ├── /hr → HRPage
                ├── /proposals → ProposalsPage
                ├── /partners → PartnersPage
                ├── /meal → Dashboard (placeholder)
                └── /settings → SettingsPage
```

## 🔄 Data Flow Architecture

### Current Implementation (Context API)

```
┌──────────────────────────────────────────────────────────────┐
│                     Context Layer                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Auth      │  │  Orphan    │  │  Project   │  ...        │
│  │  Context   │  │  Context   │  │  Context   │             │
│  └─────┬──────┘  └──────┬─────┘  └──────┬─────┘            │
│        │                │                │                   │
│        └────────────────┴────────────────┘                   │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Component Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Pages   │  │Components│  │  Hooks   │  │  Utils   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└──────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                   Storage Layer                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  localStorage (Session, User Preferences)             │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Future Implementation (With Backend)

```
┌──────────────────────────────────────────────────────────────┐
│                   Frontend (React)                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Context Layer (State Management)                      │  │
│  └───────────────────────┬────────────────────────────────┘  │
│                          │                                    │
│  ┌───────────────────────▼────────────────────────────────┐  │
│  │  Service Layer (API Calls)                             │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐              │  │
│  │  │ Auth     │ │ Orphan   │ │ Project  │  ...          │  │
│  │  │ Service  │ │ Service  │ │ Service  │              │  │
│  │  └──────────┘ └──────────┘ └──────────┘              │  │
│  └───────────────────────┬────────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────┘
                             │
                             │ HTTP/REST API
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                   Backend (Node.js/Express)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  API Routes Layer                                       │  │
│  │  /api/auth, /api/orphans, /api/projects, etc.         │  │
│  └───────────────────────┬────────────────────────────────┘  │
│                          │                                    │
│  ┌───────────────────────▼────────────────────────────────┐  │
│  │  Business Logic Layer (Controllers)                    │  │
│  └───────────────────────┬────────────────────────────────┘  │
│                          │                                    │
│  ┌───────────────────────▼────────────────────────────────┐  │
│  │  Data Access Layer (Models)                            │  │
│  └───────────────────────┬────────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────┘
                             │
┌────────────────────────────▼──────────────────────────────────┐
│                   Database (PostgreSQL/MongoDB)                │
│  Tables: users, orphans, projects, finances, etc.             │
└────────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. Enter credentials
     ▼
┌─────────────┐
│ Login Page  │
└─────┬───────┘
      │
      │ 2. Submit
      ▼
┌──────────────────┐
│  AuthContext     │
│  login(u, p)     │
└─────┬────────────┘
      │
      │ 3. Validate credentials
      │    (Check against USERS array)
      ▼
      ├─── ✅ Valid
      │         │
      │         │ 4. Store user in state
      │         │    Store in localStorage
      │         ▼
      │    ┌──────────────┐
      │    │  Navigate to │
      │    │  /dashboard  │
      │    └──────────────┘
      │
      └─── ❌ Invalid
                │
                │ 5. Show error
                ▼
           ┌──────────────┐
           │  Error msg   │
           └──────────────┘
```

## 🛣️ Routing Structure

```
/
├── /login (Public)
│   └── Login Component
│
└── / (Protected by ProtectedRoute)
    └── MainLayout
        ├── /dashboard
        │   └── Dashboard Page
        │       ├── Stats Cards
        │       ├── Recent Activity
        │       └── Upcoming Tasks
        │
        ├── /orphans
        │   └── Orphans Page
        │       ├── Orphan List
        │       ├── Orphan Profile
        │       ├── Visit Tracking
        │       └── Map View
        │
        ├── /projects
        │   └── Projects Page
        │       ├── Project List
        │       ├── Project Details
        │       ├── Task Management
        │       └── Budget Tracking
        │
        ├── /finance
        │   └── Finance Page
        │       ├── Budget Dashboard
        │       ├── Expenses
        │       ├── Payroll
        │       └── Purchase Orders
        │
        ├── /hr
        │   └── HR Page
        │       ├── Staff Management
        │       ├── Attendance
        │       ├── Leave Management
        │       └── Performance
        │
        ├── /proposals
        │   └── Proposals Page
        │       ├── Proposal List
        │       ├── AI Writer
        │       ├── Approval Workflow
        │       └── Donor Communication
        │
        ├── /partners
        │   └── Partners Page
        │       ├── Partner List
        │       ├── Donor List
        │       ├── Communication
        │       └── Reports
        │
        └── /settings
            └── Settings Page
                ├── User Management
                ├── Roles & Permissions
                ├── System Config
                └── Backup & Recovery
```

## 🎨 Component Architecture Pattern

### Feature Module Structure

Each feature module follows this pattern:

```
src/pages/[Feature]/
├── [Feature]Page.jsx          # Main page component
├── components/                # Feature-specific components
│   ├── [Feature]List.jsx     # List view
│   ├── [Feature]Card.jsx     # Card component
│   ├── [Feature]Form.jsx     # Create/Edit form
│   ├── [Feature]Details.jsx  # Detail view
│   └── [Feature]Filters.jsx  # Filter component
└── hooks/                     # Feature-specific hooks
    └── use[Feature].js        # Custom hook

src/contexts/
└── [Feature]Context.jsx       # State management

src/services/
└── [Feature]Service.js        # API calls (future)
```

### Example: Orphan Module

```
src/pages/Orphans/
├── OrphansPage.jsx
├── components/
│   ├── OrphanList.jsx
│   ├── OrphanCard.jsx
│   ├── OrphanForm.jsx
│   ├── OrphanProfile.jsx
│   ├── VisitForm.jsx
│   ├── OrphanMap.jsx
│   └── OrphanFilters.jsx
└── hooks/
    └── useOrphanFilters.js

src/contexts/
└── OrphanContext.jsx

src/services/
└── orphanService.js
```

## 📦 State Management Strategy

### Global State (Context API)
- **AuthContext**: User authentication, session management
- **OrphanContext**: Orphan data, visits, stipends
- **ProjectContext**: Projects, tasks, budgets
- **FinanceContext**: Finances, expenses, payroll
- **ProposalContext**: Proposals, AI data
- **PartnerContext**: Partners, donors
- **HRContext**: Staff, attendance, leave
- **NotificationContext**: System notifications

### Local State (Component useState)
- Form inputs
- UI state (modals, dropdowns)
- Temporary filters
- Loading states

### Persistent State (localStorage)
- User session
- User preferences
- Theme settings
- Recent searches

## 🔧 Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Stack                        │
├─────────────────────────────────────────────────────────┤
│  Framework:     React 19                                │
│  Router:        React Router v7                         │
│  Styling:       Tailwind CSS                            │
│  UI Library:    Radix UI                                │
│  Icons:         Lucide React                            │
│  State:         Context API + useState                  │
│  Build Tool:    Vite                                    │
│  Language:      JavaScript (JSX)                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Additional Libraries                    │
├─────────────────────────────────────────────────────────┤
│  PDF Generation:     jsPDF, jsPDF-AutoTable            │
│  Excel Export:       xlsx                               │
│  File Download:      file-saver                         │
│  Class Utils:        clsx, class-variance-authority     │
│  CSS Utils:          tailwind-merge                     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               Recommended Backend Stack                  │
├─────────────────────────────────────────────────────────┤
│  Runtime:       Node.js                                 │
│  Framework:     Express.js                              │
│  Database:      PostgreSQL or MongoDB                   │
│  ORM:           Prisma or Mongoose                      │
│  Auth:          JWT (jsonwebtoken)                      │
│  Validation:    Zod or Joi                              │
│  File Upload:   Multer                                  │
│  Email:         Nodemailer                              │
└─────────────────────────────────────────────────────────┘
```

## 🚀 Performance Considerations

### Current Optimizations
- Code splitting by route (React Router)
- Lazy loading of pages
- Vite's fast HMR (Hot Module Replacement)

### Future Optimizations
- React.memo for expensive components
- useMemo/useCallback for expensive computations
- Virtual scrolling for large lists
- Image optimization and lazy loading
- Service Worker for offline support
- CDN for static assets

## 🔒 Security Architecture

### Current Security
✅ Protected routes (redirect to login)
✅ Session persistence (localStorage)
✅ Client-side authentication

### Recommended Security Enhancements
- [ ] Hash passwords (bcrypt)
- [ ] JWT tokens instead of localStorage
- [ ] HTTPS only
- [ ] CSRF protection
- [ ] XSS protection
- [ ] SQL injection prevention (with ORM)
- [ ] Rate limiting
- [ ] Input validation
- [ ] File upload restrictions
- [ ] Role-based access control (RBAC)

## 📱 Responsive Design Strategy

```
Mobile First Approach with Tailwind CSS

sm:  640px  - Small devices (landscape phones)
md:  768px  - Medium devices (tablets)
lg:  1024px - Large devices (desktops)
xl:  1280px - Extra large devices
2xl: 1536px - 2X extra large devices

Example:
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  Mobile: 1 column
  Tablet: 2 columns
  Desktop: 4 columns
</div>
```

## 🧪 Testing Strategy (Recommended)

```
Unit Tests (Jest + React Testing Library)
├── Component tests
├── Hook tests
├── Utility function tests
└── Context tests

Integration Tests
├── User flows
├── Form submissions
├── Navigation
└── API integration

E2E Tests (Cypress or Playwright)
├── Login flow
├── Create orphan flow
├── Project management flow
└── Financial operations
```

---

**Document Version**: 1.0
**Last Updated**: November 6, 2025
**Architecture Status**: Foundation Complete, Modular Ready
