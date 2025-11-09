import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { OrphanProvider } from './contexts/OrphanContext';
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
import { SponsorshipProvider } from './contexts/SponsorshipContext';
import { ApprovalProvider } from './contexts/ApprovalContext';
import AppRouter from './routes/AppRouter';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <OrphanProvider>
          <ProjectProvider>
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
                                  <SponsorshipProvider>
                                    <ApprovalProvider>
                                      <AppRouter />
                                    </ApprovalProvider>
                                  </SponsorshipProvider>
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
          </ProjectProvider>
        </OrphanProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
