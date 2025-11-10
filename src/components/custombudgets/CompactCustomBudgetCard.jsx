import React, { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatCurrency } from "../utils/formatCurrency";
import { motion } from "framer-motion";

// Helper to get currency symbol
const getCurrencySymbol = (currencyCode) => {
  const currencySymbols = {
    'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'CA$', 'AUD': 'A$',
    'CHF': 'CHF', 'CNY': '¥', 'INR': '₹', 'MXN': 'MX$', 'BRL': 'R$', 'ZAR': 'R',
    'KRW': '₩', 'SGD': 'S$', 'NZD': 'NZ$', 'HKD': 'HK$', 'SEK': 'kr', 'NOK': 'kr',
    'DKK': 'kr', 'PLN': 'zł', 'THB': '฿', 'MYR': 'RM', 'IDR': 'Rp', 'PHP': '₱',
    'CZK': 'Kč', 'ILS': '₪', 'CLP': 'CLP$', 'AED': 'د.إ', 'SAR': '﷼', 'TWD': 'NT$', 'TRY': '₺'
  };
  return currencySymbols[currencyCode] || currencyCode;
};

export default function CompactCustomBudgetCard({ budget, stats, settings }) {
  const baseCurrency = settings?.baseCurrency || 'USD';

  // Calculate total allocated (treating all currencies as equal units)
  const totalAllocated = useMemo(() => {
    let total = stats?.digital?.allocated || 0;
    if (stats?.cashByCurrency) {
      Object.values(stats.cashByCurrency).forEach(cashData => {
        total += cashData?.allocated || 0;
      });
    }
    return total;
  }, [stats]);

  // Calculate total spent (paid + unpaid, treating all currencies as equal units)
  const totalSpent = useMemo(() => {
    let spent = (stats?.digital?.spent || 0) + (stats?.digital?.unpaid || 0);
    if (stats?.cashByCurrency) {
      Object.values(stats.cashByCurrency).forEach(cashData => {
        spent += cashData?.spent || 0;
      });
    }
    return spent;
  }, [stats]);

  // Calculate percentage used
  const percentageUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  // Separate paid amounts by currency
  const paidAmounts = useMemo(() => {
    const amounts = {};
    
    // Digital paid (in base currency)
    const digitalPaid = (stats?.digital?.spent || 0) - (stats?.digital?.unpaid || 0);
    if (digitalPaid > 0) {
      amounts[baseCurrency] = (amounts[baseCurrency] || 0) + digitalPaid;
    }
    
    // Cash paid by currency
    if (stats?.cashByCurrency) {
      Object.entries(stats.cashByCurrency).forEach(([currency, data]) => {
        if (data?.spent > 0) {
          amounts[currency] = (amounts[currency] || 0) + data.spent;
        }
      });
    }
    
    return amounts;
  }, [stats, baseCurrency]);

  // Unpaid amount (digital only, in base currency)
  const unpaidAmount = stats?.digital?.unpaid || 0;

  // Circular progress SVG
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const paidPercentage = totalAllocated > 0 ? ((totalSpent - unpaidAmount) / totalAllocated) * 100 : 0;
  const unpaidPercentage = totalAllocated > 0 ? (unpaidAmount / totalAllocated) * 100 : 0;
  
  const paidStrokeDashoffset = circumference - (paidPercentage / 100) * circumference;
  const unpaidStrokeDashoffset = circumference - ((paidPercentage + unpaidPercentage) / 100) * circumference;

  const color = budget.color || '#3B82F6';
  const lightColor = `${color}80`; // 50% opacity for unpaid

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: color }} />
        <CardContent className="p-4">
          <Link to={createPageUrl(`BudgetDetail?id=${budget.id}`)}>
            <h3 className="font-bold text-gray-900 text-sm mb-3 hover:text-blue-600 transition-colors truncate">
              {budget.name}
            </h3>
          </Link>

          {/* Circular Progress */}
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="#E5E7EB"
                  strokeWidth="8"
                  fill="none"
                />
                {/* Paid progress */}
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke={color}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={paidStrokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-500"
                />
                {/* Unpaid progress */}
                {unpaidAmount > 0 && (
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke={lightColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={unpaidStrokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                )}
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(percentageUsed)}%
                </span>
              </div>
            </div>
          </div>

          {/* Paid and Unpaid Amounts */}
          <div className="space-y-2 text-sm">
            {/* Paid amounts */}
            <div>
              <p className="text-xs text-gray-500 mb-1">Paid</p>
              {Object.entries(paidAmounts).map(([currency, amount]) => {
                const symbol = getCurrencySymbol(currency);
                return (
                  <p key={currency} className="font-semibold text-gray-900">
                    {currency === baseCurrency 
                      ? formatCurrency(amount, settings)
                      : `${symbol}${amount.toFixed(2)}`
                    }
                  </p>
                );
              })}
            </div>

            {/* Unpaid amount */}
            {unpaidAmount > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Unpaid</p>
                <p className="font-semibold text-orange-600">
                  {formatCurrency(unpaidAmount, settings)}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}