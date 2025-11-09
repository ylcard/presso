import { base44 } from "@/api/base44Client";

/**
 * Utility functions for managing cash allocations in custom budgets
 */

/**
 * Get available balance for a specific currency in the cash wallet
 */
export const getCurrencyBalance = (cashWallet, currencyCode) => {
  if (!cashWallet || !cashWallet.balances) return 0;
  const balance = cashWallet.balances.find(b => b.currencyCode === currencyCode);
  return balance ? balance.amount : 0;
};

/**
 * Update balance for a specific currency
 */
export const updateCurrencyBalance = (balances, currencyCode, amountChange) => {
  const existingBalance = balances.find(b => b.currencyCode === currencyCode);
  
  if (existingBalance) {
    return balances.map(b => 
      b.currencyCode === currencyCode 
        ? { ...b, amount: b.amount + amountChange }
        : b
    ).filter(b => b.amount > 0.01); // Remove zero/near-zero balances
  } else if (amountChange > 0) {
    return [...balances, { currencyCode, amount: amountChange }];
  }
  return balances;
};

/**
 * Calculate total allocated cash across all currencies
 */
export const getTotalCashAllocated = (cashAllocations) => {
  if (!cashAllocations || !Array.isArray(cashAllocations)) return 0;
  return cashAllocations.reduce((sum, alloc) => sum + (alloc.amount || 0), 0);
};

/**
 * Validate if wallet has sufficient balance for the requested allocations
 */
export const validateCashAllocations = (cashWallet, requestedAllocations, baseCurrency) => {
  if (!requestedAllocations || requestedAllocations.length === 0) {
    return { valid: true };
  }

  const errors = [];
  
  for (const allocation of requestedAllocations) {
    const available = getCurrencyBalance(cashWallet, allocation.currencyCode);
    if (allocation.amount > available) {
      errors.push({
        currency: allocation.currencyCode,
        requested: allocation.amount,
        available
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Allocate cash from wallet to budget
 * Returns updated wallet balances
 */
export const allocateCashFromWallet = async (walletId, currentBalances, allocations) => {
  let updatedBalances = [...(currentBalances || [])];
  
  for (const allocation of allocations) {
    updatedBalances = updateCurrencyBalance(
      updatedBalances,
      allocation.currencyCode,
      -allocation.amount
    );
  }

  await base44.entities.CashWallet.update(walletId, {
    balances: updatedBalances
  });

  return updatedBalances;
};

/**
 * Return cash from budget to wallet
 * Returns updated wallet balances
 */
export const returnCashToWallet = async (walletId, currentBalances, allocations) => {
  let updatedBalances = [...(currentBalances || [])];
  
  for (const allocation of allocations) {
    updatedBalances = updateCurrencyBalance(
      updatedBalances,
      allocation.currencyCode,
      allocation.amount
    );
  }

  await base44.entities.CashWallet.update(walletId, {
    balances: updatedBalances
  });

  return updatedBalances;
};

/**
 * Calculate remaining cash allocations after expenses
 */
export const calculateRemainingCashAllocations = (budget, transactions) => {
  if (!budget.cashAllocations || budget.cashAllocations.length === 0) {
    return [];
  }

  // Get all cash expenses for this budget
  const cashExpenses = transactions.filter(t => 
    t.customBudgetId === budget.id &&
    t.type === 'expense' &&
    t.isCashTransaction &&
    t.cashTransactionType === 'expense_from_wallet' &&
    t.cashCurrency
  );

  // Group expenses by currency
  const expensesByCurrency = cashExpenses.reduce((acc, t) => {
    acc[t.cashCurrency] = (acc[t.cashCurrency] || 0) + t.cashAmount;
    return acc;
  }, {});

  // Calculate remaining for each currency
  return budget.cashAllocations.map(alloc => {
    const spent = expensesByCurrency[alloc.currencyCode] || 0;
    return {
      currencyCode: alloc.currencyCode,
      amount: Math.max(0, alloc.amount - spent)
    };
  }).filter(alloc => alloc.amount > 0.01);
};

/**
 * Handle cash allocation changes when editing a budget
 * Returns object with { shouldAllocate, shouldReturn, allocationsToProcess }
 */
export const calculateAllocationChanges = (oldAllocations, newAllocations) => {
  const oldMap = (oldAllocations || []).reduce((acc, a) => {
    acc[a.currencyCode] = a.amount;
    return acc;
  }, {});

  const newMap = (newAllocations || []).reduce((acc, a) => {
    acc[a.currencyCode] = a.amount;
    return acc;
  }, {});

  const allocationsToProcess = [];
  const allCurrencies = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

  allCurrencies.forEach(currency => {
    const oldAmount = oldMap[currency] || 0;
    const newAmount = newMap[currency] || 0;
    const diff = newAmount - oldAmount;

    if (Math.abs(diff) > 0.01) {
      allocationsToProcess.push({
        currencyCode: currency,
        amount: Math.abs(diff),
        isIncrease: diff > 0
      });
    }
  });

  return allocationsToProcess;
};