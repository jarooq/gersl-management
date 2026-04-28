import sequelize from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

// Idempotent: safe to run multiple times.
// Adds Procurement permissions + role rows + role_permissions mappings.

const PROCUREMENT_PERMISSIONS = [
  { key: 'procurement:dashboard:view',      name: 'View Procurement Dashboard',     module: 'Procurement' },
  { key: 'procurement:request:view',        name: 'View Procurement Requests',      module: 'Procurement' },
  { key: 'procurement:request:create',      name: 'Create Procurement Request',     module: 'Procurement' },
  { key: 'procurement:request:assign',      name: 'Assign Procurement Request',     module: 'Procurement' },
  { key: 'procurement:request:cancel',      name: 'Cancel Procurement Request',     module: 'Procurement' },
  { key: 'procurement:rfq:create',          name: 'Create RFQ',                     module: 'Procurement' },
  { key: 'procurement:rfq:send',            name: 'Send RFQ to Vendors',            module: 'Procurement' },
  { key: 'procurement:quotation:enter',     name: 'Record Vendor Quotation',        module: 'Procurement' },
  { key: 'procurement:bid_analysis:create', name: 'Create Bid Analysis',            module: 'Procurement' },
  { key: 'procurement:bid_analysis:approve',name: 'Approve Bid Analysis',           module: 'Procurement' },
  { key: 'procurement:po:draft',            name: 'Draft Purchase Order',           module: 'Procurement' },
  { key: 'procurement:po:approve',          name: 'Approve Purchase Order',         module: 'Procurement' },
  { key: 'procurement:po:issue',            name: 'Issue Purchase Order to Vendor', module: 'Procurement' },
  { key: 'procurement:goods_receipt:create',name: 'Create Goods Receipt Note',      module: 'Procurement' },
  { key: 'procurement:goods_receipt:verify',name: 'Verify Goods Receipt Note',      module: 'Procurement' },
  { key: 'procurement:invoice:match',       name: 'Perform 3-way Match',            module: 'Procurement' },
  { key: 'procurement:vendor:view',         name: 'View Vendors',                   module: 'Procurement' },
  { key: 'procurement:vendor:create',       name: 'Create Vendor',                  module: 'Procurement' },
  { key: 'procurement:vendor:edit',         name: 'Edit Vendor',                    module: 'Procurement' },
  { key: 'procurement:vendor:blacklist',    name: 'Blacklist Vendor',               module: 'Procurement' },
  { key: 'procurement:thresholds:manage',   name: 'Manage Procurement Thresholds',  module: 'Procurement' },
  { key: 'procurement:report:view',         name: 'View Procurement Reports',       module: 'Procurement' }
];

// Permission keys granted to each role.
const ROLE_PERMISSIONS = {
  'Procurement Manager': PROCUREMENT_PERMISSIONS.map(p => p.key), // all
  'Procurement Officer': [
    'procurement:dashboard:view',
    'procurement:request:view',
    'procurement:request:create',
    'procurement:rfq:create',
    'procurement:rfq:send',
    'procurement:quotation:enter',
    'procurement:bid_analysis:create',
    'procurement:po:draft',
    'procurement:goods_receipt:create',
    'procurement:goods_receipt:verify',
    'procurement:invoice:match',
    'procurement:vendor:view',
    'procurement:vendor:create',
    'procurement:vendor:edit',
    'procurement:report:view'
  ]
};

async function run() {
  const t = await sequelize.transaction();
  try {
    // 1. Insert permissions (idempotent via ON CONFLICT)
    for (const p of PROCUREMENT_PERMISSIONS) {
      await sequelize.query(
        `INSERT INTO permissions (permission_key, permission_name, module, description, created_at, updated_at)
         VALUES (:key, :name, :module, :description, NOW(), NOW())
         ON CONFLICT (permission_key) DO UPDATE
           SET permission_name = EXCLUDED.permission_name,
               module = EXCLUDED.module,
               updated_at = NOW();`,
        { replacements: { key: p.key, name: p.name, module: p.module, description: p.name }, transaction: t }
      );
    }

    // 2. Ensure roles exist
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
      await sequelize.query(
        `INSERT INTO roles (name, description, is_active, created_at, updated_at)
         VALUES (:name, :desc, true, NOW(), NOW())
         ON CONFLICT (name) DO NOTHING;`,
        { replacements: { name: roleName, desc: `${roleName} role` }, transaction: t }
      );
    }

    // 3. Map permissions to roles (idempotent)
    for (const [roleName, keys] of Object.entries(ROLE_PERMISSIONS)) {
      for (const key of keys) {
        await sequelize.query(
          `INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
           SELECT r.id, p.id, NOW(), NOW()
           FROM roles r, permissions p
           WHERE r.name = :role AND p.permission_key = :key
           ON CONFLICT (role_id, permission_id) DO NOTHING;`,
          { replacements: { role: roleName, key }, transaction: t }
        );
      }
    }

    await t.commit();
    console.log(`Seeded ${PROCUREMENT_PERMISSIONS.length} procurement permissions and 2 roles.`);
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

run();
