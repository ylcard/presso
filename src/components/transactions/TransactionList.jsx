import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionItem from "./TransactionItem";
import { CustomButton } from "@/components/ui/CustomButton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export default function TransactionList({
    transactions,
    categories,
    onEdit,
    onDelete,
    isLoading,
    onSubmit,
    isSubmitting,
    customBudgets = [],
    monthStart = null,
    monthEnd = null,
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    itemsPerPage = 10,
    onItemsPerPageChange,
    totalItems = 0,
    selectedIds = new Set(),
    onToggleSelection,
    onSelectAll
}) {
    const categoryMap = categories.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
    }, {});

    if (isLoading) {
        return (
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array(8).fill(0).map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (transactions.length === 0 && totalItems === 0) {
        return (
            <Card className="border-none shadow-lg">
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-40 flex items-center justify-center text-gray-400">
                        <p>No transactions found. Add your first one!</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Check if all items on current page are selected
    const isAllSelected = transactions.length > 0 && transactions.every(t => selectedIds.has(t.id));

    const handleSelectAll = (checked) => {
        const ids = transactions.map(t => t.id);
        onSelectAll(ids, checked);
    };

    return (
        <Card className="border-none shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Transactions ({totalItems})</CardTitle>
                {/* Items Per Page Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Show:</span>
                    <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => onItemsPerPageChange(Number(value))}
                    >
                        <SelectTrigger className="w-[70px] h-8">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent>
                {transactions.length > 0 && (
                    <div className="flex items-center gap-2 mb-4 px-4 pb-2 border-b border-gray-100">
                        <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            id="select-all"
                        />
                        <label htmlFor="select-all" className="text-sm font-medium text-gray-600 cursor-pointer select-none">Select All on Page</label>
                    </div>
                )}
                <div className="space-y-2 mb-6">
                    {transactions.length > 0 ? (
                        transactions.map((transaction) => (
                            <TransactionItem
                                key={transaction.id}
                                transaction={transaction}
                                category={categoryMap[transaction.category_id]}
                                onEdit={onEdit}
                                onDelete={onDelete}
                                onSubmit={onSubmit}
                                isSubmitting={isSubmitting}
                                categories={categories}
                                customBudgets={customBudgets}
                                monthStart={monthStart}
                                monthEnd={monthEnd}
                                isSelected={selectedIds.has(transaction.id)}
                                onSelect={onToggleSelection}
                            />
                        ))
                    ) : (
                        <div className="h-20 flex items-center justify-center text-gray-400">
                            <p>No transactions match your filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                        <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center gap-2">
                            <CustomButton
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Previous
                            </CustomButton>
                            <CustomButton
                                variant="outline"
                                size="sm"
                                onClick={() => onPageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                            >
                                Next
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </CustomButton>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
