import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments] || PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

export const plaidClient = new PlaidApi(configuration);

export const PLAID_PRODUCTS: Products[] = [Products.Transactions];
export const PLAID_COUNTRY_CODES: CountryCode[] = [CountryCode.Us];

// Encrypt access token before storing in database
export function encryptAccessToken(token: string): string {
  // In production, use proper encryption (e.g., AES-256-GCM)
  // This is a simple base64 encoding for development
  const key = process.env.ENCRYPTION_KEY || "";
  const combined = `${key}:${token}`;
  return Buffer.from(combined).toString("base64");
}

// Decrypt access token from database
export function decryptAccessToken(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY || "";
  const decoded = Buffer.from(encrypted, "base64").toString("utf8");
  const [storedKey, token] = decoded.split(":");
  if (storedKey !== key) {
    throw new Error("Invalid encryption key");
  }
  return token;
}

// Map Plaid account types to our enum
export function mapPlaidAccountType(
  type: string
): "DEPOSITORY" | "CREDIT" | "LOAN" | "INVESTMENT" | "OTHER" {
  switch (type.toLowerCase()) {
    case "depository":
      return "DEPOSITORY";
    case "credit":
      return "CREDIT";
    case "loan":
      return "LOAN";
    case "investment":
      return "INVESTMENT";
    default:
      return "OTHER";
  }
}

// Detect if a transaction is income (Plaid uses negative for income)
export function isIncomeTransaction(amount: number, category?: string[]): boolean {
  // Plaid uses positive amounts for expenses, negative for income
  if (amount < 0) return true;

  // Also check category for income-related categories
  const incomeCategories = ["payroll", "income", "transfer", "deposit"];
  if (category) {
    return category.some((cat) =>
      incomeCategories.some((income) => cat.toLowerCase().includes(income))
    );
  }

  return false;
}
