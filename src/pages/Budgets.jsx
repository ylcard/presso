import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { useSettings } from "../components/utils/SettingsContext";
import { formatDate } from "../components/utils/formatDate";
import { usePeriod } from "../components/hooks/usePeriod";
import { useTransactions, useCategories, useCustomBudgetsAll, useSystemBudgetsAll, useCashWallet } from "../components/hooks/useBase44Entities";
import { useBudgetsAggregates } from "../components/hooks/useDerivedData";
import { useCustomBudgetActions } from "../components/hooks/useActions";
import CustomBudgetForm from "../components/custombudgets/CustomBudgetForm";
import BudgetCard from "../components/budgets/BudgetCard";
import MonthNavigator from "../components/ui/MonthNavigator";
import { motion, AnimatePresence } from "framer-motion";

export default function BudgetsPage() {
  const { settings, user } = useSettings();
  const { selectedMonth, selectedYear, setSelectedMonth, setSelectedYear, displayDate } = usePeriod();
  const [budgetToDelete, setBudgetToDelete] = useState(null);

  const { transactions } = useTransactions();
  const { categories } = useCategories();
  const { allCustomBudgets } = useCustomBudgetsAll(user);
  const { allSystemBudgets } = useSystemBudgetsAll(user);
  const { cashWallet } = useCashWallet(user);

  const { customBudgets, systemBudgetsWithStats, groupedCustomBudgets } = useBudgetsAggregates(
    transactions,
    categories,
    allCustomBudgets,
    allSystemBudgets,
    selectedMonth,
    selectedYear
  );

  const budgetActions = useCustomBudgetActions(user, transactions, cashWallet);

  const handleDeleteConfirm = () => {
    if (budgetToDelete) {
      budgetActions.handleDelete(budgetToDelete);
      setBudgetToDelete(null);
    }
  };

  // Sort custom budgets by status and date proximity
  const sortedCustomBudgets = (status) => {
    const budgets = groupedCustomBudgets[status] || [];
    const now = new Date();
    
    return budgets.sort((a, b) => {
      const aStart = new Date(a.startDate);
      const bStart = new Date(b.startDate);
      
      // Calculate distance from today
      const aDistance = Math.abs(aStart.getTime() - now.getTime());
      const bDistance = Math.abs(bStart.getTime() - now.getTime());
      
      return aDistance - bDistance;
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-500 mt-1">
              Manage your budgets for {formatDate(displayDate, settings.dateFormat)}
            </p>
          </div>
          <MonthNavigator
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
          />
        </div>

        <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-blue-900">System Budgets</CardTitle>
              <p className="text-sm text-blue-700 mt-1">
                Automatically managed based on your budget goals. These update based on your monthly income.
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {systemBudgetsWithStats.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  stats={budget.preCalculatedStats}
                  settings={settings}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Custom Budgets</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Custom budgets containing wants expenses, sorted by status and date
              </p>
            </div>
            <Popover open={budgetActions.showForm} onOpenChange={budgetActions.setShowForm}>
              <PopoverTrigger asChild>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Custom Budget
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[600px] max-h-[90vh] overflow-y-auto"
                align="center"
                side="top"
                sideOffset={10}
                style={{
                  position: 'fixed',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 100
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Create Custom Budget</h3>
                    <CustomBudgetForm
                      onSubmit={budgetActions.handleSubmit}
                      onCancel={() => budgetActions.setShowForm(false)}
                      isSubmitting={budgetActions.isSubmitting}
                      cashWallet={cashWallet}
                      baseCurrency={settings.baseCurrency}
                      settings={settings}
                    />
                  </div>
                </motion.div>
              </PopoverContent>
            </Popover>
          </CardHeader>
          <CardContent>
            {customBudgets.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-gray-400">
                <p>No custom budgets yet. Create your first one!</p>
              </div>
            ) : (
              <div className="space-y-6">
                <AnimatePresence mode="wait">
                  {['active', 'planned', 'completed'].map(status => {
                    const budgets = sortedCustomBudgets(status);
                    if (budgets.length === 0) return null;

                    return (
                      <motion.div
                        key={status}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="mb-3">
                          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                            {status === 'active' ? 'Active' : status === 'planned' ? 'Planned' : 'Completed'} ({budgets.length})
                          </h3>
                        </div>
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {budgets.map((budget) => (
                            <BudgetCard
                              key={budget.id}
                              budget={budget}
                              stats={null}
                              settings={settings}
                              onDelete={() => setBudgetToDelete(budget.id)}
                            />
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={!!budgetToDelete} onOpenChange={() => setBudgetToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Budget</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this budget? All associated transactions will also be deleted. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

// MAJOR UI ENHANCEMENT 2025-01-12: Fixed popover positioning to prevent jarring jumps
// - Changed PopoverContent to use fixed positioning with center alignment
// - Added inline styles: position: fixed, top: 50%, left: 50%, transform: translate(-50%, -50%)
// - Added framer-motion for smooth scale animation when popover opens
// - Popover now stays centered and grows in place when "Add Cash" is clicked
// - No more jumping around the page when form content changes