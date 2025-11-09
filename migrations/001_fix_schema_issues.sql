-- Migration: Fix schema issues
-- Date: 2025-11-09
-- Description: Rename payload column to specialties and convert phone_number to text

-- Step 1: Rename payload column to specialties
ALTER TABLE advocates
RENAME COLUMN payload TO specialties;

-- Step 2: Convert phone_number from bigint to text
-- We need to drop and recreate the column since the type conversion isn't straightforward
ALTER TABLE advocates
ALTER COLUMN phone_number TYPE text USING phone_number::text;

-- Step 3: Format existing phone numbers (if any exist)
-- This will convert numbers like "5551234567" to "555-123-4567"
UPDATE advocates
SET phone_number = CONCAT(
  SUBSTRING(phone_number, 1, 3),
  '-',
  SUBSTRING(phone_number, 4, 3),
  '-',
  SUBSTRING(phone_number, 7, 4)
)
WHERE phone_number ~ '^\d{10}$' AND phone_number NOT LIKE '%-%';
