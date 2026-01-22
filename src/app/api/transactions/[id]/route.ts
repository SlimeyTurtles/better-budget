import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  name: z.string().min(1, "Name is required").optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  category: z.string().nullable().optional(),
  isIncome: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the transaction and verify ownership
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only allow editing manual transactions
    if (!existingTransaction.isManual) {
      return NextResponse.json(
        { error: "Only manual transactions can be edited" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateTransactionSchema.parse(body);

    const transaction = await prisma.transaction.update({
      where: { id },
      data: {
        ...(validatedData.amount !== undefined && { amount: validatedData.amount }),
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.date !== undefined && { date: validatedData.date }),
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.isIncome !== undefined && { isIncome: validatedData.isIncome }),
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

    return NextResponse.json({ transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the transaction and verify ownership
    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    // Only allow deleting manual transactions
    if (!existingTransaction.isManual) {
      return NextResponse.json(
        { error: "Only manual transactions can be deleted" },
        { status: 403 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}
