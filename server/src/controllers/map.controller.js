// =============================================================================
// Map pins endpoint
//
// GET /api/map/pins?types=wash,igp,orphan,beneficiary&projectId=&donorId=
//
// Returns a unified array of pins, one per pin-able row across the requested
// layers. Each pin carries enough metadata for the client to render colour,
// label, popup content, and a link to the detail page.
//
// Filters apply per kind where they make sense (projectId only WASH/IGP; etc.).
// =============================================================================

import { Op } from 'sequelize';
import { WashItem, IgpItem, Orphan, Beneficiary, WashOrder, IgpOrder } from '../models/index.js';
import { asyncHandler, BadRequestError } from '../middleware/error.middleware.js';

const ALL_KINDS = new Set(['wash', 'igp', 'orphan', 'beneficiary']);

const num = (v) => (v == null || v === '' ? null : Number(v));

export const getMapPins = asyncHandler(async (req, res) => {
  const requested = String(req.query.types || 'wash,igp,orphan,beneficiary')
    .split(',').map(s => s.trim()).filter(Boolean);
  const types = requested.filter(t => ALL_KINDS.has(t));
  if (types.length === 0) throw new BadRequestError('no valid types');

  const projectId   = num(req.query.projectId);
  const donorId     = num(req.query.donorId);
  const washOrderId = num(req.query.washOrderId);
  const igpOrderId  = num(req.query.igpOrderId);
  const district    = req.query.district || null;
  const stage       = req.query.stage    || null;

  const pins = [];

  // ----- WASH items
  if (types.includes('wash')) {
    const whereItem = {
      installationLat: { [Op.ne]: null },
      installationLng: { [Op.ne]: null },
    };
    if (stage)       whereItem.stage    = stage;
    if (district)    whereItem.district = district;
    if (washOrderId) whereItem.orderId  = washOrderId;

    const orderWhere = {};
    if (projectId) orderWhere.projectId = projectId;
    if (donorId)   orderWhere.donorId   = donorId;

    const rows = await WashItem.findAll({
      where: whereItem,
      attributes: ['id', 'itemCode', 'stage', 'unitType', 'beneficiaryName', 'district', 'installationLat', 'installationLng', 'orderId'],
      include: [{
        model: WashOrder, as: 'order',
        attributes: ['id', 'orderCode', 'title', 'donorId', 'projectId'],
        where: Object.keys(orderWhere).length ? orderWhere : undefined,
        required: Object.keys(orderWhere).length > 0,
      }],
      limit: 5000,
    });
    for (const r of rows) {
      pins.push({
        kind:      'wash',
        id:        r.id,
        lat:       Number(r.installationLat),
        lng:       Number(r.installationLng),
        label:     r.beneficiaryName || r.itemCode,
        sublabel:  `${r.unitType} · ${r.district || ''}`.trim(),
        status:    r.stage,
        programme: 'WASH',
        color:     STAGE_COLOR_WASH[r.stage] || '#0ea5e9',
        link:      `/admin/wash/items/${r.id}`,
      });
    }
  }

  // ----- IGP items
  if (types.includes('igp')) {
    const whereItem = {
      deliveryLat: { [Op.ne]: null },
      deliveryLng: { [Op.ne]: null },
    };
    if (stage)      whereItem.stage    = stage;
    if (district)   whereItem.district = district;
    if (igpOrderId) whereItem.orderId  = igpOrderId;

    const orderWhere = {};
    if (projectId) orderWhere.projectId = projectId;
    if (donorId)   orderWhere.donorId   = donorId;

    const rows = await IgpItem.findAll({
      where: whereItem,
      attributes: ['id', 'itemCode', 'stage', 'assetType', 'beneficiaryName', 'district', 'deliveryLat', 'deliveryLng', 'orderId'],
      include: [{
        model: IgpOrder, as: 'order',
        attributes: ['id', 'orderCode', 'title', 'donorId', 'projectId'],
        where: Object.keys(orderWhere).length ? orderWhere : undefined,
        required: Object.keys(orderWhere).length > 0,
      }],
      limit: 5000,
    });
    for (const r of rows) {
      pins.push({
        kind:      'igp',
        id:        r.id,
        lat:       Number(r.deliveryLat),
        lng:       Number(r.deliveryLng),
        label:     r.beneficiaryName || r.itemCode,
        sublabel:  `${r.assetType} · ${r.district || ''}`.trim(),
        status:    r.stage,
        programme: 'IGP',
        color:     STAGE_COLOR_IGP[r.stage] || '#10b981',
        link:      `/admin/igp/items/${r.id}`,
      });
    }
  }

  // ----- Orphans
  if (types.includes('orphan')) {
    const where = {
      latitude:  { [Op.ne]: null },
      longitude: { [Op.ne]: null },
    };
    if (district) where.district = district;
    const rows = await Orphan.findAll({
      where,
      attributes: ['id', 'fullName', 'district', 'latitude', 'longitude', 'orphanCode'],
      limit: 5000,
    });
    for (const r of rows) {
      pins.push({
        kind:      'orphan',
        id:        r.id,
        lat:       Number(r.latitude),
        lng:       Number(r.longitude),
        label:     r.fullName,
        sublabel:  r.district || '',
        status:    null,
        programme: 'OrphanCare',
        color:     '#ec4899',  // pink-500
        link:      `/admin/orphans/${r.id}`,
      });
    }
  }

  // ----- Beneficiaries (pure registry rows that aren't yet attached to a
  //       wash/igp item — useful for "all known households")
  if (types.includes('beneficiary')) {
    const where = {
      household_lat: { [Op.ne]: null },
      household_lng: { [Op.ne]: null },
    };
    if (district) where.district = district;
    const rows = await Beneficiary.findAll({
      where,
      attributes: ['id', 'fullName', 'beneficiaryId', 'district', 'household_lat', 'household_lng'],
      limit: 5000,
    });
    for (const r of rows) {
      pins.push({
        kind:      'beneficiary',
        id:        r.id,
        lat:       Number(r.household_lat),
        lng:       Number(r.household_lng),
        label:     r.fullName,
        sublabel:  r.beneficiaryId || r.district || '',
        status:    null,
        programme: 'Registry',
        color:     '#6366f1',  // indigo-500
        link:      `/admin/beneficiaries`,
      });
    }
  }

  res.json({ success: true, data: { count: pins.length, pins } });
});

// Stage → hex colour mapping (mirrors the badge palette in the web pages).
const STAGE_COLOR_WASH = {
  Ordered:      '#94a3b8',  // slate-400
  Surveyed:     '#3b82f6',  // blue-500
  Materials:    '#6366f1',  // indigo-500
  Construction: '#f59e0b',  // amber-500
  Testing:      '#a855f7',  // purple-500
  HandedOver:   '#10b981',  // emerald-500
  Reported:     '#059669',  // emerald-600
  Cancelled:    '#dc2626',  // red-600
};
const STAGE_COLOR_IGP = {
  Ordered:   '#94a3b8',
  Surveyed:  '#3b82f6',
  Procured:  '#6366f1',
  Training:  '#f59e0b',
  Delivered: '#10b981',
  FollowUp:  '#a855f7',
  Reported:  '#059669',
  Cancelled: '#dc2626',
};
