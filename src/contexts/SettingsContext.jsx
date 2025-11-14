import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import {
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_BACKUP_SETTINGS,
  DEFAULT_INTEGRATION_SETTINGS,
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_PERFORMANCE_TARGETS
} from '../constants/defaultSettings';

const SettingsContext = createContext(null);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // System Settings - Use defaults from constants
  const [systemSettings, setSystemSettings] = useState(DEFAULT_SYSTEM_SETTINGS);

  // User Management - fetch from backend
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch users function - to be called when Settings page is accessed
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await API.Users.getAll();
      const transformedUsers = response.map(user => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status || 'Active',
        department: user.department || '',
        phone: user.phone || '',
        lastLogin: user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never',
        createdDate: new Date(user.createdAt).toISOString().split('T')[0],
        permissions: [] // Backend handles permissions via role
      }));
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]); // Keep empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Legacy mock data removed - now using real backend data

  // Roles & Permissions - Initialize with all organizational roles
  const [roles, setRoles] = useState({
    'Admin': {
      orphans: { view: true, create: true, edit: true, delete: true, approve: true },
      projects: { view: true, create: true, edit: true, delete: true, approve: true },
      finance: { view: true, create: true, edit: true, delete: true, approve: true },
      hr: { view: true, create: true, edit: true, delete: true, approve: true },
      cbo: { view: true, create: true, edit: true, delete: true, approve: true },
      partners: { view: true, create: true, edit: true, delete: true, approve: true },
      proposals: { view: true, create: true, edit: true, delete: true, approve: true },
      meal: { view: true, create: true, edit: true, delete: true, approve: true },
      campaigns: { view: true, create: true, edit: true, delete: true, approve: true },
      donations: { view: true, create: true, edit: true, delete: true, approve: true },
      reports: { view: true, create: true, edit: true, delete: true, approve: true },
      compliance: { view: true, create: true, edit: true, delete: true, approve: true },
      settings: { view: true, create: true, edit: true, delete: true, approve: true },
    },
    'BOD': {
      orphans: { view: true, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, approve: false },
      hr: { view: true, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: false, edit: false, delete: false, approve: false },
      partners: { view: true, create: false, edit: false, delete: false, approve: false },
      proposals: { view: true, create: false, edit: false, delete: false, approve: false },
      meal: { view: true, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: true, create: false, edit: false, delete: false, approve: false },
      donations: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: true, create: false, edit: false, delete: false, approve: false },
      settings: { view: true, create: false, edit: false, delete: false, approve: false },
    },
    'CEO': {
      orphans: { view: true, create: false, edit: false, delete: false, approve: true },
      projects: { view: true, create: false, edit: false, delete: false, approve: true },
      finance: { view: true, create: false, edit: false, delete: false, approve: true },
      hr: { view: true, create: false, edit: false, delete: false, approve: true },
      cbo: { view: true, create: false, edit: false, delete: false, approve: true },
      partners: { view: true, create: true, edit: true, delete: false, approve: false },
      proposals: { view: true, create: false, edit: false, delete: false, approve: true },
      meal: { view: true, create: false, edit: false, delete: false, approve: true },
      campaigns: { view: true, create: false, edit: false, delete: false, approve: true },
      donations: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      compliance: { view: true, create: false, edit: true, delete: false, approve: false },
      settings: { view: true, create: false, edit: true, delete: false, approve: false },
    },
    'Director Programmes': {
      orphans: { view: true, create: true, edit: true, delete: false, approve: true },
      projects: { view: true, create: true, edit: true, delete: false, approve: true },
      finance: { view: true, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: false, edit: false, delete: false, approve: true },
      partners: { view: true, create: false, edit: false, delete: false, approve: false },
      proposals: { view: true, create: true, edit: true, delete: false, approve: true },
      meal: { view: true, create: false, edit: false, delete: false, approve: true },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: true, create: false, edit: false, delete: false, approve: false },
    },
    'Programme Manager': {
      orphans: { view: true, create: true, edit: true, delete: false, approve: true },
      projects: { view: true, create: true, edit: true, delete: false, approve: true },
      finance: { view: true, create: false, edit: false, delete: false, approve: true },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: false, edit: true, delete: false, approve: true },
      partners: { view: true, create: false, edit: false, delete: false, approve: false },
      proposals: { view: true, create: true, edit: true, delete: false, approve: false },
      meal: { view: true, create: true, edit: true, delete: false, approve: true },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Finance Manager': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: true, edit: true, delete: true, approve: true },
      hr: { view: true, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: true, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Finance Officer': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: true, edit: true, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Fundraising Manager': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: true, edit: true, delete: false, approve: false },
      partners: { view: true, create: true, edit: true, delete: false, approve: false },
      proposals: { view: true, create: true, edit: true, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: true, create: true, edit: true, delete: false, approve: false },
      donations: { view: true, create: true, edit: true, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'HR Manager': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: false, edit: false, delete: false, approve: false },
      hr: { view: true, create: true, edit: true, delete: true, approve: true },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'HR Officer': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: true, create: true, edit: true, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Project Officer': {
      orphans: { view: true, create: true, edit: true, delete: false, approve: false },
      projects: { view: true, create: true, edit: true, delete: false, approve: false },
      finance: { view: true, create: true, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: false, edit: false, delete: false, approve: false },
      partners: { view: true, create: false, edit: false, delete: false, approve: false },
      proposals: { view: true, create: false, edit: false, delete: false, approve: false },
      meal: { view: true, create: true, edit: true, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Field Officer': {
      orphans: { view: true, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: true, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: true, create: true, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'MEAL Officer': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: true, create: true, edit: true, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: true, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Media Officer': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: true, create: true, edit: true, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Accountant': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: true, create: false, edit: false, delete: false, approve: false },
      finance: { view: true, create: true, edit: true, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: true, create: false, edit: false, delete: false, approve: false },
      reports: { view: true, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Orphan Coordinator': {
      orphans: { view: true, create: true, edit: true, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
    'Guest': {
      orphans: { view: false, create: false, edit: false, delete: false, approve: false },
      projects: { view: false, create: false, edit: false, delete: false, approve: false },
      finance: { view: false, create: false, edit: false, delete: false, approve: false },
      hr: { view: false, create: false, edit: false, delete: false, approve: false },
      cbo: { view: false, create: false, edit: false, delete: false, approve: false },
      partners: { view: false, create: false, edit: false, delete: false, approve: false },
      proposals: { view: false, create: false, edit: false, delete: false, approve: false },
      meal: { view: false, create: false, edit: false, delete: false, approve: false },
      campaigns: { view: false, create: false, edit: false, delete: false, approve: false },
      donations: { view: false, create: false, edit: false, delete: false, approve: false },
      reports: { view: false, create: false, edit: false, delete: false, approve: false },
      compliance: { view: false, create: false, edit: false, delete: false, approve: false },
      settings: { view: false, create: false, edit: false, delete: false, approve: false },
    },
  });

  // Permissions structure - defines available modules
  const [permissions, setPermissions] = useState({
    orphans: {},
    projects: {},
    finance: {},
    hr: {},
    cbo: {},
    partners: {},
    proposals: {},
    meal: {},
    campaigns: {},
    donations: {},
    reports: {},
    compliance: {},
    settings: {},
  });

  // Notification Settings - Use defaults from constants
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS);

  // Backup Settings - Use defaults from constants
  const [backupSettings, setBackupSettings] = useState(DEFAULT_BACKUP_SETTINGS);

  // Integration Settings - Use defaults from constants
  const [integrationSettings, setIntegrationSettings] = useState(DEFAULT_INTEGRATION_SETTINGS);

  // Appearance Settings - Use defaults from constants
  const [appearanceSettings, setAppearanceSettings] = useState(DEFAULT_APPEARANCE_SETTINGS);

  // Security Settings - Use defaults from constants
  const [securitySettings, setSecuritySettings] = useState(DEFAULT_SECURITY_SETTINGS);

  // Performance Metric Targets - Use defaults from constants
  const [performanceTargets, setPerformanceTargets] = useState(DEFAULT_PERFORMANCE_TARGETS);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('gersl_settings');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.systemSettings) setSystemSettings(data.systemSettings);
        if (data.users) setUsers(data.users);
        if (data.roles) setRoles(data.roles);
        if (data.notificationSettings) setNotificationSettings(data.notificationSettings);
        if (data.backupSettings) setBackupSettings(data.backupSettings);
        if (data.integrationSettings) setIntegrationSettings(data.integrationSettings);
        if (data.appearanceSettings) setAppearanceSettings(data.appearanceSettings);
        if (data.securitySettings) setSecuritySettings(data.securitySettings);
        if (data.performanceTargets) setPerformanceTargets(data.performanceTargets);
        // Backward compatibility: migrate old financialTargets to new structure
        if (data.financialTargets && !data.performanceTargets) {
          setPerformanceTargets(prev => ({
            ...prev,
            financial: data.financialTargets
          }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_settings', JSON.stringify({
      systemSettings,
      users,
      roles,
      notificationSettings,
      backupSettings,
      integrationSettings,
      appearanceSettings,
      securitySettings,
      performanceTargets
    }));
  }, [systemSettings, users, roles, notificationSettings, backupSettings, integrationSettings, appearanceSettings, securitySettings, performanceTargets]);

  // User Management Functions
  const addUser = async (userData) => {
    try {
      const newUser = await API.Users.create(userData);
      // Refresh users list
      await fetchUsers();
      return newUser;
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      await API.Users.update(id, updates);
      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const deleteUser = async (id) => {
    try {
      await API.Users.delete(id);
      // Update local state immediately
      setUsers(users.filter(u => u.id !== id));
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  };

  const toggleUserStatus = (id) => {
    setUsers(users.map(u =>
      u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
    ));
  };

  // Role Management Functions
  const addRole = (roleData) => {
    const newRole = {
      ...roleData,
      id: Math.max(...roles.map(r => r.id), 0) + 1,
      userCount: 0
    };
    setRoles([...roles, newRole]);
    return newRole;
  };

  const updateRole = (id, updates) => {
    setRoles(roles.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRole = (id) => {
    const role = roles.find(r => r.id === id);
    if (role.userCount > 0) {
      alert('Cannot delete role with active users. Please reassign users first.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this role?')) {
      setRoles(roles.filter(r => r.id !== id));
    }
  };

  // Backup Functions
  const triggerBackup = () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setBackupSettings({
      ...backupSettings,
      lastBackup: now,
      nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
    });
    return { success: true, timestamp: now };
  };

  const restoreBackup = (backupId) => {
    // In real app, this would restore from actual backup
    return { success: true, backupId };
  };

  // Statistics
  const getStats = () => {
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.status === 'Active').length,
      inactiveUsers: users.filter(u => u.status === 'Inactive').length,
      totalRoles: Object.keys(roles).length,
      emailEnabled: notificationSettings.emailNotifications,
      backupEnabled: backupSettings.autoBackup,
      twoFactorEnabled: securitySettings.twoFactorAuth
    };
  };

  const value = {
    // State
    systemSettings,
    users,
    roles,
    permissions,
    notificationSettings,
    backupSettings,
    integrationSettings,
    appearanceSettings,
    securitySettings,
    performanceTargets,
    loading,

    // Setters
    setSystemSettings,
    setNotificationSettings,
    setBackupSettings,
    setIntegrationSettings,
    setAppearanceSettings,
    setSecuritySettings,
    setPerformanceTargets,
    setRoles,
    setPermissions,

    // User Methods
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,

    // Role Methods
    addRole,
    updateRole,
    deleteRole,

    // Backup Methods
    triggerBackup,
    restoreBackup,

    // Stats
    getStats
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
