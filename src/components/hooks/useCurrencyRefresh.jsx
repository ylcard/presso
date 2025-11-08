import { useState } from "react";
import { areRatesFresh, fetchExchangeRatesFromLLM, storeExchangeRates } from "../utils/currencyConversion";

/**
 * Hook for managing currency exchange rate refresh
 */
export const useCurrencyRefresh = (user) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);
  const [refreshSuccess, setRefreshSuccess] = useState(false);

  const refreshRates = async (transactionDate, baseCurrency, foreignCurrency) => {
    setIsRefreshing(true);
    setRefreshError(null);
    setRefreshSuccess(false);

    try {
      // Check if rates are already fresh
      const ratesFresh = await areRatesFresh(transactionDate, baseCurrency, foreignCurrency);
      
      if (ratesFresh) {
        setRefreshSuccess(true);
        setIsRefreshing(false);
        return { success: true, message: 'Exchange rates are already up to date!' };
      }

      // Fetch fresh rates from LLM
      const rates = await fetchExchangeRatesFromLLM(transactionDate, baseCurrency, foreignCurrency);
      
      // Store rates in database
      await storeExchangeRates(transactionDate, rates, user.email);
      
      setRefreshSuccess(true);
      setIsRefreshing(false);
      
      return { success: true, message: 'Exchange rates updated successfully!' };
    } catch (error) {
      console.error('Error refreshing rates:', error);
      setRefreshError(error.message || 'Failed to refresh exchange rates');
      setIsRefreshing(false);
      return { success: false, message: error.message || 'Failed to refresh exchange rates' };
    }
  };

  const resetStatus = () => {
    setRefreshError(null);
    setRefreshSuccess(false);
  };

  return {
    isRefreshing,
    refreshError,
    refreshSuccess,
    refreshRates,
    resetStatus
  };
};