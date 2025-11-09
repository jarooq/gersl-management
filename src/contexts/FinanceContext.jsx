import React, { createContext, useContext, useState, useEffect } from 'react';

const FinanceContext = createContext(null);

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};

export const FinanceProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);

  const [payrollData, setPayrollData] = useState([]);

  const [budgets, setBudgets] = useState([]);

  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const [invoices, setInvoices] = useState([]);

  const [bills, setBills] = useState([]);

  const [chartOfAccounts, setChartOfAccounts] = useState([]);

  const [journalEntries, setJournalEntries] = useState([]);

  const [bankTransactions, setBankTransactions] = useState([]);

  // Load from localStorage
  useEffect(() => {
    const storedExpenses = localStorage.getItem('gersl_expenses');
    const storedPayroll = localStorage.getItem('gersl_payroll');
    const storedBudgets = localStorage.getItem('gersl_budgets');
    const storedPOs = localStorage.getItem('gersl_purchase_orders');
    const storedInvoices = localStorage.getItem('gersl_invoices');
    const storedBills = localStorage.getItem('gersl_bills');
    const storedChartOfAccounts = localStorage.getItem('gersl_chart_of_accounts');
    const storedJournalEntries = localStorage.getItem('gersl_journal_entries');
    const storedBankTransactions = localStorage.getItem('gersl_bank_transactions');

    if (storedExpenses) {
      try { setExpenses(JSON.parse(storedExpenses)); } catch (e) {}
    }
    if (storedPayroll) {
      try { setPayrollData(JSON.parse(storedPayroll)); } catch (e) {}
    }
    if (storedBudgets) {
      try { setBudgets(JSON.parse(storedBudgets)); } catch (e) {}
    }
    if (storedPOs) {
      try { setPurchaseOrders(JSON.parse(storedPOs)); } catch (e) {}
    }
    if (storedInvoices) {
      try { setInvoices(JSON.parse(storedInvoices)); } catch (e) {}
    }
    if (storedBills) {
      try { setBills(JSON.parse(storedBills)); } catch (e) {}
    }
    if (storedChartOfAccounts) {
      try { setChartOfAccounts(JSON.parse(storedChartOfAccounts)); } catch (e) {}
    }
    if (storedJournalEntries) {
      try { setJournalEntries(JSON.parse(storedJournalEntries)); } catch (e) {}
    }
    if (storedBankTransactions) {
      try { setBankTransactions(JSON.parse(storedBankTransactions)); } catch (e) {}
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('gersl_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('gersl_payroll', JSON.stringify(payrollData));
  }, [payrollData]);

  useEffect(() => {
    localStorage.setItem('gersl_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('gersl_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('gersl_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('gersl_bills', JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem('gersl_chart_of_accounts', JSON.stringify(chartOfAccounts));
  }, [chartOfAccounts]);

  useEffect(() => {
    localStorage.setItem('gersl_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('gersl_bank_transactions', JSON.stringify(bankTransactions));
  }, [bankTransactions]);

  // Expense Management
  const addExpense = (expenseData) => {
    const newExpense = {
      ...expenseData,
      id: Math.max(...expenses.map(e => e.id), 0) + 1,
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses([...expenses, newExpense]);
    return newExpense;
  };

  const updateExpense = (id, updates) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const deleteExpense = (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      setExpenses(expenses.filter(e => e.id !== id));
    }
  };

  // Payroll Management
  const updatePayroll = (id, updates) => {
    setPayrollData(payrollData.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const processPayroll = (id) => {
    updatePayroll(id, { status: 'Processed' });
  };

  // Purchase Order Management
  const addPurchaseOrder = (poData) => {
    const newPO = {
      ...poData,
      id: Math.max(...purchaseOrders.map(po => po.id), 0) + 1,
      poNumber: `PO-2025-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      requestDate: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setPurchaseOrders([...purchaseOrders, newPO]);
    return newPO;
  };

  const approvePurchaseOrder = (id, approver) => {
    setPurchaseOrders(purchaseOrders.map(po =>
      po.id === id ? {
        ...po,
        status: po.status === 'Pending' ? 'Pending CEO Approval' : 'Approved',
        approvedBy: approver,
        approvalDate: new Date().toISOString().split('T')[0]
      } : po
    ));
  };

  const deletePurchaseOrder = (id) => {
    if (window.confirm('Are you sure you want to delete this purchase order?')) {
      setPurchaseOrders(purchaseOrders.filter(po => po.id !== id));
    }
  };

  // Invoice Management
  const addInvoice = (invoiceData) => {
    const newInvoice = {
      ...invoiceData,
      id: Math.max(...invoices.map(inv => inv.id), 0) + 1,
      invoiceNo: `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      issued: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setInvoices([...invoices, newInvoice]);
    return newInvoice;
  };

  const updateInvoice = (id, updates) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, ...updates } : inv));
  };

  const deleteInvoice = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      setInvoices(invoices.filter(inv => inv.id !== id));
    }
  };

  // Bill Management
  const addBill = (billData) => {
    const newBill = {
      ...billData,
      id: Math.max(...bills.map(b => b.id), 0) + 1,
      billNo: `BILL-${String(bills.length + 1).padStart(3, '0')}`,
      received: new Date().toISOString().split('T')[0],
      status: 'Pending'
    };
    setBills([...bills, newBill]);
    return newBill;
  };

  const updateBill = (id, updates) => {
    setBills(bills.map(bill => bill.id === id ? { ...bill, ...updates } : bill));
  };

  const deleteBill = (id) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      setBills(bills.filter(bill => bill.id !== id));
    }
  };

  // Chart of Accounts Management
  const addAccount = (accountData) => {
    const newAccount = {
      ...accountData,
      id: Math.max(...chartOfAccounts.map(acc => acc.id), 0) + 1,
      balance: accountData.balance || 0
    };
    setChartOfAccounts([...chartOfAccounts, newAccount]);
    return newAccount;
  };

  const updateAccount = (id, updates) => {
    setChartOfAccounts(chartOfAccounts.map(acc => acc.id === id ? { ...acc, ...updates } : acc));
  };

  const deleteAccount = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      setChartOfAccounts(chartOfAccounts.filter(acc => acc.id !== id));
    }
  };

  // Journal Entry Management
  const addJournalEntry = (entryData) => {
    const newEntry = {
      ...entryData,
      id: Math.max(...journalEntries.map(je => je.id), 0) + 1,
      entryNo: `JE-${new Date().getFullYear()}-${String(journalEntries.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      status: 'Posted'
    };
    setJournalEntries([...journalEntries, newEntry]);
    return newEntry;
  };

  const updateJournalEntry = (id, updates) => {
    setJournalEntries(journalEntries.map(je => je.id === id ? { ...je, ...updates } : je));
  };

  const deleteJournalEntry = (id) => {
    if (window.confirm('Are you sure you want to delete this journal entry?')) {
      setJournalEntries(journalEntries.filter(je => je.id !== id));
    }
  };

  // Bank Transaction Management
  const addBankTransaction = (transactionData) => {
    const newTransaction = {
      ...transactionData,
      id: Math.max(...bankTransactions.map(bt => bt.id), 0) + 1,
      date: new Date().toISOString().split('T')[0]
    };
    setBankTransactions([...bankTransactions, newTransaction]);
    return newTransaction;
  };

  const updateBankTransaction = (id, updates) => {
    setBankTransactions(bankTransactions.map(bt => bt.id === id ? { ...bt, ...updates } : bt));
  };

  const deleteBankTransaction = (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setBankTransactions(bankTransactions.filter(bt => bt.id !== id));
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
      if (e.mealActivityType && breakdown.hasOwnProperty(e.mealActivityType)) {
        breakdown[e.mealActivityType] += e.amount;
      } else if (e.mealActivityType) {
        breakdown.other += e.amount;
      }
    });

    return Object.entries(breakdown)
      .filter(([_, amount]) => amount > 0)
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
    expenses,
    payrollData,
    budgets,
    purchaseOrders,
    invoices,
    bills,
    chartOfAccounts,
    journalEntries,
    bankTransactions,
    addExpense,
    updateExpense,
    deleteExpense,
    updatePayroll,
    processPayroll,
    addPurchaseOrder,
    approvePurchaseOrder,
    deletePurchaseOrder,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addBill,
    updateBill,
    deleteBill,
    addAccount,
    updateAccount,
    deleteAccount,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    addBankTransaction,
    updateBankTransaction,
    deleteBankTransaction,
    getStats,
    getExpensesByCategory,
    getExpensesByProject,
    // MEAL Integration Methods - NEW
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
