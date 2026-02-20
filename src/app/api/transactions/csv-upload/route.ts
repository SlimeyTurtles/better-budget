import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

type BankType = "wellsfargo" | "discover";

interface ParsedTransaction {
  date: Date;
  amount: number;
  name: string;
  isIncome: boolean;
  category?: string;
}

function parseDiscoverCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.trim().split("\n");
  const transactions: ParsedTransaction[] = [];

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV with quoted fields
    const fields = parseCSVLine(line);
    if (fields.length < 5) continue;

    const [transDate, , description, amountStr, category] = fields;

    // Parse date (MM/DD/YYYY format)
    const dateParts = transDate.split("/");
    if (dateParts.length !== 3) continue;
    const date = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[0]) - 1,
      parseInt(dateParts[1])
    );

    const amount = parseFloat(amountStr);
    if (isNaN(amount)) continue;

    // Skip payments/credits (negative amounts are payments to the card)
    if (amount < 0) continue;

    transactions.push({
      date,
      amount: Math.abs(amount),
      name: description.replace(/"/g, "").trim(),
      isIncome: false, // Discover is credit card, so all positive amounts are expenses
      category: category?.replace(/"/g, "").trim(),
    });
  }

  return transactions;
}

function parseWellsFargoCSV(csvContent: string): ParsedTransaction[] {
  const lines = csvContent.trim().split("\n");
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    // Parse CSV with quoted fields
    const fields = parseCSVLine(trimmedLine);
    if (fields.length < 5) continue;

    const [dateStr, amountStr, , , description] = fields;

    // Parse date (MM/DD/YYYY format, quoted)
    const cleanDate = dateStr.replace(/"/g, "");
    const dateParts = cleanDate.split("/");
    if (dateParts.length !== 3) continue;
    const date = new Date(
      parseInt(dateParts[2]),
      parseInt(dateParts[0]) - 1,
      parseInt(dateParts[1])
    );

    const amount = parseFloat(amountStr.replace(/"/g, ""));
    if (isNaN(amount)) continue;

    // Wells Fargo: negative = expense, positive = income
    const isIncome = amount > 0;

    transactions.push({
      date,
      amount: Math.abs(amount),
      name: description.replace(/"/g, "").trim(),
      isIncome,
    });
  }

  return transactions;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate limiting per user
    const rateLimit = checkRateLimit(
      `csv-upload:${session.user.id}`,
      RATE_LIMITS.api
    );
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const bankType = formData.get("bankType") as BankType | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!bankType || !["wellsfargo", "discover"].includes(bankType)) {
      return NextResponse.json(
        { error: "Invalid bank type. Must be 'wellsfargo' or 'discover'" },
        { status: 400 }
      );
    }

    const csvContent = await file.text();

    // Parse based on bank type
    let parsedTransactions: ParsedTransaction[];
    if (bankType === "discover") {
      parsedTransactions = parseDiscoverCSV(csvContent);
    } else {
      parsedTransactions = parseWellsFargoCSV(csvContent);
    }

    if (parsedTransactions.length === 0) {
      return NextResponse.json(
        { error: "No valid transactions found in CSV" },
        { status: 400 }
      );
    }

    // Get or create a manual account for CSV imports
    let bankAccount = await prisma.bankAccount.findFirst({
      where: {
        userId: session.user.id,
        plaidAccountId: `csv-${bankType}-${session.user.id}`,
      },
    });

    if (!bankAccount) {
      // Create a PlaidItem placeholder for CSV imports
      const csvPlaidItem = await prisma.plaidItem.upsert({
        where: {
          itemId: `csv-item-${bankType}-${session.user.id}`,
        },
        update: {},
        create: {
          id: randomUUID(),
          userId: session.user.id,
          accessToken: "csv-import",
          itemId: `csv-item-${bankType}-${session.user.id}`,
          institutionName:
            bankType === "wellsfargo" ? "Wells Fargo (CSV)" : "Discover (CSV)",
          status: "ACTIVE",
          updatedAt: new Date(),
        },
      });

      bankAccount = await prisma.bankAccount.create({
        data: {
          id: randomUUID(),
          userId: session.user.id,
          plaidItemId: csvPlaidItem.id,
          plaidAccountId: `csv-${bankType}-${session.user.id}`,
          name:
            bankType === "wellsfargo"
              ? "Wells Fargo (CSV Import)"
              : "Discover (CSV Import)",
          type: bankType === "discover" ? "CREDIT" : "DEPOSITORY",
          currentBalance: 0,
          availableBalance: 0,
          updatedAt: new Date(),
        },
      });
    }

    // Create transactions in bulk
    const createdTransactions = await prisma.$transaction(
      parsedTransactions.map((t) =>
        prisma.transaction.create({
          data: {
            id: randomUUID(),
            userId: session.user.id,
            bankAccountId: bankAccount!.id,
            amount: t.amount,
            name: t.name,
            date: t.date,
            category: t.category || null,
            isIncome: t.isIncome,
            isManual: true,
            isPending: false,
            updatedAt: new Date(),
          },
        })
      )
    );

    return NextResponse.json(
      {
        message: `Successfully imported ${createdTransactions.length} transactions`,
        count: createdTransactions.length,
        accountName: bankAccount.name,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error uploading CSV:", error);
    return NextResponse.json(
      { error: "Failed to process CSV file" },
      { status: 500 }
    );
  }
}
