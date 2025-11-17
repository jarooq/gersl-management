import React, { createContext, useState, useContext, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const CampaignContext = createContext();

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const CampaignProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  // State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Donations State
  const [donations, setDonations] = useState([]);

  // Donors State
  const [donors, setDonors] = useState([]);

  // Job Postings State (for Call for Vacancy)
  const [jobPostings, setJobPostings] = useState([]);

  // Vendor Calls State (for Call for Vendors)
  const [vendorCalls, setVendorCalls] = useState([]);

  // Load data from backend on mount
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const loadCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [
          campaignsRes,
          donationsRes,
          jobsRes,
          vendorsRes
        ] = await Promise.allSettled([
          API.Campaign.getAll(),
          API.Donation.getAll(),
          API.JobPosting.getAll(),
          API.VendorCall.getAll()
        ]);

        // Set campaigns data
        if (campaignsRes.status === 'fulfilled') {
          setCampaigns(campaignsRes.value.campaigns || []);
        } else {
          console.error('Error loading campaigns:', campaignsRes.reason);
        }

        // Set donations data
        if (donationsRes.status === 'fulfilled') {
          setDonations(donationsRes.value.donations || []);
        } else {
          console.error('Error loading donations:', donationsRes.reason);
        }

        // Set job postings data
        if (jobsRes.status === 'fulfilled') {
          setJobPostings(jobsRes.value.jobPostings || []);
        } else {
          console.error('Error loading job postings:', jobsRes.reason);
        }

        // Set vendor calls data
        if (vendorsRes.status === 'fulfilled') {
          setVendorCalls(vendorsRes.value.vendorCalls || []);
        } else {
          console.error('Error loading vendor calls:', vendorsRes.reason);
        }

      } catch (err) {
        console.error('Error loading campaign data:', err);
        setError(err.message || 'Failed to load campaign data');
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
    }, [isLoggedIn]);

  // Campaign CRUD Operations
  const addCampaign = async (campaignData) => {
    try {
      const newCampaign = await API.Campaign.create(campaignData);
      setCampaigns([...campaigns, newCampaign]);
      return newCampaign;
    } catch (err) {
      console.error('Error adding campaign:', err);
      throw err;
    }
  };

  const updateCampaign = async (id, updatedData) => {
    try {
      const updated = await API.Campaign.update(id, updatedData);
      setCampaigns(campaigns.map(campaign =>
        campaign.id === id ? updated : campaign
      ));
      return updated;
    } catch (err) {
      console.error('Error updating campaign:', err);
      throw err;
    }
  };

  const deleteCampaign = async (id) => {
    try {
      await API.Campaign.delete(id);
      setCampaigns(campaigns.filter(campaign => campaign.id !== id));
    } catch (err) {
      console.error('Error deleting campaign:', err);
      throw err;
    }
  };

  const approveCampaign = async (id, approvalStatus, remarks = '') => {
    try {
      const approved = await API.Campaign.approve(id, approvalStatus, remarks);
      setCampaigns(campaigns.map(campaign =>
        campaign.id === id ? approved : campaign
      ));
      return approved;
    } catch (err) {
      console.error('Error approving campaign:', err);
      throw err;
    }
  };

  const closeCampaign = async (id) => {
    try {
      return await updateCampaign(id, { status: 'Closed' });
    } catch (err) {
      console.error('Error closing campaign:', err);
      throw err;
    }
  };

  const completeCampaign = async (id) => {
    try {
      return await updateCampaign(id, { status: 'Completed' });
    } catch (err) {
      console.error('Error completing campaign:', err);
      throw err;
    }
  };

  // Donation Operations
  const addDonation = async (donationData) => {
    try {
      const newDonation = await API.Donation.create(donationData);
      setDonations([...donations, newDonation]);

      // Reload campaigns to get updated raised amounts
      const campaignsRes = await API.Campaign.getAll();
      if (campaignsRes.campaigns) {
        setCampaigns(campaignsRes.campaigns);
      }

      return newDonation;
    } catch (err) {
      console.error('Error adding donation:', err);
      throw err;
    }
  };

  // Donor Operations
  const addDonor = async (donorData) => {
    try {
      // Note: Donor API might not exist yet, handle gracefully
      const newDonor = {
        ...donorData,
        id: `DONOR-${String(donors.length + 1).padStart(3, '0')}`
      };
      setDonors([...donors, newDonor]);
      return newDonor;
    } catch (err) {
      console.error('Error adding donor:', err);
      throw err;
    }
  };

  const updateDonor = async (id, updatedData) => {
    try {
      setDonors(donors.map(donor =>
        donor.id === id ? { ...donor, ...updatedData } : donor
      ));
    } catch (err) {
      console.error('Error updating donor:', err);
      throw err;
    }
  };

  // Job Posting Operations
  const addJobPosting = async (jobData) => {
    try {
      const newJob = await API.JobPosting.create(jobData);
      setJobPostings([...jobPostings, newJob]);
      return newJob;
    } catch (err) {
      console.error('Error adding job posting:', err);
      throw err;
    }
  };

  const updateJobPosting = async (id, updatedData) => {
    try {
      const updated = await API.JobPosting.update(id, updatedData);
      setJobPostings(jobPostings.map(job =>
        job.id === id ? updated : job
      ));
      return updated;
    } catch (err) {
      console.error('Error updating job posting:', err);
      throw err;
    }
  };

  const closeJobPosting = async (id) => {
    try {
      return await updateJobPosting(id, { status: 'Closed' });
    } catch (err) {
      console.error('Error closing job posting:', err);
      throw err;
    }
  };

  // Vendor Call Operations
  const addVendorCall = async (vendorData) => {
    try {
      const newVendorCall = await API.VendorCall.create(vendorData);
      setVendorCalls([...vendorCalls, newVendorCall]);
      return newVendorCall;
    } catch (err) {
      console.error('Error adding vendor call:', err);
      throw err;
    }
  };

  const updateVendorCall = async (id, updatedData) => {
    try {
      const updated = await API.VendorCall.update(id, updatedData);
      setVendorCalls(vendorCalls.map(vendor =>
        vendor.id === id ? updated : vendor
      ));
      return updated;
    } catch (err) {
      console.error('Error updating vendor call:', err);
      throw err;
    }
  };

  const closeVendorCall = async (id) => {
    try {
      return await updateVendorCall(id, { status: 'Closed' });
    } catch (err) {
      console.error('Error closing vendor call:', err);
      throw err;
    }
  };

  // Statistics and Analytics
  const getCampaignStats = () => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter(c => c.status === 'Active').length;
    const totalRaised = campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
    const totalTarget = campaigns.reduce((sum, c) => sum + c.targetAmount, 0);
    const completedCampaigns = campaigns.filter(c => c.status === 'Completed').length;

    return {
      totalCampaigns,
      activeCampaigns,
      totalRaised,
      totalTarget,
      completedCampaigns,
      successRate: totalCampaigns > 0 ? ((completedCampaigns / totalCampaigns) * 100).toFixed(1) : 0
    };
  };

  const getDonationStats = () => {
    const totalDonations = donations.length;
    const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
    const averageDonation = totalDonations > 0 ? totalAmount / totalDonations : 0;

    return {
      totalDonations,
      totalAmount,
      averageDonation
    };
  };

  const value = {
    // State
    campaigns,
    donations,
    donors,
    jobPostings,
    vendorCalls,
    loading,
    error,

    // Campaign Operations
    addCampaign,
    updateCampaign,
    deleteCampaign,
    approveCampaign,
    closeCampaign,
    completeCampaign,

    // Donation Operations
    addDonation,

    // Donor Operations
    addDonor,
    updateDonor,

    // Job Posting Operations
    addJobPosting,
    updateJobPosting,
    closeJobPosting,

    // Vendor Call Operations
    addVendorCall,
    updateVendorCall,
    closeVendorCall,

    // Statistics
    getCampaignStats,
    getDonationStats
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
};
