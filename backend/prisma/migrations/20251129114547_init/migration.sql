-- DropIndex
DROP INDEX "budget_goals_priority_key";

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "systemBudgetId" TEXT;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_systemBudgetId_fkey" FOREIGN KEY ("systemBudgetId") REFERENCES "system_budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
