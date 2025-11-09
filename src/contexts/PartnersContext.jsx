import React, { createContext, useContext, useState } from 'react';

const PartnersContext = createContext();

export const usePartners = () => {
  const context = useContext(PartnersContext);
  if (!context) {
    throw new Error('usePartners must be used within a PartnersProvider');
  }
  return context;
};

export const PartnersProvider = ({ children }) => {
  const [partners, setPartners] = useState([]);

  const [contributions, setContributions] = useState([]);

  const [communications, setCommunications] = useState([]);

  // CRUD Operations for Partners
  const addPartner = (partnerData) => {
    const newPartner = {
      ...partnerData,
      id: partners.length + 1,
      partnerCode: `PTR${String(partners.length + 1).padStart(3, '0')}`,
      totalContributions: 0,
      lastContribution: null
    };
    setPartners([...partners, newPartner]);
    return newPartner;
  };

  const updatePartner = (id, updatedData) => {
    setPartners(partners.map(partner =>
      partner.id === id ? { ...partner, ...updatedData } : partner
    ));
  };

  const deletePartner = (id) => {
    setPartners(partners.filter(partner => partner.id !== id));
    setContributions(contributions.filter(contribution => contribution.partnerId !== id));
    setCommunications(communications.filter(comm => comm.partnerId !== id));
  };

  // Contribution Operations
  const addContribution = (contributionData) => {
    const newContribution = {
      ...contributionData,
      id: contributions.length + 1,
      status: 'Received',
      receiptNumber: `RCT-${new Date().getFullYear()}-${String(contributions.length + 1).padStart(4, '0')}`
    };
    setContributions([...contributions, newContribution]);

    // Update partner's total contributions and last contribution date
    const partner = partners.find(p => p.id === contributionData.partnerId);
    if (partner) {
      updatePartner(partner.id, {
        totalContributions: partner.totalContributions + contributionData.amount,
        lastContribution: contributionData.date
      });
    }

    return newContribution;
  };

  const updateContribution = (id, updatedData) => {
    setContributions(contributions.map(contribution =>
      contribution.id === id ? { ...contribution, ...updatedData } : contribution
    ));
  };

  const deleteContribution = (id) => {
    const contribution = contributions.find(c => c.id === id);
    if (contribution) {
      const partner = partners.find(p => p.id === contribution.partnerId);
      if (partner) {
        updatePartner(partner.id, {
          totalContributions: partner.totalContributions - contribution.amount
        });
      }
    }
    setContributions(contributions.filter(contribution => contribution.id !== id));
  };

  // Communication Operations
  const addCommunication = (communicationData) => {
    const newCommunication = {
      ...communicationData,
      id: communications.length + 1,
      date: new Date().toISOString().split('T')[0]
    };
    setCommunications([...communications, newCommunication]);
    return newCommunication;
  };

  const updateCommunication = (id, updatedData) => {
    setCommunications(communications.map(comm =>
      comm.id === id ? { ...comm, ...updatedData } : comm
    ));
  };

  const deleteCommunication = (id) => {
    setCommunications(communications.filter(comm => comm.id !== id));
  };

  // Get Stats
  const getStats = () => {
    const activePartners = partners.filter(p => p.status === 'Active').length;
    const totalPartners = partners.length;
    const totalContributionsAmount = contributions.reduce((sum, c) => sum + c.amount, 0);

    // Count unique partner types
    const partnerTypes = [...new Set(partners.map(p => p.type))].length;

    // Calculate average contribution per partner
    const avgContribution = totalPartners > 0 ? Math.round(totalContributionsAmount / totalPartners) : 0;

    // Get pending follow-ups (next follow-up within 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pendingFollowUps = communications.filter(comm => {
      if (!comm.nextFollowUp) return false;
      const followUpDate = new Date(comm.nextFollowUp);
      return followUpDate >= today && followUpDate <= nextWeek;
    }).length;

    return {
      totalPartners,
      activePartners,
      totalContributions: totalContributionsAmount,
      partnerTypes,
      avgContribution,
      pendingFollowUps
    };
  };

  // Get partner by ID
  const getPartnerById = (id) => {
    return partners.find(p => p.id === id);
  };

  // Get contributions by partner
  const getContributionsByPartner = (partnerId) => {
    return contributions.filter(c => c.partnerId === partnerId);
  };

  // Get communications by partner
  const getCommunicationsByPartner = (partnerId) => {
    return communications.filter(c => c.partnerId === partnerId);
  };

  const value = {
    partners,
    contributions,
    communications,
    addPartner,
    updatePartner,
    deletePartner,
    addContribution,
    updateContribution,
    deleteContribution,
    addCommunication,
    updateCommunication,
    deleteCommunication,
    getStats,
    getPartnerById,
    getContributionsByPartner,
    getCommunicationsByPartner
  };

  return (
    <PartnersContext.Provider value={value}>
      {children}
    </PartnersContext.Provider>
  );
};
