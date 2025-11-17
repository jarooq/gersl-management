import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SafeguardingPolicyAPI,
  SafeguardingIncidentAPI,
  BackgroundCheckAPI,
  ComplianceTrainingAPI,
  DataProtectionAPI
} from '../services/api';
import { useAuth } from './AuthContext';

const ComplianceContext = createContext(null);

export const useCompliance = () => {
  const context = useContext(ComplianceContext);
  if (!context) {
    throw new Error('useCompliance must be used within a ComplianceProvider');
  }
  return context;
};

export const ComplianceProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  // State
  const [policies, setPolicies] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [backgroundChecks, setBackgroundChecks] = useState([]);
  const [trainingRecords, setTrainingRecords] = useState([]);
  const [dataProtection, setDataProtection] = useState({
    consentRecords: [],
    dataAccessRequests: [],
    dataBreaches: [],
    audits: [],
    lastAudit: null,
    nextAudit: null
  });
  const [loading, setLoading] = useState(true);

  // Load all compliance data from database
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        const [
          policiesRes,
          incidentsRes,
          backgroundChecksRes,
          trainingsRes,
          consentRes,
          darRes,
          breachesRes,
          auditsRes
        ] = await Promise.allSettled([
          SafeguardingPolicyAPI.getAll(),
          SafeguardingIncidentAPI.getAll(),
          BackgroundCheckAPI.getAll(),
          ComplianceTrainingAPI.getAll(),
          DataProtectionAPI.getConsentRecords(),
          DataProtectionAPI.getDataAccessRequests(),
          DataProtectionAPI.getDataBreaches(),
          DataProtectionAPI.getAuditRecords()
        ]);

        if (policiesRes.status === 'fulfilled') {
          setPolicies(policiesRes.value.policies || []);
        } else {
          console.error('Error loading policies:', policiesRes.reason);
        }

        if (incidentsRes.status === 'fulfilled') {
          setIncidents(incidentsRes.value.incidents || []);
        } else {
          console.error('Error loading incidents:', incidentsRes.reason);
        }

        if (backgroundChecksRes.status === 'fulfilled') {
          setBackgroundChecks(backgroundChecksRes.value.backgroundChecks || []);
        } else {
          console.error('Error loading background checks:', backgroundChecksRes.reason);
        }

        if (trainingsRes.status === 'fulfilled') {
          setTrainingRecords(trainingsRes.value.trainings || []);
        } else {
          console.error('Error loading trainings:', trainingsRes.reason);
        }

        // Data protection records
        const consentRecords = consentRes.status === 'fulfilled' ? consentRes.value : [];
        const dataAccessRequests = darRes.status === 'fulfilled' ? (darRes.value.requests || []) : [];
        const dataBreaches = breachesRes.status === 'fulfilled' ? breachesRes.value : [];
        const audits = auditsRes.status === 'fulfilled' ? (auditsRes.value.audits || []) : [];

        setDataProtection({
          consentRecords,
          dataAccessRequests,
          dataBreaches,
          audits,
          lastAudit: auditsRes.status === 'fulfilled' ? auditsRes.value.latestAudit : null,
          nextAudit: auditsRes.status === 'fulfilled' ? auditsRes.value.nextAuditDue : null
        });

      } catch (error) {
        console.error('Error loading compliance data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    }, [isLoggedIn]);

  // ============================================
  // POLICY MANAGEMENT
  // ============================================

  const addPolicy = async (policyData) => {
    try {
      const newPolicy = await SafeguardingPolicyAPI.create(policyData);
      setPolicies([...policies, newPolicy]);
      return newPolicy;
    } catch (err) {
      console.error('Error adding policy:', err);
      throw err;
    }
  };

  const updatePolicy = async (id, updates) => {
    try {
      const updatedPolicy = await SafeguardingPolicyAPI.update(id, updates);
      setPolicies(policies.map(p => p.id === id ? updatedPolicy : p));
      return updatedPolicy;
    } catch (err) {
      console.error('Error updating policy:', err);
      throw err;
    }
  };

  const deletePolicy = async (id) => {
    if (window.confirm('Are you sure you want to delete this policy?')) {
      try {
        await SafeguardingPolicyAPI.delete(id);
        setPolicies(policies.filter(p => p.id !== id));
      } catch (err) {
        console.error('Error deleting policy:', err);
        throw err;
      }
    }
  };

  const acknowledgePolicy = async (id, userId, userName) => {
    try {
      const updatedPolicy = await SafeguardingPolicyAPI.acknowledge(id, userId, userName);
      setPolicies(policies.map(p => p.id === id ? updatedPolicy : p));
      return updatedPolicy;
    } catch (err) {
      console.error('Error acknowledging policy:', err);
      throw err;
    }
  };

  // ============================================
  // INCIDENT MANAGEMENT
  // ============================================

  const addIncident = async (incidentData) => {
    try {
      const newIncident = await SafeguardingIncidentAPI.create(incidentData);
      setIncidents([...incidents, newIncident]);
      return newIncident;
    } catch (err) {
      console.error('Error adding incident:', err);
      throw err;
    }
  };

  const updateIncident = async (id, updates) => {
    try {
      const updatedIncident = await SafeguardingIncidentAPI.update(id, updates);
      setIncidents(incidents.map(i => i.id === id ? updatedIncident : i));
      return updatedIncident;
    } catch (err) {
      console.error('Error updating incident:', err);
      throw err;
    }
  };

  const deleteIncident = async (id) => {
    if (window.confirm('Are you sure you want to delete this incident record?')) {
      try {
        await SafeguardingIncidentAPI.delete(id);
        setIncidents(incidents.filter(i => i.id !== id));
      } catch (err) {
        console.error('Error deleting incident:', err);
        throw err;
      }
    }
  };

  const assignIncident = async (id, assignedTo) => {
    try {
      const updatedIncident = await SafeguardingIncidentAPI.assign(id, assignedTo);
      setIncidents(incidents.map(i => i.id === id ? updatedIncident : i));
      return updatedIncident;
    } catch (err) {
      console.error('Error assigning incident:', err);
      throw err;
    }
  };

  // ============================================
  // BACKGROUND CHECK MANAGEMENT
  // ============================================

  const addBackgroundCheck = async (checkData) => {
    try {
      const newCheck = await BackgroundCheckAPI.create(checkData);
      setBackgroundChecks([...backgroundChecks, newCheck]);
      return newCheck;
    } catch (err) {
      console.error('Error adding background check:', err);
      throw err;
    }
  };

  const updateBackgroundCheck = async (id, updates) => {
    try {
      const updatedCheck = await BackgroundCheckAPI.update(id, updates);
      setBackgroundChecks(backgroundChecks.map(b => b.id === id ? updatedCheck : b));
      return updatedCheck;
    } catch (err) {
      console.error('Error updating background check:', err);
      throw err;
    }
  };

  const deleteBackgroundCheck = async (id) => {
    if (window.confirm('Are you sure you want to delete this background check?')) {
      try {
        await BackgroundCheckAPI.delete(id);
        setBackgroundChecks(backgroundChecks.filter(b => b.id !== id));
      } catch (err) {
        console.error('Error deleting background check:', err);
        throw err;
      }
    }
  };

  // ============================================
  // TRAINING MANAGEMENT
  // ============================================

  const addTrainingRecord = async (trainingData) => {
    try {
      const newRecord = await ComplianceTrainingAPI.create(trainingData);
      setTrainingRecords([...trainingRecords, newRecord]);
      return newRecord;
    } catch (err) {
      console.error('Error adding training record:', err);
      throw err;
    }
  };

  const updateTrainingRecord = async (id, updates) => {
    try {
      const updatedRecord = await ComplianceTrainingAPI.update(id, updates);
      setTrainingRecords(trainingRecords.map(t => t.id === id ? updatedRecord : t));
      return updatedRecord;
    } catch (err) {
      console.error('Error updating training record:', err);
      throw err;
    }
  };

  const deleteTrainingRecord = async (id) => {
    if (window.confirm('Are you sure you want to delete this training record?')) {
      try {
        await ComplianceTrainingAPI.delete(id);
        setTrainingRecords(trainingRecords.filter(t => t.id !== id));
      } catch (err) {
        console.error('Error deleting training record:', err);
        throw err;
      }
    }
  };

  const addTrainingAttendee = async (id, attendee) => {
    try {
      const updatedTraining = await ComplianceTrainingAPI.addAttendee(id, attendee);
      setTrainingRecords(trainingRecords.map(t => t.id === id ? updatedTraining : t));
      return updatedTraining;
    } catch (err) {
      console.error('Error adding attendee:', err);
      throw err;
    }
  };

  const markTrainingAttendance = async (id, staffId, attended) => {
    try {
      const updatedTraining = await ComplianceTrainingAPI.markAttendance(id, staffId, attended);
      setTrainingRecords(trainingRecords.map(t => t.id === id ? updatedTraining : t));
      return updatedTraining;
    } catch (err) {
      console.error('Error marking attendance:', err);
      throw err;
    }
  };

  // ============================================
  // DATA PROTECTION MANAGEMENT
  // ============================================

  const addDataProtectionRecord = async (recordData) => {
    try {
      const newRecord = await DataProtectionAPI.create(recordData);

      // Update appropriate array based on record type
      setDataProtection(prev => {
        const updated = { ...prev };
        switch (newRecord.recordType) {
          case 'Consent':
            updated.consentRecords = [...prev.consentRecords, newRecord];
            break;
          case 'Data Access Request':
            updated.dataAccessRequests = [...prev.dataAccessRequests, newRecord];
            break;
          case 'Data Breach':
            updated.dataBreaches = [...prev.dataBreaches, newRecord];
            break;
          case 'Audit':
            updated.audits = [...prev.audits, newRecord];
            updated.lastAudit = newRecord;
            updated.nextAudit = newRecord.nextAuditDate;
            break;
        }
        return updated;
      });

      return newRecord;
    } catch (err) {
      console.error('Error adding data protection record:', err);
      throw err;
    }
  };

  const updateDataProtectionRecord = async (id, recordType, updates) => {
    try {
      const updatedRecord = await DataProtectionAPI.update(id, updates);

      setDataProtection(prev => {
        const updated = { ...prev };
        switch (recordType) {
          case 'Consent':
            updated.consentRecords = prev.consentRecords.map(r => r.id === id ? updatedRecord : r);
            break;
          case 'Data Access Request':
            updated.dataAccessRequests = prev.dataAccessRequests.map(r => r.id === id ? updatedRecord : r);
            break;
          case 'Data Breach':
            updated.dataBreaches = prev.dataBreaches.map(r => r.id === id ? updatedRecord : r);
            break;
          case 'Audit':
            updated.audits = prev.audits.map(r => r.id === id ? updatedRecord : r);
            if (updatedRecord.auditDate >= (prev.lastAudit?.auditDate || '')) {
              updated.lastAudit = updatedRecord;
              updated.nextAudit = updatedRecord.nextAuditDate;
            }
            break;
        }
        return updated;
      });

      return updatedRecord;
    } catch (err) {
      console.error('Error updating data protection record:', err);
      throw err;
    }
  };

  const deleteDataProtectionRecord = async (id, recordType) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await DataProtectionAPI.delete(id);

        setDataProtection(prev => {
          const updated = { ...prev };
          switch (recordType) {
            case 'Consent':
              updated.consentRecords = prev.consentRecords.filter(r => r.id !== id);
              break;
            case 'Data Access Request':
              updated.dataAccessRequests = prev.dataAccessRequests.filter(r => r.id !== id);
              break;
            case 'Data Breach':
              updated.dataBreaches = prev.dataBreaches.filter(r => r.id !== id);
              break;
            case 'Audit':
              updated.audits = prev.audits.filter(r => r.id !== id);
              // Recalculate last/next audit
              if (updated.audits.length > 0) {
                const latest = updated.audits.reduce((max, audit) =>
                  audit.auditDate > max.auditDate ? audit : max
                );
                updated.lastAudit = latest;
                updated.nextAudit = latest.nextAuditDate;
              } else {
                updated.lastAudit = null;
                updated.nextAudit = null;
              }
              break;
          }
          return updated;
        });
      } catch (err) {
        console.error('Error deleting data protection record:', err);
        throw err;
      }
    }
  };

  // ============================================
  // STATISTICS
  // ============================================

  const getStats = () => {
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(i => i.status === 'Resolved' || i.status === 'Closed').length;
    const activeIncidents = incidents.filter(i => i.status === 'Under Investigation' || i.status === 'In Progress').length;

    const expiringChecks = backgroundChecks.filter(b => {
      if (!b.expiryDate) return false;
      const daysUntilExpiry = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    const expiredChecks = backgroundChecks.filter(b => {
      if (!b.expiryDate) return false;
      return new Date(b.expiryDate) < new Date();
    }).length;

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
    trainingRecords,
    dataProtection,
    loading,

    // Policy Methods
    addPolicy,
    updatePolicy,
    deletePolicy,
    acknowledgePolicy,

    // Incident Methods
    addIncident,
    updateIncident,
    deleteIncident,
    assignIncident,

    // Background Check Methods
    addBackgroundCheck,
    updateBackgroundCheck,
    deleteBackgroundCheck,

    // Training Methods
    addTrainingRecord,
    updateTrainingRecord,
    deleteTrainingRecord,
    addTrainingAttendee,
    markTrainingAttendance,

    // Data Protection Methods
    addDataProtectionRecord,
    updateDataProtectionRecord,
    deleteDataProtectionRecord,
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
