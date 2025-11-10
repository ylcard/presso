import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { QUERY_KEYS } from "./queryKeys";
import { areRatesFresh } from "../utils/currencyCalculations";

/**
 * Hook for managing exchange rates - fetching, refreshing, and checking freshness.
 */
export const useExchangeRates = () => {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all exchange rates for the current user
  const { data: exchangeRates = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.EXCHANGE_RATES],
    queryFn: () => base44.entities.ExchangeRate.list('-date'),
    initialData: [],
  });

  /**
   * Refresh exchange rates for specific currencies and date.
   * Only calls the LLM if rates are stale or missing.
   * Implements deduplication - updates existing rates instead of creating duplicates.
   * 
   * @param {string} sourceCurrency - Source currency code (e.g., 'GBP')
   * @param {string} targetCurrency - Target currency code (user's base, e.g., 'EUR')
   * @param {string} date - Transaction date in YYYY-MM-DD format
   * @returns {Promise<Object>} { success: boolean, message: string, rates?: Object }
   */
  const refreshRates = async (sourceCurrency, targetCurrency, date) => {
    setIsRefreshing(true);

    try {
      // Check if rates are already fresh (within 14 days)
      const isFresh = areRatesFresh(exchangeRates, sourceCurrency, targetCurrency, date, 14);
      
      if (isFresh) {
        setIsRefreshing(false);
        return {
          success: true,
          message: 'Exchange rates are already up to date!',
          alreadyFresh: true
        };
      }

      // Build the list of currencies we need rates for (excluding USD)
      const currenciesToFetch = new Set();
      if (sourceCurrency !== 'USD') currenciesToFetch.add(sourceCurrency);
      if (targetCurrency !== 'USD') currenciesToFetch.add(targetCurrency);

      if (currenciesToFetch.size === 0) {
        // Both are USD, no need to fetch
        setIsRefreshing(false);
        return {
          success: true,
          message: 'No exchange rates needed (both currencies are USD)',
          alreadyFresh: true
        };
      }

      // Fetch rates using Core.InvokeLLM
      const prompt = `Please provide the current exchange rates for the following currencies against USD for the date ${date}. 
For each currency, I need the rate in the format: 1 [CURRENCY] = X USD.

Currencies needed: ${Array.from(currenciesToFetch).join(', ')}

Return the data in JSON format with the structure:
{
  "rates": {
    "CURRENCY_CODE": rate_value,
    ...
  }
}

For example, if 1 GBP = 1.25 USD, the entry should be "GBP": 1.25

Only include the rates for the currencies I listed above.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            rates: {
              type: "object",
              additionalProperties: { type: "number" }
            }
          },
          required: ["rates"]
        }
      });

      // Fetch all existing rates to check for duplicates
      const allExistingRates = await base44.entities.ExchangeRate.list();

      // Store or update the fetched rates in the database with deduplication
      const ratesToCreate = [];
      const ratesToUpdate = [];

      for (const [currency, rate] of Object.entries(response.rates)) {
        // Check if rate already exists for this date/currency pair
        const existingRate = allExistingRates.find(
          r => r.date === date && 
               r.fromCurrency === currency && 
               r.toCurrency === 'USD'
        );

        if (existingRate) {
          // Update existing rate if different
          if (Math.abs(existingRate.rate - rate) > 0.0001) {
            ratesToUpdate.push({ id: existingRate.id, rate });
          }
        } else {
          // Create new rate
          ratesToCreate.push({
            date: date,
            fromCurrency: currency,
            toCurrency: 'USD',
            rate: rate
          });
        }
      }

      // Bulk create new rates
      if (ratesToCreate.length > 0) {
        await base44.entities.ExchangeRate.bulkCreate(ratesToCreate);
      }

      // Update existing rates individually
      for (const { id, rate } of ratesToUpdate) {
        await base44.entities.ExchangeRate.update(id, { rate });
      }

      // Invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EXCHANGE_RATES] });

      setIsRefreshing(false);
      return {
        success: true,
        message: `Exchange rates updated successfully! (${ratesToCreate.length} created, ${ratesToUpdate.length} updated)`,
        rates: response.rates
      };

    } catch (error) {
      console.error('Error refreshing exchange rates:', error);
      setIsRefreshing(false);
      return {
        success: false,
        message: 'Failed to update exchange rates. Please try again.',
        error: error.message
      };
    }
  };

  return {
    exchangeRates,
    isLoading,
    refreshRates,
    isRefreshing,
  };
};