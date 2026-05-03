import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProcurementAPI } from '../../services/api';

const Tile = ({ label, value, sub, color = 'text-ink-900' }) => (
  <div className="bg-white border border-ink-100 rounded-md p-4">
    <div className="text-xs uppercase text-ink-500">{label}</div>
    <div className={`text-2xl font-semibold mt-1 ${color}`}>{value ?? '—'}</div>
    {sub && <div className="text-xs text-ink-500 mt-1">{sub}</div>}
  </div>
);

const fmtMoney = (n) => Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function ProcurementDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await ProcurementAPI.getProcurementDashboard();
        if (cancelled) return;
        setData(res?.data || null);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="p-6 text-sm text-ink-500">Loading…</div>;
  if (error) return <div className="p-6 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{error}</div>;
  if (!data) return null;

  const counters = data.counters || {};
  const pending = data.pendingActions || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <header>
        <h1 className="text-h1 text-ink-900">Procurement dashboard</h1>
        <p className="text-sm text-ink-500">Activity since {new Date(data.from).toLocaleDateString()}.</p>
      </header>

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Tile label="Avg cycle (days)" value={data.avgCycleDays ?? '—'} sub="PR → PO Issued" />
        <Tile label="Unassigned PRs" value={pending.unassignedRequisitions} color="text-yellow-700" sub={<Link to="/admin/procurement/inbox" className="underline">Open inbox</Link>} />
        <Tile label="POs awaiting approval" value={pending.pendingApprovalPOs} color="text-blue-700" />
        <Tile label="Open match discrepancies" value={pending.openDiscrepancies} color="text-red-700" />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-ink-100 rounded-md">
          <div className="px-4 py-3 border-b border-ink-100 font-semibold text-sm">Top vendors by spend</div>
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-ink-500">Vendor</th>
                <th className="px-3 py-2 text-right text-xs uppercase text-ink-500">POs</th>
                <th className="px-3 py-2 text-right text-xs uppercase text-ink-500">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(data.spendByVendor || []).length === 0 && (
                <tr><td colSpan={3} className="p-3 text-center text-ink-500 text-xs">No POs in window.</td></tr>
              )}
              {(data.spendByVendor || []).map(r => (
                <tr key={r.vendorId}>
                  <td className="px-3 py-2">{r.vendorName}</td>
                  <td className="px-3 py-2 text-right">{r.poCount}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(r.totalSpend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white border border-ink-100 rounded-md">
          <div className="px-4 py-3 border-b border-ink-100 font-semibold text-sm">Spend by category</div>
          <table className="min-w-full text-sm">
            <thead className="bg-ink-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs uppercase text-ink-500">Category</th>
                <th className="px-3 py-2 text-right text-xs uppercase text-ink-500">POs</th>
                <th className="px-3 py-2 text-right text-xs uppercase text-ink-500">Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {(data.spendByCategory || []).length === 0 && (
                <tr><td colSpan={3} className="p-3 text-center text-ink-500 text-xs">No data.</td></tr>
              )}
              {(data.spendByCategory || []).map(r => (
                <tr key={r.category}>
                  <td className="px-3 py-2">{r.category}</td>
                  <td className="px-3 py-2 text-right">{r.count}</td>
                  <td className="px-3 py-2 text-right">{fmtMoney(r.spend)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CounterPanel title="Requisitions" map={counters.requisitions} />
        <CounterPanel title="RFQs"         map={counters.rfqs} />
        <CounterPanel title="Purchase Orders" map={counters.purchaseOrders} />
        <CounterPanel title="Goods Receipts" map={counters.grns} />
        <CounterPanel title="3-way matches"  map={counters.threeWayMatches} />
        <CounterPanel title="Vendors"        map={counters.vendors} extra={
          <div className="text-xs text-yellow-800 mt-2">
            {counters.pendingDueDiligence || 0} pending due diligence
          </div>
        } />
      </section>
    </div>
  );
}

function CounterPanel({ title, map, extra }) {
  const entries = Object.entries(map || {});
  return (
    <div className="bg-white border border-ink-100 rounded-md p-4">
      <div className="text-sm font-semibold text-ink-900 mb-2">{title}</div>
      {entries.length === 0 && <div className="text-xs text-ink-500">No data</div>}
      <ul className="text-sm space-y-1">
        {entries.map(([status, n]) => (
          <li key={status} className="flex items-center justify-between">
            <span className="text-ink-700">{status}</span>
            <span className="font-medium">{n}</span>
          </li>
        ))}
      </ul>
      {extra}
    </div>
  );
}
