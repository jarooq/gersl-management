import React, { useEffect, useState } from 'react';
import { Droplets, Briefcase, FileText, Receipt, Wallet, TrendingUp, AlertTriangle, Loader, FolderKanban } from 'lucide-react';
import API from '../../services/api';

const fmt = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const HEADLINE_COLORS = {
  committed: 'text-blue-700 bg-blue-50  border-blue-200',
  received:  'text-green-700 bg-green-50 border-green-200',
  spent:     'text-amber-700 bg-amber-50 border-amber-200',
  net:       'text-purple-700 bg-purple-50 border-purple-200',
};

const StatTile = ({ label, value, tone }) => (
  <div className={`rounded-xl p-4 border ${HEADLINE_COLORS[tone] || 'text-ink-700 bg-ink-50 border-ink-200'}`}>
    <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

const PartnerFinancialsPanel = ({ partnerId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!partnerId) return;
    let alive = true;
    setLoading(true); setError(null);
    API.Partners.getFinancials(partnerId)
      .then(d => { if (alive) { setData(d); setLoading(false); } })
      .catch(e => { if (alive) { setError(e.message || 'Failed to load financials'); setLoading(false); } });
    return () => { alive = false; };
  }, [partnerId]);

  if (loading) {
    return (
      <div className="mt-6 p-6 bg-white rounded-xl border border-ink-100 flex items-center justify-center gap-2 text-ink-500">
        <Loader size={16} className="animate-spin" /> Loading financials…
      </div>
    );
  }
  if (error) {
    return (
      <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
        Couldn't load financials: {error}
      </div>
    );
  }
  if (!data) return null;

  const { headline, breakdown, lists } = data;
  const netNegative = headline.net < 0;

  return (
    <div className="mt-6 space-y-5">
      <div className="flex items-center gap-2">
        <TrendingUp size={20} className="text-ink-700" />
        <h3 className="text-lg font-bold text-ink-900">Financial Summary</h3>
      </div>

      {/* Headline tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile tone="committed" label="Committed (orders)" value={fmt(headline.committed)} />
        <StatTile tone="received"  label="Received"           value={fmt(headline.received)}  />
        <StatTile tone="spent"     label="Spent"              value={fmt(headline.spent)}     />
        <StatTile tone="net"       label="Net position"
          value={(netNegative ? '−' : '') + fmt(Math.abs(headline.net))} />
      </div>

      {headline.outstandingInvoiceBalance > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex gap-2 items-start">
          <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-900">Outstanding invoice balance: {fmt(headline.outstandingInvoiceBalance)}</p>
            <p className="text-amber-800">There are issued invoices that haven't been fully paid yet.</p>
          </div>
        </div>
      )}

      {/* Spending breakdown */}
      <div className="bg-ink-50 rounded-xl p-4 border border-ink-100">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-600 mb-2">Spending breakdown</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-ink-500 text-xs">Item actual costs</p>
            <p className="font-bold">{fmt(breakdown.spentByItems)}</p>
          </div>
          <div>
            <p className="text-ink-500 text-xs">Direct expenses</p>
            <p className="font-bold">{fmt(breakdown.spentByExpense)}</p>
          </div>
          <div>
            <p className="text-ink-500 text-xs">Paid bills</p>
            <p className="font-bold">{fmt(breakdown.spentByBills)}</p>
          </div>
        </div>
        <p className="text-xs text-ink-500 mt-3">
          Note: contractor bills against WASH/IGP items can overlap with item actual costs if both are recorded. Reconcile any double-counts at the items list.
        </p>
      </div>

      {/* Lists */}
      <DataList
        icon={<Droplets size={16} className="text-sky-600" />}
        title={`WASH orders (${lists.washOrders.length})`}
        emptyText="No WASH orders linked to this partner yet."
        rows={lists.washOrders.slice(0, 10).map(o => ({
          key: o.id,
          left: <a className="font-mono text-xs" href={`/admin/wash/orders/${o.id}`}>{o.orderCode}</a>,
          middle: o.title,
          right: `${fmt(o.totalBudget)} · ${o.paymentStatus}`,
        }))}
      />

      <DataList
        icon={<Briefcase size={16} className="text-emerald-600" />}
        title={`IGP orders (${lists.igpOrders.length})`}
        emptyText="No IGP orders linked to this partner yet."
        rows={lists.igpOrders.slice(0, 10).map(o => ({
          key: o.id,
          left: <a className="font-mono text-xs" href={`/admin/igp/orders/${o.id}`}>{o.orderCode}</a>,
          middle: o.title,
          right: `${fmt(o.totalBudget)} · ${o.paymentStatus}`,
        }))}
      />

      <DataList
        icon={<FolderKanban size={16} className="text-purple-600" />}
        title={`Projects (${lists.projects.length})`}
        emptyText="No projects linked. Link existing projects via the partner FK to roll up their expenses."
        rows={lists.projects.slice(0, 10).map(p => ({
          key: p.id,
          left: <a className="font-mono text-xs" href={`/admin/projects/${p.id}`}>{p.projectCode || p.id}</a>,
          middle: p.name,
          right: `Budget ${fmt(p.budget)} · Spent ${fmt(p.spent)}`,
        }))}
      />

      <DataList
        icon={<FileText size={16} className="text-indigo-600" />}
        title={`Invoices (${lists.invoices.length})`}
        emptyText="No invoices issued to this partner."
        rows={lists.invoices.slice(0, 10).map(i => ({
          key: i.id,
          left: <span className="font-mono text-xs">{i.invoiceNumber}</span>,
          middle: i.invoiceDate,
          right: `${fmt(i.totalAmount)} · ${fmt(i.paidAmount)} paid · ${i.status}`,
        }))}
      />

      <DataList
        icon={<Receipt size={16} className="text-rose-600" />}
        title={`Bills (${lists.bills.length})`}
        emptyText="No bills tagged to this partner."
        rows={lists.bills.slice(0, 10).map(b => ({
          key: b.id,
          left: <span className="font-mono text-xs">{b.billNumber}</span>,
          middle: `${b.vendorName} (${b.billDate})`,
          right: `${fmt(b.totalAmount)} · ${b.status}`,
        }))}
      />

      <DataList
        icon={<Wallet size={16} className="text-amber-600" />}
        title={`Direct expenses (${lists.expenses.length})`}
        emptyText="No expenses tagged to this partner."
        rows={lists.expenses.slice(0, 10).map(e => ({
          key: e.id,
          left: <span className="text-xs text-ink-500">{e.date}</span>,
          middle: `${e.category} — ${e.description}`,
          right: `${fmt(e.amount)} · ${e.status}`,
        }))}
      />
    </div>
  );
};

const DataList = ({ icon, title, emptyText, rows }) => (
  <div className="bg-white rounded-xl border border-ink-100 overflow-hidden">
    <div className="px-4 py-2 bg-ink-50 border-b border-ink-100 flex items-center gap-2">
      {icon}
      <h4 className="text-sm font-bold text-ink-900">{title}</h4>
    </div>
    {rows.length === 0 ? (
      <p className="px-4 py-3 text-sm text-ink-500 italic">{emptyText}</p>
    ) : (
      <ul className="divide-y divide-ink-100">
        {rows.map(r => (
          <li key={r.key} className="px-4 py-2 grid grid-cols-12 gap-2 text-sm items-center">
            <div className="col-span-3 truncate">{r.left}</div>
            <div className="col-span-5 truncate text-ink-700">{r.middle}</div>
            <div className="col-span-4 text-right text-ink-700 font-semibold">{r.right}</div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default PartnerFinancialsPanel;
