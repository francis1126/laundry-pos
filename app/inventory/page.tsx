"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Inventory } from '@/types';

export default function InventoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Inventory | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'fab_con' | 'detergent' | 'bleach' | 'other'>('fab_con');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<'liters' | 'kg' | 'pieces' | 'boxes'>('liters');
  const [unitPrice, setUnitPrice] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [supplier, setSupplier] = useState('');

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
          await fetchInventory();
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

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name,
        category,
        quantity: parseInt(quantity),
        unit,
        unit_price: parseFloat(unitPrice),
        min_stock_level: parseInt(minStockLevel),
        supplier: supplier || null,
        last_restocked: new Date().toISOString()
      };

      if (editingItem) {
        const { error } = await supabase
          .from('inventory')
          .update(itemData)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        alert('Inventory item updated successfully!');
      } else {
        const { error } = await supabase
          .from('inventory')
          .insert([itemData]);
        
        if (error) throw error;
        alert('Inventory item added successfully!');
      }

      resetForm();
      await fetchInventory();
      setShowForm(false);
    } catch (err) {
      console.error('Error saving inventory item:', err);
      alert('Error saving inventory item');
    }
  };

  const handleEdit = (item: Inventory) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setQuantity(item.quantity.toString());
    setUnit(item.unit);
    setUnitPrice(item.unit_price.toString());
    setMinStockLevel(item.min_stock_level.toString());
    setSupplier(item.supplier || '');
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Inventory item deleted successfully!');
      await fetchInventory();
    } catch (err) {
      console.error('Error deleting inventory item:', err);
      alert('Error deleting inventory item');
    }
  };

  const handleRestock = async (item: Inventory) => {
    const newQuantity = prompt(`Enter new quantity for ${item.name}:`, item.quantity.toString());
    if (newQuantity === null) return;
    
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ 
          quantity: parseInt(newQuantity),
          last_restocked: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (error) throw error;
      alert('Inventory restocked successfully!');
      await fetchInventory();
    } catch (err) {
      console.error('Error restocking inventory:', err);
      alert('Error restocking inventory');
    }
  };

  const resetForm = () => {
    setName('');
    setCategory('fab_con');
    setQuantity('');
    setUnit('liters');
    setUnitPrice('');
    setMinStockLevel('10');
    setSupplier('');
    setEditingItem(null);
  };

  const getLowStockItems = () => {
    return inventory.filter(item => item.quantity <= item.min_stock_level);
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Inventory Management</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-3 py-2 sm:px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Low Stock Alert */}
        {getLowStockItems().length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
                <p className="text-sm text-red-700">{getLowStockItems().length} items need restocking</p>
              </div>
            </div>
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-black mb-4">
                {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Item Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="fab_con">Fab Con</option>
                    <option value="detergent">Detergent</option>
                    <option value="bleach">Bleach</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Quantity *</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Unit *</label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value as any)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="liters">Liters</option>
                      <option value="kg">Kg</option>
                      <option value="pieces">Pieces</option>
                      <option value="boxes">Boxes</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Unit Price (PHP) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">Min Stock Level *</label>
                    <input
                      type="number"
                      value={minStockLevel}
                      onChange={(e) => setMinStockLevel(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Supplier</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
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
                    {editingItem ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inventory List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-black mb-4">Inventory Items</h3>
            
            {inventory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-gray-900">No inventory items yet. Add your first item to get started.</p>
              </div>
            ) : (
              <>
                {/* Mobile Card Layout */}
                <div className="sm:hidden space-y-4">
                  {inventory.map((item) => (
                    <div key={item.id} className={`border rounded-lg p-4 ${item.quantity <= item.min_stock_level ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-black">{item.name}</h4>
                          <p className="text-xs text-gray-600 capitalize">{item.category.replace('_', ' ')}</p>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.quantity <= item.min_stock_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity} {item.unit}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Price:</span>
                          <span className="text-black font-medium">PHP {item.unit_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Min Stock:</span>
                          <span className="text-black">{item.min_stock_level} {item.unit}</span>
                        </div>
                        {item.supplier && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Supplier:</span>
                            <span className="text-black">{item.supplier}</span>
                          </div>
                        )}
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                        <button
                          onClick={() => handleRestock(item)}
                          className="px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 rounded hover:bg-green-100"
                        >
                          Restock
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Unit Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Min Stock</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Supplier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {inventory.map((item) => (
                        <tr key={item.id} className={item.quantity <= item.min_stock_level ? 'bg-red-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">{item.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black capitalize">{item.category.replace('_', ' ')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.quantity <= item.min_stock_level ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {item.quantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.unit}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">PHP {item.unit_price.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.min_stock_level}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">{item.supplier || '-'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleRestock(item)}
                              className="text-green-600 hover:text-green-900 mr-3"
                            >
                              Restock
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-blue-600 hover:text-blue-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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
