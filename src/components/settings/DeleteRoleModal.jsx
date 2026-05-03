import React, { useState } from 'react';
import { X, AlertTriangle, Trash2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const DeleteRoleModal = ({ isOpen, onClose, role, onSuccess }) => {
  const { deleteRole } = useSettings();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setError(null);
    setLoading(true);

    try {
      await deleteRole(role.id);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !role) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop max-w-md w-full">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white">Delete Role</h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-ink-700 mb-4">
              Are you sure you want to delete the role <span className="font-semibold">"{role.name}"</span>?
            </p>

            {role.user_count > 0 ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-2">
                  Cannot delete this role
                </p>
                <p className="text-sm text-red-700">
                  This role is currently assigned to <span className="font-semibold">{role.user_count} user(s)</span>.
                  Please reassign these users to a different role before deleting.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Warning:</span> This action cannot be undone.
                  All permissions associated with this role will be removed.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading || role.user_count > 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={18} />
              {loading ? 'Deleting...' : 'Delete Role'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
