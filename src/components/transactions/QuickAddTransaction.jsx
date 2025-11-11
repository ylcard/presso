import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSettings } from "../utils/SettingsContext";
import { useCashWallet } from "../hooks/useBase44Entities";
import TransactionFormContent from "./TransactionFormContent";

export default function QuickAddTransaction({ 
  open, 
  onOpenChange, 
  categories, 
  customBudgets, 
  defaultCustomBudgetId = '', 
  onSubmit, 
  isSubmitting,
  transactions = []
}) {
  const { user } = useSettings();
  const { cashWallet } = useCashWallet(user);

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Quick Add Expense</h3>
          <TransactionFormContent
            initialTransaction={defaultCustomBudgetId ? {
              customBudgetId: defaultCustomBudgetId,
              date: customBudgets.find(b => b.id === defaultCustomBudgetId)?.startDate
            } : null}
            categories={categories}
            allBudgets={customBudgets}
            onSubmit={onSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
            cashWallet={cashWallet}
            transactions={transactions}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ISSUE FIX (2025-01-11): Removed max-h-[600px] and overflow-y-auto from PopoverContent
// to ensure action buttons are always visible without needing to scroll