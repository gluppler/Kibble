# Prisma Prepared Statement Error Fix

## Problem

Error: `prepared statement "s4" already exists`

This error occurs when:
- Using PostgreSQL connection poolers (PgBouncer) with Prisma
- Multiple Prisma client instances try to use the same prepared statement
- Serverless environments where connections are reused across invocations

## Solution

The fix has been implemented in `lib/db.ts`:

### For Connection Poolers (Port 6543)

When using a connection pooler (PgBouncer), Prisma needs to use transaction mode instead of prepared statements:

```typescript
// Automatically adds ?pgbouncer=true to connection URL
if (connectionUrl.port === "6543") {
  connectionUrl.searchParams.set("pgbouncer", "true");
}
```

### For Direct Connections (Port 5432)

Direct connections don't require special parameters. The singleton pattern in `lib/db.ts` ensures only one Prisma client instance exists, preventing prepared statement conflicts.

## Recommended Setup

### Option 1: Direct Connection (Recommended for Development)

Use direct connection (port 5432) for all operations:

```env
DATABASE_URL="postgresql://postgres:password@db.example.com:5432/postgres"
```

**Pros:**
- No prepared statement conflicts
- Full PostgreSQL features available
- Better for migrations

**Cons:**
- Higher connection count
- Not ideal for high-traffic production

### Option 2: Connection Pooler (Recommended for Production)

Use connection pooler (port 6543) with pgbouncer mode:

```env
DATABASE_URL="postgresql://postgres:password@db.example.com:6543/postgres?pgbouncer=true"
```

**Pros:**
- Lower connection count
- Better for serverless/high-traffic
- Cost-effective

**Cons:**
- Requires pgbouncer mode
- Some PostgreSQL features limited

## How It Works

1. **Singleton Pattern**: Ensures only one Prisma client instance exists
2. **Automatic Detection**: Detects connection type (pooler vs direct) from port
3. **Parameter Injection**: Automatically adds required connection parameters
4. **Error Handling**: Falls back gracefully if URL parsing fails

## Verification

After applying the fix:

1. **Build should succeed**:
   ```bash
   npm run build
   ```

2. **Database connection should work**:
   ```bash
   npm run db:test
   ```

3. **No prepared statement errors** in build logs or runtime

## Troubleshooting

### Still Getting Errors?

1. **Check DATABASE_URL format**:
   ```bash
   echo $DATABASE_URL
   ```
   Should be: `postgresql://user:pass@host:port/database`

2. **Verify connection type**:
   - Port 5432 = Direct connection
   - Port 6543 = Connection pooler (needs `?pgbouncer=true`)

3. **Check for multiple Prisma instances**:
   - Ensure singleton pattern is working
   - Check for duplicate `new PrismaClient()` calls

4. **Clear Prisma cache**:
   ```bash
   rm -rf node_modules/.prisma
   npm run db:generate
   ```

## Related Files

- `lib/db.ts` - Prisma client configuration
- `prisma/schema.prisma` - Database schema
- `DATABASE_CLEANUP_GUIDE.md` - Database maintenance guide

## References

- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PgBouncer with Prisma](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [PostgreSQL Prepared Statements](https://www.postgresql.org/docs/current/sql-prepare.html)
