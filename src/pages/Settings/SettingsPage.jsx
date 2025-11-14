import React, { useState, useEffect } from 'react';
import {
  Users, Shield, Settings as SettingsIcon, Save, UserPlus, Edit2, Trash2,
  Check, X, Search, Filter, AlertCircle, CheckCircle, Plus, Eye
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../utils/permissions';
import UserFormModal from '../../components/settings/UserFormModal';

const SettingsPage = () => {
  const { users, roles, permissions, addUser, updateUser, deleteUser, updateRole, systemSettings, fetchUsers } = useSettings();

  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const tabs = [
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield },
    { id: 'system', name: 'System Settings', icon: SettingsIcon }
  ];

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // User form handlers
  const handleAddUser = async (userData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await addUser(userData);
      setShowAddUserForm(false);
      alert('User created successfully! The password has been generated and should be shared securely with the user.');
    } catch (error) {
      setSubmitError(error.message || 'Failed to create user');
      alert(error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userData) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await updateUser(editingUser.id, userData);
      setEditingUser(null);
      alert('User updated successfully!');
    } catch (error) {
      setSubmitError(error.message || 'Failed to update user');
      alert(error.message || 'Failed to update user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        await deleteUser(id);
        alert('User deleted successfully!');
      } catch (error) {
        alert(error.message || 'Failed to delete user');
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <SettingsIcon className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-3xl font-bold mb-2">Settings & Administration</h1>
              <p className="text-white/90 text-lg">Manage users, roles, permissions, and system configuration</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{users.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-green-600">{users.filter(u => u.status === 'Active').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Roles</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(roles).length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Departments</p>
              <p className="text-3xl font-bold text-gray-900">{new Set(users.filter(u => u.department).map(u => u.department)).size}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-3 px-8 py-4 font-semibold transition-all duration-200
                    ${activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-8">
          {activeTab === 'users' && (
            <UsersTab
              users={filteredUsers}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              filterRole={filterRole}
              setFilterRole={setFilterRole}
              roles={roles}
              setShowAddUserForm={setShowAddUserForm}
              setEditingUser={setEditingUser}
              handleDeleteUser={handleDeleteUser}
            />
          )}

          {activeTab === 'roles' && (
            <RolesTab
              roles={roles}
              permissions={permissions}
              editingRole={editingRole}
              setEditingRole={setEditingRole}
              updateRole={updateRole}
            />
          )}

          {activeTab === 'system' && (
            <SystemTab systemSettings={systemSettings} />
          )}
        </div>
      </div>

      {/* User Form Modals */}
      <UserFormModal
        isOpen={showAddUserForm}
        onClose={() => setShowAddUserForm(false)}
        onSubmit={handleAddUser}
        isLoading={isSubmitting}
      />

      <UserFormModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSubmit={handleUpdateUser}
        user={editingUser}
        isLoading={isSubmitting}
      />
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, searchQuery, setSearchQuery, filterRole, setFilterRole, roles, setShowAddUserForm, setEditingUser, handleDeleteUser }) => {
  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="All">All Roles</option>
            {Object.keys(roles).map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setShowAddUserForm(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold shadow-md"
        >
          <UserPlus className="w-5 h-5" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-indigo-700 font-semibold text-sm">
                          {user.fullName?.split(' ').map(n => n[0]).join('').substring(0, 2) || user.username?.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-semibold text-gray-900">{user.fullName || user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {user.department || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'Active' ? 'bg-green-100 text-green-800' :
                    user.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {user.lastLogin || 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-4"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.fullName || user.username)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Roles Tab Component - Beautiful UI from commit 264cb97
const RolesTab = ({ roles, permissions, editingRole, setEditingRole, updateRole }) => {
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [isEditing, setIsEditing] = useState(false);
  const [editedPermissions, setEditedPermissions] = useState([]);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);

  // Group permissions by module
  const permissionGroups = {
    'Dashboard': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('DASHBOARD')),
    'Orphans': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('ORPHANS')),
    'Beneficiaries': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('BENEFICIARIES')),
    'Projects': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('PROJECTS')),
    'Finance': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('FINANCE')),
    'HR': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('HR')),
    'CBO': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('CBO')),
    'Partners': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('PARTNERS')),
    'Proposals': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('PROPOSALS')),
    'MEAL': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('MEAL')),
    'Campaigns': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('CAMPAIGNS')),
    'Donations': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('DONATIONS')),
    'Social Media': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('SOCIAL_MEDIA')),
    'Job Postings': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('JOB_POSTINGS')),
    'Vendor Calls': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('VENDOR_CALLS')),
    'Operations': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('OPERATIONS')),
    'Approvals': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('APPROVALS')),
    'Reports': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('REPORTS') || key.startsWith('COMPLIANCE')),
    'Settings': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('SETTINGS') || key.startsWith('SYSTEM')),
    'Users': Object.entries(PERMISSIONS || {}).filter(([key]) => key.startsWith('USERS')),
  };

  const getCurrentPermissions = () => {
    return ROLE_PERMISSIONS?.[selectedRole] || [];
  };

  const handleEditClick = () => {
    setEditedPermissions([...getCurrentPermissions()]);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPermissions([]);
  };

  const handleSavePermissions = () => {
    // In a real app, this would save to backend
    if (ROLE_PERMISSIONS) {
      ROLE_PERMISSIONS[selectedRole] = editedPermissions;
    }
    setIsEditing(false);
    alert(`Permissions updated for ${selectedRole}!\n\nNote: In production, this would be saved to the database.`);
  };

  const togglePermission = (permission) => {
    if (editedPermissions.includes(permission)) {
      setEditedPermissions(editedPermissions.filter(p => p !== permission));
    } else {
      setEditedPermissions([...editedPermissions, permission]);
    }
  };

  const toggleAllInGroup = (groupPermissions) => {
    const allPermissionValues = groupPermissions.map(([, value]) => value);
    const allSelected = allPermissionValues.every(p => editedPermissions.includes(p));

    if (allSelected) {
      setEditedPermissions(editedPermissions.filter(p => !allPermissionValues.includes(p)));
    } else {
      const newPermissions = [...editedPermissions];
      allPermissionValues.forEach(p => {
        if (!newPermissions.includes(p)) {
          newPermissions.push(p);
        }
      });
      setEditedPermissions(newPermissions);
    }
  };

  const formatPermissionName = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getPermissionColor = (permission) => {
    if (permission.includes('DELETE')) return 'text-red-600';
    if (permission.includes('APPROVE')) return 'text-green-600';
    if (permission.includes('CREATE') || permission.includes('EDIT')) return 'text-blue-600';
    if (permission.includes('VIEW')) return 'text-gray-600';
    return 'text-purple-600';
  };

  const getActivePermissions = () => {
    return isEditing ? editedPermissions : getCurrentPermissions();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Shield size={28} />
              Roles & Permissions Management
            </h2>
            <p className="text-purple-100 mt-2">
              Configure which dashboards and sections each role can access
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{Object.keys(ROLE_PERMISSIONS || {}).length}</div>
            <div className="text-sm text-purple-200">Total Roles</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Role List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Roles</h3>
              <button
                onClick={() => setShowAddRoleModal(true)}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="Add Custom Role"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {Object.keys(ROLE_PERMISSIONS || {}).map((role) => {
                const permCount = ROLE_PERMISSIONS?.[role]?.length || 0;

                return (
                  <button
                    key={role}
                    onClick={() => {
                      setSelectedRole(role);
                      setIsEditing(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedRole === role
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield size={16} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{role}</div>
                        <div className={`text-xs ${selectedRole === role ? 'text-purple-200' : 'text-gray-500'}`}>
                          {permCount} permissions
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side - Permissions Editor */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-lg p-6">
            {/* Role Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {selectedRole}
                  {selectedRole === 'Admin' && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">SUPER USER</span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {getActivePermissions().length} permissions assigned
                </p>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Edit2 size={16} />
                    Edit Permissions
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePermissions}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2">
              {Object.entries(permissionGroups).map(([groupName, groupPermissions]) => {
                if (groupPermissions.length === 0) return null;

                const activePerms = getActivePermissions();
                const allSelected = groupPermissions.every(([, value]) => activePerms.includes(value));
                const someSelected = groupPermissions.some(([, value]) => activePerms.includes(value));

                return (
                  <div key={groupName} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
                    {/* Group Header */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${someSelected ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {groupName}
                        <span className="text-xs font-normal text-gray-500">
                          ({groupPermissions.filter(([, value]) => activePerms.includes(value)).length}/{groupPermissions.length})
                        </span>
                      </h4>
                      {isEditing && (
                        <button
                          onClick={() => toggleAllInGroup(groupPermissions)}
                          className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors ${
                            allSelected
                              ? 'bg-red-100 text-red-600 hover:bg-red-200'
                              : 'bg-green-100 text-green-600 hover:bg-green-200'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>

                    {/* Permissions List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {groupPermissions.map(([key, value]) => {
                        const hasPermission = activePerms.includes(value);

                        return (
                          <div
                            key={value}
                            className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
                              hasPermission
                                ? 'bg-green-50 border-green-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={hasPermission}
                                onChange={() => togglePermission(value)}
                                className="w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                              />
                            ) : (
                              hasPermission && <CheckCircle size={16} className="text-green-600" />
                            )}
                            <span className={`text-sm font-medium ${getPermissionColor(value)}`}>
                              {formatPermissionName(key)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Eye className="text-blue-600 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">How Permissions Work</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Each role has specific permissions that control access to dashboards and features</li>
              <li>• Permissions are grouped by module (Orphans, Projects, Finance, etc.)</li>
              <li>• View permissions allow read-only access, while Create/Edit/Delete allow modifications</li>
              <li>• Approve permissions allow users to approve workflows in their area</li>
              <li>• Changes take effect immediately for all users with the modified role</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// System Tab Component
const SystemTab = ({ systemSettings }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(systemSettings).map(([key, value]) => (
            <div key={key} className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="text"
                value={value}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
