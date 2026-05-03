// GERSL Design System v2 — primitive components shared across admin pages.
// Use these in NEW code; old pages can migrate gradually. The goal is one
// visual language: navy "trust" header, white cards on a cool-gray canvas,
// amber accents reserved for mission/impact metrics.
//
// Usage:
//   import { PageHeader, Card, Button, Badge, EmptyState, ErrorBox } from '../../components/ui/primitives';

import React from 'react';

const cn = (...c) => c.filter(Boolean).join(' ');

// -----------------------------------------------------------------------------
// PageHeader — canonical navy hero band at the top of every admin page.
//   <PageHeader
//     icon={Heart}
//     eyebrow="Orphan Care"
//     title="Orphan Care Management"
//     subtitle="Supporting 312 children with compassion"
//     actions={<Button variant="mission">Add Orphan</Button>}
//   />
// -----------------------------------------------------------------------------
export function PageHeader({ icon: Icon, title, subtitle, eyebrow, actions, children }) {
  return (
    <div className="bg-navy-900 rounded-lg2 px-6 py-5 text-white shadow-card">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="w-10 h-10 bg-mission-500/15 border border-mission-500/30 rounded-lg2 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-mission-300" />
            </div>
          )}
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] uppercase tracking-wider text-mission-300 font-semibold">{eyebrow}</p>
            )}
            <h1 className="text-h2 font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-ink-200 text-sm mt-0.5">{subtitle}</p>}
            {children}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// PageWrap — standard page container.
// -----------------------------------------------------------------------------
export function PageWrap({ children, className }) {
  return (
    <div className={cn('p-6 max-w-7xl mx-auto space-y-4', className)}>{children}</div>
  );
}

// -----------------------------------------------------------------------------
// Card — neutral container. `tone="mission"` swaps to amber-tinted variant
// for impact metrics (orphans served, beneficiaries helped, etc.).
// -----------------------------------------------------------------------------
export function Card({ children, className, tone = 'default', padded = true }) {
  const tones = {
    default: 'bg-white border-ink-100',
    mission: 'bg-mission-50 border-mission-200',
    navy:    'bg-navy-900 border-navy-800 text-white',
    muted:   'bg-ink-50 border-ink-100',
  };
  return (
    <div className={cn(
      'rounded-lg2 border shadow-card',
      tones[tone],
      padded && 'p-5',
      className
    )}>
      {children}
    </div>
  );
}

// CardSection — for stacking multiple sections inside a Card.
export function CardHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-4', className)}>
      <div>
        <h3 className="text-h3 text-ink-900">{title}</h3>
        {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Button — primary actions. Use plain <button> for low-affordance links.
// -----------------------------------------------------------------------------
export function Button({
  children, variant = 'primary', size = 'md', loading, disabled,
  className, type = 'button', ...rest
}) {
  const base = 'inline-flex items-center justify-center font-medium rounded-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-navy-500 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2   text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };
  const variants = {
    primary:   'bg-navy-900 hover:bg-navy-800 text-white shadow-card',
    secondary: 'bg-white border border-ink-200 text-ink-800 hover:bg-ink-50',
    ghost:     'text-ink-700 hover:bg-ink-50',
    danger:    'bg-danger-600 hover:bg-danger-700 text-white shadow-card',
    mission:   'bg-mission-500 hover:bg-mission-600 text-navy-900 shadow-card',
    onNavy:    'bg-white/10 hover:bg-white/15 border border-white/20 text-white',
    link:      'text-navy-700 hover:underline',
  };
  return (
    <button
      type={type} disabled={disabled || loading}
      className={cn(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )}
      {children}
    </button>
  );
}

// -----------------------------------------------------------------------------
// Badge — status pills.
// -----------------------------------------------------------------------------
const BADGE_TONES = {
  neutral: 'bg-ink-100 text-ink-700 border-ink-200',
  brand:   'bg-navy-50 text-navy-800 border-navy-200',
  info:    'bg-primary-50 text-primary-800 border-primary-200',
  success: 'bg-success-50 text-success-700 border-success-600/20',
  warn:    'bg-warn-50 text-warn-700 border-warn-600/20',
  danger:  'bg-danger-50 text-danger-700 border-danger-600/20',
  mission: 'bg-mission-50 text-mission-800 border-mission-300',
};
export function Badge({ tone = 'neutral', children, className }) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
      BADGE_TONES[tone] ?? BADGE_TONES.neutral,
      className
    )}>{children}</span>
  );
}
// Convenience: map common workflow strings → tone.
const STATUS_TONE = {
  Pending: 'warn', Submitted: 'info', InProgress: 'info', InMovement: 'info',
  Approved: 'success', Paid: 'success', Completed: 'success', Returned: 'success', Active: 'success',
  Rejected: 'danger', Cancelled: 'neutral', Missed: 'danger',
  Scheduled: 'info', Deducted: 'info', Inactive: 'neutral',
};
export function StatusBadge({ status, className }) {
  return <Badge tone={STATUS_TONE[status] ?? 'neutral'} className={className}>{status ?? '—'}</Badge>;
}

// -----------------------------------------------------------------------------
// EmptyState — inside a Card on an otherwise blank page.
// -----------------------------------------------------------------------------
export function EmptyState({ title = 'Nothing here yet', message, action, icon }) {
  return (
    <div className="bg-white border border-ink-100 rounded-lg2 shadow-card p-10 text-center">
      {icon && <div className="text-ink-300 mb-3 flex justify-center">{icon}</div>}
      <h3 className="text-h3 text-ink-800">{title}</h3>
      {message && <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">{message}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// -----------------------------------------------------------------------------
// ErrorBox — inline error alert.
// -----------------------------------------------------------------------------
export function ErrorBox({ children, className }) {
  return (
    <div className={cn('bg-danger-50 border border-danger-600/20 text-danger-700 rounded-md px-4 py-3 text-sm', className)}>
      {children}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Field — label + input wrapper that respects the design system.
// -----------------------------------------------------------------------------
export function Field({ label, hint, error, children, className }) {
  return (
    <label className={cn('block', className)}>
      {label && <span className="block text-xs font-medium text-ink-700 mb-1">{label}</span>}
      {children}
      {hint && !error && <span className="block text-xs text-ink-400 mt-1">{hint}</span>}
      {error && <span className="block text-xs text-danger-600 mt-1">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full border border-ink-200 bg-white px-3 py-2 rounded-md text-sm text-ink-900 placeholder-ink-400 ' +
  'focus:outline-none focus:border-navy-600 focus:ring-2 focus:ring-navy-600/20 ' +
  'disabled:bg-ink-50 disabled:cursor-not-allowed';

// -----------------------------------------------------------------------------
// Table primitives — opt-in, work with raw <table> if you prefer.
// -----------------------------------------------------------------------------
export function Th({ children, className }) {
  return (
    <th className={cn('px-4 py-2.5 text-left text-xs font-semibold text-ink-500 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}
export function Td({ children, className, mono }) {
  return (
    <td className={cn('px-4 py-2.5 text-sm text-ink-800', mono && 'font-mono text-xs text-ink-600', className)}>
      {children}
    </td>
  );
}
