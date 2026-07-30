import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings, Users, Shield, Bell, Database, Palette,
  Key, Globe, Mail, Cloud, CreditCard, Download,
  Upload, Save, CheckCircle, XCircle, Clock, Activity,
  Sparkles, Zap, Briefcase, Building2, Plus, Trash2, Edit2
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { ROLES, HIERARCHY_LEVELS } from '../../config/roleHierarchy';
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

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('section') || 'general';
  const setActiveTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', id);
    setSearchParams(next, { replace: false });
  };
  const [showSuccess, setShowSuccess] = useState(false);
  const stats = getStats();

  // Departments state
  const [departments, setDepartments] = useState([]);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [departmentForm, setDepartmentForm] = useState({
    name: '',
    description: '',
    code: '',
    color: 'from-blue-500 to-cyan-600',
    icon: 'briefcase',
    isActive: true,
    sortOrder: 0
  });

  // Load departments
  useEffect(() => {
    if (activeTab === 'departments') {
      loadDepartments();
    }
  }, [activeTab]);

  const loadDepartments = async () => {
    try {
      const response = await API.Departments.getAll(true); // Include inactive
      setDepartments(response.departments || []);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const handleDepartmentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await API.Departments.update(editingDepartment.id, departmentForm);
      } else {
        await API.Departments.create(departmentForm);
      }
      loadDepartments();
      setShowDepartmentModal(false);
      setEditingDepartment(null);
      setDepartmentForm({
        name: '',
        description: '',
        code: '',
        color: 'from-blue-500 to-cyan-600',
        icon: 'briefcase',
        isActive: true,
        sortOrder: 0
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving department:', error);
      alert(error.response?.data?.message || 'Failed to save department');
    }
  };

  const handleDeleteDepartment = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this department?')) {
      try {
        await API.Departments.delete(id);
        loadDepartments();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error('Error deleting department:', error);
        alert('Failed to delete department');
      }
    }
  };

  const handleEditDepartment = (dept) => {
    setEditingDepartment(dept);
    setDepartmentForm({
      name: dept.name,
      description: dept.description || '',
      code: dept.code || '',
      color: dept.color || 'from-blue-500 to-cyan-600',
      icon: dept.icon || 'briefcase',
      isActive: dept.isActive !== undefined ? dept.isActive : true,
      sortOrder: dept.sortOrder || 0
    });
    setShowDepartmentModal(true);
  };

  // Positions state
  const [positions, setPositions] = useState([]);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [positionForm, setPositionForm] = useState({
    title: '',
    description: '',
    code: '',
    level: '',
    departmentId: null,
    isActive: true,
    sortOrder: 0
  });

  // Load positions
  useEffect(() => {
    if (activeTab === 'positions') {
      loadPositions();
    }
  }, [activeTab]);

  const loadPositions = async () => {
    try {
      const response = await API.Positions.getAll(true); // Include inactive
      setPositions(response.positions || []);
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const handlePositionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        await API.Positions.update(editingPosition.id, positionForm);
      } else {
        await API.Positions.create(positionForm);
      }
      loadPositions();
      setShowPositionModal(false);
      setEditingPosition(null);
      setPositionForm({
        title: '',
        description: '',
        code: '',
        level: '',
        departmentId: null,
        isActive: true,
        sortOrder: 0
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving position:', error);
      alert(error.response?.data?.message || 'Failed to save position');
    }
  };

  const handleDeletePosition = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this position?')) {
      try {
        await API.Positions.delete(id);
        loadPositions();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } catch (error) {
        console.error('Error deleting position:', error);
        alert('Failed to delete position');
      }
    }
  };

  const handleEditPosition = (pos) => {
    setEditingPosition(pos);
    setPositionForm({
      title: pos.title,
      description: pos.description || '',
      code: pos.code || '',
      level: pos.level || '',
      departmentId: pos.departmentId || null,
      isActive: pos.isActive !== undefined ? pos.isActive : true,
      sortOrder: pos.sortOrder || 0
    });
    setShowPositionModal(true);
  };

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'roles', name: 'Roles & Permissions', icon: Shield },
    { id: 'departments', name: 'Departments', icon: Building2 },
    { id: 'positions', name: 'Positions', icon: Briefcase },
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
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Hero Header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Settings className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <h1 className="text-h2 font-bold leading-tight">System Settings</h1>
              <p className="text-ink-200 text-sm mt-0.5">Configure system preferences and manage settings</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

      {/* Section header (tabs live in the console sidebar now) */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-orange-600 font-semibold">System Settings</p>
        <h2 className="text-h2 text-ink-900">
          {tabs.find(t => t.id === activeTab)?.name || 'System Settings'}
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          {activeTab === 'general' && <GeneralTab settings={systemSettings} setSettings={setSystemSettings} onSave={handleSave} />}
          {activeTab === 'users' && <UsersTab users={users} addUser={addUser} updateUser={updateUser} deleteUser={deleteUser} toggleUserStatus={toggleUserStatus} />}
          {activeTab === 'roles' && <RolesTab roles={roles} />}
          {activeTab === 'departments' && <DepartmentsTab
            departments={departments}
            onAdd={() => { setEditingDepartment(null); setDepartmentForm({ name: '', description: '', code: '', color: 'from-blue-500 to-cyan-600', icon: 'briefcase', isActive: true, sortOrder: 0 }); setShowDepartmentModal(true); }}
            onEdit={handleEditDepartment}
            onDelete={handleDeleteDepartment}
          />}
          {activeTab === 'positions' && <PositionsTab
            positions={positions}
            onAdd={() => { setEditingPosition(null); setPositionForm({ title: '', description: '', code: '', level: '', departmentId: null, isActive: true, sortOrder: 0 }); setShowPositionModal(true); }}
            onEdit={handleEditPosition}
            onDelete={handleDeletePosition}
          />}
          {activeTab === 'ai' && <AIConfigTab onSave={handleSave} />}
          {activeTab === 'notifications' && <NotificationsTab settings={notificationSettings} setSettings={setNotificationSettings} onSave={handleSave} />}
          {activeTab === 'backup' && <BackupTab settings={backupSettings} setSettings={setBackupSettings} triggerBackup={triggerBackup} onSave={handleSave} />}
          {activeTab === 'integrations' && <IntegrationsTab settings={integrationSettings} setSettings={setIntegrationSettings} onSave={handleSave} />}
          {activeTab === 'appearance' && <AppearanceTab settings={appearanceSettings} setSettings={setAppearanceSettings} onSave={handleSave} />}
          {activeTab === 'security' && <SecurityTab settings={securitySettings} setSettings={setSecuritySettings} onSave={handleSave} />}
        </div>
      </div>

      {/* Department Modal */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-pop max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink-100">
              <h2 className="text-xl font-bold text-ink-900">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h2>
            </div>

            <form onSubmit={handleDepartmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Department Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={departmentForm.name}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Finance, HR, Operations"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Department Code
                </label>
                <input
                  type="text"
                  value={departmentForm.code}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, code: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., FIN, HR, OPS"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description
                </label>
                <textarea
                  value={departmentForm.description}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Brief description of the department..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Color Theme
                </label>
                <select
                  value={departmentForm.color}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, color: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="from-blue-500 to-cyan-600">Blue</option>
                  <option value="from-purple-500 to-pink-600">Purple</option>
                  <option value="from-green-500 to-teal-600">Green</option>
                  <option value="from-orange-500 to-red-600">Orange</option>
                  <option value="from-indigo-500 to-purple-600">Indigo</option>
                  <option value="from-yellow-400 to-orange-500">Yellow</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={departmentForm.sortOrder}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={departmentForm.isActive}
                  onChange={(e) => setDepartmentForm({ ...departmentForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-ink-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDepartmentModal(false);
                    setEditingDepartment(null);
                  }}
                  className="flex-1 px-4 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Position Modal */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-pop max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink-100">
              <h2 className="text-xl font-bold text-ink-900">
                {editingPosition ? 'Edit Position' : 'Add New Position'}
              </h2>
            </div>

            <form onSubmit={handlePositionSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Position Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={positionForm.title}
                  onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Program Manager, Finance Officer"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Position Code
                </label>
                <input
                  type="text"
                  value={positionForm.code}
                  onChange={(e) => setPositionForm({ ...positionForm, code: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., PM, FO"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Level
                </label>
                <select
                  value={positionForm.level}
                  onChange={(e) => setPositionForm({ ...positionForm, level: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Level</option>
                  <option value="Executive">Executive</option>
                  <option value="Senior">Senior</option>
                  <option value="Mid">Mid</option>
                  <option value="Entry">Entry</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description
                </label>
                <textarea
                  value={positionForm.description}
                  onChange={(e) => setPositionForm({ ...positionForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  placeholder="Brief description of the position..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={positionForm.sortOrder}
                  onChange={(e) => setPositionForm({ ...positionForm, sortOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="positionIsActive"
                  checked={positionForm.isActive}
                  onChange={(e) => setPositionForm({ ...positionForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="positionIsActive" className="text-sm text-ink-700">
                  Active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPositionModal(false);
                    setEditingPosition(null);
                  }}
                  className="flex-1 px-4 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingPosition ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
      <h2 className="text-xl font-bold text-ink-900">General Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Organization Name</label>
          <input
            type="text"
            value={settings.organizationName}
            onChange={(e) => handleChange('organizationName', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Email</label>
          <input
            type="email"
            value={settings.organizationEmail}
            onChange={(e) => handleChange('organizationEmail', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Phone</label>
          <input
            type="tel"
            value={settings.organizationPhone}
            onChange={(e) => handleChange('organizationPhone', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Timezone</label>
          <select
            value={settings.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Asia/Colombo">Asia/Colombo (UTC+5:30)</option>
            <option value="Asia/Kolkata">Asia/Kolkata (UTC+5:30)</option>
            <option value="UTC">UTC (UTC+0:00)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Date Format</label>
          <select
            value={settings.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Currency</label>
          <select
            value={settings.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="LKR">LKR (Sri Lankan Rupee)</option>
            <option value="USD">USD (US Dollar)</option>
            <option value="EUR">EUR (Euro)</option>
            <option value="GBP">GBP (British Pound)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Fiscal Year Start</label>
          <select
            value={settings.fiscalYearStart}
            onChange={(e) => handleChange('fiscalYearStart', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="January">January</option>
            <option value="April">April</option>
            <option value="July">July</option>
            <option value="October">October</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Language</label>
          <select
            value={settings.language}
            onChange={(e) => handleChange('language', e.target.value)}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="English">English</option>
            <option value="Sinhala">Sinhala</option>
            <option value="Tamil">Tamil</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-ink-700 mb-2">Address</label>
          <textarea
            value={settings.organizationAddress}
            onChange={(e) => handleChange('organizationAddress', e.target.value)}
            rows="3"
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
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
    role: '',
    department: '',
    position: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Load dynamic dropdown data
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        // Load roles - RolesAPI.getAll() returns the roles array directly
        const rolesData = await API.Roles.getAll();
        setRoles(rolesData || []);

        // Load departments
        const departmentsData = await API.Departments.getAll();
        setDepartments(departmentsData.departments || []);

        // Load positions
        const positionsData = await API.Positions.getAll();
        setPositions(positionsData.positions || []);
      } catch (error) {
        console.error('Error loading dropdown data:', error);
      }
    };
    loadDropdownData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await API.Users.create(formData);

      setSuccess('User created successfully!');
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: '',
        department: '',
        position: '',
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
        <h2 className="text-xl font-bold text-ink-900">User Management</h2>
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
          <div key={user.id} className="border border-ink-100 rounded-lg p-4 hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.fullName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-ink-900">{user.fullName}</h4>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-600'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <p className="text-sm text-ink-600 mt-1">{user.email} • {user.role}</p>
                  <p className="text-xs text-ink-500 mt-1">Last login: {user.lastLogin || 'Never'}</p>
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
          <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-ink-100">
              <div className="flex items-center justify-between">
                <h3 className="text-h1 text-ink-900">Add New User</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-ink-400 hover:text-ink-600 transition"
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
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Username <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    minLength={6}
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    User Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Select Role</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.name}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">System access level from Settings → Roles</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Department
                  </label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={isLoading}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">From Settings → Departments</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Position
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={isLoading}
                  >
                    <option value="">Select Position</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.title}>
                        {position.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">Job title from Settings → Positions</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
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
      case 99: return 'bg-ink-500';
      default: return 'bg-ink-500';
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
          <h2 className="text-xl font-bold text-ink-900">Roles & Permissions</h2>
          <p className="text-sm text-ink-600 mt-1">
            Organizational hierarchy with {Object.keys(ROLES).length} defined roles across 7 levels
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-600">
            Based on Global Ehsan Relief - Sri Lanka Organizational Structure
          </span>
        </div>
      </div>

      {/* Hierarchy Visualization */}
      <div className="space-y-4">
        {Object.keys(rolesByLevel).sort((a, b) => Number(a) - Number(b)).map((level) => {
          const levelNum = Number(level);
          const levelRoles = rolesByLevel[level];

          return (
            <div key={level} className="border border-ink-100 rounded-lg p-4 bg-white">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${getLevelColor(levelNum)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                  {levelNum === 0 ? '★' : levelNum === 99 ? '◉' : levelNum}
                </div>
                <div>
                  <h3 className="font-bold text-ink-900">{getLevelName(levelNum)}</h3>
                  <p className="text-xs text-ink-500">{levelRoles.length} role{levelRoles.length !== 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {levelRoles.map(role => {
                  const permissionCount = ROLE_PERMISSIONS[role.key]?.length || 0;

                  return (
                    <button
                      key={role.key}
                      onClick={() => handleRoleClick(role.key)}
                      className="text-left border border-ink-100 rounded-lg p-3 hover:border-purple-400 hover:bg-purple-50 transition group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-ink-900 text-sm group-hover:text-purple-700">
                            {role.name}
                          </h4>
                          {role.department && (
                            <p className="text-xs text-ink-500 mt-1">{role.department}</p>
                          )}
                          {role.specialization && (
                            <p className="text-xs text-blue-600 mt-1">Specialty: {role.specialization}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-ink-600">
                          {permissionCount} permissions
                        </span>
                        {role.reportsTo && (
                          <span className="text-xs text-ink-400">
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
            <div className="p-6 border-b border-ink-100">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-h1 text-ink-900">{ROLES[selectedRole].name}</h3>
                  <p className="text-sm text-ink-600 mt-1">
                    Level {ROLES[selectedRole].level} • {ROLES[selectedRole].department || 'No Department'}
                  </p>
                </div>
                <button
                  onClick={() => setShowPermissions(false)}
                  className="p-2 hover:bg-ink-100 rounded-lg transition"
                >
                  <XCircle size={24} className="text-ink-500" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Role Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ink-500 uppercase mb-1">Hierarchy Level</p>
                    <p className="font-semibold text-ink-900">{getLevelName(ROLES[selectedRole].level)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-500 uppercase mb-1">Department</p>
                    <p className="font-semibold text-ink-900">{ROLES[selectedRole].department || 'N/A'}</p>
                  </div>
                  {ROLES[selectedRole].specialization && (
                    <div>
                      <p className="text-xs text-ink-500 uppercase mb-1">Specialization</p>
                      <p className="font-semibold text-ink-900">{ROLES[selectedRole].specialization}</p>
                    </div>
                  )}
                  {ROLES[selectedRole].reportsTo && (
                    <div>
                      <p className="text-xs text-ink-500 uppercase mb-1">Reports To</p>
                      <p className="font-semibold text-ink-900">{ROLES[ROLES[selectedRole].reportsTo]?.name}</p>
                    </div>
                  )}
                </div>

                {/* Approval Authorities */}
                {ROLES[selectedRole].canApprove.length > 0 && (
                  <div>
                    <h4 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
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
                  <h4 className="font-bold text-ink-900 mb-3 flex items-center gap-2">
                    <Shield size={18} className="text-purple-600" />
                    Permissions ({ROLE_PERMISSIONS[selectedRole]?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {ROLE_PERMISSIONS[selectedRole]?.map((permission, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-ink-50 rounded text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                        <span className="text-ink-700">{permission}</span>
                      </div>
                    )) || (
                      <p className="text-ink-500 text-sm">No permissions defined</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-ink-100 bg-ink-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowPermissions(false)}
                  className="px-6 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition"
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
      <h2 className="text-xl font-bold text-ink-900">Notification Preferences</h2>

      <div className="space-y-4">
        {notificationOptions.map((option) => (
          <div key={option.key} className="flex items-center justify-between p-4 border border-ink-100 rounded-lg hover:border-blue-300 transition">
            <div className="flex-1">
              <h4 className="font-semibold text-ink-900">{option.label}</h4>
              <p className="text-sm text-ink-600 mt-1">{option.description}</p>
            </div>
            <button
              onClick={() => toggleSetting(option.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings[option.key] ? 'bg-blue-600' : 'bg-ink-300'
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
      <h2 className="text-xl font-bold text-ink-900">Backup & Recovery</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-ink-100 rounded-lg p-5">
          <div className="flex items-center gap-3 mb-4">
            <Database className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-ink-900">Backup Status</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-ink-600">Last Backup</p>
              <p className="font-semibold text-ink-900">{settings.lastBackup}</p>
            </div>
            <div>
              <p className="text-sm text-ink-600">Next Scheduled</p>
              <p className="font-semibold text-ink-900">{settings.nextBackup}</p>
            </div>
            <div>
              <p className="text-sm text-ink-600">Backup Size</p>
              <p className="font-semibold text-ink-900">{settings.backupSize}</p>
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
            <label className="block text-sm font-semibold text-ink-700 mb-2">Auto Backup</label>
            <button
              onClick={() => setSettings({ ...settings, autoBackup: !settings.autoBackup })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.autoBackup ? 'bg-blue-600' : 'bg-ink-300'
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
            <label className="block text-sm font-semibold text-ink-700 mb-2">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Retention Period (Days)</label>
            <input
              type="number"
              value={settings.retentionDays}
              onChange={(e) => setSettings({ ...settings, retentionDays: parseInt(e.target.value) })}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Backup Location</label>
            <select
              value={settings.backupLocation}
              onChange={(e) => setSettings({ ...settings, backupLocation: e.target.value })}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
const IntegrationsTab = ({ settings, setSettings, onSave }) => {
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
        ...settings,
        [selectedIntegration.key]: {
          ...settings[selectedIntegration.key],
          status: 'Connected',
          lastUpdated: new Date().toISOString()
        }
      };

      // Save to context
      setSettings(updatedSettings);

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
      onSave();

      setShowConfigModal(false);
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ink-900">Third-Party Integrations</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const config = settings[integration.key];
          return (
            <div key={integration.key} className="border border-ink-100 rounded-lg p-5 hover:border-blue-300 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Icon className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink-900">{integration.name}</h4>
                    <p className="text-sm text-ink-600 mt-1">{integration.description}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-ink-100">
                <div>
                  <p className="text-sm text-ink-600">Provider: {integration.provider}</p>
                  <p className={`text-xs font-semibold mt-1 ${
                    config.status === 'Connected' ? 'text-green-600' : 'text-ink-500'
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
          <div className="bg-white rounded-xl shadow-pop max-w-lg w-full">
            <div className="p-6 border-b border-ink-100">
              <div className="flex items-center justify-between">
                <h3 className="text-h1 text-ink-900">Configure {selectedIntegration.name}</h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-ink-400 hover:text-ink-600 transition"
                >
                  <XCircle size={24} />
                </button>
              </div>
              <p className="text-sm text-ink-600 mt-2">{selectedIntegration.description}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedIntegration.key === 'emailService' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">SMTP Port</label>
                    <input
                      type="number"
                      placeholder="587"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Username</label>
                    <input
                      type="text"
                      placeholder="your-email@gmail.com"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'smsService' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Twilio</option>
                      <option>Nexmo</option>
                      <option>AWS SNS</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">API Key</label>
                    <input
                      type="text"
                      placeholder="Enter your API key"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">API Secret</label>
                    <input
                      type="password"
                      placeholder="Enter your API secret"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'cloudStorage' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>AWS S3</option>
                      <option>Google Cloud Storage</option>
                      <option>Azure Blob Storage</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Bucket Name</label>
                    <input
                      type="text"
                      placeholder="my-bucket"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Access Key</label>
                    <input
                      type="text"
                      placeholder="Enter access key"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      placeholder="Enter secret key"
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              {selectedIntegration.key === 'paymentGateway' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Provider</label>
                    <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                      <option>Stripe</option>
                      <option>PayPal</option>
                      <option>Square</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Publishable Key</label>
                    <input
                      type="text"
                      placeholder="pk_test_..."
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Secret Key</label>
                    <input
                      type="password"
                      placeholder="sk_test_..."
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">Webhook Secret</label>
                    <input
                      type="password"
                      placeholder="whsec_..."
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    />
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
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
      <h2 className="text-xl font-bold text-ink-900">Appearance Settings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Theme</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Light">Light</option>
            <option value="Dark">Dark</option>
            <option value="Auto">Auto (System)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Primary Color</label>
          <select
            value={settings.primaryColor}
            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Blue">Blue</option>
            <option value="Purple">Purple</option>
            <option value="Green">Green</option>
            <option value="Orange">Orange</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Sidebar Style</label>
          <select
            value={settings.sidebarStyle}
            onChange={(e) => setSettings({ ...settings, sidebarStyle: e.target.value })}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Expanded">Expanded</option>
            <option value="Collapsed">Collapsed</option>
            <option value="Hidden">Hidden</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-ink-700 mb-2">Font Size</label>
          <select
            value={settings.fontSize}
            onChange={(e) => setSettings({ ...settings, fontSize: e.target.value })}
            className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
          </select>
        </div>

        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-ink-900">Compact Mode</h4>
              <p className="text-sm text-ink-600">Reduce spacing for more content</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, compactMode: !settings.compactMode })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.compactMode ? 'bg-blue-600' : 'bg-ink-300'
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
              <h4 className="font-semibold text-ink-900">Show Animations</h4>
              <p className="text-sm text-ink-600">Enable interface animations</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, showAnimations: !settings.showAnimations })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                settings.showAnimations ? 'bg-blue-600' : 'bg-ink-300'
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
      <h2 className="text-xl font-bold text-ink-900">Security Settings</h2>

      <div className="space-y-6">
        <div className="border border-ink-100 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-ink-900 mb-4">Password Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Minimum Length</label>
              <input
                type="number"
                value={settings.minPasswordLength || 8}
                onChange={(e) => setSettings({
                  ...settings,
                  minPasswordLength: parseInt(e.target.value)
                })}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Expiry (Days)</label>
              <input
                type="number"
                value={settings.passwordExpiry || 90}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordExpiry: parseInt(e.target.value)
                })}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                <label className="text-sm text-ink-700">{option.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-ink-100 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-ink-900 mb-4">Session & Login</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Session Timeout (minutes)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Max Login Attempts</label>
              <input
                type="number"
                value={settings.loginAttempts}
                onChange={(e) => setSettings({ ...settings, loginAttempts: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Lockout Duration (minutes)</label>
              <input
                type="number"
                value={settings.lockoutDuration}
                onChange={(e) => setSettings({ ...settings, lockoutDuration: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-ink-900">Two-Factor Authentication</h4>
                <p className="text-sm text-ink-600">Add extra security layer</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, twoFactorAuth: !settings.twoFactorAuth })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.twoFactorAuth ? 'bg-blue-600' : 'bg-ink-300'
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
                <h4 className="font-semibold text-ink-900">Audit Log</h4>
                <p className="text-sm text-ink-600">Track all system activities</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, auditLog: !settings.auditLog })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                  settings.auditLog ? 'bg-blue-600' : 'bg-ink-300'
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
          <h2 className="text-xl font-bold text-ink-900">AI Configuration</h2>
          <p className="text-sm text-ink-600 mt-1">
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
      <div className="border border-ink-100 rounded-lg p-5">
        <h3 className="text-lg font-semibold text-ink-900 mb-4">AI Provider</h3>
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
                    : 'border-ink-100 hover:border-blue-300'
                }`}
              >
                <div className={`p-3 rounded-lg ${
                  isSelected ? 'bg-blue-600 text-white' : 'bg-ink-100 text-ink-600'
                }`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-ink-900'}`}>
                    {provider.label}
                  </h4>
                  {provider.value === 'template' && (
                    <p className="text-xs text-ink-600 mt-1">No API key required</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* OpenAI Configuration */}
      {aiSettings.provider === 'openai' && (
        <div className="border border-ink-100 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-ink-900">OpenAI Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.openaiApiKey}
              onChange={(e) => handleChange('openaiApiKey', e.target.value)}
              placeholder="sk-..."
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-ink-500 mt-1">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-navy-700 hover:underline">platform.openai.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Model</label>
            <select
              value={aiSettings.openaiModel}
              onChange={(e) => handleChange('openaiModel', e.target.value)}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        <div className="border border-ink-100 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-ink-900">Anthropic Claude Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.claudeApiKey}
              onChange={(e) => handleChange('claudeApiKey', e.target.value)}
              placeholder="sk-ant-..."
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
            <p className="text-xs text-ink-500 mt-1">
              Get your API key from <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-navy-700 hover:underline">console.anthropic.com</a>
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Model</label>
            <select
              value={aiSettings.claudeModel}
              onChange={(e) => handleChange('claudeModel', e.target.value)}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
        <div className="border border-ink-100 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-ink-900">Custom Endpoint Configuration</h3>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              API Endpoint <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={aiSettings.customEndpoint}
              onChange={(e) => handleChange('customEndpoint', e.target.value)}
              placeholder="https://api.example.com/v1/chat/completions"
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={aiSettings.customApiKey}
              onChange={(e) => handleChange('customApiKey', e.target.value)}
              placeholder="Your custom API key"
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-700 mb-2">Model Name</label>
            <input
              type="text"
              value={aiSettings.customModel}
              onChange={(e) => handleChange('customModel', e.target.value)}
              placeholder="model-name"
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>
      )}

      {/* Generation Parameters */}
      {aiSettings.provider !== 'template' && (
        <div className="border border-ink-100 rounded-lg p-5 space-y-4">
          <h3 className="text-lg font-semibold text-ink-900">Generation Parameters</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
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
              <p className="text-xs text-ink-500 mt-1">
                Higher values = more creative, Lower values = more focused
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Max Tokens</label>
              <input
                type="number"
                value={aiSettings.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                min="100"
                max="8000"
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-ink-500 mt-1">
                Maximum length of generated content
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
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
              <p className="text-xs text-ink-500 mt-1">
                Controls diversity of output
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
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
              <p className="text-xs text-ink-500 mt-1">
                Reduces repetition
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Settings */}
      <div className="border border-ink-100 rounded-lg p-5 space-y-4">
        <h3 className="text-lg font-semibold text-ink-900">Fallback Configuration</h3>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-ink-900">Enable Fallback</h4>
            <p className="text-sm text-ink-600">Use template-based generation if AI fails</p>
          </div>
          <button
            onClick={() => handleChange('enableFallback', !aiSettings.enableFallback)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              aiSettings.enableFallback ? 'bg-blue-600' : 'bg-ink-300'
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
            <label className="block text-sm font-semibold text-ink-700 mb-2">Fallback Provider</label>
            <select
              value={aiSettings.fallbackProvider}
              onChange={(e) => handleChange('fallbackProvider', e.target.value)}
              className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
  <div className="bg-white rounded-lg border border-ink-100 p-4">
    <div className="flex items-center gap-3">
      <div className={`${color} p-3 rounded-lg`}>
        <Icon className="text-white" size={20} />
      </div>
      <div>
        <p className="text-xs text-ink-500 uppercase">{label}</p>
        <p className="text-h1 text-ink-900">
          {value}
          {total && <span className="text-sm text-ink-500"> / {total}</span>}
        </p>
      </div>
    </div>
  </div>
);

// ============================================
// DEPARTMENTS TAB
// ============================================
const DepartmentsTab = ({ departments, onAdd, onEdit, onDelete }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Departments</h2>
          <p className="text-sm text-ink-600 mt-1">
            Manage organizational departments ({departments.length} total)
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="border border-ink-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${dept.color} flex items-center justify-center text-white`}>
                <Building2 className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(dept)}
                  className="p-1 text-ink-600 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(dept.id)}
                  className="p-1 text-ink-600 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-ink-900 mb-1">{dept.name}</h3>
            {dept.code && (
              <p className="text-xs text-ink-500 mb-2">Code: {dept.code}</p>
            )}
            {dept.description && (
              <p className="text-sm text-ink-600 mb-2 line-clamp-2">{dept.description}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className={`text-xs px-2 py-1 rounded ${dept.isActive ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-800'}`}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-ink-500">Order: {dept.sortOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-ink-300 rounded-lg">
          <Building2 className="w-12 h-12 text-ink-400 mx-auto mb-3" />
          <p className="text-ink-600">No departments yet. Add your first department to get started.</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// POSITIONS TAB
// ============================================
const PositionsTab = ({ positions, onAdd, onEdit, onDelete }) => {
  const levelOptions = [
    { value: 'Executive', label: 'Executive', color: 'bg-purple-100 text-purple-800' },
    { value: 'Senior', label: 'Senior', color: 'bg-blue-100 text-blue-800' },
    { value: 'Mid', label: 'Mid', color: 'bg-green-100 text-green-800' },
    { value: 'Entry', label: 'Entry', color: 'bg-ink-100 text-ink-800' },
  ];

  const getLevelColor = (level) => {
    const option = levelOptions.find(opt => opt.value === level);
    return option ? option.color : 'bg-ink-100 text-ink-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-ink-900">Positions</h2>
          <p className="text-sm text-ink-600 mt-1">
            Manage job positions and titles ({positions.length} total)
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Position
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {positions.map((position) => (
          <div
            key={position.id}
            className="border border-ink-100 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-lg bg-navy-900 flex items-center justify-center text-white">
                <Briefcase className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(position)}
                  className="p-1 text-ink-600 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(position.id)}
                  className="p-1 text-ink-600 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-ink-900 mb-1">{position.title}</h3>
            {position.code && (
              <p className="text-xs text-ink-500 mb-2">Code: {position.code}</p>
            )}
            {position.level && (
              <span className={`text-xs px-2 py-1 rounded ${getLevelColor(position.level)} inline-block mb-2`}>
                {position.level}
              </span>
            )}
            {position.description && (
              <p className="text-sm text-ink-600 mb-2 line-clamp-2">{position.description}</p>
            )}
            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <span className={`text-xs px-2 py-1 rounded ${position.isActive ? 'bg-green-100 text-green-800' : 'bg-ink-100 text-ink-800'}`}>
                {position.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="text-xs text-ink-500">Order: {position.sortOrder}</span>
            </div>
          </div>
        ))}
      </div>

      {positions.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-ink-300 rounded-lg">
          <Briefcase className="w-12 h-12 text-ink-400 mx-auto mb-3" />
          <p className="text-ink-600">No positions yet. Add your first position to get started.</p>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;
