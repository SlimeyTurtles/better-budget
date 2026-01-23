# Better Budget - Project Context

## Overview
A personal finance/budgeting app built with Next.js 15, React 19, TypeScript, Prisma (PostgreSQL), and Tailwind CSS. Uses Plaid API for bank account integration and NextAuth.js for authentication.

## Tech Stack
- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Banking**: Plaid API for account linking and transaction sync
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Directory Structure
```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected pages (dashboard, transactions, accounts, budget, net-worth, settings)
│   └── api/              # API routes
├── components/
│   ├── charts/           # Recharts visualizations
│   ├── layout/           # Sidebar, Header
│   ├── onboarding/       # OnboardingModal
│   ├── plaid/            # PlaidLinkButton
│   └── transactions/     # AddTransactionModal, EditTransactionModal
├── lib/                  # auth.ts, prisma.ts, utils.ts
└── types/                # TypeScript definitions
```

## Key Data Models (Prisma)
- **User**: Authentication and profile
- **Transaction**: Financial transactions (amount, date, name, category, isIncome, isManual, bankAccountId)
- **BankAccount**: Connected accounts (linked to PlaidItem)
- **PlaidItem**: Plaid integration (accessToken, institutionName)
- **IncomeConfig**: User's income settings (projectedMonthlyIncome, payFrequency, rentAmount, utilitiesAmount, monthlySavingsGoal)
- **BudgetGoal**: Category spending limits
- **NetWorthSnapshot**: Historical net worth tracking

## Key Features

### Manual Transactions
- POST `/api/transactions` - Create manual transaction
- PUT `/api/transactions/[id]` - Update manual transaction (only isManual=true)
- DELETE `/api/transactions/[id]` - Delete manual transaction
- Auto-creates "Manual Entries" bank account if user has no accounts

### Budget Calculation Logic (`/api/analytics/monthly-budget`)
- **Actual Balance**: Amortized projected income + extra income (non-salary) - expenses
- **Projected End Balance**: Current actual + remaining income (if no spending)
- **Available to Spend Total**: Projected end balance - savings target
- **Available Per Day**: Total available / remaining days
- **Available Today**: Available per day - today's spending

### Charts (Dashboard)
1. **MonthlyBudgetChart**: Line chart showing:
   - Income Goal (purple line)
   - Rent + Utilities (red line)
   - Rent + Utilities + Savings (blue line)
   - Actual Balance (green solid line)
   - Projected No-Spending (green dotted line)
   - Today marker (orange vertical dashed line)

2. **BudgetProjectionLineChart**: Simpler projection view with horizontal reference lines

### Period Options
- Daily (24 hours)
- Weekly (7 days)
- Biweekly (14 days)
- Monthly (calendar month)

## Important Implementation Notes

### Timezone Handling
Date strings like "2024-01-05" are parsed as local dates in `formatDate()` and `formatDateShort()` to avoid UTC timezone shifts that would display wrong dates.

### Income Categories
- Transactions with category "Salary" are excluded from extra income (already in projected income)
- Other income categories are added to actual balance

### Account Types
- DEPOSITORY, INVESTMENT = Assets
- CREDIT, LOAN = Liabilities
- OTHER = Used for manual entry accounts

## Common Tasks

### Adding a new chart
1. Create component in `src/components/charts/`
2. Import in dashboard page
3. Pass data from API response

### Modifying budget calculations
Edit `/api/analytics/monthly-budget/route.ts`

### Adding transaction fields
1. Update Prisma schema
2. Run `npx prisma migrate dev`
3. Update API routes
4. Update modal components

## Git Branches
- `production` - Main branch for PRs
- `development` - Current working branch
