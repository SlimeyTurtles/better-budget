import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

const DEFAULT_EMERGENCY_FUND_TARGET = 1000;
const EMERGENCY_FUND_NAME = "Emergency Fund";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the emergency fund goal
    const emergencyFund = await prisma.savingsGoal.findFirst({
      where: {
        userId: session.user.id,
        name: EMERGENCY_FUND_NAME,
      },
    });

    // Get income config for savings rate calculation
    const incomeConfig = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    // Calculate the ideal daily savings rate
    // This is the user's monthly savings goal divided by days in month
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    let dailySavingsRate = 0;
    if (incomeConfig) {
      const monthlySavingsGoal = incomeConfig.savingsIsPercent
        ? (Number(incomeConfig.projectedMonthlyIncome) * Number(incomeConfig.monthlySavingsGoal)) / 100
        : Number(incomeConfig.monthlySavingsGoal);
      dailySavingsRate = monthlySavingsGoal / daysInMonth;
    }

    // If no emergency fund exists, return defaults
    if (!emergencyFund) {
      const remainingAmount = DEFAULT_EMERGENCY_FUND_TARGET;
      const daysUntilGoal = dailySavingsRate > 0
        ? Math.ceil(remainingAmount / dailySavingsRate)
        : null;

      return NextResponse.json({
        exists: false,
        targetAmount: DEFAULT_EMERGENCY_FUND_TARGET,
        currentAmount: 0,
        remainingAmount,
        progressPercent: 0,
        isComplete: false,
        dailySavingsRate: Math.round(dailySavingsRate * 100) / 100,
        daysUntilGoal,
      });
    }

    const targetAmount = Number(emergencyFund.targetAmount);
    const currentAmount = Number(emergencyFund.currentAmount);
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const progressPercent = targetAmount > 0
      ? Math.min(100, Math.round((currentAmount / targetAmount) * 100))
      : 0;

    // Calculate days until goal at current ideal savings rate
    const daysUntilGoal = dailySavingsRate > 0 && remainingAmount > 0
      ? Math.ceil(remainingAmount / dailySavingsRate)
      : remainingAmount === 0 ? 0 : null;

    return NextResponse.json({
      exists: true,
      id: emergencyFund.id,
      targetAmount,
      currentAmount,
      remainingAmount,
      progressPercent,
      isComplete: emergencyFund.isComplete,
      dailySavingsRate: Math.round(dailySavingsRate * 100) / 100,
      daysUntilGoal,
    });
  } catch (error) {
    console.error("Error fetching emergency fund:", error);
    return NextResponse.json(
      { error: "Failed to fetch emergency fund" },
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
    const { targetAmount, currentAmount } = body;

    // Validate inputs
    if (targetAmount !== undefined && (typeof targetAmount !== "number" || targetAmount < 0)) {
      return NextResponse.json({ error: "Invalid target amount" }, { status: 400 });
    }
    if (currentAmount !== undefined && (typeof currentAmount !== "number" || currentAmount < 0)) {
      return NextResponse.json({ error: "Invalid current amount" }, { status: 400 });
    }

    // Find existing emergency fund or create new one
    let emergencyFund = await prisma.savingsGoal.findFirst({
      where: {
        userId: session.user.id,
        name: EMERGENCY_FUND_NAME,
      },
    });

    const newTargetAmount = targetAmount ?? emergencyFund?.targetAmount ?? DEFAULT_EMERGENCY_FUND_TARGET;
    const newCurrentAmount = currentAmount ?? Number(emergencyFund?.currentAmount ?? 0);
    const isComplete = newCurrentAmount >= newTargetAmount;

    if (emergencyFund) {
      // Update existing
      emergencyFund = await prisma.savingsGoal.update({
        where: { id: emergencyFund.id },
        data: {
          targetAmount: newTargetAmount,
          currentAmount: newCurrentAmount,
          isComplete,
          isPrimary: true,
        },
      });
    } else {
      // Create new
      emergencyFund = await prisma.savingsGoal.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          name: EMERGENCY_FUND_NAME,
          targetAmount: newTargetAmount,
          currentAmount: newCurrentAmount,
          isComplete,
          isPrimary: true,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: emergencyFund.id,
      targetAmount: Number(emergencyFund.targetAmount),
      currentAmount: Number(emergencyFund.currentAmount),
      isComplete: emergencyFund.isComplete,
    });
  } catch (error) {
    console.error("Error updating emergency fund:", error);
    return NextResponse.json(
      { error: "Failed to update emergency fund" },
      { status: 500 }
    );
  }
}
