# Vercel Environment Variables Setup

## Required Environment Variables

Set these in your Vercel Dashboard: **Settings > Environment Variables**

### 1. DATABASE_URL (REQUIRED)
```
postgresql://postgres:[YOUR_PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```
- **Purpose**: Database connection for all database operations (queries and migrations)
- **Format**: Direct connection URL from Supabase
- **Where to find**: Supabase Dashboard > Settings > Database > Connection string > **Direct connection**
- **How to use**: Copy the Direct connection string exactly as shown, replace `[YOUR_PASSWORD]` with your actual password
- **Example**: 
  ```
  postgresql://postgres:MySecurePassword123!@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
  ```

### 3. NEXTAUTH_SECRET (REQUIRED)
```
[Generate with: openssl rand -base64 32]
```
- **Purpose**: Secret key for NextAuth.js session encryption
- **Generate**: 
  ```bash
  openssl rand -base64 32
  ```
  Or use: https://generate-secret.vercel.app/32
- **Security**: Must be a strong random string (minimum 32 characters)
- **Example**: `xK9pL2mN8qR5tV7wY0zA3bC6dE9fG1hI4jK7lM0nO2pQ5rS8tU1vW4xY7zA0=`

### 4. NEXTAUTH_URL (REQUIRED)
```
https://your-domain.vercel.app
```
- **Purpose**: Base URL of your application
- **Production**: Your Vercel deployment URL
- **Preview**: Automatically set by Vercel for preview deployments
- **Local**: `http://localhost:3000` (for local development only)
- **Example**: `https://kibble.vercel.app`

## Optional Environment Variables

### NEXT_PUBLIC_SUPABASE_URL (Optional)
- Only needed if using Supabase-specific features
- Get from Supabase Dashboard > Settings > API

### NEXT_PUBLIC_SUPABASE_ANON_KEY (Optional)
- Only needed if using Supabase-specific features
- Get from Supabase Dashboard > Settings > API

### OAuth Provider Credentials (Optional)
If you want to add OAuth providers:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

## Environment Variable Setup in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `DATABASE_URL`)
   - **Value**: Variable value
   - **Environment**: Select which environments to apply to:
     - **Production**: Production deployments
     - **Preview**: Preview deployments (PRs, branches)
     - **Development**: Local development (optional)

## Quick Setup Checklist

- [ ] DATABASE_URL set with direct connection (port 5432)
- [ ] NEXTAUTH_SECRET generated and set (32+ characters)
- [ ] NEXTAUTH_URL set to production domain
- [ ] All variables added to Production environment
- [ ] All variables added to Preview environment (if needed)
- [ ] Database migrations run successfully
- [ ] Application tested after deployment

## Security Notes

- ✅ Never commit `.env` files to git
- ✅ Use different secrets for production and development
- ✅ Rotate NEXTAUTH_SECRET periodically
- ✅ Use connection pooling to prevent database connection leaks
- ✅ Keep database credentials secure and rotate them regularly
- ✅ Review Vercel environment variable access permissions

## Troubleshooting

**"Can't reach database server"**
- Verify DATABASE_URL is correct
- Check database firewall allows Vercel IPs
- Ensure password is correctly set (no brackets around [YOUR_PASSWORD])

**"Too many connections"**
- Review Prisma client singleton implementation
- Check database connection limits in Supabase
- Consider implementing connection pooling if needed

**"NEXTAUTH_SECRET is missing"**
- Ensure variable is set in Vercel
- Check variable name spelling (case-sensitive)
- Verify it's set for the correct environment

**"Invalid callback URL"**
- Verify NEXTAUTH_URL matches deployment URL
- Check OAuth provider callback URLs if using OAuth
