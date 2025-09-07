# MDMC SmartLink - Migration PostgreSQL + Odesli

## 📋 Migration Overview

This migration transforms your MDMC SmartLink admin interface from Firebase to PostgreSQL with integrated Odesli caching for improved performance and cost efficiency.

### ✅ What's New in v2.0

- **PostgreSQL Database** - Robust, scalable database with full control
- **Odesli Integration** - Automatic music metadata with intelligent caching
- **JWT Authentication** - Secure token-based authentication
- **Advanced Analytics** - Partitioned analytics tables for better performance
- **Rate Limiting** - Built-in API rate limiting and fallback mechanisms
- **Graceful Shutdown** - Production-ready error handling

## 🚀 Installation Steps

### Step 1: Install Dependencies

```bash
# Remove any Firebase dependencies (if present)
npm uninstall firebase

# Install new PostgreSQL dependencies
npm install pg bcrypt jsonwebtoken cookie dotenv node-fetch ua-parser-js

# Install dev dependencies
npm install --save-dev @types/pg @types/bcrypt @types/jsonwebtoken
```

### Step 2: Database Setup

1. **Create PostgreSQL Database**
   - Option A: Local PostgreSQL
   - Option B: Cloud provider (Neon, Railway, Supabase, etc.)

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Run Database Setup**
   ```bash
   npm run db:setup
   ```

### Step 3: Environment Variables

Required environment variables in `.env`:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname
DATABASE_SSL=false  # true for production

# JWT
JWT_SECRET=your-super-secret-jwt-key-64-chars-minimum
JWT_EXPIRES_IN=7d

# Application
PUBLIC_DOMAIN=mdmcmusicads.com
PUBLIC_BASE_URL=https://mdmcmusicads.com
NODE_ENV=production

# Odesli (optional customization)
ODESLI_RATE_LIMIT=10
ODESLI_CACHE_TTL=86400000
```

### Step 4: Test the Setup

```bash
# Test Odesli integration
npm run test:odesli

# Start the server
npm run dev

# Check health endpoint
curl http://localhost:3003/health
```

## 🗄️ Database Schema

### Core Tables

- **users** - User accounts with JWT auth
- **smartlinks** - SmartLink data with Odesli integration
- **odesli_cache** - Cached Odesli API responses
- **analytics** - Partitioned click analytics
- **sessions** - JWT session management

### Key Features

- **Partitioned Analytics** - Monthly partitions for better performance
- **JSONB Fields** - Flexible storage for platforms and customization
- **Automatic Timestamps** - Created/updated tracking
- **Constraint Validation** - Data integrity enforcement

## 🎵 Odesli Integration

### Automatic Features

- **URL Validation** - Supports Spotify, Apple Music, YouTube, Deezer, etc.
- **Metadata Extraction** - Title, artist, cover art, platform links
- **Smart Caching** - 24-hour cache with hit counting
- **Rate Limiting** - Automatic throttling with fallback
- **Error Handling** - Graceful degradation

### Usage Examples

```javascript
// Frontend: Fetch metadata
fetch('/api/odesli', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: 'https://open.spotify.com/track/...' })
})

// Backend: Direct usage
const { odesli } = require('./src/lib/odesli');
const data = await odesli.fetchLinks(url);
const parsed = odesli.parseData(data);
```

## 🔐 Authentication Flow

### JWT-Based Authentication

1. User login with email/password
2. Server validates credentials (bcrypt)
3. JWT token issued (7-day expiration)
4. Token required for protected endpoints

### API Endpoints

```
POST /api/odesli              - Fetch music metadata
GET  /api/odesli/stats        - Cache statistics
DELETE /api/odesli/cache      - Clean expired cache

POST /api/smartlinks          - Create SmartLink [AUTH]
GET  /api/smartlinks          - List user SmartLinks [AUTH]
GET  /api/smartlinks/:id      - Get SmartLink details [AUTH]
PUT  /api/smartlinks/:id      - Update SmartLink [AUTH]
DELETE /api/smartlinks/:id    - Delete SmartLink [AUTH]
GET  /api/smartlinks/:id/analytics - Get analytics [AUTH]

GET  /s/:slug                 - Public SmartLink page [NO AUTH]
GET  /health                  - System health check
```

## 🛠️ Available Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run db:setup       # Initialize database and create admin user
npm run db:migrate     # Run schema migrations
npm run db:reset       # Drop and recreate database (DANGER!)
npm run test:odesli    # Test Odesli integration
npm run cache:clean    # Clean expired Odesli cache
```

## 📊 Monitoring & Maintenance

### Health Checks

- GET `/health` - Returns system status including database health
- Monitors: Server, Database, Odesli cache, JWT configuration

### Cache Management

- Automatic expiration (24 hours)
- Hit counting for popular songs
- Manual cleanup with `npm run cache:clean`
- Rate limiting with fallback to expired cache

### Analytics

- Partitioned by month for performance
- Tracks: IP, User-Agent, Platform, Location, Device
- Non-blocking insertion (won't fail SmartLink requests)

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check SSL settings for cloud databases

2. **Odesli Rate Limiting**
   - Default: 10 requests/minute
   - Uses cache for subsequent requests
   - Configure ODESLI_RATE_LIMIT if needed

3. **JWT Token Issues**
   - Ensure JWT_SECRET is set and secure
   - Check token expiration time
   - Verify authorization header format

4. **Migration from Firebase**
   - Export existing data from Firebase
   - Transform to PostgreSQL format
   - Use db:setup to create fresh start

### Debug Mode

```bash
NODE_ENV=development DEBUG=true npm run dev
```

### Database Queries

```sql
-- Check cache performance
SELECT COUNT(*) as total, 
       COUNT(*) FILTER (WHERE expires_at > NOW()) as valid
FROM odesli_cache;

-- Top cached songs
SELECT title, artist, hit_count, platforms_count 
FROM odesli_cache 
WHERE title IS NOT NULL 
ORDER BY hit_count DESC 
LIMIT 10;

-- User SmartLink counts
SELECT u.email, u.plan, COUNT(s.id) as smartlink_count
FROM users u
LEFT JOIN smartlinks s ON u.id = s.user_id
GROUP BY u.id, u.email, u.plan;
```

## 🔄 Migration Checklist

- [ ] PostgreSQL database created and accessible
- [ ] Environment variables configured
- [ ] Dependencies installed (`npm install`)
- [ ] Database schema applied (`npm run db:setup`)
- [ ] Odesli integration tested (`npm run test:odesli`)
- [ ] Admin user created and can login
- [ ] Health check passes (`curl /health`)
- [ ] SmartLink creation works with Odesli
- [ ] Public SmartLink pages render correctly
- [ ] Analytics are being recorded
- [ ] Cache system working (check `/api/odesli/stats`)

## 📈 Performance Notes

- **Connection Pooling**: 20 max connections with 30s idle timeout
- **Query Optimization**: Indexed foreign keys and search fields
- **Partitioned Analytics**: Monthly partitions prevent table bloat
- **Odesli Caching**: 24-hour TTL reduces API calls by ~90%
- **Graceful Shutdown**: Proper cleanup of connections and resources

## 🆘 Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review logs for specific error messages
3. Verify all environment variables are set
4. Test each component individually (DB, Odesli, Auth)
5. Use health check endpoint to diagnose issues

---

**🎉 Congratulations!** Your MDMC SmartLink system is now running on PostgreSQL with Odesli integration, providing better performance, reliability, and cost efficiency.