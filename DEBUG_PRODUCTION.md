# Production Debugging Guide

## Current Issue: 500 Errors on Authentication Endpoints

The console shows:
```
api/auth/me:1  Failed to load resource: the server responded with a status of 401 ()
api/auth/login:1  Failed to load resource: the server responded with a status of 500 ()
```

## Most Likely Causes:

### 1. Missing Environment Variables in Railway
Check that these are set in Railway dashboard:

**Required Variables:**
```bash
DATABASE_URL=postgresql://your-db-url-here
JWT_SECRET=your-jwt-secret-minimum-64-characters-required
NODE_ENV=production
```

**Optional but Recommended:**
```bash
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@mdmcmusicads.com
ADMIN_PASSWORD=admin123
DATABASE_SSL=true
```

### 2. Database Connection Issues
The database might not be accessible from Railway. Check:
- Is the PostgreSQL database publicly accessible?
- Are the connection strings correct?
- Is SSL properly configured?

### 3. How to Debug

#### Step 1: Check Railway Deployment Logs
1. Go to Railway dashboard
2. Select your project
3. Click on "Deployments" 
4. View the latest deployment logs

#### Step 2: Look for Environment Variable Errors
With our latest update, the app should show these errors at startup:
```
❌ MISSING JWT_SECRET environment variable
❌ MISSING DATABASE_URL environment variable
```

#### Step 3: Test Health Endpoint
Try accessing: `https://your-railway-app.up.railway.app/health`
This should show database status.

#### Step 4: Manual Environment Variable Check
Add a debug endpoint temporarily to check variables are loaded.

## Quick Fix Commands

### Option A: Set Environment Variables via Railway CLI
```bash
railway login
railway environment
railway variables set DATABASE_URL="your-postgresql-url"
railway variables set JWT_SECRET="your-64-character-secret-key"
railway variables set NODE_ENV="production"
```

### Option B: Set via Railway Dashboard
1. Go to Railway dashboard
2. Select your project
3. Go to "Variables" tab
4. Add the required environment variables

## Testing Once Fixed

### 1. Health Check
```bash
curl https://your-railway-app.up.railway.app/health
```

### 2. Authentication Test
```bash
curl -X POST https://your-railway-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mdmcmusicads.com","password":"admin123"}'
```

## Environment Variables Reference

**DATABASE_URL Format:**
```
postgresql://username:password@host:port/database?sslmode=require
```

**JWT_SECRET Requirements:**
- Minimum 64 characters
- Use a strong random string
- Keep it secret and secure

**Example Production Config:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
JWT_SECRET=super-secret-jwt-key-that-is-at-least-64-characters-long-for-security
NODE_ENV=production
JWT_EXPIRES_IN=7d
DATABASE_SSL=true
ADMIN_EMAIL=admin@mdmcmusicads.com
ADMIN_PASSWORD=your-secure-password
```

## Success Indicators

When working correctly, you should see:
✅ No environment variable error messages in logs
✅ Database connection established in health check
✅ Authentication endpoints returning proper JSON responses
✅ Admin user created automatically on first startup

## Contact Info

If you need the specific Railway deployment URL or environment variables, please share:
1. Your Railway project name
2. The current deployment URL you're accessing
3. Any error logs from the Railway deployment console