import React, { useEffect, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { OrphanProvider } from './contexts/OrphanContext';
import { CoordinatorProvider } from './contexts/CoordinatorContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { HRProvider } from './contexts/HRContext';
import { PartnersProvider } from './contexts/PartnersContext';
import { ProposalsProvider } from './contexts/ProposalsContext';
import { MEALProvider } from './contexts/MEALContext';
import './styles/mobile-enhancements.css';
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
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    initAnalytics();
  }, []);

  // Global keyboard shortcuts (Cmd/Ctrl + K for command palette)
  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, ctrlKey, metaKey } = event;
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? metaKey : ctrlKey;

      // Cmd/Ctrl + K: Toggle command palette
      if (cmdOrCtrl && key === 'k') {
        event.preventDefault();
        setShowCommandPalette(prev => !prev);
      }

      // ESC: Close command palette
      if (key === 'Escape' && showCommandPalette) {
        event.preventDefault();
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showCommandPalette]);

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
                                              <AppRouter
                                                showCommandPalette={showCommandPalette}
                                                setShowCommandPalette={setShowCommandPalette}
                                              />
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
