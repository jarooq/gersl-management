import React, { useMemo, useState } from 'react';
import { CashAPI } from '../../../services/api';
import { X, Upload, FileText } from 'lucide-react';

// =============================================================================
// BulkReceiptsModal — paste CSV (or pick a file) → preview → atomic batch post.
// Use case: donor batch, fundraiser collection, daily cash drops where the
// accountant types or pastes many rows from Excel.
//
// CSV columns (all optional except amount, header row optional):
//   amount, payee, description, date
// Examples:
//   1500, Anonymous Donor, Fundraiser
//   2000, Maria Silva, Sponsor — November
//   500
// =============================================================================

const splitCsvLine = (line) => {
  // Minimal CSV split — handles "quoted, fields" but not embedded escaped
  // quotes. Sufficient for accountant-typed batches; not RFC-strict.
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQ = !inQ; continue; }
    if (c === ',' && !inQ) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  out.push(cur.trim());
  return out;
};

const parseCsv = (text) => {
  const rows = [];
  const errors = [];
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return { rows, errors: ['No data to import'] };

  // Skip a header row if the first cell isn't a number.
  let start = 0;
  const first = splitCsvLine(lines[0]);
  if (!Number.isFinite(Number(first[0]))) start = 1;

  for (let i = start; i < lines.length; i++) {
    const cells = splitCsvLine(lines[i]);
    const amount = Number(cells[0]);
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Line ${i + 1}: invalid amount "${cells[0]}"`);
      continue;
    }
    rows.push({
      amount,
      payeeName:   cells[1] || null,
      description: cells[2] || null,
      occurredAt:  cells[3] || null,
      _line: i + 1,
    });
  }
  return { rows, errors };
};

const BulkReceiptsModal = ({ accountId, accountName, currency = 'LKR', onClose, onSuccess }) => {
  const [csvText, setCsvText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  };

  const parsed = useMemo(() => parseCsv(csvText), [csvText]);
  const { rows, errors } = parsed;
  const total = rows.reduce((s, r) => s + r.amount, 0);

  const submit = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await CashAPI.bulkReceipts(accountId, rows.map(r => ({
        amount: r.amount,
        payeeName: r.payeeName,
        description: r.description,
        occurredAt: r.occurredAt || undefined,
      })));
      const count = resp?.data?.count ?? rows.length;
      const got = resp?.data?.totalReceived ?? total;
      onSuccess?.({ count, total: got });
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Bulk import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
         onClick={() => !busy && onClose?.()}>
      <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto"
           onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload size={20} />
            <div>
              <h2 className="text-xl font-bold">Bulk import receipts</h2>
              <p className="text-xs text-ink-200">{accountName} · {currency}</p>
            </div>
          </div>
          <button onClick={() => !busy && onClose?.()} className="p-2 hover:bg-white/20 rounded">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-md px-4 py-3 text-sm text-blue-900">
            <div className="font-semibold flex items-center gap-1.5 mb-1">
              <FileText size={14} /> CSV format
            </div>
            <p className="mb-1">One row per receipt. Columns:</p>
            <code className="block bg-white border border-blue-200 rounded px-2 py-1 font-mono text-xs">
              amount, payee, description, date (YYYY-MM-DD)
            </code>
            <p className="text-xs text-blue-700 mt-2">
              First row may be a header (auto-skipped). Only <strong>amount</strong> is required;
              other fields are optional. Date defaults to today.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-sm font-semibold text-ink-700">
              Paste CSV
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`amount, payee, description\n1500, Anonymous Donor, Fundraiser\n2000, Maria Silva, Sponsor — November`}
                rows={10}
                className="mt-1 w-full px-3 py-2 border border-ink-200 rounded-md text-sm font-mono focus:ring-2 focus:ring-navy-700 focus:border-transparent"
              />
            </label>
            <label className="text-sm font-semibold text-ink-700">
              …or upload a .csv file
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => handleFile(e.target.files?.[0])}
                className="mt-1 w-full text-sm file:mr-3 file:px-3 file:py-1.5 file:border-0 file:rounded-md file:bg-navy-900 file:text-white"
              />
              <span className="block text-xs font-normal text-ink-500 mt-2">
                The file's text is loaded into the box on the left so you can review before submitting.
              </span>
            </label>
          </div>

          {/* Parse summary + errors */}
          {csvText && (
            <div className="border border-ink-100 rounded-md p-3 bg-ink-50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ink-700">
                  <strong>{rows.length}</strong> valid row{rows.length !== 1 && 's'}
                  {errors.length > 0 && <span className="text-red-700"> · {errors.length} error{errors.length !== 1 && 's'}</span>}
                </span>
                <span className="font-bold text-ink-900">
                  Total: {currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {errors.length > 0 && (
                <ul className="text-xs text-red-700 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
                  {errors.map((e, i) => <li key={i}>• {e}</li>)}
                </ul>
              )}
              {rows.length > 0 && (
                <div className="mt-3 max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="text-ink-500">
                      <tr>
                        <th className="text-left px-2 py-1">#</th>
                        <th className="text-right px-2 py-1">Amount</th>
                        <th className="text-left px-2 py-1">Payee</th>
                        <th className="text-left px-2 py-1">Description</th>
                        <th className="text-left px-2 py-1">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 50).map((r, i) => (
                        <tr key={i} className="border-t border-ink-100">
                          <td className="px-2 py-1 text-ink-400">{r._line}</td>
                          <td className="px-2 py-1 text-right font-mono">{r.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          <td className="px-2 py-1">{r.payeeName || '—'}</td>
                          <td className="px-2 py-1">{r.description || '—'}</td>
                          <td className="px-2 py-1 text-ink-600">{r.occurredAt || 'today'}</td>
                        </tr>
                      ))}
                      {rows.length > 50 && (
                        <tr><td colSpan={5} className="px-2 py-1 text-center text-ink-500">+{rows.length - 50} more not shown…</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 text-sm">{error}</div>
          )}
        </div>

        <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-4 rounded-b-lg2 flex justify-end gap-2">
          <button
            onClick={() => !busy && onClose?.()}
            disabled={busy}
            className="px-4 py-2 text-sm font-semibold border border-ink-200 text-ink-700 rounded-md hover:bg-ink-100 disabled:opacity-50"
          >Cancel</button>
          <button
            onClick={submit}
            disabled={busy || rows.length === 0 || errors.length > 0}
            className="px-5 py-2 text-sm font-semibold rounded-md bg-orange-500 text-white hover:bg-navy-800 disabled:opacity-50"
            title={errors.length > 0 ? 'Fix the errors above before submitting' : ''}
          >
            {busy ? 'Posting…' : `Post ${rows.length} receipt${rows.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkReceiptsModal;
