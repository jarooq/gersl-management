import React, { useState, useEffect } from 'react';
import { useBeneficiaries } from '../../../contexts/BeneficiaryContext';
import { addBeneficiariesToTaskBulk, getTaskBeneficiaries } from '../../../services/taskBeneficiaryService';
import {
  X,
  Search,
  Users,
  CheckCircle,
  AlertCircle,
  User,
  MapPin,
  Phone,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Loader
} from 'lucide-react';

const BeneficiarySelectionModal = ({ isOpen, onClose, task, onBeneficiariesAdded }) => {
  const { beneficiaries, loading: beneficiariesLoading } = useBeneficiaries();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBeneficiaries, setSelectedBeneficiaries] = useState([]);
  const [existingBeneficiaries, setExistingBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    gender: '',
    beneficiaryType: '',
    district: '',
    ageRange: ''
  });

  // Selection options
  const [selectionOptions, setSelectionOptions] = useState({
    selectionStatus: 'Nominated',
    selectionNotes: ''
  });

  useEffect(() => {
    if (isOpen && task) {
      loadExistingBeneficiaries();
    }
  }, [isOpen, task]);

  const loadExistingBeneficiaries = async () => {
    if (!task?.id) return;

    try {
      const response = await getTaskBeneficiaries(task.id);
      if (response.success && response.data) {
        setExistingBeneficiaries(response.data.map(tb => tb.beneficiaryId));
      }
    } catch (err) {
      console.error('Error loading existing beneficiaries:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectionOptionChange = (e) => {
    const { name, value } = e.target;
    setSelectionOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleBeneficiarySelection = (beneficiaryId) => {
    setSelectedBeneficiaries(prev =>
      prev.includes(beneficiaryId)
        ? prev.filter(id => id !== beneficiaryId)
        : [...prev, beneficiaryId]
    );
  };

  const selectAll = () => {
    const availableBeneficiaryIds = filteredBeneficiaries
      .filter(b => !existingBeneficiaries.includes(b.id))
      .map(b => b.id);
    setSelectedBeneficiaries(availableBeneficiaryIds);
  };

  const clearSelection = () => {
    setSelectedBeneficiaries([]);
  };

  const handleSubmit = async () => {
    if (selectedBeneficiaries.length === 0) {
      setError('Please select at least one beneficiary');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await addBeneficiariesToTaskBulk(
        task.id,
        selectedBeneficiaries,
        selectionOptions
      );

      if (response.success) {
        setSuccessMessage(`Successfully added ${selectedBeneficiaries.length} beneficiaries to task`);
        onBeneficiariesAdded?.(response.data);

        // Reload existing beneficiaries
        await loadExistingBeneficiaries();

        // Clear selection
        clearSelection();

        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      console.error('Error adding beneficiaries:', err);
      setError(err.message || 'Failed to add beneficiaries to task');
    } finally {
      setLoading(false);
    }
  };

  // Filter beneficiaries based on search and filters
  const filteredBeneficiaries = beneficiaries?.filter(beneficiary => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      beneficiary.full_name?.toLowerCase().includes(searchLower) ||
      beneficiary.nic?.toLowerCase().includes(searchLower) ||
      beneficiary.primary_phone?.includes(searchTerm);

    // Gender filter
    const matchesGender = !filters.gender || beneficiary.gender === filters.gender;

    // Beneficiary type filter
    const matchesType = !filters.beneficiaryType || beneficiary.beneficiary_type === filters.beneficiaryType;

    // District filter
    const matchesDistrict = !filters.district || beneficiary.district === filters.district;

    // Age range filter
    let matchesAge = true;
    if (filters.ageRange && beneficiary.date_of_birth) {
      const age = new Date().getFullYear() - new Date(beneficiary.date_of_birth).getFullYear();
      switch (filters.ageRange) {
        case '0-18':
          matchesAge = age <= 18;
          break;
        case '19-35':
          matchesAge = age >= 19 && age <= 35;
          break;
        case '36-60':
          matchesAge = age >= 36 && age <= 60;
          break;
        case '60+':
          matchesAge = age > 60;
          break;
      }
    }

    return matchesSearch && matchesGender && matchesType && matchesDistrict && matchesAge;
  }) || [];

  const getUniqueValues = (field) => {
    const values = new Set(beneficiaries?.map(b => b[field]).filter(Boolean));
    return Array.from(values).sort();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">Select Beneficiaries</h2>
              <p className="text-blue-100">{task?.title}</p>
              {task?.targetBeneficiaries && (
                <p className="text-sm text-blue-100 mt-2">
                  Target: {task.targetBeneficiaries} beneficiaries |
                  Already selected: {existingBeneficiaries.length} |
                  Remaining: {Math.max(0, task.targetBeneficiaries - existingBeneficiaries.length)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm font-semibold text-green-900">Success</p>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-6 space-y-4 border-b border-gray-200">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, NIC, or phone number..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-semibold"
            >
              <Filter size={18} />
              Advanced Filters
              {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            <div className="text-sm text-gray-600">
              Showing {filteredBeneficiaries.length} of {beneficiaries?.length || 0} beneficiaries
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  name="beneficiaryType"
                  value={filters.beneficiaryType}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  {getUniqueValues('beneficiary_type').map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">District</label>
                <select
                  name="district"
                  value={filters.district}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Districts</option>
                  {getUniqueValues('district').map(district => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age Range</label>
                <select
                  name="ageRange"
                  value={filters.ageRange}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Ages</option>
                  <option value="0-18">0-18 years</option>
                  <option value="19-35">19-35 years</option>
                  <option value="36-60">36-60 years</option>
                  <option value="60+">60+ years</option>
                </select>
              </div>
            </div>
          )}

          {/* Selection Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Initial Status</label>
              <select
                name="selectionStatus"
                value={selectionOptions.selectionStatus}
                onChange={handleSelectionOptionChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Nominated">Nominated</option>
                <option value="Screened">Screened</option>
                <option value="Verified">Verified</option>
                <option value="Approved">Approved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Selection Notes (Optional)</label>
              <input
                type="text"
                name="selectionNotes"
                value={selectionOptions.selectionNotes}
                onChange={handleSelectionOptionChange}
                placeholder="e.g., Vulnerability assessment completed"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
            >
              Select All ({filteredBeneficiaries.filter(b => !existingBeneficiaries.includes(b.id)).length})
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold text-sm"
            >
              Clear Selection
            </button>
            <div className="flex-1 text-right text-sm font-semibold text-gray-700">
              {selectedBeneficiaries.length} selected
            </div>
          </div>
        </div>

        {/* Beneficiary List */}
        <div className="flex-1 overflow-y-auto p-6">
          {beneficiariesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="animate-spin text-blue-600" size={32} />
              <span className="ml-3 text-gray-600">Loading beneficiaries...</span>
            </div>
          ) : filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-gray-400 mb-4" size={48} />
              <p className="text-gray-600 font-semibold">No beneficiaries found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBeneficiaries.map(beneficiary => {
                const isExisting = existingBeneficiaries.includes(beneficiary.id);
                const isSelected = selectedBeneficiaries.includes(beneficiary.id);
                const age = beneficiary.date_of_birth
                  ? new Date().getFullYear() - new Date(beneficiary.date_of_birth).getFullYear()
                  : null;

                return (
                  <div
                    key={beneficiary.id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      isExisting
                        ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                        : isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => !isExisting && toggleBeneficiarySelection(beneficiary.id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          {beneficiary.full_name}
                          {isExisting && (
                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                              Already Added
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600">{beneficiary.nic}</p>
                      </div>
                      {!isExisting && (
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle size={16} className="text-white" />}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <User size={14} />
                        <span>{beneficiary.gender}, {age ? `${age}y` : 'Age N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Phone size={14} />
                        <span>{beneficiary.primary_phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 col-span-2">
                        <MapPin size={14} />
                        <span className="truncate">{beneficiary.district || 'N/A'}</span>
                      </div>
                    </div>

                    {beneficiary.beneficiary_type && (
                      <div className="mt-2">
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-semibold">
                          {beneficiary.beneficiary_type}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedBeneficiaries.length === 0}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={18} />
                Adding...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Add {selectedBeneficiaries.length} Beneficiaries
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeneficiarySelectionModal;
