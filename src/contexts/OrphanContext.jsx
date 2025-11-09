import React, { createContext, useContext, useState, useEffect } from 'react';
import { SRI_LANKA_DISTRICTS } from '../constants/sriLankaDistricts';

const OrphanContext = createContext(null);

export const useOrphans = () => {
  const context = useContext(OrphanContext);
  if (!context) {
    throw new Error('useOrphans must be used within an OrphanProvider');
  }
  return context;
};

export const OrphanProvider = ({ children }) => {
  const [orphans, setOrphans] = useState([]);

  const [pendingOrphans, setPendingOrphans] = useState([]);

  const [selectedOrphan, setSelectedOrphan] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('gersl_orphans');
    if (stored) {
      try {
        setOrphans(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading orphans:', error);
      }
    }
  }, []);

  // Save to localStorage when orphans change
  useEffect(() => {
    localStorage.setItem('gersl_orphans', JSON.stringify(orphans));
  }, [orphans]);

  // CRUD Operations
  const addOrphan = (orphanData) => {
    const newOrphan = {
      ...orphanData,
      id: Math.max(...orphans.map(o => o.id), 0) + 1,
      registrationDate: new Date().toISOString().split('T')[0],
      visits: [],
      totalStipendPaid: 0,
      status: "Active",
      // Sponsorship fields
      sponsorshipStatus: 'Not Sponsored',
      sponsorId: null,
      sponsorshipStartDate: null,
      sponsorshipEndDate: null,
      sponsorshipType: null,
      monthlyStipend: orphanData.stipendAmount || 5000
    };
    setOrphans([...orphans, newOrphan]);
    return newOrphan;
  };

  const updateOrphan = (id, updates) => {
    setOrphans(orphans.map(o => o.id === id ? { ...o, ...updates } : o));
  };

  const deleteOrphan = (id) => {
    if (window.confirm('Are you sure you want to delete this orphan?')) {
      setOrphans(orphans.filter(o => o.id !== id));
      if (selectedOrphan?.id === id) {
        setSelectedOrphan(null);
      }
    }
  };

  // Visit Management
  const addVisit = (orphanId, visitData) => {
    setOrphans(orphans.map(o => {
      if (o.id === orphanId) {
        const newVisit = {
          ...visitData,
          id: (o.visits?.length || 0) + 1,
          date: new Date().toISOString().split('T')[0]
        };
        return {
          ...o,
          visits: [...(o.visits || []), newVisit],
          lastVisitDate: newVisit.date
        };
      }
      return o;
    }));
  };

  // Approval Management
  const approvePendingOrphan = (id) => {
    const pending = pendingOrphans.find(p => p.id === id);
    if (pending) {
      const approved = {
        ...pending,
        status: "Active",
        approvalStatus: "Approved",
        approvedBy: "Programme Manager",
        approvalDate: new Date().toISOString().split('T')[0]
      };
      setOrphans([...orphans, approved]);
      setPendingOrphans(pendingOrphans.filter(p => p.id !== id));
    }
  };

  const rejectPendingOrphan = (id, reason) => {
    setPendingOrphans(pendingOrphans.map(p =>
      p.id === id ? { ...p, status: "Rejected", rejectionReason: reason } : p
    ));
  };

  // Filtering and Search
  const getOrphansByDistrict = (district) => {
    if (district === "All") return orphans;
    return orphans.filter(o => o.district === district);
  };

  const getOrphansByStatus = (status) => {
    if (status === "All") return orphans;
    return orphans.filter(o => o.status === status);
  };

  const searchOrphans = (query) => {
    const q = query.toLowerCase();
    return orphans.filter(o =>
      o.fullName.toLowerCase().includes(q) ||
      o.guardianName?.toLowerCase().includes(q) ||
      o.district.toLowerCase().includes(q) ||
      o.schoolName?.toLowerCase().includes(q)
    );
  };

  // Stats
  const getStats = () => {
    return {
      total: orphans.length,
      active: orphans.filter(o => o.status === "Active").length,
      pending: pendingOrphans.length,
      totalStipend: orphans.reduce((sum, o) => sum + (o.stipendAmount || 0), 0),
      needsVisit: orphans.filter(o => {
        if (!o.lastVisitDate) return true;
        const lastVisit = new Date(o.lastVisitDate);
        const now = new Date();
        const diffDays = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
        return diffDays > 30;
      }).length
    };
  };

  // Districts - Use constants from sriLankaDistricts.js
  const getDistricts = () => {
    return SRI_LANKA_DISTRICTS;
  };

  // Assign coordinator to orphan
  const assignCoordinator = (orphanId, coordinator) => {
    const updatedOrphans = orphans.map(orphan =>
      orphan.id === orphanId
        ? { ...orphan, assignedCoordinator: coordinator }
        : orphan
    );
    setOrphans(updatedOrphans);
    localStorage.setItem('orphans', JSON.stringify(updatedOrphans));
  };

  // Assign donor/partner to orphan (supports multiple partners)
  const assignDonor = (orphanId, assignmentData) => {
    const updatedOrphans = orphans.map(orphan => {
      if (orphan.id === orphanId) {
        // Initialize assignedPartners array if it doesn't exist
        const currentPartners = orphan.assignedPartners || [];

        // Add new assignment to the array
        const newAssignment = {
          partner: assignmentData.partner,
          project: assignmentData.project,
          supportType: assignmentData.supportType,
          assignedDate: new Date().toISOString().split('T')[0]
        };

        return {
          ...orphan,
          assignedPartners: [...currentPartners, newAssignment],
          // Keep legacy assignedDonor for backward compatibility with first assignment
          assignedDonor: currentPartners.length === 0 ? assignmentData.partner : orphan.assignedDonor
        };
      }
      return orphan;
    });

    setOrphans(updatedOrphans);
    localStorage.setItem('orphans', JSON.stringify(updatedOrphans));
  };

  const value = {
    orphans,
    pendingOrphans,
    selectedOrphan,
    setSelectedOrphan,
    addOrphan,
    updateOrphan,
    deleteOrphan,
    addVisit,
    approvePendingOrphan,
    rejectPendingOrphan,
    getOrphansByDistrict,
    getOrphansByStatus,
    searchOrphans,
    getStats,
    getDistricts,
    assignCoordinator,
    assignDonor
  };

  return (
    <OrphanContext.Provider value={value}>
      {children}
    </OrphanContext.Provider>
  );
};
