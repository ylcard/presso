import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CustomButton } from "@/components/ui/CustomButton";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, AlertCircle, Check, ChevronsUpDown } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "../ui/ConfirmDialogProvider";
import AmountInput from "../ui/AmountInput";
import DatePicker from "../ui/DatePicker";
import CategorySelect from "../ui/CategorySelect";
import AnimatePresenceContainer from "../ui/AnimatePresenceContainer";
import { useSettings } from "../utils/SettingsContext";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { getCurrencySymbol } from "../utils/currencyUtils";
import { calculateConvertedAmount, getRateForDate, getRateDetailsForDate } from "../utils/currencyCalculations";
import { SUPPORTED_CURRENCIES } from "../utils/constants";
import { formatDateString, isDateInRange, formatDate } from "../utils/dateUtils";
import { differenceInDays, parseISO, startOfDay } from "date-fns";
import { normalizeAmount } from "../utils/generalUtils";
import { useCategoryRules } from "../hooks/useBase44Entities";
import { categorizeTransaction } from "../utils/transactionCategorization";
import { useTranslation } from "react-i18next";

export default function TransactionFormContent({
    initialTransaction = null,
    categories = [],
    allBudgets = [],
    onSubmit,
    onCancel,
    isSubmitting = false,
}) {
    const { settings, user } = useSettings();
    const { toast } = useToast();
    const { confirmAction } = useConfirm();
    const { exchangeRates, refreshRates, isRefreshing, refetch, isLoading } = useExchangeRates();
    const { rules } = useCategoryRules(user);
    const { t } = useTranslation();

    // Force fetch rates on mount if empty
    useEffect(() => {
        if (exchangeRates.length === 0) {
            refetch();
        }
    }, [exchangeRates.length, refetch]);

    const [formData, setFormData] = useState({
        title: '',
        amount: null,
        originalCurrency: settings?.baseCurrency || 'USD',
        type: 'expense',
        category_id: '',
        financial_priority: '',
        date: formatDateString(new Date()),
        isPaid: false,
        paidDate: '',
        customBudgetId: '',
        isCashExpense: false,
        notes: ''
    });

    const [isBudgetOpen, setIsBudgetOpen] = useState(false);
    const [budgetSearchTerm, setBudgetSearchTerm] = useState("");
    const [validationError, setValidationError] = useState(null);

    // Initialize form data from initialTransaction (for editing)
    useEffect(() => {
        if (initialTransaction) {
            setFormData({
                title: initialTransaction.title || '',
                amount: initialTransaction.originalAmount || initialTransaction.amount || null,
                originalCurrency: initialTransaction.originalCurrency || settings?.baseCurrency || 'USD',
                type: initialTransaction.type || 'expense',
                category_id: initialTransaction.category_id || '',
                financial_priority: initialTransaction.financial_priority || '',
                date: initialTransaction.date || formatDateString(new Date()),
                isPaid: initialTransaction.type === 'expense' ? (initialTransaction.isPaid || false) : false,
                paidDate: initialTransaction.paidDate || '',
                customBudgetId: initialTransaction.customBudgetId || '',
                isCashExpense: initialTransaction.isCashTransaction || false,
                notes: initialTransaction.notes || ''
            });
        } else {
            // Reset to defaults for new transaction
            setFormData({
                title: '',
                amount: null,
                originalCurrency: settings?.baseCurrency || 'USD',
                type: 'expense',
                category_id: '',
                financial_priority: '',
                date: formatDateString(new Date()),
                isPaid: false,
                paidDate: '',
                customBudgetId: '',
                isCashExpense: false,
                notes: ''
            });
        }
    }, [initialTransaction, settings?.baseCurrency]);

    const isForeignCurrency = formData.originalCurrency !== (settings?.baseCurrency || 'USD');

    // DEPRECATED? Get currency symbol for the selected currency
    // const selectedCurrencySymbol = SUPPORTED_CURRENCIES.find(
    //     c => c.code === formData.originalCurrency
    // )?.symbol || getCurrencySymbol(formData.originalCurrency);

    // Auto-set Priority based on Category
    useEffect(() => {
        if (formData.category_id) {
            // Prevent overwriting existing priority on initial load of an edit
            if (initialTransaction && formData.category_id === initialTransaction.category_id) {
                // If we are editing and the category hasn't changed, respect the saved priority
                return;
            }

            const selectedCategory = categories.find(c => c.id === formData.category_id);
            if (selectedCategory && selectedCategory.priority) {
                setFormData(prev => ({ ...prev, financial_priority: selectedCategory.priority }));
            }
        }
    }, [formData.category_id, categories, initialTransaction]);

    // Auto-Categorize based on Title
    useEffect(() => {
        if (formData.title && !formData.category_id && !initialTransaction) {
            const result = categorizeTransaction({ title: formData.title }, rules, categories);
            if (result.categoryId) {
                setFormData(prev => ({
                    ...prev,
                    category_id: result.categoryId
                    // Priority will be set by the useEffect above when category_id changes
                }));
            }
        }
    }, [formData.title, rules, categories, initialTransaction, formData.category_id]);

    // Smart Date for Custom Budgets
    // If a custom budget is selected and the current date is outside its range, default to the start date.
    useEffect(() => {
        if (formData.budget_id) {
            const selectedBudget = allBudgets.find(b => b.id === formData.budget_id);
            if (selectedBudget && selectedBudget.type === 'custom' && selectedBudget.start_date && selectedBudget.end_date) {
                const txDate = new Date(formData.date);
                const startDate = new Date(selectedBudget.start_date);
                const endDate = new Date(selectedBudget.end_date);

                // Reset times for comparison
                txDate.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);

                if (txDate < startDate || txDate > endDate) {
                    setFormData(prev => ({
                        ...prev,
                        date: formatDateString(startDate)
                    }));
                    toast({
                        title: t('date_updated'),
                        description: t('date_adjusted_message', { budgetName: selectedBudget.name }),
                    });
                }
            }
        }
    }, [formData.budget_id, allBudgets, formData.date]);

    // Auto-select System Budget based on Priority
    // If priority changes to 'wants', try to find a budget named 'Wants'
    useEffect(() => {
        // Prevent auto-switching when editing an existing transaction unless the user actually changes the priority.
        if (initialTransaction &&
            formData.customBudgetId === initialTransaction.customBudgetId &&
            formData.financial_priority === (initialTransaction.financial_priority || '')) {
            return;
        }

        if (formData.financial_priority && allBudgets.length > 0) {
            // Find a matching system budget (case-insensitive)
            const matchingSystemBudget = allBudgets.find(b =>
                b.isSystemBudget &&
                b.name.toLowerCase() === formData.financial_priority.toLowerCase() &&
                isDateInRange(formData.date, b.startDate, b.endDate)
            );

            if (matchingSystemBudget) {
                // Only auto-switch if we currently have NO budget selected, 
                // or if the currently selected budget is also a system budget.
                // We don't want to kick the user out of a specific custom budget (e.g., "Trip 2025").
                const currentBudget = allBudgets.find(b => b.id === formData.customBudgetId);
                const canAutoSwitch = !formData.customBudgetId || (currentBudget && currentBudget.isSystemBudget);

                if (canAutoSwitch) {
                    setFormData(prev => ({ ...prev, customBudgetId: matchingSystemBudget.id }));
                }
            } else {
                // If we can't find a matching system budget (e.g. future month not generated),
                // and we are currently pointing to a system budget, we should clear it to avoid 
                // pointing to the WRONG month (like November budget for January expense).
                const currentBudget = allBudgets.find(b => b.id === formData.customBudgetId);
                if (currentBudget && currentBudget.isSystemBudget) {
                    setFormData(prev => ({ ...prev, customBudgetId: '' }));
                }
            }
        }
    }, [formData.financial_priority, allBudgets, formData.date]);

    // Filter budgets to show active + planned statuses + relevant completed budgets
    // This allows linking expenses to future/past budgets while keeping the list manageable
    const smartSortedBudgets = useMemo(() => {
        const userRealNow = startOfDay(new Date()); // User's actual current life date
        const currentPriority = (formData.financial_priority || '').toLowerCase();

        // 1. Intelligent Filtering
        const relevantBudgets = allBudgets.filter(b => {
            if (b.isSystemBudget) {
                // RULE: Never show Savings System Budgets (user preference)
                if (b.systemBudgetType === 'savings' || b.name.toLowerCase().includes('savings')) return false;

                // RULE: If priority is NOT 'needs', don't show Needs System Budget
                if (currentPriority !== 'needs' && b.systemBudgetType === 'needs') return false;

                // Only show system budgets relevant to the Transaction Date (otherwise list is huge)
                return isDateInRange(formData.date, b.startDate, b.endDate);
            }

            // Custom Budgets: Keep them all available for search, 
            // but we will prioritize them in the sort.
            return true;
        });

        // 2. Proximity Scoring & Sorting
        return relevantBudgets.map(b => {
            // Calculate distance from Real Life Today to Budget Start
            // This helps surface the budget that is happening NOW or SOON
            const startDate = parseISO(b.startDate);
            const distanceToNow = Math.abs(differenceInDays(userRealNow, startDate));

            return { ...b, distanceToNow };
        }).sort((a, b) => {
            // Always float the currently selected budget to the top if editing
            if (a.id === formData.customBudgetId) return -1;
            if (b.id === formData.customBudgetId) return 1;

            // System budgets for the current priority usually go first
            if (a.isSystemBudget && !b.isSystemBudget) return -1;
            if (!a.isSystemBudget && b.isSystemBudget) return 1;

            // Sort by proximity to user's real today
            return a.distanceToNow - b.distanceToNow;
        });
    }, [allBudgets, formData.date, formData.financial_priority, formData.customBudgetId]);

    // 3. View Limiter
    // If searching, show ALL matches. If not searching, show only top 5 recommended.
    const visibleOptions = useMemo(() => {
        if (budgetSearchTerm && budgetSearchTerm.length > 0) {
            return smartSortedBudgets.filter(b =>
                b.name.toLowerCase().includes(budgetSearchTerm.toLowerCase())
            );
        }
        return smartSortedBudgets.slice(0, 5);
    }, [smartSortedBudgets, budgetSearchTerm]);

    const executeRefresh = async (force) => {
        const result = await refreshRates(
            formData.originalCurrency,
            settings?.baseCurrency || 'USD',
            formData.date,
            force
        );

        if (result.success) {
            toast({
                title: result.alreadyFresh ? t('rates_up_to_date') : (result.skipped ? t('historical_rate_skipped') : t('success')),
                description: result.message,
                variant: result.skipped ? "warning" : "default"
            });
        } else {
            toast({
                title: t('error'),
                description: result.message,
                variant: "destructive",
            });
        }
    };

    const handleRefreshRates = async () => {
        // Check if rate already exists
        const existingRateDetails = getRateDetailsForDate(exchangeRates, formData.originalCurrency, formData.date, settings?.baseCurrency);

        if (existingRateDetails) {
            confirmAction(
                t('update_exchange_rate_title'),
                t('update_exchange_rate_message', { rate: existingRateDetails.rate, date: formatDate(existingRateDetails.date) }),
                () => executeRefresh(true),
                { confirmText: t('update') }
            );
        } else {
            await executeRefresh(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setValidationError(null);

        const normalizedAmount = normalizeAmount(formData.amount);
        const originalAmount = parseFloat(normalizedAmount);

        // Validation: Budget is required for expenses
        if (formData.type === 'expense' && !formData.customBudgetId) {
            setValidationError(t('budget_required_error'));
            return;
        }

        let finalAmount = originalAmount;
        let exchangeRateUsed = null;

        // Perform currency conversion if needed
        // if (isForeignCurrency && !formData.isCashExpense) {
        if (isForeignCurrency) {
            let sourceRate = getRateForDate(exchangeRates, formData.originalCurrency, formData.date);
            let targetRate = getRateForDate(exchangeRates, settings?.baseCurrency || 'USD', formData.date);

            // AUTO-FETCH ON SUBMIT: If rate is missing and not paid, try to fetch it now
            if ((!sourceRate || !targetRate) && !formData.isPaid) {
                toast({ title: t('fetching_rates'), description: t('fetching_rates_desc') });

                const result = await refreshRates(
                    formData.originalCurrency,
                    settings?.baseCurrency || 'USD',
                    formData.date
                );

                if (!result.success) {
                    setValidationError(t('fetch_rates_failed'));
                    return;
                }

                setValidationError(t('rates_updated_review'));
                return;
            }

            if (!sourceRate || !targetRate) {
                if (!formData.isPaid) {
                    setValidationError(t('rate_missing_error'));
                    return;
                }
            }

            if (sourceRate && targetRate) {
                const conversion = calculateConvertedAmount(
                    originalAmount,
                    formData.originalCurrency,
                    settings?.baseCurrency || 'USD',
                    { sourceToUSD: sourceRate, targetToUSD: targetRate }
                );

                finalAmount = conversion.convertedAmount;
                exchangeRateUsed = conversion.exchangeRateUsed;
            }
        }

        // Determine budget type
        const selectedBudget = allBudgets.find(b => b.id === formData.customBudgetId);
        const isSystemBudget = selectedBudget?.isSystemBudget;

        const submitData = {
            title: formData.title,
            amount: finalAmount,
            originalAmount: originalAmount,
            originalCurrency: formData.originalCurrency,
            exchangeRateUsed: exchangeRateUsed,
            type: formData.type,
            categoryId: formData.category_id || null, // Fixed: category_id -> categoryId
            financial_priority: formData.financial_priority || null,
            date: formData.date,
            notes: formData.notes || null
        };

        if (formData.type === 'expense') {
            submitData.isPaid = formData.isCashExpense ? true : formData.isPaid;
            submitData.paidDate = formData.isCashExpense ? formData.date : (formData.isPaid ? (formData.paidDate || formData.date) : null);

            // Handle System vs Custom Budget
            if (isSystemBudget) {
                submitData.systemBudgetId = formData.customBudgetId;
                submitData.customBudgetId = null;
            } else {
                submitData.customBudgetId = formData.customBudgetId || null;
                submitData.systemBudgetId = null;
            }

            submitData.isCashTransaction = formData.isCashExpense;
            submitData.cashTransactionType = null;
        } else {
            submitData.isPaid = false;
            submitData.paidDate = null;
            submitData.categoryId = null; // Fixed
            submitData.customBudgetId = null;
            submitData.systemBudgetId = null;
            submitData.isCashTransaction = false;
            submitData.cashTransactionType = null;
            submitData.cashAmount = null;
            submitData.cashCurrency = null;
        }

        onSubmit(submitData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {validationError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{validationError}</AlertDescription>
                </Alert>
            )}

            {/* Title */}
            <div className="space-y-2">
                <Label htmlFor="title">{t('title')}</Label>
                <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('title_placeholder')}
                    required
                    autoComplete="off"
                />
            </div>

            {/* Amount and Currency (Combined) */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="amount">{t('amount')}</Label>
                    {isForeignCurrency && (
                        <div className="flex items-center gap-2">
                            {(() => {
                                const rateDetails = getRateDetailsForDate(exchangeRates, formData.originalCurrency, formData.date, settings?.baseCurrency);
                                if (rateDetails) {
                                    const rateDate = startOfDay(parseISO(rateDetails.date));
                                    const txDate = startOfDay(parseISO(formData.date));
                                    const age = Math.abs(differenceInDays(txDate, rateDate));
                                    const isOld = age > 14;

                                    return (
                                        <span
                                            className={`text-xs ${isOld ? 'text-amber-600' : 'text-gray-500'}`}
                                            title={t('rate_tooltip', { rate: rateDetails.rate, date: formatDate(rateDetails.date), age })}
                                        >
                                            {t('rate_label', { rate: rateDetails.rate, date: formatDate(rateDetails.date, 'MMM d') })}{isOld ? t('old_rate_suffix') : ''}
                                        </span>
                                    );
                                }
                                if (isLoading) return <span className="text-xs text-gray-400">{t('loading')}</span>;
                                return <span className="text-xs text-amber-600">{t('no_rate')}</span>;
                            })()}
                            <CustomButton
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleRefreshRates}
                                disabled={isRefreshing || isLoading}
                                className="h-6 px-2 text-blue-600 hover:text-blue-700"
                            >
                                <RefreshCw className={`w-3 h-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                                <span className="text-xs">Fetch Rate</span>
                            </CustomButton>
                        </div>
                    )}
                </div>
                <AmountInput
                    id="amount"
                    value={formData.amount}
                    onChange={(value) => setFormData({ ...formData, amount: value })}
                    placeholder="0.00"
                    currency={formData.originalCurrency}
                    onCurrencyChange={(value) => setFormData({ ...formData, originalCurrency: value })}
                    required
                />
            </div>

            {/* Paid with cash checkbox - right below amount/currency */}
            {formData.type === 'expense' && (
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
                        {t('paid_with_cash')}
                    </Label>
                </div>
            )}

            {/* Date picker and Mark as paid checkbox */}
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">{t('date')}</Label>
                        <DatePicker
                            value={formData.date}
                            onChange={(value) => setFormData({ ...formData, date: value })}
                            placeholder={t('select_date')}
                        />
                    </div>

                    {/* Payment Date - appears next to Date when isPaid is checked */}
                    <AnimatePresenceContainer show={formData.type === 'expense' && formData.isPaid && !formData.isCashExpense}>
                        <div className="space-y-2">
                            <Label htmlFor="paidDate">{t('payment_date')}</Label>
                            <DatePicker
                                value={formData.paidDate || formData.date}
                                onChange={(value) => setFormData({ ...formData, paidDate: value })}
                                placeholder={t('payment_date')}
                            />
                        </div>
                    </AnimatePresenceContainer>
                </div>

                {/* Mark as paid checkbox - below date fields */}
                {formData.type === 'expense' && !formData.isCashExpense && (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPaid"
                            checked={formData.isPaid}
                            onCheckedChange={(checked) => setFormData({
                                ...formData,
                                isPaid: checked,
                                paidDate: checked ? (formData.paidDate || formData.date) : ''
                            })}
                        />
                        <Label htmlFor="isPaid" className="cursor-pointer">
                            {t('mark_as_paid')}
                        </Label>
                    </div>
                )}
            </div>

            {/* Category, Budget Assignment, and Budget (grid layout) */}
            {formData.type === 'expense' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">{t('category')}</Label>
                            <CategorySelect
                                value={formData.category_id}
                                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                                categories={categories}
                            />
                        </div>

                        {/* Financial Priority */}
                        <div className="space-y-2">
                            <Label htmlFor="financial_priority">{t('financial_priority')}</Label>
                            <Select
                                value={formData.financial_priority || ''}
                                onValueChange={(value) => setFormData({ ...formData, financial_priority: value || '' })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={t('select_priority')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="needs">{t('priority_needs')}</SelectItem>
                                    <SelectItem value="wants">{t('priority_wants')}</SelectItem>
                                    <SelectItem value="savings">{t('priority_savings')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {/* Budget (REQUIRED for expenses) */}
                    <div className="space-y-2">
                        <Label htmlFor="customBudget">{t('budget_allocation')}</Label>
                        <Popover open={isBudgetOpen} onOpenChange={setIsBudgetOpen} modal={true}>
                            <PopoverTrigger asChild>
                                <CustomButton
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={isBudgetOpen}
                                    className="w-full justify-between font-normal"
                                >
                                    {formData.customBudgetId
                                        ? allBudgets.find((b) => b.id === formData.customBudgetId)?.name
                                        : t('select_budget')}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </CustomButton>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0" align="start">
                                <Command shouldFilter={false} className="h-auto overflow-hidden">
                                    <CommandInput
                                        placeholder={t('search_budgets')}
                                        onValueChange={setBudgetSearchTerm}
                                    />
                                    <CommandList>
                                        <CommandEmpty>{t('no_budget_found')}</CommandEmpty>
                                        <CommandGroup heading={budgetSearchTerm ? t('search_results') : undefined}>
                                            {visibleOptions.map((budget) => (
                                                <CommandItem
                                                    key={budget.id}
                                                    value={budget.name}
                                                    onSelect={() => {
                                                        setFormData({ ...formData, customBudgetId: budget.id });
                                                        setIsBudgetOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={`mr-2 h-4 w-4 ${formData.customBudgetId === budget.id ? "opacity-100" : "opacity-0"}`}
                                                    />
                                                    <div className="flex items-center text-sm">
                                                        {budget.isSystemBudget ? (
                                                            <span className="text-blue-600 mr-2">★</span>
                                                        ) : (
                                                            <span className={`w-2 h-2 rounded-full mr-2 ${budget.status === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                        )}
                                                        {budget.name}
                                                        {budget.isSystemBudget && <span className="ml-1 text-xs text-gray-400">({formatDate(budget.startDate, 'MMM')})</span>}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
                <Label htmlFor="notes">{t('notes')}</Label>
                <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t('notes_placeholder')}
                    rows={2}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-2">
                <CustomButton type="button" variant="outline" onClick={onCancel}>
                    {t('cancel')}
                </CustomButton>
                <CustomButton
                    type="submit"
                    disabled={isSubmitting}
                    variant="primary"
                >
                    {isSubmitting ? t('saving') : (initialTransaction && initialTransaction.id) ? t('update') : t('add')}
                </CustomButton>
            </div>
        </form>
    );
}

