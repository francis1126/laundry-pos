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
  total_price: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
}
