/**
 * General utility functions
 * Non-domain-specific helpers for common operations
 * Created: 11-Nov-2025 - Extracted from budgetCalculations.js
 * Updated: 11-Nov-2025 - Added getCurrentMonthTransactions
 */

import { parseDate } from './dateUtils';

/**
 * Create a map from an array of entities
 * Can optionally extract a specific field value instead of the whole entity
 * @param {Array} entities - Array of entity objects
 * @param {string} keyField - Field to use as map key (default: 'id')
 * @param {Function} valueExtractor - Optional function to extract/transform the value
 * @returns {Object} Map of key to entity/value
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
 * @param {string|number} amount - Amount to normalize
 * @returns {string} Normalized amount string
 */
export const normalizeAmount = (amount) => {
    if (!amount) return '';
    return amount.toString().replace(/[^\d.,]/g, '').replace(',', '.');
};

/**
 * Get transactions for the current month
 * Filters transactions by month and year, using paid date for paid expenses
 * @param {Array} transactions - Array of transaction objects
 * @param {number} month - Month (0-11)
 * @param {number} year - Year
 * @returns {Array} Filtered transactions for the specified month
 */
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