import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import CustomBudgetForm from "../custombudgets/CustomBudgetForm";

export default function QuickAddBudget({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Custom Budget</DialogTitle>
        </DialogHeader>
        <CustomBudgetForm
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
          isQuickAdd={true}
        />
      </DialogContent>
    </Dialog>
  );
}