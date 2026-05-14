// =============================================================================
// Push notification service — Firebase Cloud Messaging (FCM HTTP v1 API).
//
// Configuration (env vars):
//   FIREBASE_SERVICE_ACCOUNT_JSON  — full service-account JSON as a single
//                                    string (paste the contents of the
//                                    downloaded file into Vercel env). Without
//                                    this, every call short-circuits with a
//                                    console.log("[push] skipped"). Safe to
//                                    leave wired into every notification path
//                                    even before FCM is provisioned.
//
// Mirrors the email-service pattern: never throws, always returns a boolean.
// Business logic should not depend on push delivery succeeding.
// =============================================================================

import { DeviceRegistration } from '../models/index.js';

let _admin = null;
let _initTried = false;

const enabled = () => Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

// Lazy-init firebase-admin so we don't load the SDK on every cold start when
// pushes aren't configured. The package is already in server/package.json
// because the GERHR migration reader needed it.
const getAdmin = async () => {
  if (_admin) return _admin;
  if (_initTried) return null;
  _initTried = true;
  if (!enabled()) return null;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    let creds;
    try {
      creds = JSON.parse(raw);
    } catch {
      // Some users base64-encode the JSON to avoid newline issues in env vars.
      creds = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
    const adminMod  = await import('firebase-admin/app');
    const msgMod    = await import('firebase-admin/messaging');
    const app = adminMod.getApps().length
      ? adminMod.getApps()[0]
      : adminMod.initializeApp({ credential: adminMod.cert(creds) });
    _admin = msgMod.getMessaging(app);
    return _admin;
  } catch (err) {
    console.error('[push] firebase-admin init failed:', err.message);
    return null;
  }
};

// ----------------------------------------------------------------------------
// Look up all active push tokens for a set of user ids.
// ----------------------------------------------------------------------------
const tokensFor = async (userIds) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const rows = await DeviceRegistration.findAll({
    where: { userId: userIds, isActive: true },
    attributes: ['id', 'pushToken', 'platform'],
  });
  return rows.filter(r => r.pushToken).map(r => ({
    id: r.id, token: r.pushToken, platform: r.platform,
  }));
};

// ----------------------------------------------------------------------------
// Mark tokens as inactive when FCM reports them as unregistered/invalid.
// ----------------------------------------------------------------------------
const deactivateTokens = async (ids) => {
  if (!ids.length) return;
  try {
    await DeviceRegistration.update(
      { isActive: false },
      { where: { id: ids } }
    );
  } catch (err) {
    console.error('[push] deactivateTokens failed:', err.message);
  }
};

/**
 * Send a push to one or more users. Returns true if at least one device
 * received it (false if FCM dormant or no tokens). NEVER throws.
 *
 * @param {Object}  opts
 * @param {number|number[]}  opts.userIds  — user(s) to notify
 * @param {string}  opts.title             — notification title
 * @param {string}  opts.body              — notification body
 * @param {Object}  [opts.data]            — string-only key/value data
 *                                            payload (for deep-link routing)
 */
export const sendPush = async ({ userIds, title, body, data }) => {
  const ids = Array.isArray(userIds) ? userIds : [userIds];
  if (ids.length === 0) return false;

  const messaging = await getAdmin();
  if (!messaging) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[push] skipped (FCM not configured): users=${ids.join(',')} title="${title}"`);
    }
    return false;
  }

  const targets = await tokensFor(ids);
  if (targets.length === 0) return false;

  // FCM data payloads must be string-string. Stringify any non-string values.
  const stringData = {};
  if (data) {
    for (const [k, v] of Object.entries(data)) {
      if (v == null) continue;
      stringData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: targets.map(t => t.token),
      notification: { title, body },
      data: stringData,
      android: {
        priority: 'high',
        notification: { sound: 'default', channelId: 'gersl_default' },
      },
      apns: {
        payload: { aps: { sound: 'default', badge: 1 } },
      },
    });

    // Mark any unregistered/invalid tokens inactive so we stop sending to them.
    const toDeactivate = [];
    response.responses.forEach((r, i) => {
      if (!r.success) {
        const code = r.error?.code || '';
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-argument' ||
          code === 'messaging/invalid-registration-token'
        ) {
          toDeactivate.push(targets[i].id);
        }
      }
    });
    if (toDeactivate.length) await deactivateTokens(toDeactivate);

    return response.successCount > 0;
  } catch (err) {
    console.error(`[push] send failed (title="${title}"):`, err.message);
    return false;
  }
};

/**
 * Convenience helpers — keep the notification text in one place so the
 * mobile screen and the email + push wording stay consistent.
 */
export const pushLeaveDecided = ({ to, decision, kind }) =>
  sendPush({
    userIds: to,
    title: `Leave ${decision === 'Approved' ? 'approved' : 'rejected'}`,
    body:  `Your ${kind || 'leave'} request was ${decision === 'Approved' ? 'approved' : 'rejected'}.`,
    data:  { type: 'leave_decision', decision },
  });

export const pushApprovalRequest = ({ to, requesterName, kind }) =>
  sendPush({
    userIds: to,
    title: `New ${kind} request`,
    body:  `${requesterName} submitted a ${kind} request for your approval.`,
    data:  { type: 'approval_request', kind: String(kind) },
  });

export const pushItemAssigned = ({ to, kind, itemCode, beneficiaryName }) =>
  sendPush({
    userIds: to,
    title: `New ${kind === 'wash' ? 'WASH' : 'IGP'} assignment`,
    body:  `${itemCode}${beneficiaryName ? ' · ' + beneficiaryName : ''} is now assigned to you.`,
    data:  { type: 'item_assigned', kind: String(kind), itemCode },
  });

export const pushDeadlineNudge = ({ to, count }) =>
  sendPush({
    userIds: to,
    title: `${count} item${count === 1 ? '' : 's'} need attention`,
    body:  `You have ${count} programme item${count === 1 ? '' : 's'} overdue or due soon.`,
    data:  { type: 'deadline_nudge', count: String(count) },
  });
