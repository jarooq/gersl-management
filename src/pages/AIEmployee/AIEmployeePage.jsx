import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AIEmployeeAPI, ProjectAPI } from '../../services/api';
import {
  Bot, AlertTriangle, AlertCircle, Info, Flame, Clock, CheckCircle,
  BellOff, RefreshCw, Filter, ChevronRight, FileText, Inbox, Send, Zap, Sparkles, X
} from 'lucide-react';

// Severity drives colour everywhere — keep it in one place so the badge, the
// left border and the stat tiles can never disagree.
const SEVERITY = {
  critical: { label: 'Critical', icon: Flame,         chip: 'bg-red-100 text-red-700 border-red-200',       bar: 'border-l-red-500',    tile: 'text-red-600' },
  high:     { label: 'High',     icon: AlertTriangle, chip: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'border-l-orange-500', tile: 'text-orange-600' },
  warning:  { label: 'Warning',  icon: AlertCircle,   chip: 'bg-amber-100 text-amber-700 border-amber-200',  bar: 'border-l-amber-500',  tile: 'text-amber-600' },
  info:     { label: 'Info',     icon: Info,          chip: 'bg-sky-100 text-sky-700 border-sky-200',        bar: 'border-l-sky-400',    tile: 'text-sky-600' },
};

const ESCALATION_LABEL = ['', 'Escalated to line manager', 'Escalated to project manager', 'Escalated to leadership'];

const APPROVER_ROLES = ['Admin', 'CEO', 'BOD', 'Director Programmes', 'Programme Manager'];
const OPERATOR_ROLES = ['Admin', 'CEO', 'BOD', 'Director Programmes'];

