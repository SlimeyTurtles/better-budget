import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().max(999999999).optional(),
  currentAmount: z.number().min(0).max(999999999).optional(),
  targetDate: z.string().nullable().optional(),
  isPrimary: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const goal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const progressPercent = targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0;

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount,
        currentAmount,
        remaining: Math.max(0, targetAmount - currentAmount),
        progressPercent,
        targetDate: goal.targetDate?.toISOString().split("T")[0] ?? null,
        isComplete: goal.isComplete,
        isPrimary: goal.isPrimary,
        createdAt: goal.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching savings goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch savings goal" },
      { status: 500 }
    );
  }
}

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

    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateSavingsGoalSchema.parse(body);

    // Calculate if complete based on current/target amounts
    const newTargetAmount = validatedData.targetAmount ?? Number(existingGoal.targetAmount);
    const newCurrentAmount = validatedData.currentAmount ?? Number(existingGoal.currentAmount);
    const isComplete = newCurrentAmount >= newTargetAmount;

    // If setting as primary, unset other primary goals
    if (validatedData.isPrimary === true) {
      await prisma.savingsGoal.updateMany({
        where: {
          userId: session.user.id,
          isPrimary: true,
          id: { not: id },
        },
        data: { isPrimary: false },
      });
    }

    const goal = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...(validatedData.name !== undefined && { name: validatedData.name }),
        ...(validatedData.targetAmount !== undefined && { targetAmount: validatedData.targetAmount }),
        ...(validatedData.currentAmount !== undefined && { currentAmount: validatedData.currentAmount }),
        ...(validatedData.targetDate !== undefined && {
          targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        }),
        ...(validatedData.isPrimary !== undefined && { isPrimary: validatedData.isPrimary }),
        isComplete,
      },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        currentAmount: Number(goal.currentAmount),
        targetDate: goal.targetDate?.toISOString().split("T")[0] ?? null,
        isComplete: goal.isComplete,
        isPrimary: goal.isPrimary,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to update savings goal" },
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

    const existingGoal = await prisma.savingsGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Savings goal not found" }, { status: 404 });
    }

    await prisma.savingsGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting savings goal:", error);
    return NextResponse.json(
      { error: "Failed to delete savings goal" },
      { status: 500 }
    );
  }
}
