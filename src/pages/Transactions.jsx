
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Filter } from "lucide-react";

import TransactionForm from "../components/transactions/TransactionForm";
import TransactionList from "../components/transactions/TransactionList";
import TransactionFilters from "../components/transactions/TransactionFilters";

export default function Transactions() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [filters, setFilters] = useState({ 
    type: 'all', 
    category: [], // Changed to array for multi-select
    paymentStatus: 'all',
    startDate: currentMonthStart,
    endDate: currentMonthEnd
  });
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date'),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Transaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Transaction.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      setShowForm(false);
      setEditingTransaction(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Transaction.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleSubmit = (data) => {
    if (editingTransaction) {
      updateMutation.mutate({ id: editingTransaction.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = filters.type === 'all' || t.type === filters.type;
      
      // Updated to handle multiple categories
      const categoryMatch = !filters.category || filters.category.length === 0 || filters.category.includes(t.category_id);
      
      const paymentStatusMatch = filters.paymentStatus === 'all' || 
        (filters.paymentStatus === 'paid' && t.isPaid) ||
        (filters.paymentStatus === 'unpaid' && !t.isPaid);
      
      let dateMatch = true;
      if (filters.startDate && filters.endDate) {
        // Ensure comparison is consistent. Convert transaction date to same format as filter dates.
        const transactionDate = new Date(t.date);
        const start = new Date(filters.startDate);
        const end = new Date(filters.endDate);
        
        // Normalize dates to start of day for comparison to include full end day
        transactionDate.setHours(0, 0, 0, 0);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        dateMatch = transactionDate >= start && transactionDate <= end;
      }
      
      return typeMatch && categoryMatch && paymentStatusMatch && dateMatch;
    });
  }, [transactions, filters]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 mt-1">Track your income and expenses</p>
          </div>
          <Button
            onClick={() => {
              setEditingTransaction(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {showForm && (
          <TransactionForm
            transaction={editingTransaction}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTransaction(null);
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
          />
        )}

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
        />
      </div>
    </div>
  );
}
