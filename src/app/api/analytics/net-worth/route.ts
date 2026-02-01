import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get historical net worth snapshots
    const snapshots = await prisma.netWorthSnapshot.findMany({
      where: {
        userId: session.user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "asc" },
    });

    // Get current account balances for today's net worth
    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id, isHidden: false },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;

    for (const account of accounts) {
      const balance = Number(account.currentBalance || 0);
      if (account.type === "CREDIT" || account.type === "LOAN") {
        totalLiabilities += Math.abs(balance);
      } else {
        totalAssets += balance;
      }
    }

    const currentNetWorth = totalAssets - totalLiabilities;

    // Format historical data
    const netWorthHistory = snapshots.map((s) => ({
      date: s.date.toISOString().split("T")[0],
      totalAssets: Number(s.totalAssets),
      totalLiabilities: Number(s.totalLiabilities),
      netWorth: Number(s.netWorth),
    }));

    // Add today if not already in snapshots
    const today = new Date().toISOString().split("T")[0];
    const hasToday = netWorthHistory.some((s) => s.date === today);
    if (!hasToday) {
      netWorthHistory.push({
        date: today,
        totalAssets,
        totalLiabilities,
        netWorth: currentNetWorth,
      });
    }

    return NextResponse.json({
      netWorthHistory,
      current: {
        totalAssets,
        totalLiabilities,
        netWorth: currentNetWorth,
      },
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.currentBalance || 0),
      })),
    });
  } catch (error) {
    console.error("Error fetching net worth data:", error);
    return NextResponse.json(
      { error: "Failed to fetch net worth data" },
      { status: 500 }
    );
  }
}

// Create daily snapshot (called by cron or manually)
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id, isHidden: false },
    });

    let totalAssets = 0;
    let totalLiabilities = 0;
    const accountBreakdown: Record<string, number> = {};

    for (const account of accounts) {
      const balance = Number(account.currentBalance || 0);
      accountBreakdown[account.id] = balance;

      if (account.type === "CREDIT" || account.type === "LOAN") {
        totalLiabilities += Math.abs(balance);
      } else {
        totalAssets += balance;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await prisma.netWorthSnapshot.upsert({
      where: {
        userId_date: {
          userId: session.user.id,
          date: today,
        },
      },
      create: {
        id: randomUUID(),
        userId: session.user.id,
        date: today,
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        accountBreakdown,
      },
      update: {
        totalAssets,
        totalLiabilities,
        netWorth: totalAssets - totalLiabilities,
        accountBreakdown,
      },
    });

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Error creating net worth snapshot:", error);
    return NextResponse.json(
      { error: "Failed to create snapshot" },
      { status: 500 }
    );
  }
}
