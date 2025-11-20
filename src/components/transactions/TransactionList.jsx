import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TransactionItem from "./TransactionItem";

// UPDATED 15-Jan-2025: Added onSubmit and isSubmitting props for proper edit form handling
export default function TransactionList({ 
  transactions, 
  categories, 
  onEdit, 
  onDelete, 
  isLoading,
  onSubmit,
  isSubmitting
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

  if (transactions.length === 0) {
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

  return (
    <Card className="border-none shadow-lg">
      <CardHeader>
        <CardTitle>All Transactions ({transactions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              category={categoryMap[transaction.category_id]}
              onEdit={onEdit}
              onDelete={onDelete}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              categories={categories} // CREATED 20-NOV-2025: Pass all categories to TransactionItem for editing
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// UPDATED 15-Jan-2025: Added onSubmit and isSubmitting props
// These are passed down to TransactionItem to enable proper edit form handling
// onEdit triggers the edit form to open (via handleEdit from useTransactionActions)
// onSubmit handles the actual form submission (via handleSubmit from useTransactionActions)