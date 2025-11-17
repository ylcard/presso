import React from "react";
import { CustomButton } from "@/components/ui/CustomButton";
import { Plus } from "lucide-react";
import { useTransactions, useCategories, useCashWallet } from "../components/hooks/useBase44Entities";
import { useTransactionFiltering } from "../components/hooks/useDerivedData";
import { useTransactionActions } from "../components/hooks/useActions";
import { useSettings } from "../components/utils/SettingsContext";
import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import TransactionFilters from "../components/transactions/TransactionFilters";

export default function Transactions() {
    const { user } = useSettings();

    // Data fetching
    const { transactions, isLoading } = useTransactions();
    const { categories } = useCategories();
    const { cashWallet } = useCashWallet(user);

    // Filtering logic
    const { filters, setFilters, filteredTransactions } = useTransactionFiltering(transactions);

    const { handleSubmit, handleEdit, handleDelete, isSubmitting } = useTransactionActions(
        null,
        null,
        cashWallet
    );

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Transactions</h1>
                        <p className="text-gray-500 mt-1">Track your income and expenses</p>
                    </div>
                    <TransactionForm
                        transaction={null}
                        categories={categories}
                        onSubmit={(data) => handleSubmit(data, null)}
                        onCancel={() => { }}
                        isSubmitting={isSubmitting}
                        transactions={transactions}
                        trigger={
                            <CustomButton variant="primary" className="shadow-lg">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Transaction
                            </CustomButton>
                        }
                    />
                </div>

                <TransactionFilters
                    filters={filters}
                    setFilters={setFilters}
                    categories={categories}
                />

                <TransactionList
                    transactions={filteredTransactions}
                    categories={categories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                    onSubmit={handleSubmit}
                    isSubmitting={isSubmitting}
                />
            </div>
        </div>
    );
}