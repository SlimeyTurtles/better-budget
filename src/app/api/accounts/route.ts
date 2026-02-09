import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accounts = await prisma.bankAccount.findMany({
      where: { userId: session.user.id },
      include: {
        PlaidItem: {
          select: {
            institutionName: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Transform to use camelCase for client compatibility
    const transformedAccounts = accounts.map((a) => ({
      ...a,
      plaidItem: a.PlaidItem,
      PlaidItem: undefined,
    }));

    return NextResponse.json({ accounts: transformedAccounts });
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
