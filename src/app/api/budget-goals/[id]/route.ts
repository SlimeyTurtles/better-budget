import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateBudgetGoalSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  monthlyLimit: z.number().positive().max(999999999).optional(),
  isActive: z.boolean().optional(),
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

    const goal = await prisma.budgetGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!goal) {
      return NextResponse.json({ error: "Budget goal not found" }, { status: 404 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        category: goal.category,
        monthlyLimit: Number(goal.monthlyLimit),
        isActive: goal.isActive,
        createdAt: goal.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching budget goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget goal" },
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

    const existingGoal = await prisma.budgetGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Budget goal not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = updateBudgetGoalSchema.parse(body);

    // If changing category, check for conflicts
    if (validatedData.category && validatedData.category !== existingGoal.category) {
      const conflicting = await prisma.budgetGoal.findUnique({
        where: {
          userId_category: {
            userId: session.user.id,
            category: validatedData.category,
          },
        },
      });
      if (conflicting && conflicting.id !== id) {
        return NextResponse.json(
          { error: "A budget for this category already exists" },
          { status: 409 }
        );
      }
    }

    const goal = await prisma.budgetGoal.update({
      where: { id },
      data: {
        ...(validatedData.category !== undefined && { category: validatedData.category }),
        ...(validatedData.monthlyLimit !== undefined && { monthlyLimit: validatedData.monthlyLimit }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
      },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        category: goal.category,
        monthlyLimit: Number(goal.monthlyLimit),
        isActive: goal.isActive,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating budget goal:", error);
    return NextResponse.json(
      { error: "Failed to update budget goal" },
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

    const existingGoal = await prisma.budgetGoal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!existingGoal) {
      return NextResponse.json({ error: "Budget goal not found" }, { status: 404 });
    }

    await prisma.budgetGoal.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting budget goal:", error);
    return NextResponse.json(
      { error: "Failed to delete budget goal" },
      { status: 500 }
    );
  }
}
