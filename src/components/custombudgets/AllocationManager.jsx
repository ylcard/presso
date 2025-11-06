import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSettings } from "../utils/SettingsContext";
import { formatCurrency } from "../utils/formatCurrency";
import AllocationForm from "./AllocationForm";
import AllocationCard from "./AllocationCard";
import { motion } from "framer-motion";

export default function AllocationManager({ 
  customBudget, 
  allocations, 
  categories, 
  allocationStats,
  onCreateAllocation,
  onUpdateAllocation,
  onDeleteAllocation,
  isSubmitting
}) {
  const { settings } = useSettings();
  const [showForm, setShowForm] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState(null);

  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const handleSubmit = (data) => {
    if (editingAllocation) {
      onUpdateAllocation({ id: editingAllocation.id, data });
    } else {
      onCreateAllocation(data);
    }
    setShowForm(false);
    setEditingAllocation(null);
  };

  const handleEdit = (allocation) => {
    setEditingAllocation(allocation);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to remove this allocation?')) {
      onDeleteAllocation(id);
    }
  };

  const usedCategories = allocations.map(a => a.categoryId);
  const availableCategories = categories.filter(c => !usedCategories.includes(c.id));

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Budget Allocations</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Allocate portions of your budget to specific categories
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAllocation(null);
            setShowForm(!showForm);
          }}
          size="sm"
          disabled={availableCategories.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          Allocate Funds
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {showForm && (
          <AllocationForm
            allocation={editingAllocation}
            customBudgetId={customBudget.id}
            categories={availableCategories}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingAllocation(null);
            }}
            isSubmitting={isSubmitting}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Remaining Funds Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-2 border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 h-full">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <p className="text-sm font-semibold text-gray-600 mb-2">Remaining Funds</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(allocationStats.unallocatedRemaining, settings)}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Category Allocation Cards */}
          {allocations.length === 0 ? (
            <div className="col-span-full h-32 flex items-center justify-center text-gray-400 border border-dashed border-gray-300 rounded-lg">
              <p>No allocations yet. Add your first one!</p>
            </div>
          ) : (
            allocations.map((allocation) => {
              const category = categoryMap[allocation.categoryId];
              const stats = allocationStats.categorySpending[allocation.categoryId] || {
                allocated: 0,
                spent: 0,
                remaining: 0,
                percentageUsed: 0
              };

              if (!category) return null;

              return (
                <AllocationCard
                  key={allocation.id}
                  allocation={allocation}
                  category={category}
                  stats={stats}
                  settings={settings}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}