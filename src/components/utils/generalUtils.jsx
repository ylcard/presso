// CREATED: 2025-01-11
// General utility functions that are domain-agnostic
// For financial-specific calculations, see financialCalculations.js

import { parseDate } from './dateUtils';

/**
 * Utility function to create a map from an array of entities
 * Can optionally extract a specific field value instead of the whole entity
 * 
 * @param {Array} entities - Array of entity objects
 * @param {string} keyField - Field to use as the map key (default: 'id')
 * @param {Function} valueExtractor - Optional function to extract/transform the value
 * @returns {Object} Map of key -> entity (or extracted value)
 */
export const createEntityMap = (entities, keyField = 'id', valueExtractor = null) => {
    if (!Array.isArray(entities)) return {};
    return entities.reduce((acc, entity) => {
        if (entity && entity[keyField]) {
            acc[entity[keyField]] = valueExtractor ? valueExtractor(entity) : entity;
        }
        return acc;
    }, {});
};

/**
 * Normalize amount input by removing non-numeric characters except decimal separators
 * Converts comma to period for standardization
 * 
 * @param {string|number} amount - Amount to normalize
 * @returns {string} Normalized amount string
 */
export const normalizeAmount = (amount) => {
    if (!amount) return '';
    return amount.toString().replace(/[^\d.,]/g, '').replace(',', '.');
};

// DEPRECATED: 2025-01-12
// This function has been replaced by getMonthlyIncome and getMonthlyPaidExpenses 
// in components/utils/financialCalculations.js
// The mixed responsibility of filtering both income AND expenses in a single function
// created confusion and redundancy. Financial calculations are now centralized.
// This function is scheduled for deletion after confirming all references are updated
/*
export const getCurrentMonthTransactions = (transactions, month, year) => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    return transactions.filter(t => {
        // For income, just check the date
        if (t.type === 'income') {
            const transactionDate = parseDate(t.date);
            return transactionDate >= monthStart && transactionDate <= monthEnd;
        }

        // For expenses, check if paid in this month
        if (!t.isPaid || !t.paidDate) return false;
        const paidDate = parseDate(t.paidDate);
        return paidDate >= monthStart && paidDate <= monthEnd;
    });
};
*/