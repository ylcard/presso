/**
 * @file Financial Calculations Utilities
 * @description Centralized functions for calculating expenses, income, and budget statistics.
 * @created 11-Nov-2025
 * @updated 27-Nov-2025 - Optimized performance (single-pass reducers), removed legacy wallet logic, fixed currency math.
 */

import { isDateInRange } from "./dateUtils";

/**
 * Helper to check if a transaction falls within a date range.
 */
export const isTransactionInDateRange = (transaction, startDate, endDate) => {
    if (transaction.type === 'income') {
        return isDateInRange(transaction.date, startDate, endDate);
    }
    // Paid transactions use paidDate, fallback to date. Unpaid use date.
    const effectiveDate = (transaction.isPaid && transaction.paidDate)
        ? transaction.paidDate
        : transaction.date;

    return isDateInRange(effectiveDate, startDate, endDate);
};

/**
 * Helper to determine if a budget ID corresponds to an actual custom budget.
 */
const isActualCustomBudget = (budgetId, allCustomBudgets) => {
    if (!budgetId) return false;
    const budget = allCustomBudgets.find(cb => cb.id === budgetId);
    return budget && !budget.isSystemBudget;
};

/**
 * Calculates total monthly income within a date range.
 */
export const getMonthlyIncome = (transactions, startDate, endDate) => {
    return transactions
        .filter(t => t.type === 'income' && isTransactionInDateRange(t, startDate, endDate))
        .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculates total monthly PAID expenses (excludes unpaid).
 */
export const getMonthlyPaidExpenses = (transactions, startDate, endDate) => {
    return transactions
        .filter(t =>
            t.type === 'expense' &&
            t.isPaid &&
            isTransactionInDateRange(t, startDate, endDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * Calculates total monthly expenses (paid + unpaid).
 */
export const getTotalMonthExpenses = (transactions, startDate, endDate) => {
    return transactions
        .filter(t =>
            t.type === 'expense' &&
            isTransactionInDateRange(t, startDate, endDate)
        )
        .reduce((sum, t) => sum + t.amount, 0);
};

/**
 * CORE AGGREGATOR: Calculates granular breakdown of expenses in one pass.
 * Replaces getPaidNeedsExpenses, getDirectPaidWantsExpenses, etc.
 * * @returns {Object} { needs: { paid, unpaid, total }, wants: { directPaid, directUnpaid, customPaid, customUnpaid, total } }
 */
export const getFinancialBreakdown = (transactions, categories, allCustomBudgets, startDate, endDate) => {
    const result = {
        needs: { paid: 0, unpaid: 0, total: 0 },
        wants: {
            directPaid: 0,
            directUnpaid: 0,
            customPaid: 0,
            customUnpaid: 0,
            total: 0
        }
    };

    transactions.forEach(t => {
        if (t.type !== 'expense') return;
        if (!isTransactionInDateRange(t, startDate, endDate)) return;

        const isCustom = isActualCustomBudget(t.customBudgetId, allCustomBudgets);
        const category = categories ? categories.find(c => c.id === t.category_id) : null;
        // Priority hierarchy: Transaction > Category > Default 'wants'
        const priority = t.financial_priority || category?.priority || 'wants';

        // 1. NEEDS Logic
        if (priority === 'needs') {
            // Needs are usually system-only, but if a custom budget is tagged 'needs', we count it here
            if (t.isPaid) result.needs.paid += t.amount;
            else result.needs.unpaid += t.amount;
        }
        // 2. WANTS Logic
        else if (priority === 'wants') {
            if (isCustom) {
                // "Indirect" Wants (Vacations, etc.)
                if (t.isPaid) result.wants.customPaid += t.amount;
                else result.wants.customUnpaid += t.amount;
            } else {
                // "Direct" Wants (Random shopping, dining)
                if (t.isPaid) result.wants.directPaid += t.amount;
                else result.wants.directUnpaid += t.amount;
            }
        }
    });

    // Compute Totals
    result.needs.total = result.needs.paid + result.needs.unpaid;

    result.wants.total =
        result.wants.directPaid +
        result.wants.directUnpaid +
        result.wants.customPaid +
        result.wants.customUnpaid;

    return result;
};

/**
 * Calculates statistics for a single custom budget.
 * FIX: Now uses t.amount (Base Currency) strictly to avoid currency mixing.
 */
export const getCustomBudgetStats = (customBudget, transactions, monthStart, monthEnd, baseCurrency = 'USD') => {
    // If dates provided, filter by range, otherwise take all for that budget ID
    const budgetTransactions = transactions.filter(t => {
        if (t.customBudgetId !== customBudget.id) return false;
        if (monthStart && monthEnd) return isTransactionInDateRange(t, monthStart, monthEnd);
        return true;
    });

    const expenses = budgetTransactions.filter(t => t.type === 'expense');
    const allocated = customBudget.allocatedAmount || 0;

    // Use t.amount (Base Currency) NOT t.originalAmount to avoid summing JPY + USD
    const spent = expenses.reduce((sum, t) => sum + t.amount, 0);
    const unpaid = expenses.filter(t => !t.isPaid).reduce((sum, t) => sum + t.amount, 0);
    const paidBase = expenses.filter(t => t.isPaid).reduce((sum, t) => sum + t.amount, 0);

    return {
        allocated,
        spent,
        unpaid,
        remaining: allocated - spent,
        paid: {
            totalBaseCurrencyAmount: paidBase,
            foreignCurrencyDetails: []
        },
        unpaid: {
            totalBaseCurrencyAmount: unpaid,
            foreignCurrencyDetails: []
        },
        totalAllocatedUnits: allocated,
        totalSpentUnits: spent,
        totalUnpaidUnits: unpaid,
        totalTransactionCount: expenses.length
    };
};

/**
 * Calculates statistics for a system budget.
 * Optimized to use getFinancialBreakdown for single-pass calculation.
 */
export const getSystemBudgetStats = (systemBudget, transactions, categories, allCustomBudgets, startDate, endDate, monthlyIncome = 0) => {

    // Get the granular data in one pass
    const breakdown = getFinancialBreakdown(transactions, categories, allCustomBudgets, startDate, endDate);

    let paidAmount = 0;
    let unpaidAmount = 0;

    if (systemBudget.systemBudgetType === 'needs') {
        paidAmount = breakdown.needs.paid;
        unpaidAmount = breakdown.needs.unpaid;
    } else if (systemBudget.systemBudgetType === 'wants') {
        // Wants System Budget aggregates Direct + Custom
        paidAmount = breakdown.wants.directPaid + breakdown.wants.customPaid;
        unpaidAmount = breakdown.wants.directUnpaid + breakdown.wants.customUnpaid;
    } else if (systemBudget.systemBudgetType === 'savings') {
        // Savings = Income - (Needs + Wants)
        const totalExpenses = breakdown.needs.total + breakdown.wants.total;
        paidAmount = Math.max(0, monthlyIncome - totalExpenses);
        unpaidAmount = 0;
    }

    const totalBudget = systemBudget.budgetAmount || 0;
    const totalSpent = paidAmount + unpaidAmount;
    const remaining = totalBudget - totalSpent;
    const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    return {
        paid: {
            totalBaseCurrencyAmount: paidAmount,
            foreignCurrencyDetails: []
        },
        unpaid: {
            totalBaseCurrencyAmount: unpaidAmount,
            foreignCurrencyDetails: []
        },
        totalSpent,
        paidAmount,
        unpaidAmount,
        remaining,
        percentageUsed,
        // Pass granular stats back if UI needs them (e.g. for Direct vs Custom split)
        breakdown
    };
};

/**
 * Calculates allocation statistics for a custom budget's categories.
 */
export const getCustomBudgetAllocationStats = (customBudget, allocations, transactions) => {
    const budgetTransactions = transactions.filter(t => t.customBudgetId === customBudget.id);
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const unallocated = customBudget.allocatedAmount - totalAllocated;

    const categorySpending = {};
    allocations.forEach(allocation => {
        const spent = budgetTransactions
            .filter(t => t.type === 'expense' && t.category_id === allocation.categoryId)
            .reduce((sum, t) => sum + t.amount, 0);

        categorySpending[allocation.categoryId] = {
            allocated: allocation.allocatedAmount,
            spent,
            remaining: allocation.allocatedAmount - spent,
            percentageUsed: allocation.allocatedAmount > 0 ? (spent / allocation.allocatedAmount) * 100 : 0
        };
    });

    const allocatedCategoryIds = allocations.map(a => a.categoryId);
    const unallocatedSpent = budgetTransactions
        .filter(t => t.type === 'expense' && (!t.category_id || !allocatedCategoryIds.includes(t.category_id)))
        .reduce((sum, t) => sum + t.amount, 0);

    return {
        totalAllocated,
        unallocated,
        unallocatedSpent,
        unallocatedRemaining: unallocated - unallocatedSpent,
        categorySpending
    };
};

/**
 * Calculates the net "Bonus Savings Potential".
 * (Needs Limit + Wants Limit) - Actual Spending
 */
export const calculateBonusSavingsPotential = (systemBudgets, transactions, categories, allCustomBudgets, startDate, endDate) => {
    let netPotential = 0;

    // Calculate everything once
    const breakdown = getFinancialBreakdown(transactions, categories, allCustomBudgets, startDate, endDate);

    const needsBudget = systemBudgets.find(sb => sb.systemBudgetType === 'needs');
    const wantsBudget = systemBudgets.find(sb => sb.systemBudgetType === 'wants');

    if (needsBudget) {
        netPotential += (needsBudget.budgetAmount || 0) - breakdown.needs.total;
    }

    if (wantsBudget) {
        netPotential += (wantsBudget.budgetAmount || 0) - breakdown.wants.total;
    }

    return netPotential;
};
