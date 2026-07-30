import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

import { ROLE_PERMISSIONS } from '../../utils/permissions';

const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api').replace(/\/+$/, '');

// =============================================================================
// StaffRegisterPage — full-page clone of the HR Add-Staff modal.
// Same fields, same validation, same API.HR.create() call. Routed at
// /admin/staff-register so HR can hand a tablet to a new staff member to
// fill out their own basics (name, email, department, position, login).
//
// Audit-hardening 2026-05-15: the role/position dropdown now comes from
// the same ROLE_PERMISSIONS source as Settings → User Management. Before
// this change, two separate hardcoded arrays drifted (this file listed
// "positions", Settings listed "roles") and adding a role required
// updating both. Single source of truth lives in utils/permissions.js.
// =============================================================================

const DEPARTMENTS = [
  'Governance', 'Executive', 'Programmes', 'Finance',
  'Fundraising', 'HR', 'MEAL', 'IT'
];

const POSITIONS = Object.keys(ROLE_PERMISSIONS);

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  joiningDate: '',
  username: '',
  password: ''
};

const StaffRegisterPage = () => {
  const navigate = useNavigate();
  const [staffForm, setStaffForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const update = (field, value) => setStaffForm(s => ({ ...s, [field]: value }));

  const handleSubmit = async () => {
    setError(null);

    if (!staffForm.fullName || !staffForm.email || !staffForm.department || !staffForm.position) {
      setError('Please fill in all required fields (name, email, department, position)');
      return;
    }
    if (!staffForm.username || !staffForm.password) {
      setError('Please provide a username and password');
      return;
    }
    if (staffForm.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/staff-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.message || `Registration failed (${res.status})`);
      }
      setSuccess(true);
      setStaffForm(EMPTY);
    } catch (err) {
      setError(err?.message || 'Failed to register staff member');
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-h2 font-bold text-ink-900 mb-2">Registration submitted</h2>
          <p className="text-ink-600 mb-6">
            Your details have been received. HR will review and activate your
            account — you'll be able to log in once approved.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold"
            >
              Register another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      {/* Hero header */}
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5 text-mission-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">HR · Onboarding</p>
              <h1 className="text-h2 font-bold leading-tight">Register Staff Member</h1>
              <p className="text-ink-200 text-sm mt-0.5">Fill in basic details and create login credentials</p>
            </div>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-2 rounded-md bg-white/10 hover:bg-white/15 border border-white/20 text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-6">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={staffForm.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Phone</label>
              <input
                type="tel"
                value={staffForm.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                placeholder="+94 77 123 4567"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Department <span className="text-red-500">*</span>
              </label>
              <select
                value={staffForm.department}
                onChange={(e) => update('department', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">
                Position <span className="text-red-500">*</span>
              </label>
              <select
                value={staffForm.position}
                onChange={(e) => update('position', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Position</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink-700 mb-2">Joining Date</label>
              <input
                type="date"
                value={staffForm.joiningDate}
                onChange={(e) => update('joiningDate', e.target.value)}
                className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

          </div>

          {/* User Account Settings */}
          <div className="mt-6 pt-6 border-t border-ink-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus size={18} className="text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-ink-800">User Account Settings</h3>
            </div>
            <p className="text-sm text-ink-600 mb-4">
              Choose a username and password. Your account will be reviewed and
              activated by HR before you can log in.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={staffForm.username}
                  onChange={(e) => update('username', e.target.value)}
                  className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="john.doe"
                  autoComplete="username"
                />
                <p className="text-xs text-ink-500 mt-1">This will be used for logging in</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => update('password', e.target.value)}
                  className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <p className="text-xs text-ink-500 mt-1">Minimum 8 characters</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-6 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
            <div className="text-sm text-red-800 font-medium">{error}</div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-ink-100 flex justify-end gap-3">
          <button
            onClick={() => navigate(-1)}
            disabled={busy}
            className="px-6 py-3 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 font-semibold disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold shadow-md hover:bg-navy-800 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <UserPlus size={18} />
            {busy ? 'Registering…' : 'Register Staff Member'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffRegisterPage;
