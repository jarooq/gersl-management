import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AIEmployeeAPI } from '../../services/api';
import {
  Bot, ArrowLeft, CheckCircle, XCircle, RotateCcw, AlertTriangle,
  HelpCircle, Calendar, Link2, Cpu, Ruler, Target, Wallet, ClipboardList, Info
} from 'lucide-react';

const APPROVER_ROLES = ['Admin', 'CEO', 'BOD', 'Director Programmes', 'Programme Manager'];

const KIND = {
  task:        { label: 'Tasks',        icon: ClipboardList, singular: 'task' },
  indicator:   { label: 'Indicators',   icon: Target,        singular: 'indicator' },
  budget_line: { label: 'Budget lines', icon: Wallet,        singular: 'budget line' },
};

const money = (n) => Number(n || 0).toLocaleString();

const PlanReviewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [plan, setPlan] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyItem, setBusyItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null);
  const [result, setResult] = useState(null);

  const isApprover = APPROVER_ROLES.includes(currentUser?.role);

  const flash = (message, tone = 'ok') => {
    setNotice({ message, tone });
    setTimeout(() => setNotice(null), 6000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AIEmployeeAPI.getPlan(id);
      setPlan(data.plan);
      setItems(data.items || []);
    } catch (e) {
      flash(e.message || 'Could not load this plan', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const setItemStatus = async (item, status) => {
    setBusyItem(item.id);
    try {
      const updated = await AIEmployeeAPI.updatePlanItem(plan.id, item.id, { status });
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated.item : i)));
    } catch (e) {
      flash(e.message || 'Could not update that item', 'error');
    } finally {
      setBusyItem(null);
    }
  };

  const approve = async () => {
    if (!window.confirm(
      `Commit this plan?\n\n${keptCount} item(s) will be created as real tasks, indicators and a draft budget on this project. Rejected items are skipped. This cannot be undone from here.`
    )) return;

    setSubmitting(true);
    try {
      const res = await AIEmployeeAPI.approvePlan(plan.id);
      setResult(res);
      await load();
    } catch (e) {
      flash(e.message || 'Commit failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const reject = async () => {
    const reason = window.prompt('Discard this plan? Optionally say why:');
    if (reason === null) return;
    setSubmitting(true);
    try {
      await AIEmployeeAPI.rejectPlan(plan.id, reason);
      flash('Plan discarded.');
      await load();
    } catch (e) {
      flash(e.message || 'Could not discard the plan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const grouped = useMemo(() => {
    const out = { task: [], indicator: [], budget_line: [] };
    for (const item of items) (out[item.kind] ??= []).push(item);
    return out;
  }, [items]);

  const keptCount = items.filter((i) => i.status !== 'rejected' && i.status !== 'committed').length;
  const budgetTotal = grouped.budget_line
    .filter((i) => i.status !== 'rejected')
    .reduce((sum, i) => sum + Number((i.editedPayload ?? i.payload)?.amount || 0), 0);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto text-center py-20">
        <div className="w-12 h-12 border-2 border-ink-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-ink-600 text-sm">Loading plan…</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <button onClick={() => navigate('/admin/ai-employee')} className="text-sm text-ink-600 hover:text-navy-900 flex items-center gap-1 mb-4">
          <ArrowLeft size={15} /> Back
        </button>
        <p className="text-ink-700">That plan could not be found.</p>
      </div>
    );
  }

  const isCommitted = plan.status === 'committed';
  const isRejected = plan.status === 'rejected';
  const locked = isCommitted || isRejected || !isApprover;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <button onClick={() => navigate('/admin/ai-employee')} className="text-sm text-ink-600 hover:text-navy-900 flex items-center gap-1">
        <ArrowLeft size={15} /> Back to AI Employee
      </button>

      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-md flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">
              AI Employee · Setup plan · {plan.status}
            </p>
            <h1 className="text-h2 font-bold leading-tight">{plan.title}</h1>
            <p className="text-ink-200 text-sm mt-0.5 flex items-center gap-2 flex-wrap">
              <Cpu size={12} /> {plan.generator}{plan.model ? ` · ${plan.model}` : ''}
              <span className="text-ink-300">·</span>
              {plan.itemCount} proposed
              {!isCommitted && <><span className="text-ink-300">·</span>{keptCount} will be created</>}
            </p>
          </div>
        </div>
      </div>

      {notice && (
        <div className={`px-4 py-3 rounded-md text-sm border ${
          notice.tone === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>{notice.message}</div>
      )}

      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
          <p className="font-semibold mb-1">Plan committed.</p>
          <p>{result.byType.tasks} tasks, {result.byType.indicators} indicators and {result.byType.budgets} draft budget created on this project.</p>
          {result.warnings?.map((w, i) => (
            <p key={i} className="mt-1.5 text-amber-800 flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0" />{w}</p>
          ))}
        </div>
      )}

      {!plan.aiAvailable && !isCommitted && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 text-sm text-sky-900 flex items-start gap-2">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>
            This plan is the <strong>rule-based scaffold only</strong> — reporting calendar, closure schedule and
            compliance steps. No AI provider was configured, so there is no work breakdown for this project's
            specific activities. Set an API key and regenerate to get one.
          </span>
        </div>
      )}

      {plan.summary && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-sm text-ink-700 leading-relaxed">{plan.summary}</p>
        </div>
      )}

      {/* Questions come before anything else — they are what the plan needs answered. */}
      {plan.questions?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-l-sky-500">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2 flex items-center gap-1.5">
            <HelpCircle size={13} /> Answer these before approving
          </p>
          <ul className="space-y-1.5">
            {plan.questions.map((q, i) => (
              <li key={i} className="text-sm text-ink-700 flex items-start gap-2">
                <span className="text-sky-500 mt-1">•</span>{q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.warnings?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs uppercase tracking-wider text-amber-800 font-semibold mb-2 flex items-center gap-1.5">
            <AlertTriangle size={13} /> Corrections and warnings
          </p>
          <ul className="space-y-1">
            {plan.warnings.map((w, i) => (
              <li key={i} className="text-sm text-amber-900 flex items-start gap-2">
                <span className="mt-1">•</span>{w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {plan.assumptions?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-2">Assumptions made</p>
          <ul className="space-y-1">
            {plan.assumptions.map((a, i) => (
              <li key={i} className="text-sm text-ink-600 flex items-start gap-2"><span className="mt-1">•</span>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Item groups */}
      {Object.entries(KIND).map(([kind, meta]) => {
        const group = grouped[kind] ?? [];
        if (group.length === 0) return null;
        const Icon = meta.icon;

        return (
          <div key={kind} className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                <Icon size={16} className="text-navy-700" /> {meta.label}
                <span className="text-ink-500 font-normal">({group.length})</span>
              </p>
              {kind === 'budget_line' && (
                <p className="text-sm text-ink-600">Total: <strong className="text-ink-900">{money(budgetTotal)}</strong></p>
              )}
            </div>

            <div className="space-y-2">
              {group.map((item) => (
                <PlanItemRow
                  key={item.id}
                  item={item}
                  kind={kind}
                  locked={locked}
                  busy={busyItem === item.id}
                  onSetStatus={setItemStatus}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Actions */}
      {!locked && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-4 flex-wrap sticky bottom-4 border border-ink-200">
          <p className="text-sm text-ink-600">
            <strong className="text-ink-900">{keptCount}</strong> item{keptCount === 1 ? '' : 's'} will be created.
            Rejected items are skipped. Budgets are created as <strong>Draft</strong> and tasks unassigned.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={reject}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-50"
            >
              Discard plan
            </button>
            <button
              onClick={approve}
              disabled={submitting || keptCount === 0}
              className="px-5 py-2 text-sm rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle size={16} /> {submitting ? 'Committing…' : 'Approve and create'}
            </button>
          </div>
        </div>
      )}

      {isCommitted && !result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
          This plan was committed{plan.committedAt ? ` on ${String(plan.committedAt).slice(0, 10)}` : ''}. Its items are now live on the project.
        </div>
      )}
      {isRejected && (
        <div className="bg-ink-100 border border-ink-200 rounded-lg p-4 text-sm text-ink-700">
          This plan was discarded{plan.rejectedReason ? `: ${plan.rejectedReason}` : '.'}
        </div>
      )}
      {!isApprover && !isCommitted && !isRejected && (
        <div className="bg-ink-100 border border-ink-200 rounded-lg p-4 text-sm text-ink-700">
          You can read this plan, but approving it needs a Programme Manager or above.
        </div>
      )}
    </div>
  );
};

// ── One proposed item ─────────────────────────────────────────────────
const PlanItemRow = ({ item, kind, locked, busy, onSetStatus }) => {
  const payload = item.editedPayload ?? item.payload ?? {};
  const rejected = item.status === 'rejected';
  const committed = item.status === 'committed';
  const fromRule = item.origin === 'scaffold';

  return (
    <div className={`border rounded-md p-3 transition ${
      rejected ? 'border-ink-200 bg-ink-50 opacity-60' : 'border-ink-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${
              fromRule
                ? 'bg-ink-100 text-ink-600 border-ink-200'
                : 'bg-violet-100 text-violet-700 border-violet-200'
            }`}>
              {fromRule ? 'RULE' : 'AI'}
            </span>
            {item.ref && <span className="text-[10px] font-mono text-ink-500">{item.ref}</span>}
            {item.status === 'edited' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-sky-200 bg-sky-100 text-sky-700 font-semibold">EDITED</span>
            )}
            {committed && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-emerald-200 bg-emerald-100 text-emerald-700 font-semibold">
                CREATED #{item.committedEntityId}
              </span>
            )}
            {payload.requiresProcurement && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-amber-200 bg-amber-100 text-amber-700 font-semibold">PROCUREMENT</span>
            )}
            {payload.requiresApproval && (
              <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-200 bg-orange-100 text-orange-700 font-semibold">NEEDS SIGN-OFF</span>
            )}
          </div>

          <p className={`text-sm font-semibold text-ink-900 ${rejected ? 'line-through' : ''}`}>
            {item.title || payload.name || payload.description}
          </p>

          {kind === 'task' && (
            <>
              {payload.description && <p className="text-[13px] text-ink-600 mt-1">{payload.description}</p>}
              <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-ink-500">
                {payload.startDate && (
                  <span className="flex items-center gap-1"><Calendar size={11} /> {payload.startDate} → {payload.dueDate}</span>
                )}
                {payload.priority && <span>Priority: {payload.priority}</span>}
                {payload.taskType && <span>{payload.taskType}</span>}
                {payload.suggestedRole && <span>Suggested owner: {payload.suggestedRole}</span>}
                {payload.dependsOnRefs?.length > 0 && (
                  <span className="flex items-center gap-1"><Link2 size={11} /> after {payload.dependsOnRefs.join(', ')}</span>
                )}
              </div>
            </>
          )}

          {kind === 'indicator' && (
            <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-ink-500">
              <span className="flex items-center gap-1"><Ruler size={11} /> baseline {payload.baseline} → target {payload.target} {payload.unit || ''}</span>
              <span>{payload.type}</span>
              <span>{payload.frequency}</span>
              {payload.dataSource && <span>Source: {payload.dataSource}</span>}
            </div>
          )}

          {kind === 'budget_line' && (
            <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[11px] text-ink-500">
              <span className="text-ink-900 font-semibold text-[13px]">{money(payload.amount)}</span>
              <span>{payload.category}</span>
              {payload.justification && <span className="italic">{payload.justification}</span>}
            </div>
          )}
        </div>

        {!locked && (
          <div className="flex items-center gap-1.5 shrink-0">
            {rejected ? (
              <button
                onClick={() => onSetStatus(item, 'proposed')}
                disabled={busy}
                title="Put it back"
                className="px-2.5 py-1.5 text-xs rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-50 flex items-center gap-1"
              >
                <RotateCcw size={13} /> Restore
              </button>
            ) : (
              <button
                onClick={() => onSetStatus(item, 'rejected')}
                disabled={busy}
                title="Do not create this"
                className="px-2.5 py-1.5 text-xs rounded-md border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
              >
                <XCircle size={13} /> Reject
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanReviewPage;
