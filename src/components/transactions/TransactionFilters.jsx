import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CustomButton } from "@/components/ui/CustomButton";
import DateRangePicker from "../ui/DateRangePicker";
import CategorySelect from "../ui/CategorySelect";
import { useMemo } from "react";
import { formatDate, isDateInRange } from "../utils/dateUtils";

export default function TransactionFilters({ filters, setFilters, categories, allCustomBudgets = [] }) {

    const handleCategoryChange = (newCategories) => {
        setFilters({ ...filters, category: newCategories });
    };

    const handleDateRangeChange = (startDate, endDate) => {
        setFilters({ ...filters, startDate, endDate });
    };

    const handleClearFilters = () => {
        setFilters({
            ...filters,
            search: '',
            type: 'all',
            category: [],
            paymentStatus: 'all',
            cashStatus: 'all',
            financialPriority: 'all',
            customBudgetId: 'all'
        });
    };

    // Filter custom budgets based on selected date range
    const filteredCustomBudgets = useMemo(() => {
        if (!filters.startDate || !filters.endDate) return [];
        return allCustomBudgets.filter(b => {
            // Show active/planned/completed budgets that overlap with the selected range
            return isDateInRange(filters.startDate, b.startDate, b.endDate) ||
                isDateInRange(filters.endDate, b.startDate, b.endDate) ||
                (new Date(b.startDate) >= new Date(filters.startDate) && new Date(b.endDate) <= new Date(filters.endDate));
        });
    }, [allCustomBudgets, filters.startDate, filters.endDate]);

    const activeFilterCount = [
        filters.search,
        filters.type !== 'all',
        filters.category.length > 0,
        filters.paymentStatus !== 'all',
        filters.cashStatus !== 'all',
        filters.financialPriority !== 'all',
        filters.customBudgetId !== 'all'
    ].filter(Boolean).length;

    return (
        <Card className="border-none shadow-lg">
            <CardContent className="p-4 space-y-4">
                {/* Top Row: Search and Date Range */}
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-9"
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <DateRangePicker
                            startDate={filters.startDate}
                            endDate={filters.endDate}
                            onRangeChange={handleDateRangeChange}
                        />
                        {activeFilterCount > 0 && (
                            <CustomButton
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-gray-500 hover:text-red-600"
                            >
                                <X className="w-4 h-4 mr-1" />
                                Clear
                            </CustomButton>
                        )}
                    </div>
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Type */}
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Type</Label>
                        <Select
                            value={filters.type}
                            onValueChange={(value) => setFilters({ ...filters, type: value })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="income">Income</SelectItem>
                                <SelectItem value="expense">Expense</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Category (Multi-select) */}
                    <div className="space-y-1 lg:col-span-1">
                        <Label className="text-xs text-gray-500">Category</Label>
                        <CategorySelect
                            value={filters.category}
                            onValueChange={handleCategoryChange}
                            categories={categories}
                            placeholder="All Categories"
                            multiple={true}
                        />
                    </div>

                    {/* Financial Priority */}
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Priority</Label>
                        <Select
                            value={filters.financialPriority}
                            onValueChange={(value) => setFilters({ ...filters, financialPriority: value })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priorities</SelectItem>
                                <SelectItem value="needs">Needs</SelectItem>
                                <SelectItem value="wants">Wants</SelectItem>
                                <SelectItem value="savings">Savings</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Budget */}
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Budget</Label>
                        <Select
                            value={filters.customBudgetId}
                            onValueChange={(value) => setFilters({ ...filters, customBudgetId: value })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="All Budgets" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Budgets</SelectItem>
                                {filteredCustomBudgets.map(b => (
                                    <SelectItem key={b.id} value={b.id}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Payment Status */}
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Payment</Label>
                        <Select
                            value={filters.paymentStatus}
                            onValueChange={(value) => setFilters({ ...filters, paymentStatus: value })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="unpaid">Unpaid</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cash Status */}
                    <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Cash</Label>
                        <Select
                            value={filters.cashStatus}
                            onValueChange={(value) => setFilters({ ...filters, cashStatus: value })}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="cash_only">Cash Only</SelectItem>
                                <SelectItem value="exclude_cash">No Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
