import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, TrendingDown, ShieldCheck, AlertTriangle } from "lucide-react";
import { getMonthlyPaidExpenses } from "../utils/financialCalculations";
import { formatCurrency } from "../utils/currencyUtils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function FinancialHealthScore({
    monthlyIncome,
    transactions,
    prevMonthlyIncome,
    prevTransactions,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate,
    isLoading,
    settings
}) {
    const { t } = useTranslation();

    const scoreData = useMemo(() => {
        if (isLoading) return null;

        // 1. Current Month Data
        const currentExpenses = Math.abs(getMonthlyPaidExpenses(transactions, startDate, endDate));
        const currentNet = monthlyIncome - currentExpenses;
        const currentSavingsRate = monthlyIncome > 0 ? (currentNet / monthlyIncome) : 0;

        // 2. Previous Month Data
        const prevExpenses = Math.abs(getMonthlyPaidExpenses(prevTransactions, prevStartDate, prevEndDate));
        const prevNet = prevMonthlyIncome - prevExpenses;
        const prevSavingsRate = prevMonthlyIncome > 0 ? (prevNet / prevMonthlyIncome) : 0;

        // --- SCORING ALGORITHM (Max 100) ---

        // A. Savings Score (Max 50)
        // Target: 20% savings rate.
        // Formula: (Rate / 0.20) * 50, capped at 50. Floor at 0.
        let savingsScore = 0;
        if (currentSavingsRate > 0) {
            savingsScore = Math.min(50, (currentSavingsRate / 0.20) * 50);
        }

        // B. Solvency/Budget Score (Max 30)
        // Reward for living within means (Income >= Expenses).
        // If Net Flow > 0: Full 30 points.
        // If Overspent: Penalize based on severity. 30 - (Overspend % * 100).
        let solvencyScore = 0;
        if (currentNet >= 0) {
            solvencyScore = 30;
        } else {
            const overspendRatio = monthlyIncome > 0 ? (Math.abs(currentNet) / monthlyIncome) : 1;
            // Penalize heavily: 10% overspend loses 10 points. 30% overspend loses all points.
            solvencyScore = Math.max(0, 30 - (overspendRatio * 100));
        }

        // C. Trend Score (Max 20)
        // +10 for improving Savings Rate
        // +10 for reducing Expenses (raw amount)
        let trendScore = 0;
        if (currentSavingsRate > prevSavingsRate) trendScore += 10;
        if (currentExpenses < prevExpenses) trendScore += 10;

        const totalScore = Math.round(savingsScore + solvencyScore + trendScore);

        return {
            score: totalScore,
            breakdown: {
                savings: Math.round(savingsScore),
                solvency: Math.round(solvencyScore),
                trend: Math.round(trendScore)
            },
            metrics: {
                savingsRate: currentSavingsRate * 100,
                expenseDiff: prevExpenses - currentExpenses
            }
        };
    }, [monthlyIncome, transactions, prevMonthlyIncome, prevTransactions, startDate, endDate, prevStartDate, prevEndDate, isLoading]);

    if (isLoading || !scoreData) {
        return (
            <Card className="border-none shadow-sm h-full">
                <CardHeader>
                    <CardTitle>{t('reports.healthScore.title')}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[180px]">
                    <div className="w-32 h-32 rounded-full border-4 border-gray-100 animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    const { score, breakdown, metrics } = scoreData;

    // Color Logic
    let color = '#10B981'; // Green
    let label = t('reports.healthScore.excellent');
    if (score < 80) { color = '#3B82F6'; label = t('reports.healthScore.good'); } // Blue
    if (score < 60) { color = '#F59E0B'; label = t('reports.healthScore.fair'); } // Orange
    if (score < 40) { color = '#EF4444'; label = t('reports.healthScore.needsWork'); } // Red

    // SVG Arc Calculation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <Card className="border-none shadow-sm h-full overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5">
                <Activity size={120} />
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    {t('reports.healthScore.title')}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                    {/* Radial Gauge */}
                    <div className="relative w-36 h-36 flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                            {/* Background Circle */}
                            <circle
                                cx="60" cy="60" r="50"
                                fill="none"
                                stroke="#F3F4F6"
                                strokeWidth="10"
                            />
                            {/* Progress Circle */}
                            <motion.circle
                                initial={{ strokeDashoffset: circumference }}
                                animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                cx="60" cy="60" r="50"
                                fill="none"
                                stroke={color}
                                strokeWidth="10"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-900">{score}</span>
                            <span className="text-xs font-medium" style={{ color }}>{label}</span>
                        </div>
                    </div>

                    {/* Breakdown */}
                    <div className="flex-1 w-full space-y-4">

                        {/* Factor 1: Savings */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> {t('reports.healthScore.savingsRate')}
                                </span>
                                <span className="font-medium">{breakdown.savings}/50</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full"
                                    style={{ width: `${(breakdown.savings / 50) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-gray-400">
                                {t('reports.healthScore.description', { rate: metrics.savingsRate.toFixed(1) })} {t('reports.healthScore.target')}
                            </p>
                        </div>

                        {/* Factor 2: Solvency */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3" /> {t('reports.healthScore.solvency')}
                                </span>
                                <span className="font-medium">{breakdown.solvency}/30</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${(breakdown.solvency / 30) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Factor 3: Trend */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 flex items-center gap-1">
                                    {breakdown.trend >= 10 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {t('reports.healthScore.trend')}
                                </span>
                                <span className="font-medium">{breakdown.trend}/20</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 rounded-full"
                                    style={{ width: `${(breakdown.trend / 20) * 100}%` }}
                                />
                            </div>
                            {metrics.expenseDiff > 0 && (
                                <p className="text-[10px] text-green-600">
                                    {t('reports.healthScore.spentLess', { amount: formatCurrency(metrics.expenseDiff, settings) })}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
