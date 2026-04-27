"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Expense } from '@/types';

export default function ExpensesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form state
  const [category, setCategory] = useState<'electricity' | 'water' | 'rent' | 'supplies' | 'other'>('electricity');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'check' | ''>('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchExpenses();
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
  }, [router]);

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

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      setExpenses(data || []);
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const expenseData = {
        category,
        description: description || null,
        amount: parseFloat(amount),
        expense_date: expenseDate,
        payment_method: paymentMethod || null,
        receipt_number: receiptNumber || null,
        notes: notes || null
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);
        
        if (error) throw error;
        alert('Expense updated successfully!');
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);
        
        if (error) throw error;
        alert('Expense added successfully!');
      }

      resetForm();
      await fetchExpenses();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error saving expense');
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setCategory(expense.category);
    setDescription(expense.description || '');
    setAmount(expense.amount.toString());
    setExpenseDate(expense.expense_date);
    setPaymentMethod(expense.payment_method || '');
    setReceiptNumber(expense.receipt_number || '');
    setNotes(expense.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Expense deleted successfully!');
      await fetchExpenses();
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Error deleting expense');
    }
  };

  const resetForm = () => {
    setCategory('electricity');
    setDescription('');
    setAmount('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('');
    setReceiptNumber('');
    setNotes('');
    setEditingExpense(null);
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categories: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + expense.amount;
    });
    return categories;
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

  const categoryColors: { [key: string]: string } = {
    electricity: 'bg-yellow-100 text-yellow-800',
    water: 'bg-blue-100 text-blue-800',
    rent: 'bg-purple-100 text-purple-800',
    supplies: 'bg-green-100 text-green-800',
    other: 'bg-gray-100 text-gray-800'
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Expenses Tracking</h1>
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
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <p className="text-2xl font-bold text-black">PHP {getTotalExpenses().toFixed(2)}</p>
          </div>
          {Object.entries(getExpensesByCategory()).map(([cat, amount]) => (
            <div key={cat} className="bg-white rounded-lg shadow p-4">
              <p className="text-sm text-gray-600 capitalize">{cat.replace('_', ' ')}</p>
              <p className="text-2xl font-bold text-black">PHP {amount.toFixed(2)}</p>
            </div>
          ))}
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-black mb-4">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="electricity">Electricity</option>
                    <option value="water">Water</option>
                    <option value="rent">Rent</option>
                    <option value="supplies">Supplies</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Amount (PHP) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Expense Date *</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select payment method</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Receipt Number</label>
                  <input
                    type="text"
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm(); }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingExpense ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-black mb-4">Expenses List</h3>
            
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-900">No expenses recorded yet. Add your first expense to get started.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="sm:hidden space-y-4">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-black capitalize">{expense.category.replace('_', ' ')}</h4>
                          <p className="text-xs text-gray-600">{new Date(expense.expense_date).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${categoryColors[expense.category]}`}>
                          PHP {expense.amount.toFixed(2)}
                        </span>
                      </div>
                      {expense.description && (
                        <p className="text-sm text-gray-900 mb-2">{expense.description}</p>
                      )}
                      <div className="space-y-1 text-xs text-gray-600">
                        {expense.payment_method && (
                          <div className="flex justify-between">
                            <span>Payment:</span>
                            <span className="text-black capitalize">{expense.payment_method.replace('_', ' ')}</span>
                          </div>
                        )}
                        {expense.receipt_number && (
                          <div className="flex justify-between">
                            <span>Receipt:</span>
                            <span className="text-black">{expense.receipt_number}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Payment Method</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Receipt #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{new Date(expense.expense_date).toLocaleDateString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${categoryColors[expense.category]}`}>
                              {expense.category.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-black">{expense.description || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">PHP {expense.amount.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black capitalize">{expense.payment_method || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{expense.receipt_number || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
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
      </div>
    </main>
  );
}
