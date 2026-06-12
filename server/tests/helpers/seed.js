// Test fixtures + auth helpers.

import request from 'supertest';

const PASSWORD = 'Test123!@';

// Create one user per role we need to test against. Returns a `{ role: user }`
// map plus a login() helper that handles the supertest plumbing.
//
// Keep roles minimal — add more here only when a test really needs them.
// We pass the plaintext password; the User model's beforeCreate hook hashes it.
export async function seedTestUsers({ User }) {
  const make = async (overrides) => User.create({
    fullName: overrides.username,
    email: `${overrides.username}@test.local`,
    password: PASSWORD,
    status: 'Active',
    failedLoginAttempts: 0,
    ...overrides,
  });

  const users = {
    admin: await make({ username: 'admin', role: 'Admin' }),
    financeManager: await make({ username: 'finmgr', role: 'Finance Manager' }),
    guest: await make({ username: 'guest', role: 'Guest' }),
    fieldOfficer: await make({ username: 'fieldofficer', role: 'Field Officer' }),
  };
  return users;
}

// Logs in as the given user and returns helpers for authed requests.
//
//   const { auth } = await loginAs(app, users.admin);
//   await auth(request(app).get('/api/invoices')); // sets the Bearer header
export async function loginAs(app, user) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: user.username, password: PASSWORD });
  if (res.status !== 200) {
    throw new Error(`loginAs(${user.username}) failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  const token = res.body.accessToken || res.body.data?.accessToken;
  if (!token) throw new Error(`loginAs(${user.username}): no token in response`);
  const auth = (req) => req.set('Authorization', `Bearer ${token}`);
  return { token, auth, user };
}

export { PASSWORD };
