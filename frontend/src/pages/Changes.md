Suggested changes for Reports.jsx
diff -u ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/pages/Reports.jsx ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/pages/Reports.jsx
--- ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/pages/Reports.jsx
+++ ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/pages/Reports.jsx
@@ -9,6 +9,8 @@
 import ProjectionChart from "../components/reports/ProjectionChart";
 import ReportStats from "../components/reports/ReportStats";
 import { calculateProjection } from "../components/utils/projectionUtils";
+import FinancialHealthScore from "../components/reports/FinancialHealthScore";
+import { getMonthBoundaries } from "../components/utils/dateUtils";
 
 export default function Reports() {
     const { user, settings } = useSettings();
@@ -38,6 +40,9 @@
     const prevMonthlyTransactions = useMonthlyTransactions(transactions, prevMonth, prevYear);
     const prevMonthlyIncome = useMonthlyIncome(transactions, prevMonth, prevYear);
 
+    // Calculate previous month boundaries for accurate expense filtering
+    const { monthStart: prevMonthStart, monthEnd: prevMonthEnd } = getMonthBoundaries(prevMonth, prevYear);
+
 
     const isLoading = loadingTransactions || loadingCategories || loadingGoals;
 
@@ -70,15 +75,33 @@
                     </div>
                 </div>
 
-                {/* 1. High-Level KPIs (New) */}
-                <ReportStats
-                    transactions={monthlyTransactions}
-                    monthlyIncome={monthlyIncome}
-                    prevTransactions={prevMonthlyTransactions}
-                    prevMonthlyIncome={prevMonthlyIncome}
-                    isLoading={isLoading}
-                    settings={settings}
-                    safeBaseline={projectionData.totalProjectedMonthly}
-                    startDate={monthStart}
-                    endDate={monthEnd}
-                />
+                {/* 1. High-Level Analysis Grid */}
+                <div className="grid lg:grid-cols-2 gap-6">
+                    {/* Left: Key Stats */}
+                    <ReportStats
+                        transactions={monthlyTransactions}
+                        monthlyIncome={monthlyIncome}
+                        prevTransactions={prevMonthlyTransactions}
+                        prevMonthlyIncome={prevMonthlyIncome}
+                        isLoading={isLoading}
+                        settings={settings}
+                        safeBaseline={projectionData.totalProjectedMonthly}
+                        startDate={monthStart}
+                        endDate={monthEnd}
+                        prevStartDate={prevMonthStart}
+                        prevEndDate={prevMonthEnd}
+                    />
+
+                    {/* Right: Health Score */}
+                    <FinancialHealthScore 
+                        monthlyIncome={monthlyIncome}
+                        transactions={monthlyTransactions}
+                        prevMonthlyIncome={prevMonthlyIncome}
+                        prevTransactions={prevMonthlyTransactions}
+                        startDate={monthStart}
+                        endDate={monthEnd}
+                        prevStartDate={prevMonthStart}
+                        prevEndDate={prevMonthEnd}
+                        isLoading={isLoading}
+                        settings={settings}
+                    />
+                </div>
 
                 {/* 2. Historical Context & Future Projection */}
                 <div className="w-full">
