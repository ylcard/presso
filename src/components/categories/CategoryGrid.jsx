import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import CategoryCard from "./CategoryCard";

const priorityConfig = {
  needs: { label: "Needs", color: "text-red-600", bg: "bg-red-50" },
  wants: { label: "Wants", color: "text-orange-600", bg: "bg-orange-50" },
  savings: { label: "Savings", color: "text-green-600", bg: "bg-green-50" }
};

export default function CategoryGrid({ categories, onEdit, onDelete, isLoading }) {
  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (categories.length === 0) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-center justify-center text-gray-400">
            <p>No categories yet. Create your first one!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedCategories = categories.reduce((acc, cat) => {
    const priority = cat.priority || 'wants';
    if (!acc[priority]) acc[priority] = [];
    acc[priority].push(cat);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(priorityConfig).map(([priority, config]) => {
        const priorityCategories = groupedCategories[priority] || [];
        if (priorityCategories.length === 0) return null;

        return (
          <Card key={priority} className="border-none shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-lg text-sm ${config.bg} ${config.color}`}>
                  {config.label}
                </span>
                <span className="text-gray-400">({priorityCategories.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {priorityCategories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}