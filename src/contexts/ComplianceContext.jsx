import React, { createContext, useContext, useState, useEffect } from 'react';

const ComplianceContext = createContext(null);

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

export const ComplianceProvider = ({ children }) => {
  // Safeguarding Policies
  const [policies, setPolicies] = useState([]);

  // Safeguarding Incidents
  const [incidents, setIncidents] = useState([]);

  // Background Checks
  const [backgroundChecks, setBackgroundChecks] = useState([]);

  // Data Protection Records
  const [dataProtection, setDataProtection] = useState({
    consentRecords: [],
    dataAccessRequests: [],
    dataBreaches: [],
    lastAudit: null,
    nextAudit: null
  });

  // Training Records
  const [trainingRecords, setTrainingRecords] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gersl_compliance');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.policies) setPolicies(data.policies);
        if (data.incidents) setIncidents(data.incidents);
        if (data.backgroundChecks) setBackgroundChecks(data.backgroundChecks);
        if (data.dataProtection) setDataProtection(data.dataProtection);
        if (data.trainingRecords) setTrainingRecords(data.trainingRecords);
      } catch (error) {
        console.error('Error loading compliance data:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_compliance', JSON.stringify({
      policies,
      incidents,
      backgroundChecks,
      dataProtection,
      trainingRecords
    }));
  }, [policies, incidents, backgroundChecks, dataProtection, trainingRecords]);

  // Policy Management
  const addPolicy = (policyData) => {
    const newPolicy = {
      ...policyData,
      id: Math.max(...policies.map(p => p.id), 0) + 1,
      acknowledgedBy: [],
      status: 'Active'
    };
    setPolicies([...policies, newPolicy]);
    return newPolicy;
  };

  const updatePolicy = (id, updates) => {
    setPolicies(policies.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deletePolicy = (id) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      setPolicies(policies.filter(p => p.id !== id));
    }
  };

  // Incident Management
  const addIncident = (incidentData) => {
    const newIncident = {
      ...incidentData,
      id: Math.max(...incidents.map(i => i.id), 0) + 1,
      reportedDate: new Date().toISOString().split('T')[0],
      status: 'Under Investigation',
      resolvedDate: null
    };
    setIncidents([...incidents, newIncident]);
    return newIncident;
  };

  const updateIncident = (id, updates) => {
    setIncidents(incidents.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const deleteIncident = (id) => {
    if (window.confirm('Are you sure you want to delete this incident record?')) {
      setIncidents(incidents.filter(i => i.id !== id));
    }
  };

  // Background Check Management
  const addBackgroundCheck = (checkData) => {
    const newCheck = {
      ...checkData,
      id: Math.max(...backgroundChecks.map(b => b.id), 0) + 1,
      status: 'Valid'
    };
    setBackgroundChecks([...backgroundChecks, newCheck]);
    return newCheck;
  };

  const updateBackgroundCheck = (id, updates) => {
    setBackgroundChecks(backgroundChecks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  // Training Records Management
  const addTrainingRecord = (trainingData) => {
    const newRecord = {
      ...trainingData,
      id: Math.max(...trainingRecords.map(t => t.id), 0) + 1
    };
    setTrainingRecords([...trainingRecords, newRecord]);
    return newRecord;
  };

  const updateTrainingRecord = (id, updates) => {
    setTrainingRecords(trainingRecords.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Statistics
  const getStats = () => {
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved').length;
    const activeIncidents = incidents.filter(i => i.status === 'Under Investigation').length;
    const expiringChecks = backgroundChecks.filter(b => b.renewalDue < 30 && b.renewalDue > 0).length;
    const expiredChecks = backgroundChecks.filter(b => b.renewalDue < 0).length;
    const activePolicies = policies.filter(p => p.status === 'Active').length;

    return {
      totalIncidents,
      resolvedIncidents,
      activeIncidents,
      expiringChecks,
      expiredChecks,
      activePolicies,
      totalPolicies: policies.length,
      totalBackgroundChecks: backgroundChecks.length,
      totalTrainings: trainingRecords.length
    };
  };

  const value = {
    // State
    policies,
    incidents,
    backgroundChecks,
    dataProtection,
    trainingRecords,

    // Policy Methods
    addPolicy,
    updatePolicy,
    deletePolicy,

    // Incident Methods
    addIncident,
    updateIncident,
    deleteIncident,

    // Background Check Methods
    addBackgroundCheck,
    updateBackgroundCheck,

    // Training Methods
    addTrainingRecord,
    updateTrainingRecord,

    // Data Protection
    setDataProtection,

    // Stats
    getStats
  };

  return (
    <ComplianceContext.Provider value={value}>
      {children}
    </ComplianceContext.Provider>
  );
};
