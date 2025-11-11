import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Trash2, Banknote } from "lucide-react";
import AmountInput from "../ui/AmountInput";
import DateRangePicker from "../ui/DateRangePicker";
import CurrencySelect from "../ui/CurrencySelect";
import { PRESET_COLORS } from "../utils/constants";
import { normalizeAmount } from "../utils/budgetCalculations";
import { getCurrencyBalance, validateCashAllocations } from "../utils/cashAllocationUtils";
import { formatCurrency } from "../utils/formatCurrency";
import { getCurrencySymbol } from "../utils/currencyUtils";
import { usePeriod } from "../hooks/usePeriod";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CustomBudgetForm({ 
  budget, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  cashWallet,
  baseCurrency,
  settings
}) {
  const { monthStart, monthEnd } = usePeriod();

  const [formData, setFormData] = useState({
    name: '',
    allocatedAmount: '',
    cashAllocations: [],
    startDate: monthStart,
    endDate: monthEnd,
    description: '',
    color: '#3B82F6'
  });

  const [showCashAllocation, setShowCashAllocation] = useState(false);
  const [validationError, setValidationError] = useState(null);

  // Get available currencies from wallet
  const availableCurrencies = cashWallet?.balances
    ?.filter(b => b.amount > 0)
    .map(b => b.currencyCode) || [];

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name || '',
        allocatedAmount: budget.allocatedAmount?.toString() || '',
        cashAllocations: budget.cashAllocations || [],
        startDate: budget.startDate || monthStart,
        endDate: budget.endDate || monthEnd,
        description: budget.description || '',
        color: budget.color || '#3B82F6'
      });
      setShowCashAllocation((budget.cashAllocations || []).length > 0);
    } else {
      setFormData(prev => ({
        ...prev,
        startDate: monthStart,
        endDate: monthEnd,
        cashAllocations: []
      }));
      setShowCashAllocation(false);
    }
  }, [budget, monthStart, monthEnd]);

  const handleAddCashAllocation = () => {
    const defaultCurrency = availableCurrencies[0] || baseCurrency || 'USD';
    setFormData(prev => ({
      ...prev,
      cashAllocations: [
        ...prev.cashAllocations,
        { currencyCode: defaultCurrency, amount: '' }
      ]
    }));
  };

  const handleRemoveCashAllocation = (index) => {
    setFormData(prev => ({
      ...prev,
      cashAllocations: prev.cashAllocations.filter((_, i) => i !== index)
    }));
  };

  const handleCashAllocationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      cashAllocations: prev.cashAllocations.map((alloc, i) =>
        i === index ? { ...alloc, [field]: value } : alloc
      )
    }));
  };

  const handleDateRangeChange = (start, end) => {
    setFormData(prev => ({
      ...prev,
      startDate: start,
      endDate: end
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError(null);

    const normalizedAmount = normalizeAmount(formData.allocatedAmount);
    
    const processedCashAllocations = formData.cashAllocations
      .map(alloc => ({
        currencyCode: alloc.currencyCode,
        amount: parseFloat(normalizeAmount(alloc.amount || '0'))
      }))
      .filter(alloc => alloc.amount > 0);

    const validation = validateCashAllocations(
      cashWallet,
      processedCashAllocations,
      baseCurrency
    );

    if (!validation.valid) {
      const errorMessages = validation.errors.map(err => 
        `${err.currency}: Requested ${err.requested.toFixed(2)}, Available ${err.available.toFixed(2)}`
      ).join('; ');
      setValidationError(`Insufficient balance: ${errorMessages}`);
      return;
    }
    
    onSubmit({
      ...formData,
      allocatedAmount: parseFloat(normalizedAmount),
      cashAllocations: processedCashAllocations,
      status: budget?.status || 'active'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}

      {/* ENHANCEMENT: Budget Name + Date Range side-by-side */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="name">Budget Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Manchester Trip"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label>Date Range</Label>
          <DateRangePicker
            startDate={formData.startDate}
            endDate={formData.endDate}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </div>

      {/* ENHANCEMENT: Card Budget + Allocate Cash button side-by-side */}
      <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
        <div className="space-y-2">
          <Label htmlFor="allocatedAmount">Card Budget</Label>
          <AmountInput
            id="allocatedAmount"
            value={formData.allocatedAmount}
            onChange={(e) => setFormData({ ...formData, allocatedAmount: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <Button
          type="button"
          variant={showCashAllocation ? "default" : "outline"}
          onClick={() => {
            setShowCashAllocation(!showCashAllocation);
            if (!showCashAllocation && formData.cashAllocations.length === 0) {
              handleAddCashAllocation();
            }
          }}
          className={showCashAllocation ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Banknote className="w-4 h-4 mr-2" />
          {showCashAllocation ? "Hide Cash" : "Allocate Cash"}
        </Button>
      </div>

      {/* Cash Allocations Section */}
      {showCashAllocation && (
        <div className="space-y-2 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-semibold text-green-900">Cash Allocations</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleAddCashAllocation}
              className="text-green-700 hover:text-green-900 hover:bg-green-100"
            >
              + Add Currency
            </Button>
          </div>
          
          {formData.cashAllocations.length > 0 ? (
            <div className="space-y-2">
              {formData.cashAllocations.map((alloc, index) => {
                const available = getCurrencyBalance(cashWallet, alloc.currencyCode);
                return (
                  <div key={index} className="grid grid-cols-[120px_1fr_auto] gap-2 items-end bg-white p-2 rounded border border-green-200">
                    <div className="space-y-1">
                      <Label className="text-xs">Currency</Label>
                      <CurrencySelect
                        value={alloc.currencyCode}
                        onValueChange={(value) => 
                          handleCashAllocationChange(index, 'currencyCode', value)
                        }
                        filterCurrencies={availableCurrencies}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center justify-between">
                        <span>Amount</span>
                        <span className="text-gray-500 font-normal">
                          Available: {settings ? formatCurrency(available, { ...settings, currencySymbol: getCurrencySymbol(alloc.currencyCode) }) : `${getCurrencySymbol(alloc.currencyCode)}${available.toFixed(2)}`}
                        </span>
                      </Label>
                      <AmountInput
                        value={alloc.amount}
                        onChange={(e) => 
                          handleCashAllocationChange(index, 'amount', e.target.value)
                        }
                        placeholder="0.00"
                        currencySymbol={getCurrencySymbol(alloc.currencyCode)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCashAllocation(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-green-700 text-center py-2">
              No cash allocations yet. Click "+ Add Currency" to add.
            </p>
          )}
        </div>
      )}

      {/* ENHANCEMENT: Compact color selection - single row */}
      <div className="space-y-2">
        <Label className="text-sm">Color</Label>
        <div className="flex gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                formData.color === color ? 'border-gray-900 ring-2 ring-offset-1 ring-gray-900' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Add details about this budget..."
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {isSubmitting ? 'Saving...' : budget ? 'Update Budget' : 'Create Budget'}
        </Button>
      </div>
    </form>
  );
}

// MAJOR REFACTOR (2025-01-12): Custom Budget Form Overhaul
// 1. Removed Card wrapper - now pure form for use in Popover
// 2. Budget Name + Date Range side-by-side at top
// 3. Card Budget + "Allocate Cash" toggle button side-by-side
// 4. Cash allocations in collapsible section with green theme
// 5. Compact color selection (single row, smaller buttons)
// 6. Currencies filtered to only show available wallet balances
// 7. Removed motion wrapper (parent handles animation)
// 8. Optimized layout to prevent scrolling
// 9. Updated labels: "Budget Name", "Card Budget"
// 10. Integrated DateRangePicker component