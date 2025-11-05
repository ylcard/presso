
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSettings } from "../components/utils/SettingsContext";

import MiniBudgetForm from "../components/minibudgets/MiniBudgetForm";
import MiniBudgetList from "../components/minibudgets/MiniBudgetList";
import MonthNavigator from "../components/ui/MonthNavigator";

export default function MiniBudgets() {
  const { user } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: allMiniBudgets = [] } = useQuery({
    queryKey: ['miniBudgets'],
    queryFn: async () => {
      if (!user) return [];
      const all = await base44.entities.MiniBudget.list('-startDate');
      return all.filter(mb => mb.user_email === user.email);
    },
    initialData: [],
    enabled: !!user,
  });

  const miniBudgets = useMemo(() => {
    return allMiniBudgets.filter(mb => {
      const start = new Date(mb.startDate);
      const end = new Date(mb.endDate);
      const selectedMonthStart = new Date(selectedYear, selectedMonth, 1);
      const selectedMonthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      // Budget overlaps with selected month
      return (start <= selectedMonthEnd && end >= selectedMonthStart);
    });
  }, [allMiniBudgets, selectedMonth, selectedYear]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MiniBudget.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      setShowForm(false);
      setEditingBudget(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MiniBudget.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      setShowForm(false);
      setEditingBudget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      // First delete all transactions associated with this mini budget
      const transactions = await base44.entities.Transaction.list();
      const budgetTransactions = transactions.filter(t => t.miniBudgetId === id);
      
      for (const transaction of budgetTransactions) {
        await base44.entities.Transaction.delete(transaction.id);
      }
      
      // Then delete the mini budget
      await base44.entities.MiniBudget.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const handleSubmit = (data) => {
    const budgetData = {
      ...data,
      user_email: user.email,
      isSystemBudget: false
    };

    if (editingBudget) {
      updateMutation.mutate({ id: editingBudget.id, data: budgetData });
    } else {
      createMutation.mutate(budgetData);
    }
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this mini budget? All associated transactions will also be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const displayDate = new Date(selectedYear, selectedMonth);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Mini Budgets</h1>
            <p className="text-gray-500 mt-1">Track budgets for {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Button
            onClick={() => {
              setEditingBudget(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Mini Budget
          </Button>
        </div>

        <MonthNavigator
          currentMonth={selectedMonth}
          currentYear={selectedYear}
          onMonthChange={(month, year) => {
            setSelectedMonth(month);
            setSelectedYear(year);
          }}
        />

        {showForm && (
          <MiniBudgetForm
            budget={editingBudget}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingBudget(null);
            }}
            isSubmitting={createMutation.isPending || updateMutation.isPending}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        )}

        <MiniBudgetList
          miniBudgets={miniBudgets}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
