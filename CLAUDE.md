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
│   ├── goals/            # EmergencyFundCard, savings goal components
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
- **SavingsGoal**: Savings targets with progress tracking (name, targetAmount, currentAmount, isComplete, isPrimary)

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

### Emergency Fund Tracker (`/api/savings-goals/emergency-fund`)
- GET - Returns emergency fund progress with `daysUntilGoal` calculation
- POST - Create/update target and current amounts
- Days calculation: `(target - current) / dailySavingsRate`
- Daily savings rate derived from user's monthly savings goal in IncomeConfig
- Default target: $1,000 (classic "Baby Step 1")

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

## Target Demographic
People living paycheck-to-paycheck who want to break that cycle. Features should create **awareness**, **motivation**, and **small wins**.

## Planned Features (Priority Order)

### Phase 1: Core Savings Features
1. **Emergency Fund Tracker** (DONE)
   - Visual progress bar toward $1k (then $2k, etc.)
   - "X days until goal" at current savings rate
   - Editable target and current amounts
   - Location: Dashboard card (replaced Net Worth)

2. **Savings Streaks & Milestones**
   - Monthly streak counter: "3 months in a row meeting savings goal"
   - Milestone badges: First $100 saved, First $1k, 3-month streak, 6-month streak
   - "Personal best" tracking: highest savings month, longest streak
   - Schema needed: `Achievement`, `SavingsStreak` models

3. **Money Runway Visualization**
   - "At your current spending rate, your balance lasts X days"
   - Real-time updates as spending occurs
   - Goal: extend runway to cover full pay period + buffer

### Phase 2: Spending Awareness
4. **Spending Pulse Alerts**
   - "You've spent 60% of your weekly budget and it's only Wednesday"
   - "Dining out is 40% higher than last month"
   - "You're on track to save $50 more than your goal!"
   - Could be in-app notifications or email digests

5. **Paycheck Allocation Sankey Diagram**
   - Visual showing where each dollar goes
   - Categories: Rent, Utilities, Groceries, Subscriptions, Discretionary, Savings
   - Creates instant awareness of spending proportions

6. **"What If" Simulator**
   - "If you cancel Netflix ($15/mo), you'd save $180/year"
   - "Cutting dining out by 25% adds $1,200/year to savings"
   - Links to actual spending data for realistic projections

### Phase 3: Advanced Features
7. **Budget Goals UI** (Schema exists, needs implementation)
   - Set spending limits per category
   - Alerts when approaching/exceeding limits
   - Visual progress toward limits

8. **Recurring Transaction Detection**
   - Auto-detect subscriptions and bills from Plaid data
   - Show upcoming bills calendar
   - Alert for unusual recurring charges

9. **Comparison to Past Self**
   - "You spent 15% less on dining this month than last month"
   - Month-over-month spending trends by category
   - Celebrate improvements

### Schema Additions Needed
```prisma
model Achievement {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  type     String   // "FIRST_1K", "STREAK_3", "STREAK_6", etc.
  earnedAt DateTime @default(now())
}

model SavingsStreak {
  id               String   @id @default(cuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  currentStreak    Int      @default(0)
  longestStreak    Int      @default(0)
  lastCheckedMonth DateTime
}
```

### UI/UX Improvements
- Dark mode support
- Mobile responsiveness testing
- Transaction search and filtering
- CSV export for transactions
- Data backup/export utilities
