# Better Budget

A personal finance and budgeting app built with Next.js, designed for people living paycheck-to-paycheck who want to break that cycle and save more money.

## Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with credentials provider
- **Banking**: Plaid API for account linking and transaction sync
- **Charts**: Recharts
- **Styling**: Tailwind CSS

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- Plaid API credentials (for bank account linking)

## Environment Variables

Create a `.env` file in the root directory:

```env
# Database (for local development without Docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/better_budget"

# NextAuth
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-secret-key-here"

# Plaid API
PLAID_CLIENT_ID="your-plaid-client-id"
PLAID_SECRET="your-plaid-secret"
PLAID_ENV="sandbox"

# Encryption (for storing Plaid tokens)
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## Running with Docker (Recommended)

The easiest way to run the entire stack:

```bash
# Start both the app and database
docker compose up -d

# View logs
docker compose logs -f

# Stop containers
docker compose down
```

The app will be available at **http://localhost:3001**

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| app | 3001 | Next.js application |
| db | 5433 | PostgreSQL database |

### Rebuilding

If you make changes to the code:

```bash
docker compose build app
docker compose up -d
```

For a clean rebuild:

```bash
docker compose build app --no-cache
docker compose up -d
```

## Local Development (without Docker)

If you prefer running locally:

1. **Start the database** (still uses Docker):
   ```bash
   docker compose up db -d
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run database migrations**:
   ```bash
   npx prisma migrate dev
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

The app will be available at **http://localhost:3000**

## Database

### Migrations

```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### Prisma Studio

View and edit data in the browser:

```bash
npx prisma studio
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, register pages
│   ├── (dashboard)/      # Protected pages
│   └── api/              # API routes
├── components/
│   ├── charts/           # Recharts visualizations
│   ├── goals/            # Savings goal components
│   ├── layout/           # Sidebar, Header
│   └── transactions/     # Transaction modals
├── lib/                  # Auth, Prisma, utilities
└── types/                # TypeScript definitions
```

## Features

- Bank account linking via Plaid
- Transaction tracking (automatic + manual)
- Budget projections and visualizations
- Emergency fund tracker
- Income configuration
- Dark mode support
