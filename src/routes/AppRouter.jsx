import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PermissionRoute from '../components/common/PermissionRoute';
import { PERMISSIONS } from '../utils/permissions';
import CommandPalette from '../components/common/CommandPalette';

// Immediate imports (required for initial render)
import Login from '../pages/Login';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import MainLayout from '../components/layout/MainLayout';

// Public Portal Pages (lazy-loaded)
const PublicLayout = lazy(() => import('../public-portal/layouts/PublicLayout'));
const HomePage = lazy(() => import('../public-portal/pages/HomePage'));
const AboutPage = lazy(() => import('../public-portal/pages/AboutPage'));
const CampaignsListPage = lazy(() => import('../public-portal/pages/CampaignsListPage'));
const CampaignDetailPage = lazy(() => import('../public-portal/pages/CampaignDetailPage'));
const CareersPage = lazy(() => import('../public-portal/pages/CareersPage'));
const JobDetailPage = lazy(() => import('../public-portal/pages/JobDetailPage'));
const TendersPage = lazy(() => import('../public-portal/pages/TendersPage'));
const TenderDetailPage = lazy(() => import('../public-portal/pages/TenderDetailPage'));
const ContactPage = lazy(() => import('../public-portal/pages/ContactPage'));
const OrphansInNeedPage = lazy(() => import('../public-portal/pages/OrphansInNeedPage'));
const PrivacyPolicyPage = lazy(() => import('../public-portal/pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('../public-portal/pages/TermsOfServicePage'));

// Lazy-loaded page components (code splitting)
const Dashboard = lazy(() => import('../pages/Dashboard/Dashboard'));
const StaffDashboard = lazy(() => import('../pages/Dashboard/StaffDashboard'));
const ExecutiveDashboard = lazy(() => import('../pages/Dashboard/ExecutiveDashboard'));
const DashboardRedirect = lazy(() => import('../components/common/DashboardRedirect'));
const OrphansPage = lazy(() => import('../pages/Orphans/OrphansPage'));
const ProjectsPage = lazy(() => import('../pages/Projects/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../pages/Projects/ProjectDetailPage'));
const FinancePage = lazy(() => import('../pages/Finance/FinancePage'));
const HRPage = lazy(() => import('../pages/HR/HRPage'));
const AttendancePage = lazy(() => import('../pages/HR/AttendancePage'));
const OnboardingPage = lazy(() => import('../pages/HR/OnboardingPage'));
const StaffRegisterPage = lazy(() => import('../pages/HR/StaffRegisterPage'));
const AppraisalPage = lazy(() => import('../pages/HR/AppraisalPage'));
const ContractManagementPage = lazy(() => import('../pages/HR/ContractManagementPage'));
const PayrollPage = lazy(() => import('../pages/HR/PayrollPage'));
const WeeklyHoursPage = lazy(() => import('../pages/HR/WeeklyHoursPage'));
const SalaryAdvancesPage = lazy(() => import('../pages/HR/SalaryAdvancesPage'));
const StaffExpensesPage = lazy(() => import('../pages/HR/StaffExpensesPage'));
const FieldVisitsPage = lazy(() => import('../pages/Operations/FieldVisitsPage'));
const ProposalsPage = lazy(() => import('../pages/Proposals/ProposalsPage'));
const PartnersPage = lazy(() => import('../pages/Partners/PartnersPage'));
const MEALPage = lazy(() => import('../pages/MEAL/MEALPage'));
const SettingsPage = lazy(() => import('../pages/Settings/SettingsPage'));
const SystemSettingsPage = lazy(() => import('../pages/SystemSettings/SystemSettingsPage'));
const CBOPage = lazy(() => import('../pages/CBO/CBOPage'));
const SocialMediaPage = lazy(() => import('../pages/SocialMedia/SocialMediaPage'));
const SocialMediaSettings = lazy(() => import('../pages/SocialMedia/SocialMediaSettings'));
const ReportsPage = lazy(() => import('../pages/Reports/ReportsPage'));
const ActivitiesPage = lazy(() => import('../pages/Operations/ActivitiesPage'));
const TasksPage = lazy(() => import('../pages/Operations/TasksPage'));
const MyTasksPage = lazy(() => import('../pages/Operations/MyTasksPage'));
const ApprovalsPage = lazy(() => import('../pages/Approvals/ApprovalsPage'));
const CompliancePage = lazy(() => import('../pages/Compliance/CompliancePage'));
const CampaignsPage = lazy(() => import('../pages/Campaigns/CampaignsPage'));
const DonationsPage = lazy(() => import('../pages/Donations/DonationsPage'));
const JobPostingsPage = lazy(() => import('../pages/JobPostings/JobPostingsPage'));
const VendorCallsPage = lazy(() => import('../pages/VendorCalls/VendorCallsPage'));
const ProcurementInboxPage = lazy(() => import('../pages/Procurement/ProcurementInboxPage'));
const RFQWorkspacePage = lazy(() => import('../pages/Procurement/RFQWorkspacePage'));
const PODetailPage = lazy(() => import('../pages/Procurement/PODetailPage'));
const VendorsPage = lazy(() => import('../pages/Procurement/VendorsPage'));
const ProcurementDashboardPage = lazy(() => import('../pages/Procurement/ProcurementDashboardPage'));
const CashAccountsPage = lazy(() => import('../pages/Finance/CashAccountsPage'));
const CashBookPage = lazy(() => import('../pages/Finance/CashBookPage'));
const CashReplenishmentsPage = lazy(() => import('../pages/Finance/CashReplenishmentsPage'));
const MovementRegisterPage = lazy(() => import('../pages/Operations/MovementRegisterPage'));
const FuelClaimsPage = lazy(() => import('../pages/Operations/FuelClaimsPage'));
const FuelRatesPage = lazy(() => import('../pages/Operations/FuelRatesPage'));
const AnnouncementsAdminPage = lazy(() => import('../pages/Announcements/AnnouncementsAdminPage'));
const BeneficiariesPage = lazy(() => import('../pages/Beneficiaries/BeneficiariesPage'));
const CoordinatorsPage = lazy(() => import('../pages/Coordinators/CoordinatorsPage'));
const CoordinatorDetailsPage = lazy(() => import('../pages/Coordinators/CoordinatorDetailsPage'));

// WASH + IGP programme modules
const WashPage             = lazy(() => import('../pages/Wash/WashPage'));
const WashOrderDetailPage  = lazy(() => import('../pages/Wash/WashOrderDetailPage'));
const WashItemDetailPage   = lazy(() => import('../pages/Wash/WashItemDetailPage'));
const IgpPage              = lazy(() => import('../pages/Igp/IgpPage'));
const IgpOrderDetailPage   = lazy(() => import('../pages/Igp/IgpOrderDetailPage'));
const IgpItemDetailPage    = lazy(() => import('../pages/Igp/IgpItemDetailPage'));

// Shared beneficiary map (all programmes, layered)
const BeneficiaryMapPage   = lazy(() => import('../pages/Map/BeneficiaryMapPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-ink-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
      <p className="text-ink-600 font-medium">Loading...</p>
    </div>
  </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-ink-600">Loading...</p>
        </div>
      </div>
    );
  }

  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

const AppRouter = ({ showCommandPalette, setShowCommandPalette }) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - No authentication required */}
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <HomePage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/about"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <AboutPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/campaigns"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <CampaignsListPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/campaigns/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <CampaignDetailPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/careers"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <CareersPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/careers/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <JobDetailPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/tenders"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <TendersPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/tenders/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <TenderDetailPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/contact"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <ContactPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/orphans-in-need"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <OrphansInNeedPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/privacy"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <PrivacyPolicyPage />
              </PublicLayout>
            </Suspense>
          }
        />
        <Route
          path="/terms"
          element={
            <Suspense fallback={<PageLoader />}>
              <PublicLayout>
                <TermsOfServicePage />
              </PublicLayout>
            </Suspense>
          }
        />

        {/* Admin Login */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<Login />} />

        {/* Password-reset flow — public routes, no auth guard. The reset
            email's link lands at /reset-password?token=… which extracts the
            token from the query param. */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Public Staff Self-Registration — no auth required. Renders
            standalone (no admin sidebar) so anyone with the URL can fill
            their basics. Backend forces status='Pending' + role='Guest' so
            the account can't log in until HR activates it. */}
        <Route
          path="/staff-register"
          element={
            <Suspense fallback={<PageLoader />}>
              <StaffRegisterPage />
            </Suspense>
          }
        />

        {/* Protected Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={
              <Suspense fallback={<PageLoader />}>
                <DashboardRedirect />
              </Suspense>
            }
          />
          <Route
            path="dashboard"
            element={
              <PermissionRoute permission={PERMISSIONS.DASHBOARD_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <Dashboard />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="my-dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <StaffDashboard />
              </Suspense>
            }
          />
          <Route
            path="executive-dashboard"
            element={
              <Suspense fallback={<PageLoader />}>
                <ExecutiveDashboard />
              </Suspense>
            }
          />
          <Route
            path="orphans"
            element={
              <PermissionRoute permission={PERMISSIONS.ORPHANS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <OrphansPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="coordinators"
            element={
              <PermissionRoute permission={PERMISSIONS.ORPHANS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CoordinatorsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="coordinators/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.ORPHANS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CoordinatorDetailsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="beneficiaries"
            element={
              <PermissionRoute permission={PERMISSIONS.BENEFICIARIES_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <BeneficiariesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          {/* WASH module — water/sanitation/hygiene installations.
              Gated to PROJECTS_VIEW so field/coordinator/finance staff who
              already have project visibility get programme delivery too. */}
          <Route
            path="wash"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><WashPage /></Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="wash/orders/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><WashOrderDetailPage /></Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="wash/items/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><WashItemDetailPage /></Suspense>
              </PermissionRoute>
            }
          />

          {/* IGP module — income-generating asset distribution */}
          <Route
            path="igp"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><IgpPage /></Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="igp/orders/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><IgpOrderDetailPage /></Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="igp/items/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><IgpItemDetailPage /></Suspense>
              </PermissionRoute>
            }
          />

          {/* Unified beneficiary/programme map */}
          <Route
            path="map"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}><BeneficiaryMapPage /></Suspense>
              </PermissionRoute>
            }
          />

          <Route
            path="projects"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ProjectsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="projects/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ProjectDetailPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/activities"
            element={
              <PermissionRoute permission={PERMISSIONS.OPERATIONS_VIEW_ACTIVITIES}>
                <Suspense fallback={<PageLoader />}>
                  <ActivitiesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/tasks"
            element={
              <PermissionRoute permission={PERMISSIONS.OPERATIONS_VIEW_TASKS}>
                <Suspense fallback={<PageLoader />}>
                  <TasksPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/my-tasks"
            element={
              <PermissionRoute permission={PERMISSIONS.OPERATIONS_MY_TASKS}>
                <Suspense fallback={<PageLoader />}>
                  <MyTasksPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="finance"
            element={
              <PermissionRoute permission={PERMISSIONS.FINANCE_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <FinancePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="campaigns"
            element={
              <PermissionRoute permission={PERMISSIONS.CAMPAIGNS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CampaignsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="donations"
            element={
              <PermissionRoute permission={PERMISSIONS.DONATIONS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <DonationsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="job-postings"
            element={
              <PermissionRoute permission={PERMISSIONS.JOB_POSTINGS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <JobPostingsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="vendor-calls"
            element={
              <PermissionRoute permission={PERMISSIONS.VENDOR_CALLS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <VendorCallsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="procurement/inbox"
            element={
              <PermissionRoute permission={PERMISSIONS.PROCUREMENT_REQUEST_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ProcurementInboxPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="procurement/rfqs/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROCUREMENT_RFQ_CREATE}>
                <Suspense fallback={<PageLoader />}>
                  <RFQWorkspacePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="procurement/pos/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.PROCUREMENT_PO_DRAFT}>
                <Suspense fallback={<PageLoader />}>
                  <PODetailPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="procurement/vendors"
            element={
              <PermissionRoute permission={PERMISSIONS.PROCUREMENT_VENDOR_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <VendorsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="procurement/dashboard"
            element={
              <PermissionRoute permission={PERMISSIONS.PROCUREMENT_DASHBOARD_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ProcurementDashboardPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="finance/cash/accounts"
            element={
              <PermissionRoute permission={PERMISSIONS.CASH_ACCOUNTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CashAccountsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="finance/cash/accounts/:id"
            element={
              <PermissionRoute permission={PERMISSIONS.CASH_ACCOUNTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CashBookPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="finance/cash/replenishments"
            element={
              <PermissionRoute permission={PERMISSIONS.CASH_REPLENISHMENT_REQUEST}>
                <Suspense fallback={<PageLoader />}>
                  <CashReplenishmentsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          {/* Operations sub-pages — all require basic project visibility.
              Field staff with PROJECTS_VIEW use these for their day-to-day
              work; anyone without it doesn't see the sidebar links anyway. */}
          <Route
            path="operations/field-visits"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <FieldVisitsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/movements"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <MovementRegisterPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/fuel-claims"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <FuelClaimsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="operations/fuel-rates"
            element={
              <PermissionRoute permission={PERMISSIONS.PROJECTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <FuelRatesPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          {/* Announcement management gated to settings-manage (admin-side).
              Read-only announcement view for staff lives on the mobile app. */}
          <Route
            path="announcements"
            element={
              <PermissionRoute permission={PERMISSIONS.SETTINGS_MANAGE}>
                <Suspense fallback={<PageLoader />}>
                  <AnnouncementsAdminPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route path="hr">
            <Route
              index
              element={
                <PermissionRoute permission={PERMISSIONS.HR_VIEW}>
                  <Suspense fallback={<PageLoader />}>
                    <HRPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_VIEW_ATTENDANCE}>
                  <Suspense fallback={<PageLoader />}>
                    <AttendancePage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="onboarding"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_MANAGE_ONBOARDING}>
                  <Suspense fallback={<PageLoader />}>
                    <OnboardingPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="appraisal"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_MANAGE_APPRAISALS}>
                  <Suspense fallback={<PageLoader />}>
                    <AppraisalPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="contracts"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_MANAGE_CONTRACTS}>
                  <Suspense fallback={<PageLoader />}>
                    <ContractManagementPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="payroll"
              element={
                <PermissionRoute permission={PERMISSIONS.FINANCE_VIEW_PAYROLL}>
                  <Suspense fallback={<PageLoader />}>
                    <PayrollPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="weekly-hours"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_VIEW}>
                  <Suspense fallback={<PageLoader />}>
                    <WeeklyHoursPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="salary-advances"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_VIEW}>
                  <Suspense fallback={<PageLoader />}>
                    <SalaryAdvancesPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
            <Route
              path="staff-expenses"
              element={
                <PermissionRoute permission={PERMISSIONS.HR_VIEW}>
                  <Suspense fallback={<PageLoader />}>
                    <StaffExpensesPage />
                  </Suspense>
                </PermissionRoute>
              }
            />
          </Route>
          <Route
            path="proposals"
            element={
              <PermissionRoute permission={PERMISSIONS.PROPOSALS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ProposalsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="approvals"
            element={
              <PermissionRoute permission={PERMISSIONS.APPROVALS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ApprovalsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="partners"
            element={
              <PermissionRoute permission={PERMISSIONS.PARTNERS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <PartnersPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="meal"
            element={
              <PermissionRoute permission={PERMISSIONS.MEAL_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <MEALPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="social-media"
            element={
              <PermissionRoute permission={PERMISSIONS.SOCIAL_MEDIA_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <SocialMediaPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="social-media/settings"
            element={
              <PermissionRoute permission={PERMISSIONS.SETTINGS_MANAGE}>
                <Suspense fallback={<PageLoader />}>
                  <SocialMediaSettings />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="reports"
            element={
              <PermissionRoute permission={PERMISSIONS.REPORTS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <ReportsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="compliance"
            element={
              <PermissionRoute permission={PERMISSIONS.COMPLIANCE_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CompliancePage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="cbo"
            element={
              <PermissionRoute permission={PERMISSIONS.CBO_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <CBOPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="settings"
            element={
              <PermissionRoute permission={PERMISSIONS.SETTINGS_VIEW}>
                <Suspense fallback={<PageLoader />}>
                  <SettingsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
          <Route
            path="system-settings"
            element={
              <PermissionRoute permission={PERMISSIONS.SETTINGS_MANAGE}>
                <Suspense fallback={<PageLoader />}>
                  <SystemSettingsPage />
                </Suspense>
              </PermissionRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Command Palette - Rendered inside Router context */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />
    </BrowserRouter>
  );
};

export default AppRouter;
