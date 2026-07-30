import React, { useState, useEffect } from 'react';
import { X, Shield, Save, AlertCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const AddRoleModal = ({ isOpen, onClose, onSuccess }) => {
  const { addRole, fetchPermissions, permissions: permissionsData } = useSettings();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [groupedPermissions, setGroupedPermissions] = useState({});

  // Fetch permissions when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen, fetchPermissions]);

  // Group permissions by module
  useEffect(() => {
    if (permissionsData?.grouped_permissions) {
      setGroupedPermissions(permissionsData.grouped_permissions);
    }
  }, [permissionsData]);

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', description: '', permissions: [] });
      setError(null);
      onClose();
    }
  };

  const handlePermissionToggle = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleModuleToggle = (moduleName) => {
    const modulePermissions = groupedPermissions[moduleName] || [];
    const modulePermissionIds = modulePermissions.map(p => p.id);
    const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));

    if (allSelected) {
      // Deselect all module permissions
      setFormData(prev => ({
        ...prev,
        permissions: prev.permissions.filter(id => !modulePermissionIds.includes(id))
      }));
    } else {
      // Select all module permissions
      setFormData(prev => ({
        ...prev,
        permissions: [...new Set([...prev.permissions, ...modulePermissionIds])]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError('Role name is required');
      return;
    }

    if (formData.permissions.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    setLoading(true);

    try {
      await addRole({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        permissions: formData.permissions
      });

      // Success
      if (onSuccess) {
        onSuccess();
      }
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create role');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-navy-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Add New Role</h2>
              <p className="text-purple-100 text-sm">Create a custom role with specific permissions</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </div>
          )}

          {/* Role Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Content Manager"
                className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the role"
                className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </div>

          {/* Permissions Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-ink-700">
                Permissions <span className="text-red-500">*</span>
              </label>
              <span className="text-sm text-ink-500">
                {formData.permissions.length} selected
              </span>
            </div>

            {/* Permissions Grid */}
            <div className="border border-ink-200 rounded-lg max-h-96 overflow-y-auto">
              {Object.entries(groupedPermissions).map(([moduleName, modulePermissions]) => {
                const modulePermissionIds = modulePermissions.map(p => p.id);
                const allSelected = modulePermissionIds.every(id => formData.permissions.includes(id));
                const someSelected = modulePermissionIds.some(id => formData.permissions.includes(id));

                return (
                  <div key={moduleName} className="border-b border-ink-200 last:border-b-0">
                    {/* Module Header */}
                    <div className="bg-ink-50 px-4 py-3 flex items-center justify-between sticky top-0">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleModuleToggle(moduleName)}
                          className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-orange-500"
                          disabled={loading}
                        />
                        <span className="font-semibold text-ink-900">{moduleName}</span>
                        <span className="text-xs text-ink-500">
                          ({modulePermissions.length} permissions)
                        </span>
                      </div>
                      {someSelected && !allSelected && (
                        <span className="text-xs text-purple-600 font-medium">Partial</span>
                      )}
                    </div>

                    {/* Module Permissions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                      {modulePermissions.map((permission) => (
                        <label
                          key={permission.id}
                          className="flex items-start gap-2 p-2 hover:bg-ink-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-orange-500"
                            disabled={loading}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-ink-900">
                              {permission.permission_name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-ink-500 mt-0.5">
                                {permission.description}
                              </div>
                            )}
                            <div className="text-xs text-ink-400 mt-0.5">
                              {permission.permission_key}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}

              {Object.keys(groupedPermissions).length === 0 && (
                <div className="p-8 text-center text-ink-500">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Loading permissions...</p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-ink-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-6 py-2 border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || formData.permissions.length === 0}
              className="px-6 py-2 bg-navy-900 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal;
