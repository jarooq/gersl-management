import {
  PurchaseRequisition,
  RFQ,
  PurchaseOrder,
  GoodsReceiptNote,
  ThreeWayMatch,
  Vendor,
  Quotation,
  POLine,
  sequelize
} from '../models/index.js';
import { Op } from 'sequelize';
import { asyncHandler } from '../middleware/error.middleware.js';

// Returns a dashboard payload for procurement.
export const getProcurementDashboard = asyncHandler(async (req, res) => {
  const fromDate = req.query.from
    ? new Date(req.query.from)
    : (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d; })();

  // ============== Counters ==============
  const [
    requisitionsByStatus,
    rfqsByStatus,
    posByStatus,
    grnsByStatus,
    matchesByStatus,
    vendorsByStatus,
    pendingDueDiligence,
    pendingAssignments
  ] = await Promise.all([
    PurchaseRequisition.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    RFQ.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    PurchaseOrder.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    GoodsReceiptNote.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    ThreeWayMatch.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    Vendor.findAll({
      attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['status']
    }),
    Vendor.count({ where: { dueDiligenceStatus: 'Pending' } }),
    PurchaseRequisition.count({ where: { assignedOfficerId: null, status: { [Op.in]: ['Pending', 'Submitted', 'Approved'] } } })
  ]);

  // ============== Spend by vendor (top 10) ==============
  const spendByVendor = await PurchaseOrder.findAll({
    where: {
      status: { [Op.notIn]: ['Cancelled', 'Draft'] },
      createdAt: { [Op.gte]: fromDate }
    },
    attributes: [
      'vendorId',
      [sequelize.fn('SUM', sequelize.col('total_amount')), 'totalSpend'],
      [sequelize.fn('COUNT', sequelize.col('PurchaseOrder.id')), 'poCount']
    ],
    include: [{ model: Vendor, as: 'vendor', attributes: ['id', 'vendorName'] }],
    group: ['vendorId', 'vendor.id'],
    order: [[sequelize.literal('"totalSpend"'), 'DESC']],
    limit: 10
  });

  // ============== Spend by category — count POs by leading vendor category ==============
  // Simple aggregate: vendor.categories[0] used as the category bucket.
  const recentPOs = await PurchaseOrder.findAll({
    where: {
      status: { [Op.notIn]: ['Cancelled', 'Draft'] },
      createdAt: { [Op.gte]: fromDate }
    },
    attributes: ['id', 'totalAmount'],
    include: [{ model: Vendor, as: 'vendor', attributes: ['categories'] }]
  });
  const byCategory = new Map();
  for (const po of recentPOs) {
    const cats = po.vendor?.categories || [];
    const key = cats[0] || 'Uncategorized';
    const prev = byCategory.get(key) || { spend: 0, count: 0 };
    byCategory.set(key, {
      spend: prev.spend + Number(po.totalAmount || 0),
      count: prev.count + 1
    });
  }
  const spendByCategory = Array.from(byCategory.entries())
    .map(([category, v]) => ({ category, ...v }))
    .sort((a, b) => b.spend - a.spend);

  // ============== Cycle time — average days from PR -> PO Issued ==============
  const issuedPOs = await PurchaseOrder.findAll({
    where: {
      status: { [Op.in]: ['Issued', 'Acknowledged', 'Partial-Received', 'Received', 'Closed'] },
      issuedAt: { [Op.ne]: null, [Op.gte]: fromDate },
      requisitionId: { [Op.ne]: null }
    },
    attributes: ['id', 'issuedAt', 'requisitionId'],
    include: [{ model: PurchaseRequisition, as: 'requisition', attributes: ['id', 'createdAt'] }]
  });
  const cycles = issuedPOs
    .map(po => {
      const created = po.requisition?.createdAt;
      if (!created) return null;
      const days = (new Date(po.issuedAt) - new Date(created)) / (1000 * 60 * 60 * 24);
      return Number.isFinite(days) && days >= 0 ? days : null;
    })
    .filter(d => d != null);
  const avgCycleDays = cycles.length === 0 ? null
    : Number((cycles.reduce((a, b) => a + b, 0) / cycles.length).toFixed(1));

  // ============== Pending actions — manager-facing ==============
  const [unassignedRequisitions, pendingApprovalPOs, openDiscrepancies, draftRfqs] = await Promise.all([
    PurchaseRequisition.count({
      where: { assignedOfficerId: null, status: { [Op.in]: ['Pending', 'Submitted', 'Approved'] } }
    }),
    PurchaseOrder.count({ where: { status: 'Pending-Approval' } }),
    ThreeWayMatch.count({ where: { status: 'Discrepancy' } }),
    RFQ.count({ where: { status: 'Draft' } })
  ]);

  res.json({
    success: true,
    data: {
      from: fromDate.toISOString(),
      counters: {
        requisitions: countToMap(requisitionsByStatus),
        rfqs: countToMap(rfqsByStatus),
        purchaseOrders: countToMap(posByStatus),
        grns: countToMap(grnsByStatus),
        threeWayMatches: countToMap(matchesByStatus),
        vendors: countToMap(vendorsByStatus),
        pendingDueDiligence,
        pendingAssignments
      },
      spendByVendor: spendByVendor.map(r => ({
        vendorId: r.vendorId,
        vendorName: r.vendor?.vendorName || `#${r.vendorId}`,
        totalSpend: Number(r.get('totalSpend') || 0),
        poCount: Number(r.get('poCount') || 0)
      })),
      spendByCategory,
      avgCycleDays,
      pendingActions: {
        unassignedRequisitions,
        pendingApprovalPOs,
        openDiscrepancies,
        draftRfqs
      }
    }
  });
});

const countToMap = (rows) =>
  rows.reduce((acc, r) => {
    acc[r.status] = Number(r.get('count'));
    return acc;
  }, {});
