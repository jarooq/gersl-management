import React, { useEffect, useState } from 'react';
import { CashAPI } from '../../../services/api';
import API from '../../../services/api';

const TYPES = ['CashBook', 'Locker', 'PettyCash'];

const blank = {
  type: 'CashBook',
  name: '',
  location: '',
  custodianUserId: '',
  altCustodianUserId: '',
  currency: 'LKR',
  imprestLimit: '',
  reorderPoint: '',
  openingBalance: 0,
  openingDate: '',
  notes: ''
};

export default function CashAccountFormModal({ account, onClose, onSaved }) {
  const editing = !!account;
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(() => editing ? { ...blank, ...account } : blank);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Use the existing UsersAPI (admin-only). Falls back gracefully if forbidden.
        const res = await API.Users.getAll().catch(() => ({ data: [] }));
        if (cancelled) return;
        const list = res?.data?.users || res?.data || [];
        setUsers(Array.isArray(list) ? list.filter(u => u.status === 'Active') : []);
      } catch (_) {
        // Stay silent — Form still works, the user just types IDs manually if needed.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name?.trim()) { setError('Name is required'); return; }
    if (!form.custodianUserId) { setError('Custodian is required'); return; }
    if (form.type === 'Locker' && !form.altCustodianUserId) {
      setError('Locker accounts require an alternate custodian');
      return;
    }

    const payload = {
      type: form.type,
      name: form.name,
      location: form.location || null,
      custodianUserId: Number(form.custodianUserId),
      altCustodianUserId: form.altCustodianUserId ? Number(form.altCustodianUserId) : null,
      currency: form.currency || 'LKR',
      imprestLimit: form.imprestLimit === '' ? null : Number(form.imprestLimit),
      reorderPoint: form.reorderPoint === '' ? null : Number(form.reorderPoint),
      openingBalance: Number(form.openingBalance ?? 0),
      openingDate: form.openingDate || null,
      notes: form.notes || null
    };

    setSubmitting(true);
    try {
      if (editing) await CashAPI.updateAccount(account.id, payload);
      else         await CashAPI.createAccount(payload);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? `Edit cash account — ${account.name}` : 'Add cash account'}
          </h2>
        </div>

        <form onSubmit={submit} className="px-5 py-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <label className="block">
            <span className="font-medium text-gray-700">Type</span>
            <select
              value={form.type}
              onChange={(e) => update('type', e.target.value)}
              disabled={editing}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="font-medium text-gray-700">Currency</span>
            <input
              value={form.currency}
              onChange={(e) => update('currency', e.target.value.toUpperCase().slice(0, 8))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="font-medium text-gray-700">Name</span>
            <input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. HQ Main Locker / Colombo Cashier Drawer / Jaffna Petty Cash"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="font-medium text-gray-700">Location</span>
            <input
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="font-medium text-gray-700">Custodian</span>
            <select
              value={form.custodianUserId}
              onChange={(e) => update('custodianUserId', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              required
            >
              <option value="">Select custodian</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName} — {u.role}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="font-medium text-gray-700">Alt custodian {form.type === 'Locker' && '(required)'}</span>
            <select
              value={form.altCustodianUserId}
              onChange={(e) => update('altCustodianUserId', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="">—</option>
              {users.filter(u => String(u.id) !== String(form.custodianUserId)).map(u => (
                <option key={u.id} value={u.id}>{u.fullName} — {u.role}</option>
              ))}
            </select>
          </label>

          {form.type === 'PettyCash' && (
            <>
              <label className="block">
                <span className="font-medium text-gray-700">Imprest limit</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.imprestLimit}
                  onChange={(e) => update('imprestLimit', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
              <label className="block">
                <span className="font-medium text-gray-700">Reorder point</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.reorderPoint}
                  onChange={(e) => update('reorderPoint', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </label>
            </>
          )}

          <label className="block">
            <span className="font-medium text-gray-700">Opening balance</span>
            <input
              type="number"
              step="0.01"
              value={form.openingBalance}
              onChange={(e) => update('openingBalance', e.target.value)}
              disabled={editing}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
          <label className="block">
            <span className="font-medium text-gray-700">Opening date</span>
            <input
              type="date"
              value={form.openingDate || ''}
              onChange={(e) => update('openingDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="font-medium text-gray-700">Notes</span>
            <textarea
              rows={2}
              value={form.notes || ''}
              onChange={(e) => update('notes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>

          {error && (
            <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-700 rounded-md p-2 text-sm">{error}</div>
          )}
        </form>

        <div className="px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
          <button onClick={submit} disabled={submitting} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Saving…' : (editing ? 'Save' : 'Create')}
          </button>
        </div>
      </div>
    </div>
  );
}
