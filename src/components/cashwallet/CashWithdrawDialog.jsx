import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";
import CategorySelect from "../ui/CategorySelect";
import CurrencySelect from "../ui/CurrencySelect";
import { useSettings } from "../utils/SettingsContext";
import { formatDateString, normalizeAmount } from "../utils/budgetCalculations";
import { SUPPORTED_CURRENCIES } from "../utils/currencyCalculations";

export default function CashWithdrawDialog({ 
  open, 
  onOpenChange, 
  onSubmit, 
  categories,
  isSubmitting 
}) {
  const { settings } = useSettings();
  
  const [formData, setFormData] = useState({
    title: 'Cash Withdrawal',
    amount: '',
    currency: settings.baseCurrency || 'USD',
    date: formatDateString(new Date()),
    category_id: '',
    notes: ''
  });

  const selectedCurrencySymbol = SUPPORTED_CURRENCIES.find(
    c => c.code === formData.currency
  )?.symbol || formData.currency;

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = normalizeAmount(formData.amount);
    
    onSubmit({
      ...formData,
      amount: parseFloat(normalizedAmount)
    });
    
    // Reset form
    setFormData({
      title: 'Cash Withdrawal',
      amount: '',
      currency: settings.baseCurrency || 'USD',
      date: formatDateString(new Date()),
      category_id: '',
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Cash</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., ATM Withdrawal, Cash from Bank"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Cash Amount</Label>
              <AmountInput
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                currencySymbol={selectedCurrencySymbol}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencySelect
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker
              value={formData.date}
              onChange={(value) => setFormData({ ...formData, date: value })}
              placeholder="Pick a date"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (Optional)</Label>
            <CategorySelect
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              categories={categories}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p><strong>Note:</strong> This withdrawal will be recorded as an expense at the current exchange rate. You can edit the transaction later to adjust the actual bank charge.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-blue-700"
            >
              {isSubmitting ? 'Processing...' : 'Withdraw Cash'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}