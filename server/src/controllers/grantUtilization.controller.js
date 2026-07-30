import { Op } from 'sequelize';
import {
  sequelize, GrantReceivable, GrantReceipt, Bill, Partner, Project,
} from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';

// ============================================
// GET /api/finance/grants/utilization
// Per-grant utilisation rollup for the Grant Receivables tab. Answers
// the "how are we tracking against each grant?" question with one
// query rather than making the client fan out per row.
//
// For each grant:
//   received:    sum of GrantReceipt.amount (or amountLkr for forex)
//   utilised:    sum of Bill.totalAmount where Bill.projectId ==
//                grant.projectId AND Bill.status is Paid or Partial —
//                bills posted against the grant's project.
//   utilisation% = utilised / received (0 if received=0)
//   burn:        (utilised / days_elapsed) * 30  — LKR/month
//   endsIn:      days remaining until grantEndDate (nullable)
//
// The client card sorts by utilisation% descending so grants nearing
// full spend bubble up. Grants without projectId can't have a
// utilisation number computed and are marked with utilised=null.
// ============================================

const toFloat = (v) => (v == null ? 0 : parseFloat(v) || 0);
const daysBetween = (a, b) => {
  if (!a || !b) return null;
  const d = Math.round((new Date(b) - new Date(a)) / (24 * 3600 * 1000));
  return Number.isFinite(d) ? d : null;
};

export const grantUtilization = asyncHandler(async (req, res) => {
  const status = req.query.status; // optional filter

  const where = {};
  if (status) where.status = status;

  const grants = await GrantReceivable.findAll({
    where,
    include: [
      { model: Partner,  as: 'donor',   attributes: ['id', 'name', 'partnerCode'] },
      { model: Project,  as: 'project', attributes: ['id', 'name', 'projectCode'] },
    ],
    order: [['grantEndDate', 'ASC'], ['id', 'DESC']],
  });

  const grantIds = grants.map((g) => g.id);
  const projectIds = [...new Set(grants.map((g) => g.projectId).filter(Boolean))];

  // Receipts totals per grant.
  const receiptRows = grantIds.length > 0
    ? await GrantReceipt.findAll({
        where: { grantId: grantIds },
        attributes: [
          'grantId',
          [sequelize.fn('SUM', sequelize.col('amount_lkr')), 'sumLkr'],
          [sequelize.fn('SUM', sequelize.col('amount')),     'sumOrig'],
          [sequelize.fn('COUNT', sequelize.col('id')),       'count'],
        ],
        group: ['grantId'],
        raw: true,
      })
    : [];
  const receiptsMap = new Map();
  for (const r of receiptRows) {
    receiptsMap.set(r.grantId, {
      count: parseInt(r.count, 10),
      sumLkr: toFloat(r.sumLkr) || toFloat(r.sumOrig), // fallback if amountLkr not populated
    });
  }

  // Utilised = bills posted to the grant's project, that are Paid or
  // Partial. Grouped by projectId so we can look up per grant.
  const billRows = projectIds.length > 0
    ? await Bill.findAll({
        where: {
          projectId: projectIds,
          status: { [Op.in]: ['Paid', 'Partial', 'Partially Paid'] },
        },
        attributes: [
          'projectId',
          [sequelize.fn('SUM', sequelize.col('paid_amount')),    'paidAmount'],
          [sequelize.fn('SUM', sequelize.col('total_amount')),   'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')),           'count'],
        ],
        group: ['projectId'],
        raw: true,
      })
    : [];
  const billsMap = new Map();
  for (const b of billRows) {
    const paid = toFloat(b.paidAmount);
    // Prefer paid_amount; fall back to total_amount when paid_amount is null.
    billsMap.set(b.projectId, {
      count: parseInt(b.count, 10),
      utilised: paid > 0 ? paid : toFloat(b.totalAmount),
    });
  }

  const now = new Date();
  const rows = grants.map((g) => {
    const receipt = receiptsMap.get(g.id) || { count: 0, sumLkr: 0 };
    const received = receipt.sumLkr;
    const bill = g.projectId ? billsMap.get(g.projectId) : null;
    const utilised = bill ? bill.utilised : null;

    const utilisationPct = received > 0 && utilised != null
      ? Math.round((utilised / received) * 1000) / 10
      : null;

    const totalAmount = toFloat(g.totalAmount);
    const balance = Math.max(totalAmount - received, 0);

    const grantStart = g.grantStartDate;
    const grantEnd   = g.grantEndDate;
    const totalDays = daysBetween(grantStart, grantEnd);
    const daysElapsed = grantStart ? daysBetween(grantStart, now) : null;
    const endsIn = grantEnd ? daysBetween(now, grantEnd) : null;
    const monthlyBurn = utilised != null && daysElapsed && daysElapsed > 0
      ? Math.round((utilised / daysElapsed) * 30)
      : null;

    return {
      id: g.id,
      grantCode: g.grantCode,
      grantName: g.grantName,
      currency: g.currency,
      totalAmount,
      received: Math.round(received),
      balance: Math.round(balance),
      utilised: utilised == null ? null : Math.round(utilised),
      utilisationPct,
      monthlyBurn,
      status: g.status,
      grantStartDate: grantStart,
      grantEndDate: grantEnd,
      endsInDays: endsIn,
      totalDays,
      daysElapsed,
      donor:   g.donor   ? { id: g.donor.id, name: g.donor.name, code: g.donor.partnerCode } : null,
      project: g.project ? { id: g.project.id, name: g.project.name, code: g.project.projectCode } : null,
      receipts: receipt.count,
      billsCount: bill ? bill.count : 0,
    };
  });

  // Rollup line for the header.
  const summary = rows.reduce((acc, r) => {
    acc.grants     += 1;
    acc.received   += r.received;
    acc.utilised   += r.utilised || 0;
    acc.balance    += r.balance;
    if (r.endsInDays != null && r.endsInDays >= 0 && r.endsInDays <= 30) acc.endingSoon += 1;
    return acc;
  }, { grants: 0, received: 0, utilised: 0, balance: 0, endingSoon: 0 });

  res.json({ success: true, data: { grants: rows, summary } });
});
