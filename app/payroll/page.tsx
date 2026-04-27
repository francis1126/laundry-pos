"use client"
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Employee, Payroll } from '@/types';

export default function PayrollPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  
  // Employee form state
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [empName, setEmpName] = useState('');
  const [empPosition, setEmpPosition] = useState<'washer' | 'ironer' | 'driver' | 'manager'>('washer');
  const [empContact, setEmpContact] = useState('');
  const [empAddress, setEmpAddress] = useState('');
  const [empHireDate, setEmpHireDate] = useState(new Date().toISOString().split('T')[0]);
  const [empDailyRate, setEmpDailyRate] = useState('');
  
  // Payroll form state
  const [showPayrollForm, setShowPayrollForm] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [payPeriodStart, setPayPeriodStart] = useState(new Date().toISOString().split('T')[0]);
  const [payPeriodEnd, setPayPeriodEnd] = useState(new Date().toISOString().split('T')[0]);
  const [daysWorked, setDaysWorked] = useState('');
  const [deductions, setDeductions] = useState('0');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payrollNotes, setPayrollNotes] = useState('');

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
          await fetchEmployees();
          await fetchPayroll();
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

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchPayroll = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll')
        .select(`
          *,
          employee:employees(*)
        `)
        .order('pay_date', { ascending: false });
      
      if (error) throw error;
      setPayroll(data || []);
    } catch (err) {
      console.error('Error fetching payroll:', err);
    }
  };

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employeeData = {
        name: empName,
        position: empPosition,
        contact_number: empContact || null,
        address: empAddress || null,
        hire_date: empHireDate,
        daily_rate: parseFloat(empDailyRate),
        is_active: true
      };

      if (editingEmployee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', editingEmployee.id);
        
        if (error) throw error;
        alert('Employee updated successfully!');
      } else {
        const { error } = await supabase
          .from('employees')
          .insert([employeeData]);
        
        if (error) throw error;
        alert('Employee added successfully!');
      }

      resetEmployeeForm();
      await fetchEmployees();
      setShowEmployeeForm(false);
    } catch (err) {
      console.error('Error saving employee:', err);
      alert('Error saving employee');
    }
  };

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        alert('Please select an employee');
        return;
      }

      const grossPay = parseFloat(daysWorked) * employee.daily_rate;
      const netPay = grossPay - parseFloat(deductions);

      const payrollData = {
        employee_id: selectedEmployee,
        pay_period_start: payPeriodStart,
        pay_period_end: payPeriodEnd,
        days_worked: parseInt(daysWorked),
        gross_pay: grossPay,
        deductions: parseFloat(deductions),
        net_pay: netPay,
        pay_date: payDate,
        notes: payrollNotes || null
      };

      if (editingPayroll) {
        const { error } = await supabase
          .from('payroll')
          .update(payrollData)
          .eq('id', editingPayroll.id);
        
        if (error) throw error;
        alert('Payroll updated successfully!');
      } else {
        const { error } = await supabase
          .from('payroll')
          .insert([payrollData]);
        
        if (error) throw error;
        alert('Payroll added successfully!');
      }

      resetPayrollForm();
      await fetchPayroll();
      setShowPayrollForm(false);
    } catch (err) {
      console.error('Error saving payroll:', err);
      alert('Error saving payroll');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setEmpName(employee.name);
    setEmpPosition(employee.position);
    setEmpContact(employee.contact_number || '');
    setEmpAddress(employee.address || '');
    setEmpHireDate(employee.hire_date);
    setEmpDailyRate(employee.daily_rate.toString());
    setShowEmployeeForm(true);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Employee deleted successfully!');
      await fetchEmployees();
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Error deleting employee');
    }
  };

  const handleEditPayroll = (pay: Payroll) => {
    setEditingPayroll(pay);
    setSelectedEmployee(pay.employee_id);
    setPayPeriodStart(pay.pay_period_start);
    setPayPeriodEnd(pay.pay_period_end);
    setDaysWorked(pay.days_worked.toString());
    setDeductions(pay.deductions.toString());
    setPayDate(pay.pay_date);
    setPayrollNotes(pay.notes || '');
    setShowPayrollForm(true);
  };

  const handleDeletePayroll = async (id: string) => {
    if (!confirm('Are you sure you want to delete this payroll record?')) return;
    
    try {
      const { error } = await supabase
        .from('payroll')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Payroll deleted successfully!');
      await fetchPayroll();
    } catch (err) {
      console.error('Error deleting payroll:', err);
      alert('Error deleting payroll');
    }
  };

  const resetEmployeeForm = () => {
    setEmpName('');
    setEmpPosition('washer');
    setEmpContact('');
    setEmpAddress('');
    setEmpHireDate(new Date().toISOString().split('T')[0]);
    setEmpDailyRate('');
    setEditingEmployee(null);
  };

  const resetPayrollForm = () => {
    setSelectedEmployee('');
    setPayPeriodStart(new Date().toISOString().split('T')[0]);
    setPayPeriodEnd(new Date().toISOString().split('T')[0]);
    setDaysWorked('');
    setDeductions('0');
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayrollNotes('');
    setEditingPayroll(null);
  };

  const getTotalPayroll = () => {
    return payroll.reduce((total, pay) => total + pay.net_pay, 0);
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
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Payroll Management</h1>
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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-8">
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm ${
                activeTab === 'employees'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Employees ({employees.length})
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`py-3 px-2 sm:py-2 sm:px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payroll'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Payroll Records ({payroll.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'employees' ? (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <p className="text-sm text-gray-600">Total Active Employees</p>
              <p className="text-2xl font-bold text-black">{employees.filter(e => e.is_active).length}</p>
            </div>

            {/* Employee Form Modal */}
            {showEmployeeForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-black mb-4">
                    {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                  </h3>
                  <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Name *</label>
                      <input
                        type="text"
                        value={empName}
                        onChange={(e) => setEmpName(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Position *</label>
                      <select
                        value={empPosition}
                        onChange={(e) => setEmpPosition(e.target.value as any)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        <option value="washer">Washer</option>
                        <option value="ironer">Ironer</option>
                        <option value="driver">Driver</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Contact Number</label>
                      <input
                        type="text"
                        value={empContact}
                        onChange={(e) => setEmpContact(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Address</label>
                      <textarea
                        value={empAddress}
                        onChange={(e) => setEmpAddress(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Hire Date *</label>
                      <input
                        type="date"
                        value={empHireDate}
                        onChange={(e) => setEmpHireDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Daily Rate (PHP) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={empDailyRate}
                        onChange={(e) => setEmpDailyRate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowEmployeeForm(false); resetEmployeeForm(); }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editingEmployee ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Employees List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-black">Employees</h3>
                  <button
                    onClick={() => { resetEmployeeForm(); setShowEmployeeForm(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Employee
                  </button>
                </div>
                
                {employees.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-900">No employees yet. Add your first employee to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {employees.map((employee) => (
                      <div key={employee.id} className={`border rounded-lg p-4 ${!employee.is_active ? 'opacity-50' : 'border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-black">{employee.name}</h4>
                            <p className="text-xs text-gray-600 capitalize">{employee.position}</p>
                            <p className="text-xs text-gray-600">Daily Rate: PHP {employee.daily_rate.toFixed(2)}</p>
                            {employee.contact_number && (
                              <p className="text-xs text-gray-600">Contact: {employee.contact_number}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditEmployee(employee)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <p className="text-sm text-gray-600">Total Payroll Paid</p>
              <p className="text-2xl font-bold text-black">PHP {getTotalPayroll().toFixed(2)}</p>
            </div>

            {/* Payroll Form Modal */}
            {showPayrollForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-medium text-black mb-4">
                    {editingPayroll ? 'Edit Payroll' : 'Add Payroll'}
                  </h3>
                  <form onSubmit={handlePayrollSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Employee *</label>
                      <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select employee</option>
                        {employees.filter(e => e.is_active).map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} - {emp.position}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Period Start *</label>
                        <input
                          type="date"
                          value={payPeriodStart}
                          onChange={(e) => setPayPeriodStart(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-black mb-1">Period End *</label>
                        <input
                          type="date"
                          value={payPeriodEnd}
                          onChange={(e) => setPayPeriodEnd(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Days Worked *</label>
                      <input
                        type="number"
                        value={daysWorked}
                        onChange={(e) => setDaysWorked(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Deductions (PHP)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={deductions}
                        onChange={(e) => setDeductions(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Pay Date *</label>
                      <input
                        type="date"
                        value={payDate}
                        onChange={(e) => setPayDate(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">Notes</label>
                      <textarea
                        value={payrollNotes}
                        onChange={(e) => setPayrollNotes(e.target.value)}
                        rows={2}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-black focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => { setShowPayrollForm(false); resetPayrollForm(); }}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        {editingPayroll ? 'Update' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Payroll List */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-black">Payroll Records</h3>
                  <button
                    onClick={() => { resetPayrollForm(); setShowPayrollForm(true); }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    Add Payroll
                  </button>
                </div>
                
                {payroll.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-900">No payroll records yet. Add your first payroll record to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {payroll.map((pay) => (
                      <div key={pay.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="text-sm font-bold text-black">{pay.employee?.name}</h4>
                            <p className="text-xs text-gray-600 capitalize">{pay.employee?.position}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(pay.pay_period_start).toLocaleDateString()} - {new Date(pay.pay_period_end).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-sm font-bold text-black">PHP {pay.net_pay.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>Days Worked:</span>
                            <span className="text-black">{pay.days_worked}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Gross Pay:</span>
                            <span className="text-black">PHP {pay.gross_pay.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Deductions:</span>
                            <span className="text-black">PHP {pay.deductions.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pay Date:</span>
                            <span className="text-black">{new Date(pay.pay_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end space-x-2">
                          <button
                            onClick={() => handleEditPayroll(pay)}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayroll(pay.id)}
                            className="text-red-600 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
