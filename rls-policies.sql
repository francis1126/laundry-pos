-- Enable Row Level Security for customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert customers
CREATE POLICY "Allow authenticated users to insert customers" ON customers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to select customers
CREATE POLICY "Allow authenticated users to select customers" ON customers
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update customers
CREATE POLICY "Allow authenticated users to update customers" ON customers
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Enable Row Level Security for orders table
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to insert orders
CREATE POLICY "Allow authenticated users to insert orders" ON orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to select orders
CREATE POLICY "Allow authenticated users to select orders" ON orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update orders
CREATE POLICY "Allow authenticated users to update orders" ON orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete orders
CREATE POLICY "Allow authenticated users to delete orders" ON orders
    FOR DELETE USING (auth.role() = 'authenticated');
