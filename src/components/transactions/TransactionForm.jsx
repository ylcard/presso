import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
// COMMENTED OUT 16-Jan-2025: Replaced with CustomButton for consistency
// import { Button } from "@/components/ui/button";
import { CustomButton } from "@/components/ui/CustomButton";
import { Pencil } from "lucide-react";
import { useSettings } from "../utils/SettingsContext";
import { useCashWallet, useAllBudgets } from "../hooks/useBase44Entities";
import TransactionFormContent from "./TransactionFormContent";

export default function TransactionForm({ 
  transaction, 
  categories, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  transactions = [],
  trigger = null
}) {
  const { user } = useSettings();
  const { cashWallet } = useCashWallet(user);
  const { allBudgets } = useAllBudgets(user);
  const [open, setOpen] = useState(false);

  const handleCancel = () => {
    setOpen(false);
    if (onCancel) onCancel();
  };

  const handleSubmit = (data) => {
    onSubmit(data);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <CustomButton variant="ghost" size="icon" className="hover:bg-blue-50 hover:text-blue-600 h-7 w-7">
            <Pencil className="w-4 h-4" />
          </CustomButton>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[400px]" align="end">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">
            {transaction ? 'Edit Transaction' : 'Add Transaction'}
          </h3>
          <TransactionFormContent
            initialTransaction={transaction}
            categories={categories}
            allBudgets={allBudgets}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
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
// Previous implementation: max-h-[600px] overflow-y-auto - caused buttons to be cut off
// UPDATED 16-Jan-2025: Replaced Button with CustomButton for edit trigger icon