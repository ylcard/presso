import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTransactions, useCategories, useCashWallet } from "../components/hooks/useBase44Entities";
import { useTransactionFiltering } from "../components/hooks/useDerivedData";
import { useTransactionActions } from "../components/hooks/useActions";
import { useSettings } from "../components/utils/SettingsContext";
import ConfirmDialog from "../components/ui/ConfirmDialog";

import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import TransactionFilters from "../components/transactions/TransactionFilters";

export default function Transactions() {
  const { user } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // ADDED 15-Jan-2025: ConfirmDialog state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState(null);

  // Data fetching
  const { transactions, isLoading } = useTransactions();
  const { categories } = useCategories();
  const { cashWallet } = useCashWallet(user);

  // Filtering logic
  const { filters, setFilters, filteredTransactions } = useTransactionFiltering(transactions);

  // Actions (mutations and handlers)
  // FIXED 15-Jan-2025: Added showDeleteConfirm, setShowDeleteConfirm, and onDeleteConfirm callback
  const { handleSubmit, handleEdit, handleDelete, isSubmitting } = useTransactionActions(
    setShowForm,
    setEditingTransaction,
    cashWallet,
    showDeleteConfirm,
    setShowDeleteConfirm,
    (deleteAction) => setPendingDeleteAction(() => deleteAction)
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
            onCancel={() => setShowForm(false)}
            isSubmitting={isSubmitting}
            transactions={transactions}
            trigger={
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
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
        
        {/* ADDED 15-Jan-2025: ConfirmDialog for delete confirmation */}
        <ConfirmDialog
          open={showDeleteConfirm}
          onOpenChange={setShowDeleteConfirm}
          onConfirm={() => {
            if (pendingDeleteAction) {
              pendingDeleteAction();
              setPendingDeleteAction(null);
            }
          }}
          title="Delete Transaction"
          description="Are you sure you want to delete this transaction? This action cannot be undone."
          destructive
        />
      </div>
    </div>
  );
}

// DEPRECATED 15-Jan-2025: The old showForm state and TransactionForm wrapper has been removed
// Now using TransactionForm component with popover trigger directly
// The form now handles its own state and visibility through the Popover component

// FIXED 15-Jan-2025: Critical bug fix for edit functionality
// - Changed onEdit prop from inline arrow function to handleEdit from useTransactionActions
// - The old implementation: onEdit={(transaction, data) => handleSubmit(data, transaction)}
//   was incorrect because onEdit should open the edit form, not submit it
// - handleEdit properly sets editingTransaction state and opens the form
// - handleSubmit is called internally by TransactionForm after user submits
// - Added onSubmit and isSubmitting props to TransactionList for proper form handling
// - Added ConfirmDialog integration for delete confirmation (matching Budget Detail implementation)