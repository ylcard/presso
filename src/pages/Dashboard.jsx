
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateRemainingBudget, getCurrentMonthTransactions, getFirstDayOfMonth, getLastDayOfMonth, getUnpaidExpensesForMonth } from "../components/utils/budgetCalculations";
import { useSettings } from "../components/utils/SettingsContext";

import RemainingBudgetCard from "../components/dashboard/RemainingBudgetCard";
import BudgetBars from "../components/dashboard/BudgetBars";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import QuickAddTransaction from "../components/transactions/QuickAddTransaction";
import QuickAddIncome from "../components/transactions/QuickAddIncome";
import QuickAddBudget from "../components/dashboard/QuickAddBudget"; // Added import
import MonthNavigator from "../components/ui/MonthNavigator";

export default function Dashboard() {
  const { settings, user } = useSettings();
  const queryClient = useQueryClient();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showQuickAddIncome, setShowQuickAddIncome] = useState(false);
  const [showQuickAddBudget, setShowQuickAddBudget] = useState(false); // Added state
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
    initialData: [],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      if (!user) return [];
      const allGoals = await base44.entities.BudgetGoal.list();
      return allGoals.filter(g => g.user_email === user.email);
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: allMiniBudgets = [] } = useQuery({
    queryKey: ['miniBudgets'],
    queryFn: async () => {
      if (!user) return [];
      const all = await base44.entities.MiniBudget.list('-startDate');
      return all.filter(mb => mb.user_email === user.email);
    },
    initialData: [],
    enabled: !!user,
  });

  const { data: allSystemBudgets = [] } = useQuery({
    queryKey: ['allSystemBudgets'],
    queryFn: async () => {
      if (!user) return [];
      const all = await base44.entities.SystemBudget.list();
      return all.filter(sb => sb.user_email === user.email);
    },
    initialData: [],
    enabled: !!user,
  });

  // Query system budgets filtered by current month
  const monthStart = useMemo(() => getFirstDayOfMonth(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const monthEnd = useMemo(() => getLastDayOfMonth(selectedMonth, selectedYear), [selectedMonth, selectedYear]);

  const { data: systemBudgets = [] } = useQuery({
    queryKey: ['systemBudgets', selectedMonth, selectedYear],
    queryFn: async () => {
      if (!user) return [];
      const all = await base44.entities.SystemBudget.list();
      // Filter to only this month's budgets
      return all.filter(sb => 
        sb.user_email === user.email &&
        sb.startDate === monthStart && 
        sb.endDate === monthEnd
      );
    },
    initialData: [],
    enabled: !!user,
  });

  // Create or update system budgets for the selected month
  useEffect(() => {
    const ensureSystemBudgets = async () => {
      if (!user || goals.length === 0) return;
      
      try {
        const systemTypes = ['needs', 'wants', 'savings'];
        const colors = { needs: '#EF4444', wants: '#F59E0B', savings: '#10B981' };
        
        // Calculate monthly income
        const currentMonthIncome = getCurrentMonthTransactions(transactions, selectedMonth, selectedYear)
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const goalMap = goals.reduce((acc, goal) => {
          acc[goal.priority] = goal.target_percentage;
          return acc;
        }, {});
        
        let needsInvalidation = false;

        for (const type of systemTypes) {
          // Check if budget exists for this type
          const existingBudget = systemBudgets.find(sb => sb.systemBudgetType === type);
          const percentage = goalMap[type] || 0;
          const amount = parseFloat(((currentMonthIncome * percentage) / 100).toFixed(2));
          
          if (existingBudget) {
            // Update if amount changed
            if (Math.abs(existingBudget.budgetAmount - amount) > 0.01) {
              await base44.entities.SystemBudget.update(existingBudget.id, {
                budgetAmount: amount
              });
              needsInvalidation = true;
            }
          } else {
            // Double-check no budget exists before creating (防止race conditions)
            const allSystemBudgetsCheck = await base44.entities.SystemBudget.list();
            const duplicateCheck = allSystemBudgetsCheck.find(sb => 
              sb.user_email === user.email &&
              sb.systemBudgetType === type &&
              sb.startDate === monthStart &&
              sb.endDate === monthEnd
            );
            
            if (!duplicateCheck) {
              // Create new system budget
              await base44.entities.SystemBudget.create({
                name: type.charAt(0).toUpperCase() + type.slice(1),
                budgetAmount: amount,
                startDate: monthStart,
                endDate: monthEnd,
                color: colors[type],
                user_email: user.email,
                systemBudgetType: type
              });
              needsInvalidation = true;
            }
          }
        }
        
        if (needsInvalidation) {
          queryClient.invalidateQueries({ queryKey: ['systemBudgets'] });
          queryClient.invalidateQueries({ queryKey: ['allSystemBudgets'] }); // Invalidate the new query as well
        }
      } catch (error) {
        console.error('Error in ensureSystemBudgets:', error);
      }
    };
    
    if (user && goals.length > 0 && systemBudgets !== undefined) {
      ensureSystemBudgets();
    }
  }, [user, selectedMonth, selectedYear, goals, systemBudgets, monthStart, monthEnd, queryClient, transactions]);

  const activeMiniBudgets = useMemo(() => {
    const monthStart = getFirstDayOfMonth(selectedMonth, selectedYear);
    const monthEnd = getLastDayOfMonth(selectedMonth, selectedYear);
    
    return allMiniBudgets.filter(mb => {
      if (mb.status !== 'active' && mb.status !== 'completed') return false;
      return mb.startDate <= monthEnd && mb.endDate >= monthStart;
    });
  }, [allMiniBudgets, selectedMonth, selectedYear]);

  const allActiveBudgets = useMemo(() => {
    const monthStart = getFirstDayOfMonth(selectedMonth, selectedYear);
    const monthEnd = getLastDayOfMonth(selectedMonth, selectedYear);
    
    const activeMini = allMiniBudgets.filter(mb => {
      if (mb.status !== 'active' && mb.status !== 'completed') return false;
      return mb.startDate <= monthEnd && mb.endDate >= monthStart;
    });
    
    const activeSystem = allSystemBudgets
      .filter(sb => sb.startDate === monthStart && sb.endDate === monthEnd)
      .map(sb => ({ ...sb, id: sb.id, name: sb.name, allocatedAmount: sb.budgetAmount, color: sb.color, isSystemBudget: true, startDate: sb.startDate, endDate: sb.endDate, user_email: sb.user_email, systemBudgetType: sb.systemBudgetType, status: 'active' }));
    
    return [...activeSystem, ...activeMini];
  }, [allMiniBudgets, allSystemBudgets, selectedMonth, selectedYear]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['systemBudgets'] });
      setShowQuickAdd(false);
      setShowQuickAddIncome(false);
    },
  });

  const createBudgetMutation = useMutation({
    mutationFn: (data) => base44.entities.MiniBudget.create({
      ...data,
      user_email: user.email,
      isSystemBudget: false
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      setShowQuickAddBudget(false);
    },
  });

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id) => {
      const budgetTransactions = transactions.filter(t => t.miniBudgetId === id);
      
      for (const transaction of budgetTransactions) {
        await base44.entities.Transaction.delete(transaction.id);
      }
      
      await base44.entities.MiniBudget.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const completeBudgetMutation = useMutation({
    mutationFn: async (id) => {
      const budget = allMiniBudgets.find(mb => mb.id === id);
      if (!budget) return;
      
      const budgetTransactions = transactions.filter(t => t.miniBudgetId === id && t.isPaid);
      const actualSpent = budgetTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      await base44.entities.MiniBudget.update(id, { 
        status: 'completed',
        allocatedAmount: actualSpent,
        originalAllocatedAmount: budget.originalAllocatedAmount || budget.allocatedAmount
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const remainingBudget = useMemo(() => {
    return calculateRemainingBudget(transactions, selectedMonth, selectedYear);
  }, [transactions, selectedMonth, selectedYear]);

  const currentMonthIncome = useMemo(() => {
    return getCurrentMonthTransactions(transactions, selectedMonth, selectedYear)
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions, selectedMonth, selectedYear]);

  const currentMonthExpenses = useMemo(() => {
    const paidExpenses = getCurrentMonthTransactions(transactions, selectedMonth, selectedYear)
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const unpaidExpenses = getUnpaidExpensesForMonth(transactions, selectedMonth, selectedYear)
      .reduce((sum, t) => sum + t.amount, 0);
    
    return paidExpenses + unpaidExpenses;
  }, [transactions, selectedMonth, selectedYear]);

  const displayDate = new Date(selectedYear, selectedMonth);

  const [isTransactionsCollapsed, setIsTransactionsCollapsed] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Your financial overview for {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowQuickAddIncome(true)}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Quick Add Income
            </Button>
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4 mr-2" />
              Quick Add Expense
            </Button>
          </div>
        </div>

        <MonthNavigator
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onMonthChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />

        <RemainingBudgetCard
          remaining={remainingBudget}
          income={currentMonthIncome}
          expenses={currentMonthExpenses}
          settings={settings}
        />

        <div className={`grid gap-6 transition-all ${isTransactionsCollapsed ? 'lg:grid-cols-[1fr_80px]' : 'lg:grid-cols-[2fr_1fr]'}`}>
          <BudgetBars
            systemBudgets={systemBudgets}
            miniBudgets={activeMiniBudgets}
            allMiniBudgets={allMiniBudgets}
            transactions={transactions}
            categories={categories}
            currentMonth={selectedMonth}
            currentYear={selectedYear}
            settings={settings}
            goals={goals}
            monthlyIncome={currentMonthIncome}
            onDeleteBudget={(id) => deleteBudgetMutation.mutate(id)}
            onCompleteBudget={(id) => completeBudgetMutation.mutate(id)}
            onCreateBudget={() => setShowQuickAddBudget(true)}
          />

          <RecentTransactions
            transactions={transactions.slice(0, 10)}
            categories={categories}
            miniBudgets={activeMiniBudgets}
            settings={settings}
            isCollapsed={isTransactionsCollapsed}
            onToggleCollapse={() => setIsTransactionsCollapsed(!isTransactionsCollapsed)}
          />
        </div>

        <QuickAddTransaction
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          categories={categories}
          miniBudgets={allActiveBudgets}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />

        <QuickAddIncome
          open={showQuickAddIncome}
          onOpenChange={setShowQuickAddIncome}
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />

        <QuickAddBudget
          open={showQuickAddBudget}
          onOpenChange={setShowQuickAddBudget}
          onSubmit={(data) => createBudgetMutation.mutate(data)}
          isSubmitting={createBudgetMutation.isPending}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
        />
      </div>
    </div>
  );
}
