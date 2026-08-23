/**
 * AI Employee — notification dispatch
 *
 * Everything the assistant says to a human goes through here, so the two rules
 * that keep it welcome are enforced in one place:
 *   1. Quiet hours — nothing but `critical` lands outside working hours.
 *   2. Daily cap   — a person can only be pinged so many times before they
 *                    stop reading anything the assistant sends.
 */

import { select, execute } from './db.js';
import { SEVERITY_TO_PRIORITY } from './config.js';

export const AI_NOTIFICATION_TYPE = 'ai_employee_alert';
export const AI_BRIEFING_TYPE = 'ai_employee_briefing';

/** Local hour + weekday in the configured timezone. */
const localNow = (timezone) => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: 'numeric',
      weekday: 'short',
      hour12: false
    }).formatToParts(new Date());

    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const weekdayName = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekdayName);
    return { hour, weekday: weekday === -1 ? new Date().getUTCDay() : weekday };
  } catch {
    const d = new Date();
    return { hour: d.getUTCHours(), weekday: d.getUTCDay() };
  }
};

/**
 * Whether a message of this severity may be delivered right now.
 * `critical` always passes — a safeguarding or audit-grade problem shouldn't
 * wait until morning.
 */
export const isDeliverableNow = (config, severity) => {
  const quiet = config.quietHours;
  if (!quiet?.enabled) return true;
  if (severity === 'critical') return true;

  const { hour, weekday } = localNow(config.timezone);

  if ((quiet.nonWorkingDays || []).includes(weekday)) return false;

  const { startHour, endHour } = quiet;
  // Window wraps midnight (e.g. 20:00 → 07:00).
  const inQuietWindow = startHour > endHour
    ? hour >= startHour || hour < endHour
    : hour >= startHour && hour < endHour;

  return !inQuietWindow;
};

/** How many AI notifications this user has already received today. */
const countTodaysNotifications = async (userId, since) => {
  const [row] = await select(
    `SELECT COUNT(*) AS count
       FROM notifications
      WHERE user_id = :userId
        AND type IN (:types)
        AND created_at >= :since`,
    { userId, types: [AI_NOTIFICATION_TYPE, AI_BRIEFING_TYPE], since }
  );
  return Number(row?.count ?? 0);
};

const startOfLocalDay = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

/**
 * Send one notification. Returns 'sent' | 'suppressed_quiet_hours' |
 * 'suppressed_rate_limit' | 'suppressed_dry_run' | 'failed'.
 */
export const sendNotification = async ({
  config,
  userId,
  severity = 'warning',
  type = AI_NOTIFICATION_TYPE,
  title,
  message,
  category,
  entityType,
  entityId,
  actionUrl,
  actionLabel,
  bypassRateLimit = false
}) => {
  if (!userId) return 'failed';

  if (!isDeliverableNow(config, severity)) return 'suppressed_quiet_hours';

  if (!bypassRateLimit && severity !== 'critical') {
    const sentToday = await countTodaysNotifications(userId, startOfLocalDay());
    if (sentToday >= config.limits.maxNotificationsPerUserPerDay) {
      return 'suppressed_rate_limit';
    }
  }

  if (config.dryRun) {
    console.log(`[AI Employee][dry-run] → user ${userId}: ${title}`);
    return 'suppressed_dry_run';
  }

  try {
    await execute(
      `INSERT INTO notifications (
         user_id, type, title, message,
         related_entity_type, related_entity_id,
         priority, category, action_url, action_label,
         delivery_method, delivered_at, created_at
       ) VALUES (
         :userId, :type, :title, :message,
         :entityType, :entityId,
         :priority, :category, :actionUrl, :actionLabel,
         'in_app', :now, :now
       )`,
      {
        userId,
        type,
        title: title.slice(0, 255),
        message,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        priority: SEVERITY_TO_PRIORITY[severity] ?? 'Medium',
        category: category ?? 'deadline',
        actionUrl: actionUrl ? actionUrl.slice(0, 500) : null,
        actionLabel: actionLabel ? actionLabel.slice(0, 100) : null,
        now: new Date()
      }
    );
    return 'sent';
  } catch (err) {
    console.error(`[AI Employee] Notification insert failed for user ${userId}:`, err.message);
    return 'failed';
  }
};
