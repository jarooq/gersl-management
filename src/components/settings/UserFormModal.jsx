import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, Save, UserPlus, Edit2, AlertCircle } from 'lucide-react';
import { ROLE_PERMISSIONS } from '../../utils/permissions';

const UserFormModal = ({ isOpen, onClose, onSubmit, user = null, isLoading = false }) => {
  const isEditMode = !!user;

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    role: 'Guest',
    department: '',
    phone: '',
    status: 'Active'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        email: user.email || '',
        password: '', // Never populate password in edit mode
        role: user.role || 'Guest',
        department: user.department || '',
        phone: user.phone || '',
        status: user.status || 'Active'
      });
    } else {
      // Reset form for add mode
      setFormData({
        username: '',
        fullName: '',
        email: '',
        password: generatePassword(),
        role: 'Guest',
        department: '',
        phone: '',
        status: 'Active'
      });
    }
    setErrors({});
    setTouched({});
  }, [user, isOpen]);

  const generatePassword = () => {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';
    const all = uppercase + lowercase + numbers + special;

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = password.length; i < length; i++) {
      password += all[Math.floor(Math.random() * all.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation only for add mode or if password is being changed
    if (!isEditMode || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one lowercase letter';
      } else if (!/(?=.*[A-Z])/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one uppercase letter';
      } else if (!/(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one number';
      } else if (!/(?=.*[!@#$%^&*])/.test(formData.password)) {
        newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
      }
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    const allTouched = {};
    Object.keys(formData).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);

    if (validateForm()) {
      // In edit mode, only send changed fields
      const dataToSubmit = isEditMode
        ? Object.keys(formData).reduce((acc, key) => {
            // Don't send password if empty in edit mode
            if (key === 'password' && !formData[key]) return acc;
            // Don't send username (can't be changed)
            if (key === 'username') return acc;
            acc[key] = formData[key];
            return acc;
          }, {})
        : formData;

      try {
        await onSubmit(dataToSubmit);
      } catch (error) {
        // Error will be shown by parent component
      }
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generatePassword();
    setFormData(prev => ({
      ...prev,
      password: newPassword
    }));
    setShowPassword(true);
    setTimeout(() => setShowPassword(false), 5000); // Hide after 5 seconds
  };

  if (!isOpen) return null;

  const departments = ['Programmes', 'Finance', 'HR', 'Fundraising', 'M&E', 'IT', 'Admin'];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEditMode ? <Edit2 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              <div>
                <h2 className="text-2xl font-bold">
                  {isEditMode ? 'Edit User' : 'Add New User'}
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {isEditMode ? 'Update user information and permissions' : 'Create a new user account with role-based access'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onBlur={() => handleBlur('username')}
                  disabled={isEditMode} // Can't change username
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errors.username && touched.username ? 'border-red-500' : 'border-ink-300'
                  } ${isEditMode ? 'bg-ink-100 cursor-not-allowed' : ''}`}
                  placeholder="john.doe"
                />
                {errors.username && touched.username && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  onBlur={() => handleBlur('fullName')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errors.fullName && touched.fullName ? 'border-red-500' : 'border-ink-300'
                  }`}
                  placeholder="John Doe"
                />
                {errors.fullName && touched.fullName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errors.email && touched.email ? 'border-red-500' : 'border-ink-300'
                  }`}
                  placeholder="john.doe@gersl.org"
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phone')}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition ${
                    errors.phone && touched.phone ? 'border-red-500' : 'border-ink-300'
                  }`}
                  placeholder="+94 77 123 4567"
                />
                {errors.phone && touched.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div>
            <h3 className="text-lg font-semibold text-ink-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              Security & Access
            </h3>
            <div className="space-y-4">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Password {!isEditMode && <span className="text-red-500">*</span>}
                  {isEditMode && <span className="text-ink-500 text-xs">(leave empty to keep current)</span>}
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={() => handleBlur('password')}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition pr-10 ${
                        errors.password && touched.password ? 'border-red-500' : 'border-ink-300'
                      }`}
                      placeholder={isEditMode ? "Enter new password" : "Password will be generated"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition flex items-center gap-2 font-medium"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Generate
                  </button>
                </div>
                {errors.password && touched.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.password}
                  </p>
                )}
                {!isEditMode && (
                  <p className="mt-2 text-sm text-ink-600">
                    ℹ️ Copy this password and share it securely with the user. They can change it after first login.
                  </p>
                )}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  {Object.keys(ROLE_PERMISSIONS || {}).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-ink-600">
                  Selected role determines the user's permissions and access level
                </p>
              </div>

              {/* Department */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Department
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-ink-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ink-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2 border border-ink-300 text-ink-700 rounded-lg hover:bg-ink-50 transition font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-navy-900 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditMode ? 'Update User' : 'Create User'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
