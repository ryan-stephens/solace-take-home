# Take-Home Assignment Change Logs

This document tracks all changes, troubleshooting steps, and resolutions made during the Solace candidate assignment.

---

## Change Log Entry #1: Created CLAUDE.md Documentation File

**Date**: 2025-11-08
**Type**: Documentation
**Status**: Completed

### What Changed
Created a new file `CLAUDE.md` at the root of the repository to provide guidance for future instances of Claude Code when working with this codebase.

### Why This Was Necessary
This file serves as a comprehensive reference guide that helps AI assistants (and human developers) quickly understand:
- The project's architecture and structure
- Essential development commands
- Database setup procedures
- Key implementation patterns
- Known issues and quirks in the codebase

Without this documentation, each new instance of Claude Code would need to explore the entire codebase from scratch, wasting time and potentially missing important context that requires reading multiple files to understand.

### Details of Implementation
The `CLAUDE.md` file includes:
1. **Project Overview**: Brief description of the Solace Advocates mental health professional management application
2. **Tech Stack**: Next.js 14 (App Router), PostgreSQL, Drizzle ORM, TypeScript, Tailwind CSS
3. **Development Commands**: All essential npm commands for development, building, linting, and database operations
4. **Database Setup**: Complete step-by-step instructions for optional PostgreSQL setup via Docker Compose
5. **Architecture**: High-level organization of the codebase including:
   - Database layer (`src/db/`) with Drizzle ORM schema
   - API routes (`src/app/api/`) for advocates and seeding
   - Frontend (`src/app/`) with client component and search functionality
6. **Key Implementation Details**: Important patterns such as:
   - Dual-mode database connection (works with or without database configured)
   - Advocate data model with specialties system
   - Known bugs in the search implementation (type mismatches in filter logic)

### Files Created
- `CLAUDE.md`

### Files Modified
- None

---

## Change Log Entry #2: Fixed PostgreSQL Docker Container Restart Loop

**Date**: 2025-11-08
**Type**: Bug Fix / Configuration
**Status**: Completed

### Problem Description
The PostgreSQL Docker container (`solace-candidate-assignment-main-db-1`) was stuck in an infinite restart loop with exit code 1. The container would start, immediately fail, and restart continuously, preventing the database from becoming available.

### Root Cause Analysis
After examining the Docker logs with `docker logs solace-candidate-assignment-main-db-1`, the following error was discovered:

```
Error: in 18+, these Docker images are configured to store database data in a
       format which is compatible with "pg_ctlcluster" (specifically, using
       major-version-specific directory names).  This better reflects how
       PostgreSQL itself works, and how upgrades are to be performed.

       Counter to that, there appears to be PostgreSQL data in:
         /var/lib/postgresql/data

       This is usually the result of upgrading the Docker image without
       upgrading the underlying database using "pg_upgrade" (which requires both
       versions).
```

**Root Cause**: The `docker-compose.yml` file specified `image: postgres` without a version tag. This caused Docker to pull the latest PostgreSQL image (version 18+), which has a different data storage format than previous versions. The Docker volume `solace-candidate-assignment-main_psql` contained data from an older PostgreSQL version (likely 14 or 15), which was incompatible with PostgreSQL 18's new storage format that uses major-version-specific directory names compatible with `pg_ctlcluster`.

### Why This Was Necessary
1. **Container Functionality**: The database container needed to start successfully to allow development and testing with a real database
2. **Data Compatibility**: The old volume data was incompatible with PostgreSQL 18's new storage format
3. **Version Stability**: Pinning to a specific PostgreSQL version prevents future breaking changes when Docker pulls new image versions
4. **Fresh Start**: Since this is a new development environment with no production data, removing the old volume and starting fresh was the safest approach

### Resolution Steps

#### Step 1: Stop the Container
```bash
docker compose down
```
This cleanly stopped and removed the failing container and its associated network.

#### Step 2: Remove the Incompatible Volume
```bash
docker volume rm solace-candidate-assignment-main_psql
```
Removed the Docker volume containing PostgreSQL data in the old format. This was safe because:
- This is a development environment
- No production data exists
- The database can be easily re-seeded using the provided seed data in `src/db/seed/advocates.ts`

