import React, { createContext, useContext, useState } from 'react';
import { BeneficiaryAPI, BeneficiarySupportAPI } from '../services/api';

const BeneficiaryContext = createContext(null);

export const useBeneficiaries = () => {
  const context = useContext(BeneficiaryContext);
  if (!context) {
    throw new Error('useBeneficiaries must be used within a BeneficiaryProvider');
  }
  return context;
};

export const BeneficiaryProvider = ({ children }) => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });
  const [filters, setFilters] = useState({
    search: '',
    district: '',
    division: '',
    isVulnerable: '',
    isActive: 'true',
  });

  // Fetch beneficiaries with filters and pagination
  const fetchBeneficiaries = async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        page: params.page || pagination.currentPage,
        limit: params.limit || pagination.limit,
        ...filters,
        ...params,
      };

      const data = await BeneficiaryAPI.getAll(queryParams);
      setBeneficiaries(data.beneficiaries || []);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching beneficiaries:', error);
      setBeneficiaries([]);
    } finally {
      setLoading(false);
    }
  };

  // Check for duplicate by NIC
  const checkDuplicate = async (nic) => {
    try {
      const data = await BeneficiaryAPI.checkDuplicate(nic);
      return data;
    } catch (error) {
      console.error('Error checking duplicate:', error);
      throw error;
    }
  };

  // Get single beneficiary with full details
  const getBeneficiaryById = async (id) => {
    try {
      setLoading(true);
      const data = await BeneficiaryAPI.getById(id);
      setSelectedBeneficiary(data.beneficiary);
      return data;
    } catch (error) {
      console.error('Error fetching beneficiary:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // CRUD Operations for Beneficiaries
  const addBeneficiary = async (beneficiaryData) => {
    try {
      const createdBeneficiary = await BeneficiaryAPI.create(beneficiaryData);

      // Refresh the list to ensure consistency
      await fetchBeneficiaries();

      return createdBeneficiary;
    } catch (error) {
      console.error('Error creating beneficiary:', error);
      throw error;
    }
  };

  const updateBeneficiary = async (id, updates) => {
    try {
      const updatedBeneficiary = await BeneficiaryAPI.update(id, updates);

      // Update local state
      setBeneficiaries(beneficiaries.map(b => b.id === id ? updatedBeneficiary : b));

      if (selectedBeneficiary?.id === id) {
        setSelectedBeneficiary(updatedBeneficiary);
      }

      return updatedBeneficiary;
    } catch (error) {
      console.error('Error updating beneficiary:', error);
      throw error;
    }
  };

  const deleteBeneficiary = async (id) => {
    if (window.confirm('Are you sure you want to delete this beneficiary? This will also delete all associated support records.')) {
      try {
        await BeneficiaryAPI.delete(id);

        // Remove from local state
        setBeneficiaries(beneficiaries.filter(b => b.id !== id));

        if (selectedBeneficiary?.id === id) {
          setSelectedBeneficiary(null);
        }

        // Refresh to update pagination
        await fetchBeneficiaries();
      } catch (error) {
        console.error('Error deleting beneficiary:', error);
        throw error;
      }
    }
  };

  // Support History Operations
  const getBeneficiarySupport = async (beneficiaryId) => {
    try {
      const data = await BeneficiarySupportAPI.getBeneficiaryHistory(beneficiaryId);
      return data.supportHistory || [];
    } catch (error) {
      console.error('Error fetching support history:', error);
      throw error;
    }
  };

  const addSupport = async (supportData) => {
    try {
      const createdSupport = await BeneficiarySupportAPI.create(supportData);

      // Refresh beneficiary details if we're viewing one
      if (selectedBeneficiary?.id === supportData.beneficiary_id) {
        await getBeneficiaryById(supportData.beneficiary_id);
      }

      return createdSupport;
    } catch (error) {
      console.error('Error adding support:', error);
      throw error;
    }
  };

  const updateSupport = async (id, updates) => {
    try {
      const updatedSupport = await BeneficiarySupportAPI.update(id, updates);
      return updatedSupport;
    } catch (error) {
      console.error('Error updating support:', error);
      throw error;
    }
  };

  const deleteSupport = async (id) => {
    if (window.confirm('Are you sure you want to delete this support record?')) {
      try {
        await BeneficiarySupportAPI.delete(id);

        // Refresh selected beneficiary if viewing
        if (selectedBeneficiary) {
          await getBeneficiaryById(selectedBeneficiary.id);
        }
      } catch (error) {
        console.error('Error deleting support:', error);
        throw error;
      }
    }
  };

  // Statistics and Reports
  const getBeneficiaryStats = async (params = {}) => {
    try {
      const data = await BeneficiaryAPI.getStats(params);
      return data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  const getSupportStats = async (params = {}) => {
    try {
      const data = await BeneficiarySupportAPI.getStats(params);
      return data;
    } catch (error) {
      console.error('Error fetching support stats:', error);
      throw error;
    }
  };

  const generateReport = async (params = {}) => {
    try {
      const data = await BeneficiarySupportAPI.generateReport(params);
      return data;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  };

  // Location helpers
  const getDistricts = async () => {
    try {
      const districts = await BeneficiaryAPI.getDistricts();
      return districts;
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  };

  const getDivisions = async (district) => {
    try {
      const divisions = await BeneficiaryAPI.getDivisions(district);
      return divisions;
    } catch (error) {
      console.error('Error fetching divisions:', error);
      return [];
    }
  };

  const getGNDivisions = async (dsDivision) => {
    try {
      const gnDivisions = await BeneficiaryAPI.getGNDivisions(dsDivision);
      return gnDivisions;
    } catch (error) {
      console.error('Error fetching GN divisions:', error);
      return [];
    }
  };

  // Update filters
  const updateFilters = (newFilters) => {
    setFilters({ ...filters, ...newFilters });
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      district: '',
      division: '',
      isVulnerable: '',
      isActive: 'true',
    });
  };

  // Bulk import beneficiaries
  const bulkImportBeneficiaries = async (beneficiariesData, progressCallback) => {
    try {
      const result = await API.Beneficiary.bulkImport(beneficiariesData);
      await fetchBeneficiaries();  // Refresh list after import
      return result;
    } catch (error) {
      console.error('Error bulk importing beneficiaries:', error);
      throw error;
    }
  };

  const value = {
    // State
    beneficiaries,
    loading,
    selectedBeneficiary,
    pagination,
    filters,

    // Beneficiary Operations
    fetchBeneficiaries,
    checkDuplicate,
    getBeneficiaryById,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
    setSelectedBeneficiary,
    bulkImportBeneficiaries,

    // Support Operations
    getBeneficiarySupport,
    addSupport,
    updateSupport,
    deleteSupport,

    // Statistics & Reports
    getBeneficiaryStats,
    getSupportStats,
    generateReport,

    // Location helpers
    getDistricts,
    getDivisions,
    getGNDivisions,

    // Filter management
    updateFilters,
    clearFilters,
  };

  return (
    <BeneficiaryContext.Provider value={value}>
      {children}
    </BeneficiaryContext.Provider>
  );
};

export default BeneficiaryContext;
