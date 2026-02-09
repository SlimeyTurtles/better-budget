import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { DEFAULT_DASHBOARD_CARDS, DashboardCardConfig } from "@/types/dashboard";

const cardConfigSchema = z.object({
  id: z.string(),
  type: z.enum([
    "TOTAL_BALANCE",
    "MONTHLY_SPENDING",
    "AVAILABLE_TODAY",
    "TOTAL_EXPENSES",
    "BUDGET_REMAINING",
    "BUDGET_TOTAL_REMAINING",
    "SAVINGS_PROGRESS",
    "EMERGENCY_FUND",
  ]),
  position: z.number().int().min(0),
  config: z
    .object({
      budgetGoalId: z.string().optional(),
      savingsGoalId: z.string().optional(),
    })
    .optional(),
});

const updateConfigSchema = z.object({
  cards: z.array(cardConfigSchema).max(10),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.dashboardConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return NextResponse.json({
        cards: DEFAULT_DASHBOARD_CARDS,
      });
    }

    return NextResponse.json({
      cards: config.cards as unknown as DashboardCardConfig[],
    });
  } catch (error) {
    console.error("Error fetching dashboard config:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard configuration" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = updateConfigSchema.parse(body);

    const config = await prisma.dashboardConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        cards: validatedData.cards,
      },
      update: {
        cards: validatedData.cards,
      },
    });

    return NextResponse.json({
      success: true,
      cards: config.cards as unknown as DashboardCardConfig[],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating dashboard config:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard configuration" },
      { status: 500 }
    );
  }
}
