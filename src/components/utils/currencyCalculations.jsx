/**
 * Currency conversion utilities using USD as the reference currency.
 * Implements the triangulation method with multiplication-only approach.
 */

import { differenceInDays, parseISO, startOfDay } from "date-fns";

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
 * Now implements a 14-day freshness window - will use rates up to 14 days old.
 * 
 * @param {Array} exchangeRates - Array of ExchangeRate entities
 * @param {string} currencyCode - The currency code to look up (e.g., 'GBP')
 * @param {string} date - The target date in YYYY-MM-DD format
 * @returns {number|null} The rate for Currency→USD, or null if not found
 */
export function getRateForDate(exchangeRates, currencyCode, date) {
    // Handle USD case (USD→USD = 1.0)
    if (currencyCode === 'USD') {
        return 1.0;
    }

    const freshRates = getRateDetailsForDate(exchangeRates, currencyCode, date);
    return freshRates ? freshRates.rate : null;
}

/**
 * Retrieve the full exchange rate object for a specific currency pair and date.
 * 
 * @param {Array} exchangeRates - Array of ExchangeRate entities
 * @param {string} currencyCode - The currency code to look up
 * @param {string} date - The target date in YYYY-MM-DD format
 * @returns {Object|null} The ExchangeRate entity or null
 */
export function getRateDetailsForDate(exchangeRates, currencyCode, date) {
    // Handle USD case
    if (currencyCode === 'USD') return null;

    // Find all rates within the freshness window (0 to 14 days)
    const targetDateObj = startOfDay(parseISO(date));
    const windowDays = 14;

    // Find all rates for this currency pair
    const relevantRates = exchangeRates.filter(r =>
        r.fromCurrency === currencyCode && r.toCurrency === 'USD'
    );

    if (relevantRates.length === 0) return null;

    // Sort by date difference to find the closest one
    relevantRates.sort((a, b) => {
        const dateA = startOfDay(parseISO(a.date));
        const dateB = startOfDay(parseISO(b.date));
        const diffA = Math.abs(differenceInDays(targetDateObj, dateA));
        const diffB = Math.abs(differenceInDays(targetDateObj, dateB));
        return diffA - diffB;
    });

    return relevantRates[0];
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
export function areRatesFresh(exchangeRates, sourceCurrency, targetCurrency, date) {
    // Logic simplified: Determine which currencies need lookup
    const neededCurrencies = [];
    if (sourceCurrency !== 'USD') neededCurrencies.push(sourceCurrency);
    if (targetCurrency !== 'USD') neededCurrencies.push(targetCurrency);

    if (neededCurrencies.length === 0) return true; // Both are USD

    // Check if EVERY needed currency has a rate within the window
    return neededCurrencies.every(currency => {
        const rate = getRateForDate(exchangeRates, currency, date);
        return rate !== null;
    });
}
