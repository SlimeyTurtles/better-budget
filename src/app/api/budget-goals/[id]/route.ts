import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const budgetPeriodTypes = ["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"] as const;

const updateBudgetGoalSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  tagId: z.string().optional(),
  periodType: z.enum(budgetPeriodTypes).optional(),
  periodAmount: z.number().positive().max(999999999).optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  periodStartDay: z.number().min(0).max(31).nullable().optional(),
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
      include: { Tag: true },
    });

    if (!goal) {
      return NextResponse.json({ error: "Budget goal not found" }, { status: 404 });
    }

    return NextResponse.json({
      goal: {
        id: goal.id,
        category: goal.category,
        tagId: goal.tagId,
        tag: goal.Tag ? {
          id: goal.Tag.id,
          name: goal.Tag.name,
          color: goal.Tag.color,
          isSystem: goal.Tag.isSystem,
        } : null,
        periodType: goal.periodType,
        periodAmount: Number(goal.periodAmount),
        startDate: goal.startDate?.toISOString().split("T")[0] ?? null,
        endDate: goal.endDate?.toISOString().split("T")[0] ?? null,
        periodStartDay: goal.periodStartDay,
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

    // If changing tagId, verify it belongs to the user
    if (validatedData.tagId && validatedData.tagId !== existingGoal.tagId) {
      const tag = await prisma.tag.findFirst({
        where: {
          id: validatedData.tagId,
          userId: session.user.id,
        },
      });
      if (!tag) {
        return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
      }

      // Check if another budget goal already uses this tag
      const conflicting = await prisma.budgetGoal.findFirst({
        where: {
          userId: session.user.id,
          tagId: validatedData.tagId,
          id: { not: id },
        },
      });
      if (conflicting) {
        return NextResponse.json(
          { error: "A budget for this tag already exists" },
          { status: 409 }
        );
      }
    }

    // If changing category, check for conflicts (legacy support)
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
        ...(validatedData.tagId !== undefined && { tagId: validatedData.tagId }),
        ...(validatedData.periodType !== undefined && { periodType: validatedData.periodType }),
        ...(validatedData.periodAmount !== undefined && { periodAmount: validatedData.periodAmount }),
        ...(validatedData.startDate !== undefined && {
          startDate: validatedData.startDate ? new Date(validatedData.startDate) : null
        }),
        ...(validatedData.endDate !== undefined && {
          endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
        }),
        ...(validatedData.periodStartDay !== undefined && { periodStartDay: validatedData.periodStartDay }),
        ...(validatedData.isActive !== undefined && { isActive: validatedData.isActive }),
        updatedAt: new Date(),
      },
      include: { Tag: true },
    });

    return NextResponse.json({
      goal: {
        id: goal.id,
        category: goal.category,
        tagId: goal.tagId,
        tag: goal.Tag ? {
          id: goal.Tag.id,
          name: goal.Tag.name,
          color: goal.Tag.color,
          isSystem: goal.Tag.isSystem,
        } : null,
        periodType: goal.periodType,
        periodAmount: Number(goal.periodAmount),
        startDate: goal.startDate?.toISOString().split("T")[0] ?? null,
        endDate: goal.endDate?.toISOString().split("T")[0] ?? null,
        periodStartDay: goal.periodStartDay,
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
