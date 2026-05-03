import React, { useState, useEffect } from 'react';
import { X, UserPlus } from 'lucide-react';
import API from '../../../services/api';

const AssignCoordinatorModal = ({ isOpen, onClose, orphan, onAssign }) => {
  const [coordinators, setCoordinators] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCoordinators();
    }
  }, [isOpen]);

  const loadCoordinators = async () => {
    setLoading(true);
    try {
      // Direct API call to bypass any caching issues
      const token = localStorage.getItem('accessToken');
      const apiUrl = import.meta.env.VITE_API_URL || 'https://api.erp-globalehsan.org/api';

      const response = await fetch(`${apiUrl}/coordinators`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const data = Array.isArray(result) ? result : (result?.coordinators || result?.data || []);
      console.log('Coordinators loaded:', data);
      setCoordinators(data);
    } catch (error) {
      console.error('Error loading coordinators:', error);
      setCoordinators([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selectedId) return;

    const coordinator = coordinators.find(c => c.id === parseInt(selectedId));
    if (coordinator) {
      onAssign(orphan.id, coordinator);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Assign Coordinator</h2>
          <button onClick={onClose} className="text-ink-500 hover:text-ink-700">
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-ink-600 mb-2">
            Assign coordinator for: <strong>{orphan.fullName}</strong>
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-ink-700 mb-2">
            Select Coordinator
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full px-3 py-2 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="">-- Select Coordinator --</option>
            {coordinators.map((coord) => (
              <option key={coord.id} value={coord.id}>
                {coord.name || coord.full_name || coord.fullName} - {coord.email}
              </option>
            ))}
          </select>
          {loading && <p className="text-sm text-ink-500 mt-1">Loading...</p>}
          {!loading && coordinators.length === 0 && (
            <p className="text-sm text-red-500 mt-1">No coordinators available</p>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-ink-200 text-ink-700 rounded-lg hover:bg-ink-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedId || loading}
            className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center gap-2 ${
              selectedId && !loading
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-ink-300 text-ink-500 cursor-not-allowed'
            }`}
          >
            <UserPlus size={18} />
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignCoordinatorModal;
