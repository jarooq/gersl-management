import React, { createContext, useState, useContext } from 'react';

const CampaignContext = createContext();

export const useCampaign = () => {
  const context = useContext(CampaignContext);
  if (!context) {
    throw new Error('useCampaign must be used within a CampaignProvider');
  }
  return context;
};

export const CampaignProvider = ({ children }) => {
  // Campaign Management State - Sample data for demonstration
  const [campaigns, setCampaigns] = useState([
    {
      id: 'CAMP-001',
      name: 'Education for All',
      description: 'Provide quality education and school supplies to underprivileged children in rural communities',
      category: 'Education',
      targetAmount: 50000,
      raisedAmount: 32500,
      status: 'Active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      createdDate: '2024-12-15',
      approvedBy: 'Admin',
      approvalDate: '2024-12-20'
    },
    {
      id: 'CAMP-002',
      name: 'Clean Water Initiative',
      description: 'Build wells and provide clean drinking water to communities in need',
      category: 'Health',
      targetAmount: 75000,
      raisedAmount: 45000,
      status: 'Active',
      startDate: '2025-01-15',
      endDate: '2025-11-30',
      createdDate: '2024-12-20',
      approvedBy: 'Admin',
      approvalDate: '2024-12-22'
    },
    {
      id: 'CAMP-003',
      name: 'Orphan Care Program',
      description: 'Comprehensive support including education, healthcare, and shelter for orphaned children',
      category: 'Orphan Care',
      targetAmount: 100000,
      raisedAmount: 68000,
      status: 'Active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      createdDate: '2024-12-10',
      approvedBy: 'Admin',
      approvalDate: '2024-12-15'
    },
    {
      id: 'CAMP-004',
      name: 'Emergency Relief Fund',
      description: 'Rapid response to natural disasters and humanitarian emergencies',
      category: 'Emergency',
      targetAmount: 150000,
      raisedAmount: 92000,
      status: 'Active',
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      createdDate: '2024-12-01',
      approvedBy: 'Admin',
      approvalDate: '2024-12-05'
    },
    {
      id: 'CAMP-005',
      name: 'Medical Aid Campaign',
      description: 'Provide essential medical supplies and healthcare services to underserved areas',
      category: 'Health',
      targetAmount: 60000,
      raisedAmount: 38000,
      status: 'Active',
      startDate: '2025-02-01',
      endDate: '2025-10-31',
      createdDate: '2024-12-18',
      approvedBy: 'Admin',
      approvalDate: '2024-12-20'
    },
    {
      id: 'CAMP-006',
      name: 'Food Security Project',
      description: 'Fight hunger by providing nutritious meals and food supplies to families in need',
      category: 'Food Security',
      targetAmount: 80000,
      raisedAmount: 55000,
      status: 'Active',
      startDate: '2025-01-10',
      endDate: '2025-12-15',
      createdDate: '2024-12-12',
      approvedBy: 'Admin',
      approvalDate: '2024-12-17'
    },
    {
      id: 'CAMP-007',
      name: 'Women Empowerment',
      description: 'Skills training and microfinance support for women entrepreneurs',
      category: 'Livelihood',
      targetAmount: 45000,
      raisedAmount: 28000,
      status: 'Active',
      startDate: '2025-02-01',
      endDate: '2025-11-30',
      createdDate: '2024-12-22',
      approvedBy: 'Admin',
      approvalDate: '2024-12-25'
    },
    {
      id: 'CAMP-008',
      name: 'Youth Development',
      description: 'Mentorship programs and vocational training for underprivileged youth',
      category: 'Education',
      targetAmount: 55000,
      raisedAmount: 35000,
      status: 'Active',
      startDate: '2025-01-20',
      endDate: '2025-12-20',
      createdDate: '2024-12-08',
      approvedBy: 'Admin',
      approvalDate: '2024-12-12'
    }
  ]);

  // Donations State
  const [donations, setDonations] = useState([]);

  // Donors State
  const [donors, setDonors] = useState([]);

  // Job Postings State (for Call for Vacancy) - Sample data
  const [jobPostings, setJobPostings] = useState([
    {
      id: 1,
      title: 'Project Manager - Community Development',
      department: 'Programs',
      location: 'Colombo',
      employmentType: 'Full-time',
      salaryRange: 'LKR 80,000 - 120,000',
      description: 'Lead community development projects and coordinate with stakeholders to deliver impactful programs for underprivileged communities.',
      requirements: [
        "Bachelor's degree in Social Sciences, Development Studies, or related field",
        '3+ years experience in project management',
        'Strong communication and leadership skills',
        'Experience working with NGOs or community organizations'
      ],
      responsibilities: [
        'Plan and execute community development projects',
        'Coordinate with team members and partners',
        'Monitor project progress and report outcomes',
        'Manage project budgets and resources'
      ],
      postedDate: '2025-01-15',
      applicationDeadline: '2025-02-28',
      status: 'Open'
    },
    {
      id: 2,
      title: 'Finance Officer',
      department: 'Finance',
      location: 'Colombo',
      employmentType: 'Full-time',
      salaryRange: 'LKR 60,000 - 90,000',
      description: 'Manage financial operations, budgeting, and reporting for our organization.',
      requirements: [
        'Degree in Accounting, Finance or related field',
        '2+ years accounting experience',
        'Proficiency in accounting software',
        'Strong analytical skills'
      ],
      responsibilities: [
        'Maintain financial records and reports',
        'Process invoices and payments',
        'Prepare budget reports',
        'Ensure compliance with financial regulations'
      ],
      postedDate: '2025-01-20',
      applicationDeadline: '2025-03-15',
      status: 'Open'
    },
    {
      id: 3,
      title: 'Field Coordinator',
      department: 'Operations',
      location: 'Jaffna',
      employmentType: 'Full-time',
      salaryRange: 'LKR 50,000 - 75,000',
      description: 'Coordinate field activities and support program implementation in Northern Province.',
      requirements: [
        "Bachelor's degree in any field",
        'Experience in field operations',
        'Fluency in Tamil and English',
        'Strong interpersonal skills'
      ],
      responsibilities: [
        'Coordinate field activities',
        'Support program implementation',
        'Conduct community outreach',
        'Report on field activities'
      ],
      postedDate: '2025-01-10',
      applicationDeadline: '2025-02-20',
      status: 'Open'
    }
  ]);

  // Vendor Calls State (for Call for Vendors) - Sample data
  const [vendorCalls, setVendorCalls] = useState([
    {
      id: 1,
      title: 'Supply of Educational Materials',
      referenceNumber: 'TENDER-2025-001',
      category: 'Office Supplies',
      description: 'Supply of notebooks, pens, pencils, and other educational materials for 500 students',
      estimatedValue: 250000,
      publishDate: '2025-01-15',
      submissionDeadline: '2025-02-15',
      requirements: ['Valid business registration', 'Tax compliance certificate', 'Sample products'],
      status: 'Active'
    },
    {
      id: 2,
      title: 'Construction of Water Wells',
      referenceNumber: 'TENDER-2025-002',
      category: 'Construction',
      description: 'Construction of 5 water wells in rural communities including drilling and installation of hand pumps',
      estimatedValue: 1500000,
      publishDate: '2025-01-20',
      submissionDeadline: '2025-03-01',
      requirements: ['Previous construction experience', 'Relevant licenses', 'Equipment availability'],
      status: 'Active'
    },
    {
      id: 3,
      title: 'IT Equipment Procurement',
      referenceNumber: 'TENDER-2025-003',
      category: 'IT Equipment',
      description: 'Supply of computers, printers, and networking equipment for office operations',
      estimatedValue: 800000,
      publishDate: '2025-01-25',
      submissionDeadline: '2025-02-25',
      requirements: ['Authorized dealer certificate', 'Warranty terms', 'Technical support capability'],
      status: 'Active'
    }
  ]);

  // Campaign CRUD Operations
  const addCampaign = (campaignData) => {
    const newCampaign = {
      ...campaignData,
      id: `CAMP-${String(campaigns.length + 1).padStart(3, '0')}`,
      raisedAmount: 0,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Pending Approval'
    };
    setCampaigns([...campaigns, newCampaign]);
    return newCampaign;
  };

  const updateCampaign = (id, updatedData) => {
    setCampaigns(campaigns.map(campaign =>
      campaign.id === id ? { ...campaign, ...updatedData } : campaign
    ));
  };

  const deleteCampaign = (id) => {
    setCampaigns(campaigns.filter(campaign => campaign.id !== id));
  };

  const approveCampaign = (id, approver) => {
    updateCampaign(id, {
      status: 'Active',
      approvedBy: approver,
      approvalDate: new Date().toISOString().split('T')[0]
    });
  };

  const closeCampaign = (id) => {
    updateCampaign(id, { status: 'Closed' });
  };

  const completeCampaign = (id) => {
    updateCampaign(id, { status: 'Completed' });
  };

  // Donation Operations
  const addDonation = (donationData) => {
    const newDonation = {
      ...donationData,
      id: `DON-${String(donations.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      receiptNumber: `RCP-${String(donations.length + 1).padStart(3, '0')}`,
      status: 'Completed'
    };
    setDonations([...donations, newDonation]);

    // Update campaign raised amount
    const campaign = campaigns.find(c => c.id === donationData.campaignId);
    if (campaign) {
      updateCampaign(campaign.id, {
        raisedAmount: campaign.raisedAmount + donationData.amount
      });
    }

    // Update or create donor
    const existingDonor = donors.find(d => d.email === donationData.email);
    if (existingDonor) {
      updateDonor(existingDonor.id, {
        totalDonations: existingDonor.totalDonations + donationData.amount,
        donationCount: existingDonor.donationCount + 1,
        lastDonationDate: newDonation.date
      });
    } else {
      addDonor({
        name: donationData.donorName,
        email: donationData.email,
        phone: donationData.phone || '',
        address: '',
        totalDonations: donationData.amount,
        donationCount: 1,
        firstDonationDate: newDonation.date,
        lastDonationDate: newDonation.date,
        preferences: { newsletter: false, taxReceipt: true },
        status: 'Active'
      });
    }

    return newDonation;
  };

  // Donor Operations
  const addDonor = (donorData) => {
    const newDonor = {
      ...donorData,
      id: `DONOR-${String(donors.length + 1).padStart(3, '0')}`
    };
    setDonors([...donors, newDonor]);
    return newDonor;
  };

  const updateDonor = (id, updatedData) => {
    setDonors(donors.map(donor =>
      donor.id === id ? { ...donor, ...updatedData } : donor
    ));
  };

  // Job Posting Operations
  const addJobPosting = (jobData) => {
    const newJob = {
      ...jobData,
      id: `JOB-${String(jobPostings.length + 1).padStart(3, '0')}`,
      postedDate: new Date().toISOString().split('T')[0],
      applicants: 0,
      status: 'Open'
    };
    setJobPostings([...jobPostings, newJob]);
    return newJob;
  };

  const updateJobPosting = (id, updatedData) => {
    setJobPostings(jobPostings.map(job =>
      job.id === id ? { ...job, ...updatedData } : job
    ));
  };

  const closeJobPosting = (id) => {
    updateJobPosting(id, { status: 'Closed' });
  };

  // Vendor Call Operations
  const addVendorCall = (vendorData) => {
    const newVendorCall = {
      ...vendorData,
      id: `VENDOR-${String(vendorCalls.length + 1).padStart(3, '0')}`,
      createdDate: new Date().toISOString().split('T')[0],
      bids: 0,
      status: 'Open'
    };
    setVendorCalls([...vendorCalls, newVendorCall]);
    return newVendorCall;
  };

  const updateVendorCall = (id, updatedData) => {
    setVendorCalls(vendorCalls.map(vendor =>
      vendor.id === id ? { ...vendor, ...updatedData } : vendor
    ));
  };

  const closeVendorCall = (id) => {
    updateVendorCall(id, { status: 'Closed' });
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
