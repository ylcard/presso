import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency } from "../utils/currencyUtils";

export default function TrendChart({ allTransactions = [], currentMonth, currentYear, settings }) {
  const data = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      let targetMonth = currentMonth - i;
      let targetYear = currentYear;
      
      if (targetMonth < 0) {
        targetMonth += 12;
        targetYear -= 1;
      }

      const d = new Date(targetYear, targetMonth, 1);
      const label = d.toLocaleDateString('en-US', { month: 'short' });

      const monthTrans = allTransactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear;
      });

      const income = monthTrans
        .filter(t => t.amount > 0)
        .reduce((acc, t) => acc + t.amount, 0);
        
      const expense = monthTrans
        .filter(t => t.amount < 0)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

      result.push({ label, income, expense });
    }
    return result;
  }, [allTransactions, currentMonth, currentYear]);

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);

  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-gray-800">6 Month Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-52 flex items-end justify-between gap-2 mt-4 px-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-3 group relative h-full justify-end">
              <div className="flex gap-1 md:gap-3 items-end h-full w-full justify-center">
                <div 
                  className="w-3 md:w-8 bg-emerald-400 rounded-t-md transition-all duration-300 hover:bg-emerald-500 relative"
                  style={{ height: `${Math.max((item.income / maxVal) * 100, 2)}%` }}
                />
                <div 
                  className="w-3 md:w-8 bg-rose-400 rounded-t-md transition-all duration-300 hover:bg-rose-500 relative"
                  style={{ height: `${Math.max((item.expense / maxVal) * 100, 2)}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${idx === 5 ? 'text-gray-900 font-bold' : 'text-gray-400'}`}>
                {item.label}
              </span>
              
              <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs p-2 rounded shadow-lg z-10 whitespace-nowrap pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                  <span className="text-emerald-100">In: {formatCurrency(item.income, settings)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                  <span className="text-rose-100">Out: {formatCurrency(item.expense, settings)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}