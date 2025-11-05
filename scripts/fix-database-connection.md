# Database Connection Fix

## Issue
The Supabase connection is using port 6543 (pgBouncer) which doesn't support schema changes.

## Solution

Update your `.env` file to use port 5432 instead of 6543:

**Change this:**
```env
DATABASE_URL="postgresql://postgres.qrqdfhjstehjyocvyjym:VDu5roc4IfT4KO8B@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**To this:**
```env
DATABASE_URL="postgresql://postgres.qrqdfhjstehjyocvyjym:VDu5roc4IfTPlugin:5432/postgres"
```

The changes:
1. Port changed from `:6543` to `:5432`
2. Removed `?pgbouncer=true` parameter

## After updating .env:

1. Run the migration:
```bash
npx prisma db push
```

2. Or create a migration:
```bash
npx prisma migrate dev --name init
```

3. Seed the database:
```bash
npm run prisma:seed
```

## Note
After schema changes are complete, you can switch back to port 6543 for better connection pooling in production.

