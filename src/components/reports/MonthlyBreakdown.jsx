
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Circle } from "lucide-react";
import { useSettings } from "../utils/SettingsContext";
import { formatCurrency } from "../utils/formatCurrency";
import { iconMap } from "../utils/iconMapConfig";
import { getProgressBarColor } from "../utils/progressBarColor";

export default function MonthlyBreakdown({ transactions, categories, monthlyIncome, isLoading }) {
  const { settings } = useSettings();
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const expensesByCategory = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const categoryId = t.category_id || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + t.amount;
      return acc;
    }, {});

  const totalExpenses = Object.values(expensesByCategory).reduce((sum, val) => sum + val, 0);

  const categoryBreakdown = Object.entries(expensesByCategory)
    .filter(([_, amount]) => amount > 0) // Filter out categories with $0
    .map(([categoryId, amount]) => {
      const category = categoryMap[categoryId];
      return {
        name: category?.name || 'Uncategorized',
        icon: category?.icon,
        color: category?.color || '#94A3B8',
        amount,
        percentage: monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0,
        expensePercentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      };
    })
    .sort((a, b) => b.amount - a.amount);

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Monthly Budget Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-96 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Monthly Budget Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Income</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyIncome, settings)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses, settings)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {categoryBreakdown.map((item, index) => {
            const IconComponent = item.icon && iconMap[item.icon] ? iconMap[item.icon] : Circle;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${item.color}20` }}
                    >
                      <IconComponent className="w-5 h-5" style={{ color: item.color }} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        {item.expensePercentage.toFixed(1)}% of expenses
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(item.amount, settings)}</p>
                    <p className="text-sm text-gray-500">
                      {item.percentage.toFixed(1)}% of income
                    </p>
                  </div>
                </div>
                <Progress
                  value={item.expensePercentage}
                  className="h-2"
                  style={{ '--progress-background': getProgressBarColor(item.expensePercentage) }}
                />
              </div>
            );
          })}
        </div>

        {categoryBreakdown.length === 0 && (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <p>No expenses to show yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
