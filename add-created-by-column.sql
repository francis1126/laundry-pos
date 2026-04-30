-- Add created_by column to orders table to track who created each order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add comment to the column
COMMENT ON COLUMN orders.created_by IS 'User ID of the person who created this order';

-- Create index on created_by for faster queries
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
