import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Quick Add Expense</DialogTitle>
        </DialogHeader>
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
      </DialogContent>
    </Dialog>
  );
}

// ISSUE FIX (2025-01-11): Changed from Popover to Dialog to match QuickAddIncome design
// Removed the PopoverTrigger button that was causing an orphaned "Add Expense" button at the bottom
// Now properly controlled via open/onOpenChange props like QuickAddIncome