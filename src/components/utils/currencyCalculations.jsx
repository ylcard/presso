/**
 * Currency conversion utilities using USD as the reference currency.
 * Implements the triangulation method with multiplication-only approach.
 */

/**
 * Calculate converted amount from source currency to target currency.
 * Uses USD as the reference currency for triangulation.
 * 
 * Formula: Converted Amount = Amount × Rate(Source→USD) × Rate(USD→Target)
 * 
 * @param {number} sourceAmount - The amount in source currency
 * @param {string} sourceCurrencyCode - The source currency code (e.g., 'GBP')
 * @param {string} targetCurrencyCode - The target currency code (e.g., 'EUR')
 * @param {Object} rates - Object containing exchange rates
 * @param {number} rates.sourceToUSD - Rate for Source→USD (e.g., 1 GBP = 1.25 USD)
 * @param {number} rates.targetToUSD - Rate for Target→USD (e.g., 1 EUR = 1.08 USD)
 * @returns {Object} { convertedAmount: number, exchangeRateUsed: number }
 */
export function calculateConvertedAmount(sourceAmount, sourceCurrencyCode, targetCurrencyCode, rates) {
  // Handle same currency case
  if (sourceCurrencyCode === targetCurrencyCode) {
    return {
      convertedAmount: sourceAmount,
      exchangeRateUsed: 1.0
    };
  }

  const { sourceToUSD, targetToUSD } = rates;

  // Pre-calculate USD→Target rate (inverse)
  const usdToTarget = 1 / targetToUSD;

  // Convert Source→USD
  const amountInUSD = sourceAmount * sourceToUSD;

  // Convert USD→Target (multiplication only)
  const convertedAmount = amountInUSD * usdToTarget;

  // Calculate the direct exchange rate used (Source→Target)
  const exchangeRateUsed = sourceToUSD * usdToTarget;

  return {
    convertedAmount: parseFloat(convertedAmount.toFixed(2)),
    exchangeRateUsed: parseFloat(exchangeRateUsed.toFixed(6))
  };
}

/**
 * Retrieve exchange rates for a specific currency pair and date from the database.
 * 
 * @param {Array} exchangeRates - Array of ExchangeRate entities
 * @param {string} currencyCode - The currency code to look up (e.g., 'GBP')
 * @param {string} date - The date in YYYY-MM-DD format
 * @returns {number|null} The rate for Currency→USD, or null if not found
 */
export function getRateForDate(exchangeRates, currencyCode, date) {
  // Handle USD case (USD→USD = 1.0)
  if (currencyCode === 'USD') {
    return 1.0;
  }

  const rateRecord = exchangeRates.find(
    r => r.fromCurrency === currencyCode && 
         r.toCurrency === 'USD' && 
         r.date === date
  );

  return rateRecord ? rateRecord.rate : null;
}

/**
 * Check if exchange rates for a given date and currencies are fresh enough.
 * 
 * @param {Array} exchangeRates - Array of ExchangeRate entities
 * @param {string} sourceCurrency - Source currency code
 * @param {string} targetCurrency - Target currency code (user's base)
 * @param {string} date - Transaction date in YYYY-MM-DD format
 * @param {number} freshnessWindowDays - Number of days to consider rates "fresh" (default: 14)
 * @returns {boolean} True if rates are fresh, false if stale or missing
 */
export function areRatesFresh(exchangeRates, sourceCurrency, targetCurrency, date, freshnessWindowDays = 14) {
  const now = new Date();
  const freshnessThreshold = new Date(now.getTime() - (freshnessWindowDays * 24 * 60 * 60 * 1000));

  // Check if both required rates exist for the specific date
  const sourceRate = exchangeRates.find(
    r => r.fromCurrency === sourceCurrency && r.toCurrency === 'USD' && r.date === date
  );
  const targetRate = exchangeRates.find(
    r => r.fromCurrency === targetCurrency && r.toCurrency === 'USD' && r.date === date
  );

  // If either rate is missing, they are not fresh
  if (!sourceRate || !targetRate) {
    return false;
  }

  // Check if both rates were created/updated within the freshness window
  const sourceCreatedDate = new Date(sourceRate.created_date);
  const targetCreatedDate = new Date(targetRate.created_date);

  return sourceCreatedDate >= freshnessThreshold && targetCreatedDate >= freshnessThreshold;
}

/**
 * List of commonly supported currencies
 */
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
];