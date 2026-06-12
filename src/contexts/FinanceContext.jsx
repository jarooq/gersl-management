import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from './AuthContext';

const FinanceContext = createContext(null);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();

  const [expenses, setExpenses] = useState([]);
  const [payrollData, setPayrollData] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [bills, setBills] = useState([]);
  const [chartOfAccounts, setChartOfAccounts] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [bankTransactions, setBankTransactions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data from API
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    const loadFinanceData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all finance data in parallel
        const [
          expensesData,
          payrollResponse,
          budgetsResponse,
          posResponse,
          invoicesResponse,
          billsResponse,
          accountsResponse,
          entriesResponse,
          transactionsResponse
        ] = await Promise.allSettled([
          API.Finance.getAll(),
          API.Payroll.getAll(),
          API.Budget.getAll(),
          API.PurchaseOrder.getAll(),
          API.Invoice.getAll(),
          API.Bill.getAll(),
          API.ChartOfAccounts.getAll(),
          API.JournalEntry.getAll(),
          API.BankTransaction.getAll()
        ]);

        // Set data if successful, otherwise keep empty arrays
        if (expensesData.status === 'fulfilled') setExpenses(expensesData.value.expenses || []);
        if (payrollResponse.status === 'fulfilled') setPayrollData(payrollResponse.value.payroll || []);
        if (budgetsResponse.status === 'fulfilled') setBudgets(budgetsResponse.value.budgets || []);
        if (posResponse.status === 'fulfilled') setPurchaseOrders(posResponse.value.purchaseOrders || []);
        if (invoicesResponse.status === 'fulfilled') setInvoices(invoicesResponse.value.invoices || []);
        if (billsResponse.status === 'fulfilled') setBills(billsResponse.value.bills || []);
        if (accountsResponse.status === 'fulfilled') setChartOfAccounts(accountsResponse.value.accounts || []);
        if (entriesResponse.status === 'fulfilled') setJournalEntries(entriesResponse.value.entries || []);
        if (transactionsResponse.status === 'fulfilled') setBankTransactions(transactionsResponse.value.transactions || []);

      } catch (err) {
        console.error('Error loading finance data:', err);
        setError(err.message || 'Failed to load finance data');
      } finally {
        setLoading(false);
      }
    };

    loadFinanceData();
    }, [isLoggedIn]);

  // Expense Management
  const addExpense = async (expenseData) => {
    try {
      const newExpense = await API.Finance.create(expenseData);
      setExpenses([...expenses, newExpense]);
      return newExpense;
    } catch (err) {
      console.error('Error adding expense:', err);
      throw err;
    }
  };

  const updateExpense = async (id, updates) => {
    try {
      const updatedExpense = await API.Finance.update(id, updates);
      setExpenses(expenses.map(e => e.id === id ? updatedExpense : e));
      return updatedExpense;
    } catch (err) {
      console.error('Error updating expense:', err);
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await API.Finance.delete(id);
        setExpenses(expenses.filter(e => e.id !== id));
      } catch (err) {
        console.error('Error deleting expense:', err);
        throw err;
      }
    }
  };

  // Payroll Management
  const updatePayroll = async (id, updates) => {
    try {
      const updatedPayroll = await API.Payroll.update(id, updates);
      setPayrollData(payrollData.map(p => p.id === id ? updatedPayroll : p));
      return updatedPayroll;
    } catch (err) {
      console.error('Error updating payroll:', err);
      throw err;
    }
  };

  const processPayroll = async (id) => {
    try {
      const processedPayroll = await API.Payroll.process(id);
      setPayrollData(payrollData.map(p => p.id === id ? processedPayroll : p));
      return processedPayroll;
    } catch (err) {
      console.error('Error processing payroll:', err);
      throw err;
    }
  };

  // Purchase Order Management
  const addPurchaseOrder = async (poData) => {
    try {
      const newPO = await API.PurchaseOrder.create(poData);
      setPurchaseOrders([...purchaseOrders, newPO]);
      return newPO;
    } catch (err) {
      console.error('Error adding purchase order:', err);
      throw err;
    }
  };

  const approvePurchaseOrder = async (id, approvalStatus, remarks = '') => {
    try {
      const approvedPO = await API.PurchaseOrder.approve(id, approvalStatus, remarks);
      setPurchaseOrders(purchaseOrders.map(po => po.id === id ? approvedPO : po));
      return approvedPO;
    } catch (err) {
      console.error('Error approving purchase order:', err);
      throw err;
    }
  };

  const deletePurchaseOrder = async (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      try {
        await API.PurchaseOrder.delete(id);
        setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
      } catch (err) {
        console.error('Error deleting purchase order:', err);
        throw err;
      }
    }
  };

  // Invoice Management
  const addInvoice = async (invoiceData) => {
    try {
      const newInvoice = await API.Invoice.create(invoiceData);
      setInvoices([...invoices, newInvoice]);
      return newInvoice;
    } catch (err) {
      console.error('Error adding invoice:', err);
      throw err;
    }
  };

  const updateInvoice = async (id, updates) => {
    try {
      const updatedInvoice = await API.Invoice.update(id, updates);
      setInvoices(invoices.map(inv => inv.id === id ? updatedInvoice : inv));
      return updatedInvoice;
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  };

  const deleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await API.Invoice.delete(id);
        setInvoices(invoices.filter(inv => inv.id !== id));
      } catch (err) {
        console.error('Error deleting invoice:', err);
        throw err;
      }
    }
  };

  // Record a receipt against an invoice. Persists the receipt-date exchange
  // rate and realised forex gain/loss server-side, then refreshes the invoice
  // in local state. Returns { invoice, receipt }.
  const recordInvoicePayment = async (id, paymentData) => {
    try {
      const result = await API.Invoice.recordPayment(id, paymentData);
      if (result?.invoice) {
        setInvoices(invoices.map(inv => (inv.id === id ? result.invoice : inv)));
      }
      return result;
    } catch (err) {
      console.error('Error recording invoice payment:', err);
      throw err;
    }
  };

  // Bill Management
  const addBill = async (billData) => {
    try {
      const newBill = await API.Bill.create(billData);
      setBills([...bills, newBill]);
      return newBill;
    } catch (err) {
      console.error('Error adding bill:', err);
      throw err;
    }
  };

  const updateBill = async (id, updates) => {
    try {
      const updatedBill = await API.Bill.update(id, updates);
      setBills(bills.map(bill => bill.id === id ? updatedBill : bill));
      return updatedBill;
    } catch (err) {
      console.error('Error updating bill:', err);
      throw err;
    }
  };

  const deleteBill = async (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      try {
        await API.Bill.delete(id);
        setBills(bills.filter(bill => bill.id !== id));
      } catch (err) {
        console.error('Error deleting bill:', err);
        throw err;
      }
    }
  };

  // Chart of Accounts Management
  const addAccount = async (accountData) => {
    try {
      const newAccount = await API.ChartOfAccounts.create(accountData);
      setChartOfAccounts([...chartOfAccounts, newAccount]);
      return newAccount;
    } catch (err) {
      console.error('Error adding account:', err);
      throw err;
    }
  };

  const updateAccount = async (id, updates) => {
    try {
      const updatedAccount = await API.ChartOfAccounts.update(id, updates);
      setChartOfAccounts(chartOfAccounts.map(acc => acc.id === id ? updatedAccount : acc));
      return updatedAccount;
    } catch (err) {
      console.error('Error updating account:', err);
      throw err;
    }
  };

  const deleteAccount = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await API.ChartOfAccounts.delete(id);
        setChartOfAccounts(chartOfAccounts.filter(acc => acc.id !== id));
      } catch (err) {
        console.error('Error deleting account:', err);
        throw err;
      }
    }
  };

  // Journal Entry Management
  const addJournalEntry = async (entryData) => {
    try {
      const newEntry = await API.JournalEntry.create(entryData);
      setJournalEntries([...journalEntries, newEntry]);
      return newEntry;
    } catch (err) {
      console.error('Error adding journal entry:', err);
      throw err;
    }
  };

  const updateJournalEntry = async (id, updates) => {
    try {
      const updatedEntry = await API.JournalEntry.update(id, updates);
      setJournalEntries(journalEntries.map(je => je.id === id ? updatedEntry : je));
      return updatedEntry;
    } catch (err) {
      console.error('Error updating journal entry:', err);
      throw err;
    }
  };

  const deleteJournalEntry = async (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await API.JournalEntry.delete(id);
        setJournalEntries(journalEntries.filter(je => je.id !== id));
      } catch (err) {
        console.error('Error deleting journal entry:', err);
        throw err;
      }
    }
  };

  // Bank Transaction Management
  const addBankTransaction = async (transactionData) => {
    try {
      const newTransaction = await API.BankTransaction.create(transactionData);
      setBankTransactions([...bankTransactions, newTransaction]);
      return newTransaction;
    } catch (err) {
      console.error('Error adding bank transaction:', err);
      throw err;
    }
  };

  const updateBankTransaction = async (id, updates) => {
    try {
      const updatedTransaction = await API.BankTransaction.update(id, updates);
      setBankTransactions(bankTransactions.map(bt => bt.id === id ? updatedTransaction : bt));
      return updatedTransaction;
    } catch (err) {
      console.error('Error updating bank transaction:', err);
      throw err;
    }
  };

  const deleteBankTransaction = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await API.BankTransaction.delete(id);
        setBankTransactions(bankTransactions.filter(bt => bt.id !== id));
      } catch (err) {
        console.error('Error deleting bank transaction:', err);
        throw err;
      }
    }
  };

  // Stats and Analytics
  const getStats = () => {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const paidExpenses = expenses.filter(e => e.status === 'Paid').reduce((sum, e) => sum + e.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0);

    const totalPayroll = payrollData.reduce((sum, p) => sum + p.netSalary, 0);
    const processedPayroll = payrollData.filter(p => p.status === 'Processed').reduce((sum, p) => sum + p.netSalary, 0);

    const totalBudget = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const totalRemaining = budgets.reduce((sum, b) => sum + b.remaining, 0);

    const pendingPOs = purchaseOrders.filter(po => po.status !== 'Approved').length;
    const totalPOValue = purchaseOrders.reduce((sum, po) => sum + po.amount, 0);

    return {
      totalExpenses,
      paidExpenses,
      pendingExpenses,
      totalPayroll,
      processedPayroll,
      pendingPayroll: totalPayroll - processedPayroll,
      totalBudget,
      totalSpent,
      totalRemaining,
      budgetUtilization: ((totalSpent / totalBudget) * 100).toFixed(1),
      pendingPOs,
      totalPOValue
    };
  };

  const getExpensesByCategory = () => {
    const categories = {};
    expenses.forEach(e => {
      if (!categories[e.category]) {
        categories[e.category] = 0;
      }
      categories[e.category] += e.amount;
    });
    return Object.entries(categories).map(([name, amount]) => ({ name, amount }));
  };

  const getExpensesByProject = () => {
    const projects = {};
    expenses.forEach(e => {
      if (!projects[e.project]) {
        projects[e.project] = 0;
      }
      projects[e.project] += e.amount;
    });
    return Object.entries(projects).map(([name, amount]) => ({ name, amount }));
  };

  // ========================================
  // MEAL Integration Methods - NEW
  // ========================================

  /**
   * Calculate cost per beneficiary for a specific project
   * @param {number} projectId - Project ID
   * @param {number} beneficiaryCount - Total beneficiaries reached
   * @returns {number} Cost per beneficiary
   */
  const getCostPerBeneficiary = (projectId, beneficiaryCount) => {
    if (!beneficiaryCount || beneficiaryCount === 0) return 0;

    const projectExpenses = expenses
      .filter(e => e.projectId === projectId || e.project === projectId)
      .reduce((sum, e) => sum + e.amount, 0);

    return (projectExpenses / beneficiaryCount).toFixed(2);
  };

  /**
   * Get all expenses linked to a specific indicator
   * @param {string} indicatorId - Indicator ID
   * @returns {Array} Expenses linked to this indicator
   */
  const getIndicatorLinkedExpenses = (indicatorId) => {
    return expenses.filter(e => e.indicatorId === indicatorId);
  };

  /**
   * Calculate total cost for MEAL activities (CFM, field monitoring, etc.)
   * @param {string} activityType - 'field-visit', 'cfm-operation', 'monitoring', 'evaluation'
   * @returns {number} Total cost
   */
  const getMEALActivityCosts = (activityType = null) => {
    const mealExpenses = expenses.filter(e => {
      if (activityType) {
        return e.mealActivityType === activityType;
      }
      return e.mealActivityType !== null && e.mealActivityType !== undefined;
    });

    return mealExpenses.reduce((sum, e) => sum + e.amount, 0);
  };

  /**
   * Get MEAL statistics for reporting
   * @returns {Object} MEAL-specific stats
   */
  const getMEALStats = () => {
    const totalMEALCosts = getMEALActivityCosts();
    const fieldVisitCosts = getMEALActivityCosts('field-visit');
    const cfmCosts = getMEALActivityCosts('cfm-operation');
    const monitoringCosts = getMEALActivityCosts('monitoring');
    const evaluationCosts = getMEALActivityCosts('evaluation');

    // Calculate percentage of budget spent on MEAL
    const totalProjectExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const mealPercentage = totalProjectExpenses > 0
      ? ((totalMEALCosts / totalProjectExpenses) * 100).toFixed(1)
      : 0;

    return {
      totalMEALCosts,
      fieldVisitCosts,
      cfmCosts,
      monitoringCosts,
      evaluationCosts,
      mealPercentage,
      mealExpenseCount: expenses.filter(e => e.mealActivityType).length
    };
  };

  /**
   * Get cost efficiency metrics by project
   * @param {Array} projects - Array of project objects with MEAL data
   * @returns {Array} Cost efficiency analysis
   */
  const getCostEfficiencyByProject = (projects) => {
    return projects.map(project => {
      const projectExpenses = expenses
        .filter(e => e.projectId === project.id || e.project === project.name)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalDirectBeneficiaries = project.beneficiaryBreakdown
        ? (project.beneficiaryBreakdown.directMale || 0) +
          (project.beneficiaryBreakdown.directFemale || 0) +
          (project.beneficiaryBreakdown.directChildren || 0)
        : project.beneficiaries || 0;

      const costPerBeneficiary = totalDirectBeneficiaries > 0
        ? (projectExpenses / totalDirectBeneficiaries).toFixed(2)
        : 0;

      const indicatorCount = project.resultsFramework?.length || 0;
      const costPerIndicator = indicatorCount > 0
        ? (projectExpenses / indicatorCount).toFixed(2)
        : 0;

      return {
        projectId: project.id,
        projectName: project.name,
        totalSpent: projectExpenses,
        beneficiaries: totalDirectBeneficiaries,
        costPerBeneficiary: parseFloat(costPerBeneficiary),
        indicators: indicatorCount,
        costPerIndicator: parseFloat(costPerIndicator),
        budget: project.budget || 0,
        budgetUtilization: project.budget > 0
          ? ((projectExpenses / project.budget) * 100).toFixed(1)
          : 0
      };
    });
  };

  /**
   * Get expenses breakdown by MEAL activity type
   * @returns {Object} Breakdown of MEAL costs
   */
  const getMEALExpensesBreakdown = () => {
    const breakdown = {
      'field-visit': 0,
      'cfm-operation': 0,
      'monitoring': 0,
      'evaluation': 0,
      'learning': 0,
      'other': 0
    };

    expenses.forEach(e => {
      if (e.mealActivityType && Object.prototype.hasOwnProperty.call(breakdown, e.mealActivityType)) {
        breakdown[e.mealActivityType] += e.amount;
      } else if (e.mealActivityType) {
        breakdown.other += e.amount;
      }
    });

    return Object.entries(breakdown)
      .filter(([, amount]) => amount > 0)
      .map(([type, amount]) => ({
        type: type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        amount
      }));
  };

  // ========================================
  // Project Category Tracking Methods
  // ========================================

  /**
   * Get expenses by project category (matching audit report categories)
   * @returns {Object} Expenses grouped by project category
   */
  const getExpensesByProjectCategory = () => {
    const categories = {};
    expenses.forEach(e => {
      const category = e.projectCategory || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = {
          total: 0,
          count: 0,
          expenses: []
        };
      }
      categories[category].total += e.amount;
      categories[category].count += 1;
      categories[category].expenses.push(e);
    });
    return categories;
  };

  /**
   * Get total expenses for a specific project category
   * @param {string} projectCategory - Category name
   * @returns {number} Total expenses
   */
  const getExpensesForCategory = (projectCategory) => {
    return expenses
      .filter(e => e.projectCategory === projectCategory)
      .reduce((sum, e) => sum + e.amount, 0);
  };

  /**
   * Get expenses summary by project category
   * @returns {Array} Array of category summaries
   */
  const getCategorySummary = () => {
    const categories = getExpensesByProjectCategory();
    return Object.entries(categories).map(([category, data]) => ({
      category,
      totalExpenses: data.total,
      count: data.count,
      avgExpense: data.count > 0 ? (data.total / data.count).toFixed(2) : 0
    })).sort((a, b) => b.totalExpenses - a.totalExpenses);
  };

  /**
   * Get expenses filtered by project category
   * @param {string} projectCategory - Category name
   * @returns {Array} Filtered expenses
   */
  const filterExpensesByCategory = (projectCategory) => {
    return expenses.filter(e => e.projectCategory === projectCategory);
  };

  /**
   * Get project category budget utilization
   * Compares expenses against grant receivables for each category
   * @returns {Array} Budget utilization by category
   */
  const getCategoryBudgetUtilization = (grantReceivables) => {
    if (!grantReceivables) return [];

    const expensesByCategory = getExpensesByProjectCategory();
    const grantsByCategory = {};

    // Group grants by project category
    grantReceivables.forEach(grant => {
      const category = grant.projectCategory || 'Uncategorized';
      if (!grantsByCategory[category]) {
        grantsByCategory[category] = {
          pledged: 0,
          received: 0
        };
      }
      grantsByCategory[category].pledged += grant.pledgeAmount;
      grantsByCategory[category].received += grant.receivedAmount;
    });

    // Combine expenses and grants
    const allCategories = new Set([
      ...Object.keys(expensesByCategory),
      ...Object.keys(grantsByCategory)
    ]);

    return Array.from(allCategories).map(category => {
      const expenses = expensesByCategory[category]?.total || 0;
      const pledged = grantsByCategory[category]?.pledged || 0;
      const received = grantsByCategory[category]?.received || 0;

      return {
        category,
        expenses,
        pledged,
        received,
        balance: received - expenses,
        utilization: received > 0 ? ((expenses / received) * 100).toFixed(1) : 0,
        pledgedUtilization: pledged > 0 ? ((expenses / pledged) * 100).toFixed(1) : 0
      };
    }).sort((a, b) => b.expenses - a.expenses);
  };

  const value = {
    // Data
    expenses,
    payrollData,
    budgets,
    purchaseOrders,
    invoices,
    bills,
    chartOfAccounts,
    journalEntries,
    bankTransactions,
    // State
    loading,
    error,
    // Expense Management
    addExpense,
    updateExpense,
    deleteExpense,
    // Payroll Management
    updatePayroll,
    processPayroll,
    // Purchase Order Management
    addPurchaseOrder,
    approvePurchaseOrder,
    deletePurchaseOrder,
    // Invoice Management
    addInvoice,
    updateInvoice,
    deleteInvoice,
    recordInvoicePayment,
    // Bill Management
    addBill,
    updateBill,
    deleteBill,
    // Chart of Accounts Management
    addAccount,
    updateAccount,
    deleteAccount,
    // Journal Entry Management
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    // Bank Transaction Management
    addBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    // Stats and Analytics
    getStats,
    getExpensesByCategory,
    getExpensesByProject,
    // MEAL Integration Methods
    getCostPerBeneficiary,
    getIndicatorLinkedExpenses,
    getMEALActivityCosts,
    getMEALStats,
    getCostEfficiencyByProject,
    getMEALExpensesBreakdown,
    // Project Category Tracking Methods
    getExpensesByProjectCategory,
    getExpensesForCategory,
    getCategorySummary,
    filterExpensesByCategory,
    getCategoryBudgetUtilization
  };

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
};
