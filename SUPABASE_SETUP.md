# Supabase Database Connection Setup

## Where to Find Database Connection Strings

You can get your database connection strings directly from the **Supabase website** (not Vercel marketplace).

## Step-by-Step: Getting Connection Strings from Supabase

### 1. Go to Supabase Dashboard
- Visit: https://supabase.com/dashboard
- Sign in to your account

### 2. Select Your Project
- Click on your project (or create a new one if you don't have one)

### 3. Navigate to Database Settings
- In the left sidebar, click **"Settings"** (gear icon)
- Click **"Database"** in the settings menu

### 4. Find Connection Strings
Scroll down to the **"Connection string"** section. You'll typically see:

#### Direct Connection (What You'll See)
- **Label**: "Direct connection" or "Connection string"
- **Port**: `5432`
- **Format you'll see**:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
  ```
- **Example**:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
  ```

#### Supabase Provides Three Connection Types

**Direct Connection (Use for DATABASE_URL)**
- **Port**: `5432`
- **Format**:
  ```
  postgresql://postgres:[YOUR_PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
  ```
- **Use for**: `DATABASE_URL` in Vercel (for all database operations)
- **Keep as-is**: No modifications needed, just replace `[YOUR_PASSWORD]` with your actual password

### 5. Get Your Password
- If you haven't set a database password yet:
  - Click **"Reset database password"** in the Database settings
  - Copy the generated password (save it securely!)
- Replace `[YOUR_PASSWORD]` in the connection string with your actual password

### 6. Copy Connection String
- **DATABASE_URL**: Copy the direct connection string (port 5432)

## Alternative: Using Supabase Dashboard Connection Info

If you see connection info instead of full URLs, you can construct them:

1. **Project Reference**: Found in your project URL or settings
   - Example: `abcdefghijklmnop`

2. **Region**: Found in connection info
   - Example: `us-east-1`

3. **Password**: Your database password

4. **Construct URL**:
   ```
   # DATABASE_URL (Direct - port 5432)
   postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Using Vercel Marketplace (Optional)

The Vercel marketplace integration is **optional** and just makes setup easier:

1. In Vercel Dashboard, go to your project
2. Click **"Integrations"** or **"Add Integration"**
3. Search for "Supabase"
4. Connect your Supabase account
5. Vercel will automatically:
   - Create environment variables
   - Link your Supabase project

**However**, you can still manually set the environment variables even if you use the marketplace integration.

## Setting Up in Vercel

### Method 1: Manual Setup (Recommended for Learning)
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Add `DATABASE_URL` with the direct connection string (port 5432)
3. Set for both **Production** and **Preview** environments

### Method 2: Vercel Marketplace Integration
1. Use Vercel's Supabase integration
2. It will auto-populate the connection string
3. Verify `DATABASE_URL` is set correctly

## Important Notes

### Direct Connection (DATABASE_URL)
- ✅ **MUST use port 5432** for direct connections
- ✅ Used for all database operations (application queries and migrations)
- ✅ Simple and reliable connection setup
- ✅ Replace `[YOUR_PASSWORD]` with your actual database password

### Password Security
- ⚠️ **Never commit passwords to git**
- ⚠️ Store passwords securely (use a password manager)
- ⚠️ Rotate passwords periodically
- ⚠️ Use different passwords for different environments if needed

## Quick Checklist

- [ ] Created Supabase project
- [ ] Set database password
- [ ] Found direct connection URL (port 5432) → `DATABASE_URL`
- [ ] Replaced `[YOUR_PASSWORD]` with actual password
- [ ] Added `DATABASE_URL` to Vercel environment variables
- [ ] Tested connection with Prisma migrations

## Troubleshooting

**"Can't find connection strings"**
- Make sure you're in the correct project
- Check Settings > Database > Connection string section
- Try refreshing the page

**"Connection refused"**
- Verify the port number (6543 for pooled, 5432 for direct)
- Check if your IP is allowed (Supabase allows all by default)
- Verify password is correct

**"Too many connections"**
- Check database connection limits in Supabase
- Verify Prisma client singleton is working
- Monitor connection usage in Supabase dashboard

## Example Connection Strings

### Supabase Project Example (Using Direct Connection Format)

**Your Direct Connection** (from Supabase Dashboard):
```
postgresql://postgres:[YOUR-PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```

**DATABASE_URL** (Direct connection - for all operations):
```
postgresql://postgres:[YOUR_PASSWORD]@db.wpyzsywtpolemehunrfq.supabase.co:5432/postgres
```
- Use the Direct Connection URL from Supabase
- Replace `[YOUR_PASSWORD]` with your actual password
- Port is `5432` (direct connection)

### Quick Reference: Using Your Connection String

If your Supabase shows:
```
postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

**For DATABASE_URL** (use as-is, replace password):
```
postgresql://postgres:[YOUR_PASSWORD]@db.xxxxx.supabase.co:5432/postgres
```

Replace `[YOUR_PASSWORD]` with your actual database password.

## Next Steps

After getting your connection strings:
1. Add them to Vercel environment variables
2. Run Prisma migrations: `npx prisma migrate deploy`
3. Deploy your application
4. Test database connectivity

For more details, see `VERCEL_SETUP.md` and `VERCEL_ENV_VARIABLES.md`.
