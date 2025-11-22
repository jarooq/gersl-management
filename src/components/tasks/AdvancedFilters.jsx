import React, { useState, useEffect, useCallback } from 'react';
import { X, Filter, Save, Trash2, ChevronDown } from 'lucide-react';

/**
 * Advanced Filters Component
 * Provides multi-criteria filtering for tasks with saved presets
 * Features: Status, Priority, Date Range, Assignee, Project filters
 * Can save and load filter presets from localStorage
 */
const AdvancedFilters = ({ onApplyFilters, onClose, projects = [], users = [] }) => {
  // Filter state
  const [filters, setFilters] = useState({
    status: [],
    priority: [],
    dateFrom: '',
    dateTo: '',
    assignee: [],
    project: [],
    searchTerm: ''
  });

  // Preset management
  const [savedPresets, setSavedPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('taskFilterPresets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading filter presets:', error);
      }
    }
  }, []);

  // Update filter value
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Toggle multi-select filter (for status, priority, etc.)
  const toggleArrayFilter = useCallback((key, value) => {
    setFilters(prev => {
      const currentArray = prev[key] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];

      return {
        ...prev,
        [key]: newArray
      };
    });
  }, []);

  // Apply filters
  const handleApplyFilters = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  // Reset filters
  const handleResetFilters = useCallback(() => {
    const emptyFilters = {
      status: [],
      priority: [],
      dateFrom: '',
      dateTo: '',
      assignee: [],
      project: [],
      searchTerm: ''
    };
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
  }, [onApplyFilters]);

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) {
      alert('Please enter a preset name');
      return;
    }

    const newPreset = {
      id: Date.now(),
      name: presetName.trim(),
      filters: { ...filters }
    };

    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    localStorage.setItem('taskFilterPresets', JSON.stringify(updatedPresets));

    setPresetName('');
    setShowSavePreset(false);
    alert(`Filter preset "${newPreset.name}" saved!`);
  }, [presetName, filters, savedPresets]);

  // Load a saved preset
  const handleLoadPreset = useCallback((preset) => {
    setFilters(preset.filters);
  }, []);

  // Delete a preset
  const handleDeletePreset = useCallback((presetId) => {
    if (!confirm('Delete this filter preset?')) return;

    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    localStorage.setItem('taskFilterPresets', JSON.stringify(updatedPresets));
  }, [savedPresets]);

  // Check if any filters are active
  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.priority.length > 0 ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.assignee.length > 0 ||
    filters.project.length > 0 ||
    filters.searchTerm;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Filter className="text-indigo-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Advanced Filters</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {['To Do', 'In Progress', 'Completed', 'On Hold'].map(status => (
                <button
                  key={status}
                  onClick={() => toggleArrayFilter('status', status)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    filters.status.includes(status)
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {['Low', 'Medium', 'High', 'Urgent'].map(priority => (
                <button
                  key={priority}
                  onClick={() => toggleArrayFilter('priority', priority)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all ${
                    filters.priority.includes(priority)
                      ? priority === 'High' || priority === 'Urgent'
                        ? 'bg-red-600 text-white border-red-600'
                        : priority === 'Medium'
                        ? 'bg-orange-600 text-white border-orange-600'
                        : 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                  }`}
                >
                  {priority}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date To
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Project Filter */}
          {projects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {projects.map(project => (
                  <label key={project.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={filters.project.includes(project.id)}
                      onChange={() => toggleArrayFilter('project', project.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{project.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Assignee Filter */}
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {users.map(user => (
                  <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={filters.assignee.includes(user.id)}
                      onChange={() => toggleArrayFilter('assignee', user.id)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search in Title/Description
            </label>
            <input
              type="text"
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              placeholder="Enter search term..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saved Filter Presets
              </label>
              <div className="space-y-2">
                {savedPresets.map(preset => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <button
                      onClick={() => handleLoadPreset(preset)}
                      className="flex-1 text-left text-sm font-medium text-gray-900"
                    >
                      {preset.name}
                    </button>
                    <button
                      onClick={() => handleDeletePreset(preset.id)}
                      className="p-2 hover:bg-red-100 rounded transition-colors"
                      title="Delete preset"
                    >
                      <Trash2 size={16} className="text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save Current Filters as Preset */}
          {hasActiveFilters && (
            <div>
              {!showSavePreset ? (
                <button
                  onClick={() => setShowSavePreset(true)}
                  className="w-full px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Save Current Filters as Preset
                </button>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="Enter preset name..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePreset}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setShowSavePreset(false);
                        setPresetName('');
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleResetFilters}
            className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Reset All
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <Filter size={18} />
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedFilters;
