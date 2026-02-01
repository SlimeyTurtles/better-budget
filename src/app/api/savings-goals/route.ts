import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { randomUUID } from "crypto";

const createSavingsGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive("Target amount must be positive").max(999999999),
  currentAmount: z.number().min(0).max(999999999).optional().default(0),
  targetDate: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const goals = await prisma.savingsGoal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: [
        { isPrimary: "desc" },
        { createdAt: "desc" },
      ],
    });

    // Get income config for savings rate calculation
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let dailySavingsRate = 0;
    if (incomeConfig) {
      const monthlySavingsGoal = incomeConfig.savingsIsPercent
        ? (Number(incomeConfig.projectedMonthlyIncome) * Number(incomeConfig.monthlySavingsGoal)) / 100
        : Number(incomeConfig.monthlySavingsGoal);
      dailySavingsRate = monthlySavingsGoal / daysInMonth;
    }

    return NextResponse.json({
      goals: goals.map((goal) => {
        const targetAmount = Number(goal.targetAmount);
        const currentAmount = Number(goal.currentAmount);
        const remaining = Math.max(0, targetAmount - currentAmount);
        const progressPercent = targetAmount > 0
          ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
          : 0;

        // daysUntilGoal: at current savings rate from income config
        const daysUntilGoal = dailySavingsRate > 0 && remaining > 0
          ? Math.ceil(remaining / dailySavingsRate)
          : remaining === 0 ? 0 : null;

        // daysUntilDeadline: days until the target date
        let daysUntilDeadline: number | null = null;
        let contributionNeeded: number | null = null;
        let monthlyContributionNeeded: number | null = null;
        let isOnTrack = true;

        if (goal.targetDate) {
          const targetDate = new Date(goal.targetDate);
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const diffTime = targetDate.getTime() - todayStart.getTime();
          daysUntilDeadline = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (daysUntilDeadline > 0 && remaining > 0) {
            contributionNeeded = remaining / daysUntilDeadline;
            monthlyContributionNeeded = contributionNeeded * 30.44; // Average days in month

            // Check if on track (can meet goal with current daily savings rate)
            isOnTrack = dailySavingsRate >= contributionNeeded;
          } else if (daysUntilDeadline <= 0 && remaining > 0) {
            // Past deadline and not complete
            isOnTrack = false;
          }
        }

        return {
          id: goal.id,
          name: goal.name,
          targetAmount,
          currentAmount,
          remaining,
          progressPercent,
          targetDate: goal.targetDate?.toISOString().split("T")[0] ?? null,
          daysUntilDeadline,
          contributionNeeded: contributionNeeded !== null ? Math.round(contributionNeeded * 100) / 100 : null,
          monthlyContributionNeeded: monthlyContributionNeeded !== null ? Math.round(monthlyContributionNeeded * 100) / 100 : null,
          isOnTrack,
          isComplete: goal.isComplete,
          isPrimary: goal.isPrimary,
          daysUntilGoal,
          createdAt: goal.createdAt.toISOString(),
        };
      }),
      dailySavingsRate: Math.round(dailySavingsRate * 100) / 100,
    });
  } catch (error) {
    console.error("Error fetching savings goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch savings goals" },
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
    const validatedData = createSavingsGoalSchema.parse(body);

    const isComplete = validatedData.currentAmount >= validatedData.targetAmount;

    const goal = await prisma.savingsGoal.create({
      data: {
        id: randomUUID(),
        userId: session.user.id,
        name: validatedData.name,
        targetAmount: validatedData.targetAmount,
        currentAmount: validatedData.currentAmount,
        targetDate: validatedData.targetDate ? new Date(validatedData.targetDate) : null,
        isComplete,
        updatedAt: new Date(),
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
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating savings goal:", error);
    return NextResponse.json(
      { error: "Failed to create savings goal" },
      { status: 500 }
    );
  }
}
