# Stablestack Backend

A production-ready Express.js backend with TypeScript, featuring Clerk authentication, BlockRadar integration, and a robust caching system.

## 🚀 Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Architecture

### Core Patterns
- **Repository Pattern**: All database operations centralized in repositories
- **Service Layer**: Business logic separated from data access
- **Provider Pattern**: External API integrations abstracted
- **Middleware Chain**: Authentication, validation, and error handling

### Key Folders
- `src/repositories/` - Database operations (Repository pattern)
- `src/services/` - Business logic and external integrations
- `src/providers/` - External API providers (BlockRadar, etc.)
- `src/middleware/` - Authentication, validation, error handling
- `src/routes/` - API endpoints (public/protected)
- `src/logger/` - Centralized logging with Pino

## 🔧 Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/stablestack_db

# Authentication (Clerk)
CLERK_SECRET_KEY=sk_test_...
CLERK_PUBLISHABLE_KEY=pk_test_...

# CORS
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=100

# Cache
CACHE_PROVIDER=memory  # or redis
```

## 🛠️ Available Scripts

- `npm run dev` - Development with hot reload
- `npm run build` - Compile TypeScript
- `npm start` - Run production build
- `npm run lint` - ESLint checking
- `npm run format` - Prettier formatting

## 📡 API Endpoints

### Public Routes
- `GET /api/v1/public/health` - Health check
- `GET /api/v1/public/status` - Service status

### Protected Routes
- `GET /api/v1/protected/` - Test authenticated endpoint

## 🔐 Authentication

Uses Clerk for authentication:
- JWT token validation
- Automatic user sync to database
- Protected route middleware

## 💾 Database

- **PostgreSQL** with Prisma ORM
- Connection pooling
- Race condition protection
- Atomic operations

## 🚀 Caching

- **Memory cache** (default)
- **Redis** support
- Provider switching via environment
- Automatic fallback

## 📝 Logging

- **Pino** logger
- Per-function logging
- Request/response logging
- Structured JSON output

## 🐳 Docker

```bash
docker build -t stablestack-backend .
docker run -p 3000:3000 --env-file .env stablestack-backend
```

## 📚 Documentation

- API docs available at `/docs` when running
- Swagger/OpenAPI integration
- Type-safe request/response handling
