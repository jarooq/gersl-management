import React, { useState } from 'react';
import { X, UserPlus, Search, Check, MapPin, Mail, Phone } from 'lucide-react';
import { useHR } from '../../../contexts/HRContext';

const AssignCoordinatorModal = ({ isOpen, onClose, orphan, onAssign }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoordinator, setSelectedCoordinator] = useState(null);

  // Get staff from HR context
  const { staff } = useHR();

  // Filter for active staff who can be coordinators
  // Include Field Coordinators, Project Managers, and Orphan Care Manager
  const coordinatorRoles = ['Field Coordinator', 'Project Manager', 'Orphan Care Manager', 'Operations Manager', 'MEAL Officer'];

  const coordinators = staff
    .filter(s => s.status === 'Active' && coordinatorRoles.includes(s.position))
    .map(s => ({
      id: s.id,
      name: s.fullName,
      position: s.position,
      district: s.address || 'All Districts',
      email: s.email,
      phone: s.phone,
      department: s.department
    }));

  const filteredCoordinators = coordinators.filter(coord =>
    coord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coord.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coord.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coord.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = () => {
    if (selectedCoordinator) {
      onAssign(orphan.id, selectedCoordinator);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Assign Coordinator</h2>
              </div>
              <p className="text-blue-100 mt-2">Select a coordinator for {orphan.fullName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-blue-700 rounded-lg transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search coordinators by name, position, or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Coordinator List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCoordinators.length > 0 ? (
            <div className="space-y-3">
              {filteredCoordinators.map((coordinator) => (
                <div
                  key={coordinator.id}
                  onClick={() => setSelectedCoordinator(coordinator)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedCoordinator?.id === coordinator.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-gray-900">{coordinator.name}</h3>
                        {selectedCoordinator?.id === coordinator.id && (
                          <Check className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                          {coordinator.position}
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded-full">
                          {coordinator.department}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <MapPin size={14} className="text-gray-400" />
                          <span>{coordinator.district}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Mail size={14} className="text-gray-400" />
                          <span>{coordinator.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Phone size={14} className="text-gray-400" />
                          <span>{coordinator.phone}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No coordinators found</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search query</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={!selectedCoordinator}
              className={`flex-1 px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2 ${
                selectedCoordinator
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <UserPlus size={18} />
              Assign Coordinator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignCoordinatorModal;