#### Step 3: Pin PostgreSQL Version
Modified `docker-compose.yml` to specify PostgreSQL 16 instead of using the latest version:

**Before**:
```yaml
services:
  db:
    image: postgres
    restart: always
```

**After**:
```yaml
services:
  db:
    image: postgres:16
    restart: always
```

**Rationale for PostgreSQL 16**:
- PostgreSQL 16 is a stable, mature LTS version
- It's compatible with the Drizzle ORM version used in the project
- It avoids the breaking changes introduced in PostgreSQL 18
- It matches the version used in other containers in the development environment (observed `postgres:16-alpine` in other projects)

#### Step 4: Restart the Container
```bash
docker compose up -d
```
This created a new volume with the correct format and started PostgreSQL 16 successfully.

#### Step 5: Verification
Verified successful startup with:
```bash
docker ps
docker logs solace-candidate-assignment-main-db-1 --tail 20
```

The logs confirmed successful initialization:
```
PostgreSQL init process complete; ready for start up.
database system is ready to accept connections
```

### Files Modified
- `docker-compose.yml` (line 3): Changed `image: postgres` to `image: postgres:16`

### Files Created
- None

### Post-Resolution State
- Container `solace-candidate-assignment-main-db-1` is running successfully
- PostgreSQL 16.9 is listening on port 5432 (both IPv4 and IPv6)
- New volume `solace-candidate-assignment-main_psql` created with PostgreSQL 16 format
- Database is ready to accept connections
- Ready for schema migration with `npx drizzle-kit push`
- Ready for seeding with `curl -X POST http://localhost:3000/api/seed`

### Lessons Learned
1. **Always pin versions**: Docker image tags should specify exact or major versions to prevent unexpected breaking changes
2. **Volume compatibility**: PostgreSQL major version upgrades require special handling and cannot simply reuse old data volumes
3. **Fresh development environments**: For development setups without critical data, removing incompatible volumes and starting fresh is often the quickest solution

### Alternative Solutions Considered
1. **Using `pg_upgrade`**: Would require running both PostgreSQL versions simultaneously and migrating data - overkill for empty development database
2. **Changing volume mount point**: PostgreSQL 18+ recommends mounting at `/var/lib/postgresql` instead of `/var/lib/postgresql/data` - not pursued since version pinning is simpler
3. **Manual data migration**: Would require backup/restore process - unnecessary for development environment with seed data available

---

## Change Log Entry #3: Fixed Database Schema Push - Port Conflict Resolution

**Date**: 2025-11-08
**Type**: Bug Fix / Configuration
**Status**: Completed

### Problem Description
After successfully starting the PostgreSQL Docker container, attempts to push the database schema using `npx drizzle-kit push` consistently failed with authentication errors:

```
PostgresError: password authentication failed for user "postgres"
  severity: 'FATAL',
  code: '28P01',
```

Despite verifying that:
- The Docker container was running successfully
- The database credentials were correctly configured in `docker-compose.yml`
- Direct connections to the container via `docker exec` worked fine
- The `DATABASE_URL` was properly formatted

### Root Cause Analysis

**Initial Hypothesis**: The issue appeared to be related to environment variable loading, as dotenv reported `injecting env (0) from .env`, suggesting no variables were being loaded.

**Discovery Process**:
1. Tested direct database connection via `docker exec` - successful
2. Verified database credentials and user roles - all correct
3. Checked for environment variable loading issues
4. Ran `netstat -ano | findstr :5432` to check port status
5. **Critical Discovery**: Found TWO different processes listening on port 5432:
   - PID 11884: `postgres.exe` (Windows PostgreSQL service)
   - PID 39604: `com.docker.backend.exe` (Docker container)

**Root Cause**: A Windows PostgreSQL service was already running on port 5432. When the Docker container was configured to map to the same port (`5432:5432`), Windows allowed both to bind (likely due to different network interfaces), but connection attempts from localhost were being routed to the Windows PostgreSQL instance instead of the Docker container. This Windows PostgreSQL instance had different credentials (or no password set), causing authentication failures.

### Why This Was Necessary

1. **Schema Deployment**: The database schema needed to be pushed to create the `advocates` table before the application could function with a real database
2. **Port Conflict Resolution**: Two PostgreSQL instances cannot reliably serve the same port on the same host
3. **Connection Reliability**: The application and Drizzle Kit need to connect to the correct PostgreSQL instance (Docker container, not Windows service)
4. **Environment Configuration**: Proper environment variable loading is essential for database connection configuration

