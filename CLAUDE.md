# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js application for managing Solace Advocates - mental health professionals with various specialties. The app allows browsing and searching advocates with their credentials, specialties, and contact information.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL with Drizzle ORM
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: Node.js with postgres driver

## Development Commands

```bash
# Install dependencies
npm i

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm build

# Start production server
npm start

# Run linter
npm run lint
```

## Database Setup

The app works without a database by default (returns mock data from `src/db/seed/advocates.ts`). To enable database:

1. Start PostgreSQL via Docker:
   ```bash
   docker compose up -d
   ```

2. Uncomment the `DATABASE_URL` in `.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@localhost/solaceassignment
   ```

3. Push schema to database:
   ```bash
   npx drizzle-kit push
   ```

4. Seed the database:
   ```bash
   curl -X POST http://localhost:3000/api/seed
   ```

5. Enable database queries by uncommenting line 7 in `src/app/api/advocates/route.ts`

### Database Commands

```bash
# Generate migrations
npm run generate

# Run migrations
npm run migrate:up

# Seed database
npm run seed
```

## Architecture

### Database Layer (`src/db/`)

- **`schema.ts`**: Drizzle ORM schema definition for the `advocates` table
  - Fields: id, firstName, lastName, city, degree, specialties (jsonb array), yearsOfExperience, phoneNumber, createdAt
- **`index.ts`**: Database client setup with fallback for when DATABASE_URL is not set
- **`seed/advocates.ts`**: Mock data with 15 advocates and 31 specialty types

### API Routes (`src/app/api/`)

- **`/api/advocates`** (GET): Returns list of advocates (mock data or from database)
- **`/api/seed`** (POST): Seeds the database with advocate data

### Frontend (`src/app/`)

- **`page.tsx`**: Main client component with advocate table and search functionality
  - Fetches advocates on mount
  - Implements search filtering across all advocate fields
  - Search currently has bugs (e.g., searching arrays/numbers with `.includes()` on strings)

## Key Implementation Details

### Database Connection Pattern

The database setup in `src/db/index.ts` returns a mock object when `DATABASE_URL` is not configured, allowing the app to run without a database. This dual-mode approach is controlled by environment variables.

### Data Model

Advocates have:
- Personal info (firstName, lastName, phoneNumber)
- Professional credentials (degree, yearsOfExperience)
- Location (city)
- Specialties (array of strings from predefined list)

Specialties include mental health categories like "LGBTQ", "Trauma & PTSD", "Medication/Prescribing", coaching, nutrition, and various disorders.

### Search Implementation

The search filter in `page.tsx:19-37` attempts to match the search term against all advocate fields. Note: The current implementation has type mismatches (e.g., calling `.includes()` on number fields).
- ensure that we are only making necessary changes, all changes or troubleshooting that we perform must be highly documented with reasoning for the change (report all documentation to the 'Take-Home-Change-Logs.md' which you should create if it doesn't exist or update if it does exist
- reliability, scalability, and clean code is highly valued in any and all implementations
- high performance design and implementation is expected, backend must support a database with the potential for hundreds of thousands if not millions of records
- highly value good user experiences through great UI design, consistency across the app is key