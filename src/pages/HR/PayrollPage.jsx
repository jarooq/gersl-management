import React, { useState, useEffect } from 'react';
import { PayrollAPI, HRAPI } from '../../services/api';
import { DollarSign, Plus, Edit, Trash2, Eye, CheckCircle, Clock, Calendar, Search, Filter, Download, X, Wallet, TrendingUp } from 'lucide-react';

const PayrollPage = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formData, setFormData] = useState({
    staffId: '',
    payPeriodStart: '',
    payPeriodEnd: '',
    payDate: '',
    basicSalary: 0,
    allowances: 0,
    overtimeAmount: 0,
    bonuses: 0,
    deductions: 0,
    taxDeduction: 0,
    epfDeduction: 0,
    etfDeduction: 0,
    status: 'Pending',
    paymentMethod: 'Bank Transfer',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [payrollData, staffData] = await Promise.all([
        PayrollAPI.getAll(),
        HRAPI.getAll()
      ]);
      setPayrolls(payrollData.payrolls || []);
      setStaff(staffData.staff || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-load salary and calculate deductions when staff is selected
  const handleStaffChange = (e) => {
    const staffId = e.target.value;
    const selectedStaff = staff.find(s => s.id === parseInt(staffId));

    if (selectedStaff && selectedStaff.salary) {
      const basicSalary = parseFloat(selectedStaff.salary);

      // Sri Lankan EPF/ETF Calculation
      // Employee EPF contribution: 8% of basic salary
      const epfDeduction = (basicSalary * 0.08).toFixed(2);

      // ETF contribution: 3% of basic salary (employer pays, but tracked here)
      const etfDeduction = (basicSalary * 0.03).toFixed(2);

      // Simple tax calculation (Sri Lankan PAYE - simplified)
      let taxDeduction = 0;
      if (basicSalary > 500000) {
        taxDeduction = ((basicSalary - 500000) * 0.24).toFixed(2);
      } else if (basicSalary > 416667) {
        taxDeduction = ((basicSalary - 416667) * 0.18 + 16667 * 0.12).toFixed(2);
      } else if (basicSalary > 333333) {
        taxDeduction = ((basicSalary - 333333) * 0.12).toFixed(2);
      } else if (basicSalary > 250000) {
        taxDeduction = ((basicSalary - 250000) * 0.06).toFixed(2);
      }

      setFormData(prev => ({
        ...prev,
        staffId: staffId,
        basicSalary: basicSalary,
        epfDeduction: epfDeduction,
        etfDeduction: etfDeduction,
        taxDeduction: taxDeduction
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        staffId: staffId
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If basic salary changes, recalculate deductions
    if (name === 'basicSalary') {
      const basicSalary = parseFloat(value) || 0;

      // Recalculate EPF (8% employee contribution)
      const epfDeduction = (basicSalary * 0.08).toFixed(2);

      // Recalculate ETF (3% employer contribution)
      const etfDeduction = (basicSalary * 0.03).toFixed(2);

      // Recalculate tax
      let taxDeduction = 0;
      if (basicSalary > 500000) {
        taxDeduction = ((basicSalary - 500000) * 0.24).toFixed(2);
      } else if (basicSalary > 416667) {
        taxDeduction = ((basicSalary - 416667) * 0.18 + 16667 * 0.12).toFixed(2);
      } else if (basicSalary > 333333) {
        taxDeduction = ((basicSalary - 333333) * 0.12).toFixed(2);
      } else if (basicSalary > 250000) {
        taxDeduction = ((basicSalary - 250000) * 0.06).toFixed(2);
      }

      setFormData(prev => ({
        ...prev,
        [name]: value,
        epfDeduction: epfDeduction,
        etfDeduction: etfDeduction,
        taxDeduction: taxDeduction
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const calculateGrossPay = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const allowances = parseFloat(formData.allowances) || 0;
    const overtime = parseFloat(formData.overtimeAmount) || 0;
    const bonuses = parseFloat(formData.bonuses) || 0;
    return basic + allowances + overtime + bonuses;
  };

  const calculateNetPay = () => {
    const gross = calculateGrossPay();
    const deductions = parseFloat(formData.deductions) || 0;
    const tax = parseFloat(formData.taxDeduction) || 0;
    const epf = parseFloat(formData.epfDeduction) || 0;
    const etf = parseFloat(formData.etfDeduction) || 0;
    return gross - deductions - tax - epf - etf;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payrollData = {
        ...formData,
        grossPay: calculateGrossPay(),
        netPay: calculateNetPay()
      };

      if (showEditModal && selectedPayroll) {
        await PayrollAPI.update(selectedPayroll.id, payrollData);
      } else {
        await PayrollAPI.create(payrollData);
      }

      await fetchData();
      resetForm();
    } catch (error) {
      console.error('Error saving payroll:', error);
      alert('Error saving payroll: ' + (error.message || 'Unknown error'));
    }
  };

  const handleProcess = async (id) => {
    if (!window.confirm('Are you sure you want to process this payroll? This action cannot be undone.')) return;

    try {
      await PayrollAPI.process(id);
      await fetchData();
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Error processing payroll: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payroll record?')) return;

    try {
      await PayrollAPI.delete(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting payroll:', error);
      alert('Error deleting payroll: ' + (error.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      payPeriodStart: '',
      payPeriodEnd: '',
      payDate: '',
      basicSalary: 0,
      allowances: 0,
      overtimeAmount: 0,
      bonuses: 0,
      deductions: 0,
      taxDeduction: 0,
      epfDeduction: 0,
      etfDeduction: 0,
      status: 'Pending',
      paymentMethod: 'Bank Transfer',
      notes: ''
    });
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedPayroll(null);
  };

  const openEditModal = (payroll) => {
    setSelectedPayroll(payroll);
    setFormData({
      staffId: payroll.staffId,
      payPeriodStart: payroll.payPeriodStart?.split('T')[0] || '',
      payPeriodEnd: payroll.payPeriodEnd?.split('T')[0] || '',
      payDate: payroll.payDate?.split('T')[0] || '',
      basicSalary: payroll.basicSalary || 0,
      allowances: payroll.allowances || 0,
      overtimeAmount: payroll.overtimeAmount || 0,
      bonuses: payroll.bonuses || 0,
      deductions: payroll.deductions || 0,
      taxDeduction: payroll.taxDeduction || 0,
      epfDeduction: payroll.epfDeduction || 0,
      etfDeduction: payroll.etfDeduction || 0,
      status: payroll.status || 'Pending',
      paymentMethod: payroll.paymentMethod || 'Bank Transfer',
      notes: payroll.notes || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (payroll) => {
    setSelectedPayroll(payroll);
    setShowViewModal(true);
  };

  const filteredPayrolls = payrolls.filter(payroll => {
    const matchesSearch = searchTerm === '' ||
      payroll.payrollCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payroll.staff?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || payroll.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: payrolls.length,
    pending: payrolls.filter(p => p.status === 'Pending').length,
    processed: payrolls.filter(p => p.status === 'Processed').length,
    totalAmount: payrolls.reduce((sum, p) => sum + (parseFloat(p.netPay) || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" style={{ animationDelay: '1s' }}></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-1">Payroll Management</h1>
                <p className="text-green-100 text-sm">Managing {stats.total} payroll records with excellence</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary bg-white text-green-600 hover:bg-green-50 shadow-lg flex items-center gap-2 text-sm px-4 py-2"
              >
                <Plus size={18} />
                Add Payroll
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card group cursor-pointer" style={{ animationDelay: '0s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Total Records</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">All payroll entries</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <DollarSign className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                <span className="text-xs font-semibold text-blue-600">Active</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Pending</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-orange-600">{stats.pending}</h3>
                <TrendingUp className="w-3 h-3 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting processing</p>
            </div>
            <div className="bg-mission-100 border border-mission-200 text-mission-700 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Clock className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                <span className="text-xs font-semibold text-orange-600">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Processed</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-green-600">{stats.processed}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Successfully paid</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-2.5 rounded-md">
              <CheckCircle className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-green-600">Complete</span>
              </div>
            </div>
          </div>
        </div>

        <div className="stat-card group cursor-pointer" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-600 mb-1">Total Amount</p>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-2xl font-bold text-gray-900">LKR {stats.totalAmount.toLocaleString()}</h3>
                <TrendingUp className="w-3 h-3 text-green-600" />
              </div>
              <p className="text-xs text-gray-500 mt-1">Net payroll total</p>
            </div>
            <div className="bg-violet-50 border border-violet-200 text-violet-700 p-2.5 rounded-lg shadow-sm transform group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <Wallet className="text-white" size={18} />
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Status</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                <span className="text-xs font-semibold text-purple-600">Tracked</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by code or staff name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processed">Processed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payroll Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Pay</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPayrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No payroll records found
                  </td>
                </tr>
              ) : (
                filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payroll.payrollCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.staff?.fullName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payroll.payPeriodStart ? new Date(payroll.payPeriodStart).toLocaleDateString() : ''} - {payroll.payPeriodEnd ? new Date(payroll.payPeriodEnd).toLocaleDateString() : ''}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      LKR {(payroll.grossPay || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                      LKR {(payroll.netPay || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        payroll.status === 'Processed' ? 'bg-green-100 text-green-800' :
                        payroll.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openViewModal(payroll)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye size={18} />
                      </button>
                      {payroll.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => openEditModal(payroll)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleProcess(payroll.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Process"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(payroll.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {showEditModal ? 'Edit Payroll' : 'Add New Payroll'}
                </h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staff Member * <span className="text-xs text-green-600">(Auto-loads salary & calculates deductions)</span>
                    </label>
                    <select
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleStaffChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Staff</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName} - {s.employeeId} {s.salary ? `(LKR ${parseFloat(s.salary).toLocaleString()})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Period Start *
                    </label>
                    <input
                      type="date"
                      name="payPeriodStart"
                      value={formData.payPeriodStart}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Period End *
                    </label>
                    <input
                      type="date"
                      name="payPeriodEnd"
                      value={formData.payPeriodEnd}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pay Date
                    </label>
                    <input
                      type="date"
                      name="payDate"
                      value={formData.payDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Basic Salary (LKR) * <span className="text-xs text-blue-600">(Auto-calculates deductions)</span>
                    </label>
                    <input
                      type="number"
                      name="basicSalary"
                      value={formData.basicSalary}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowances (LKR)
                    </label>
                    <input
                      type="number"
                      name="allowances"
                      value={formData.allowances}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overtime (LKR)
                    </label>
                    <input
                      type="number"
                      name="overtimeAmount"
                      value={formData.overtimeAmount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bonuses (LKR)
                    </label>
                    <input
                      type="number"
                      name="bonuses"
                      value={formData.bonuses}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deductions (LKR)
                    </label>
                    <input
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tax Deduction (LKR)
                    </label>
                    <input
                      type="number"
                      name="taxDeduction"
                      value={formData.taxDeduction}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      EPF Deduction (LKR)
                    </label>
                    <input
                      type="number"
                      name="epfDeduction"
                      value={formData.epfDeduction}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ETF Deduction (LKR)
                    </label>
                    <input
                      type="number"
                      name="etfDeduction"
                      value={formData.etfDeduction}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Payment Method
                    </label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* Calculated Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Gross Pay</p>
                      <p className="text-lg font-bold text-gray-900">LKR {calculateGrossPay().toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Net Pay</p>
                      <p className="text-lg font-bold text-green-600">LKR {calculateNetPay().toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    {showEditModal ? 'Update Payroll' : 'Create Payroll'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Payroll Details</h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Payroll Code</p>
                    <p className="font-semibold">{selectedPayroll.payrollCode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Staff Name</p>
                    <p className="font-semibold">{selectedPayroll.staff?.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pay Period</p>
                    <p className="font-semibold">
                      {selectedPayroll.payPeriodStart ? new Date(selectedPayroll.payPeriodStart).toLocaleDateString() : ''} - {selectedPayroll.payPeriodEnd ? new Date(selectedPayroll.payPeriodEnd).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Pay Date</p>
                    <p className="font-semibold">
                      {selectedPayroll.payDate ? new Date(selectedPayroll.payDate).toLocaleDateString() : 'Not Set'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Basic Salary</p>
                    <p className="font-semibold">LKR {(selectedPayroll.basicSalary || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Allowances</p>
                    <p className="font-semibold">LKR {(selectedPayroll.allowances || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Overtime</p>
                    <p className="font-semibold">LKR {(selectedPayroll.overtimeAmount || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bonuses</p>
                    <p className="font-semibold">LKR {(selectedPayroll.bonuses || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Deductions</p>
                    <p className="font-semibold text-red-600">LKR {(selectedPayroll.deductions || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tax</p>
                    <p className="font-semibold text-red-600">LKR {(selectedPayroll.taxDeduction || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">EPF</p>
                    <p className="font-semibold text-red-600">LKR {(selectedPayroll.epfDeduction || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ETF</p>
                    <p className="font-semibold text-red-600">LKR {(selectedPayroll.etfDeduction || 0).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Gross Pay</p>
                        <p className="text-xl font-bold text-gray-900">LKR {(selectedPayroll.grossPay || 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Pay</p>
                        <p className="text-xl font-bold text-green-600">LKR {(selectedPayroll.netPay || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      selectedPayroll.status === 'Processed' ? 'bg-green-100 text-green-800' :
                      selectedPayroll.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedPayroll.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold">{selectedPayroll.paymentMethod}</p>
                  </div>
                  {selectedPayroll.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-600">Notes</p>
                      <p className="font-semibold">{selectedPayroll.notes}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
