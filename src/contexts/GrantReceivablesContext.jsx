import React, { createContext, useContext, useState, useEffect } from 'react';

const GrantReceivablesContext = createContext();

export const useGrantReceivables = () => {
  const context = useContext(GrantReceivablesContext);
  if (!context) {
    throw new Error('useGrantReceivables must be used within GrantReceivablesProvider');
  }
  return context;
};

export const GrantReceivablesProvider = ({ children }) => {
  // Load from localStorage or use default data
  const [grantReceivables, setGrantReceivables] = useState(() => {
    const saved = localStorage.getItem('grantReceivables');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist to localStorage whenever grantReceivables changes
  useEffect(() => {
    localStorage.setItem('grantReceivables', JSON.stringify(grantReceivables));
  }, [grantReceivables]);

  // Add new grant receivable
  const addGrantReceivable = (grantData) => {
    const newGrant = {
      ...grantData,
      id: Math.max(0, ...grantReceivables.map(g => g.id)) + 1,
      receivedAmount: grantData.receivedAmount || 0,
      status: grantData.receivedAmount === 0 ? 'Pending' :
              grantData.receivedAmount >= grantData.pledgeAmount ? 'Fully Received' :
              'Partially Received'
    };
    setGrantReceivables([...grantReceivables, newGrant]);
    return newGrant;
  };

  // Update grant receivable
  const updateGrantReceivable = (id, updates) => {
    setGrantReceivables(grantReceivables.map(grant => {
      if (grant.id === id) {
        const updated = { ...grant, ...updates };
        // Auto-update status based on received amount
        updated.status = updated.receivedAmount === 0 ? 'Pending' :
                        updated.receivedAmount >= updated.pledgeAmount ? 'Fully Received' :
                        'Partially Received';
        return updated;
      }
      return grant;
    }));
  };

  // Record receipt against grant
  const recordReceipt = (id, amount, receiptDate, notes) => {
    setGrantReceivables(grantReceivables.map(grant => {
      if (grant.id === id) {
        const newReceivedAmount = grant.receivedAmount + amount;
        return {
          ...grant,
          receivedAmount: newReceivedAmount,
          status: newReceivedAmount >= grant.pledgeAmount ? 'Fully Received' : 'Partially Received',
          lastReceiptDate: receiptDate,
          lastReceiptNotes: notes
        };
      }
      return grant;
    }));
  };

  // Delete grant receivable
  const deleteGrantReceivable = (id) => {
    setGrantReceivables(grantReceivables.filter(grant => grant.id !== id));
  };

  // Calculate totals
  const getTotals = () => {
    const totalPledged = grantReceivables.reduce((sum, grant) => sum + grant.pledgeAmount, 0);
    const totalReceived = grantReceivables.reduce((sum, grant) => sum + grant.receivedAmount, 0);
    const totalOutstanding = totalPledged - totalReceived;
    const pending = grantReceivables.filter(g => g.status === 'Pending').length;
    const partiallyReceived = grantReceivables.filter(g => g.status === 'Partially Received').length;
    const fullyReceived = grantReceivables.filter(g => g.status === 'Fully Received').length;

    return {
      totalPledged,
      totalReceived,
      totalOutstanding,
      pending,
      partiallyReceived,
      fullyReceived,
      total: grantReceivables.length
    };
  };

  // Get receivables by status
  const getByStatus = (status) => {
    return grantReceivables.filter(grant => grant.status === status);
  };

  // Get receivables by donor
  const getByDonor = (donorName) => {
    return grantReceivables.filter(grant => grant.donorName === donorName);
  };

  // Get overdue receivables
  const getOverdue = () => {
    const today = new Date();
    return grantReceivables.filter(grant => {
      const expectedDate = new Date(grant.expectedReceiptDate);
      return grant.status !== 'Fully Received' && expectedDate < today;
    });
  };

  // Get receivables by project category
  const getByProjectCategory = (category) => {
    return grantReceivables.filter(grant => grant.projectCategory === category);
  };

  // Get receivables by programme area
  const getByProgrammeArea = (area) => {
    return grantReceivables.filter(grant => grant.programmeArea === area);
  };

  // Get receivables by proposal
  const getByProposal = (proposalId) => {
    return grantReceivables.filter(grant => grant.proposalId === proposalId);
  };

  // Get summary by project category
  const getSummaryByCategory = () => {
    const summary = {};
    grantReceivables.forEach(grant => {
      if (!summary[grant.projectCategory]) {
        summary[grant.projectCategory] = {
          pledged: 0,
          received: 0,
          outstanding: 0,
          count: 0
        };
      }
      summary[grant.projectCategory].pledged += grant.pledgeAmount;
      summary[grant.projectCategory].received += grant.receivedAmount;
      summary[grant.projectCategory].outstanding += (grant.pledgeAmount - grant.receivedAmount);
      summary[grant.projectCategory].count += 1;
    });
    return summary;
  };

  // Get summary by donor
  const getSummaryByDonor = () => {
    const summary = {};
    grantReceivables.forEach(grant => {
      if (!summary[grant.donorName]) {
        summary[grant.donorName] = {
          pledged: 0,
          received: 0,
          outstanding: 0,
          count: 0,
          projects: []
        };
      }
      summary[grant.donorName].pledged += grant.pledgeAmount;
      summary[grant.donorName].received += grant.receivedAmount;
      summary[grant.donorName].outstanding += (grant.pledgeAmount - grant.receivedAmount);
      summary[grant.donorName].count += 1;
      if (!summary[grant.donorName].projects.includes(grant.projectCategory)) {
        summary[grant.donorName].projects.push(grant.projectCategory);
      }
    });
    return summary;
  };

  const value = {
    grantReceivables,
    addGrantReceivable,
    updateGrantReceivable,
    recordReceipt,
    deleteGrantReceivable,
    getTotals,
    getByStatus,
    getByDonor,
    getOverdue,
    getByProjectCategory,
    getByProgrammeArea,
    getByProposal,
    getSummaryByCategory,
    getSummaryByDonor
  };

  return (
    <GrantReceivablesContext.Provider value={value}>
      {children}
    </GrantReceivablesContext.Provider>
  );
};
