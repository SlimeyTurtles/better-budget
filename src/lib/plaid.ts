import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from "plaid";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

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

// Encrypt access token using AES-256-GCM before storing in database
export function encryptAccessToken(token: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }

  const keyBuffer = Buffer.from(key, "hex");
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", keyBuffer, iv);

  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData (all hex)
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

// Decrypt access token from database using AES-256-GCM
export function decryptAccessToken(encrypted: string): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }

  const [ivHex, authTagHex, encryptedData] = encrypted.split(":");
  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error("Invalid encrypted token format");
  }

  const keyBuffer = Buffer.from(key, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv("aes-256-gcm", keyBuffer, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
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
