import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Plus, Calendar, AlertTriangle, CheckCircle, Clock, Wallet, Search, X } from 'lucide-react';
import API, { WashAPI } from '../../services/api';

const fmt = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;

const STATUS_COLORS = {
  Active:    'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};
const PAYMENT_COLORS = {
  Pending:        'bg-yellow-100 text-yellow-700',
  PartiallyPaid:  'bg-orange-100 text-orange-700',
  Paid:           'bg-green-100 text-green-700',
  Overdue:        'bg-red-100 text-red-700',
};

const WashPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState({ status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        WashAPI.getSummary().catch(() => null),
        WashAPI.listOrders(filter),
      ]);
      setSummary(s);
      setOrders(o || []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t);   }, [filter]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">Programme · Water, Sanitation, Hygiene</p>
          <h1 className="text-h2 font-bold leading-tight inline-flex items-center gap-2">
            <Droplets size={24} /> WASH
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 bg-mission-500 hover:bg-mission-600 text-navy-900 font-bold rounded-md px-4 py-2 transition"
        >
          <Plus size={16} /> New Order
        </button>
      </div>

      {/* Summary tiles */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryTile icon={<Calendar size={18} />} label="Active orders"   value={summary.orders.active}      tone="blue" />
          <SummaryTile icon={<AlertTriangle size={18} />} label="Overdue"    value={summary.orders.overdueOpen} tone={summary.orders.overdueOpen ? 'red' : 'ink'} />
          <SummaryTile icon={<CheckCircle size={18} />} label="Items handed over" value={summary.items.byStage?.HandedOver || 0} tone="green" />
          <SummaryTile icon={<Wallet size={18} />} label="Outstanding" value={fmt(summary.money.outstandingSum)} tone="amber" />
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100 p-3 flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-ink-400" />
          <input
            type="text"
            value={filter.search}
            onChange={e => setFilter({ ...filter, search: e.target.value })}
            placeholder="Search order code, title, donor ref…"
            className="flex-1 outline-none text-sm"
          />
          {filter.search && (
            <button onClick={() => setFilter({ ...filter, search: '' })} className="text-ink-400 hover:text-ink-700">
              <X size={14} />
            </button>
          )}
        </div>
        <select
          value={filter.status}
          onChange={e => setFilter({ ...filter, status: e.target.value })}
          className="border border-ink-200 rounded-md px-3 py-1.5 text-sm bg-white"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-lg2 shadow-card border border-ink-100">
        {loading ? (
          <div className="p-8 text-center text-ink-500 text-sm">Loading…</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <Droplets size={36} className="mx-auto text-ink-300 mb-3" />
            <p className="text-ink-600 mb-3">No WASH orders yet.</p>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-2 bg-orange-500 text-white text-sm font-semibold rounded-md px-3 py-1.5 hover:bg-navy-800 transition">
              <Plus size={14} /> Create your first order
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50 text-xs uppercase font-semibold text-ink-600">
                <tr>
                  <th className="text-left px-4 py-2">Order</th>
                  <th className="text-left px-4 py-2">Donor</th>
                  <th className="text-right px-4 py-2">Qty</th>
                  <th className="text-right px-4 py-2">Budget</th>
                  <th className="text-left px-4 py-2">Deadline</th>
                  <th className="text-center px-4 py-2">Status</th>
                  <th className="text-center px-4 py-2">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {orders.map(o => (
                  <tr
                    key={o.id}
                    className="hover:bg-blue-50 cursor-pointer"
                    onClick={() => navigate(`/admin/wash/orders/${o.id}`)}
                  >
                    <td className="px-4 py-2">
                      <div className="font-semibold text-ink-900">{o.orderCode}</div>
                      <div className="text-xs text-ink-500">{o.title}</div>
                    </td>
                    <td className="px-4 py-2">{o.donor?.name || '—'}</td>
                    <td className="px-4 py-2 text-right">{o.quantity}</td>
                    <td className="px-4 py-2 text-right font-semibold">{fmt(o.totalBudget)}</td>
                    <td className="px-4 py-2">{o.deadline}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${STATUS_COLORS[o.status] || 'bg-ink-100 text-ink-700'}`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PAYMENT_COLORS[o.paymentStatus] || 'bg-ink-100 text-ink-700'}`}>{o.paymentStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateOrderModal onClose={() => setShowCreate(false)} onCreated={(id) => { setShowCreate(false); navigate(`/admin/wash/orders/${id}`); }} />
      )}
    </div>
  );
};

const SummaryTile = ({ icon, label, value, tone = 'ink' }) => {
  const tones = {
    blue:  'text-blue-700  bg-blue-50',
    red:   'text-red-700   bg-red-50',
    green: 'text-green-700 bg-green-50',
    amber: 'text-amber-700 bg-amber-50',
    ink:   'text-ink-700   bg-ink-50',
  };
  return (
    <div className={`rounded-lg2 shadow-card border border-ink-100 p-4 ${tones[tone] || tones.ink}`}>
      <p className="text-xs font-semibold uppercase flex items-center gap-1.5">{icon}{label}</p>
      <p className="text-h2 font-bold mt-1">{value}</p>
    </div>
  );
};

const CreateOrderModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({
    donorId: '',
    projectId: '',
    title: '',
    unitType: 'HandPump',
    quantity: 1,
    unitCost: '',
    totalBudget: '',
    orderDate: new Date().toISOString().slice(0, 10),
    deadline: '',
    deliveryCadence: 'Batch',
    invoiceTiming: 'AfterWork',
    workStartCondition: 'OnAcceptance',
    donorReporting: 'PerItem',
    donorRef: '',
    description: '',
  });
  const [partners, setPartners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // Load active partners + projects for the pickers. Partners come from
  // /api/partners (active only), projects from /api/projects. We narrow
  // the project picker by selected partner on the client so finance can
  // always see the link is intentional.
  useEffect(() => {
    let alive = true;
    Promise.all([
      API.Partner.getAll({ status: 'Active' }).catch(() => ({ partners: [] })),
      API.Project.getAll({ limit: 200 }).catch(() => ({ projects: [] })),
    ]).then(([pResp, projResp]) => {
      if (!alive) return;
      const partnerList = Array.isArray(pResp?.partners) ? pResp.partners
                       : Array.isArray(pResp)            ? pResp
                       : [];
      const projectList = Array.isArray(projResp?.projects) ? projResp.projects
                       : Array.isArray(projResp)            ? projResp
                       : [];
      setPartners(partnerList);
      setProjects(projectList);
    });
    return () => { alive = false; };
  }, []);

  // When a partner is selected, surface the projects that belong to them
  // (matched by partner_id, or fall back to donor-name match for legacy rows).
  const projectsForPartner = form.donorId
    ? projects.filter(p => {
        if (p.partnerId && Number(p.partnerId) === Number(form.donorId)) return true;
        const partner = partners.find(pt => Number(pt.id) === Number(form.donorId));
        return partner && p.donor && p.donor.toLowerCase().trim() === partner.name.toLowerCase().trim();
      })
    : projects;

  const submit = async () => {
    if (!form.title || !form.deadline || !form.quantity) {
      setErr('Title, quantity and deadline are required.');
      return;
    }
    setSaving(true); setErr(null);
    try {
      const data = await WashAPI.createOrder({
        ...form,
        donorId:     form.donorId   ? Number(form.donorId)   : null,
        projectId:   form.projectId ? Number(form.projectId) : null,
        quantity:    Number(form.quantity),
        unitCost:    form.unitCost ? Number(form.unitCost) : null,
        totalBudget: form.totalBudget ? Number(form.totalBudget) : (form.unitCost ? Number(form.unitCost) * Number(form.quantity) : null),
      });
      onCreated(data.id);
    } catch (e) {
      setErr(e.message || 'Failed to create order');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg2 shadow-pop w-full max-w-2xl">
        <div className="bg-orange-500 text-white px-5 py-3 rounded-t-lg2 flex items-center justify-between">
          <h2 className="font-bold inline-flex items-center gap-2"><Droplets size={18} /> New WASH order</h2>
          <button onClick={onClose} className="hover:bg-white/20 rounded p-1"><X size={16} /></button>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <Field label="Partner / Donor *" colSpan={1}>
            <select
              value={form.donorId}
              onChange={e => setForm({ ...form, donorId: e.target.value, projectId: '' })}
              className="w-full border border-ink-200 rounded px-2 py-1.5 bg-white"
            >
              <option value="">— Select partner —</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.partnerCode ? ` (${p.partnerCode})` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Project (umbrella)">
            <select
              value={form.projectId}
              onChange={e => setForm({ ...form, projectId: e.target.value })}
              className="w-full border border-ink-200 rounded px-2 py-1.5 bg-white"
            >
              <option value="">— None / one-off —</option>
              {projectsForPartner.map(p => (
                <option key={p.id} value={p.id}>{p.name}{p.projectCode ? ` (${p.projectCode})` : ''}</option>
              ))}
            </select>
          </Field>
          <Field label="Title *" colSpan={2}><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" placeholder="One Nation — 50 hand pumps April" /></Field>
          <Field label="Unit type"><select value={form.unitType} onChange={e => setForm({ ...form, unitType: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5">
            {['HandPump','CommunityWell','HybridWell','TubeWell','Filter','Tank','Latrine','Mixed'].map(t => <option key={t}>{t}</option>)}
          </select></Field>
          <Field label="Quantity *"><input type="number" min={1} value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" /></Field>
          <Field label="Unit cost (LKR)"><input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" /></Field>
          <Field label="Total budget (LKR)"><input type="number" value={form.totalBudget} onChange={e => setForm({ ...form, totalBudget: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" placeholder="Auto from qty × unit" /></Field>
          <Field label="Order date"><input type="date" value={form.orderDate} onChange={e => setForm({ ...form, orderDate: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" /></Field>
          <Field label="Deadline *"><input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" /></Field>
          <Field label="Delivery cadence"><select value={form.deliveryCadence} onChange={e => setForm({ ...form, deliveryCadence: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5">
            {['Daily','Weekly','Monthly','Batch'].map(t => <option key={t}>{t}</option>)}
          </select></Field>
          <Field label="Invoice timing"><select value={form.invoiceTiming} onChange={e => setForm({ ...form, invoiceTiming: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5">
            <option value="BeforeWork">Before work (proforma)</option>
            <option value="AfterWork">After work (post-delivery)</option>
          </select></Field>
          <Field label="Work start"><select value={form.workStartCondition} onChange={e => setForm({ ...form, workStartCondition: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5">
            <option value="OnAcceptance">On acceptance</option>
            <option value="OnFundsReceived">On funds received</option>
          </select></Field>
          <Field label="Donor reporting"><select value={form.donorReporting} onChange={e => setForm({ ...form, donorReporting: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5">
            <option value="PerItem">Per item</option>
            <option value="BatchAtCompletion">Batch at completion</option>
            <option value="Monthly">Monthly</option>
          </select></Field>
          <Field label="Donor reference"><input value={form.donorRef} onChange={e => setForm({ ...form, donorRef: e.target.value })} className="w-full border border-ink-200 rounded px-2 py-1.5" placeholder="Donor's own tracking #" /></Field>
          <Field label="Description" colSpan={2}><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-ink-200 rounded px-2 py-1.5" /></Field>
          {err && <div className="md:col-span-2 text-red-700 text-xs bg-red-50 border border-red-200 rounded px-2 py-1.5">{err}</div>}
        </div>
        <div className="px-5 py-3 border-t border-ink-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm border border-ink-200 rounded hover:bg-ink-50">Cancel</button>
          <button onClick={submit} disabled={saving} className="bg-orange-500 text-white text-sm font-semibold rounded px-3 py-1.5 disabled:opacity-50 hover:bg-navy-800">
            {saving ? 'Saving…' : 'Create order'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, colSpan = 1, children }) => (
  <div className={colSpan === 2 ? 'md:col-span-2' : ''}>
    <label className="block text-xs font-semibold text-ink-600 mb-1">{label}</label>
    {children}
  </div>
);

export default WashPage;
