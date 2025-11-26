# Vercel Production Setup Guide

This guide will help you deploy Kibble to Vercel with optimal configuration.

## Prerequisites

- Vercel account
- PostgreSQL database (Supabase, Neon, or any PostgreSQL provider)
- Git repository with your code

## Step 1: Database Setup

### Option A: Supabase (Recommended)

1. Create a Supabase project at https://supabase.com
2. Get your connection string:
   - **Direct Connection (DATABASE_URL)**: Use the direct connection URL (port 5432)
     - Format: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`
     - Get from: Supabase Dashboard > Settings > Database > Connection string > Direct connection

### Option B: Other PostgreSQL Providers

1. Set up your PostgreSQL database
2. Get your direct connection URL:
   - Format: `postgresql://user:password@host:5432/database`
   - Use this for `DATABASE_URL` (all database operations)

## Step 2: Environment Variables

Set the following environment variables in Vercel Dashboard:

### Required Variables

1. **DATABASE_URL**
   - Direct database connection URL for all operations
   - Example: `postgresql://postgres:[PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres`
   - ⚠️ **Important**: Replace `[PASSWORD]` with your actual database password

3. **NEXTAUTH_SECRET**
   - Generate a secure random secret:
     ```bash
     openssl rand -base64 32
     ```
   - Or use: https://generate-secret.vercel.app/32

4. **NEXTAUTH_URL**
   - Production: `https://your-domain.vercel.app`
   - Preview deployments: Vercel automatically sets this

### Optional Variables

- `NEXT_PUBLIC_SUPABASE_URL` - If using Supabase features
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - If using Supabase features
- OAuth provider credentials (if adding OAuth)

## Step 3: Deploy to Vercel

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Method 2: GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Vercel will auto-detect Next.js
5. Add environment variables in the setup
6. Deploy

## Step 4: Run Database Migrations

After first deployment, run Prisma migrations:

```bash
# Using Vercel CLI
vercel env pull .env.local
npx prisma migrate deploy

# Or run migrations manually with DATABASE_URL set
```

Alternatively, use Vercel's database migration feature or run migrations manually.

## Step 5: Verify Deployment

1. Check build logs in Vercel Dashboard
2. Verify environment variables are set correctly
3. Test authentication flow
4. Test database connections
5. Monitor function logs for errors

## Optimization Features

### Connection Pooling
- Prisma client is configured for serverless with connection pooling
- Prevents connection exhaustion in serverless environments
- Uses singleton pattern to reuse connections

### Build Optimizations
- Automatic Prisma client generation on build
- Optimized package imports
- Standalone output for faster cold starts
- Image optimization enabled

### Performance
- Function timeout: 30 seconds (configurable in vercel.json)
- Region: US East (iad1) - change in vercel.json if needed
- Compression enabled
- Security headers optimized

## Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
- Verify DATABASE_URL is correct
- Check if database allows connections from Vercel IPs
- Ensure password is correctly set (no brackets around [PASSWORD])

**Error: "Too many connections"**
- Check database connection limits in Supabase
- Review Prisma client singleton implementation
- Monitor connection usage in Supabase dashboard

### Build Failures

**Error: "Prisma Client not generated"**
- Ensure `postinstall` script runs: `prisma generate`
- Check build logs for Prisma generation
- Verify DATABASE_URL is accessible during build

**Error: "Migration failed"**
- Verify DATABASE_URL is correct
- Run migrations manually if needed
- Check database permissions

### Authentication Issues

**Error: "NEXTAUTH_SECRET is missing"**
- Set NEXTAUTH_SECRET in Vercel environment variables
- Generate a new secret if needed
- Ensure it's set for all environments (Production, Preview, Development)

**Error: "Invalid callback URL"**
- Verify NEXTAUTH_URL matches your deployment URL
- Check OAuth provider callback URLs if using OAuth

## Security Checklist

- ✅ Environment variables are set in Vercel (not in code)
- ✅ NEXTAUTH_SECRET is a strong random value
- ✅ Database credentials are secure
- ✅ Direct database URL is not exposed to client
- ✅ Connection pooling prevents connection leaks
- ✅ Error messages don't expose sensitive information
- ✅ Authentication is properly configured

## Monitoring

- Check Vercel Analytics for performance metrics
- Monitor function logs for errors
- Set up alerts for database connection issues
- Track authentication failures
- Monitor API response times

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/deployment/serverless)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)