const relativeDays = (iso) => {
  if (!iso) return '—';
  const days = Math.round((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
};

const AIEmployeePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('mine');
  const [status, setStatus] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [sweeping, setSweeping] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [ruleFilter, setRuleFilter] = useState('');
  const [notice, setNotice] = useState(null);
  const [showGenerator, setShowGenerator] = useState(false);

  const isApprover = APPROVER_ROLES.includes(currentUser?.role);
  const isOperator = OPERATOR_ROLES.includes(currentUser?.role);

  const flash = (message, tone = 'ok') => {
    setNotice({ message, tone });
    setTimeout(() => setNotice(null), 5000);
  };

  const loadStatus = useCallback(async () => {
    try {
      setStatus(await AIEmployeeAPI.getStatus());
    } catch (e) {
      console.error('AI Employee status failed:', e);
      setStatus({ unavailable: true, message: e.message });
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AIEmployeeAPI.getAlerts({
        status: 'open',
        mine: activeTab === 'mine' ? 'true' : undefined,
        severity: severityFilter || undefined,
        ruleKey: ruleFilter || undefined,
        limit: 100,
      });
      setAlerts(data.alerts || []);
    } catch (e) {
      console.error('Failed to load alerts:', e);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, severityFilter, ruleFilter]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AIEmployeeAPI.getPlans({ limit: 50 });
      setPlans(data.plans || []);
    } catch (e) {
      console.error('Failed to load plans:', e);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => {
    if (activeTab === 'plans') loadPlans();
    else loadAlerts();
  }, [activeTab, loadAlerts, loadPlans]);

  const act = async (alert, action) => {
    setBusyId(alert.id);
    try {
      if (action === 'snooze') await AIEmployeeAPI.snoozeAlert(alert.id, 3);
      if (action === 'resolve') await AIEmployeeAPI.resolveAlert(alert.id);
      if (action === 'mute') await AIEmployeeAPI.muteAlert(alert.id);

      // Snooze keeps the alert open, so only drop it from the list when closed.
      if (action === 'snooze') {
        flash('Snoozed for 3 days. It stays open — Rafiq just stops reminding you.');
        setAlerts((prev) => prev.map((a) => (a.id === alert.id ? { ...a, snoozed: true } : a)));
      } else {
        flash(action === 'mute' ? 'Muted. This one will not come back.' : 'Marked resolved.');
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }
      loadStatus();
    } catch (e) {
      flash(e.message || 'That did not work', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const runSweep = async () => {
    setSweeping(true);
    try {
      const { result } = await AIEmployeeAPI.runSweep();
      flash(`Sweep done — ${result.findings} findings, ${result.opened} new, ${result.sent} notifications sent.`);
      await Promise.all([loadStatus(), loadAlerts()]);
    } catch (e) {
      flash(e.message || 'Sweep failed', 'error');
    } finally {
      setSweeping(false);
    }
  };

  const sendBriefing = async () => {
    try {
      await AIEmployeeAPI.sendMyBriefing();
      flash('Briefing sent — check your notifications.');
    } catch (e) {
      flash(e.message || 'Could not send briefing', 'error');
    }
  };

  const counts = status?.openAlerts?.bySeverity ?? {};
  const rules = useMemo(() => status?.rules ?? [], [status]);

  // ── Status banner ───────────────────────────────────────────────────
  const notRunning = status && !status.unavailable && status.enabled === false;
  const tablesMissing = status?.unavailable;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-navy-900 rounded-lg2 px-5 py-3 text-white shadow-card">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 bg-orange-500/15 border border-orange-500/30 rounded-md flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-orange-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">
                Operations · AI Employee
              </p>
              <h1 className="text-h2 font-bold leading-tight">
                {status?.employee?.name ?? 'Rafiq'}
              </h1>
              <p className="text-ink-200 text-sm mt-0.5">
                {tablesMissing
                  ? 'Not set up yet — the database tables are missing.'
                  : status
                    ? `${status.openAlerts?.total ?? 0} open items · last swept ${relativeDays(status.lastRun?.startedAt)}`
                    : 'Loading…'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={sendBriefing}
              className="px-3 py-2 text-sm rounded-md bg-white/10 hover:bg-white/20 border border-white/15 flex items-center gap-2"
            >
              <Send size={15} /> Send me a briefing
            </button>
            {isOperator && (
              <button
                onClick={runSweep}
                disabled={sweeping}
                className="px-3 py-2 text-sm rounded-md bg-orange-500 hover:bg-orange-600 disabled:opacity-50 flex items-center gap-2 font-semibold"
              >
                <RefreshCw size={15} className={sweeping ? 'animate-spin' : ''} />
                {sweeping ? 'Sweeping…' : 'Run sweep now'}
              </button>
            )}
          </div>
        </div>
      </div>

      {notice && (
        <div className={`px-4 py-3 rounded-md text-sm border ${
          notice.tone === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {notice.message}
        </div>
      )}

      {tablesMissing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Rafiq is not on duty yet.</p>
          <p>
            The AI Employee tables have not been created on this database. Run
            <code className="mx-1 px-1.5 py-0.5 bg-amber-100 rounded font-mono text-[12px]">npm run ai:migrate</code>
            against the server, then restart it.
          </p>
        </div>
      )}

      {notRunning && (
        <div className="bg-ink-100 border border-ink-200 rounded-lg p-4 text-sm text-ink-700">
          Rafiq is switched off (<code className="font-mono text-[12px]">AI_EMPLOYEE_ENABLED=false</code>).
          Existing alerts are still listed below, but nothing new is being detected.
        </div>
      )}

      {/* Severity tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['critical', 'high', 'warning', 'info'].map((key) => {
          const meta = SEVERITY[key];
          const Icon = meta.icon;
          return (
            <button
              key={key}
              onClick={() => setSeverityFilter(severityFilter === key ? '' : key)}
              className={`bg-white rounded-lg shadow-sm p-4 text-left border-2 transition ${
                severityFilter === key ? 'border-navy-700' : 'border-transparent hover:border-ink-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-ink-500 font-semibold">{meta.label}</span>
                <Icon size={16} className={meta.tile} />
              </div>
              <p className={`text-2xl font-bold mt-1 ${meta.tile}`}>{counts[key] ?? 0}</p>
            </button>
          );
        })}
      </div>

      {/* Tabs + filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="flex gap-2">
            {[
              { key: 'mine',   label: 'My items',  icon: Inbox },
              { key: 'all',    label: 'All items', icon: AlertCircle },
              { key: 'plans',  label: 'Setup plans', icon: FileText },
            ].map((tab) => {
              // Assigned in the body, not destructured: this repo's eslint has no
              // react plugin, so JSX-only use of a destructured param reads as unused.
              const Icon = tab.icon;
              const { key, label } = tab;
              return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 ${
                  activeTab === key ? 'bg-navy-900 text-white' : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
                }`}
              >
                <Icon size={15} /> {label}
              </button>
              );
            })}
          </div>

          {activeTab !== 'plans' && (
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-ink-600" />
              <select
                value={ruleFilter}
                onChange={(e) => setRuleFilter(e.target.value)}
                className="px-3 py-2 border border-ink-200 rounded-md text-sm focus:ring-2 focus:ring-navy-700 focus:border-transparent"
              >
                <option value="">All rules</option>
                {rules.map((r) => (
                  <option key={r.key} value={r.key}>{r.name}</option>
                ))}
              </select>
              {(severityFilter || ruleFilter) && (
                <button
                  onClick={() => { setSeverityFilter(''); setRuleFilter(''); }}
                  className="text-sm text-ink-600 hover:text-navy-900 underline"
                >
                  Clear
                </button>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-ink-200 border-t-navy-700 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-ink-600 text-sm">Loading…</p>
          </div>
        ) : activeTab === 'plans' ? (
          <PlansList
            plans={plans}
            navigate={navigate}
            isApprover={isApprover}
            onGenerate={() => setShowGenerator(true)}
          />
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-ink-700 text-lg font-semibold">Nothing outstanding</p>
            <p className="text-ink-500 text-sm mt-1">
              {activeTab === 'mine'
                ? 'Rafiq has nothing on his list for you.'
                : 'No open items match these filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                busy={busyId === alert.id}
                onAct={act}
                showOwner={activeTab === 'all'}
              />
            ))}
          </div>
        )}
      </div>

      {showGenerator && (
        <PlanGenerator
          onClose={() => setShowGenerator(false)}
          onDone={(planId, message) => {
            setShowGenerator(false);
            flash(message);
            loadPlans();
            if (planId) navigate(`/admin/ai-employee/plans/${planId}`);
          }}
        />
      )}
    </div>
  );
};

// ── Alert card ────────────────────────────────────────────────────────
const AlertCard = ({ alert, busy, onAct, showOwner }) => {
  const meta = SEVERITY[alert.severity] ?? SEVERITY.info;
  const Icon = meta.icon;
  const escalated = Number(alert.escalationLevel) > 0;

  return (
    <div className={`border border-ink-200 border-l-4 ${meta.bar} rounded-lg p-4 bg-white hover:shadow-sm transition`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`mt-0.5 shrink-0 ${meta.tile}`}><Icon size={18} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${meta.chip}`}>
                {meta.label}
              </span>
              {escalated && (
                <span className="text-[11px] px-2 py-0.5 rounded border border-purple-200 bg-purple-100 text-purple-700 font-semibold">
                  {ESCALATION_LABEL[alert.escalationLevel] ?? 'Escalated'}
                </span>
              )}
              {alert.snoozed && (
                <span className="text-[11px] px-2 py-0.5 rounded border border-ink-200 bg-ink-100 text-ink-600 font-semibold">
                  Snoozed
                </span>
              )}
              <span className="text-[11px] text-ink-500 flex items-center gap-1">
                <Clock size={11} /> open since {relativeDays(alert.firstDetectedAt)}
              </span>
            </div>

            <p className="font-semibold text-ink-900 leading-snug">{alert.title}</p>
            <p className="text-sm text-ink-600 mt-1 whitespace-pre-line">{alert.message}</p>

            {showOwner && (alert.ownerName || alert.ownerUserId) && (
              <p className="text-[11px] text-ink-500 mt-2">
                Owner: {alert.ownerName ?? `user #${alert.ownerUserId}`}
                {alert.ownerRole ? ` · ${alert.ownerRole}` : ''}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {alert.actionUrl && (
            <a
              href={alert.actionUrl}
              className="px-3 py-1.5 text-sm rounded-md bg-navy-900 text-white hover:bg-navy-800 flex items-center gap-1"
            >
              {alert.actionLabel || 'Open'} <ChevronRight size={14} />
            </a>
          )}
          <button
            onClick={() => onAct(alert, 'snooze')}
            disabled={busy}
            title="Quiet this for 3 days — it stays open"
            className="px-2.5 py-1.5 text-sm rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            <Clock size={14} />
          </button>
          <button
            onClick={() => onAct(alert, 'resolve')}
            disabled={busy}
            title="Mark resolved — reopens if the problem is still there"
            className="px-2.5 py-1.5 text-sm rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            <CheckCircle size={14} />
          </button>
          <button
            onClick={() => onAct(alert, 'mute')}
            disabled={busy}
            title="Mute permanently — never comes back"
            className="px-2.5 py-1.5 text-sm rounded-md border border-ink-200 text-ink-500 hover:bg-ink-100 disabled:opacity-50"
          >
            <BellOff size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Plans list ────────────────────────────────────────────────────────
const PLAN_STATUS = {
  draft:     'bg-amber-100 text-amber-700 border-amber-200',
  committed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected:  'bg-ink-100 text-ink-600 border-ink-200',
};

const PlansList = ({ plans, navigate, isApprover, onGenerate }) => {
  const header = isApprover ? (
    <div className="flex justify-end mb-3">
      <button
        onClick={onGenerate}
        className="px-4 py-2 text-sm rounded-md bg-navy-900 text-white hover:bg-navy-800 font-semibold flex items-center gap-2"
      >
        <Sparkles size={15} /> Generate setup plan
      </button>
    </div>
  ) : null;

  if (plans.length === 0) {
    return (
      <>
      {header}
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-ink-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-ink-400" />
        </div>
        <p className="text-ink-700 text-lg font-semibold">No setup plans yet</p>
        <p className="text-ink-500 text-sm mt-1 max-w-md mx-auto">
          {isApprover
            ? 'Open a project and choose “Generate setup plan” to have Rafiq draft the task breakdown, reporting calendar, indicators and budget lines.'
            : 'Plans appear here once a manager generates one for a project.'}
        </p>
      </div>
      </>
    );
  }

  return (
    <>
    {header}
    <div className="space-y-3">
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => navigate(`/admin/ai-employee/plans/${plan.id}`)}
          className="w-full text-left border border-ink-200 rounded-lg p-4 bg-white hover:shadow-sm hover:border-navy-700 transition"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`text-[11px] px-2 py-0.5 rounded border font-semibold ${PLAN_STATUS[plan.status] ?? PLAN_STATUS.draft}`}>
                  {plan.status}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded border border-ink-200 bg-ink-100 text-ink-600 font-semibold flex items-center gap-1">
                  <Zap size={10} /> {plan.generator}{plan.model ? ` · ${plan.model}` : ''}
                </span>
                <span className="text-[11px] text-ink-500">{plan.itemCount} items · {relativeDays(plan.generatedAt)}</span>
              </div>
              <p className="font-semibold text-ink-900">{plan.title}</p>
              {plan.summary && <p className="text-sm text-ink-600 mt-1 line-clamp-2">{plan.summary}</p>}
              {plan.warnings?.length > 0 && (
                <p className="text-[12px] text-amber-700 mt-1.5">
                  {plan.warnings.length} warning{plan.warnings.length === 1 ? '' : 's'} to read before approving
                </p>
              )}
            </div>
            <ChevronRight className="text-ink-400 shrink-0" size={18} />
          </div>
        </button>
      ))}
    </div>
    </>
  );
};

// ── Plan generator ────────────────────────────────────────────────────
const PlanGenerator = ({ onClose, onDone }) => {
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState('');
  const [brief, setBrief] = useState('');
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [data, status] = await Promise.all([
          ProjectAPI.getAll({ limit: 200 }),
          AIEmployeeAPI.getPlannerStatus().catch(() => null),
        ]);
        setProjects(data?.projects || data || []);
        setProvider(status?.providers ?? null);
      } catch (e) {
        setError(e.message || 'Could not load projects');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const generate = async () => {
    if (!projectId) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await AIEmployeeAPI.createPlan({ projectId: Number(projectId), brief: brief || null });
      onDone(res.planId, `Plan #${res.planId} drafted — ${res.itemCount} items to review.`);
    } catch (e) {
      setError(e.message || 'Generation failed');
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
              <Sparkles size={18} className="text-orange-500" /> Generate a setup plan
            </h2>
            <p className="text-sm text-ink-600 mt-0.5">
              Rafiq drafts the task breakdown, reporting calendar, indicators and budget lines. Nothing is
              created until you review and approve it.
            </p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700"><X size={18} /></button>
        </div>

        {provider && !provider.selected && (
          <div className="bg-sky-50 border border-sky-200 rounded-md p-3 text-[13px] text-sky-900 mb-3">
            No AI provider is configured, so this will produce the <strong>rule-based scaffold only</strong> —
            reporting calendar, closure schedule and compliance steps. Still useful, and free.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-[13px] text-red-800 mb-3">{error}</div>
        )}

        <label className="block text-sm font-semibold text-ink-700 mb-1">Project</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={loading || generating}
          className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm mb-3 focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        >
          <option value="">{loading ? 'Loading projects…' : 'Choose a project…'}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.projectCode ? `${p.projectCode} — ` : ''}{p.name || p.projectName}
            </option>
          ))}
        </select>

        <label className="block text-sm font-semibold text-ink-700 mb-1">
          Anything else Rafiq should know <span className="font-normal text-ink-500">(optional)</span>
        </label>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          disabled={generating}
          rows={3}
          placeholder="e.g. Donor requires monthly water quality reporting. Procurement must go through the district office."
          className="w-full px-3 py-2 border border-ink-200 rounded-md text-sm mb-4 focus:ring-2 focus:ring-navy-700 focus:border-transparent"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} disabled={generating}
            className="px-4 py-2 text-sm rounded-md border border-ink-200 text-ink-700 hover:bg-ink-100 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={generate} disabled={!projectId || generating}
            className="px-5 py-2 text-sm rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold disabled:opacity-50 flex items-center gap-2">
            {generating ? <><RefreshCw size={15} className="animate-spin" /> Drafting…</> : <><Sparkles size={15} /> Generate</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIEmployeePage;
