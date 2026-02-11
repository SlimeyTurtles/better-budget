import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(999999999, "Amount too large"),
  name: z.string().min(1, "Name is required").max(255).trim(),
  date: z.string().transform((str) => new Date(str)),
  category: z.string().max(100).optional(),
  tagIds: z.array(z.string()).optional(),
  isIncome: z.boolean(),
  bankAccountId: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");
    const tagId = searchParams.get("tagId");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      userId: session.user.id,
    };

    if (accountId) {
      where.bankAccountId = accountId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        (where.date as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.date as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Support both category (legacy) and tagId filtering
    if (category) {
      where.category = category;
    }

    if (tagId) {
      where.tags = {
        some: { tagId },
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          BankAccount: {
            select: {
              name: true,
              mask: true,
            },
          },
          tags: {
            include: {
              Tag: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Transform to use camelCase for client compatibility
    const transformedTransactions = transactions.map((t) => ({
      ...t,
      bankAccount: t.BankAccount,
      BankAccount: undefined,
      tags: t.tags.map((tt) => ({
        id: tt.Tag.id,
        name: tt.Tag.name,
        color: tt.Tag.color,
        isSystem: tt.Tag.isSystem,
      })),
    }));

    return NextResponse.json({ transactions: transformedTransactions, total });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting per user
    const rateLimit = checkRateLimit(`transactions:${session.user.id}`, RATE_LIMITS.api);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validatedData = createTransactionSchema.parse(body);

    // Get or create a manual account for the user
    let bankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: session.user.id,
        plaidAccountId: `manual-${session.user.id}`,
      },
    });

    if (!bankAccount) {
      // Create a PlaidItem placeholder for manual transactions
      const manualPlaidItem = await prisma.plaidItem.upsert({
        where: {
          itemId: `manual-item-${session.user.id}`,
        },
        update: {},
        create: {
          id: randomUUID(),
          userId: session.user.id,
          accessToken: "manual",
          itemId: `manual-item-${session.user.id}`,
          institutionName: "Manual Entry",
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });

      bankAccount = await prisma.bankAccount.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          plaidItemId: manualPlaidItem.id,
          plaidAccountId: `manual-${session.user.id}`,
          name: "Manual Entries",
          type: "OTHER",
          currentBalance: 0,
          availableBalance: 0,
          updatedAt: new Date(),
        },
      });
    }

    // Use provided bankAccountId or default to manual account
    const targetAccountId = validatedData.bankAccountId || bankAccount.id;

    // Verify the account belongs to the user if a specific account was provided
    if (validatedData.bankAccountId) {
      const userAccount = await prisma.bankAccount.findFirst({
        where: {
          id: validatedData.bankAccountId,
          userId: session.user.id,
        },
      });
      if (!userAccount) {
        return NextResponse.json({ error: "Invalid bank account" }, { status: 400 });
      }
    }

    const transactionId = randomUUID();

    // If tagIds provided, verify they belong to the user
    if (validatedData.tagIds && validatedData.tagIds.length > 0) {
      const validTags = await prisma.tag.findMany({
        where: {
          id: { in: validatedData.tagIds },
          userId: session.user.id,
        },
      });
      if (validTags.length !== validatedData.tagIds.length) {
        return NextResponse.json({ error: "Invalid tag IDs" }, { status: 400 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        id: transactionId,
        userId: session.user.id,
        bankAccountId: targetAccountId,
        amount: validatedData.amount,
        name: validatedData.name,
        date: validatedData.date,
        category: validatedData.category || null,
        isIncome: validatedData.isIncome,
        isManual: true,
        isPending: false,
        updatedAt: new Date(),
        tags: validatedData.tagIds && validatedData.tagIds.length > 0 ? {
          create: validatedData.tagIds.map((tagId) => ({
            id: randomUUID(),
            tagId,
          })),
        } : undefined,
      },
      include: {
        BankAccount: {
          select: {
            name: true,
            mask: true,
          },
        },
        tags: {
          include: {
            Tag: true,
          },
        },
      },
    });

    // Transform to use camelCase for client compatibility
    const transformedTransaction = {
      ...transaction,
      bankAccount: transaction.BankAccount,
      BankAccount: undefined,
      tags: transaction.tags.map((tt) => ({
        id: tt.Tag.id,
        name: tt.Tag.name,
        color: tt.Tag.color,
        isSystem: tt.Tag.isSystem,
      })),
    };

    return NextResponse.json({ transaction: transformedTransaction }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
