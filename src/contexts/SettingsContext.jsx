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

  // Roles & Permissions - fetch from database
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState({});

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

  // Fetch roles from database
  const fetchRoles = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching roles from API...');
      const response = await API.Roles.getAll();
      console.log('✅ Roles API response:', response);
      // API.Roles.getAll() returns data.data from the response
      // The response is already the roles array
      const rolesArray = Array.isArray(response) ? response : (response?.roles || []);
      console.log('✅ Roles array:', rolesArray);
      setRoles(rolesArray);
    } catch (error) {
      console.error('❌ Failed to fetch roles:', error);
      console.error('Error details:', error.response || error.message);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions from database
  const fetchPermissions = async () => {
    setLoading(true);
    try {
      console.log('🔄 Fetching permissions from API...');
      const permsData = await API.Roles.getAllPermissions();
      console.log('✅ Permissions API response:', permsData);
      if (permsData && permsData.permissions && permsData.permissions.length > 0) {
        console.log('✅ First permission object:', permsData.permissions[0]);
      }
      setPermissions(permsData);
    } catch (error) {
      console.error('❌ Failed to fetch permissions:', error);
      setPermissions({});
    } finally {
      setLoading(false);
    }
  };


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
  const addRole = async (roleData) => {
    setLoading(true);
    try {
      console.log('🔄 Creating new role:', roleData);
      const newRole = await API.Roles.create(roleData);
      console.log('✅ Role created successfully:', newRole);
      await fetchRoles(); // Refresh the roles list
      return newRole;
    } catch (error) {
      console.error('❌ Failed to create role:', error);
      console.error('Error details:', error.response || error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (id, updates) => {
    setLoading(true);
    try {
      await API.Roles.update(id, updates);
      await fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error('Failed to update role:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (id) => {
    setLoading(true);
    try {
      await API.Roles.delete(id);
      await fetchRoles(); // Refresh the roles list
    } catch (error) {
      console.error('Failed to delete role:', error);
      throw error;
    } finally {
      setLoading(false);
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
    fetchRoles,
    fetchPermissions,
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
