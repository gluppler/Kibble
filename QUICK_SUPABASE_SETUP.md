# Quick Supabase Connection String Setup

## Supabase Connection String

Supabase provides a **Direct Connection** string in Settings > Database.

## Required Connection String

### DATABASE_URL (Direct Connection - Port 5432)
**For all database operations** - Application queries and Prisma migrations.

**Format from Supabase:**
```
postgresql://postgres:[YOUR_PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```

**Steps:**
1. Go to Supabase Dashboard > Settings > Database > Connection string
2. Find **"Direct connection"** connection string
3. Copy the URL (port 5432)
4. Replace `[YOUR_PASSWORD]` with your actual database password
5. This becomes your `DATABASE_URL`

**Use this for:** `DATABASE_URL` in Vercel

## Step-by-Step

1. **Go to Supabase Dashboard** > Settings > Database > Connection string

2. **Copy Direct Connection URL:**
   - Find "Direct connection" connection string
   - Copy the URL (port 5432)
   - Replace `[YOUR_PASSWORD]` with your actual database password
   - This becomes your `DATABASE_URL`

3. **Add to Vercel:**
   - Go to Vercel Dashboard > Your Project > Settings > Environment Variables
   - Add `DATABASE_URL` with the direct connection (port 5432)
   - Set for both Production and Preview environments

## Example with Real Values

**Direct Connection (from Supabase):**
```
postgresql://postgres:[YOUR_PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```

**DATABASE_URL (replace password):**
```
postgresql://postgres:MyPassword123!@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```

## Why Direct Connection?

- **Simplicity**: One connection string for all operations
- **Compatibility**: Works for both application queries and Prisma migrations
- **Reliability**: Direct connection ensures consistent behavior

## Troubleshooting

**"Connection refused"**
- Verify DATABASE_URL is correct
- Check that password is correctly set (no brackets)
- Ensure database firewall allows connections

**"Too many connections"**
- Check database connection limits in Supabase
- Review Prisma client singleton implementation
- Monitor connection usage in Supabase dashboard
