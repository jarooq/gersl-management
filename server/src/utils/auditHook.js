import AuditLog from '../models/AuditLog.js';
import { getRequestContext } from '../middleware/requestContext.js';

// Fields excluded from before/after snapshots — secrets, tokens, blobs.
const DEFAULT_REDACTIONS = new Set([
  'password',
  'refreshToken',
  'passwordResetToken',
  'passwordResetExpires',
  'failedLoginAttempts',
  'accountLockedUntil'
]);

const safeSnapshot = (instance, redactions) => {
  if (!instance) return null;
  const raw = typeof instance.get === 'function' ? instance.get({ plain: true }) : { ...instance };
  const out = {};
  for (const k of Object.keys(raw)) {
    if (redactions.has(k)) continue;
    out[k] = raw[k];
  }
  return out;
};

const writeLog = async (entry) => {
  // Audit logging must never break the parent operation.
  // Fire-and-forget; log to console on failure.
  try {
    await AuditLog.create(entry);
  } catch (err) {
    console.error('AuditLog write failed:', err.message);
  }
};

/**
 * Attach create/update/delete audit hooks to a Sequelize model.
 * Pass entityType (e.g. "User") and optional extra fields to redact.
 */
export const withAuditLog = (model, entityType, extraRedactions = []) => {
  const redactions = new Set([...DEFAULT_REDACTIONS, ...extraRedactions]);
  const idOf = (instance) => {
    const id = instance?.id ?? instance?.get?.('id');
    return id == null ? 'unknown' : String(id);
  };

  model.addHook('afterCreate', `${entityType}_audit_create`, (instance) => {
    const ctx = getRequestContext();
    writeLog({
      action: 'create',
      entityType,
      entityId: idOf(instance),
      userId: ctx.userId,
      userRole: ctx.userRole,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      afterValues: safeSnapshot(instance, redactions),
      metadata: ctx.path ? { route: `${ctx.method} ${ctx.path}` } : null
    });
  });

  model.addHook('afterUpdate', `${entityType}_audit_update`, (instance) => {
    const ctx = getRequestContext();
    const changed = typeof instance.changed === 'function' ? instance.changed() || [] : [];
    const filteredChanged = changed.filter(f => !redactions.has(f));
    if (filteredChanged.length === 0) return; // only secret fields changed → don't log
    const previous = {};
    const current = {};
    for (const field of filteredChanged) {
      previous[field] = instance.previous(field);
      current[field] = instance.get(field);
    }
    writeLog({
      action: 'update',
      entityType,
      entityId: idOf(instance),
      userId: ctx.userId,
      userRole: ctx.userRole,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      changedFields: filteredChanged,
      beforeValues: previous,
      afterValues: current,
      metadata: ctx.path ? { route: `${ctx.method} ${ctx.path}` } : null
    });
  });

  model.addHook('afterDestroy', `${entityType}_audit_delete`, (instance) => {
    const ctx = getRequestContext();
    writeLog({
      action: 'delete',
      entityType,
      entityId: idOf(instance),
      userId: ctx.userId,
      userRole: ctx.userRole,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      beforeValues: safeSnapshot(instance, redactions),
      metadata: ctx.path ? { route: `${ctx.method} ${ctx.path}` } : null
    });
  });
};
