"use client"
import { FormEvent, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Order } from '@/types';
import Receipt from '@/components/Receipt';

export default function LaundryPOS() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeView, setActiveView] = useState<'dashboard' | 'create' | 'view'>('dashboard');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<Order | null>(null);
  const router = useRouter();

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerContact, setCustomerContact] = useState('');
  const [weight, setWeight] = useState('');
  const [price, setPrice] = useState('');
  const [status, setStatus] = useState<'Pending' | 'In Progress' | 'Completed' | 'Cancelled'>('Pending');

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
      } else {
        setOrders(data || []);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Auth check error:', error);
          setLoading(false);
          router.push('/login');
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchOrders();
        } else {
          router.push('/login');
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth check exception:', error);
        setLoading(false);
        router.push('/login');
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchOrders();
      } else {
        setUser(null);
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleLogout = async () => {
    console.log('Logout button clicked');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
      } else {
        console.log('Logout successful');
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout exception:', err);
      alert('An error occurred during logout');
    }
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerAddress('');
    setCustomerContact('');
    setWeight('');
    setPrice('');
    setStatus('Pending');
    setEditingOrder(null);
  };

  const handleCreateOrder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    console.log('Form submitted with data:', {
      customerName,
      customerAddress,
      customerContact,
      weight,
      price,
      status
    });

    // Validate required fields
    if (!customerName || !customerAddress || !customerContact || !weight || !price) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      // 1. Create/Find Customer
      console.log('Creating customer...');
      const { data: customer, error: custError } = await supabase
        .from('customers')
        .upsert([{
          name: customerName,
          address: customerAddress,
          contact_number: customerContact
        }])
        .select()
        .single();

      console.log('Customer result:', { customer, custError });

      if (custError) {
        console.error('Customer error:', custError);
        alert("Error creating customer: " + custError.message);
        return;
      }

      // 2. Create Order
      const orderData = {
        customer_id: customer.id,
        weight: parseFloat(weight),
        total_price: parseFloat(price),
        status: status
      };

      console.log('Creating order with data:', orderData);

      let result;
      if (editingOrder) {
        // Update existing order
        console.log('Updating order:', editingOrder.id);
        result = await supabase
          .from('orders')
          .update(orderData)
          .eq('id', editingOrder.id)
          .select();
      } else {
        // Create new order
        console.log('Inserting new order...');
        result = await supabase
          .from('orders')
          .insert([orderData])
          .select();
      }

      console.log('Order result:', { result });

      if (result.error) {
        console.error('Order error:', result.error);
        alert("Error saving order: " + result.error.message);
      } else {
        console.log('Order saved successfully');
        if (editingOrder) {
          alert("Order updated successfully!");
        } else {
          alert("Order created successfully!");
          // Show receipt for new orders
          if (result.data && result.data[0]) {
            // Fetch the complete order with customer data
            const { data: completeOrder, error: fetchError } = await supabase
              .from('orders')
              .select(`
                *,
                customer:customers(*)
              `)
              .eq('id', result.data[0].id)
              .single();
            
            if (!fetchError && completeOrder) {
              setSelectedOrderForReceipt(completeOrder);
            }
          }
        }
        resetForm();
        await fetchOrders();
        setActiveView('view');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      alert("An unexpected error occurred: " + (err as Error).message);
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setCustomerName(order.customer.name);
    setCustomerAddress(order.customer.address);
    setCustomerContact(order.customer.contact_number);
    setWeight(order.weight.toString());
    setPrice(order.total_price.toString());
    setStatus(order.status);
    setActiveView('create');
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("Are you sure you want to delete this order?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) {
        alert("Error deleting order: " + error.message);
      } else {
        alert("Order deleted successfully!");
        await fetchOrders();
      }
    } catch (err) {
      alert("An unexpected error occurred");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Laundry POS</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="hidden sm:inline text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-red-700 transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm ${
                activeView === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => { setActiveView('create'); resetForm(); }}
              className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm ${
                activeView === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {editingOrder ? 'Edit Order' : 'Create Order'}
            </button>
            <button
              onClick={() => setActiveView('view')}
              className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm ${
                activeView === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              View Orders ({orders.length})
            </button>
            <button
              onClick={() => router.push('/inventory')}
              className="py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Inventory
            </button>
            <button
              onClick={() => router.push('/expenses')}
              className="py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Expenses
            </button>
            <button
              onClick={() => router.push('/payroll')}
              className="py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Payroll
            </button>
            <button
              onClick={() => router.push('/income')}
              className="py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            >
              Income
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'dashboard' ? (
          /* Dashboard View */
          <div className="space-y-6">
            {/* Welcome Message */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold text-black mb-2">Welcome to Laundry POS Dashboard</h2>
              <p className="text-gray-600">Here's an overview of your business today.</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-black">{orders.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-black">{orders.filter(o => o.status === 'Completed').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-black">{orders.filter(o => o.status === 'In Progress').length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-black">PHP {orders.reduce((sum, o) => sum + o.total_price, 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-black mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => { setActiveView('create'); resetForm(); }}
                  className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Order
                </button>
                <button
                  onClick={() => setActiveView('view')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  View Orders
                </button>
                <button
                  onClick={() => router.push('/inventory')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Inventory
                </button>
                <button
                  onClick={() => router.push('/income')}
                  className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Income Report
                </button>
              </div>
            </div>

            {/* Recent Orders */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-black">Recent Orders</h3>
                  <button
                    onClick={() => setActiveView('view')}
                    className="text-sm text-blue-600 hover:text-blue-900"
                  >
                    View All
                  </button>
                </div>
                
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-900">No orders yet. Create your first order to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-black">{order.customer.name}</h4>
                            <p className="text-xs text-gray-600">{new Date(order.created_at).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-600">{order.weight} kg</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-black">PHP {order.total_price.toFixed(2)}</p>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeView === 'create' ? (
          /* Create/Edit Order Form */
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-black mb-4">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h3>
              <form onSubmit={handleCreateOrder} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-black mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customerContact" className="block text-sm font-medium text-black mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      id="customerContact"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-black mb-1">
                      Address *
                    </label>
                    <textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-black mb-1">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      id="weight"
                      step="0.1"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-black mb-1">
                      Total Price (PHP) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-black mb-1">
                      Order Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-3 px-4 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  {editingOrder && (
                    <button
                      type="button"
                      onClick={() => { resetForm(); setActiveView('create'); }}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingOrder ? 'Update Order' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          /* Orders List */
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-black mb-4">
                All Orders
              </h3>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-black">No orders</h3>
                  <p className="mt-1 text-sm text-gray-900">Get started by creating a new order.</p>
                  <div className="mt-6">
                    <button
                      onClick={() => setActiveView('create')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Order
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Mobile Card Layout */}
                  <div className="sm:hidden space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-black">{order.customer.name}</h4>
                            <p className="text-xs text-gray-600">{order.customer.contact_number}</p>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Weight:</span>
                            <span className="text-black font-medium">{order.weight} kg</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Price:</span>
                            <span className="text-black font-medium">PHP {order.total_price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date:</span>
                            <span className="text-black">{new Date(order.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setSelectedOrderForReceipt(order)}
                            className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                          >
                            Print
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table Layout */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Weight
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orders.map((order) => (
                          <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-black">{order.customer.name}</div>
                              <div className="text-sm text-gray-900">{order.customer.address}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {order.customer.contact_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {order.weight} kg
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              PHP {order.total_price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {order.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setSelectedOrderForReceipt(order)}
                                className="text-green-600 hover:text-green-900 mr-3"
                              >
                                Print
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Receipt Modal */}
      {selectedOrderForReceipt && (
        <Receipt
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </main>
  );
}