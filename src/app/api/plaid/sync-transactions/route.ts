import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { plaidClient, decryptAccessToken } from "@/lib/plaid";

const syncSchema = z.object({
  plaidItemId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plaidItemId } = syncSchema.parse(body);

    // Get PlaidItems to sync
    const plaidItems = plaidItemId
      ? await prisma.plaidItem.findMany({
          where: { id: plaidItemId, userId: session.user.id },
          include: { bankAccounts: true },
        })
      : await prisma.plaidItem.findMany({
          where: { userId: session.user.id, status: "ACTIVE" },
          include: { bankAccounts: true },
        });

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;

    for (const item of plaidItems) {
      const accessToken = decryptAccessToken(item.accessToken);
      let cursor = item.syncCursor || undefined;
      let hasMore = true;

      while (hasMore) {
        const response = await plaidClient.transactionsSync({
          access_token: accessToken,
          cursor,
        });

        const { added, modified, removed, next_cursor, has_more } = response.data;

        // Process added transactions
        for (const transaction of added) {
          const bankAccount = item.bankAccounts.find(
            (a) => a.plaidAccountId === transaction.account_id
          );
          if (!bankAccount) continue;

          await prisma.transaction.upsert({
            where: { plaidTransactionId: transaction.transaction_id },
            create: {
              userId: session.user.id,
              bankAccountId: bankAccount.id,
              plaidTransactionId: transaction.transaction_id,
              amount: transaction.amount,
              isoCurrencyCode: transaction.iso_currency_code || "USD",
              date: new Date(transaction.date),
              authorizedDate: transaction.authorized_date
                ? new Date(transaction.authorized_date)
                : null,
              name: transaction.name,
              merchantName: transaction.merchant_name,
              category: transaction.personal_finance_category?.primary,
              isPending: transaction.pending,
              isIncome: transaction.amount < 0,
              paymentChannel: transaction.payment_channel,
              location: transaction.location
                ? {
                    address: transaction.location.address,
                    city: transaction.location.city,
                    region: transaction.location.region,
                    country: transaction.location.country,
                  }
                : undefined,
            },
            update: {
              amount: transaction.amount,
              isPending: transaction.pending,
              name: transaction.name,
              merchantName: transaction.merchant_name,
            },
          });
          totalAdded++;
        }

        // Process modified transactions
        for (const transaction of modified) {
          await prisma.transaction.updateMany({
            where: { plaidTransactionId: transaction.transaction_id },
            data: {
              amount: transaction.amount,
              isPending: transaction.pending,
              name: transaction.name,
              merchantName: transaction.merchant_name,
            },
          });
          totalModified++;
        }

        // Process removed transactions
        for (const transaction of removed) {
          if (transaction.transaction_id) {
            await prisma.transaction.deleteMany({
              where: { plaidTransactionId: transaction.transaction_id },
            });
            totalRemoved++;
          }
        }

        cursor = next_cursor;
        hasMore = has_more;
      }

      // Update cursor and last sync time
      await prisma.plaidItem.update({
        where: { id: item.id },
        data: {
          syncCursor: cursor,
          lastSyncedAt: new Date(),
        },
      });

      // Update account balances
      const accountsResponse = await plaidClient.accountsGet({
        access_token: accessToken,
      });

      for (const account of accountsResponse.data.accounts) {
        await prisma.bankAccount.updateMany({
          where: { plaidAccountId: account.account_id },
          data: {
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            lastBalanceUpdate: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: "Failed to sync transactions" },
      { status: 500 }
    );
  }
}
