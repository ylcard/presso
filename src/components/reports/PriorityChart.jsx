
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const priorityConfig = {
  needs: { label: "Needs", color: "#EF4444" },
  wants: { label: "Wants", color: "#F59E0B" },
  savings: { label: "Savings", color: "#10B981" }
};

export default function PriorityChart({ transactions, categories, goals, monthlyIncome, isLoading }) {
  const categoryMap = categories.reduce((acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  }, {});

  const goalMap = goals.reduce((acc, goal) => {
    acc[goal.priority] = goal.target_percentage;
    return acc;
  }, {});

  const expensesByPriority = transactions
    .filter(t => t.type === 'expense' && t.category_id)
    .reduce((acc, t) => {
      const category = categoryMap[t.category_id];
      if (category) {
        const priority = category.priority;
        acc[priority] = (acc[priority] || 0) + t.amount; // Changed from calculateMonthlyAmount(t) to t.amount
      }
      return acc;
    }, {});

  const chartData = Object.entries(priorityConfig)
    .map(([key, config]) => {
      const amount = expensesByPriority[key] || 0;
      const actual = monthlyIncome > 0 ? (amount / monthlyIncome) * 100 : 0;
      const target = goalMap[key] || 0;
      
      return {
        name: config.label,
        actual,
        target,
        color: config.color
      };
    })
    .filter(item => item.actual > 0 || item.target > 0); // Filter out priorities with $0

  if (isLoading) {
    return (
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Actual vs Target by Priority</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-80 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>Actual vs Target by Priority</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-80 flex items-center justify-center text-gray-400">
            <p>No expenses to show yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: '% of Income', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value) => `${value.toFixed(1)}%`}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              />
              <Legend />
              <Bar dataKey="actual" name="Actual" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="target" name="Target" fill="#D1D5DB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
