import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "../utils/currencyUtils";
import { estimateCurrentMonth } from "../utils/projectionUtils";
import { getMonthBoundaries } from "../utils/dateUtils";
import { getMonthlyIncome, getMonthlyPaidExpenses } from "../utils/financialCalculations";
import { ArrowRight, TrendingUp, TrendingDown, Target } from "lucide-react";

export default function ProjectionChart({
    transactions = [],
    settings,
    projectionData
}) {

    // Extract the safe baseline calculated in parent (Reports.js)
    const safeMonthlyAverage = projectionData?.totalProjectedMonthly || 0;

    const data = useMemo(() => {
        const today = new Date();

        // --- 1. LAST MONTH (Context) ---
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastBoundaries = getMonthBoundaries(lastMonthDate.getMonth(), lastMonthDate.getFullYear());
        const lastIncome = getMonthlyIncome(transactions, lastBoundaries.monthStart, lastBoundaries.monthEnd);
        const lastExpenses = Math.abs(getMonthlyPaidExpenses(transactions, lastBoundaries.monthStart, lastBoundaries.monthEnd));

        // --- 2. THIS MONTH (Projection) ---
        const currentMonthTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === today.getMonth() &&
                tDate.getFullYear() === today.getFullYear();
        });

        // Income: Sum of Actual + Planned Income for this month (simplified to Actual here for safety)
        const currentBoundaries = getMonthBoundaries(today.getMonth(), today.getFullYear());
        const currentIncome = getMonthlyIncome(transactions, currentBoundaries.monthStart, currentBoundaries.monthEnd);
        // Expense: Hybrid Projection
        const currentExpenseProj = estimateCurrentMonth(currentMonthTransactions, safeMonthlyAverage).total;

        // --- 3. NEXT MONTH (Target) ---
        // We assume Income is stable (uses Last Month as proxy) for a conservative estimate
        const nextIncome = lastIncome;
        const nextExpense = safeMonthlyAverage;

        return [
            {
                label: 'Last Month',
                subLabel: lastMonthDate.toLocaleDateString('en-US', { month: 'short' }),
                income: lastIncome,
                expense: lastExpenses,
                type: 'past'
            },
            {
                label: 'This Month',
                subLabel: 'Projected',
                income: currentIncome,
                expense: currentExpenseProj,
                type: 'current'
            },
            {
                label: 'Next Month',
                subLabel: 'Target',
                income: nextIncome,
                expense: nextExpense,
                type: 'future'
            }
        ];
    }, [transactions, safeMonthlyAverage]);

    // Scaling for the chart
    const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100) * 1.1;

    // Insight Text Logic
    const currentNet = data[1].income - data[1].expense;
    const isPositive = currentNet >= 0;

    return (
        <Card className="border-none shadow-sm h-full flex flex-col">
            <CardHeader className="pb-2 flex-none">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-800">Forecast</CardTitle>

                    {/* Evolution Badge */}
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${evolution > 5 ? 'bg-rose-100 text-rose-700' : evolution < -5 ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {evolution > 0 ? '↑' : '↓'} {Math.abs(evolution).toFixed(1)}% vs 6M Avg
                    </div>
                </div>
                <p className="text-sm text-gray-500">Timeline: Actuals → Today → Safe Baseline</p>
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full min-h-[200px] flex flex-col justify-end">
                    <div className="flex items-end justify-between h-full gap-2 pt-6">
                        {chartData.map((item, idx) => {
                            const height = Math.max((item.amount / maxVal) * 100, 2);

                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">


                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10 whitespace-nowrap pointer-events-none">
                                        <p className="font-bold mb-1">{item.label}</p>
                                        <p>{formatCurrency(item.amount, settings)}</p>
                                        {item.type === 'current' && (
                                            <p className="text-gray-400 text-[10px] mt-1">
                                                Spent: {formatCurrency(item.actualPart, settings)}<br />
                                                Est. Rem: {formatCurrency(item.projectedPart, settings)}
                                            </p>
                                        )}
                                    </div>
                                    {/* Bar Visuals */}
                                    <div className="w-full max-w-[32px] md:max-w-[44px] relative h-full flex items-end">

                                        {item.type === 'current' ? (
                                            // CURRENT (Stacked: Striped + Solid)
                                            <div className="w-full relative flex flex-col-reverse justify-start h-full" style={{ height: `${height}%` }}>
                                                {/* Projected Remaining */}
                                                <div
                                                    className="w-full bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes-light.png')] bg-blue-300 opacity-50 rounded-t-sm border-t border-x border-blue-300"
                                                    style={{ height: `${(item.projectedPart / item.amount) * 100}%` }}
                                                />
                                                {/* Actual Spent */}
                                                <div
                                                    className="w-full bg-blue-600 rounded-b-sm"
                                                    style={{ height: `${(item.actualPart / item.amount) * 100}%` }}
                                                />
                                                {/* "Today" Icon */}
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pb-1">
                                                    <CalendarClock className="w-3 h-3 text-blue-600" />
                                                </div>
                                            </div>
                                        ) : (
                                            // HISTORY or FUTURE
                                            <div
                                                className={`w-full rounded-t-sm transition-all duration-300 
                                                        ${item.type === 'history' ? 'bg-gray-300 hover:bg-gray-400' : ''}
                                                        ${item.type === 'future' ? 'bg-blue-50 border border-blue-200 border-dashed' : ''}
                                                    `}
                                                style={{ height: `${height}%` }}
                                            />
                                        )}
                                    </div>

                                    {/* Label */}
                                    <span className={`text-[10px] md:text-xs font-medium ${item.type === 'current' ? 'text-blue-600 font-bold' : 'text-gray-500'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}