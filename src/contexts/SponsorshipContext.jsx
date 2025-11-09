import React, { createContext, useContext, useState, useEffect } from 'react';

const SponsorshipContext = createContext(null);

// Helper function to record financial transaction
const recordSponsorshipIncome = (sponsorshipData) => {
  // This will be called when a sponsorship is created
  // It creates a financial record in localStorage for the Finance module

  const existingTransactions = JSON.parse(localStorage.getItem('gersl_bank_transactions') || '[]');

  const newTransaction = {
    id: Math.max(...existingTransactions.map(t => t.id || 0), 0) + 1,
    date: new Date().toISOString().split('T')[0],
    type: 'Income',
    category: 'Orphan Sponsorship',
    description: `Sponsorship for Orphan ID: ${sponsorshipData.orphanId} - ${sponsorshipData.paymentFrequency}`,
    amount: sponsorshipData.amount,
    paymentMethod: sponsorshipData.paymentMethod,
    status: 'Pending',
    reference: `SPONSOR-${sponsorshipData.orphanId}-${Date.now()}`,
    sponsorName: sponsorshipData.sponsorName,
    sponsorEmail: sponsorshipData.email,
    orphanId: sponsorshipData.orphanId,
    sponsorshipId: sponsorshipData.id,
    recurringType: sponsorshipData.paymentFrequency
  };

  existingTransactions.push(newTransaction);
  localStorage.setItem('gersl_bank_transactions', JSON.stringify(existingTransactions));

  return newTransaction;
};

export const useSponsorship = () => {
  const context = useContext(SponsorshipContext);
  if (!context) {
    throw new Error('useSponsorship must be used within a SponsorshipProvider');
  }
  return context;
};

