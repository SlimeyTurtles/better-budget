-- AlterTable
ALTER TABLE "BudgetGoal" ADD COLUMN     "tagId" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#6B7280',
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionTag" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionTag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_userId_name_key" ON "Tag"("userId", "name");

-- CreateIndex
CREATE INDEX "TransactionTag_transactionId_idx" ON "TransactionTag"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionTag_tagId_idx" ON "TransactionTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "TransactionTag_transactionId_tagId_key" ON "TransactionTag"("transactionId", "tagId");

-- CreateIndex
CREATE INDEX "BudgetGoal_tagId_idx" ON "BudgetGoal"("tagId");

-- AddForeignKey
ALTER TABLE "BudgetGoal" ADD CONSTRAINT "BudgetGoal_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionTag" ADD CONSTRAINT "TransactionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data Migration: Create tags from existing transaction categories
INSERT INTO "Tag" ("id", "userId", "name", "isSystem", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    "category",
    true,
    NOW(),
    NOW()
FROM "Transaction"
WHERE "category" IS NOT NULL
GROUP BY "userId", "category"
ON CONFLICT ("userId", "name") DO NOTHING;

-- Data Migration: Create tags from existing personalCategory (if different from category)
INSERT INTO "Tag" ("id", "userId", "name", "isSystem", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    "personalCategory",
    false,
    NOW(),
    NOW()
FROM "Transaction"
WHERE "personalCategory" IS NOT NULL
GROUP BY "userId", "personalCategory"
ON CONFLICT ("userId", "name") DO NOTHING;

-- Data Migration: Create TransactionTag entries for existing categories
INSERT INTO "TransactionTag" ("id", "transactionId", "tagId", "createdAt")
SELECT
    gen_random_uuid()::text,
    t."id",
    tag."id",
    NOW()
FROM "Transaction" t
JOIN "Tag" tag ON tag."userId" = t."userId" AND tag."name" = t."category"
WHERE t."category" IS NOT NULL
ON CONFLICT ("transactionId", "tagId") DO NOTHING;

-- Data Migration: Create TransactionTag entries for personalCategory (if different)
INSERT INTO "TransactionTag" ("id", "transactionId", "tagId", "createdAt")
SELECT
    gen_random_uuid()::text,
    t."id",
    tag."id",
    NOW()
FROM "Transaction" t
JOIN "Tag" tag ON tag."userId" = t."userId" AND tag."name" = t."personalCategory"
WHERE t."personalCategory" IS NOT NULL
  AND (t."category" IS NULL OR t."personalCategory" != t."category")
ON CONFLICT ("transactionId", "tagId") DO NOTHING;

-- Data Migration: Create tags from BudgetGoal categories
INSERT INTO "Tag" ("id", "userId", "name", "isSystem", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    "userId",
    "category",
    false,
    NOW(),
    NOW()
FROM "BudgetGoal"
WHERE "category" IS NOT NULL
ON CONFLICT ("userId", "name") DO NOTHING;

-- Data Migration: Link BudgetGoals to their tags
UPDATE "BudgetGoal" bg
SET "tagId" = tag."id"
FROM "Tag" tag
WHERE tag."userId" = bg."userId"
  AND tag."name" = bg."category"
  AND bg."category" IS NOT NULL;
