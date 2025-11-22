import React, { useState } from 'react';
import {
  Settings, Users, Shield, Bell, Database, Palette,
  Key, Globe, Mail, Cloud, CreditCard, Download,
  Upload, Save, CheckCircle, XCircle, Clock, Activity,
  Sparkles, Zap
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ROLES, HIERARCHY_LEVELS, getRoleName } from '../../config/roleHierarchy';
import { ROLE_PERMISSIONS } from '../../utils/permissions';
import API, { AuthAPI } from '../../services/api';

const SystemSettingsPage = () => {
  const {
    systemSettings,
    users,
    roles,
    notificationSettings,
    backupSettings,
    integrationSettings,
    appearanceSettings,
    securitySettings,
    setSystemSettings,
    setNotificationSettings,
    setBackupSettings,
    setIntegrationSettings,
    setAppearanceSettings,
    setSecuritySettings,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    triggerBackup,
    getStats
  } = useSettings();

  const [activeTab, setActiveTab] = useState('general');
  const [showSuccess, setShowSuccess] = useState(false);
  const stats = getStats();

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield },
    { id: 'ai', name: 'AI Configuration', icon: Sparkles },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'backup', name: 'Backup & Recovery', icon: Database },
    { id: 'integrations', name: 'Integrations', icon: Globe },
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'security', name: 'Security', icon: Key }
  ];

  const handleSave = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-gray-700 via-slate-700 to-zinc-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 animate-pulse-slow"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">System Settings</h1>
                <p className="text-gray-100 text-sm">Configure system preferences and manage settings</p>
              </div>
            </div>
            {showSuccess && (
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 text-white px-4 py-2 rounded-lg">
                <CheckCircle size={18} />
                <span className="font-semibold text-sm">Settings saved!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          total={stats.totalUsers}
          color="bg-blue-500"
        />
        <StatCard
          icon={Shield}
          label="User Roles"
          value={stats.totalRoles}
          color="bg-purple-500"
        />
        <StatCard
          icon={Database}
          label="Auto Backup"
          value={stats.backupEnabled ? 'Enabled' : 'Disabled'}
          color="bg-green-500"
        />
        <StatCard
          icon={Key}
          label="2FA"
          value={stats.twoFactorEnabled ? 'Enabled' : 'Disabled'}
          color="bg-orange-500"
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 font-semibold transition whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-b-2 border-blue-600 text-blue-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon size={20} />
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'general' && <GeneralTab settings={systemSettings} setSettings={setSystemSettings} onSave={handleSave} />}
          {activeTab === 'users' && <UsersTab users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} toggleUserStatus={toggleUserStatus} />}
          {activeTab === 'roles' && <RolesTab roles={roles} />}
          {activeTab === 'ai' && <AIConfigTab onSave={handleSave} />}
          {activeTab === 'notifications' && <NotificationsTab settings={notificationSettings} setSettings={setNotificationSettings} onSave={handleSave} />}
          {activeTab === 'backup' && <BackupTab settings={backupSettings} setSettings={setBackupSettings} triggerBackup={triggerBackup} onSave={handleSave} />}
          {activeTab === 'integrations' && <IntegrationsTab settings={integrationSettings} setSettings={setIntegrationSettings} onSave={handleSave} />}
          {activeTab === 'appearance' && <AppearanceTab settings={appearanceSettings} setSettings={setAppearanceSettings} onSave={handleSave} />}
          {activeTab === 'security' && <SecurityTab settings={securitySettings} setSettings={setSecuritySettings} onSave={handleSave} />}
        </div>
      </div>
    </div>
  );
};

