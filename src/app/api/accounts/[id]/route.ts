import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Find the account and verify ownership
    const account = await prisma.bankAccount.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        plaidItem: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Delete all transactions associated with this account
    await prisma.transaction.deleteMany({
      where: { bankAccountId: id },
    });

    // Delete the bank account
    await prisma.bankAccount.delete({
      where: { id },
    });

    // Check if this was the last account for the PlaidItem
    const remainingAccounts = await prisma.bankAccount.count({
      where: { plaidItemId: account.plaidItemId },
    });

    // If no more accounts, delete the PlaidItem too
    if (remainingAccounts === 0) {
      await prisma.plaidItem.delete({
        where: { id: account.plaidItemId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}