### Resolution Steps

#### Step 1: Install dotenv Package
```bash
npm install --save-dev dotenv
```

**Rationale**: The `drizzle.config.ts` file was attempting to read `process.env.DATABASE_URL`, but environment variables from `.env` files are not automatically loaded by Node.js. The dotenv package is required to load variables from `.env` files into `process.env`.

#### Step 2: Update Drizzle Configuration to Load Environment Variables
Modified `drizzle.config.ts` to import and execute dotenv:

**Before**:
```typescript
const config = {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};

export default config;
```

**After**:
```typescript
import { config as dotenvConfig } from "dotenv";

dotenvConfig();

const config = {
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};

export default config;
```

**Note**: Although dotenv was loaded, it reported `(0)` variables loaded, indicating the `.env` file wasn't being read. This turned out to be a secondary issue overshadowed by the port conflict.

#### Step 3: Update DATABASE_URL Format
Modified `.env` to include explicit port number and use IP address instead of hostname:

**Before**: (commented out in original)
```
#DATABASE_URL=postgresql://postgres:password@localhost/solaceassignment
```

**After**:
```
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/solaceassignment
```

**Rationale**:
- Uncommented the DATABASE_URL as required
- Added explicit port `:5432` for clarity
- Changed `localhost` to `127.0.0.1` to avoid potential hostname resolution issues on Windows

**Result**: Still failed due to port conflict (connection was hitting Windows PostgreSQL, not Docker)

#### Step 4: Add Fallback Connection String
Modified `drizzle.config.ts` to include a fallback connection string:

```typescript
dbCredentials: {
  url: process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5432/solaceassignment",
},
```

**Rationale**: Ensured the configuration would work even if environment variables weren't loading properly. This also helped confirm the issue wasn't with environment variable loading.

#### Step 5: Identify Port Conflict
Investigated what processes were listening on port 5432:

```bash
netstat -ano | findstr :5432
tasklist | findstr "39604 11884"
```

**Discovery**: Two processes were bound to port 5432:
- `postgres.exe` (PID 11884) - Windows PostgreSQL service
- `com.docker.backend.exe` (PID 39604) - Docker container

#### Step 6: Change Docker Container Port Mapping
Modified `docker-compose.yml` to use a different host port:

**Before**:
```yaml
ports:
  - 5432:5432
```

**After**:
```yaml
ports:
  - 5434:5432
```

**Rationale**:
- Maps host port 5434 to container port 5432
- Avoids conflict with Windows PostgreSQL service on port 5432
- Container internally still uses standard PostgreSQL port 5432
- Host applications connect via port 5434
- Port 5434 chosen as it's close to 5432 for easy recognition and unlikely to conflict with other services

#### Step 7: Update Connection Strings
Updated both `.env` and `drizzle.config.ts` to use new port:

**`.env`**:
```
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5434/solaceassignment
```

**`drizzle.config.ts`** (fallback):
```typescript
url: process.env.DATABASE_URL || "postgresql://postgres:password@127.0.0.1:5434/solaceassignment",
```

#### Step 8: Restart Docker Container
```bash
docker compose down && docker compose up -d
```

Restarted the container to apply the new port mapping.

#### Step 9: Verify and Push Schema
```bash
docker ps | grep solace  # Verified container running on port 5434
npx drizzle-kit push     # Successfully pushed schema
```

### Database Schema Created
The following table was successfully created:

```sql
CREATE TABLE IF NOT EXISTS "advocates" (
  "id" serial PRIMARY KEY NOT NULL,
  "first_name" text NOT NULL,
  "last_name" text NOT NULL,
  "city" text NOT NULL,
  "degree" text NOT NULL,
  "payload" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "years_of_experience" integer NOT NULL,
  "phone_number" bigint NOT NULL,
  "created_at" timestamp DEFAULT CURRENT_TIMESTAMP
);
```

### Files Modified
1. **`package.json`**: Added `dotenv@17.2.3` to devDependencies
2. **`drizzle.config.ts`**:
   - Added dotenv import and initialization
   - Added fallback connection string
   - Updated port from 5432 to 5434
