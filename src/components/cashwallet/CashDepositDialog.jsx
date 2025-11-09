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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";
import { useSettings } from "../utils/SettingsContext";
import { formatDateString, normalizeAmount } from "../utils/budgetCalculations";
import { SUPPORTED_CURRENCIES } from "../utils/currencyCalculations";

export default function CashDepositDialog({ 
  open, 
  onOpenChange, 
  onSubmit,
  cashWallet,
  isSubmitting 
}) {
  const { settings } = useSettings();
  const balances = cashWallet?.balances || [];
  
  const [formData, setFormData] = useState({
    title: 'Cash Deposit to Bank',
    amount: '',
    currency: balances.length > 0 ? balances[0].currencyCode : (settings.baseCurrency || 'USD'),
    date: formatDateString(new Date()),
    notes: ''
  });

  const selectedCurrencySymbol = SUPPORTED_CURRENCIES.find(
    c => c.code === formData.currency
  )?.symbol || formData.currency;

  const selectedBalance = balances.find(b => b.currencyCode === formData.currency);
  const availableAmount = selectedBalance?.amount || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = normalizeAmount(formData.amount);
    
    onSubmit({
      ...formData,
      amount: parseFloat(normalizedAmount)
    });
    
    // Reset form
    setFormData({
      title: 'Cash Deposit to Bank',
      amount: '',
      currency: balances.length > 0 ? balances[0].currencyCode : (settings.baseCurrency || 'USD'),
      date: formatDateString(new Date()),
      notes: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Deposit Cash to Bank</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Cash Deposit, Bank Deposit"
              required
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {balances.map((balance) => (
                  <SelectItem key={balance.currencyCode} value={balance.currencyCode}>
                    {balance.currencyCode} (Available: {balance.amount.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <AmountInput
                id="amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                currencySymbol={selectedCurrencySymbol}
                required
              />
              <p className="text-xs text-gray-500">
                Available: {selectedCurrencySymbol}{availableAmount.toFixed(2)}
              </p>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isSubmitting ? 'Processing...' : 'Deposit to Bank'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}