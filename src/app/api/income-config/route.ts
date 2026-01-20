import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const incomeConfigSchema = z.object({
  projectedMonthlyIncome: z.number().min(0),
  payFrequency: z.enum(["WEEKLY", "BIWEEKLY", "SEMIMONTHLY", "MONTHLY"]),
  nextPayDate: z.string().optional(),
  rentAmount: z.number().min(0),
  rentDueDay: z.number().min(1).max(31),
  utilitiesAmount: z.number().min(0).optional(),
  monthlySavingsGoal: z.number().min(0),
  savingsIsPercent: z.boolean().optional(),
  onboardingComplete: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const config = await prisma.incomeConfig.findUnique({
      where: { userId: session.user.id },
    });

    if (!config) {
      return NextResponse.json({ config: null, onboardingComplete: false });
    }

    return NextResponse.json({
      config: {
        projectedMonthlyIncome: Number(config.projectedMonthlyIncome),
        payFrequency: config.payFrequency,
        nextPayDate: config.nextPayDate?.toISOString(),
        rentAmount: Number(config.rentAmount),
        rentDueDay: config.rentDueDay,
        utilitiesAmount: Number(config.utilitiesAmount),
        monthlySavingsGoal: Number(config.monthlySavingsGoal),
        savingsIsPercent: config.savingsIsPercent,
      },
      onboardingComplete: config.onboardingComplete,
    });
  } catch (error) {
    console.error("Error fetching income config:", error);
    return NextResponse.json(
      { error: "Failed to fetch income config" },
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
    const data = incomeConfigSchema.parse(body);

    const config = await prisma.incomeConfig.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        projectedMonthlyIncome: data.projectedMonthlyIncome,
        payFrequency: data.payFrequency,
        nextPayDate: data.nextPayDate ? new Date(data.nextPayDate) : null,
        rentAmount: data.rentAmount,
        rentDueDay: data.rentDueDay,
        utilitiesAmount: data.utilitiesAmount || 0,
        monthlySavingsGoal: data.monthlySavingsGoal,
        savingsIsPercent: data.savingsIsPercent || false,
        onboardingComplete: data.onboardingComplete || false,
      },
      update: {
        projectedMonthlyIncome: data.projectedMonthlyIncome,
        payFrequency: data.payFrequency,
        nextPayDate: data.nextPayDate ? new Date(data.nextPayDate) : null,
        rentAmount: data.rentAmount,
        rentDueDay: data.rentDueDay,
        utilitiesAmount: data.utilitiesAmount ?? undefined,
        monthlySavingsGoal: data.monthlySavingsGoal,
        savingsIsPercent: data.savingsIsPercent ?? undefined,
        onboardingComplete: data.onboardingComplete ?? undefined,
      },
    });

    return NextResponse.json({
      config: {
        projectedMonthlyIncome: Number(config.projectedMonthlyIncome),
        payFrequency: config.payFrequency,
        nextPayDate: config.nextPayDate?.toISOString(),
        rentAmount: Number(config.rentAmount),
        rentDueDay: config.rentDueDay,
        utilitiesAmount: Number(config.utilitiesAmount),
        monthlySavingsGoal: Number(config.monthlySavingsGoal),
        savingsIsPercent: config.savingsIsPercent,
      },
      onboardingComplete: config.onboardingComplete,
    });
  } catch (error) {
    console.error("Error updating income config:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update income config" },
      { status: 500 }
    );
  }
}
