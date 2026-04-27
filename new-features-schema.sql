-- Inventory Table for Fab Con and Laundry Items
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'fab_con', 'detergent', 'bleach', 'other'
  quantity INTEGER NOT NULL DEFAULT 0,
  unit VARCHAR(50) NOT NULL, -- 'liters', 'kg', 'pieces', 'boxes'
  unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  supplier VARCHAR(255),
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses Table for Electricity, Water, and other expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100) NOT NULL, -- 'electricity', 'water', 'rent', 'supplies', 'other'
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  expense_date DATE NOT NULL,
  payment_method VARCHAR(50), -- 'cash', 'bank_transfer', 'check'
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees Table for Payroll
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  position VARCHAR(100) NOT NULL, -- 'washer', 'ironer', 'driver', 'manager'
  contact_number VARCHAR(20),
  address TEXT,
  hire_date DATE NOT NULL,
  daily_rate DECIMAL(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payroll Table
CREATE TABLE IF NOT EXISTS payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  days_worked INTEGER NOT NULL,
  gross_pay DECIMAL(10, 2) NOT NULL,
  deductions DECIMAL(10, 2) DEFAULT 0,
  net_pay DECIMAL(10, 2) NOT NULL,
  pay_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Income Summary Table (optional - can be calculated from orders)
CREATE TABLE IF NOT EXISTS income_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_revenue DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_expenses DECIMAL(10, 2) NOT NULL DEFAULT 0,
  net_income DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Inventory
CREATE POLICY "Users can view inventory" ON inventory
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert inventory" ON inventory
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update inventory" ON inventory
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete inventory" ON inventory
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Expenses
CREATE POLICY "Users can view expenses" ON expenses
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert expenses" ON expenses
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update expenses" ON expenses
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete expenses" ON expenses
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Employees
CREATE POLICY "Users can view employees" ON employees
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert employees" ON employees
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update employees" ON employees
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete employees" ON employees
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Payroll
CREATE POLICY "Users can view payroll" ON payroll
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert payroll" ON payroll
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update payroll" ON payroll
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete payroll" ON payroll
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- RLS Policies for Income Summary
CREATE POLICY "Users can view income_summary" ON income_summary
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert income_summary" ON income_summary
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update income_summary" ON income_summary
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete income_summary" ON income_summary
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_employees_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_date ON payroll(pay_date);
CREATE INDEX IF NOT EXISTS idx_income_summary_period ON income_summary(period_type, period_start);
