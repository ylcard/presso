Suggested changes for ReportStats.jsx
diff -u ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/components/reports/ReportStats.jsx ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/components/reports/ReportStats.jsx
--- ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/components/reports/ReportStats.jsx
+++ ylcard/presso/presso-71fd993e5748fe1375a5661062d20266298dad62/src/components/reports/ReportStats.jsx
@@ -12,7 +12,9 @@
     settings,
     safeBaseline = 0,
     startDate,
-    endDate
+    endDate,
+    prevStartDate,
+    prevEndDate
 }) {
     if (isLoading) {
         return (
@@ -24,7 +26,7 @@
     }
 
     const totalPaidExpenses = Math.abs(getMonthlyPaidExpenses(transactions, startDate, endDate));
-    const prevPaidExpenses = Math.abs(getMonthlyPaidExpenses(prevTransactions));
+    const prevPaidExpenses = Math.abs(getMonthlyPaidExpenses(prevTransactions, prevStartDate, prevEndDate));
 
     const netFlow = monthlyIncome - totalPaidExpenses;
     const prevNetFlow = prevMonthlyIncome - prevPaidExpenses;
@@ -71,7 +73,7 @@
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
-            <Card className="border-none shadow-sm">
+            <Card className="border-none shadow-sm h-full">
                 <CardContent className="p-6 text-center">
                     <div className="flex flex-col items-center">
                         <p className="text-sm font-medium text-gray-500">Savings Rate</p>
@@ -95,7 +97,7 @@
                 </CardContent>
             </Card>
 
-            <Card className="border-none shadow-sm">
+            <Card className="border-none shadow-sm h-full">
                 <CardContent className="p-6 text-center">
                     <div className="flex flex-col items-center">
                         <p className="text-sm font-medium text-gray-500">Net Flow</p>
