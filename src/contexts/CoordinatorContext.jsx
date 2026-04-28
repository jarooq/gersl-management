import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const CoordinatorContext = createContext();

export const useCoordinator = () => {
  const context = useContext(CoordinatorContext);
  if (!context) {
    throw new Error('useCoordinator must be used within a CoordinatorProvider');
  }
  return context;
};

export const CoordinatorProvider = ({ children }) => {
  const [coordinators, setCoordinators] = useState([]);
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);
  const [coordinatorStats, setCoordinatorStats] = useState(null);
  const [assignedOrphans, setAssignedOrphans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Get auth token from localStorage
  const getAuthToken = () => {
    const token = localStorage.getItem('accessToken');
    return token;
  };

  // Fetch all coordinators with stats
  const fetchCoordinators = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/coordinators`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoordinators(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching coordinators:', err);
      setError(err.response?.data?.error || 'Failed to fetch coordinators');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch single coordinator details
  const fetchCoordinatorById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/coordinators/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedCoordinator(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching coordinator:', err);
      setError(err.response?.data?.error || 'Failed to fetch coordinator');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch coordinator performance stats
  const fetchCoordinatorStats = async (id, period = 'monthly') => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/coordinators/${id}/stats`, {
        params: { period },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoordinatorStats(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching coordinator stats:', err);
      setError(err.response?.data?.error || 'Failed to fetch coordinator stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch orphans assigned to coordinator
  const fetchAssignedOrphans = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.get(`${API_URL}/coordinators/${id}/orphans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignedOrphans(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching assigned orphans:', err);
      setError(err.response?.data?.error || 'Failed to fetch assigned orphans');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Assign orphan to coordinator
  const assignOrphan = async (coordinatorId, orphanId) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${API_URL}/coordinators/${coordinatorId}/assign-orphan`,
        { orphanId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh assigned orphans list
      await fetchAssignedOrphans(coordinatorId);

      return response.data;
    } catch (err) {
      console.error('Error assigning orphan:', err);
      setError(err.response?.data?.error || 'Failed to assign orphan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Unassign orphan from coordinator
  const unassignOrphan = async (coordinatorId, orphanId) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const response = await axios.delete(
        `${API_URL}/coordinators/${coordinatorId}/orphans/${orphanId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh assigned orphans list
      await fetchAssignedOrphans(coordinatorId);

      return response.data;
    } catch (err) {
      console.error('Error unassigning orphan:', err);
      setError(err.response?.data?.error || 'Failed to unassign orphan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  const value = {
    // State
    coordinators,
    selectedCoordinator,
    coordinatorStats,
    assignedOrphans,
    loading,
    error,

    // Actions
    fetchCoordinators,
    fetchCoordinatorById,
    fetchCoordinatorStats,
    fetchAssignedOrphans,
    assignOrphan,
    unassignOrphan,
    clearError,
    setSelectedCoordinator
  };

  return (
    <CoordinatorContext.Provider value={value}>
      {children}
    </CoordinatorContext.Provider>
  );
};

export default CoordinatorContext;
