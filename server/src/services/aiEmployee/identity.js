/**
 * AI Employee — identity
 *
 * The AI Employee is a real row in `users`. That is deliberate: it lets the
 * assistant be attributed in audit logs, referenced as the sender of a
 * notification, @mentioned in task comments, and constrained by the same role
 * checks as any human. It is *not* a login — the account is created with a
 * random password nobody holds, and login is refused for it in the auth layer.
 */

import crypto from 'node:crypto';
import { User } from '../../models/index.js';
import { getConfig } from './settings.js';

let cachedId = null;

/**
 * Find the AI Employee's user record, creating it on first use.
 * Returns null (and logs) if the account can't be provisioned, so a broken
 * identity degrades the assistant rather than taking the server down.
 */
export const getAiEmployee = async () => {
  const config = await getConfig();
  const { identity } = config;

  try {
    let user = await User.findOne({ where: { email: identity.email } });

    if (!user) {
      user = await User.create({
        username: identity.username,
        email: identity.email,
        fullName: identity.name,
        // Unguessable and never handed out — this account cannot be signed into.
        password: crypto.randomBytes(48).toString('hex'),
        role: identity.role,
        department: identity.department,
        position: identity.title,
        employeeId: identity.employeeId,
        status: 'Active'
      });
      console.log(`[AI Employee] Provisioned account "${identity.name}" (user #${user.id})`);
    }

    cachedId = user.id;
    return user;
  } catch (err) {
    console.error('[AI Employee] Could not provision identity:', err.message);
    return null;
  }
};

/** The AI Employee's user id, or null if it hasn't been provisioned yet. */
export const getAiEmployeeId = async () => {
  if (cachedId) return cachedId;
  const user = await getAiEmployee();
  return user?.id ?? null;
};

/** True if the given user id is the AI Employee. Used to block login. */
export const isAiEmployee = async (userId) => {
  if (!userId) return false;
  const id = await getAiEmployeeId();
  return id !== null && Number(id) === Number(userId);
};
