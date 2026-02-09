-- CreateEnum
CREATE TYPE "BudgetPeriodType" AS ENUM ('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- AlterTable: Add new columns with defaults first
ALTER TABLE "BudgetGoal" ADD COLUMN "periodType" "BudgetPeriodType" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "BudgetGoal" ADD COLUMN "periodAmount" DECIMAL(19,4);
ALTER TABLE "BudgetGoal" ADD COLUMN "startDate" DATE;
ALTER TABLE "BudgetGoal" ADD COLUMN "endDate" DATE;
ALTER TABLE "BudgetGoal" ADD COLUMN "periodStartDay" INTEGER;

-- Copy existing monthlyLimit data to periodAmount
UPDATE "BudgetGoal" SET "periodAmount" = "monthlyLimit";

-- Make periodAmount required now that it has data
ALTER TABLE "BudgetGoal" ALTER COLUMN "periodAmount" SET NOT NULL;

-- Drop the old column
ALTER TABLE "BudgetGoal" DROP COLUMN "monthlyLimit";
