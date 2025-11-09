// ============================================
// CURRENCY UTILITIES
// ============================================
// Multi-currency support with LKR conversion

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'LKR', symbol: 'LKR', name: 'Sri Lankan Rupee' }
];

/**
 * Get currency symbol by code
 * @param {string} currencyCode - Currency code (USD, GBP, etc.)
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = (currencyCode) => {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : currencyCode;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @returns {string} Formatted amount
 */
export const formatCurrency = (amount, currencyCode = 'LKR') => {
  const symbol = getCurrencySymbol(currencyCode);

  if (currencyCode === 'LKR') {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  return `${symbol} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Calculate LKR amount from foreign currency
 * @param {number} originalAmount - Amount in original currency
 * @param {number} exchangeRate - Exchange rate to LKR
 * @returns {number} Amount in LKR
 */
export const convertToLKR = (originalAmount, exchangeRate) => {
  return Math.round(originalAmount * exchangeRate);
};

/**
 * Format invoice amount display showing both currencies
 * @param {object} invoice - Invoice object with currency fields
 * @returns {object} Display strings for original and LKR amounts
 */
export const formatInvoiceAmount = (invoice) => {
  const { currency, originalAmount, exchangeRate, amountLKR } = invoice;

  return {
    original: formatCurrency(originalAmount, currency),
    lkr: formatCurrency(amountLKR, 'LKR'),
    rate: `Rate: ${exchangeRate.toLocaleString('en-US', { minimumFractionDigits: 2 })} LKR/${currency}`,
    display: currency === 'LKR'
      ? formatCurrency(amountLKR, 'LKR')
      : `${formatCurrency(originalAmount, currency)} (${formatCurrency(amountLKR, 'LKR')})`
  };
};

/**
 * Validate exchange rate
 * @param {number} rate - Exchange rate
 * @returns {boolean} Is valid
 */
export const isValidExchangeRate = (rate) => {
  return rate > 0 && rate < 10000 && !isNaN(rate);
};

/**
 * Get typical exchange rate range for a currency (for validation)
 * @param {string} currencyCode - Currency code
 * @returns {object} Min and max expected rates
 */
export const getExchangeRateRange = (currencyCode) => {
  const ranges = {
    USD: { min: 250, max: 400 },
    GBP: { min: 350, max: 500 },
    EUR: { min: 300, max: 450 },
    AUD: { min: 180, max: 300 },
    SGD: { min: 200, max: 300 },
    MYR: { min: 60, max: 100 },
    LKR: { min: 1, max: 1 }
  };

  return ranges[currencyCode] || { min: 0, max: 10000 };
};
