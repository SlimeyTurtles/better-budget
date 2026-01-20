-- AlterTable
ALTER TABLE "IncomeConfig" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savingsIsPercent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "utilitiesAmount" DECIMAL(19,4) NOT NULL DEFAULT 0;
