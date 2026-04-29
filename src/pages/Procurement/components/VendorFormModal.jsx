import React, { useState } from 'react';
import { ProcurementAPI } from '../../../services/api';

const blank = {
  vendorName: '',
  vendorType: 'Supplier',
  contactPerson: '',
  email: '',
  phone: '',
  address: '',
  district: '',
  taxId: '',
  vatNo: '',
  registrationNo: '',
  bankAccountName: '',
  bankName: '',
  branch: '',
  accountNo: '',
  swift: '',
  paymentTerms: 'Net 30',
  categories: '',
  notes: ''
};

export default function VendorFormModal({ vendor, onClose, onSaved }) {
  const editing = !!vendor;
  const [form, setForm] = useState(() => editing
    ? { ...blank, ...vendor, categories: (vendor.categories || []).join(', ') }
    : blank);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.vendorName.trim()) { setError('Vendor name is required'); return; }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        categories: form.categories
          ? form.categories.split(',').map(s => s.trim()).filter(Boolean)
          : []
      };
      if (editing) await ProcurementAPI.updateVendorMaster(vendor.id, payload);
      else         await ProcurementAPI.createVendorMaster(payload);
      onSaved?.();
    } catch (err) {
      setError(err?.message || 'Save failed');
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ label, name, type = 'text', placeholder = '' }) => (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <input
        type={type}
        value={form[name] || ''}
        onChange={(e) => update(name, e.target.value)}
        placeholder={placeholder}
        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? `Edit vendor — ${vendor.vendorCode || vendor.vendorName}` : 'Add vendor'}
          </h2>
        </div>
        <form onSubmit={submit} className="px-5 py-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Vendor name *" name="vendorName" />
          <Field label="Vendor type" name="vendorType" placeholder="Supplier / Contractor / Service Provider" />
          <Field label="Contact person" name="contactPerson" />
          <Field label="Email" name="email" type="email" />
          <Field label="Phone" name="phone" />
          <Field label="District" name="district" />
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Address</span>
            <textarea
              rows={2}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <Field label="Tax ID" name="taxId" />
          <Field label="VAT no" name="vatNo" />
          <Field label="Registration no" name="registrationNo" />
          <Field label="Payment terms" name="paymentTerms" />
          <Field label="Bank account name" name="bankAccountName" />
          <Field label="Bank name" name="bankName" />
          <Field label="Branch" name="branch" />
          <Field label="Account no" name="accountNo" />
          <Field label="SWIFT" name="swift" />
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Categories (comma-separated)</span>
            <input
              type="text"
              value={form.categories}
              onChange={(e) => update('categories', e.target.value)}
              placeholder="Stationery, Construction, IT"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-gray-700">Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
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
