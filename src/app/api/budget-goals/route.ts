import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const createBudgetGoalSchema = z.object({
  category: z.string().min(1, "Category is required").max(100),
  monthlyLimit: z.number().positive("Monthly limit must be positive").max(999999999),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.budgetGoal.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      goals: goals.map((goal) => ({
        id: goal.id,
        category: goal.category,
        monthlyLimit: Number(goal.monthlyLimit),
        isActive: goal.isActive,
        createdAt: goal.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching budget goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch budget goals" },
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
    const validatedData = createBudgetGoalSchema.parse(body);

    // Check if category already exists for this user
    const existing = await prisma.budgetGoal.findUnique({
      where: {
        userId_category: {
          userId: session.user.id,
          category: validatedData.category,
        },
      },
    });

    if (existing) {
      // Reactivate if it was deactivated
      if (!existing.isActive) {
        const updated = await prisma.budgetGoal.update({
          where: { id: existing.id },
          data: {
            monthlyLimit: validatedData.monthlyLimit,
            isActive: true,
          },
        });
        return NextResponse.json({
          goal: {
            id: updated.id,
            category: updated.category,
            monthlyLimit: Number(updated.monthlyLimit),
            isActive: updated.isActive,
          },
        }, { status: 201 });
      }
      return NextResponse.json(
        { error: "A budget for this category already exists" },
        { status: 409 }
      );
    }

    const goal = await prisma.budgetGoal.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        category: validatedData.category,
        monthlyLimit: validatedData.monthlyLimit,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        category: goal.category,
        monthlyLimit: Number(goal.monthlyLimit),
        isActive: goal.isActive,
      },
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating budget goal:", error);
    return NextResponse.json(
      { error: "Failed to create budget goal" },
      { status: 500 }
    );
  }
}
