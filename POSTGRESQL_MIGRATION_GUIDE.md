# PostgreSQL Migration & Production Architecture Guide

This document outlines the transition path from the current SQLite development database to a production-grade PostgreSQL deployment for **THE BRIEF**.

---

## 1. Schema & Compatibility Overview

The entire Prisma schema in `prisma/schema.prisma` is designed to be database-agnostic:
- Primary keys: UUID strings (`@id @default(uuid())`), native to both SQLite and PostgreSQL.
- Foreign keys: standard cascade and set-null referential actions.
- Enums & JSON structures: serialized cleanly as standard `String` columns or native `Json` in PostgreSQL.
- Timestamps: standard `DateTime` types with `@default(now())` and `@updatedAt`.

---

## 2. Migration Steps (SQLite $\rightarrow$ PostgreSQL)

### Step 1: Provision Managed PostgreSQL
Provision a managed instance on AWS RDS, Supabase, Neon, or Google Cloud SQL:
```bash
# Example Connection String
DATABASE_URL="postgresql://thebrief_admin:SECURE_PASSWORD@postgres.internal.net:5432/thebrief_prod?schema=public&sslmode=require"
```

### Step 2: Switch Provider in `schema.prisma`
Change datasource from SQLite to PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Run Initial Migration
Generate the PostgreSQL schema and migrate:
```bash
npx prisma migrate dev --name init_postgres
npx prisma generate
```

### Step 4: Data Transfer (Optional)
If migrating existing development data:
1. Export SQLite tables to CSV or JSON using `sqlite3 dev.db .dump`.
2. Use tools like `pgloader`:
   ```bash
   pgloader dev.db postgresql://thebrief_admin:SECURE_PASSWORD@postgres.internal.net:5432/thebrief_prod
   ```

---

## 3. Database Backup & Retention Policy

### Current SQLite Backup
To create live backups without stopping the application:
```bash
# Atomic online backup
sqlite3 prisma/dev.db ".backup prisma/backups/dev_$(date +%Y%m%d_%H%M%S).db"
```
Recommended cron schedule: hourly snapshots retained for 7 days.

### Production PostgreSQL Backups
- **Continuous WAL Archiving**: Point-in-time recovery (PITR) for up to 30 days.
- **Daily Automated Snapshots**: Retained for 90 days across multiple availability zones.
- **Pre-deployment Snapshots**: Triggered automatically in CI/CD before running migrations.
