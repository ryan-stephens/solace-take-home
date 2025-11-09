# Testing with Large Datasets

This guide explains how to test the Solace Advocates application with thousands of records to verify performance, pagination, and search functionality at scale.

## Quick Start

### Option 1: Using API Endpoints (Recommended)

**1. Start the development server:**
```bash
npm run dev
```

**2. Clear existing data (optional):**
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/clear-db -Method POST
```

**3. Seed 5,000 records:**
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 5000}'
```

**4. Test the application:**
- Open http://localhost:3000
- Try searching, filtering, sorting, and pagination with 5,000 records

### Option 2: Using Node Script Directly

**1. Run the seed script:**
```bash
npx tsx src/db/seed/generateLargeDataset.ts 5000
```

## API Endpoints

### Seed Large Dataset
**Endpoint:** `POST /api/seed-large`

**Request Body (optional):**
```json
{
  "count": 5000
}
```

**Default:** 5,000 records if no count specified

**Response:**
```json
{
  "success": true,
  "message": "Successfully seeded 5000 advocate records",
  "count": 5000
}
```

**Examples:**
```powershell
# Seed 5,000 records (default)
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST

# Seed 10,000 records
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 10000}'

# Seed 1,000 records
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 1000}'
```

### Clear Database
**Endpoint:** `POST /api/clear-db`

**Description:** Deletes all advocate records and resets the ID sequence to 1.

**Response:**
```json
{
  "success": true,
  "message": "All advocate records have been deleted and ID sequence reset"
}
```

**Example:**
```powershell
Invoke-WebRequest -Uri http://localhost:3000/api/clear-db -Method POST
```

## Generated Data

The large dataset generator creates realistic test data:

### Names
- **160 first names** (common US names)
- **160 last names** (diverse surnames)
- Random combinations create realistic full names

### Cities
- **60 major US cities** (New York, Los Angeles, Chicago, etc.)
- Geographically diverse across all regions

### Degrees
- **8 credential types:** MD, PhD, PsyD, MSW, LCSW, LMFT, LPC, NP
- Realistic distribution of mental health professional credentials

### Specialties
- **26 specialty areas** (same as original seed data)
- Each advocate has **1-5 random specialties**
- No duplicate specialties per advocate

### Experience
- **1-40 years** of experience
- Random distribution

### Phone Numbers
- **Valid 10-digit US phone numbers**
- Format: (XXX) XXX-XXXX
- Area codes: 200-999

## Testing Scenarios

### 1. Performance Testing
```
✅ Initial page load with 5,000 records
✅ Pagination through multiple pages
✅ Sorting by different columns
✅ Search with various terms
✅ Multiple filter combinations
```

### 2. Search Testing
```
✅ Search by first name: "James"
✅ Search by last name: "Smith"
✅ Search by full name: "James Smith"
✅ Search by city: "New York"
✅ Search by degree: "MD"
✅ Search by specialty: "PTSD"
```

### 3. Filter Testing
```
✅ Filter by degree: MD, PhD
✅ Filter by city: New York, Los Angeles
✅ Filter by experience: 5-15 years
✅ Filter by specialty: Trauma & PTSD
✅ Combine multiple filters
```

### 4. Pagination Testing
```
✅ Navigate through pages (First, Previous, Next, Last)
✅ Change page size (10, 25, 50, 100 per page)
✅ Verify record counts are accurate
✅ Test with different filter combinations
```

### 5. Full Name Search Testing
```
✅ Search "James Smith" → Should find all James Smiths
✅ Search "Mary Johnson" → Should find all Mary Johnsons
✅ Search "Jam Smi" → Should find James Smith (partial match)
✅ Verify case-insensitive matching
```

## Performance Benchmarks

Expected performance with 5,000 records:

| Operation | Expected Time |
|-----------|--------------|
| Initial page load | < 100ms |
| Search query | < 200ms |
| Filter application | < 200ms |
| Sorting | < 150ms |
| Pagination | < 100ms |
| Seeding 5,000 records | 5-15 seconds |

## Scaling Tests

Test with different dataset sizes:

```powershell
# Small dataset (1,000 records)
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 1000}'

# Medium dataset (5,000 records) - Recommended
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 5000}'

# Large dataset (10,000 records)
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 10000}'

# Very large dataset (50,000 records) - May take a few minutes
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 50000}'
```

## Workflow for Testing

**Recommended testing workflow:**

1. **Clear database:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/clear-db -Method POST
   ```

2. **Seed large dataset:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST -ContentType "application/json" -Body '{"count": 5000}'
   ```

3. **Test application features:**
   - Open http://localhost:3000
   - Test search, filters, sorting, pagination
   - Verify performance is acceptable

4. **Reset for next test:**
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000/api/clear-db -Method POST
   ```

## Troubleshooting

### Seeding Takes Too Long
- **Solution:** Reduce the count (try 1,000 or 2,000 records)
- **Note:** Seeding 5,000 records typically takes 5-15 seconds

### Out of Memory Errors
- **Solution:** Reduce batch size in `generateLargeDataset.ts` (currently 500)
- **Note:** The script inserts in batches to avoid memory issues

### Database Connection Errors
- **Solution:** Ensure PostgreSQL container is running:
  ```bash
  docker ps | grep solace
  ```
- **Solution:** Check DATABASE_URL in `.env` file

### Slow Query Performance
- **Solution:** Add database indexes (for production):
  ```sql
  CREATE INDEX idx_advocates_first_name ON advocates(first_name);
  CREATE INDEX idx_advocates_last_name ON advocates(last_name);
  CREATE INDEX idx_advocates_city ON advocates(city);
  CREATE INDEX idx_advocates_degree ON advocates(degree);
  ```

## Notes

- **Batch Insertion:** Records are inserted in batches of 500 for optimal performance
- **Realistic Data:** Names, cities, and credentials are realistic for testing
- **Randomization:** Each run generates different data combinations
- **ID Sequence:** Clearing the database resets IDs to start from 1
- **Max Limit:** API enforces a maximum of 100,000 records per seed operation

## Example Test Session

```powershell
# 1. Start dev server
npm run dev

# 2. Clear existing data
Invoke-WebRequest -Uri http://localhost:3000/api/clear-db -Method POST

# 3. Seed 5,000 records
Invoke-WebRequest -Uri http://localhost:3000/api/seed-large -Method POST

# 4. Open browser and test
# http://localhost:3000

# 5. Try these searches:
# - "James Smith" (full name)
# - "New York" (city)
# - "MD" (degree)
# - "PTSD" (specialty)

# 6. Test filters:
# - Select multiple degrees
# - Select multiple cities
# - Set experience range
# - Combine all filters

# 7. Test pagination:
# - Change page size to 100
# - Navigate to last page
# - Sort by different columns
```

## Success Criteria

✅ **Performance:** All operations complete in < 500ms  
✅ **Accuracy:** Search returns correct results  
✅ **Pagination:** Correct record counts and navigation  
✅ **Filters:** Multiple filters work together correctly  
✅ **Sorting:** All columns sort properly  
✅ **Full Name Search:** "James Smith" finds James Smith records  
✅ **Scalability:** Application remains responsive with 5,000+ records
