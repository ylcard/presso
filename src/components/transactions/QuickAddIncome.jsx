import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
// UPDATED 15-Jan-2025: Changed Button import to CustomButton
import { CustomButton } from "@/components/ui/CustomButton";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";
// UPDATED 12-Jan-2025: Changed imports to use dateUtils.js and generalUtils.js
import { formatDateString } from "../utils/dateUtils";
import { normalizeAmount } from "../utils/generalUtils";

export default function QuickAddIncome({ 
  open, 
  onOpenChange, 
  onSubmit, 
  isSubmitting,
  renderTrigger = true, // NEW: Control whether to render the trigger button
  triggerVariant = "default", // NEW: Allow customization of trigger button style
  triggerSize = "default", // NEW: Allow customization of trigger button size
  triggerClassName = "" // NEW: Allow custom classes for trigger button
}) {
  const [formData, setFormData] = useState({
    title: '',
    amount: null,
    type: 'income',
    date: formatDateString(new Date())
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = normalizeAmount(formData.amount);
    
    onSubmit({
      ...formData,
      amount: parseFloat(normalizedAmount)
    });
    
    // Reset form
    setFormData({
      title: '',
      amount: null,
      type: 'income',
      date: formatDateString(new Date())
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {renderTrigger && (
        <DialogTrigger asChild>
          {/* UPDATED 15-Jan-2025: Changed to CustomButton */}
          <CustomButton 
            variant={triggerVariant}
            size={triggerSize}
            className={triggerClassName}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Income
          </CustomButton>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <DialogHeader>
          <DialogTitle>Quick Add Income</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Income Source</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Salary, Freelance Project"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <AmountInput
                id="amount"
                value={formData.amount}
                onChange={(value) => setFormData({ ...formData, amount: value })}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <DatePicker
                value={formData.date}
                onChange={(value) => setFormData({ ...formData, date: value })}
                placeholder="Pick a date"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            {/* UPDATED 15-Jan-2025: Changed to CustomButton with outline variant */}
            <CustomButton type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </CustomButton>
            {/* UPDATED 15-Jan-2025: Changed to CustomButton with success variant */}
            <CustomButton
              type="submit"
              disabled={isSubmitting}
              variant="success"
            >
              {isSubmitting ? 'Adding...' : 'Add Income'}
            </CustomButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ENHANCEMENT (13-Jan-2025): Added trigger button to QuickAddIncome component
// - Now renders its own "Add Income" button by default
// - Added renderTrigger prop to control button visibility (for backward compatibility)
// - Added triggerVariant, triggerSize, and triggerClassName props for button customization
// - Dialog is now properly centered using fixed positioning (top-1/2 left-1/2 transform)
// UPDATED 12-Jan-2025: Changed imports to use dateUtils.js and generalUtils.js instead of budgetCalculations.jsx
// UPDATED 15-Jan-2025: Replaced Button with CustomButton
// - Trigger button uses customizable variant (default or ghost depending on context)
// - Cancel button uses outline variant
// - Submit button uses success variant (green) to match income theme