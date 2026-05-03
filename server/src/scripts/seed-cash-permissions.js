// Seeds the Cash module permissions (Locker / CashBook / Petty Cash /
// Replenishments) and grants them to Admin + Finance roles. Idempotent.
// Frontend gates these in src/routes/AppRouter.jsx using the keys below.
//
//   node server/src/scripts/seed-cash-permissions.js

import sequelize from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const CASH_PERMISSIONS = [
  { key: 'finance:cash:accounts:view',          name: 'View Cash Accounts',       module: 'Cash' },
  { key: 'finance:cash:accounts:manage',        name: 'Manage Cash Accounts',     module: 'Cash' },
  { key: 'finance:cash:transactions:view',      name: 'View Cash Transactions',   module: 'Cash' },
  { key: 'finance:cash:transactions:record',    name: 'Record Cash Transaction',  module: 'Cash' },
  { key: 'finance:cash:transactions:approve',   name: 'Approve Cash Transaction', module: 'Cash' },
  { key: 'finance:cash:count:run',              name: 'Run Cash Count',           module: 'Cash' },
  { key: 'finance:cash:count:approve',          name: 'Approve Cash Count',       module: 'Cash' },
  { key: 'finance:cash:replenishment:request',  name: 'Request Replenishment',    module: 'Cash' },
  { key: 'finance:cash:replenishment:approve',  name: 'Approve Replenishment',    module: 'Cash' },
];

const ROLE_PERMISSIONS = {
  // Admin gets everything.
  'Admin':           CASH_PERMISSIONS.map(p => p.key),
  // Finance Manager — full operational + approval rights.
  'Finance Manager': CASH_PERMISSIONS.map(p => p.key),
  // CEO — view + final approvals only.
  'CEO': [
    'finance:cash:accounts:view',
    'finance:cash:transactions:view',
    'finance:cash:transactions:approve',
    'finance:cash:count:approve',
    'finance:cash:replenishment:approve',
  ],
  // Cashier-style roles — record + run, no approve.
  'Finance Officer': [
    'finance:cash:accounts:view',
    'finance:cash:transactions:view',
    'finance:cash:transactions:record',
    'finance:cash:count:run',
    'finance:cash:replenishment:request',
  ],
  'Accountant': [
    'finance:cash:accounts:view',
    'finance:cash:transactions:view',
    'finance:cash:transactions:record',
    'finance:cash:count:run',
    'finance:cash:replenishment:request',
  ],
  'Finance Assistant': [
    'finance:cash:accounts:view',
    'finance:cash:transactions:view',
    'finance:cash:transactions:record',
    'finance:cash:replenishment:request',
  ],
};

async function run() {
  const t = await sequelize.transaction();
  try {
    for (const p of CASH_PERMISSIONS) {
      await sequelize.query(
        `INSERT INTO permissions (permission_key, permission_name, module, description)
         VALUES (:key, :name, :module, :description)
         ON CONFLICT (permission_key) DO UPDATE
           SET permission_name = EXCLUDED.permission_name,
               module = EXCLUDED.module;`,
        { replacements: { key: p.key, name: p.name, module: p.module, description: p.name }, transaction: t }
      );
    }
    let mapped = 0;
    for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const key of keys) {
        const [, meta] = await sequelize.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           SELECT r.id, p.id FROM roles r, permissions p
           WHERE r.name = :role AND p.permission_key = :key
           ON CONFLICT (role_id, permission_id) DO NOTHING;`,
          { replacements: { role: roleName, key }, transaction: t }
        );
        if (meta?.rowCount) mapped += meta.rowCount;
      }
    }
    await t.commit();
    console.log(`✓ Seeded ${CASH_PERMISSIONS.length} cash permissions, ${mapped} new role mappings.`);
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

run();
