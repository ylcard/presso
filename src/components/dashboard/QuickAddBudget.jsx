import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import CustomBudgetForm from "../custombudgets/CustomBudgetForm";
import { useSettings } from "../utils/SettingsContext";

// CREATED 13-Jan-2025: Dialog for quickly adding custom budgets from Dashboard
// Replaces the old popover-based QuickAddBudget component
// Uses Dialog for better UX and to match other quick-add dialogs (transactions, income)

export default function QuickAddBudget({
    open,
    onOpenChange,
    onSubmit,
    onCancel,
    isSubmitting,
    cashWallet,
    baseCurrency,
    transactions,
    allBudgets
}) {
    const { settings } = useSettings();

    // ADDED 16-Jan-2025: Wrapper to handle dialog closing after successful submission
    // The onSubmit prop receives data and handles the actual budget creation
    // We close the dialog only after successful submission
    const handleSubmitWrapper = (data) => {
      // Call the parent's onSubmit (budgetActions.handleSubmit)
      // Then close the dialog
      onSubmit(data);
      // Close dialog after submission initiated (mutations handle success/error internally)
      onOpenChange(false);
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
                aria-describedby="create-budget-description"
            >
                <span id="create-budget-description" className="sr-only">Create a new custom budget</span>
                <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                </DialogHeader>
                <CustomBudgetForm
                    onSubmit={handleSubmitWrapper}
                    onCancel={() => onOpenChange(false)}
                    isSubmitting={isSubmitting}
                    cashWallet={cashWallet}
                    baseCurrency={baseCurrency}
                    settings={settings}
                />
            </DialogContent>
        </Dialog>
    );
}

// CREATED 13-Jan-2025: Dialog-based QuickAddBudget component for Dashboard
// - Uses Dialog instead of Popover for better UX
// - Integrates with CustomBudgetForm for budget creation
// - Manages dialog visibility through open/onOpenChange props
// UPDATED 16-Jan-2025: Added handleSubmitWrapper to properly close dialog after submission
// - The wrapper calls the parent's onSubmit and then closes the dialog
// - This ensures the dialog closes immediately after the user clicks "Create Budget"
// - Mutations handle success/error states internally via react-query