import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { plaidClient, encryptAccessToken, mapPlaidAccountType } from "@/lib/plaid";

const exchangeTokenSchema = z.object({
  public_token: z.string(),
  metadata: z.object({
    institution: z.object({
      institution_id: z.string(),
      name: z.string(),
    }).optional(),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { public_token, metadata } = exchangeTokenSchema.parse(body);

    // Exchange public token for access token
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Encrypt access token before storing
    const encryptedAccessToken = encryptAccessToken(accessToken);

    // Create PlaidItem record
    const plaidItem = await prisma.plaidItem.create({
      data: {
        userId: session.user.id,
        accessToken: encryptedAccessToken,
        itemId,
        institutionId: metadata?.institution?.institution_id,
        institutionName: metadata?.institution?.name,
      },
    });

    // Fetch accounts from Plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    // Create BankAccount records
    const bankAccounts = await Promise.all(
      accountsResponse.data.accounts.map((account) =>
        prisma.bankAccount.create({
          data: {
            userId: session.user.id,
            plaidItemId: plaidItem.id,
            plaidAccountId: account.account_id,
            name: account.name,
            officialName: account.official_name,
            type: mapPlaidAccountType(account.type),
            subtype: account.subtype,
            mask: account.mask,
            currentBalance: account.balances.current,
            availableBalance: account.balances.available,
            isoCurrencyCode: account.balances.iso_currency_code || "USD",
            lastBalanceUpdate: new Date(),
          },
        })
      )
    );

    // Trigger initial transaction sync
    await syncTransactions(session.user.id, plaidItem.id, accessToken);

    return NextResponse.json({
      success: true,
      accounts: bankAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        mask: a.mask,
      })),
    });
  } catch (error) {
    console.error("Error exchanging token:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to connect account" },
      { status: 500 }
    );
  }
}

async function syncTransactions(
  userId: string,
  plaidItemId: string,
  accessToken: string
) {
  try {
    // Get existing cursor if any
    const plaidItem = await prisma.plaidItem.findUnique({
      where: { id: plaidItemId },
      include: { bankAccounts: true },
    });

    if (!plaidItem) return;

    let cursor = plaidItem.syncCursor || undefined;
    let hasMore = true;

    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      });

      const { added, modified, removed, next_cursor, has_more } = response.data;

      // Process added transactions
      for (const transaction of added) {
        const bankAccount = plaidItem.bankAccounts.find(
          (a) => a.plaidAccountId === transaction.account_id
        );
        if (!bankAccount) continue;

        await prisma.transaction.upsert({
          where: { plaidTransactionId: transaction.transaction_id },
          create: {
            userId,
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
            isIncome: transaction.amount < 0, // Plaid uses negative for income
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
      }

      // Process removed transactions
      for (const transaction of removed) {
        if (transaction.transaction_id) {
          await prisma.transaction.deleteMany({
            where: { plaidTransactionId: transaction.transaction_id },
          });
        }
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update cursor and last sync time
    await prisma.plaidItem.update({
      where: { id: plaidItemId },
      data: {
        syncCursor: cursor,
        lastSyncedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error syncing transactions:", error);
  }
}
