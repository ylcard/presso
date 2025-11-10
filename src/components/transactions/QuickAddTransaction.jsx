import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";
import CategorySelect from "../ui/CategorySelect";
import CurrencySelect from "../ui/CurrencySelect";
import { useSettings } from "../utils/SettingsContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { useCashWallet } from "../hooks/useBase44Entities";
import { getCurrencyBalance, getRemainingAllocatedCash } from "../utils/cashAllocationUtils";
import { calculateConvertedAmount, getRateForDate, SUPPORTED_CURRENCIES } from "../utils/currencyCalculations";
import { formatDateString, normalizeAmount, filterBudgetsByTransactionDate } from "../utils/budgetCalculations";

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
  const { user, settings } = useSettings();
  const { toast } = useToast();
  const { exchangeRates, refreshRates, isRefreshing } = useExchangeRates();
  const { cashWallet } = useCashWallet(user);
  
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    originalCurrency: settings.baseCurrency || 'USD',
    type: 'expense',
    category_id: '',
    date: formatDateString(new Date()),
    isPaid: false,
    paidDate: '',
    customBudgetId: defaultCustomBudgetId || '',
    isCashExpense: false
  });

  // Pre-select date and budget when defaultCustomBudgetId is provided
  useEffect(() => {
    if (defaultCustomBudgetId && open) {
      const selectedBudget = customBudgets.find(b => b.id === defaultCustomBudgetId);
      if (selectedBudget) {
        setFormData(prev => ({
          ...prev,
          customBudgetId: defaultCustomBudgetId,
          date: selectedBudget.startDate, // Set to budget's start date
          originalCurrency: settings.baseCurrency || 'USD'
        }));
      }
    }
  }, [defaultCustomBudgetId, open, customBudgets, settings.baseCurrency]);

  useEffect(() => {
    // Reset currency when dialog opens (only if not already set by budget pre-selection)
    if (open && !defaultCustomBudgetId) {
      setFormData(prev => ({ ...prev, originalCurrency: settings.baseCurrency || 'USD' }));
    }
  }, [open, settings.baseCurrency, defaultCustomBudgetId]);

  const isForeignCurrency = formData.originalCurrency !== (settings.baseCurrency || 'USD');

  // Proactively refresh exchange rates when currency or date changes (for foreign currencies only)
  useEffect(() => {
    if (isForeignCurrency && formData.originalCurrency && formData.date && !formData.isCashExpense) {
      refreshRates(
        formData.originalCurrency,
        settings.baseCurrency || 'USD',
        formData.date
      );
    }
  }, [formData.originalCurrency, formData.date, isForeignCurrency, formData.isCashExpense]);

  // Get currency symbol for the selected originalCurrency
  const selectedCurrencySymbol = SUPPORTED_CURRENCIES.find(
    c => c.code === formData.originalCurrency
  )?.symbol || formData.originalCurrency;

  // Filter budgets by transaction date
  const filteredBudgets = filterBudgetsByTransactionDate(customBudgets, formData.date);

  // Calculate available balance dynamically based on selected currency and budget
  const availableBalance = (() => {
    if (!formData.isCashExpense) return 0;

    const currency = formData.originalCurrency;

    if (formData.customBudgetId) {
      // Get remaining allocated cash for the selected budget and currency
      const selectedBudget = customBudgets.find(b => b.id === formData.customBudgetId);
      if (selectedBudget) {
        return getRemainingAllocatedCash(selectedBudget, transactions, currency);
      }
    } else {
      // Get total cash wallet balance for the selected currency
      return getCurrencyBalance(cashWallet, currency);
    }

    return 0;
  })();

  const handleRefreshRates = async () => {
    const result = await refreshRates(
      formData.originalCurrency,
      settings.baseCurrency || 'USD',
      formData.date
    );

    if (result.success) {
      toast({
        title: result.alreadyFresh ? "Rates Up to Date" : "Success",
        description: result.message,
      });
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const normalizedAmount = normalizeAmount(formData.amount);
    const originalAmount = parseFloat(normalizedAmount);
    
    // Check if sufficient cash for cash expenses
    if (formData.isCashExpense && originalAmount > availableBalance) {
      toast({
        title: "Insufficient Funds",
        description: formData.customBudgetId 
          ? "You don't have enough allocated cash in this budget for this expense."
          : "You don't have enough cash in your wallet for this expense.",
        variant: "destructive",
      });
      return;
    }

    let finalAmount = originalAmount;
    let exchangeRateUsed = null;

    // Perform currency conversion if needed (not for cash expenses - they're always in selected currency, converted to base)
    if (isForeignCurrency && !formData.isCashExpense) {
      const sourceRate = getRateForDate(exchangeRates, formData.originalCurrency, formData.date);
      const targetRate = getRateForDate(exchangeRates, settings.baseCurrency || 'USD', formData.date);

      if (!sourceRate || !targetRate) {
        toast({
          title: "Exchange Rate Missing",
          description: "Please refresh the exchange rates before submitting.",
          variant: "destructive",
        });
        return;
      }

      const conversion = calculateConvertedAmount(
        originalAmount,
        formData.originalCurrency,
        settings.baseCurrency || 'USD',
        { sourceToUSD: sourceRate, targetToUSD: targetRate }
      );

      finalAmount = conversion.convertedAmount;
      exchangeRateUsed = conversion.exchangeRateUsed;
    } else if (formData.isCashExpense && isForeignCurrency) {
      // For cash expenses in foreign currency, convert to base currency
      const sourceRate = getRateForDate(exchangeRates, formData.originalCurrency, formData.date);
      const targetRate = getRateForDate(exchangeRates, settings.baseCurrency || 'USD', formData.date);

      if (sourceRate && targetRate) {
        const conversion = calculateConvertedAmount(
          originalAmount,
          formData.originalCurrency,
          settings.baseCurrency || 'USD',
          { sourceToUSD: sourceRate, targetToUSD: targetRate }
        );

        finalAmount = conversion.convertedAmount;
        exchangeRateUsed = conversion.exchangeRateUsed;
      }
    }
    
    onSubmit({
      title: formData.title,
      amount: finalAmount,
      originalAmount: originalAmount,
      originalCurrency: formData.originalCurrency,
      exchangeRateUsed: exchangeRateUsed,
      type: formData.type,
      category_id: formData.category_id || null,
      date: formData.date,
      isPaid: formData.isCashExpense ? true : formData.isPaid,
      paidDate: formData.isCashExpense ? formData.date : (formData.isPaid ? (formData.paidDate || formData.date) : null),
      customBudgetId: formData.customBudgetId || null,
      isCashTransaction: formData.isCashExpense,
      cashTransactionType: formData.isCashExpense ? 'expense_from_wallet' : null,
      cashAmount: formData.isCashExpense ? originalAmount : null,
      cashCurrency: formData.isCashExpense ? formData.originalCurrency : null
    });
    
    setFormData({
      title: '',
      amount: '',
      originalCurrency: settings.baseCurrency || 'USD',
      type: 'expense',
      category_id: '',
      date: formatDateString(new Date()),
      isPaid: false,
      paidDate: '',
      customBudgetId: defaultCustomBudgetId || '',
      isCashExpense: false
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quick Add Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">What did you spend on?</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Coffee, Concert ticket"
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
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                currencySymbol={selectedCurrencySymbol}
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

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isCashExpense"
              checked={formData.isCashExpense}
              onCheckedChange={(checked) => setFormData({ 
                ...formData, 
                isCashExpense: checked,
                isPaid: checked ? true : formData.isPaid
              })}
            />
            <Label htmlFor="isCashExpense" className="cursor-pointer flex items-center gap-2">
              Paid with cash
              {formData.isCashExpense && (
                <span className="text-xs text-gray-500">
                  (Available: {selectedCurrencySymbol}{availableBalance.toFixed(2)})
                </span>
              )}
            </Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="currency">Currency</Label>
              {isForeignCurrency && !formData.isCashExpense && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshRates}
                  disabled={isRefreshing}
                  className="h-8 px-2 text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <CurrencySelect
              value={formData.originalCurrency}
              onValueChange={(value) => setFormData({ ...formData, originalCurrency: value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <CategorySelect
              value={formData.category_id}
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              categories={categories}
            />
          </div>

          {!formData.isCashExpense && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPaid"
                checked={formData.isPaid}
                onCheckedChange={(checked) => setFormData({ 
                  ...formData, 
                  isPaid: checked,
                  paidDate: checked ? formData.date : ''
                })}
              />
              <Label htmlFor="isPaid" className="cursor-pointer">
                Already paid
              </Label>
            </div>
          )}

          {formData.isPaid && !formData.isCashExpense && (
            <div className="space-y-2">
              <Label htmlFor="paidDate">Payment Date</Label>
              <DatePicker
                value={formData.paidDate || formData.date}
                onChange={(value) => setFormData({ ...formData, paidDate: value })}
                placeholder="Pick payment date"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="customBudget">Budget</Label>
            <Select
              value={formData.customBudgetId || ''}
              onValueChange={(value) => setFormData({ ...formData, customBudgetId: value || '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select budget (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>None</SelectItem>
                {filteredBudgets.map((budget) => (
                  <SelectItem key={budget.id} value={budget.id}>
                    {budget.isSystemBudget && <span className="text-blue-600 mr-1">★</span>}
                    {budget.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isSubmitting ? 'Adding...' : 'Add Expense'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}