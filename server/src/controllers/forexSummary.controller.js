import { Op, fn, col } from 'sequelize';
import { Invoice, InvoiceReceipt, sequelize } from '../models/index.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { getLatestRates } from '../services/exchangeRate.service.js';

// ============================================
// GET /api/finance/forex-summary?year=<yyyy>
// Aggregated forex position for the finance dashboard's "Forex Insights"
// card. Answers three questions a finance manager asks each month:
//
//   1. How much have we realised in forex gains/losses YTD?
//      -> sum of InvoiceReceipt.exchangeGainLoss for the period.
//
//   2. Where's our current unrealised exposure?
//      -> for each currency, open invoices' outstanding
//         (original - already received) valued at their booking rate
//         vs the current Sampath rate. Delta = unrealized.
//
//   3. What's the trend?
//      -> monthly realised net gain/loss for the last 12 months.
//
// All numbers are in LKR. Rate deltas assume today's rate holds; we
// don't extrapolate.
// ============================================

const toFloat = (v) => (v == null ? 0 : parseFloat(v) || 0);

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

export const forexSummary = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const from = `${year}-01-01`;
  const to   = `${year}-12-31`;

  // 1) Realized gain/loss YTD from receipts.
  const receipts = await InvoiceReceipt.findAll({
    where: { receiptDate: { [Op.between]: [from, to] } },
    attributes: ['receiptDate', 'exchangeGainLoss', 'currency'],
    raw: true,
  });

  let realizedGain = 0;
  let realizedLoss = 0;
  const monthlyMap = new Map(); // 'YYYY-MM' -> { gain, loss, net }
  for (const r of receipts) {
    const gl = toFloat(r.exchangeGainLoss);
    if (gl >= 0) realizedGain += gl;
    else realizedLoss += gl; // negative
    const key = monthKey(r.receiptDate);
    const cell = monthlyMap.get(key) || { gain: 0, loss: 0, net: 0 };
    if (gl >= 0) cell.gain += gl; else cell.loss += gl;
    cell.net += gl;
    monthlyMap.set(key, cell);
  }
  const realized = {
    gain: Math.round(realizedGain * 100) / 100,
    loss: Math.round(realizedLoss * 100) / 100,     // negative
    net:  Math.round((realizedGain + realizedLoss) * 100) / 100,
  };

  // Fill the last 12 months from the current date, so the frontend gets
  // a continuous series even if some months had zero receipts.
  const monthly = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthKey(dt);
    const cell = monthlyMap.get(key) || { gain: 0, loss: 0, net: 0 };
    monthly.push({
      month: key,
      gain: Math.round(cell.gain * 100) / 100,
      loss: Math.round(cell.loss * 100) / 100,
      net:  Math.round(cell.net * 100) / 100,
    });
  }

  // 2) Unrealized exposure — per-currency, open (non-Paid) invoices.
  const currentRates = await getLatestRates();
  const rateFor = (currency) => {
    if (!currency || currency.toUpperCase() === 'LKR') return 1;
    const row = currentRates.find((r) => r.currency === currency.toUpperCase());
    return row ? toFloat(row.rate) : null;
  };

  const openInvoices = await Invoice.findAll({
    where: {
      currency: { [Op.ne]: 'LKR' },
      status: { [Op.notIn]: ['Paid', 'Cancelled', 'Void'] },
    },
    attributes: [
      'id', 'currency', 'originalAmount', 'exchangeRate', 'amountLkr', 'totalAmount',
    ],
    include: [{
      model: InvoiceReceipt,
      as: 'receipts',
      attributes: ['originalAmount'],
      required: false,
    }],
  });

  const byCurrencyMap = new Map(); // ccy -> aggregation
  for (const inv of openInvoices) {
    const ccy = (inv.currency || 'LKR').toUpperCase();
    if (ccy === 'LKR') continue;
    const receivedForeign = (inv.receipts || [])
      .reduce((sum, r) => sum + toFloat(r.originalAmount), 0);
    const outstandingForeign = Math.max(toFloat(inv.originalAmount) - receivedForeign, 0);
    if (outstandingForeign <= 0) continue;

    const bookingRate = toFloat(inv.exchangeRate) || 0;
    const outstandingLkrBooked = outstandingForeign * bookingRate;

    const cell = byCurrencyMap.get(ccy) || {
      currency: ccy,
      openInvoicesCount: 0,
      outstandingForeign: 0,
      outstandingLkrBooked: 0,
      weightedBookingRateNum: 0, // for weighted-avg calc
    };
    cell.openInvoicesCount += 1;
    cell.outstandingForeign += outstandingForeign;
    cell.outstandingLkrBooked += outstandingLkrBooked;
    cell.weightedBookingRateNum += outstandingLkrBooked; // rate * amt sums to lkrBooked
    byCurrencyMap.set(ccy, cell);
  }

  const byCurrency = [...byCurrencyMap.values()].map((c) => {
    const avgBookingRate = c.outstandingForeign > 0
      ? c.outstandingLkrBooked / c.outstandingForeign
      : 0;
    const currentRate = rateFor(c.currency);
    let outstandingLkrCurrent = null;
    let unrealizedGainLoss = null;
    if (currentRate != null) {
      outstandingLkrCurrent = c.outstandingForeign * currentRate;
      unrealizedGainLoss = outstandingLkrCurrent - c.outstandingLkrBooked;
    }
    return {
      currency: c.currency,
      openInvoicesCount: c.openInvoicesCount,
      outstandingForeign: Math.round(c.outstandingForeign * 100) / 100,
      outstandingLkrBooked: Math.round(c.outstandingLkrBooked * 100) / 100,
      avgBookingRate: Math.round(avgBookingRate * 10000) / 10000,
      currentRate: currentRate == null ? null : Math.round(currentRate * 10000) / 10000,
      outstandingLkrCurrent: outstandingLkrCurrent == null ? null : Math.round(outstandingLkrCurrent * 100) / 100,
      unrealizedGainLoss: unrealizedGainLoss == null ? null : Math.round(unrealizedGainLoss * 100) / 100,
    };
  }).sort((a, b) => b.outstandingLkrBooked - a.outstandingLkrBooked);

  const unrealized = byCurrency.reduce((sum, c) => sum + (c.unrealizedGainLoss || 0), 0);

  res.json({
    success: true,
    data: {
      year,
      realized,
      unrealized: {
        net: Math.round(unrealized * 100) / 100,
      },
      byCurrency,
      monthly,
    },
  });
});
