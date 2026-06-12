import { Op } from 'sequelize';
import { ExchangeRate } from '../models/index.js';
import { asyncHandler, ValidationError } from '../middleware/error.middleware.js';
import {
  fetchSampathRates,
  getRate,
  getLatestRates,
  colomboToday,
} from '../services/exchangeRate.service.js';

// ============================================
// GET /api/exchange-rates
// Latest cached snapshot for every currency.
// ============================================
export const getRates = asyncHandler(async (req, res) => {
  const rates = await getLatestRates();
  res.json({ success: true, data: { rates, asOf: colomboToday() } });
});

// ============================================
// GET /api/exchange-rates/rate?currency=USD&date=YYYY-MM-DD
// Resolve the O/D Buying rate for one currency on one date. Used by the
// invoice / receipt forms to pre-fill the rate.
// ============================================
export const resolveRate = asyncHandler(async (req, res) => {
  const { currency, date } = req.query;
  if (!currency) throw new ValidationError('currency is required');
  const result = await getRate(currency, date);
  res.json({ success: true, data: result });
});

// ============================================
// GET /api/exchange-rates/history?currency=USD&from=...&to=...
// ============================================
export const getHistory = asyncHandler(async (req, res) => {
  const { currency, from, to } = req.query;
  const where = {};
  if (currency) where.currency = String(currency).toUpperCase();
  if (from || to) {
    where.rateDate = {};
    if (from) where.rateDate[Op.gte] = from;
    if (to) where.rateDate[Op.lte] = to;
  }
  const rates = await ExchangeRate.findAll({
    where,
    order: [['rateDate', 'DESC'], ['currency', 'ASC']],
    limit: 500,
  });
  res.json({ success: true, data: { rates } });
});

// ============================================
// POST /api/exchange-rates/refresh
// Manually trigger a Sampath Bank fetch.
// ============================================
export const refreshRates = asyncHandler(async (req, res) => {
  const result = await fetchSampathRates();
  if (!result.ok) {
    return res.status(502).json({
      success: false,
      message: `Could not fetch Sampath Bank rates: ${result.error}. Enter the rate manually.`,
      data: result,
    });
  }
  res.json({ success: true, message: `Fetched ${result.count} rates for ${result.rateDate}`, data: result });
});

// ============================================
// POST /api/exchange-rates
// Manual rate entry / override. Body: { currency, rateDate, odBuyingRate }
// ============================================
export const upsertManualRate = asyncHandler(async (req, res) => {
  const { currency, rateDate, odBuyingRate, ttBuyingRate, ttSellingRate, currencyName } = req.body;
  if (!currency || !odBuyingRate) {
    throw new ValidationError('currency and odBuyingRate are required');
  }
  const rate = parseFloat(odBuyingRate);
  if (!(rate > 0)) throw new ValidationError('odBuyingRate must be a positive number');
  // No currency trades anywhere near this against the LKR — reject obvious typos.
  if (rate > 10000) throw new ValidationError('odBuyingRate looks too large — re-check the value');

  const [row] = await ExchangeRate.upsert({
    currency: String(currency).toUpperCase(),
    currencyName: currencyName || null,
    rateDate: rateDate || colomboToday(),
    odBuyingRate: rate,
    ttBuyingRate: ttBuyingRate != null ? parseFloat(ttBuyingRate) : null,
    ttSellingRate: ttSellingRate != null ? parseFloat(ttSellingRate) : null,
    source: 'manual',
    rateWef: 'Manual entry',
    createdBy: req.user?.id || null,
  });

  res.status(201).json({ success: true, message: 'Exchange rate saved', data: { rate: row } });
});
