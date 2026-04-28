-- Add loads column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loads INTEGER DEFAULT 1;

-- Add comment to the column
COMMENT ON COLUMN orders.loads IS 'Number of laundry loads for this order';
