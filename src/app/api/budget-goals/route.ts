import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const budgetPeriodTypes = ["WEEKLY", "BIWEEKLY", "MONTHLY", "CUSTOM"] as const;

const createBudgetGoalSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  tagId: z.string().optional(),
  periodType: z.enum(budgetPeriodTypes).default("MONTHLY"),
  periodAmount: z.number().positive("Budget amount must be positive").max(999999999),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  periodStartDay: z.number().min(0).max(31).optional(),
}).refine((data) => {
  // Must have either category or tagId
  return data.category || data.tagId;
}, {
  message: "Either category or tagId is required",
  path: ["tagId"],
}).refine((data) => {
  // CUSTOM period requires both startDate and endDate
  if (data.periodType === "CUSTOM") {
    return data.startDate && data.endDate;
  }
  return true;
}, {
  message: "Custom period requires both start and end dates",
  path: ["startDate"],
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
      include: {
        Tag: true,
      },
      orderBy: { category: "asc" },
    });

    return NextResponse.json({
      goals: goals.map((goal) => ({
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

    // Determine the tagId to use
    let tagId = validatedData.tagId;
    let categoryName = validatedData.category;

    // If tagId is provided, verify it belongs to the user and get the category name
    if (tagId) {
      const tag = await prisma.tag.findFirst({
        where: {
          id: tagId,
          userId: session.user.id,
        },
      });
      if (!tag) {
        return NextResponse.json({ error: "Invalid tag ID" }, { status: 400 });
      }
      categoryName = tag.name;
    } else if (categoryName) {
      // If only category is provided, find or create a tag for it
      const tag = await prisma.tag.upsert({
        where: {
          userId_name: {
            userId: session.user.id,
            name: categoryName,
          },
        },
        create: {
          id: randomUUID(),
          userId: session.user.id,
          name: categoryName,
          isSystem: false,
        },
        update: {},
      });
      tagId = tag.id;
    }

    // Check if budget goal already exists for this category
    const existing = await prisma.budgetGoal.findFirst({
      where: {
        userId: session.user.id,
        OR: [
          { category: categoryName },
          { tagId: tagId },
        ],
      },
    });

    if (existing) {
      // Reactivate if it was deactivated
      if (!existing.isActive) {
        const updated = await prisma.budgetGoal.update({
          where: { id: existing.id },
          data: {
            tagId: tagId,
            periodType: validatedData.periodType,
            periodAmount: validatedData.periodAmount,
            startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
            endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
            periodStartDay: validatedData.periodStartDay ?? null,
            isActive: true,
            updatedAt: new Date(),
          },
          include: { Tag: true },
        });
        return NextResponse.json({
          goal: {
            id: updated.id,
            category: updated.category,
            tagId: updated.tagId,
            tag: updated.Tag ? {
              id: updated.Tag.id,
              name: updated.Tag.name,
              color: updated.Tag.color,
              isSystem: updated.Tag.isSystem,
            } : null,
            periodType: updated.periodType,
            periodAmount: Number(updated.periodAmount),
            startDate: updated.startDate?.toISOString().split("T")[0] ?? null,
            endDate: updated.endDate?.toISOString().split("T")[0] ?? null,
            periodStartDay: updated.periodStartDay,
            isActive: updated.isActive,
          },
        }, { status: 201 });
      }
      return NextResponse.json(
        { error: "A budget for this tag already exists" },
        { status: 409 }
      );
    }

    const goal = await prisma.budgetGoal.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        category: categoryName,
        tagId: tagId,
        periodType: validatedData.periodType,
        periodAmount: validatedData.periodAmount,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : null,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
        periodStartDay: validatedData.periodStartDay ?? null,
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
