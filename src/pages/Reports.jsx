import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSettings } from "../components/utils/SettingsContext";
import { getCurrentMonthTransactions } from "../components/utils/budgetCalculations";

import MonthlyBreakdown from "../components/reports/MonthlyBreakdown";
import PriorityChart from "../components/reports/PriorityChart";
import GoalSettings from "../components/reports/GoalSettings";
import MonthNavigator from "../components/ui/MonthNavigator";

export default function Reports() {
  const { user } = useSettings();
  const queryClient = useQueryClient();
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: transactions = [], isLoading: loadingTransactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const { data: goals = [], isLoading: loadingGoals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const allGoals = await base44.entities.BudgetGoal.list();
      return user ? allGoals.filter(g => g.user_email === user.email) : [];
    },
    enabled: !!user,
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.BudgetGoal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: (data) => base44.entities.BudgetGoal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });

  // Filter transactions for the selected month
  const monthlyTransactions = useMemo(() => {
    return getCurrentMonthTransactions(transactions, selectedMonth, selectedYear);
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate monthly income from actual transactions
  const monthlyIncome = useMemo(() => {
    return monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [monthlyTransactions]);

  const handleGoalUpdate = async (priority, percentage) => {
    const existingGoal = goals.find(g => g.priority === priority);
    
    if (existingGoal) {
      await updateGoalMutation.mutateAsync({
        id: existingGoal.id,
        data: { target_percentage: percentage }
      });
    } else if (user) {
      await createGoalMutation.mutateAsync({
        priority,
        target_percentage: percentage,
        user_email: user.email
      });
    }
  };

  const isLoading = loadingTransactions || loadingCategories || loadingGoals;
  
  const displayDate = new Date(selectedYear, selectedMonth);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reports & Goals</h1>
          <p className="text-gray-500 mt-1">
            Analyze your spending for {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <MonthNavigator
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onMonthChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <MonthlyBreakdown
              transactions={monthlyTransactions}
              categories={categories}
              monthlyIncome={monthlyIncome}
              isLoading={isLoading}
            />

            <PriorityChart
              transactions={monthlyTransactions}
              categories={categories}
              goals={goals}
              monthlyIncome={monthlyIncome}
              isLoading={isLoading}
            />
          </div>

          <div>
            <GoalSettings
              goals={goals}
              onGoalUpdate={handleGoalUpdate}
              isLoading={isLoading}
              isSaving={updateGoalMutation.isPending || createGoalMutation.isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}