import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const PartnersContext = createContext();

export const usePartners = () => {
  const context = useContext(PartnersContext);
  if (!context) {
    throw new Error('usePartners must be used within a PartnersProvider');
  }
  return context;
};

export const PartnersProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch partners from backend - only when user is authenticated
  useEffect(() => {
    if (!isLoggedIn) {
      setPartners([]);
      setLoading(false);
      return;
    }

    const fetchPartners = async () => {
      try {
        setLoading(true);
        const data = await API.Partner.getAll();
        setPartners(data.partners || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching partners:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, [isLoggedIn]);

  // Manual fetch function for pages to call
  const fetchPartners = async () => {
    try {
      setLoading(true);
      const data = await API.Partner.getAll();
      setPartners(data.partners || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching partners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [contributions, setContributions] = useState([]);

  const [communications, setCommunications] = useState([]);

  // CRUD Operations for Partners
  const addPartner = async (partnerData) => {
    try {
      const newPartner = await API.Partner.create(partnerData);
      setPartners([...partners, newPartner]);
      return newPartner;
    } catch (err) {
      console.error('Error adding partner:', err);
      throw err;
    }
  };

  const updatePartner = async (id, updatedData) => {
    try {
      const updatedPartner = await API.Partner.update(id, updatedData);
      setPartners(partners.map(partner =>
        partner.id === id ? updatedPartner : partner
      ));
      return updatedPartner;
    } catch (err) {
      console.error('Error updating partner:', err);
      throw err;
    }
  };

  const deletePartner = async (id) => {
    try {
      await API.Partner.delete(id);
      setPartners(partners.filter(partner => partner.id !== id));
      setContributions(contributions.filter(contribution => contribution.partnerId !== id));
      setCommunications(communications.filter(comm => comm.partnerId !== id));
    } catch (err) {
      console.error('Error deleting partner:', err);
      throw err;
    }
  };

  // Contribution Operations
  const fetchContributions = async (partnerId) => {
    try {
      const data = await API.Partner.getContributions(partnerId);
      setContributions(data.contributions || []);
      return data.contributions || [];
    } catch (err) {
      console.error('Error fetching contributions:', err);
      throw err;
    }
  };

  const addContribution = async (partnerId, contributionData) => {
    try {
      const newContribution = await API.Partner.createContribution(partnerId, contributionData);
      setContributions([...contributions, newContribution]);

      // Refresh partner data to get updated totals
      await fetchPartners();

      return newContribution;
    } catch (err) {
      console.error('Error adding contribution:', err);
      throw err;
    }
  };

  const updateContribution = async (id, updatedData) => {
    try {
      const updated = await API.Partner.updateContribution(id, updatedData);
      setContributions(contributions.map(contribution =>
        contribution.id === id ? updated : contribution
      ));

      // Refresh partner data to get updated totals
      await fetchPartners();

      return updated;
    } catch (err) {
      console.error('Error updating contribution:', err);
      throw err;
    }
  };

  const deleteContribution = async (id) => {
    try {
      await API.Partner.deleteContribution(id);
      setContributions(contributions.filter(contribution => contribution.id !== id));

      // Refresh partner data to get updated totals
      await fetchPartners();
    } catch (err) {
      console.error('Error deleting contribution:', err);
      throw err;
    }
  };

  // Communication Operations
  const fetchCommunications = async (partnerId) => {
    try {
      const data = await API.Partner.getCommunications(partnerId);
      setCommunications(data.communications || []);
      return data.communications || [];
    } catch (err) {
      console.error('Error fetching communications:', err);
      throw err;
    }
  };

  const addCommunication = async (partnerId, communicationData) => {
    try {
      const newCommunication = await API.Partner.createCommunication(partnerId, communicationData);
      setCommunications([...communications, newCommunication]);
      return newCommunication;
    } catch (err) {
      console.error('Error adding communication:', err);
      throw err;
    }
  };

  const updateCommunication = async (id, updatedData) => {
    try {
      const updated = await API.Partner.updateCommunication(id, updatedData);
      setCommunications(communications.map(comm =>
        comm.id === id ? updated : comm
      ));
      return updated;
    } catch (err) {
      console.error('Error updating communication:', err);
      throw err;
    }
  };

  const deleteCommunication = async (id) => {
    try {
      await API.Partner.deleteCommunication(id);
      setCommunications(communications.filter(comm => comm.id !== id));
    } catch (err) {
      console.error('Error deleting communication:', err);
      throw err;
    }
  };

  // Get Stats - ensure arrays exist before processing
  const getStats = () => {
    // Ensure partners and other arrays are defined
    const safePartners = Array.isArray(partners) ? partners : [];
    const safeContributions = Array.isArray(contributions) ? contributions : [];
    const safeCommunications = Array.isArray(communications) ? communications : [];

    const activePartners = safePartners.filter(p => p.status === 'Active').length;
    const totalPartners = safePartners.length;
    const totalContributionsAmount = safeContributions.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

    // Count unique partner types
    const partnerTypes = [...new Set(safePartners.map(p => p.type).filter(Boolean))].length;

    // Calculate average contribution per partner
    const avgContribution = totalPartners > 0 ? Math.round(totalContributionsAmount / totalPartners) : 0;

    // Get pending follow-ups (next follow-up within 7 days)
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const pendingFollowUps = safeCommunications.filter(comm => {
      if (!comm.nextFollowUp) return false;
      const followUpDate = new Date(comm.nextFollowUp);
      return followUpDate >= today && followUpDate <= nextWeek;
    }).length;

    return {
      totalPartners,
      activePartners,
      totalContributions: totalContributionsAmount || 0,
      partnerTypes,
      avgContribution: avgContribution || 0,
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
    loading,
    error,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
    fetchContributions,
    addContribution,
    updateContribution,
    deleteContribution,
    fetchCommunications,
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
