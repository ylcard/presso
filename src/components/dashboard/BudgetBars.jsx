
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { getMiniBudgetStats, getSystemBudgetStats, getDirectUnpaidExpenses } from "../utils/budgetCalculations";
import { formatCurrency } from "../utils/formatCurrency";
import BudgetBar from "../minibudgets/BudgetBar";

export default function BudgetBars({ systemBudgets, miniBudgets, allMiniBudgets = [], transactions, categories, currentMonth, currentYear, settings, goals, monthlyIncome, onDeleteBudget, onCompleteBudget, onCreateBudget }) {
  const [customStartIndex, setCustomStartIndex] = useState(0);
  const barsPerPage = 7;

  const { systemBudgetsData, customBudgetsData, totalActualSavings, savingsTarget, savingsShortfall } = useMemo(() => {
    const system = systemBudgets.sort((a, b) => {
      const order = { needs: 0, wants: 1, savings: 2 };
      return order[a.systemBudgetType] - order[b.systemBudgetType];
    });
    
    const custom = miniBudgets.filter(mb => mb.status === 'active' || mb.status === 'completed');
    
    const goalMap = goals.reduce((acc, goal) => {
      acc[goal.priority] = goal.target_percentage;
      return acc;
    }, {});
    
    const activeCustom = custom.filter(mb => mb.status === 'active');
    
    // Process system budgets - stats now include ALL transactions (comprehensive)
    const systemBudgetsData = system.map(sb => {
      const budgetForStats = {
        ...sb,
        allocatedAmount: sb.budgetAmount
      };
      
      // getSystemBudgetStats now returns comprehensive paid/unpaid amounts
      const stats = getSystemBudgetStats(budgetForStats, transactions, categories, allMiniBudgets);
      const targetPercentage = goalMap[sb.systemBudgetType] || 0;
      const targetAmount = sb.budgetAmount;
      
      let expectedAmount = 0;
      
      if (sb.systemBudgetType === 'wants') {
        // For Wants: calculate direct unpaid + unpaid expenses within active custom budgets
        const directUnpaid = getDirectUnpaidExpenses(budgetForStats, transactions, categories, allMiniBudgets);
        
        // Sum BOTH remaining and unpaid from each active Wants custom budget
        const activeCustomExpected = activeCustom.reduce((sum, cb) => {
          const cbStats = getMiniBudgetStats(cb, transactions);
          // Expected = remaining (not yet spent) + unpaid (committed but not paid)
          //return sum + cbStats.remaining + cbStats.unpaidAmount;
          // Simpler
          return sum + (cb.allocatedAmount - cbStats.paidAmount);
        }, 0);
        
        expectedAmount = directUnpaid + activeCustomExpected;
      } else if (sb.systemBudgetType === 'needs') {
        // For Needs: just direct unpaid expenses
        expectedAmount = getDirectUnpaidExpenses(budgetForStats, transactions, categories, allMiniBudgets);
      } else if (sb.systemBudgetType === 'savings') {
        // For Savings: no expected amount
        expectedAmount = 0;
      }
      
      // actualTotal now uses comprehensive stats.paidAmount + calculated expectedAmount
      const actualTotal = expectedAmount + stats.paidAmount;
      const maxHeight = Math.max(targetAmount, actualTotal);
      const isOverBudget = actualTotal > targetAmount;
      const overBudgetAmount = isOverBudget ? actualTotal - targetAmount : 0;
      
      return {
        ...sb,
        stats,
        targetAmount,
        targetPercentage,
        expectedAmount,
        maxHeight,
        isOverBudget,
        overBudgetAmount
      };
    });
    
    // Process custom budgets
    const customBudgetsData = custom.map(mb => {
      const stats = getMiniBudgetStats(mb, transactions);
      const maxHeight = Math.max(mb.allocatedAmount, stats.totalSpent);
      const isOverBudget = stats.totalSpent > mb.allocatedAmount;
      const overBudgetAmount = isOverBudget ? stats.totalSpent - mb.allocatedAmount : 0;
      
      return {
        ...mb,
        originalAllocatedAmount: mb.originalAllocatedAmount || mb.allocatedAmount,
        stats,
        maxHeight,
        isOverBudget,
        overBudgetAmount
      };
    });
    
    // Calculate savings
    const savingsBudget = systemBudgetsData.find(sb => sb.systemBudgetType === 'savings');
    const savingsTargetAmount = savingsBudget ? savingsBudget.targetAmount : 0;
    
    const needsBudget = systemBudgetsData.find(sb => sb.systemBudgetType === 'needs');
    const wantsBudget = systemBudgetsData.find(sb => sb.systemBudgetType === 'wants');
    
    const totalSpent = 
      (needsBudget ? needsBudget.stats.paidAmount + needsBudget.expectedAmount : 0) +
      (wantsBudget ? wantsBudget.stats.paidAmount + wantsBudget.expectedAmount : 0);
    
    const automaticSavings = Math.max(0, monthlyIncome - totalSpent);
    const manualSavings = savingsBudget ? savingsBudget.stats.paidAmount : 0;
    const totalActualSavings = automaticSavings + manualSavings;
    const savingsShortfall = Math.max(0, savingsTargetAmount - totalActualSavings);
    
    if (savingsBudget) {
      savingsBudget.actualSavings = totalActualSavings;
      savingsBudget.savingsTarget = savingsTargetAmount;
      savingsBudget.maxHeight = Math.max(savingsTargetAmount, totalActualSavings);
    }
    
    return { 
      systemBudgetsData, 
      customBudgetsData,
      totalActualSavings,
      savingsTarget: savingsTargetAmount,
      savingsShortfall
    };
  }, [systemBudgets, miniBudgets, allMiniBudgets, transactions, goals, monthlyIncome, categories]);

  const visibleCustomBudgets = customBudgetsData.slice(customStartIndex, customStartIndex + barsPerPage);
  const canScrollLeft = customStartIndex > 0;
  const canScrollRight = customStartIndex + barsPerPage < customBudgetsData.length;

  return (
    <div className="space-y-6">
      {savingsShortfall > 0 && (
        <Card className="border-none shadow-lg bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-semibold text-orange-900">
                  Savings Target Not Met
                </p>
                <p className="text-sm text-orange-700">
                  You're short {formatCurrency(savingsShortfall, settings)} of your savings goal. 
                  Target: {formatCurrency(savingsTarget, settings)}, Actual: {formatCurrency(totalActualSavings, settings)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {systemBudgetsData.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-sm bg-blue-50 text-blue-600">
                System Budgets
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {systemBudgetsData.map((budget) => (
                <BudgetBar
                  key={budget.id}
                  budget={budget}
                  isCustom={false}
                  isSystemSavings={budget.systemBudgetType === 'savings'}
                  settings={settings}
                  onDelete={onDeleteBudget}
                  onComplete={onCompleteBudget}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {customBudgetsData.length > 0 && (
        <Card className="border-none shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg text-sm bg-purple-50 text-purple-600">
                Custom Budgets
              </span>
              <span className="text-gray-400">({customBudgetsData.length})</span>
            </div>
            <div className="flex items-center gap-2">
              {customBudgetsData.length > barsPerPage && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomStartIndex(Math.max(0, customStartIndex - 1))}
                    disabled={!canScrollLeft}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomStartIndex(customStartIndex + 1)}
                    disabled={!canScrollRight}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={onCreateBudget}>
                <Plus className="w-4 h-4 mr-2" />
                New Budget
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {visibleCustomBudgets.map((budget) => (
                <BudgetBar
                  key={budget.id}
                  budget={budget}
                  isCustom={true}
                  settings={settings}
                  onDelete={onDeleteBudget}
                  onComplete={onCompleteBudget}
                />
              ))}
            </div>

            {customBudgetsData.length > barsPerPage && (
              <div className="flex justify-center gap-1 mt-4">
                {Array.from({ length: Math.ceil(customBudgetsData.length / barsPerPage) }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-2 rounded-full transition-all ${
                      Math.floor(customStartIndex / barsPerPage) === idx
                        ? 'w-8 bg-purple-600'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