export const SponsorshipProvider = ({ children }) => {
  const [sponsorships, setSponsorships] = useState([]);
  const [sponsors, setSponsors] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const storedSponsorships = localStorage.getItem('gersl_sponsorships');
    const storedSponsors = localStorage.getItem('gersl_sponsors');

    if (storedSponsorships) {
      try {
        setSponsorships(JSON.parse(storedSponsorships));
      } catch (error) {
        console.error('Error loading sponsorships:', error);
      }
    }

    if (storedSponsors) {
      try {
        setSponsors(JSON.parse(storedSponsors));
      } catch (error) {
        console.error('Error loading sponsors:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_sponsorships', JSON.stringify(sponsorships));
  }, [sponsorships]);

  useEffect(() => {
    localStorage.setItem('gersl_sponsors', JSON.stringify(sponsors));
  }, [sponsors]);

  // Create or update sponsor
  const upsertSponsor = (sponsorData) => {
    const existingSponsor = sponsors.find(s => s.email === sponsorData.email);

    if (existingSponsor) {
      setSponsors(sponsors.map(s =>
        s.email === sponsorData.email
          ? { ...s, ...sponsorData, lastDonationDate: new Date().toISOString() }
          : s
      ));
      return existingSponsor.id;
    } else {
      const newSponsor = {
        ...sponsorData,
        id: Math.max(...sponsors.map(s => s.id), 0) + 1,
        registrationDate: new Date().toISOString(),
        lastDonationDate: new Date().toISOString(),
        totalDonated: 0,
        activeSponsorship: 0
      };
      setSponsors([...sponsors, newSponsor]);
      return newSponsor.id;
    }
  };

  // Create sponsorship
  const createSponsorship = (sponsorshipData) => {
    const sponsorId = upsertSponsor({
      name: sponsorshipData.sponsorName,
      email: sponsorshipData.email,
      phone: sponsorshipData.phone,
      address: sponsorshipData.address || ''
    });

    const newSponsorship = {
      ...sponsorshipData,
      id: Math.max(...sponsorships.map(s => s.id), 0) + 1,
      sponsorId,
      startDate: new Date().toISOString(),
      status: 'Active',
      nextPaymentDate: calculateNextPaymentDate(sponsorshipData.paymentFrequency),
      totalPaid: 0,
      paymentCount: 0,
      createdAt: new Date().toISOString()
    };

    setSponsorships([...sponsorships, newSponsorship]);

    // Update sponsor stats
    setSponsors(sponsors.map(s =>
      s.id === sponsorId
        ? { ...s, activeSponsorship: s.activeSponsorship + 1 }
        : s
    ));

    // Record financial transaction
    recordSponsorshipIncome(newSponsorship);

    return newSponsorship;
  };

  // Calculate next payment date based on frequency
  const calculateNextPaymentDate = (frequency) => {
    const now = new Date();
    switch (frequency) {
      case 'Monthly':
        now.setMonth(now.getMonth() + 1);
        break;
      case 'Yearly':
        now.setFullYear(now.getFullYear() + 1);
        break;
      case 'Quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      default:
        return null; // One-time payment
    }
    return now.toISOString();
  };

  // Record payment
  const recordPayment = (sponsorshipId, amount, paymentMethod = 'Bank Transfer') => {
    setSponsorships(sponsorships.map(s => {
      if (s.id === sponsorshipId) {
        return {
          ...s,
          totalPaid: s.totalPaid + amount,
          paymentCount: s.paymentCount + 1,
          lastPaymentDate: new Date().toISOString(),
          nextPaymentDate: s.paymentFrequency !== 'One-time'
            ? calculateNextPaymentDate(s.paymentFrequency)
            : null
        };
      }
      return s;
    }));

    // Update sponsor total
    const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
    if (sponsorship) {
      setSponsors(sponsors.map(sp =>
        sp.id === sponsorship.sponsorId
          ? { ...sp, totalDonated: sp.totalDonated + amount }
          : sp
      ));
    }

    return {
      sponsorshipId,
      amount,
      paymentMethod,
      date: new Date().toISOString(),
      paymentNumber: sponsorship ? sponsorship.paymentCount + 1 : 1
    };
  };

  // Update sponsorship status
  const updateSponsorshipStatus = (sponsorshipId, status) => {
    setSponsorships(sponsorships.map(s =>
      s.id === sponsorshipId ? { ...s, status, updatedAt: new Date().toISOString() } : s
    ));

    // Update sponsor active count if cancelling
    if (status === 'Cancelled' || status === 'Completed') {
      const sponsorship = sponsorships.find(s => s.id === sponsorshipId);
      if (sponsorship) {
        setSponsors(sponsors.map(sp =>
          sp.id === sponsorship.sponsorId
            ? { ...sp, activeSponsorship: Math.max(0, sp.activeSponsorship - 1) }
            : sp
        ));
      }
    }
  };

  // Get sponsorships by orphan
  const getSponsorshipsByOrphan = (orphanId) => {
    return sponsorships.filter(s => s.orphanId === orphanId);
  };

  // Get active sponsorship for orphan
  const getActiveSponsorshipForOrphan = (orphanId) => {
    return sponsorships.find(s => s.orphanId === orphanId && s.status === 'Active');
  };

  // Get sponsorships by sponsor
  const getSponsorshipsBySponsor = (sponsorId) => {
    return sponsorships.filter(s => s.sponsorId === sponsorId);
  };

  // Get statistics
  const getStats = () => {
    const activeSponsors = sponsors.filter(s => s.activeSponsorship > 0).length;
    const totalSponsors = sponsors.length;
    const activeSponsorship = sponsorships.filter(s => s.status === 'Active').length;
    const totalRevenue = sponsorships.reduce((sum, s) => sum + s.totalPaid, 0);
    const monthlyRecurring = sponsorships
      .filter(s => s.status === 'Active' && s.paymentFrequency === 'Monthly')
      .reduce((sum, s) => sum + s.amount, 0);
    const yearlyRecurring = sponsorships
      .filter(s => s.status === 'Active' && s.paymentFrequency === 'Yearly')
      .reduce((sum, s) => sum + s.amount, 0);

    return {
      activeSponsors,
      totalSponsors,
      activeSponsorship,
      totalSponsorship: sponsorships.length,
      totalRevenue,
      monthlyRecurring,
      yearlyRecurring,
      averageDonation: totalSponsors > 0 ? totalRevenue / totalSponsors : 0
    };
  };

  // Get overdue payments
  const getOverduePayments = () => {
    const now = new Date();
    return sponsorships.filter(s =>
      s.status === 'Active' &&
      s.nextPaymentDate &&
      new Date(s.nextPaymentDate) < now
    );
  };

  // Update sponsorship
  const updateSponsorship = (sponsorshipId, updates) => {
    setSponsorships(sponsorships.map(s =>
      s.id === sponsorshipId
        ? { ...s, ...updates, updatedAt: new Date().toISOString() }
        : s
    ));
  };

  // Delete sponsorship
  const deleteSponsorship = (sponsorshipId) => {
    if (window.confirm('Are you sure you want to delete this sponsorship?')) {
      const sponsorship = sponsorships.find(s => s.id === sponsorshipId);

      setSponsorships(sponsorships.filter(s => s.id !== sponsorshipId));

      // Update sponsor stats
      if (sponsorship && sponsorship.status === 'Active') {
        setSponsors(sponsors.map(sp =>
          sp.id === sponsorship.sponsorId
            ? { ...sp, activeSponsorship: Math.max(0, sp.activeSponsorship - 1) }
            : sp
        ));
      }
    }
  };

  const value = {
    sponsorships,
    sponsors,
    createSponsorship,
    recordPayment,
    updateSponsorshipStatus,
    getSponsorshipsByOrphan,
    getActiveSponsorshipForOrphan,
    getSponsorshipsBySponsor,
    getStats,
    getOverduePayments,
    updateSponsorship,
    deleteSponsorship,
    upsertSponsor
  };

  return (
    <SponsorshipContext.Provider value={value}>
      {children}
    </SponsorshipContext.Provider>
  );
};
