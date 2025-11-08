import { base44 } from "@/api/base44Client";
import { REFERENCE_CURRENCY } from "./currencyData";
import { parseDate, formatDateString } from "./budgetCalculations";

// Freshness threshold in days
const RATE_FRESHNESS_DAYS = 14;

/**
 * Check if exchange rates for a specific date and currency pair are fresh enough
 * @param {string} transactionDate - The date of the transaction (YYYY-MM-DD)
 * @param {string} baseCurrency - User's base currency code
 * @param {string} foreignCurrency - Foreign currency code
 * @returns {Promise<boolean>} - True if rates are fresh, false otherwise
 */
export const areRatesFresh = async (transactionDate, baseCurrency, foreignCurrency) => {
  try {
    const allRates = await base44.entities.ExchangeRate.list();
    
    // Filter rates for the specific transaction date
    const ratesForDate = allRates.filter(r => r.date === transactionDate);
    
    // Check if we have all required rates
    const hasBaseRate = baseCurrency === REFERENCE_CURRENCY || 
                        ratesForDate.some(r => r.targetCurrency === baseCurrency && r.referenceCurrency === REFERENCE_CURRENCY);
    const hasForeignRate = foreignCurrency === REFERENCE_CURRENCY || 
                           ratesForDate.some(r => r.targetCurrency === foreignCurrency && r.referenceCurrency === REFERENCE_CURRENCY);
    
    if (!hasBaseRate || !hasForeignRate) {
      return false; // Missing rates
    }
    
    // Check freshness based on created_date
    const now = new Date();
    const relevantRates = ratesForDate.filter(r => 
      (r.targetCurrency === baseCurrency || r.targetCurrency === foreignCurrency) &&
      r.referenceCurrency === REFERENCE_CURRENCY
    );
    
    for (const rate of relevantRates) {
      const createdDate = new Date(rate.created_date);
      const daysSinceCreation = (now - createdDate) / (1000 * 60 * 60 * 24);
      
      if (daysSinceCreation > RATE_FRESHNESS_DAYS) {
        return false; // Rate is stale
      }
    }
    
    return true; // All rates are fresh
  } catch (error) {
    console.error('Error checking rate freshness:', error);
    return false;
  }
};

/**
 * Fetch exchange rates from LLM for a specific date
 * @param {string} transactionDate - The date for the rates (YYYY-MM-DD)
 * @param {string} baseCurrency - User's base currency code
 * @param {string} foreignCurrency - Foreign currency code
 * @returns {Promise<Object>} - Object with rates
 */
export const fetchExchangeRatesFromLLM = async (transactionDate, baseCurrency, foreignCurrency) => {
  try {
    const currencies = new Set([baseCurrency, foreignCurrency]);
    
    // Build the prompt to ask for specific rates
    const currencyList = Array.from(currencies)
      .filter(c => c !== REFERENCE_CURRENCY)
      .join(', ');
    
    const prompt = `What were the exchange rates from ${REFERENCE_CURRENCY} to ${currencyList} on ${transactionDate}? 
    
    Please respond with a JSON object containing the rates where 1 ${REFERENCE_CURRENCY} equals X of the target currency.
    
    Example format:
    {
      "USD_to_EUR": 0.92,
      "USD_to_GBP": 0.79
    }
    
    Only provide the numerical exchange rates in this exact JSON format. Use the format "USD_to_XXX" where XXX is the target currency code.`;
    
    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        additionalProperties: {
          type: "number"
        }
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching exchange rates from LLM:', error);
    throw new Error('Failed to fetch exchange rates. Please try again.');
  }
};

/**
 * Store exchange rates in the database
 * @param {string} transactionDate - The date for the rates (YYYY-MM-DD)
 * @param {Object} rates - Object with rate data from LLM
 * @param {string} userEmail - User's email for RLS
 */
export const storeExchangeRates = async (transactionDate, rates, userEmail) => {
  try {
    const ratesToStore = [];
    
    for (const [key, value] of Object.entries(rates)) {
      // Parse the key format "USD_to_XXX"
      const parts = key.split('_to_');
      if (parts.length === 2) {
        const referenceCurrency = parts[0];
        const targetCurrency = parts[1];
        
        ratesToStore.push({
          date: transactionDate,
          referenceCurrency: referenceCurrency,
          targetCurrency: targetCurrency,
          rate: value,
          created_by: userEmail
        });
      }
    }
    
    // Store all rates
    for (const rateData of ratesToStore) {
      // Check if rate already exists for this date and currency pair
      const existingRates = await base44.entities.ExchangeRate.list();
      const existing = existingRates.find(r => 
        r.date === rateData.date && 
        r.targetCurrency === rateData.targetCurrency &&
        r.referenceCurrency === rateData.referenceCurrency
      );
      
      if (existing) {
        // Update existing rate
        await base44.entities.ExchangeRate.update(existing.id, rateData);
      } else {
        // Create new rate
        await base44.entities.ExchangeRate.create(rateData);
      }
    }
  } catch (error) {
    console.error('Error storing exchange rates:', error);
    throw error;
  }
};

/**
 * Get exchange rate for converting from one currency to another
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {string} transactionDate - Date for the rate (YYYY-MM-DD)
 * @returns {Promise<number>} - Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency, transactionDate) => {
  try {
    // If same currency, rate is 1
    if (fromCurrency === toCurrency) {
      return 1;
    }
    
    const allRates = await base44.entities.ExchangeRate.list();
    const ratesForDate = allRates.filter(r => r.date === transactionDate);
    
    // Get rates against reference currency
    const fromRate = fromCurrency === REFERENCE_CURRENCY ? 1 : 
                     ratesForDate.find(r => r.targetCurrency === fromCurrency && r.referenceCurrency === REFERENCE_CURRENCY)?.rate;
    const toRate = toCurrency === REFERENCE_CURRENCY ? 1 : 
                   ratesForDate.find(r => r.targetCurrency === toCurrency && r.referenceCurrency === REFERENCE_CURRENCY)?.rate;
    
    if (!fromRate || !toRate) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency} on ${transactionDate}`);
    }
    
    // Calculate cross rate: amount_in_from * (1/fromRate) * toRate = amount_in_to
    // Simplified: (toRate / fromRate)
    return toRate / fromRate;
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    throw error;
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @param {string} transactionDate - Date for the conversion (YYYY-MM-DD)
 * @returns {Promise<Object>} - { convertedAmount, exchangeRate }
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency, transactionDate) => {
  try {
    const exchangeRate = await getExchangeRate(fromCurrency, toCurrency, transactionDate);
    const convertedAmount = amount * exchangeRate;
    
    return {
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      exchangeRate: parseFloat(exchangeRate.toFixed(6))
    };
  } catch (error) {
    console.error('Error converting currency:', error);
    throw error;
  }
};