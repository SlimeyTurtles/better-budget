import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const updateTransactionSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  name: z.string().min(1, "Name is required").optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  category: z.string().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
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

    // If tagIds provided, verify they belong to the user
    if (validatedData.tagIds !== undefined) {
      if (validatedData.tagIds.length > 0) {
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

      // Update tags: delete existing and create new ones
      await prisma.$transaction([
        prisma.transactionTag.deleteMany({
          where: { transactionId: id },
        }),
        ...(validatedData.tagIds.length > 0
          ? [
              prisma.transactionTag.createMany({
                data: validatedData.tagIds.map((tagId) => ({
                  id: randomUUID(),
                  transactionId: id,
                  tagId,
                })),
              }),
            ]
          : []),
      ]);
    }

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

    return NextResponse.json({ transaction: transformedTransaction });
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
