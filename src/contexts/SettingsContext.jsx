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
  const [loading, setLoading] = useState(true);

  // Fetch users from backend on mount
  useEffect(() => {
    const fetchUsers = async () => {
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

    fetchUsers();
  }, []);

  // Legacy mock data removed - now using real backend data

  // Roles & Permissions
  const [roles, setRoles] = useState([]);

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
  const addUser = (userData) => {
    const newUser = {
      ...userData,
      id: Math.max(...users.map(u => u.id), 0) + 1,
      createdDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      lastLogin: null
    };
    setUsers([...users, newUser]);
    return newUser;
  };

  const updateUser = (id, updates) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...updates } : u));
  };

  const deleteUser = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.id !== id));
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
      totalRoles: roles.length,
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
    notificationSettings,
    backupSettings,
    integrationSettings,
    appearanceSettings,
    securitySettings,
    performanceTargets,

    // Setters
    setSystemSettings,
    setNotificationSettings,
    setBackupSettings,
    setIntegrationSettings,
    setAppearanceSettings,
    setSecuritySettings,
    setPerformanceTargets,

    // User Methods
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
