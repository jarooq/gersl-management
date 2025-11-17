import React, { useEffect } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { OrphanProvider } from './contexts/OrphanContext';
import { CoordinatorProvider } from './contexts/CoordinatorContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { HRProvider } from './contexts/HRContext';
import { PartnersProvider } from './contexts/PartnersContext';
import { ProposalsProvider } from './contexts/ProposalsContext';
import { MEALProvider } from './contexts/MEALContext';
import { ComplianceProvider } from './contexts/ComplianceContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { CBOProvider } from './contexts/CBOContext';
import { GrantReceivablesProvider } from './contexts/GrantReceivablesContext';
import { FixedAssetsProvider } from './contexts/FixedAssetsContext';
import { DeferredRevenueProvider } from './contexts/DeferredRevenueContext';
import { CampaignProvider } from './contexts/CampaignContext';
import { SocialMediaProvider } from './contexts/SocialMediaContext';
import { SponsorshipProvider } from './contexts/SponsorshipContext';
import { ApprovalProvider } from './contexts/ApprovalContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ReportProvider } from './contexts/ReportContext';
import { BeneficiaryProvider } from './contexts/BeneficiaryContext';
import WorkflowIntegration from './components/workflow/WorkflowIntegration';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/common/ErrorBoundary';
import { initAnalytics } from './utils/analytics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrphanProvider>
          <CoordinatorProvider>
            <BeneficiaryProvider>
            <ProjectProvider>
              <NotificationProvider>
                <ReportProvider>
                <FinanceProvider>
                  <GrantReceivablesProvider>
                    <FixedAssetsProvider>
                      <DeferredRevenueProvider>
                        <HRProvider>
                        <PartnersProvider>
                          <ProposalsProvider>
                            <MEALProvider>
                              <ComplianceProvider>
                                <SettingsProvider>
                                  <CBOProvider>
                                    <CampaignProvider>
                                      <SocialMediaProvider>
                                        <SponsorshipProvider>
                                          <ApprovalProvider>
                                            <WorkflowIntegration>
                                              <AppRouter />
                                              <ToastContainer
                                                position="top-right"
                                                autoClose={3000}
                                                hideProgressBar={false}
                                                newestOnTop={false}
                                                closeOnClick
                                                rtl={false}
                                                pauseOnFocusLoss
                                                draggable
                                                pauseOnHover
                                                theme="light"
                                              />
                                            </WorkflowIntegration>
                                          </ApprovalProvider>
                                        </SponsorshipProvider>
                                      </SocialMediaProvider>
                                    </CampaignProvider>
                                  </CBOProvider>
                                </SettingsProvider>
                              </ComplianceProvider>
                            </MEALProvider>
                          </ProposalsProvider>
                        </PartnersProvider>
                      </HRProvider>
                    </DeferredRevenueProvider>
                  </FixedAssetsProvider>
                </GrantReceivablesProvider>
              </FinanceProvider>
              </ReportProvider>
            </NotificationProvider>
          </ProjectProvider>
          </BeneficiaryProvider>
          </CoordinatorProvider>
        </OrphanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
