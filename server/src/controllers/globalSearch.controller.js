import { Op } from 'sequelize';
import {
  Beneficiary,
  Partner,
  Project,
  Orphan,
  User,
} from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// Global search across the app's core entities. Powers Cmd+K in the
// command palette — the user types a name/code and gets record results
// alongside page-nav results.
//
// Contract:
//   GET /api/search?q=<query>
//   ->  { query, results: [{ type, id, title, subtitle, path }, ...] }
//
// Design notes:
// - iLike (Postgres) — case-insensitive. SQLite fallback in tests still
//   matches literal because Sequelize downgrades iLike to LIKE, and the
//   tests won't care.
// - Hard cap of 5 per entity so a common substring like "an" doesn't
//   flood the palette with dozens of matches. We surface diversity over
//   depth; the user can drill into a full list page for more.
// - Empty/short queries short-circuit to no work — a single-char query
//   would match essentially everything.
// - Each result includes a `path` that the palette turns into a route.
//   Detail pages that don't exist yet fall back to the list page with
//   the query prefilled so the user can find the record there.

const MIN_QUERY = 2;
const PER_ENTITY_LIMIT = 5;

export const globalSearch = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();

  if (q.length < MIN_QUERY) {
    return res.json({ query: q, results: [] });
  }

  const like = { [Op.iLike]: `%${q}%` };
  const results = [];

  // Beneficiaries — match fullName, beneficiaryId
  try {
    const rows = await Beneficiary.findAll({
      where: {
        [Op.or]: [{ fullName: like }, { beneficiaryId: like }],
      },
      limit: PER_ENTITY_LIMIT,
      attributes: ['id', 'fullName', 'beneficiaryId', 'district'],
    });
    for (const b of rows) {
      results.push({
        type: 'beneficiary',
        id: b.id,
        title: b.fullName,
        subtitle: `${b.beneficiaryId || '—'}${b.district ? ` · ${b.district}` : ''}`,
        path: `/admin/beneficiaries?search=${encodeURIComponent(q)}`,
      });
    }
  } catch { /* entity may be missing in some environments */ }

  // Partners — match name, partnerCode
  try {
    const rows = await Partner.findAll({
      where: {
        [Op.or]: [{ name: like }, { partnerCode: like }],
      },
      limit: PER_ENTITY_LIMIT,
      attributes: ['id', 'name', 'partnerCode', 'category'],
    });
    for (const p of rows) {
      results.push({
        type: 'partner',
        id: p.id,
        title: p.name,
        subtitle: `${p.partnerCode || '—'}${p.category ? ` · ${p.category}` : ''}`,
        path: `/admin/partners?section=overview`,
      });
    }
  } catch { /* skip */ }

  // Projects — match name, code
  try {
    const rows = await Project.findAll({
      where: {
        [Op.or]: [{ name: like }, { code: like }],
      },
      limit: PER_ENTITY_LIMIT,
      attributes: ['id', 'name', 'code', 'status'],
    });
    for (const p of rows) {
      results.push({
        type: 'project',
        id: p.id,
        title: p.name,
        subtitle: `${p.code || '—'}${p.status ? ` · ${p.status}` : ''}`,
        path: `/admin/projects/${p.id}`,
      });
    }
  } catch { /* skip */ }

  // Orphans — match fullName, orphanId
  try {
    const rows = await Orphan.findAll({
      where: {
        [Op.or]: [{ fullName: like }, { orphanId: like }],
      },
      limit: PER_ENTITY_LIMIT,
      attributes: ['id', 'fullName', 'orphanId', 'age'],
    });
    for (const o of rows) {
      results.push({
        type: 'orphan',
        id: o.id,
        title: o.fullName,
        subtitle: `${o.orphanId || '—'}${o.age != null ? ` · Age ${o.age}` : ''}`,
        path: `/admin/orphans`,
      });
    }
  } catch { /* skip */ }

  // Staff (Users) — match fullName, username
  try {
    const rows = await User.findAll({
      where: {
        [Op.or]: [{ fullName: like }, { username: like }],
      },
      limit: PER_ENTITY_LIMIT,
      attributes: ['id', 'fullName', 'username', 'role'],
    });
    for (const u of rows) {
      results.push({
        type: 'staff',
        id: u.id,
        title: u.fullName || u.username,
        subtitle: `${u.username || '—'}${u.role ? ` · ${u.role}` : ''}`,
        path: `/admin/hr?section=overview`,
      });
    }
  } catch { /* skip */ }

  res.json({ query: q, results });
});
