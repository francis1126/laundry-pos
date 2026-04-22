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
  const [activeView, setActiveView] = useState<'create' | 'view'>('create');
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
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchOrders();
      } else {
        router.push('/login');
      }
      setLoading(false);
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
    await supabase.auth.signOut();
    router.push('/login');
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
              <h1 className="text-2xl font-bold text-gray-900">Laundry POS Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
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
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => { setActiveView('create'); resetForm(); }}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {editingOrder ? 'Edit Order' : 'Create Order'}
            </button>
            <button
              onClick={() => setActiveView('view')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeView === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              View Orders ({orders.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === 'create' ? (
          /* Create/Edit Order Form */
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-black mb-4">
                {editingOrder ? 'Edit Order' : 'Create New Order'}
              </h3>
              <form onSubmit={handleCreateOrder} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-black">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      id="customerName"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="customerContact" className="block text-sm font-medium text-black">
                      Contact Number *
                    </label>
                    <input
                      type="tel"
                      id="customerContact"
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div className="sm:col-span-2">
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-black">
                      Address *
                    </label>
                    <textarea
                      id="customerAddress"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-black">
                      Weight (kg) *
                    </label>
                    <input
                      type="number"
                      id="weight"
                      step="0.1"
                      min="0.1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-black">
                      Total Price (PHP) *
                    </label>
                    <input
                      type="number"
                      id="price"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-black">
                      Order Status
                    </label>
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                <div className="overflow-x-auto">
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