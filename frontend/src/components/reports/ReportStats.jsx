import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Target, PiggyBank, Activity, TrendingDown, ShieldCheck } from "lucide-react";
import { formatCurrency } from "../utils/currencyUtils";
import { getMonthlyPaidExpenses } from "../utils/financialCalculations";
import { estimateCurrentMonth } from "../utils/projectionUtils";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function ReportStats({
    transactions = [],
    monthlyIncome = 0,
    prevTransactions = [],
    prevMonthlyIncome = 0,
    isLoading,
    settings,
    safeBaseline = 0,
    startDate,
    endDate,
    bonusSavingsPotential = 0
}) {
    const { t } = useTranslation();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2].map((i) => (
                    <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
                ))}
            </div>
        );
    }

    const totalPaidExpenses = Math.abs(getMonthlyPaidExpenses(transactions, startDate, endDate));
    const prevPaidExpenses = Math.abs(getMonthlyPaidExpenses(prevTransactions));

    const netFlow = monthlyIncome - totalPaidExpenses;
    const prevNetFlow = prevMonthlyIncome - prevPaidExpenses;

    const savingsRate = monthlyIncome > 0
        ? ((monthlyIncome - totalPaidExpenses) / monthlyIncome) * 100
        : 0;

    const prevSavingsRate = prevMonthlyIncome > 0
        ? ((prevMonthlyIncome - prevPaidExpenses) / prevMonthlyIncome) * 100
        : 0;

    // --- Analysis & Projection Logic ---
    const today = new Date();
    // Ensure startDate is a real Date object before reading properties
    const start = new Date(startDate);
    const isCurrentMonth = today.getMonth() === start.getMonth() && today.getFullYear() === start.getFullYear();

    // 1. Get projection for the current month using the Safe Baseline
    const estimate = estimateCurrentMonth(transactions, safeBaseline);

    // 2. Determine what to show as "Projected"
    // If current month: Show the hybrid estimate (Spent + Remaining Baseline)
    // If past month: Show actuals
    const projectedExpenses = isCurrentMonth ? estimate.total : totalPaidExpenses;
    const projectedNetFlow = monthlyIncome - projectedExpenses;

    // 3. Comparisons
    const savingsRateDiff = savingsRate - prevSavingsRate;

    // Helper for Net Flow % change (handles negative numbers safely)
    // Formula: (Current - Prev) / |Prev|
    const netFlowDiffPercent = prevNetFlow !== 0
        ? ((netFlow - prevNetFlow) / Math.abs(prevNetFlow)) * 100
        : 0;

    const getArrow = (diff) => diff >= 0
        ? <ArrowUpRight className="w-3 h-3" />
        : <ArrowDownRight className="w-3 h-3" />;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-500">{t('reports.stats.savingsRate')}</p>
                        <motion.h3
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className={`text-2xl font-bold mt-1 ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate > 0 ? 'text-blue-600' : 'text-rose-600'}`}
                        >
                            {savingsRate.toFixed(1)}%
                        </motion.h3>
                        {/* Analysis Badge */}
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${savingsRateDiff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {getArrow(savingsRateDiff)}
                            <span>{t('reports.stats.vsLastMonth', { value: Math.abs(savingsRateDiff).toFixed(1) })}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                        <div className={`p-3 rounded-full ${savingsRate >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-500">{t('reports.stats.netFlow')}</p>
                        <motion.h3
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className={`text-2xl font-bold mt-1 ${netFlow >= 0 ? 'text-gray-900' : 'text-rose-600'}`}
                        >
                            {formatCurrency(netFlow, settings)}
                        </motion.h3>
                        {/* Analysis Badge - Comparison vs Last Month */}
                        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${netFlowDiffPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {getArrow(netFlowDiffPercent)}
                            <span>{t('reports.stats.vsLastMonth', { value: Math.abs(netFlowDiffPercent).toFixed(0) })}</span>
                        </div>
                        {/* Projection Badge */}
                        {isCurrentMonth ? (
                            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${projectedNetFlow >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                <Target className="w-3 h-3" />
                                <span>{t('reports.stats.projEndOfMonth', { amount: formatCurrency(projectedNetFlow, settings) })}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 mt-2 text-xs font-medium text-gray-400">
                                <span>{t('reports.stats.closed')}</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-4 flex justify-center">
                        <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                            <Wallet className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
                <CardContent className="p-6 text-center">
                    <div className="flex flex-col items-center">
                        <p className="text-sm font-medium text-gray-500">{t('reports.stats.efficiencyBonus')}</p>
                        <motion.h3
                            initial={{ y: 5, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2, duration: 0.5 }}
                            className="text-2xl font-bold mt-1 text-emerald-600"
                        >
                            {formatCurrency(bonusSavingsPotential, settings)}
                        </motion.h3>
                        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600/80">
                            <span>{t('reports.stats.unspentNeedsWants')}</span>
                        </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                        <div className="p-3 rounded-full bg-emerald-100 text-emerald-600">
                            <PiggyBank className="w-5 h-5" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


// --- Financial Health Score Component (Appended to existing file) ---
export function FinancialHealthScore({
    monthlyIncome,
    transactions,
    prevMonthlyIncome,
    prevTransactions,
    startDate,
    endDate,
    isLoading,
    settings
}) {
    const { t } = useTranslation();
    if (isLoading) return null;

    // 1. Current Month Data
    const currentExpenses = Math.abs(getMonthlyPaidExpenses(transactions, startDate, endDate));
    const currentNet = monthlyIncome - currentExpenses;
    const currentSavingsRate = monthlyIncome > 0 ? (currentNet / monthlyIncome) : 0;

    // 2. Previous Month Data (Approximate using available prevTransactions)
    const prevExpenses = Math.abs(getMonthlyPaidExpenses(prevTransactions));

    // --- SCORING ALGORITHM (Max 100) ---
    // A. Savings Score (Max 50)
    let savingsScore = 0;
    if (currentSavingsRate > 0) {
        savingsScore = Math.min(50, (currentSavingsRate / 0.20) * 50);
    }

    // B. Efficiency Score (Max 30) - Rewards staying under budget ceilings
    let efficiencyScore = 0;
    if (currentNet >= 0) {
        efficiencyScore = 15; // Base solvency
        // Bonus for every 1% saved
        efficiencyScore += Math.min(15, (currentSavingsRate * 100) * 0.5);
    } else {
        const overspendRatio = monthlyIncome > 0 ? (Math.abs(currentNet) / monthlyIncome) : 1;
        efficiencyScore = Math.max(0, 15 - (overspendRatio * 100));
    }

    // C. Trend Score (Max 20)
    let trendScore = 0;
    if (currentExpenses < prevExpenses) trendScore += 10;
    if (currentNet > (prevMonthlyIncome - prevExpenses)) trendScore += 10;

    const totalScore = Math.round(savingsScore + efficiencyScore + trendScore);

    // Visuals
    let color = '#10B981'; // Green
    let label = t('health_score_excellent');
    if (totalScore < 80) { color = '#3B82F6'; label = t('health_score_good'); }
    if (totalScore < 60) { color = '#F59E0B'; label = t('health_score_fair'); }
    if (totalScore < 40) { color = '#EF4444'; label = t('health_score_needs_work'); }

    return (
        <Card className="border-none shadow-sm h-full overflow-hidden relative mt-6">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="50" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                        <motion.circle
                            initial={{ strokeDashoffset: 314 }}
                            animate={{ strokeDashoffset: 314 - (totalScore / 100) * 314 }}
                            transition={{ duration: 1 }}
                            cx="60" cy="60" r="50"
                            fill="none"
                            stroke={color}
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray="314"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900">{totalScore}</span>
                        <span className="text-xs font-medium" style={{ color }}>{label}</span>
                    </div>
                </div>
                {/* Text Summary */}
                <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" /> {t('financial_health')}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {t('health_score_description', { savingsRate: Math.round(currentSavingsRate * 100) })}
                    </p>
                    <div className="flex gap-4 mt-4">
                        <div className="text-xs">
                            <span className="block text-gray-400">{t('savings')}</span>
                            <span className="font-semibold">{Math.round(savingsScore)}/50</span>
                        </div>
                        <div className="text-xs">
                            <span className="block text-gray-400">{t('efficiency')}</span>
                            <span className="font-semibold">{Math.round(efficiencyScore)}/30</span>
                        </div>
                        <div className="text-xs">
                            <span className="block text-gray-400">{t('trend')}</span>
                            <span className="font-semibold">{Math.round(trendScore)}/20</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
