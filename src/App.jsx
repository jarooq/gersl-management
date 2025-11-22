import React, { useEffect, useState, useCallback } from 'react';
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
import CommandPalette from './components/common/CommandPalette';
import useKeyboardShortcuts from './hooks/useKeyboardShortcuts';
import { initAnalytics } from './utils/analytics';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  useEffect(() => {
    initAnalytics();
  }, []);

  // Global keyboard shortcuts handlers
  const handleCommandPalette = useCallback(() => {
    setShowCommandPalette(prev => !prev);
  }, []);

  const handleEscape = useCallback(() => {
    // Close command palette if open
    if (showCommandPalette) {
      setShowCommandPalette(false);
    }
  }, [showCommandPalette]);

  const handleFocusSearch = useCallback(() => {
    // Focus the search input in the current page
    const searchInput = document.querySelector('input[type="search"], input[placeholder*="Search" i]');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  // Initialize keyboard shortcuts with custom handlers
  useKeyboardShortcuts({
    onCommandPalette: handleCommandPalette,
    onEscape: handleEscape,
    onFocusSearch: handleFocusSearch,
  });

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
                                              <CommandPalette
                                                isOpen={showCommandPalette}
                                                onClose={() => setShowCommandPalette(false)}
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