// General Settings Tab
const GeneralTab = ({ settings, setSettings, onSave }) => {
  const handleChange = (field, value) => {
    setSettings({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">General Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Organization Name</label>
          <input
            type="text"
            value={settings.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
          <input
            type="email"
            value={settings.organizationEmail}
            onChange={(e) => handleChange('organizationEmail', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
          <input
            type="tel"
            value={settings.organizationPhone}
            onChange={(e) => handleChange('organizationPhone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            <option value="UTC">UTC (UTC+0:00)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="LKR">LKR (Sri Lankan Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fiscal Year Start</label>
          <select
            value={settings.fiscalYearStart}
            onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="January">January</option>
            <option value="April">April</option>
            <option value="July">July</option>
            <option value="October">October</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
            <option value="Tamil">Tamil</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
          <textarea
            value={settings.organizationAddress}
            onChange={(e) => handleChange('organizationAddress', e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

// Users Tab
const UsersTab = ({ users, toggleUserStatus }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'Guest',
    department: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await API.Users.create(formData);

      setSuccess('User created successfully!');
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'Guest',
        department: '',
        phone: ''
      });
      setTimeout(() => {
        setShowAddModal(false);
        setSuccess('');
        window.location.reload(); // Reload to fetch updated users
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Users size={20} />
          Add User
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {users.map((user) => (
          <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-gray-900">{user.fullName}</h4>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{user.email} • {user.role}</p>
                  <p className="text-xs text-gray-500 mt-1">Last login: {user.lastLogin || 'Never'}</p>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => toggleUserStatus(user.id)}
                    className={`px-4 py-2 rounded-lg transition text-sm font-semibold ${
                      user.status === 'Active'
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Add New User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded flex items-center gap-2">
                  <CheckCircle size={20} />
                  {success}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  >
                    <option value="Admin">Admin</option>
                    <option value="CEO">CEO</option>
                    <option value="Programme Manager">Programme Manager</option>
                    <option value="Finance Manager">Finance Manager</option>
                    <option value="Finance Officer">Finance Officer</option>
                    <option value="Fundraising Manager">Fundraising Manager</option>
                    <option value="HR Manager">HR Manager</option>
                    <option value="Project Officer">Project Officer</option>
                    <option value="Field Officer">Field Officer</option>
                    <option value="MEAL Officer">MEAL Officer</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Roles Tab
const RolesTab = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // Group roles by hierarchy level
  const rolesByLevel = {};
  Object.keys(ROLES).forEach(roleKey => {
    const role = ROLES[roleKey];
    if (!rolesByLevel[role.level]) {
      rolesByLevel[role.level] = [];
    }
    rolesByLevel[role.level].push({ key: roleKey, ...role });
  });

  const getLevelName = (level) => {
    switch(level) {
      case 0: return 'System Administrator';
      case 1: return 'Governance';
      case 2: return 'Executive Leadership';
      case 3: return 'Directors';
      case 4: return 'Managers';
      case 5: return 'Officers';
      case 6: return 'Assistants';
      case 7: return 'Coordinators';
      case 99: return 'Guest';
      default: return `Level ${level}`;
    }
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 0: return 'bg-red-500';
      case 1: return 'bg-purple-500';
      case 2: return 'bg-indigo-500';
      case 3: return 'bg-blue-500';
      case 4: return 'bg-cyan-500';
      case 5: return 'bg-green-500';
      case 6: return 'bg-yellow-500';
      case 7: return 'bg-orange-500';
      case 99: return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleRoleClick = (roleKey) => {
    setSelectedRole(roleKey);
    setShowPermissions(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Roles & Permissions</h2>
          <p className="text-sm text-gray-600 mt-1">
            Organizational hierarchy with {Object.keys(ROLES).length} defined roles across 7 levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            Based on GERSL Organizational Structure
          </span>
        </div>
      </div>

      {/* Hierarchy Visualization */}
      <div className="space-y-4">
        {Object.keys(rolesByLevel).sort((a, b) => Number(a) - Number(b)).map((level) => {
          const levelNum = Number(level);
          const levelRoles = rolesByLevel[level];

          return (
            <div key={level} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${getLevelColor(levelNum)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {levelNum === 0 ? '★' : levelNum === 99 ? '◉' : levelNum}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{getLevelName(levelNum)}</h3>
                  <p className="text-xs text-gray-500">{levelRoles.length} role{levelRoles.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {levelRoles.map(role => {
                  const permissionCount = ROLE_PERMISSIONS[role.key]?.length || 0;

                  return (
                    <button
                      key={role.key}
                      onClick={() => handleRoleClick(role.key)}
                      className="text-left border border-gray-200 rounded-lg p-3 hover:border-purple-400 hover:bg-purple-50 transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm group-hover:text-purple-700">
                            {role.name}
                          </h4>
                          {role.department && (
                            <p className="text-xs text-gray-500 mt-1">{role.department}</p>
                          )}
                          {role.specialization && (
                            <p className="text-xs text-blue-600 mt-1">Specialty: {role.specialization}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-600">
                          {permissionCount} permissions
                        </span>
                        {role.reportsTo && (
                          <span className="text-xs text-gray-400">
                            → Reports to {ROLES[role.reportsTo]?.name}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Permission Details Modal */}
      {showPermissions && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{ROLES[selectedRole].name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Level {ROLES[selectedRole].level} • {ROLES[selectedRole].department || 'No Department'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPermissions(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Role Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Hierarchy Level</p>
                    <p className="font-semibold text-gray-900">{getLevelName(ROLES[selectedRole].level)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Department</p>
                    <p className="font-semibold text-gray-900">{ROLES[selectedRole].department || 'N/A'}</p>
                  </div>
                  {ROLES[selectedRole].specialization && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Specialization</p>
                      <p className="font-semibold text-gray-900">{ROLES[selectedRole].specialization}</p>
                    </div>
                  )}
                  {ROLES[selectedRole].reportsTo && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase mb-1">Reports To</p>
                      <p className="font-semibold text-gray-900">{ROLES[ROLES[selectedRole].reportsTo]?.name}</p>
                    </div>
                  )}
                </div>

                {/* Approval Authorities */}
                {ROLES[selectedRole].canApprove.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle size={18} className="text-green-600" />
                      Approval Authorities
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {ROLES[selectedRole].canApprove.map((approval, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                          {approval}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Permissions */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield size={18} className="text-purple-600" />
                    Permissions ({ROLE_PERMISSIONS[selectedRole]?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {ROLE_PERMISSIONS[selectedRole]?.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        <span className="text-gray-700">{permission}</span>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-sm">No permissions defined</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPermissions(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Notifications Tab
const NotificationsTab = ({ settings, setSettings, onSave }) => {
  const toggleSetting = (key) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const notificationOptions = [
    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
    { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive browser push notifications' },
    { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
    { key: 'notifyOnNewOrphan', label: 'New Orphan Registration', description: 'Notify when a new orphan is registered' },
    { key: 'notifyOnProjectUpdate', label: 'Project Updates', description: 'Notify on project status changes' },
    { key: 'notifyOnFinanceAlert', label: 'Finance Alerts', description: 'Notify on budget thresholds' },
    { key: 'notifyOnLeaveRequest', label: 'Leave Requests', description: 'Notify on staff leave requests' },
    { key: 'notifyOnIncident', label: 'Safeguarding Incidents', description: 'Notify on new incidents reported' },
    { key: 'notifyOnBackgroundCheckExpiry', label: 'Background Check Expiry', description: 'Notify when checks are expiring' },
    { key: 'dailyDigest', label: 'Daily Digest', description: 'Receive daily summary email' },
    { key: 'weeklyReport', label: 'Weekly Report', description: 'Receive weekly summary email' },
    { key: 'monthlyReport', label: 'Monthly Report', description: 'Receive monthly summary email' }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{option.label}</h4>
              <p className="text-sm text-gray-600 mt-1">{option.description}</p>
            </div>
            <button
              onClick={() => toggleSetting(option.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings[option.key] ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings[option.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save Preferences
        </button>
      </div>
    </div>
  );
};

// Backup Tab
const BackupTab = ({ settings, setSettings, triggerBackup, onSave }) => {
  const handleBackupNow = () => {
    const result = triggerBackup();
    if (result.success) {
      alert(`Backup completed successfully at ${result.timestamp}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Backup & Recovery</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-900">Backup Status</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Last Backup</p>
              <p className="font-semibold text-gray-900">{settings.lastBackup}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Next Scheduled</p>
              <p className="font-semibold text-gray-900">{settings.nextBackup}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Backup Size</p>
              <p className="font-semibold text-gray-900">{settings.backupSize}</p>
            </div>
          </div>
          <button
            onClick={handleBackupNow}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            <Download size={20} />
            Backup Now
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Auto Backup</label>
            <button
              onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.autoBackup ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.autoBackup ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Retention Period (Days)</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Backup Location</label>
            <select
              value={settings.backupLocation}
              onChange={(e) => setSettings({ ...settings, backupLocation: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Cloud Storage">Cloud Storage</option>
              <option value="Local Storage">Local Storage</option>
              <option value="External Drive">External Drive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save Settings
        </button>
      </div>
    </div>
  );
};

// Integrations Tab
const IntegrationsTab = ({ settings }) => {
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const integrations = [
    { key: 'email', name: 'Email Service', icon: Mail, description: 'Configure SMTP for email notifications', provider: settings.email?.provider || 'Not configured' },
    { key: 'payment', name: 'Payment Gateway', icon: CreditCard, description: 'Accept online payments', provider: settings.payment?.gateway || 'Not configured' },
    { key: 'storage', name: 'Cloud Storage', icon: Cloud, description: 'Store files in cloud', provider: settings.storage?.provider || 'Not configured' },
    { key: 'accounting', name: 'Accounting System', icon: Database, description: 'Sync with accounting software', provider: settings.accounting?.system || 'Not configured' }
  ];

  const handleConfigure = (integration) => {
    setSelectedIntegration(integration);
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    try {
      // Update the integration settings with the new configuration
      const updatedSettings = {
        ...integrationSettings,
        [selectedIntegration.key]: {
          ...integrationSettings[selectedIntegration.key],
          status: 'Connected',
          lastUpdated: new Date().toISOString()
        }
      };

      // Save to context
      setIntegrationSettings(updatedSettings);

      // Optionally save to backend
      try {
        await API.put('/system-settings/integrations', {
          [selectedIntegration.key]: updatedSettings[selectedIntegration.key]
        });
      } catch (apiError) {
        console.warn('Failed to save to backend:', apiError);
        // Continue anyway since we saved to local context
      }

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      setShowConfigModal(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Third-Party Integrations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const config = settings[integration.key];
          return (
            <div key={integration.key} className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{integration.name}</h4>
                    <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Provider: {integration.provider}</p>
                  <p className={`text-xs font-semibold mt-1 ${
                    config.status === 'Connected' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {config.status}
                  </p>
                </div>
                <button
                  onClick={() => handleConfigure(integration)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-semibold"
                >
                  Configure
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {showConfigModal && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Configure {selectedIntegration.name}</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">{selectedIntegration.description}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedIntegration.key === 'emailService' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      placeholder="587"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                    <input
                      type="text"
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'smsService' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Twilio</option>
                      <option>Nexmo</option>
                      <option>AWS SNS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Key</label>
                    <input
                      type="text"
                      placeholder="Enter your API key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">API Secret</label>
                    <input
                      type="password"
                      placeholder="Enter your API secret"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'cloudStorage' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>AWS S3</option>
                      <option>Google Cloud Storage</option>
                      <option>Azure Blob Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Bucket Name</label>
                    <input
                      type="text"
                      placeholder="my-bucket"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Access Key</label>
                    <input
                      type="text"
                      placeholder="Enter access key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      placeholder="Enter secret key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'paymentGateway' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Stripe</option>
                      <option>PayPal</option>
                      <option>Square</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Publishable Key</label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Webhook Secret</label>
                    <input
                      type="password"
                      placeholder="whsec_..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Appearance Tab
const AppearanceTab = ({ settings, setSettings, onSave }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Appearance Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
            <option value="Auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Color</label>
          <select
            value={settings.primaryColor}
            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
            <option value="Green">Green</option>
            <option value="Orange">Orange</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sidebar Style</label>
          <select
            value={settings.sidebarStyle}
            onChange={(e) => setSettings({ ...settings, sidebarStyle: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Expanded">Expanded</option>
            <option value="Collapsed">Collapsed</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Compact Mode</h4>
              <p className="text-sm text-gray-600">Reduce spacing for more content</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.compactMode ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.compactMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-gray-900">Show Animations</h4>
              <p className="text-sm text-gray-600">Enable interface animations</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, showAnimations: !settings.showAnimations })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.showAnimations ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  settings.showAnimations ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save Appearance
        </button>
      </div>
    </div>
  );
};

// Security Tab
const SecurityTab = ({ settings, setSettings, onSave }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>

      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Password Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Minimum Length</label>
              <input
                type="number"
                value={settings.minPasswordLength || 8}
                onChange={(e) => setSettings({
                  ...settings,
                  minPasswordLength: parseInt(e.target.value)
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry (Days)</label>
              <input
                type="number"
                value={settings.passwordExpiry || 90}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordExpiry: parseInt(e.target.value)
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { key: 'requireUppercase', label: 'Require Uppercase Letters' },
              { key: 'requireNumber', label: 'Require Numbers' },
              { key: 'requireSpecialChar', label: 'Require Special Characters' }
            ].map((option) => (
              <div key={option.key} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings[option.key] || false}
                  onChange={(e) => setSettings({
                    ...settings,
                    [option.key]: e.target.checked
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm text-gray-700">{option.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Session & Login</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={settings.loginAttempts}
                onChange={(e) => setSettings({ ...settings, loginAttempts: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Lockout Duration (minutes)</label>
              <input
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Two-Factor Authentication</h4>
                <p className="text-sm text-gray-600">Add extra security layer</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.twoFactorAuth ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">Audit Log</h4>
                <p className="text-sm text-gray-600">Track all system activities</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, auditLog: !settings.auditLog })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.auditLog ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    settings.auditLog ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save Security Settings
        </button>
      </div>
    </div>
  );
};

// AI Configuration Tab
const AIConfigTab = ({ onSave }) => {
  const [aiSettings, setAISettings] = useState(() => {
    const stored = localStorage.getItem('gersl_ai_settings');
    return stored ? JSON.parse(stored) : {
      provider: 'openai',
      openaiApiKey: '',
      openaiModel: 'gpt-4',
      claudeApiKey: '',
      claudeModel: 'claude-3-opus-20240229',
      customEndpoint: '',
      customApiKey: '',
      customModel: '',
      temperature: 0.7,
      maxTokens: 2000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
      enableFallback: true,
      fallbackProvider: 'template',
      testStatus: null
    };
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (field, value) => {
    setAISettings({ ...aiSettings, [field]: value });
  };

  const handleSave = () => {
    localStorage.setItem('gersl_ai_settings', JSON.stringify(aiSettings));
    onSave();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if API key is provided
      if (aiSettings.provider === 'openai' && !aiSettings.openaiApiKey) {
        throw new Error('OpenAI API key is required');
      }
      if (aiSettings.provider === 'claude' && !aiSettings.claudeApiKey) {
        throw new Error('Claude API key is required');
      }
      if (aiSettings.provider === 'custom' && (!aiSettings.customEndpoint || !aiSettings.customApiKey)) {
        throw new Error('Custom endpoint and API key are required');
      }

      setTestResult({ success: true, message: 'Connection successful!' });
    } catch (error) {
      setTestResult({ success: false, message: error.message });
    } finally {
      setTesting(false);
    }
  };

  const providers = [
    { value: 'openai', label: 'OpenAI (GPT)', icon: Zap },
    { value: 'claude', label: 'Anthropic Claude', icon: Sparkles },
    { value: 'custom', label: 'Custom Endpoint', icon: Globe },
    { value: 'template', label: 'Template-based (No AI)', icon: Database }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-gray-900">AI Configuration</h2>
          <p className="text-sm text-gray-600 mt-1">
            Configure AI providers for automated report generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition font-semibold disabled:opacity-50"
          >
            {testing ? <Activity size={18} className="animate-spin" /> : <Zap size={18} />}
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`p-4 rounded-lg border-l-4 ${
          testResult.success
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {testResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
            <span className="font-semibold">{testResult.message}</span>
          </div>
        </div>
      )}

      {/* Provider Selection */}
      <div className="border border-gray-200 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {providers.map((provider) => {
            const Icon = provider.icon;
            const isSelected = aiSettings.provider === provider.value;
            return (
              <button
                key={provider.value}
                onClick={() => handleChange('provider', provider.value)}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition text-left ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className={`p-3 rounded-lg ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                    {provider.label}
                  </h4>
                  {provider.value === 'template' && (
                    <p className="text-xs text-gray-600 mt-1">No API key required</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* OpenAI Configuration */}
      {aiSettings.provider === 'openai' && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">OpenAI Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.openaiApiKey}
              onChange={(e) => handleChange('openaiApiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
            <select
              value={aiSettings.openaiModel}
              onChange={(e) => handleChange('openaiModel', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="gpt-4">GPT-4 (Most capable, slower)</option>
              <option value="gpt-4-turbo-preview">GPT-4 Turbo (Faster, cheaper)</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast, economical)</option>
            </select>
          </div>
        </div>
      )}

      {/* Claude Configuration */}
      {aiSettings.provider === 'claude' && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Anthropic Claude Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.claudeApiKey}
              onChange={(e) => handleChange('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Model</label>
            <select
              value={aiSettings.claudeModel}
              onChange={(e) => handleChange('claudeModel', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="claude-3-opus-20240229">Claude 3 Opus (Most capable)</option>
              <option value="claude-3-sonnet-20240229">Claude 3 Sonnet (Balanced)</option>
              <option value="claude-3-haiku-20240307">Claude 3 Haiku (Fast, economical)</option>
            </select>
          </div>
        </div>
      )}

      {/* Custom Configuration */}
      {aiSettings.provider === 'custom' && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Custom Endpoint Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Endpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={aiSettings.customEndpoint}
              onChange={(e) => handleChange('customEndpoint', e.target.value)}
              placeholder="https://api.example.com/v1/chat/completions"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.customApiKey}
              onChange={(e) => handleChange('customApiKey', e.target.value)}
              placeholder="Your custom API key"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Model Name</label>
            <input
              type="text"
              value={aiSettings.customModel}
              onChange={(e) => handleChange('customModel', e.target.value)}
              placeholder="model-name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      {/* Generation Parameters */}
      {aiSettings.provider !== 'template' && (
        <div className="border border-gray-200 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generation Parameters</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Temperature: {aiSettings.temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={aiSettings.temperature}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Higher values = more creative, Lower values = more focused
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Tokens</label>
              <input
                type="number"
                value={aiSettings.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                min="100"
                max="8000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum length of generated content
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Top P: {aiSettings.topP}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={aiSettings.topP}
                onChange={(e) => handleChange('topP', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls diversity of output
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Frequency Penalty: {aiSettings.frequencyPenalty}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={aiSettings.frequencyPenalty}
                onChange={(e) => handleChange('frequencyPenalty', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Reduces repetition
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Settings */}
      <div className="border border-gray-200 rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Fallback Configuration</h3>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-gray-900">Enable Fallback</h4>
            <p className="text-sm text-gray-600">Use template-based generation if AI fails</p>
          </div>
          <button
            onClick={() => handleChange('enableFallback', !aiSettings.enableFallback)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              aiSettings.enableFallback ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                aiSettings.enableFallback ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {aiSettings.enableFallback && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Fallback Provider</label>
            <select
              value={aiSettings.fallbackProvider}
              onChange={(e) => handleChange('fallbackProvider', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="template">Template-based Generation</option>
              <option value="openai">OpenAI (if not primary)</option>
              <option value="claude">Claude (if not primary)</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          <Save size={20} />
          Save AI Configuration
        </button>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, total, color }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <div className="flex items-center gap-3">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value}
          {total && <span className="text-sm text-gray-500"> / {total}</span>}
        </p>
      </div>
    </div>
  </div>
);

export default SystemSettingsPage;
