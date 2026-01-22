import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  name: z.string().min(1, "Name is required"),
  date: z.string().transform((str) => new Date(str)),
  category: z.string().optional(),
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

    if (category) {
      where.category = category;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          bankAccount: {
            select: {
              name: true,
              mask: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({ transactions, total });
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
          userId: session.user.id,
          accessToken: "manual",
          itemId: `manual-item-${session.user.id}`,
          institutionName: "Manual Entry",
          status: "ACTIVE",
        },
      });

      bankAccount = await prisma.bankAccount.create({
        data: {
          userId: session.user.id,
          plaidItemId: manualPlaidItem.id,
          plaidAccountId: `manual-${session.user.id}`,
          name: "Manual Entries",
          type: "OTHER",
          currentBalance: 0,
          availableBalance: 0,
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

    const transaction = await prisma.transaction.create({
      data: {
        userId: session.user.id,
        bankAccountId: targetAccountId,
        amount: validatedData.amount,
        name: validatedData.name,
        date: validatedData.date,
        category: validatedData.category || null,
        isIncome: validatedData.isIncome,
        isManual: true,
        isPending: false,
      },
      include: {
        bankAccount: {
          select: {
            name: true,
            mask: true,
          },
        },
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
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
