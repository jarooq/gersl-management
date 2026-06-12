// =============================================================================
// Exchange rate service — Sampath Bank O/D Buying rates.
//
// Sampath Bank publishes daily rates at https://www.sampath.lk/api/exchange-rates
// (the same endpoint their public rates page consumes). The payload looks like:
//
//   { "success": true,
//     "description": "O/D BUYING - Encashment of drafts TCS and other instruments...",
//     "data": [ { "CurrCode": "USD", "CurrName": "U.S. Dollar",
//                 "ODBUY": "325.6407", "TTBUY": "327.75", "TTSEL": "334.25",
//                 "RateWEF": "Monday, May 18 2026, 08:28:20 AM", ... }, ... ] }
//
// The API only ever returns the *current* day's rates, so every fetch upserts
// one row per currency per day into `exchange_rates`, building the historical
// record needed for auditable invoice/receipt conversions.
//
// Nothing here throws into the request path: a failed fetch falls back to the
// last cached rate, and the caller is told the rate is stale so finance staff
// can enter it manually.
// =============================================================================

import { Op } from 'sequelize';
import { ExchangeRate } from '../models/index.js';

const SAMPATH_API_URL = 'https://www.sampath.lk/api/exchange-rates';
const FETCH_TIMEOUT_MS = 15000;

// Today's date (YYYY-MM-DD) in Sri Lanka time, regardless of server timezone.
export function colomboToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Colombo',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
  return parts; // en-CA formats as YYYY-MM-DD
}

function toNum(v) {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

// Sampath's `RateWEF` looks like "Monday, May 18 2026, 08:28:20 AM". Extract the
// calendar date so a rate fetched on a weekend/holiday is stored under the
// trading day it actually applies to (e.g. Friday) rather than the fetch day —
// otherwise getRate() would report a stale rate as fresh.
function parseRateWefDate(wef) {
  if (!wef) return null;
  const m = String(wef).match(/([A-Za-z]{3,9})\s+(\d{1,2})\s+(\d{4})/);
  if (!m) return null;
  const d = new Date(`${m[1]} ${m[2]} ${m[3]} 00:00:00 GMT`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

/**
 * Fetch the current Sampath Bank rate sheet and upsert it into exchange_rates
 * for today's date. Returns { ok, count, rateDate, error? }.
 */
export async function fetchSampathRates() {
  const rateDate = colomboToday();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let json;
    try {
      const resp = await fetch(SAMPATH_API_URL, {
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      json = await resp.json();
    } finally {
      clearTimeout(timer);
    }

    const rows = Array.isArray(json?.data) ? json.data : [];
    if (rows.length === 0) throw new Error('Sampath API returned no rate rows');

    // Store each rate under the bank's effective trading date, not the day we
    // fetched it (they differ on weekends/holidays).
    const effectiveDate = parseRateWefDate(rows[0]?.RateWEF) || rateDate;

    let count = 0;
    for (const r of rows) {
      const currency = String(r.CurrCode || '').trim().toUpperCase();
      const odBuying = toNum(r.ODBUY);
      if (!currency || odBuying == null) continue;
      await ExchangeRate.upsert({
        currency,
        currencyName: r.CurrName || null,
        rateDate: parseRateWefDate(r.RateWEF) || effectiveDate,
        odBuyingRate: odBuying,
        ttBuyingRate: toNum(r.TTBUY),
        ttSellingRate: toNum(r.TTSEL),
        source: 'sampath-auto',
        rateWef: r.RateWEF || null,
      });
      count += 1;
    }
    console.log(`💱 Sampath rates fetched: ${count} currencies, effective ${effectiveDate}`);
    return { ok: true, count, rateDate: effectiveDate, fetchedOn: rateDate };
  } catch (err) {
    console.error('💱 Sampath rate fetch failed:', err.message);
    return { ok: false, count: 0, rateDate, error: err.message };
  }
}

/**
 * Resolve the O/D Buying rate for a currency on a given date.
 * Falls back to the most recent earlier snapshot (covers weekends/holidays).
 * If `date` is today and nothing is cached, triggers a live fetch first.
 *
 * Returns:
 *   { currency, rate, rateDate, source, stale, requestedDate }
 *   - rate     : LKR per 1 unit of `currency` (1 for LKR)
 *   - stale    : true when the rate's date is older than requested
 *   - source   : 'sampath-auto' | 'manual' | 'identity' | 'none'
 */
export async function getRate(currency, date) {
  const cur = String(currency || 'LKR').trim().toUpperCase();
  const requestedDate = date || colomboToday();

  if (cur === 'LKR') {
    return { currency: 'LKR', rate: 1, rateDate: requestedDate, source: 'identity', stale: false, requestedDate };
  }

  const find = () => ExchangeRate.findOne({
    where: { currency: cur, rateDate: { [Op.lte]: requestedDate } },
    order: [['rateDate', 'DESC']],
  });

  let row = await find();

  // No cached rate at all (or none for a today/future request) → try live fetch.
  if (!row && requestedDate >= colomboToday()) {
    await fetchSampathRates();
    row = await find();
  }

  if (!row) {
    return { currency: cur, rate: null, rateDate: null, source: 'none', stale: true, requestedDate };
  }

  return {
    currency: cur,
    rate: parseFloat(row.odBuyingRate),
    rateDate: row.rateDate,
    source: row.source,
    stale: String(row.rateDate) !== String(requestedDate),
    requestedDate,
  };
}

/**
 * Latest cached snapshot for every currency (one row each, newest rate_date).
 */
export async function getLatestRates() {
  const all = await ExchangeRate.findAll({ order: [['rateDate', 'DESC'], ['currency', 'ASC']] });
  const seen = new Map();
  for (const r of all) {
    if (!seen.has(r.currency)) seen.set(r.currency, r);
  }
  return Array.from(seen.values());
}

/**
 * Convert a foreign amount to LKR. Returns null when rate is unknown.
 */
export function convertToLkr(amount, rate) {
  const a = toNum(amount);
  const r = toNum(rate);
  if (a == null || r == null) return null;
  return Math.round(a * r * 100) / 100;
}

export { SAMPATH_API_URL };