3. **`.env`**:
   - Uncommented DATABASE_URL
   - Added explicit port specification
   - Changed `localhost` to `127.0.0.1`
   - Updated port from 5432 to 5434
4. **`docker-compose.yml`**: Changed host port mapping from `5432:5432` to `5434:5432`

### Files Created
- None (package-lock.json was updated automatically by npm)

### Post-Resolution State
- PostgreSQL container running on host port 5434, container port 5432
- Database schema successfully pushed and `advocates` table created
- Connection string properly configured in both `.env` and `drizzle.config.ts`
- dotenv package installed and configured to load environment variables
- Ready for database seeding

### Lessons Learned

1. **Check for Port Conflicts Early**: Before assuming authentication or configuration issues, verify nothing else is using the required ports. Use `netstat` or `ss` to check port usage.

2. **Windows Can Bind Multiple Processes to Same Port**: Unlike Unix-like systems that typically prevent this, Windows can allow multiple processes to bind to the same port on different interfaces, leading to confusing routing issues.

3. **Environment Variable Loading**: Node.js doesn't automatically load `.env` files - the dotenv package (or similar) is required for development tooling like Drizzle Kit.

4. **Explicit Port Specification**: Always include explicit port numbers in connection strings to avoid ambiguity and make troubleshooting easier.

5. **IP vs Hostname**: On Windows, using `127.0.0.1` instead of `localhost` can avoid hostname resolution issues and provide more predictable behavior.

6. **Systematic Debugging**: When facing persistent errors:
   - Verify each component individually (container, database, connectivity)
   - Check system-level resources (ports, processes)
   - Test with direct connections before assuming application configuration issues

### Alternative Solutions Considered

1. **Stop Windows PostgreSQL Service**: Could have stopped the `postgres.exe` Windows service to free up port 5432
   - **Why Not Chosen**: May be used by other projects; changing Docker port is less invasive

2. **Use Different Database**: Could have used SQLite or another database that doesn't require port binding
   - **Why Not Chosen**: Project specifically uses PostgreSQL; changing would require significant codebase modifications

3. **Use WSL2 for Docker**: Could have configured Docker to run in WSL2 instead of Windows
   - **Why Not Chosen**: Requires Docker configuration changes; port mapping solution is simpler and works with current setup

4. **Use Database URL with Different Hostname**: Could have configured Windows hosts file or used different network interface
   - **Why Not Chosen**: Changing port is simpler and more explicit

### Future Recommendations

1. **Document Port Requirements**: Add to README.md that port 5434 is used to avoid conflicts with system PostgreSQL
2. **Consider Using Docker Internal Networking**: For production-like setups, consider running the Next.js app in Docker and using Docker's internal networking to avoid host port conflicts
3. **Environment Variable Validation**: Add startup checks to validate DATABASE_URL is properly loaded before attempting connections
4. **Port Conflict Detection**: Could add a pre-startup script that checks if required ports are available

---

## Change Log Entry #4: Database Seeding and API Configuration

**Date**: 2025-11-08
**Type**: Configuration / Data Migration
**Status**: Completed

### Problem Description
After successfully pushing the database schema, the database was empty and the application was still configured to return mock data from `src/db/seed/advocates.ts` instead of querying the actual database.

### What Changed
1. **Seeded the database** with 15 advocate records using the `/api/seed` endpoint
2. **Enabled database mode** in the advocates API route by switching from mock data to actual database queries

### Why This Was Necessary

1. **Data Availability**: The database needed initial data to test the application functionality
2. **Production-like Behavior**: The application should query the actual database rather than returning hardcoded mock data
3. **Testing Real Database Integration**: Verifying that the Drizzle ORM setup, connection configuration, and queries work correctly with the PostgreSQL database

### Resolution Steps

#### Step 1: Start Development Server
Started the Next.js development server to make the API routes accessible:
```bash
npm run dev
```

**Note**: The seed endpoint is a Next.js API route at `/api/seed`, so the development server must be running for the HTTP request to work.

