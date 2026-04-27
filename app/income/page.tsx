"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Order, Expense } from '@/types';

export default function IncomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const timeout = setTimeout(() => {
          console.error('Auth check timeout - redirecting to login');
          setLoading(false);
          router.push('/login');
        }, 30000);

        const { data: { session } } = await supabase.auth.getSession();
        clearTimeout(timeout);

        if (session?.user) {
          setUser(session.user);
          await fetchData();
        } else {
          router.push('/login');
        }
        setLoading(false);
      } catch (error) {
        console.error('Auth check error:', error);
        setLoading(false);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router, period, selectedDate]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error);
        alert('Error logging out: ' + error.message);
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error('Logout exception:', err);
      alert('An error occurred during logout');
    }
  };

  const fetchData = async () => {
    try {
      const [ordersData, expensesData] = await Promise.all([
        supabase.from('orders').select('*, customer:customers(*)').order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').order('expense_date', { ascending: false })
      ]);

      if (ordersData.error) throw ordersData.error;
      if (expensesData.error) throw expensesData.error;

      setOrders(ordersData.data || []);
      setExpenses(expensesData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const getFilteredOrders = () => {
    const date = new Date(selectedDate);
    let startDate: Date;
    let endDate: Date;

    if (period === 'daily') {
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else if (period === 'weekly') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(date.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= startDate && orderDate <= endDate;
    });
  };

  const getFilteredExpenses = () => {
    const date = new Date(selectedDate);
    let startDate: Date;
    let endDate: Date;

    if (period === 'daily') {
      startDate = new Date(date.setHours(0, 0, 0, 0));
      endDate = new Date(date.setHours(23, 59, 59, 999));
    } else if (period === 'weekly') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(date.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else {
      startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.expense_date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  const getIncomeData = () => {
    const filteredOrders = getFilteredOrders();
    const filteredExpenses = getFilteredExpenses();

    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total_price, 0);
    const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netIncome = totalRevenue - totalExpenses;
    const orderCount = filteredOrders.length;

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      orderCount
    };
  };

  const getOrdersByStatus = () => {
    const filteredOrders = getFilteredOrders();
    const statusCount: { [key: string]: number } = {};
    filteredOrders.forEach(order => {
      statusCount[order.status] = (statusCount[order.status] || 0) + 1;
    });
    return statusCount;
  };

  const getExpensesByCategory = () => {
    const filteredExpenses = getFilteredExpenses();
    const categoryTotal: { [key: string]: number } = {};
    filteredExpenses.forEach(expense => {
      categoryTotal[expense.category] = (categoryTotal[expense.category] || 0) + expense.amount;
    });
    return categoryTotal;
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

  const incomeData = getIncomeData();
  const ordersByStatus = getOrdersByStatus();
  const expensesByCategory = getExpensesByCategory();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Income Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Period Selector */}
        <div className="bg-white shadow rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex space-x-2">
              <button
                onClick={() => setPeriod('daily')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  period === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setPeriod('weekly')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  period === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setPeriod('monthly')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  period === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
            </div>
            <div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">PHP {incomeData.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">{incomeData.orderCount} orders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">PHP {incomeData.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Net Income</p>
            <p className={`text-2xl font-bold ${incomeData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              PHP {incomeData.netIncome.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Period</p>
            <p className="text-2xl font-bold text-black capitalize">{period}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Orders by Status */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-black mb-4">Orders by Status</h3>
            {Object.keys(ordersByStatus).length === 0 ? (
              <p className="text-sm text-gray-900">No orders for this period</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-black capitalize">{status}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(count / incomeData.orderCount) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-black">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expenses by Category */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-black mb-4">Expenses by Category</h3>
            {Object.keys(expensesByCategory).length === 0 ? (
              <p className="text-sm text-gray-900">No expenses for this period</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-black capitalize">{category.replace('_', ' ')}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className="bg-red-600 h-2 rounded-full"
                          style={{ width: `${(amount / incomeData.totalExpenses) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-black">PHP {amount.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-black mb-4">Recent Orders ({period})</h3>
            
            {getFilteredOrders().length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-900">No orders for this period</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getFilteredOrders().slice(0, 10).map((order) => (
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
    </main>
  );
}
