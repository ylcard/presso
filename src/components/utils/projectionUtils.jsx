// OBSOLETE - Renamed to projectionUtils.jsx
// Date: 20-Nov-2025
// Reason: Renaming to .jsx extension as per strict file naming policy.
/*
import { getMonthlyPaidExpenses } from "./financialCalculations";

const getMonthKeys = (monthsBack) => {
    const keys = [];
    const now = new Date();
    for (let i = 1; i <= monthsBack; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        keys.push(`${year}-${month}`);
    }
    return keys;
};

const calculateAdjustedAverage = (values) => {
    if (!values || values.length === 0) return 0;
    if (values.length === 1) return values[0];

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquareDiff);

    if (stdDev === 0) return mean;

    const filteredValues = values.filter(value => {
        const zScore = Math.abs((value - mean) / stdDev);
        return zScore <= 2;
    });

    if (filteredValues.length === 0) return mean;

    const filteredSum = filteredValues.reduce((a, b) => a + b, 0);
    return filteredSum / filteredValues.length;
};

export const calculateProjection = (transactions, categories, historicalMonths = 6) => {
    const categoryHistory = {};
    
    categories.forEach(cat => {
        categoryHistory[cat.id] = {};
    });
    categoryHistory['uncategorized'] = {};

    const monthKeys = getMonthKeys(historicalMonths);
    const minDate = new Date(monthKeys[monthKeys.length - 1] + "-01");
    const maxDate = new Date(new Date().getFullYear(), new Date().getMonth(), 0);

    const relevantTransactions = transactions.filter(t => {
        if (t.type !== 'expense') return false;
        const dateStr = t.isPaid && t.paidDate ? t.paidDate : t.date;
        const d = new Date(dateStr);
        return d >= minDate && d <= maxDate;
    });

    relevantTransactions.forEach(t => {
        const catId = t.category_id || 'uncategorized';
        if (!categoryHistory[catId]) categoryHistory[catId] = {};
        
        const dateStr = t.isPaid && t.paidDate ? t.paidDate : t.date;
        const d = new Date(dateStr);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthKeys.includes(monthKey)) {
             categoryHistory[catId][monthKey] = (categoryHistory[catId][monthKey] || 0) + (Number(t.amount) || 0);
        }
    });

    let totalProjectedMonthly = 0;
    const categoryProjections = [];

    Object.keys(categoryHistory).forEach(catId => {
        const monthData = categoryHistory[catId];
        const values = monthKeys.map(key => monthData[key] || 0);
        
        if (values.every(v => v === 0)) return;

        const adjustedAvg = calculateAdjustedAverage(values);
        
        totalProjectedMonthly += adjustedAvg;
        
        const category = categories.find(c => c.id === catId);
        categoryProjections.push({
            categoryId: catId,
            name: category ? category.name : 'Uncategorized',
            color: category ? category.color : '#9ca3af',
            averageSpend: adjustedAvg,
            history: values
        });
    });

    return {
        totalProjectedMonthly,
        categoryProjections: categoryProjections.sort((a, b) => b.averageSpend - a.averageSpend)
    };
};
*/