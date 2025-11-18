import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "../utils/currencyUtils";
import { getMonthlyPaidExpenses } from "../utils/financialCalculations";
import { motion } from "framer-motion";

export default function ReportStats({ transactions = [], monthlyIncome = 0, isLoading, settings, startDate, endDate }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  // FIX: Use centralized calculation logic for paid expenses
  const totalPaidExpenses = Math.abs(getMonthlyPaidExpenses(transactions, startDate, endDate));

  const netFlow = monthlyIncome - totalPaidExpenses;

  const savingsRate = monthlyIncome > 0
    ? ((monthlyIncome - totalPaidExpenses) / monthlyIncome) * 100
    : 0;

  const avgDailySpend = totalPaidExpenses / 30;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="border-none shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-gray-500">Savings Rate</p>
            <motion.h3
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className={`text-2xl font-bold mt-1 ${savingsRate >= 20 ? 'text-emerald-600' : savingsRate > 0 ? 'text-blue-600' : 'text-rose-600'}`}
            >
              {savingsRate.toFixed(1)}%
            </motion.h3>
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
            <p className="text-sm font-medium text-gray-500">Net Flow</p>
            <motion.h3
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className={`text-2xl font-bold mt-1 ${netFlow >= 0 ? 'text-gray-900' : 'text-rose-600'}`}
            >
              {formatCurrency(netFlow, settings)}
            </motion.h3>
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
            <p className="text-sm font-medium text-gray-500">Avg. Daily Spend</p>
            <motion.h3
              initial={{ y: 5, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold mt-1 text-gray-900"
            >
              {formatCurrency(avgDailySpend, settings)}
            </motion.h3>
          </div>
          <div className="mt-4 flex justify-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}