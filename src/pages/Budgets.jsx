
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSettings } from "../components/utils/SettingsContext";
import { getFirstDayOfMonth, getLastDayOfMonth, getSystemBudgetStats } from "../components/utils/budgetCalculations";

import MiniBudgetForm from "../components/minibudgets/MiniBudgetForm";
import MiniBudgetCard from "../components/minibudgets/MiniBudgetCard";
import MonthNavigator from "../components/ui/MonthNavigator";

export default function Budgets() {
  const { user, settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const queryClient = useQueryClient();
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list(),
    initialData: [],
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
    initialData: [],
  });

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

  const monthStart = useMemo(() => getFirstDayOfMonth(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const monthEnd = useMemo(() => getLastDayOfMonth(selectedMonth, selectedYear), [selectedMonth, selectedYear]);

  const { data: systemBudgets = [] } = useQuery({
    queryKey: ['systemBudgets', selectedMonth, selectedYear],
    queryFn: async () => {
      if (!user) return [];
      const all = await base44.entities.SystemBudget.list();
      return all.filter(sb => 
        sb.user_email === user.email &&
        sb.startDate === monthStart && 
        sb.endDate === monthEnd
      );
    },
    initialData: [],
    enabled: !!user,
  });

  const customBudgets = useMemo(() => {
    return allMiniBudgets.filter(mb => {
      const start = new Date(mb.startDate);
      const end = new Date(mb.endDate);
      const selectedMonthStart = new Date(selectedYear, selectedMonth, 1);
      const selectedMonthEnd = new Date(selectedYear, selectedMonth + 1, 0);
      
      return (start <= selectedMonthEnd && end >= selectedMonthStart);
    });
  }, [allMiniBudgets, selectedMonth, selectedYear]);

  // Pre-calculate system budget stats for correct display
  const systemBudgetsWithStats = useMemo(() => {
    return systemBudgets.map(sb => {
      const stats = getSystemBudgetStats(sb, transactions, categories, allMiniBudgets);
      return {
        ...sb,
        allocatedAmount: sb.budgetAmount,
        preCalculatedStats: stats
      };
    });
  }, [systemBudgets, transactions, categories, allMiniBudgets]);

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
      const budgetTransactions = transactions.filter(t => t.miniBudgetId === id);
      
      for (const transaction of budgetTransactions) {
        await base44.entities.Transaction.delete(transaction.id);
      }
      
      await base44.entities.MiniBudget.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MiniBudget.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['miniBudgets'] });
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
    if (confirm('Are you sure you want to delete this budget? All associated transactions will also be deleted.')) {
      deleteMutation.mutate(id);
    }
  };

  const handleStatusChange = (id, newStatus) => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  const displayDate = new Date(selectedYear, selectedMonth);

  // Group custom budgets by status - excluding archived
  const groupedCustomBudgets = useMemo(() => {
    return customBudgets.reduce((acc, budget) => {
      const status = budget.status || 'active';
      // Skip archived budgets
      if (status === 'archived') return acc;
      if (!acc[status]) acc[status] = [];
      acc[status].push(budget);
      return acc;
    }, {});
  }, [customBudgets]);

  const statusConfig = {
    active: { label: "Active", color: "text-green-600", bg: "bg-green-50" },
    completed: { label: "Completed", color: "text-blue-600", bg: "bg-blue-50" }
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Budgets</h1>
            <p className="text-gray-500 mt-1">Manage your budgets for {displayDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          <Button
            onClick={() => {
              setEditingBudget(null);
              setShowForm(!showForm);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Custom Budget
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

        {/* System Budgets Section */}
        {systemBudgetsWithStats.length > 0 && (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-sm bg-blue-50 text-blue-600">
                  System Budgets
                </span>
                <span className="text-gray-400">({systemBudgetsWithStats.length})</span>
              </CardTitle>
              <p className="text-sm text-gray-500 mt-2">
                Automatically managed based on your budget goals. These update based on your monthly income.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {systemBudgetsWithStats.map((budget) => (
                  <MiniBudgetCard
                    key={budget.id}
                    budget={budget}
                    transactions={transactions}
                    settings={settings}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onStatusChange={() => {}}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Custom Budgets Section */}
        {customBudgets.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-lg text-sm bg-purple-50 text-purple-600">
                  Custom Budgets
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-center justify-center text-gray-400">
                <p>No custom budgets yet. Create your first one!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(statusConfig).map(([status, config]) => {
            const statusBudgets = groupedCustomBudgets[status] || [];
            if (statusBudgets.length === 0) return null;

            return (
              <Card key={status} className="border-none shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm ${config.bg} ${config.color}`}>
                      Custom Budgets - {config.label}
                    </span>
                    <span className="text-gray-400">({statusBudgets.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {statusBudgets.map((budget) => (
                      <MiniBudgetCard
                        key={budget.id}
                        budget={budget}
                        transactions={transactions}
                        settings={settings}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
