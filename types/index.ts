export interface Customer {
  id: string;
  name: string;
  address: string;
  contact_number: string;
}

export interface Order {
  id: string;
  customer_id: string;
  customer: Customer;
  weight: number;
  loads: number;
  total_price: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
}

export interface Inventory {
  id: string;
  name: string;
  category: 'fab_con' | 'detergent' | 'bleach' | 'other';
  quantity: number;
  unit: 'liters' | 'kg' | 'pieces' | 'boxes';
  unit_price: number;
  min_stock_level: number;
  supplier?: string;
  last_restocked?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  category: 'electricity' | 'water' | 'rent' | 'supplies' | 'other';
  description?: string;
  amount: number;
  expense_date: string;
  payment_method?: 'cash' | 'bank_transfer' | 'check';
  receipt_number?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  name: string;
  position: 'washer' | 'ironer' | 'driver' | 'manager';
  contact_number?: string;
  address?: string;
  hire_date: string;
  daily_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payroll {
  id: string;
  employee_id: string;
  employee?: Employee;
  pay_period_start: string;
  pay_period_end: string;
  days_worked: number;
  gross_pay: number;
  deductions: number;
  net_pay: number;
  pay_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface IncomeSummary {
  id: string;
  period_type: 'daily' | 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  total_orders: number;
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  created_at: string;
  updated_at: string;
}