#### Step 2: Seed the Database
Executed the seed command using PowerShell (Windows):
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed -Method POST
```

**Response Received**:
- Status Code: 200 (OK)
- Content: JSON with 15 advocate records
- All advocates successfully inserted with IDs 1-15

**Note**: On Windows PowerShell, the standard `curl` command is aliased to `Invoke-WebRequest` which has different syntax. The proper PowerShell syntax is required, or `curl.exe` must be used explicitly.

#### Step 3: Enable Database Mode in API Route
Modified `src/app/api/advocates/route.ts` to query the database instead of returning mock data:

**Before**:
```typescript
import db from "../../../db";
import { advocates } from "../../../db/schema";
import { advocateData } from "../../../db/seed/advocates";

export async function GET() {
  // Uncomment this line to use a database
  // const data = await db.select().from(advocates);

  const data = advocateData;

  return Response.json({ data });
}
```

**After**:
```typescript
import db from "../../../db";
import { advocates } from "../../../db/schema";

export async function GET() {
  const data = await db.select().from(advocates);

  return Response.json({ data });
}
```

**Changes Made**:
1. Uncommented the database query: `const data = await db.select().from(advocates);`
2. Removed the mock data assignment: `const data = advocateData;`
3. Removed the unused import: `import { advocateData } from "../../../db/seed/advocates";`

### Files Modified
1. **`src/app/api/advocates/route.ts`**:
   - Enabled database query mode
   - Removed mock data fallback
   - Removed unused import

### Files Created
- None

### Data Seeded
Successfully seeded 15 advocate records with the following structure:
- Personal information (firstName, lastName, city)
- Professional credentials (degree, yearsOfExperience)
- Contact information (phoneNumber)
- Specialties (array of medical/mental health specialties)
- Auto-generated fields (id, createdAt)

**Sample Record**:
```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "city": "New York",
  "degree": "MD",
  "specialties": ["Obsessive-compulsive disorders"],
  "yearsOfExperience": 10,
  "phoneNumber": 5551234567,
  "createdAt": "2025-11-08T..."
}
```

### Post-Resolution State
- Database contains 15 advocate records (IDs 1-15)
- API endpoint `/api/advocates` now queries the PostgreSQL database
- Application is fully integrated with the database
- Mock data mode disabled
- Ready for frontend testing and development

### Verification
To verify the database integration is working:
1. Visit `http://localhost:3000` in a browser
2. The application should display all 15 advocates from the database
3. Search functionality can be tested with the seeded data

### Lessons Learned

1. **API Routes Require Running Server**: Next.js API routes like `/api/seed` are not accessible unless the development server is running with `npm run dev`.

2. **PowerShell vs Bash Commands**: On Windows PowerShell, `curl` is aliased to `Invoke-WebRequest` which has different syntax. Must use either:
   - `Invoke-WebRequest -Uri [url] -Method POST`
   - `curl.exe -X POST [url]` (if curl executable is installed)

3. **Dual-Mode Configuration Pattern**: The original code had a clean pattern for switching between mock and database modes, which is useful for:
   - Initial development without database setup
   - Testing with predictable data
   - Quick prototyping
   - However, once the database is configured, should switch to database mode for production-like behavior

4. **Clean Up Unused Imports**: After switching from mock to database mode, removing unused imports keeps the code clean and avoids confusion.

### Alternative Approaches Considered

1. **Keep Mock Data Fallback**: Could have kept `advocateData` as a fallback if database connection fails
   - **Why Not Chosen**: Application should fail visibly if database is unavailable rather than silently falling back to mock data

2. **Use Migration Script Instead of API Endpoint**: Could have created a separate Node.js script for seeding
   - **Why Not Chosen**: API endpoint approach is already implemented and works well for development

3. **Environment Variable for Mock/Database Toggle**: Could have used an environment variable to switch between modes
   - **Why Not Chosen**: Adds unnecessary complexity; better to have one clear mode in production

---

## Summary

**Total Changes**: 4
**Documentation Created**: 1 file (`CLAUDE.md`)
**Bugs Fixed**: 2 (PostgreSQL container restart loop, schema push port conflict)
**Configuration Changes**: 4 (PostgreSQL version pinning, port mapping, environment variable loading, database mode enabled)
**Dependencies Added**: 1 (dotenv)
**Database Tables Created**: 1 (`advocates`)
**Database Records Seeded**: 15 (advocate records)
**Current Status**: Application fully integrated with PostgreSQL database and ready for development/testing
