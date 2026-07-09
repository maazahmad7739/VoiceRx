# VoiceRx - Developer Setup Guide

This project is configured with a Next.js frontend and an Express/Prisma backend.

## Prerequisites

- **PostgreSQL**: SQLite is no longer supported. PostgreSQL is required for all environments.
- **Node.js** (v18+)

## Local Development Setup

### 1. Database Setup

Ensure you have a PostgreSQL server running locally or via Docker.

If using Docker, run:
```bash
docker-compose up -d db redis
```

If running locally on Windows/macOS, ensure the server is listening and update your connection URL in `backend/.env`.

### 2. Environment Variables

Create `backend/.env` (use `.env.example` as a template):

```ini
# Database Connection (PostgreSQL)
DATABASE_URL="postgresql://<username>:<password>@localhost:5432/<dbname>?schema=public"

# JSON Web Token Secret
JWT_SECRET="<your-strong-random-jwt-secret>"

# Google Gemini API Key
GEMINI_API_KEY="<your-api-key>"

# Frontend Allowed Origin (for CORS)
FRONTEND_URL="http://localhost:3000"
```

### 3. Database Migrations

Apply database migrations and generate the Prisma client:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

### 4. Running the App

Start the backend:
```bash
cd backend
npm run dev
```

Start the frontend:
```bash
cd frontend
npm run dev
```

### 5. Running Tests

To run the backend test suite:
```bash
cd backend
npm test
```
