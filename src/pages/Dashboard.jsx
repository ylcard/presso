import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Wallet as WalletIcon } from "lucide-react";
import { useSettings } from "../components/utils/SettingsContext";
import { usePeriod } from "../components/hooks/usePeriod";
import {
  useTransactions,
  useCategories,
  useGoals,
  useCustomBudgetsAll,
  useSystemBudgetsAll,
  useSystemBudgetsForPeriod,
  useSystemBudgetManagement,
  useCashWallet,
} from "../components/hooks/useBase44Entities";
import {
  usePaidTransactions,
  useMonthlyTransactions,
  useMonthlyIncome,
  useDashboardSummary,
  useActiveBudgets,
} from "../components/hooks/useDerivedData";
import {
  useTransactionMutationsDashboard,
  useCustomBudgetActions,
} from "../components/hooks/useActions";
import { useCashWalletActions } from "../components/cashwallet/useCashWalletActions";

import QuickAddTransaction from "../components/transactions/QuickAddTransaction";
import QuickAddIncome from "../components/transactions/QuickAddIncome";
import QuickAddBudget from "../components/dashboard/QuickAddBudget";
import RemainingBudgetCard from "../components/dashboard/RemainingBudgetCard";
import RecentTransactions from "../components/dashboard/RecentTransactions";
import MonthNavigator from "../components/ui/MonthNavigator";
import BudgetBars from "../components/dashboard/BudgetBars";
import CashWalletCard from "../components/cashwallet/CashWalletCard";
import CashWithdrawDialog from "../components/cashwallet/CashWithdrawDialog";
import CashDepositDialog from "../components/cashwallet/CashDepositDialog";

export default function Dashboard() {
  const { user, settings } = useSettings();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showQuickAddIncome, setShowQuickAddIncome] = useState(false);
  const [showQuickAddBudget, setShowQuickAddBudget] = useState(false);

  // Period management
  const { selectedMonth, setSelectedMonth, selectedYear, setSelectedYear, displayDate, monthStart, monthEnd } = usePeriod();

  // Data fetching
  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { goals } = useGoals(user);
  const { allCustomBudgets } = useCustomBudgetsAll(user);
  const { allSystemBudgets } = useSystemBudgetsAll(user);
  const { systemBudgets, isLoading: loadingSystemBudgets } = useSystemBudgetsForPeriod(user, monthStart, monthEnd);
  const { cashWallet } = useCashWallet(user);

  // System budget management (auto-creation/update)
  useSystemBudgetManagement(user, selectedMonth, selectedYear, goals, transactions, systemBudgets, monthStart, monthEnd);

  // Derived data
  const paidTransactions = usePaidTransactions(transactions);
  const monthlyTransactions = useMonthlyTransactions(transactions, selectedMonth, selectedYear);
  const monthlyIncome = useMonthlyIncome(monthlyTransactions);
  const { remainingBudget, currentMonthIncome, currentMonthExpenses } = useDashboardSummary(
    transactions,
    selectedMonth,
    selectedYear,
    allCustomBudgets,
    systemBudgets
  );
  const { activeCustomBudgets, allActiveBudgets } = useActiveBudgets(
    allCustomBudgets,
    allSystemBudgets,
    selectedMonth,
    selectedYear
  );

  // Actions
  const transactionActions = useTransactionMutationsDashboard(setShowQuickAdd, setShowQuickAddIncome);
  const budgetActions = useCustomBudgetActions(user, transactions, cashWallet);
  const cashWalletActions = useCashWalletActions(user, cashWallet, categories);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, {user?.full_name || 'User'}!</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowQuickAddIncome(true)}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Income
            </Button>
            <Button
              onClick={() => setShowQuickAdd(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Expense
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

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <RemainingBudgetCard
              remainingBudget={remainingBudget}
              currentMonthIncome={currentMonthIncome}
              currentMonthExpenses={currentMonthExpenses}
              settings={settings}
            />
          </div>
          <div className="md:col-span-1">
            <CashWalletCard
              cashWallet={cashWallet}
              settings={settings}
              onWithdraw={cashWalletActions.openWithdrawDialog}
              onDeposit={cashWalletActions.openDepositDialog}
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <BudgetBars
              systemBudgets={systemBudgets}
              customBudgets={activeCustomBudgets}
              allCustomBudgets={allCustomBudgets}
              transactions={transactions}
              categories={categories}
              currentMonth={selectedMonth}
              currentYear={selectedYear}
              settings={settings}
              goals={goals}
              monthlyIncome={monthlyIncome}
              baseCurrency={settings.baseCurrency}
              onDeleteBudget={budgetActions.handleDelete}
              onCompleteBudget={(id) => budgetActions.handleStatusChange(id, 'completed')}
              onCreateBudget={() => {
                budgetActions.setEditingBudget(null);
                setShowQuickAddBudget(true);
              }}
            />
          </div>

          <div className="lg:col-span-1">
            <RecentTransactions
              transactions={paidTransactions}
              categories={categories}
              settings={settings}
            />
          </div>
        </div>

        <QuickAddTransaction
          open={showQuickAdd}
          onOpenChange={setShowQuickAdd}
          categories={categories}
          customBudgets={allActiveBudgets}
          onSubmit={transactionActions.createTransaction}
          isSubmitting={transactionActions.isCreating}
        />

        <QuickAddIncome
          open={showQuickAddIncome}
          onOpenChange={setShowQuickAddIncome}
          onSubmit={transactionActions.createTransaction}
          isSubmitting={transactionActions.isCreating}
        />

        {showQuickAddBudget && (
          <QuickAddBudget
            onSubmit={budgetActions.handleSubmit}
            onCancel={() => setShowQuickAddBudget(false)}
            isSubmitting={budgetActions.isSubmitting}
            cashWallet={cashWallet}
            baseCurrency={settings.baseCurrency}
          />
        )}

        <CashWithdrawDialog
          open={cashWalletActions.withdrawDialogOpen}
          onOpenChange={cashWalletActions.setWithdrawDialogOpen}
          categories={categories}
          onSubmit={cashWalletActions.handleWithdraw}
          isSubmitting={cashWalletActions.isWithdrawing}
          cashWallet={cashWallet}
        />

        <CashDepositDialog
          open={cashWalletActions.depositDialogOpen}
          onOpenChange={cashWalletActions.setDepositDialogOpen}
          onSubmit={cashWalletActions.handleDeposit}
          isSubmitting={cashWalletActions.isDepositing}
          cashWallet={cashWallet}
        />
      </div>
    </div>
  );
}