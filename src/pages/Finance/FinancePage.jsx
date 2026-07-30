import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CashAPI, ExchangeRateAPI, InvoiceAPI } from '../../services/api';
import { useFinance } from '../../contexts/FinanceContext';
import { usePartners } from '../../contexts/PartnersContext';
import { useProposals } from '../../contexts/ProposalsContext';
import { useGrantReceivables } from '../../contexts/GrantReceivablesContext';
import { useFixedAssets } from '../../contexts/FixedAssetsContext';
import { useSettings } from '../../contexts/SettingsContext';
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard, FileText, Plus, CheckCircle, Clock,
  BarChart3, Users, Target, Building2, Receipt, Wallet, ArrowUpRight, ArrowDownRight,
  Calendar, Filter, Download, Search, Edit, Trash2, X, ChevronDown, ChevronRight,
  PieChart, LineChart, AlertCircle, RefreshCw, Eye, Send, Check, XCircle, LayoutDashboard,
  Upload, HandCoins, Package, TrendingDown as Depreciation
} from 'lucide-react';
import { getCurrencySymbol, formatCurrency, SUPPORTED_CURRENCIES } from '../../utils/currencyUtils';
import ForexInsightsCard from './components/ForexInsightsCard';
import GrantUtilizationCard from './components/GrantUtilizationCard';

// Today's date as YYYY-MM-DD (local), and a blank invoice-receipt form.
const todayISO = () => new Date().toISOString().slice(0, 10);
const blankPaymentForm = () => ({
  originalAmount: '', amountLKR: '', exchangeRate: '',
  paymentDate: todayISO(), paymentMethod: 'Bank Transfer',
  referenceNumber: '', notes: '', rateSource: 'manual',
});

const FinancePage = () => {
  const {
    invoices,
    bills,
    chartOfAccounts,
    journalEntries,
    bankTransactions,
    updateInvoice,
    recordInvoicePayment,
    updateBill,
    addAccount
  } = useFinance();
  const { partners } = usePartners();
  const { proposals, getBudgetByProposal } = useProposals();
  const { grantReceivables, getTotals: getGrantTotals, addGrantReceivable, recordReceipt, deleteGrantReceivable, getOverdue } = useGrantReceivables();
  const { fixedAssets, getTotals: getAssetTotals, addFixedAsset, deleteFixedAsset, getDepreciationSchedule, getSummaryByType } = useFixedAssets();
  const { performanceTargets } = useSettings();

  // Active section is driven by the URL (?section=xxx) so the sidebar
  // console can navigate to it and it's shareable/bookmarkable.
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('section') || 'dashboard';
  const setActiveTab = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', id);
    setSearchParams(next, { replace: false });
  };

  // Modal States
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showInvoiceDetail, setShowInvoiceDetail] = useState(false);
  const [showEditInvoice, setShowEditInvoice] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showReceivePayment, setShowReceivePayment] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddJournalEntry, setShowAddJournalEntry] = useState(false);
  const [showBankReconciliation, setShowBankReconciliation] = useState(false);
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showBillDetail, setShowBillDetail] = useState(false);
  const [showPayBill, setShowPayBill] = useState(false);
  // Cash-disburse state for Bills
  const [cashAccounts, setCashAccounts] = useState([]);
  const [payBillAccountId, setPayBillAccountId] = useState('');
  const [payBillBusy, setPayBillBusy] = useState(false);
  const [payBillError, setPayBillError] = useState(null);
  // Load cash accounts when the Pay-Bill modal opens for the first time
  useEffect(() => {
    if (!showPayBill || cashAccounts.length > 0) return;
    (async () => {
      try {
        const resp = await CashAPI.listAccounts();
        const list = resp?.data?.accounts || resp?.data || [];
        const active = list.filter(a => a.isActive !== false);
        setCashAccounts(active);
        if (active.length === 1) setPayBillAccountId(String(active[0].id));
      } catch (e) {
        setPayBillError('Could not load cash accounts: ' + (e?.message || 'unknown'));
      }
    })();
  }, [showPayBill, cashAccounts.length]);

  // ---- Receive Payment (invoice receipt) form state ----
  // Captures the foreign amount received, the Sampath Bank O/D Buying rate at
  // the receipt date and the LKR actually received. The rate is auto-fetched
  // when the modal opens but stays editable for manual override.
  const [paymentForm, setPaymentForm] = useState(blankPaymentForm());
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [rateInfo, setRateInfo] = useState(null); // { source, stale, rateDate }
  const [rateLoading, setRateLoading] = useState(false);

  // ---- Forex Gain/Loss report state ----
  const [forexReport, setForexReport] = useState(null);
  const [forexBusy, setForexBusy] = useState(false);
  const [forexRange, setForexRange] = useState({ from: '', to: '' });

  const loadForexReport = async () => {
    setForexBusy(true);
    try {
      const params = {};
      if (forexRange.from) params.from = forexRange.from;
      if (forexRange.to) params.to = forexRange.to;
      setForexReport(await InvoiceAPI.getForexReport(params));
    } catch (e) {
      setForexReport({ error: e?.message || 'Could not load the forex report' });
    } finally {
      setForexBusy(false);
    }
  };

  // Load the forex report the first time the Invoices tab is opened.
  useEffect(() => {
    if (activeTab === 'invoices' && !forexReport && !forexBusy) loadForexReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Initialise the form + fetch the Sampath rate whenever the modal opens.
  useEffect(() => {
    if (!showReceivePayment || !selectedInvoice) return;
    const inv = selectedInvoice;
    const currency = (inv.currency || 'LKR').toUpperCase();
    const balance = Number(
      inv.balanceDue ?? inv.totalAmount ?? inv.originalAmount ?? inv.amount ?? 0
    );
    setPaymentError(null);
    setRateInfo(null);
    if (currency === 'LKR') {
      setPaymentForm({
        ...blankPaymentForm(),
        originalAmount: balance ? String(balance) : '',
        amountLKR: balance ? String(balance) : '',
        exchangeRate: '1', rateSource: 'identity',
      });
      return;
    }
    // Foreign currency — pre-fill and fetch the live O/D Buying rate.
    setPaymentForm({
      ...blankPaymentForm(),
      originalAmount: balance ? String(balance) : '',
    });
    setRateLoading(true);
    ExchangeRateAPI.resolveRate(currency, todayISO())
      .then((r) => {
        if (r && r.rate != null) {
          const amt = balance || 0;
          setPaymentForm((f) => ({
            ...f,
            exchangeRate: String(r.rate),
            amountLKR: amt ? String(Math.round(amt * r.rate * 100) / 100) : '',
            rateSource: r.source === 'sampath-auto' ? 'sampath-auto' : 'manual',
          }));
          setRateInfo({ source: r.source, stale: r.stale, rateDate: r.rateDate });
        } else {
          setRateInfo({ source: 'none', stale: true, rateDate: null });
        }
      })
      .catch(() => setRateInfo({ source: 'none', stale: true, rateDate: null }))
      .finally(() => setRateLoading(false));
  }, [showReceivePayment, selectedInvoice]);

  // Keep exchangeRate = amountLKR / originalAmount as the staff edits either.
  const onPaymentAmountChange = (field, value) => {
    setPaymentForm((f) => {
      const next = { ...f, [field]: value };
      const amt = parseFloat(field === 'originalAmount' ? value : next.originalAmount) || 0;
      const lkr = parseFloat(field === 'amountLKR' ? value : next.amountLKR) || 0;
      if (field === 'exchangeRate') {
        const rate = parseFloat(value) || 0;
        if (amt > 0 && rate > 0) next.amountLKR = String(Math.round(amt * rate * 100) / 100);
        next.rateSource = 'manual';
      } else if (amt > 0 && lkr > 0) {
        next.exchangeRate = (lkr / amt).toFixed(4);
        if (field === 'amountLKR') next.rateSource = 'manual';
      }
      return next;
    });
  };

  // Submit the receipt to the backend (persists rate + realised gain/loss).
  const submitInvoicePayment = async () => {
    if (!selectedInvoice) return;
    const received = parseFloat(paymentForm.originalAmount);
    if (!(received > 0)) {
      setPaymentError('Enter the amount received.');
      return;
    }
    setPaymentBusy(true);
    setPaymentError(null);
    try {
      await recordInvoicePayment(selectedInvoice.id, {
        originalAmount: received,
        amountLkr: paymentForm.amountLKR !== '' ? parseFloat(paymentForm.amountLKR) : undefined,
        exchangeRate: paymentForm.exchangeRate !== '' ? parseFloat(paymentForm.exchangeRate) : undefined,
        rateSource: paymentForm.rateSource,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber || undefined,
        notes: paymentForm.notes || undefined,
      });
      setShowReceivePayment(false);
      setSelectedInvoice(null);
    } catch (e) {
      setPaymentError(e?.message || 'Could not record the payment.');
    } finally {
      setPaymentBusy(false);
    }
  };

  const [showAddBill, setShowAddBill] = useState(false);
  const [showEditBill, setShowEditBill] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showAccountDetail, setShowAccountDetail] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showEditAccount, setShowEditAccount] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAddGrant, setShowAddGrant] = useState(false);
  const [showGrantDetail, setShowGrantDetail] = useState(false);
  const [showRecordReceipt, setShowRecordReceipt] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState(null);
  const [showAddAsset, setShowAddAsset] = useState(false);
  const [showAssetDetail, setShowAssetDetail] = useState(false);
  const [showDepreciationSchedule, setShowDepreciationSchedule] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [invoiceLineItems, setInvoiceLineItems] = useState([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [selectedProposalForInvoice, setSelectedProposalForInvoice] = useState(null);
  const [showAddBankAccount, setShowAddBankAccount] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    branchCode: '',
    swiftCode: '',
    accountType: 'Checking',
    openingBalance: 0
  });

  // QuickBooks-Style Data now managed by FinanceContext with localStorage
  // Chart of Accounts, Invoices, Bills, Journal Entries, and Bank Transactions
  // are all stored in localStorage and can be managed via the Finance dashboard


  // NOTE: The following code has been moved to FinanceContext - invoices, bills, chartOfAccounts, journalEntries, bankTransactions
  // Old hardcoded demo data removed to use real localStorage-backed data instead

  // REMOVED: const [invoices, setInvoices] = useState([... demo data ...]);
  // NOW: comes from useFinance() context


  // Helper function to auto-populate invoice line items from proposal budget
  const handleProposalSelection = (proposalId) => {
    if (!proposalId) {
      setInvoiceLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
      setSelectedProposalForInvoice(null);
      return;
    }

    setSelectedProposalForInvoice(proposalId);
    const budgetLines = getBudgetByProposal(parseInt(proposalId));

    if (budgetLines && budgetLines.length > 0) {
      const lineItems = budgetLines.map(budget => ({
        description: `${budget.category} - ${budget.description}`,
        quantity: 1,
        unitPrice: budget.amount
      }));
      setInvoiceLineItems(lineItems);
    } else {
      setInvoiceLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    }
  };

  // Helper function to calculate total invoice amount
  const calculateInvoiceTotal = () => {
    return invoiceLineItems.reduce((total, item) => {
      return total + (item.quantity * item.unitPrice);
    }, 0);
  };

  // Helper function to update a specific line item
  const updateLineItem = (index, field, value) => {
    const newLineItems = [...invoiceLineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: field === 'description' ? value : parseFloat(value) || 0 };
    setInvoiceLineItems(newLineItems);
  };

  // Helper function to add a new line item
  const addLineItem = () => {
    setInvoiceLineItems([...invoiceLineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  // Helper function to remove a line item
  const removeLineItem = (index) => {
    if (invoiceLineItems.length > 1) {
      setInvoiceLineItems(invoiceLineItems.filter((_, i) => i !== index));
    }
  };

  // Helper function to close invoice modal and reset state
  const closeInvoiceModal = () => {
    setShowAddInvoice(false);
    setInvoiceLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setSelectedProposalForInvoice(null);
  };

  // Handle Add Bank Account
  const handleAddBankAccount = () => {
    if (!bankAccountForm.bankName || !bankAccountForm.accountNumber || !bankAccountForm.accountHolderName) {
      alert('Please fill in all required fields');
      return;
    }

    // Create a new bank account in Chart of Accounts
    const accountName = `${bankAccountForm.bankName} - ${bankAccountForm.accountType} (${bankAccountForm.accountNumber.slice(-4)})`;

    addAccount({
      name: accountName,
      code: `1100${chartOfAccounts.filter(a => a.type === 'Asset' && a.subtype === 'Bank').length + 1}`,
      type: 'Asset',
      subtype: 'Bank',
      balance: parseFloat(bankAccountForm.openingBalance) || 0,
      currency: 'LKR',
      description: `${bankAccountForm.bankName} ${bankAccountForm.accountType} Account`,
      bankDetails: {
        bankName: bankAccountForm.bankName,
        accountNumber: bankAccountForm.accountNumber,
        accountHolderName: bankAccountForm.accountHolderName,
        branchCode: bankAccountForm.branchCode,
        swiftCode: bankAccountForm.swiftCode,
        accountType: bankAccountForm.accountType
      }
    });

    // Reset form
    setBankAccountForm({
      bankName: '',
      accountNumber: '',
      accountHolderName: '',
      branchCode: '',
      swiftCode: '',
      accountType: 'Checking',
      openingBalance: 0
    });

    setShowAddBankAccount(false);
    alert('Bank account added successfully!');
  };

  // Calculate Dashboard Metrics
  const totalRevenue = chartOfAccounts
    .filter(acc => acc.type === 'Revenue')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalExpenses = chartOfAccounts
    .filter(acc => acc.type === 'Expense')
    .reduce((sum, acc) => sum + acc.balance, 0);

  // Calculate expense distribution by subtype dynamically
  const expenseDistribution = React.useMemo(() => {
    const expenseAccounts = chartOfAccounts.filter(acc => acc.type === 'Expense');
    const subtypeGroups = {};

    expenseAccounts.forEach(acc => {
      const subtype = acc.subtype || 'Other';
      subtypeGroups[subtype] = (subtypeGroups[subtype] || 0) + acc.balance;
    });

    const colors = {
      'Direct Costs': 'from-blue-500 to-cyan-600',
      'Personnel Costs': 'from-green-500 to-emerald-600',
      'Operating Expenses': 'from-orange-500 to-amber-600',
      'Non-Cash Expenses': 'from-purple-500 to-indigo-600',
      'Other': 'from-ink-500 to-slate-600'
    };

    return Object.entries(subtypeGroups)
      .map(([category, amount]) => ({
        category,
        amount,
        percent: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        color: colors[category] || 'from-ink-500 to-slate-600'
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [chartOfAccounts, totalExpenses]);

  const netIncome = totalRevenue - totalExpenses;

  // Handle report generation
  const handleGenerateReport = (reportType) => {
    setSelectedReportType(reportType);
    setShowReportModal(true);
  };

  // Handle Print PDF
  const handlePrintPDF = () => {
    // Get the report content
    const reportContent = document.getElementById('printable-report');
    if (!reportContent) return;

    // Create a new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');

    // Write the HTML content
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedReportType} - GERSL</title>
          <style>
            @page {
              margin: 1.5cm;
              size: A4 portrait;
            }

            body {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.4;
              color: #000;
              margin: 0;
              padding: 20px;
            }

            .header {
              background: linear-gradient(to right, #d97706, #ea580c);
              color: white;
              padding: 20px;
              margin: -20px -20px 20px -20px;
              border-radius: 0;
            }

            .header h1 {
              margin: 0 0 5px 0;
              font-size: 18pt;
            }

            .header p {
              margin: 0;
              opacity: 0.9;
              font-size: 10pt;
            }

            h3 {
              font-size: 14pt;
              margin-top: 20px;
              margin-bottom: 10px;
            }

            h4 {
              font-size: 12pt;
              margin-top: 15px;
              margin-bottom: 10px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }

            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }

            th {
              background-color: #f3f4f6;
              font-weight: bold;
            }

            .section {
              margin-bottom: 20px;
              page-break-inside: avoid;
            }

            .total-row {
              font-weight: bold;
              background-color: #f9fafb;
            }

            .text-center {
              text-align: center;
            }

            .text-right {
              text-align: right;
            }

            .text-green {
              color: #059669;
            }

            .text-red {
              color: #dc2626;
            }

            .border-section {
              border: 1px solid #e5e7eb;
              padding: 15px;
              margin: 10px 0;
              border-radius: 8px;
            }

            .flex-between {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
            }

            /* Tailwind-style utility classes for the report content */
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .space-y-6 > * + * { margin-top: 1.5rem; }
            .space-y-4 > * + * { margin-top: 1rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-4 { margin-bottom: 1rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .mb-2 { margin-bottom: 0.5rem; }
            .mt-2 { margin-top: 0.5rem; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .pb-4 { padding-bottom: 1rem; }
            .rounded { border-radius: 0.375rem; }
            .border-b { border-bottom: 1px solid #e5e7eb; }
            .border-t-2 { border-top: 2px solid #d1d5db; }
            .text-lg { font-size: 1.125rem; }
            .text-xl { font-size: 1.25rem; }
            .text-sm { font-size: 0.875rem; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .text-ink-900 { color: #111827; }
            .text-ink-700 { color: #374151; }
            .text-ink-600 { color: #4b5563; }
            .text-ink-500 { color: #6b7280; }
            .text-blue-600 { color: #2563eb; }
            .text-green-600 { color: #059669; }
            .text-orange-600 { color: #ea580c; }
            .bg-ink-50 { background-color: #f9fafb; }
            .bg-blue-50 { background-color: #eff6ff; }
            .bg-green-50 { background-color: #ecfdf5; }
            .bg-orange-50 { background-color: #fff7ed; }
            .bg-amber-50 { background-color: #fffbeb; }

            @media print {
              body {
                padding: 0;
              }

              .header {
                margin: 0 0 20px 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }

              table {
                page-break-inside: auto;
              }

              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }

              /* Ensure backgrounds print */
              .bg-ink-50,
              .bg-blue-50,
              .bg-green-50,
              .bg-orange-50,
              .bg-amber-50 {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${selectedReportType}</h1>
            <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          ${reportContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    // Fallback if onload doesn't fire
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Handle Save as PDF - programmatically trigger download
  const handleSaveAsPDF = async () => {
    try {
      // Use html2canvas and jspdf if available, otherwise fall back to print with instructions
      const reportContent = document.getElementById('printable-report');
      if (!reportContent) return;

      // For now, open print dialog with better filename suggestion
      const printWindow = window.open('', '', 'width=800,height=600');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${selectedReportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf</title>
            <style>
              @page { margin: 1.5cm; size: A4 portrait; }
              body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #000; margin: 0; padding: 20px; }
              .header { background: linear-gradient(to right, #d97706, #ea580c); color: white; padding: 20px; margin: -20px -20px 20px -20px; }
              .header h1 { margin: 0 0 5px 0; font-size: 18pt; }
              .header p { margin: 0; opacity: 0.9; font-size: 10pt; }
              h3 { font-size: 14pt; margin-top: 20px; margin-bottom: 10px; }
              h4 { font-size: 12pt; margin-top: 15px; margin-bottom: 10px; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f3f4f6; font-weight: bold; }
              .flex { display: flex; }
              .items-center { align-items: center; }
              .justify-between { justify-content: space-between; }
              .space-y-6 > * + * { margin-top: 1.5rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .border-b { border-bottom: 1px solid #e5e7eb; }
              .border-t-2 { border-top: 2px solid #d1d5db; }
              .font-bold { font-weight: 700; }
              .font-semibold { font-weight: 600; }
              .text-ink-900 { color: #111827; }
              .text-ink-700 { color: #374151; }
              .text-blue-600 { color: #2563eb; }
              .text-green-600 { color: #059669; }
              .text-orange-600 { color: #ea580c; }
              .bg-blue-50 { background-color: #eff6ff; }
              .bg-green-50 { background-color: #ecfdf5; }
              .bg-orange-50 { background-color: #fff7ed; }
              @media print {
                .header { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .bg-blue-50, .bg-green-50, .bg-orange-50 { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${selectedReportType}</h1>
              <p>Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            </div>
            ${reportContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => window.close(), 500);
              };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Unable to generate PDF. Please use the Print PDF button and select "Save as PDF" in your print dialog.');
    }
  };

  // Handle Excel export
  const handleExportExcel = () => {
    let csvContent = '';
    const reportDate = new Date().toLocaleDateString();

    // Add header
    csvContent += `GERSL - ${selectedReportType}\n`;
    csvContent += `Generated: ${reportDate}\n\n`;

    if (selectedReportType === 'Profit & Loss Statement') {
      csvContent += 'Account,Amount (LKR)\n';
      csvContent += '\nRevenue\n';
      chartOfAccounts.filter(acc => acc.type === 'Revenue').forEach(acc => {
        csvContent += `${acc.name},${acc.balance}\n`;
      });
      csvContent += `Total Revenue,${totalRevenue}\n\n`;

      csvContent += 'Expenses\n';
      chartOfAccounts.filter(acc => acc.type === 'Expense').forEach(acc => {
        csvContent += `${acc.name},${acc.balance}\n`;
      });
      csvContent += `Total Expenses,${totalExpenses}\n\n`;
      csvContent += `Net Income,${netIncome}\n`;

    } else if (selectedReportType === 'Balance Sheet') {
      csvContent += 'Account Type,Account Name,Balance (LKR)\n';
      csvContent += '\nAssets\n';
      chartOfAccounts.filter(acc => acc.type === 'Asset').forEach(acc => {
        csvContent += `Asset,${acc.name},${acc.balance}\n`;
      });
      csvContent += `,,Total Assets: ${totalAssets}\n\n`;

      csvContent += 'Liabilities\n';
      chartOfAccounts.filter(acc => acc.type === 'Liability').forEach(acc => {
        csvContent += `Liability,${acc.name},${acc.balance}\n`;
      });
      csvContent += `,,Total Liabilities: ${totalLiabilities}\n\n`;

      csvContent += 'Equity\n';
      chartOfAccounts.filter(acc => acc.type === 'Equity').forEach(acc => {
        csvContent += `Equity,${acc.name},${acc.balance}\n`;
      });
      csvContent += `,,Total Equity: ${totalEquity}\n`;

    } else if (selectedReportType === 'Trial Balance') {
      csvContent += 'Account Code,Account Name,Type,Debit,Credit\n';
      chartOfAccounts.forEach(acc => {
        const isDebit = ['Asset', 'Expense'].includes(acc.type);
        csvContent += `${acc.code},${acc.name},${acc.type},${isDebit ? acc.balance : 0},${!isDebit ? acc.balance : 0}\n`;
      });

    } else if (selectedReportType === 'General Ledger') {
      csvContent += 'Account Code,Account Name,Type,Balance (LKR)\n';
      chartOfAccounts.forEach(acc => {
        csvContent += `${acc.code},${acc.name},${acc.type},${acc.balance}\n`;
      });

    } else if (selectedReportType === 'Cash Flow Statement') {
      const depreciation = chartOfAccounts.find(a => a.name === 'Depreciation')?.balance || 0;
      const accountsReceivable = chartOfAccounts.find(a => a.name === 'Accounts Receivable')?.balance || 0;
      const accountsPayable = chartOfAccounts.find(a => a.name === 'Accounts Payable')?.balance || 0;
      const netOperating = netIncome + depreciation - accountsReceivable + accountsPayable;
      const fixedAssetPurchases = -5000000;
      const netInvesting = fixedAssetPurchases;
      const grantsReceived = totalRevenue;
      const loanPayments = -2000000;
      const netFinancing = grantsReceived + loanPayments;
      const netChange = netOperating + netInvesting + netFinancing;
      const beginningCash = 25000000;
      const endingCash = cashBalance;

      csvContent += 'Cash Flow Statement\n\n';
      csvContent += 'Operating Activities\n';
      csvContent += `Net Income,${netIncome}\n`;
      csvContent += `Depreciation,${depreciation}\n`;
      csvContent += `Changes in Accounts Receivable,-${accountsReceivable}\n`;
      csvContent += `Changes in Accounts Payable,${accountsPayable}\n`;
      csvContent += `Net Cash from Operating,${netOperating}\n\n`;

      csvContent += 'Investing Activities\n';
      csvContent += `Purchase of Fixed Assets,${fixedAssetPurchases}\n`;
      csvContent += `Net Cash from Investing,${netInvesting}\n\n`;

      csvContent += 'Financing Activities\n';
      csvContent += `Grants Received,${grantsReceived}\n`;
      csvContent += `Loan Payments,${loanPayments}\n`;
      csvContent += `Net Cash from Financing,${netFinancing}\n\n`;

      csvContent += `Net Change in Cash,${netChange}\n`;
      csvContent += `Cash at Beginning,${beginningCash}\n`;
      csvContent += `Cash at End,${endingCash}\n`;

    } else if (selectedReportType === 'Budget vs Actual') {
      csvContent += 'Revenue Budget Analysis\n';
      csvContent += 'Account,Budget,Actual,Variance,Variance %\n';
      chartOfAccounts.filter(acc => acc.type === 'Revenue').forEach(acc => {
        const budget = acc.balance * 1.1;
        const variance = acc.balance - budget;
        const percentVar = ((variance / budget) * 100).toFixed(1);
        csvContent += `${acc.name},${budget.toFixed(0)},${acc.balance},${variance.toFixed(0)},${percentVar}%\n`;
      });

      csvContent += '\nExpense Budget Analysis\n';
      csvContent += 'Account,Budget,Actual,Variance,Variance %\n';
      chartOfAccounts.filter(acc => acc.type === 'Expense').forEach(acc => {
        const budget = acc.balance * 0.95;
        const variance = budget - acc.balance;
        const percentVar = ((variance / budget) * 100).toFixed(1);
        csvContent += `${acc.name},${budget.toFixed(0)},${acc.balance},${variance.toFixed(0)},${percentVar}%\n`;
      });
    }

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${selectedReportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalAssets = chartOfAccounts
    .filter(acc => acc.type === 'Asset')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalLiabilities = chartOfAccounts
    .filter(acc => acc.type === 'Liability')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const totalEquity = chartOfAccounts
    .filter(acc => acc.type === 'Equity')
    .reduce((sum, acc) => sum + acc.balance, 0);

  const cashBalance = chartOfAccounts
    .filter(acc => acc.name.includes('Cash') || acc.name.includes('Bank'))
    .reduce((sum, acc) => sum + acc.balance, 0);

  // parseFloat because Sequelize returns DECIMAL as strings — `sum +
  // "1000"` silently concatenates instead of adding.
  const accountsReceivable = invoices
    .filter(inv => inv.status !== 'Paid')
    .reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);

  const accountsPayable = bills
    .filter(bill => bill.status !== 'Paid')
    .reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

  const sectionTitles = {
    dashboard: 'Dashboard',
    accounts: 'Chart of Accounts',
    journal: 'Journal Entries',
    grants: 'Grant Receivables',
    invoices: 'Invoices',
    bills: 'Bills & Payments',
    bank: 'Bank Accounts',
    'fixed-assets': 'Fixed Assets',
    reports: 'Financial Reports',
  };

  return (
    <>
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Page header */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-orange-600 font-semibold">Finance</p>
        <h1 className="text-h2 text-hs-navy-800">{sectionTitles[activeTab] || 'Finance'}</h1>
      </div>

      <div className="space-y-4">
      {activeTab === 'dashboard' && (
      <>
      {/* QuickBooks Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-2">Total Revenue (YTD)</p>
              <h3 className="text-h1 text-ink-900">LKR {(totalRevenue / 1000000).toFixed(1)}M</h3>
              <p className="text-xs text-ink-500 mt-1">From grants & donations</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-xs font-medium text-green-600">Year to date</span>
            <ArrowUpRight size={16} className="text-green-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-2">Total Expenses (YTD)</p>
              <h3 className="text-h1 text-ink-900">LKR {(totalExpenses / 1000000).toFixed(1)}M</h3>
              <p className="text-xs text-ink-500 mt-1">All categories</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-xs font-medium text-red-600">Year to date</span>
            <ArrowDownRight size={16} className="text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-2">Net Income</p>
              <h3 className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                LKR {(netIncome / 1000000).toFixed(1)}M
              </h3>
              <p className="text-xs text-ink-500 mt-1">Profit this period</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-xs font-medium text-blue-600">
              {((netIncome / totalRevenue) * 100).toFixed(1)}% margin
            </span>
            <BarChart3 size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        <div className="bg-white border border-ink-100 rounded-lg2 p-5 shadow-card hover:shadow-lift transition group cursor-pointer" >
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-ink-600 mb-2">Cash & Bank Balance</p>
              <h3 className="text-h1 text-ink-900">LKR {(cashBalance / 1000000).toFixed(1)}M</h3>
              <p className="text-xs text-ink-500 mt-1">Available funds</p>
            </div>
            <div className="bg-ink-50 border border-ink-200 text-navy-700 p-3 rounded-md">
              <Wallet size={18} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-xs font-medium text-purple-600">
              {(() => {
                const bankAccounts = chartOfAccounts.filter(acc =>
                  acc.name.includes('Cash') || acc.name.includes('Bank')
                );
                return `${bankAccounts.length} ${bankAccounts.length === 1 ? 'account' : 'accounts'}`;
              })()}
            </span>
            <Building2 size={16} className="text-purple-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => setShowAddInvoice(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
              <FileText className="text-white" size={18} />
            </div>
            <div>
              <p className="font-bold text-ink-900 text-sm">Create Invoice</p>
              <p className="text-xs text-ink-600">{invoices.filter(i => i.status === 'Pending').length} pending</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAddExpense(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
              <Receipt className="text-white" size={18} />
            </div>
            <div>
              <p className="font-bold text-ink-900 text-sm">Record Expense</p>
              <p className="text-xs text-ink-600">Quick entry</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowAddJournalEntry(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <Edit className="text-white" size={18} />
            </div>
            <div>
              <p className="font-bold text-ink-900 text-sm">Journal Entry</p>
              <p className="text-xs text-ink-600">Manual posting</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowBankReconciliation(true)}
          className="p-4 bg-white border border-ink-200 rounded-xl hover:shadow-card transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
              <RefreshCw className="text-white" size={18} />
            </div>
            <div>
              <p className="font-bold text-ink-900 text-sm">Reconcile Bank</p>
              <p className="text-xs text-ink-600">{bankTransactions.filter(t => t.status === 'Pending').length} pending</p>
            </div>
          </div>
        </button>
      </div>
      </>
      )}

      <div className="bg-white rounded-xl shadow-hs-card border border-hs-slate-200">
        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <ForexInsightsCard />

              {/* A/R and A/P Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-ink-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-900">Accounts Receivable</h3>
                    <ArrowDownRight size={20} className="text-green-600" />
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-2">LKR {(accountsReceivable / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-green-700 mb-4">{invoices.filter(i => i.status !== 'Paid').length} unpaid invoices</p>
                  <div className="space-y-2">
                    {(() => {
                      const today = new Date();
                      const unpaidInvoices = invoices.filter(i => i.status !== 'Paid');

                      // Calculate current (0-30 days)
                      const current = unpaidInvoices.filter(i => {
                        if (!i.issued) return false;
                        const issuedDate = new Date(i.issued);
                        const daysOld = Math.floor((today - issuedDate) / (1000 * 60 * 60 * 24));
                        return daysOld <= 30;
                      });
                      const currentAmount = current.reduce((sum, inv) => sum + (parseFloat(inv.amountLkr || inv.amountLKR || inv.amount) || 0), 0);

                      // Calculate overdue (30+ days)
                      const overdue = unpaidInvoices.filter(i => {
                        if (!i.issued) return false;
                        const issuedDate = new Date(i.issued);
                        const daysOld = Math.floor((today - issuedDate) / (1000 * 60 * 60 * 24));
                        return daysOld > 30;
                      });
                      const overdueAmount = overdue.reduce((sum, inv) => sum + (parseFloat(inv.amountLkr || inv.amountLKR || inv.amount) || 0), 0);

                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-green-700">Current (0-30 days)</span>
                            <span className="font-semibold text-green-900">
                              LKR {currentAmount >= 1000000 ? `${(currentAmount / 1000000).toFixed(1)}M` : `${(currentAmount / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-700">Overdue (30+ days)</span>
                            <span className="font-semibold text-orange-900">
                              LKR {overdueAmount >= 1000000 ? `${(overdueAmount / 1000000).toFixed(1)}M` : `${(overdueAmount / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-6 bg-ink-50 border border-red-200 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-red-900">Accounts Payable</h3>
                    <ArrowUpRight size={20} className="text-red-600" />
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-2">LKR {(accountsPayable / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-red-700 mb-4">{bills.filter(b => b.status !== 'Paid').length} unpaid bills</p>
                  <div className="space-y-2">
                    {(() => {
                      const today = new Date();
                      const unpaidBills = bills.filter(b => b.status !== 'Paid');

                      // Calculate due within 7 days
                      const dueIn7Days = unpaidBills.filter(b => {
                        if (!b.due) return false;
                        const dueDate = new Date(b.due);
                        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        return daysUntilDue >= 0 && daysUntilDue <= 7;
                      });
                      const dueIn7DaysAmount = dueIn7Days.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

                      // Calculate due within 30 days
                      const dueIn30Days = unpaidBills.filter(b => {
                        if (!b.due) return false;
                        const dueDate = new Date(b.due);
                        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        return daysUntilDue >= 0 && daysUntilDue <= 30;
                      });
                      const dueIn30DaysAmount = dueIn30Days.reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-red-700">Due within 7 days</span>
                            <span className="font-semibold text-red-900">
                              LKR {dueIn7DaysAmount >= 1000000 ? `${(dueIn7DaysAmount / 1000000).toFixed(1)}M` : `${(dueIn7DaysAmount / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-orange-700">Due within 30 days</span>
                            <span className="font-semibold text-orange-900">
                              LKR {dueIn30DaysAmount >= 1000000 ? `${(dueIn30DaysAmount / 1000000).toFixed(1)}M` : `${(dueIn30DaysAmount / 1000).toFixed(0)}K`}
                            </span>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4">Recent Income</h3>
                  <div className="space-y-3">
                    {invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                            <ArrowDownRight className="text-white" size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900 text-sm">{invoice.client}</p>
                            <p className="text-xs text-ink-600">{invoice.invoiceNo} • {invoice.issued}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+LKR {(invoice.amount / 1000000).toFixed(1)}M</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>{invoice.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4">Recent Expenses</h3>
                  <div className="space-y-3">
                    {bills.slice(0, 5).map((bill) => (
                      <div key={bill.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <ArrowUpRight className="text-white" size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-ink-900 text-sm">{bill.vendor}</p>
                            <p className="text-xs text-ink-600">{bill.billNo} • {bill.received}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">-LKR {(bill.amount / 1000).toFixed(0)}K</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>{bill.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Charts and Analytics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expense Distribution Chart */}
                <div className="bg-white rounded-xl shadow-card border border-ink-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                        <PieChart className="text-orange-600" size={20} />
                        Expense Distribution
                      </h3>
                      <p className="text-sm text-ink-600 mt-1">By category (YTD)</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {expenseDistribution.map((item, index) => (
                      <div key={index} className="" >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-ink-700">{item.category}</span>
                          <span className="text-sm font-bold text-ink-900">LKR {(item.amount / 1000000).toFixed(1)}M</span>
                        </div>
                        <div className="w-full bg-ink-100 rounded-full h-2.5 overflow-hidden">
                          <div className={`h-2.5 rounded-full bg-gradient-to-r ${item.color} transition-all duration-500`}
                            style={{ width: `${item.percent}%` }}></div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-ink-500">{item.percent}% of total</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue Sources Chart */}
                <div className="bg-white rounded-xl shadow-card border border-ink-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                        <BarChart3 className="text-green-600" size={20} />
                        Revenue Sources
                      </h3>
                      <p className="text-sm text-ink-600 mt-1">Income breakdown</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      // Group invoices by client to calculate revenue sources
                      const revenueByClient = {};
                      invoices.forEach(invoice => {
                        const client = invoice.client || 'Other';
                        if (!revenueByClient[client]) {
                          revenueByClient[client] = 0;
                        }
                        revenueByClient[client] += (invoice.amountLKR || invoice.amount || 0);
                      });

                      const totalRevenue = Object.values(revenueByClient).reduce((sum, amount) => sum + amount, 0);

                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500', 'bg-ink-500'];

                      const revenueSources = Object.entries(revenueByClient)
                        .map(([source, amount]) => ({
                          source,
                          amount,
                          percent: totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0
                        }))
                        .sort((a, b) => b.amount - a.amount);

                      if (revenueSources.length === 0) {
                        return (
                          <div className="text-center py-8 text-ink-500 text-sm">
                            No revenue data available
                          </div>
                        );
                      }

                      return revenueSources.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-ink-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${colors[index % colors.length]}`}></div>
                            <span className="text-sm font-medium text-ink-700">{item.source}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-ink-900">LKR {(item.amount / 1000000).toFixed(1)}M</span>
                            <span className="text-xs text-ink-600 bg-white px-2 py-1 rounded">{item.percent}%</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Cash Flow Trend */}
                <div className="bg-white rounded-xl shadow-card border border-ink-100 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                        <LineChart className="text-blue-600" size={20} />
                        Cash Flow Trend
                      </h3>
                      <p className="text-sm text-ink-600 mt-1">Last 6 months (millions)</p>
                    </div>
                    {(() => {
                      // Calculate last 6 months cash flow from invoices and bills
                      const today = new Date();
                      const monthsData = [];

                      for (let i = 5; i >= 0; i--) {
                        const targetDate = new Date(today);
                        targetDate.setMonth(targetDate.getMonth() - i);
                        const month = targetDate.getMonth();
                        const year = targetDate.getFullYear();

                        // Calculate inflow from paid invoices in this month
                        const inflow = invoices.filter(inv => {
                          if (inv.status !== 'Paid' || !inv.paymentDate) return false;
                          const paymentDate = new Date(inv.paymentDate);
                          return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
                        }).reduce((sum, inv) => sum + (parseFloat(inv.amountLkr || inv.amountLKR || inv.amount) || 0), 0);

                        // Calculate outflow from paid bills in this month
                        const outflow = bills.filter(bill => {
                          if (bill.status !== 'Paid' || !bill.paidDate) return false;
                          const paidDate = new Date(bill.paidDate);
                          return paidDate.getMonth() === month && paidDate.getFullYear() === year;
                        }).reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

                        monthsData.push({ inflow, outflow });
                      }

                      const totalInflow = monthsData.reduce((sum, m) => sum + m.inflow, 0);
                      const totalOutflow = monthsData.reduce((sum, m) => sum + m.outflow, 0);
                      const netChange = totalInflow - totalOutflow;
                      const percentChange = totalOutflow > 0 ? ((netChange / totalOutflow) * 100).toFixed(0) : 0;

                      return (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${netChange >= 0 ? 'text-green-600' : 'text-red-600'} flex items-center gap-1`}>
                            {netChange >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                            {netChange >= 0 ? '+' : ''}{percentChange}%
                          </div>
                          <div className="text-xs text-ink-600">{netChange >= 0 ? 'Net positive' : 'Net negative'}</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      // Generate last 6 months data from real invoices and bills
                      const today = new Date();
                      const monthsData = [];

                      for (let i = 5; i >= 0; i--) {
                        const targetDate = new Date(today);
                        targetDate.setMonth(targetDate.getMonth() - i);
                        const monthName = targetDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        const month = targetDate.getMonth();
                        const year = targetDate.getFullYear();

                        // Calculate inflow from paid invoices in this month
                        const inflow = invoices.filter(inv => {
                          if (inv.status !== 'Paid' || !inv.paymentDate) return false;
                          const paymentDate = new Date(inv.paymentDate);
                          return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
                        }).reduce((sum, inv) => sum + (parseFloat(inv.amountLkr || inv.amountLKR || inv.amount) || 0), 0);

                        // Calculate outflow from paid bills in this month
                        const outflow = bills.filter(bill => {
                          if (bill.status !== 'Paid' || !bill.paidDate) return false;
                          const paidDate = new Date(bill.paidDate);
                          return paidDate.getMonth() === month && paidDate.getFullYear() === year;
                        }).reduce((sum, bill) => sum + (parseFloat(bill.amount) || 0), 0);

                        monthsData.push({ month: monthName, inflow: inflow / 1000000, outflow: outflow / 1000000 });
                      }

                      if (monthsData.every(m => m.inflow === 0 && m.outflow === 0)) {
                        return (
                          <div className="text-center py-8 text-ink-500 text-sm">
                            No cash flow activity in the last 6 months
                          </div>
                        );
                      }

                      const maxValue = Math.max(...monthsData.map(m => Math.max(m.inflow, m.outflow)), 1);

                      return monthsData.map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-ink-600 w-20">{item.month}</span>
                          <div className="flex-1 flex gap-1">
                            <div className="bg-green-500 h-8 rounded transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${(item.inflow / maxValue) * 100}%` }}
                              title={`${item.inflow.toFixed(1)}M inflow`}>
                              {item.inflow > 8 && `${item.inflow.toFixed(1)}M`}
                            </div>
                            <div className="bg-red-400 h-8 rounded transition-all duration-300 flex items-center justify-center text-white text-xs font-bold"
                              style={{ width: `${(item.outflow / maxValue) * 100}%` }}
                              title={`${item.outflow.toFixed(1)}M outflow`}>
                              {item.outflow > 8 && `${item.outflow.toFixed(1)}M`}
                            </div>
                          </div>
                          <span className="text-xs text-ink-500 w-16 text-right">
                            {item.inflow - item.outflow >= 0 ? '+' : ''}{(item.inflow - item.outflow).toFixed(1)}M
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                  <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-ink-100">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-ink-600">Inflow</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-400 rounded"></div>
                      <span className="text-xs text-ink-600">Outflow</span>
                    </div>
                  </div>
                </div>

                {/* Financial Health Metrics */}
                <div className="bg-white rounded-xl shadow-card border border-ink-100 p-6">
                  {(() => {
                    // Calculate real financial health metrics
                    const currentAssets = chartOfAccounts
                      .filter(acc => acc.type === 'Asset' && acc.subtype === 'Current Assets')
                      .reduce((sum, acc) => sum + acc.balance, 0);

                    const currentLiabilities = chartOfAccounts
                      .filter(acc => acc.type === 'Liability' && acc.subtype === 'Current Liabilities')
                      .reduce((sum, acc) => sum + acc.balance, 0);

                    // Current Ratio = Current Assets / Current Liabilities
                    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
                    const currentRatioValue = currentRatio > 0 ? Math.min((currentRatio / 3) * 100, 100) : 0; // Scale to percentage (3:1 = 100%)

                    // Expense Ratio = Total Expenses / Total Revenue
                    const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
                    const expenseRatioValue = Math.min(expenseRatio, 100);

                    // Cash Reserve Days = (Cash Balance / Average Daily Expenses)
                    const avgDailyExpenses = totalExpenses / 365;
                    const cashReserveDays = avgDailyExpenses > 0 ? cashBalance / avgDailyExpenses : 0;
                    const cashReserveDaysValue = Math.min((cashReserveDays / 180) * 100, 100); // Scale to percentage (180 days = 100%)

                    // Grant Utilization = Expenses / Revenue (how efficiently grants are used)
                    const grantUtilization = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;
                    const grantUtilizationValue = Math.min(grantUtilization, 100);

                    const metrics = [
                      {
                        metric: 'Current Ratio',
                        value: currentRatioValue,
                        target: performanceTargets.financial.currentRatioTarget,
                        label: currentLiabilities > 0 ? `${currentRatio.toFixed(1)}:1` : 'N/A',
                        status: currentRatioValue >= performanceTargets.financial.currentRatioTarget ? 'above' : 'below'
                      },
                      {
                        metric: 'Expense Ratio',
                        value: expenseRatioValue,
                        target: performanceTargets.financial.expenseRatioTarget,
                        label: `${expenseRatio.toFixed(0)}%`,
                        status: expenseRatioValue <= performanceTargets.financial.expenseRatioTarget ? 'above' : 'below' // Lower is better for expense ratio
                      },
                      {
                        metric: 'Cash Reserve Days',
                        value: cashReserveDaysValue,
                        target: performanceTargets.financial.cashReserveDaysTarget,
                        label: avgDailyExpenses > 0 ? `${Math.round(cashReserveDays)} days` : 'N/A',
                        status: cashReserveDaysValue >= performanceTargets.financial.cashReserveDaysTarget ? 'above' : 'below'
                      },
                      {
                        metric: 'Grant Utilization',
                        value: grantUtilizationValue,
                        target: performanceTargets.financial.grantUtilizationTarget,
                        label: `${grantUtilization.toFixed(0)}%`,
                        status: grantUtilizationValue >= performanceTargets.financial.grantUtilizationTarget ? 'above' : 'below'
                      }
                    ];

                    const healthyCount = metrics.filter(m => m.status === 'above').length;
                    const overallStatus = healthyCount >= 3 ? 'Healthy' : healthyCount >= 2 ? 'Fair' : 'Needs Attention';
                    const statusColor = healthyCount >= 3 ? 'text-green-600' : healthyCount >= 2 ? 'text-yellow-600' : 'text-red-600';

                    return (
                      <>
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                              <Target className="text-purple-600" size={20} />
                              Financial Health Metrics
                            </h3>
                            <p className="text-sm text-ink-600 mt-1">Key indicators</p>
                          </div>
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${statusColor}`}>{overallStatus}</div>
                            <div className="text-xs text-ink-600">{healthyCount}/4 targets met</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {metrics.map((item, index) => (
                            <div key={index}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-ink-700">{item.metric}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-ink-900">{item.label}</span>
                                  {item.status === 'above' ? (
                                    <TrendingUp className="text-green-600" size={14} />
                                  ) : (
                                    <TrendingDown className="text-orange-600" size={14} />
                                  )}
                                </div>
                              </div>
                              <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    item.status === 'above'
                                      ? 'bg-navy-900'
                                      : 'bg-navy-900'
                                  }`}
                                  style={{ width: `${Math.round(item.value)}%` }}
                                ></div>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-ink-500">Target: {item.target}%</span>
                                <span className={`text-xs font-medium ${
                                  item.status === 'above' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {item.status === 'above' ? 'Above target' : 'Below target'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Chart of Accounts Tab */}
          {activeTab === 'accounts' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Chart of Accounts</h2>
                  <p className="text-sm text-ink-600">Complete list of all accounts in the system</p>
                </div>
                <button
                  onClick={() => setShowAddAccount(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Account
                </button>
              </div>

              {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((accountType) => (
                <div key={accountType} className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                  <div className={`p-4 ${
                    accountType === 'Asset' ? 'bg-blue-50 border-b border-blue-200' :
                    accountType === 'Liability' ? 'bg-red-50 border-b border-red-200' :
                    accountType === 'Equity' ? 'bg-purple-50 border-b border-purple-200' :
                    accountType === 'Revenue' ? 'bg-green-50 border-b border-green-200' :
                    'bg-orange-50 border-b border-orange-200'
                  }`}>
                    <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                      {accountType === 'Asset' && <TrendingUp size={20} className="text-blue-600" />}
                      {accountType === 'Liability' && <TrendingDown size={20} className="text-red-600" />}
                      {accountType === 'Equity' && <PieChart size={20} className="text-purple-600" />}
                      {accountType === 'Revenue' && <ArrowDownRight size={20} className="text-green-600" />}
                      {accountType === 'Expense' && <ArrowUpRight size={20} className="text-orange-600" />}
                      {accountType}s
                    </h3>
                  </div>
                  <div className="divide-y divide-ink-100">
                    {chartOfAccounts.filter(acc => acc.type === accountType).map((account) => (
                      <div key={account.id} className="flex items-center justify-between p-4 hover:bg-ink-50 transition-colors">
                        <div className="flex items-center gap-4 flex-1">
                          <span className="font-mono text-sm text-ink-500 bg-ink-100 px-2 py-1 rounded">{account.code}</span>
                          <div>
                            <p className="font-semibold text-ink-900">{account.name}</p>
                            <p className="text-xs text-ink-600">{account.subtype}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`font-bold ${account.dr ? 'text-blue-600' : 'text-red-600'}`}>
                              LKR {(account.balance / 1000000).toFixed(2)}M
                            </p>
                            <p className="text-xs text-ink-500">{account.dr ? 'Debit' : 'Credit'} balance</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowAccountDetail(true);
                              }}
                              className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowEditAccount(true);
                              }}
                              className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
                            >
                              <Edit size={16} className="text-ink-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 bg-ink-50 border-t border-ink-100">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-ink-900">Total {accountType}s:</p>
                      <p className="font-bold text-xl text-ink-900">
                        LKR {(chartOfAccounts.filter(acc => acc.type === accountType).reduce((sum, acc) => sum + acc.balance, 0) / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Accounting Equation */}
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Accounting Equation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-ink-600 mb-1">Assets</p>
                    <p className="text-2xl font-bold text-blue-600">LKR {(totalAssets / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="flex items-center justify-center text-3xl font-bold text-ink-400">=</div>
                  <div className="bg-white rounded-lg p-4 border border-purple-200">
                    <p className="text-sm text-ink-600 mb-1">Liabilities + Equity</p>
                    <p className="text-2xl font-bold text-purple-600">LKR {((totalLiabilities + chartOfAccounts.filter(acc => acc.type === 'Equity').reduce((sum, acc) => sum + acc.balance, 0)) / 1000000).toFixed(1)}M</p>
                  </div>
                </div>
                <p className="text-center text-sm text-ink-600 mt-4">
                  {totalAssets === (totalLiabilities + chartOfAccounts.filter(acc => acc.type === 'Equity').reduce((sum, acc) => sum + acc.balance, 0))
                    ? '✓ Books are balanced'
                    : '⚠ Equation does not balance - please review entries'}
                </p>
              </div>
            </div>
          )}

          {/* Fixed Assets Tab */}
          {activeTab === 'fixed-assets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Fixed Assets Register</h2>
                  <p className="text-sm text-ink-600">Property, Plant & Equipment (PPE) with automatic depreciation tracking</p>
                </div>
                <button
                  onClick={() => setShowAddAsset(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Fixed Asset
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-ink-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-900">Total Cost</p>
                    <Package size={20} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    LKR {(getAssetTotals().totalCost / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{getAssetTotals().totalAssets} active assets</p>
                </div>

                <div className="bg-ink-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-red-900">Accumulated Depreciation</p>
                    <Depreciation size={20} className="text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    LKR {(getAssetTotals().totalAccumulatedDepreciation / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-red-700 mt-1">Total depreciation to date</p>
                </div>

                <div className="bg-ink-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-900">Written Down Value</p>
                    <TrendingUp size={20} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    LKR {(getAssetTotals().totalWrittenDownValue / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-green-700 mt-1">Current asset value</p>
                </div>

                <div className="bg-ink-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-orange-900">Current Year Depreciation</p>
                    <Calendar size={20} className="text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    LKR {(getAssetTotals().totalCurrentYearDepreciation / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-orange-700 mt-1">{new Date().getFullYear()} depreciation</p>
                </div>
              </div>

              {/* Assets Table */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Asset Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Asset Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Acquisition Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Cost</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Accum. Depreciation</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">WDV</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Condition</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {fixedAssets.filter(asset => !asset.disposed).map((asset) => {
                        const depreciationPercent = (asset.accumulatedDepreciation / asset.cost) * 100;

                        return (
                          <tr key={asset.id} className="hover:bg-ink-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-mono text-sm font-semibold text-ink-900">{asset.assetCode}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-ink-900">{asset.assetName}</p>
                              <p className="text-xs text-ink-500">{asset.location}</p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                                {asset.assetType}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-ink-600">
                              {new Date(asset.acquisitionDate).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-ink-900">
                                LKR {asset.cost.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-red-600">
                                LKR {asset.accumulatedDepreciation.toLocaleString()}
                              </p>
                              <div className="w-full bg-ink-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-red-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${depreciationPercent}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-green-600">
                                LKR {asset.writtenDownValue.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                asset.condition === 'Excellent'
                                  ? 'bg-green-100 text-green-700'
                                  : asset.condition === 'Good'
                                  ? 'bg-blue-100 text-blue-700'
                                  : asset.condition === 'Fair'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {asset.condition}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowDepreciationSchedule(true);
                                  }}
                                  className="p-2 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Depreciation Schedule"
                                >
                                  <LineChart size={16} className="text-purple-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedAsset(asset);
                                    setShowAssetDetail(true);
                                  }}
                                  className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete fixed asset ${asset.assetCode}?`)) {
                                      deleteFixedAsset(asset.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {fixedAssets.filter(a => !a.disposed).length === 0 && (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-ink-300 mb-3" />
                    <p className="text-ink-500 font-medium">No fixed assets yet</p>
                    <p className="text-sm text-ink-400 mt-1">Click "Add Fixed Asset" to start tracking your assets</p>
                  </div>
                )}
              </div>

              {/* Summary by Asset Type */}
              {Object.keys(getSummaryByType()).length > 0 && (
                <div className="bg-ink-50 border border-ink-100 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-ink-900 mb-4">Summary by Asset Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(getSummaryByType()).map(([assetType, summary]) => (
                      <div key={assetType} className="bg-white rounded-lg p-4 border border-ink-100">
                        <h4 className="font-semibold text-ink-900 mb-3">{assetType}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-ink-600">Count:</span>
                            <span className="font-semibold text-ink-900">{summary.count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-600">Total Cost:</span>
                            <span className="font-semibold text-blue-600">
                              LKR {(summary.totalCost / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-600">Accum. Depr.:</span>
                            <span className="font-semibold text-red-600">
                              LKR {(summary.totalAccumulatedDepreciation / 1000000).toFixed(2)}M
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-ink-600">WDV:</span>
                            <span className="font-semibold text-green-600">
                              LKR {(summary.totalWrittenDownValue / 1000000).toFixed(2)}M
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Grant Receivables Tab */}
          {activeTab === 'grants' && (
            <div className="space-y-6">
              <GrantUtilizationCard />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Grant Receivables</h2>
                  <p className="text-sm text-ink-600">Track pledged grants and receipts from donors</p>
                </div>
                <button
                  onClick={() => setShowAddGrant(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Grant Receivable
                </button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-ink-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-blue-900">Total Pledged</p>
                    <HandCoins size={20} className="text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    LKR {(getGrantTotals().totalPledged / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-blue-700 mt-1">{getGrantTotals().total} grants</p>
                </div>

                <div className="bg-ink-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-green-900">Total Received</p>
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    LKR {(getGrantTotals().totalReceived / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-green-700 mt-1">{getGrantTotals().fullyReceived} fully received</p>
                </div>

                <div className="bg-ink-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-orange-900">Outstanding</p>
                    <Clock size={20} className="text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-orange-600">
                    LKR {(getGrantTotals().totalOutstanding / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-xs text-orange-700 mt-1">{getGrantTotals().partiallyReceived} partially received</p>
                </div>

                <div className="bg-ink-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-red-900">Overdue</p>
                    <AlertCircle size={20} className="text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {getOverdue().length}
                  </p>
                  <p className="text-xs text-red-700 mt-1">Past expected date</p>
                </div>
              </div>

              {/* Grant Receivables Table */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Donor</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Project</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Pledged Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Received</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Outstanding</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Expected Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {grantReceivables.map((grant) => {
                        const outstanding = grant.pledgeAmount - grant.receivedAmount;
                        const percentage = (grant.receivedAmount / grant.pledgeAmount) * 100;
                        const isOverdue = new Date(grant.expectedReceiptDate) < new Date() && grant.status !== 'Fully Received';

                        return (
                          <tr key={grant.id} className="hover:bg-ink-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-ink-900">{grant.donorName}</p>
                              <p className="text-xs text-ink-500">Pledge: {new Date(grant.pledgeDate).toLocaleDateString()}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-semibold text-ink-900">{grant.projectCategory || grant.projectName}</p>
                              <p className="text-xs text-ink-600">{grant.programmeArea}</p>
                              {grant.proposalId && (
                                <p className="text-xs text-blue-600 mt-0.5">
                                  Linked to {proposals?.find(p => p.id === grant.proposalId)?.proposalCode || `Proposal #${grant.proposalId}`}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-ink-900">
                                LKR {grant.pledgeAmount.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-green-600">
                                LKR {grant.receivedAmount.toLocaleString()}
                              </p>
                              <div className="w-full bg-ink-200 rounded-full h-1.5 mt-1">
                                <div
                                  className="bg-green-600 h-1.5 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-semibold text-orange-600">
                                LKR {outstanding.toLocaleString()}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <p className={`text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-ink-900'}`}>
                                {new Date(grant.expectedReceiptDate).toLocaleDateString()}
                              </p>
                              {isOverdue && (
                                <p className="text-xs text-red-600">Overdue</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                grant.status === 'Fully Received'
                                  ? 'bg-green-100 text-green-700'
                                  : grant.status === 'Partially Received'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-ink-100 text-ink-700'
                              }`}>
                                {grant.status}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                {grant.status !== 'Fully Received' && (
                                  <button
                                    onClick={() => {
                                      setSelectedGrant(grant);
                                      setShowRecordReceipt(true);
                                    }}
                                    className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Record Receipt"
                                  >
                                    <DollarSign size={16} className="text-green-600" />
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setSelectedGrant(grant);
                                    setShowGrantDetail(true);
                                  }}
                                  className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  <Eye size={16} className="text-blue-600" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm(`Delete grant receivable from ${grant.donorName}?`)) {
                                      deleteGrantReceivable(grant.id);
                                    }
                                  }}
                                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 size={16} className="text-red-600" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {grantReceivables.length === 0 && (
                  <div className="text-center py-12">
                    <HandCoins size={48} className="mx-auto text-ink-300 mb-3" />
                    <p className="text-ink-500 font-medium">No grant receivables yet</p>
                    <p className="text-sm text-ink-400 mt-1">Click "Add Grant Receivable" to start tracking pledged grants</p>
                  </div>
                )}
              </div>

              {/* Overdue Grants Alert */}
              {getOverdue().length > 0 && (
                <div className="bg-red-50 border border-ink-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={24} className="text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-red-900 mb-2">Overdue Grant Receivables</h3>
                      <p className="text-sm text-red-800 mb-3">
                        The following grants have passed their expected receipt date and have not been fully received:
                      </p>
                      <div className="space-y-2">
                        {getOverdue().map((grant) => (
                          <div key={grant.id} className="bg-white rounded-lg p-3 border border-red-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-ink-900">{grant.donorName} - {grant.projectName}</p>
                                <p className="text-sm text-ink-600">
                                  Outstanding: LKR {(grant.pledgeAmount - grant.receivedAmount).toLocaleString()} |
                                  Expected: {new Date(grant.expectedReceiptDate).toLocaleDateString()}
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedGrant(grant);
                                  setShowRecordReceipt(true);
                                }}
                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                              >
                                Record Receipt
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Invoices</h2>
                  <p className="text-sm text-ink-600">Manage client invoices and receivables</p>
                </div>
                <button
                  onClick={() => setShowAddInvoice(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Invoice
                </button>
              </div>

              {/* Foreign Exchange Gain / Loss report */}
              <div className="bg-white border border-ink-100 rounded-xl p-5">
                <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900">Foreign Exchange Gain / Loss</h3>
                    <p className="text-sm text-ink-600">
                      Realised gain/loss on foreign-currency receipts, vs. the Sampath Bank O/D Buying rate the invoice was booked at.
                    </p>
                  </div>
                  <div className="flex items-end gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1">From</label>
                      <input
                        type="date"
                        value={forexRange.from}
                        onChange={(e) => setForexRange((r) => ({ ...r, from: e.target.value }))}
                        className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1">To</label>
                      <input
                        type="date"
                        value={forexRange.to}
                        onChange={(e) => setForexRange((r) => ({ ...r, to: e.target.value }))}
                        className="px-3 py-2 border border-ink-200 rounded-lg text-sm"
                      />
                    </div>
                    <button
                      onClick={loadForexReport}
                      disabled={forexBusy}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      {forexBusy ? 'Loading…' : 'Apply'}
                    </button>
                  </div>
                </div>

                {forexReport?.error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {forexReport.error}
                  </div>
                )}

                {forexReport && !forexReport.error && (() => {
                  const fmt = (n) => `LKR ${Math.abs(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
                  const signed = (n) => { const v = Number(n) || 0; return `${v < 0 ? '(' : ''}${fmt(v)}${v < 0 ? ')' : ''}`; };
                  const cls = (n) => { const v = Number(n) || 0; return v > 0 ? 'text-green-700' : v < 0 ? 'text-red-700' : 'text-ink-700'; };
                  const gl = Number(forexReport.totalGainLoss) || 0;
                  const rows = forexReport.invoiceReceipts?.byCurrency || [];
                  const grantGL = Number(forexReport.grantReceipts?.gainLoss) || 0;
                  const payGL = Number(forexReport.payments?.gainLoss) || 0;
                  return (
                    <>
                      <div className={`rounded-lg p-4 mb-4 border ${
                        gl > 0 ? 'bg-green-50 border-green-200'
                        : gl < 0 ? 'bg-red-50 border-red-200'
                        : 'bg-ink-50 border-ink-100'}`}>
                        <p className="text-sm text-ink-600">
                          Total realised exchange {gl < 0 ? 'loss' : 'gain'}
                          {forexReport.from || forexReport.to
                            ? ` (${forexReport.from || '…'} → ${forexReport.to || '…'})`
                            : ' (all time)'}
                        </p>
                        <p className={`text-3xl font-bold ${cls(gl)}`}>{signed(gl)}</p>
                      </div>

                      {rows.length === 0 ? (
                        <p className="text-sm text-ink-500">No foreign-currency invoice receipts in this period.</p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-ink-50 border-b border-ink-100">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-semibold text-ink-600">Currency</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-ink-600">Receipts</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-ink-600">LKR Received</th>
                              <th className="px-3 py-2 text-right text-xs font-semibold text-ink-600">Gain / (Loss)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink-100">
                            {rows.map((r) => (
                              <tr key={r.currency}>
                                <td className="px-3 py-2 font-semibold text-ink-900">{r.currency}</td>
                                <td className="px-3 py-2 text-right text-ink-600">{r.count}</td>
                                <td className="px-3 py-2 text-right text-ink-900">{fmt(r.amountLkr)}</td>
                                <td className={`px-3 py-2 text-right font-semibold ${cls(r.gainLoss)}`}>{signed(r.gainLoss)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {(grantGL !== 0 || payGL !== 0) && (
                        <div className="mt-3 pt-3 border-t border-ink-100 text-sm space-y-1">
                          {grantGL !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-ink-600">Grant receipts</span>
                              <span className={`font-semibold ${cls(grantGL)}`}>{signed(grantGL)}</span>
                            </div>
                          )}
                          {payGL !== 0 && (
                            <div className="flex justify-between">
                              <span className="text-ink-600">Payments to vendors / partners</span>
                              <span className={`font-semibold ${cls(payGL)}`}>{signed(payGL)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Invoice #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Issued</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Due</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-ink-900">{invoice.invoiceNo}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-900">{invoice.client}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{invoice.project}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{invoice.issued}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{invoice.due}</td>
                        <td className="px-4 py-3 text-sm">
                          {(() => {
                            const cur = (invoice.currency || 'LKR').toUpperCase();
                            const lkr = Number(invoice.amountLkr ?? invoice.amountLKR ?? invoice.totalAmount ?? invoice.amount ?? 0);
                            const orig = Number(invoice.originalAmount ?? invoice.totalAmount ?? invoice.amount ?? 0);
                            return cur === 'LKR' ? (
                              <span className="font-bold text-ink-900">LKR {lkr.toLocaleString('en-US')}</span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="font-bold text-ink-900">
                                  {getCurrencySymbol(cur)} {orig.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className="text-xs text-ink-500">
                                  LKR {lkr.toLocaleString('en-US')}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            invoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                            invoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowInvoiceDetail(true);
                              }}
                              className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </button>
                            <button
                              onClick={() => {
                                alert(`Sending invoice ${invoice.invoiceNo} to ${invoice.client}...`);
                              }}
                              className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                              title="Send"
                            >
                              <Send size={16} className="text-green-600" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setShowEditInvoice(true);
                              }}
                              className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} className="text-ink-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Bills & Payments</h2>
                  <p className="text-sm text-ink-600">Manage vendor bills and payables</p>
                </div>
                <button
                  onClick={() => setShowAddBill(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  Add Bill
                </button>
              </div>

              {/* Bills Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-white shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <Receipt size={24} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">Total Bills</p>
                  <p className="text-3xl font-bold">{bills.length}</p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-white shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <Clock size={24} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Pending</span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">Awaiting Payment</p>
                  <p className="text-3xl font-bold">{bills.filter(b => b.status === 'Pending').length}</p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-white shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <CheckCircle size={24} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Paid</span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">Completed</p>
                  <p className="text-3xl font-bold">{bills.filter(b => b.status === 'Paid').length}</p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 text-white shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign size={24} />
                    <span className="text-xs bg-white/20 px-2 py-1 rounded">Amount</span>
                  </div>
                  <p className="text-sm opacity-90 mb-1">Pending Amount</p>
                  <p className="text-3xl font-bold">
                    {(bills.filter(b => b.status === 'Pending').reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0) / 1000).toFixed(0)}K
                  </p>
                </div>
              </div>

              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Bill #</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Vendor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Category</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Received</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Due</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {bills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm font-mono text-ink-900">{bill.billNo}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-900">{bill.vendor}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{bill.category}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{bill.received}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{bill.due}</td>
                        <td className="px-4 py-3 text-sm font-bold text-ink-900">LKR {bill.amount.toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            bill.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowBillDetail(true);
                              }}
                              className="p-2 hover:bg-orange-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={16} className="text-blue-600" />
                            </button>
                            {bill.status !== 'Paid' && (
                              <button
                                onClick={() => {
                                  setSelectedBill(bill);
                                  setShowPayBill(true);
                                }}
                                className="p-2 hover:bg-green-50 rounded-lg transition-colors"
                                title="Pay"
                              >
                                <CheckCircle size={16} className="text-green-600" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setSelectedBill(bill);
                                setShowEditBill(true);
                              }}
                              className="p-2 hover:bg-ink-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} className="text-ink-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Journal Entries Tab */}
          {activeTab === 'journal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Journal Entries</h2>
                  <p className="text-sm text-ink-600">Manual accounting entries and adjustments</p>
                </div>
                <button
                  onClick={() => setShowAddJournalEntry(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Plus size={18} />
                  New Entry
                </button>
              </div>

              <div className="space-y-4">
                {journalEntries.map((entry) => (
                  <div key={entry.id} className="bg-white border border-ink-100 rounded-xl overflow-hidden hover:shadow-card transition-shadow">
                    <div className="p-4 bg-ink-50 border-b border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="font-mono text-sm font-bold text-blue-900">{entry.entryNo}</span>
                          <span className="text-sm text-ink-600">{entry.date}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            entry.status === 'Posted' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {entry.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-ink-600">by {entry.createdBy}</span>
                          <button className="p-2 hover:bg-white rounded-lg transition-colors">
                            <Edit size={16} className="text-ink-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-ink-700 mt-2">{entry.description}</p>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead className="border-b border-ink-100">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-ink-600">Account</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-ink-600">Debit</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold text-ink-600">Credit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ink-100">
                          {entry.entries.map((line, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-2 text-sm text-ink-900">{line.account}</td>
                              <td className="px-4 py-2 text-sm text-right font-mono text-blue-600">
                                {line.debit > 0 ? `LKR ${line.debit.toLocaleString()}` : '-'}
                              </td>
                              <td className="px-4 py-2 text-sm text-right font-mono text-red-600">
                                {line.credit > 0 ? `LKR ${line.credit.toLocaleString()}` : '-'}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-ink-50 font-bold">
                            <td className="px-4 py-2 text-sm text-ink-900">Total</td>
                            <td className="px-4 py-2 text-sm text-right font-mono text-blue-900">
                              LKR {entry.total.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-mono text-red-900">
                              LKR {entry.total.toLocaleString()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bank Accounts Tab */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Bank Accounts</h2>
                  <p className="text-sm text-ink-600">Manage bank accounts and reconciliation</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddBankAccount(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add Bank Account
                  </button>
                  <button
                    onClick={() => setShowBankReconciliation(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                  >
                    <RefreshCw size={18} />
                    Reconcile Banks
                  </button>
                </div>
              </div>

              {/* Bank Account Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {chartOfAccounts.filter(acc => acc.name.includes('Bank')).map((bank) => (
                  <div key={bank.id} className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-white shadow-card hover:shadow-lift transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <Building2 size={24} />
                      <span className="text-xs bg-white/20 px-2 py-1 rounded">Active</span>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{bank.name.replace('Bank Account - ', '')}</h3>
                    <p className="text-3xl font-bold mb-4">LKR {(bank.balance / 1000000).toFixed(2)}M</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="opacity-90">Account #{bank.code}</span>
                      <button className="px-3 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors">View</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Bank Transactions */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="p-4 bg-ink-50 border-b border-ink-100">
                  <h3 className="text-lg font-bold text-ink-900">Recent Bank Transactions</h3>
                </div>
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Description</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Bank</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Type</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {bankTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-600">{transaction.date}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-900">{transaction.description}</td>
                        <td className="px-4 py-3 text-sm text-ink-600">{transaction.bank}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            transaction.type === 'Deposit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {transaction.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          <span className={transaction.amount > 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                            {transaction.amount > 0 ? '+' : ''}LKR {Math.abs(transaction.amount / 1000000).toFixed(2)}M
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            transaction.status === 'Cleared' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {transaction.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Financial Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-h1 text-ink-900">Financial Reports</h2>
                  <p className="text-sm text-ink-600">Generate and view financial statements</p>
                </div>
                <button
                  onClick={() => setShowReportBuilder(true)}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  Custom Report
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: 'Profit & Loss Statement', desc: 'Income and expenses for the period', icon: TrendingUp, color: 'green' },
                  { name: 'Balance Sheet', desc: 'Assets, liabilities, and equity snapshot', icon: PieChart, color: 'blue' },
                  { name: 'Cash Flow Statement', desc: 'Cash inflows and outflows', icon: Wallet, color: 'purple' },
                  { name: 'Budget vs Actual', desc: 'Compare budgeted amounts with actuals', icon: BarChart3, color: 'orange' },
                  { name: 'General Ledger', desc: 'Complete transaction history', icon: FileText, color: 'gray' },
                  { name: 'Trial Balance', desc: 'Verify debits equal credits', icon: CheckCircle, color: 'teal' },
                ].map((report, idx) => (
                  <div key={idx} className="bg-white border-2 border-ink-100 rounded-xl p-6 hover:shadow-card hover:border-ink-200 transition-all group">
                    <div className={`w-12 h-12 bg-${report.color}-100 rounded-lg flex items-center justify-center mb-4 group- transition-transform`}>
                      <report.icon className={`text-${report.color}-600`} size={24} />
                    </div>
                    <h3 className="font-bold text-ink-900 mb-2">{report.name}</h3>
                    <p className="text-sm text-ink-600 mb-4">{report.desc}</p>
                    <button
                      onClick={() => handleGenerateReport(report.name)}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center justify-center gap-2"
                    >
                      <Eye size={16} />
                      Generate
                    </button>
                  </div>
                ))}
              </div>

              {/* Sample P&L */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="p-4 bg-ink-50 border-b border-green-200">
                  <h3 className="text-lg font-bold text-green-900">Profit & Loss Statement (Year to Date)</h3>
                  <p className="text-sm text-green-700">January 1, 2025 - November 7, 2025</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="border-b border-ink-100 pb-4">
                      <h4 className="font-bold text-ink-900 mb-3">Revenue</h4>
                      {chartOfAccounts.filter(acc => acc.type === 'Revenue').map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-ink-700">{acc.name}</span>
                          <span className="text-sm font-semibold text-green-600">LKR {(acc.balance / 1000000).toFixed(2)}M</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 mt-2 border-t border-ink-100">
                        <span className="font-bold text-ink-900">Total Revenue</span>
                        <span className="text-lg font-bold text-green-600">LKR {(totalRevenue / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>

                    <div className="border-b border-ink-100 pb-4">
                      <h4 className="font-bold text-ink-900 mb-3">Expenses</h4>
                      {chartOfAccounts.filter(acc => acc.type === 'Expense').map((acc) => (
                        <div key={acc.id} className="flex items-center justify-between py-2">
                          <span className="text-sm text-ink-700">{acc.name}</span>
                          <span className="text-sm font-semibold text-red-600">LKR {(acc.balance / 1000000).toFixed(2)}M</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between py-2 mt-2 border-t border-ink-100">
                        <span className="font-bold text-ink-900">Total Expenses</span>
                        <span className="text-lg font-bold text-red-600">LKR {(totalExpenses / 1000000).toFixed(2)}M</span>
                      </div>
                    </div>

                    <div className="bg-ink-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-ink-900">Net Income</span>
                        <span className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          LKR {(netIncome / 1000000).toFixed(2)}M
                        </span>
                      </div>
                      <p className="text-sm text-ink-600 mt-2">
                        Profit Margin: {((netIncome / totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>

      {/* Payment Processing Modal */}
      {showPayBill && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Process Payment</h2>
                  <p className="text-sm text-green-100 mt-1">Generate Payment Voucher - {selectedBill.billNo}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPayBill(false);
                    setSelectedBill(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Bill Summary */}
              <div className="bg-ink-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Bill Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink-600">Bill Number</p>
                    <p className="font-bold text-ink-900 font-mono">{selectedBill.billNo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Vendor</p>
                    <p className="font-bold text-ink-900">{selectedBill.vendor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Due Date</p>
                    <p className="font-bold text-ink-900">{selectedBill.due}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Amount</p>
                    <p className="font-bold text-red-600 text-lg">LKR {selectedBill.amount.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Payment Voucher Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-ink-900">Payment Voucher Details</h3>

                {/* Pay-from cash account (REQUIRED) */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Pay from cash account <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={payBillAccountId}
                    onChange={(e) => setPayBillAccountId(e.target.value)}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="">— Select an account —</option>
                    {cashAccounts.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} · {a.type} · {a.currency} {Number(a.currentBalance || 0).toLocaleString()}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">
                    The voucher number is auto-generated by the chosen account.
                  </p>
                </div>

                {payBillError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                    {payBillError}
                  </div>
                )}

                {/* Payment Date */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Payment Method *
                  </label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">Select payment method</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                    <option value="Online Payment">Online Payment</option>
                  </select>
                </div>

                {/* Bank Account (if Bank Transfer selected) */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Bank Account *
                  </label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">Select bank account</option>
                    <option value="Commercial Bank">Commercial Bank - Account ending 1234</option>
                    <option value="NDB">NDB - Account ending 5678</option>
                    <option value="Cash">Cash in Hand</option>
                  </select>
                </div>

                {/* Vendor Bank Details */}
                <div className="bg-ink-50 rounded-xl p-4 border border-ink-100">
                  <h4 className="text-sm font-bold text-ink-900 mb-3">Vendor Bank Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-ink-600 mb-1">Bank Name</label>
                      <input
                        type="text"
                        placeholder="Enter vendor's bank name"
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-600 mb-1">Account Number</label>
                      <input
                        type="text"
                        placeholder="Enter vendor's account number"
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-ink-600 mb-1">Account Name</label>
                      <input
                        type="text"
                        defaultValue={selectedBill.vendor}
                        className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Reference */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Payment Reference / Transaction ID
                  </label>
                  <input
                    type="text"
                    placeholder="Enter payment reference or transaction ID"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg font-mono focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Description / Notes */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Payment Notes
                  </label>
                  <textarea
                    rows="3"
                    placeholder="Add any notes or remarks about this payment..."
                    defaultValue={`Payment for ${selectedBill.description}`}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>

                {/* Approved By (Finance Officer) */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Approved By (Finance Officer) *
                  </label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option value="">Select Finance Officer</option>
                    <option value="John Smith">John Smith (Finance Officer)</option>
                    <option value="Sarah Ahmed">Sarah Ahmed (Finance Officer)</option>
                    <option value="Michael Chen">Michael Chen (Finance Officer)</option>
                  </select>
                  <p className="text-xs text-ink-500 mt-1">Only Finance Officers can approve payments (Stage 3)</p>
                </div>

                {/* Attachments */}
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Attachments (Optional)
                  </label>
                  <input
                    type="file"
                    id="payment-attachment-upload"
                    className="hidden"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      if (files.length > 0) {
                        alert(`${files.length} file(s) selected: ${files.map(f => f.name).join(', ')}`);
                      }
                    }}
                  />
                  <label
                    htmlFor="payment-attachment-upload"
                    className="block border-2 border-dashed border-ink-300 rounded-lg p-6 text-center hover:border-green-500 hover:bg-green-50 transition-all cursor-pointer"
                  >
                    <Upload className="mx-auto text-ink-400 mb-2" size={32} />
                    <p className="text-sm text-ink-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-ink-500 mt-1">Receipts, invoices, or supporting documents (PDF, JPG, PNG, DOC)</p>
                  </label>
                </div>
              </div>

              {/* Payment Authorization */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-yellow-900">Payment Authorization</h4>
                    <p className="text-sm text-yellow-800 mt-1">
                      This action will generate a Payment Voucher (Stage 3 of approval workflow) and mark the bill as "Paid".
                      The voucher will be recorded in the system and cannot be reversed without authorization.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowPayBill(false);
                    setSelectedBill(null);
                  }}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={payBillBusy || !payBillAccountId}
                  onClick={async () => {
                    setPayBillBusy(true);
                    setPayBillError(null);
                    try {
                      await CashAPI.disburseFromSource(
                        'Bill',
                        selectedBill.id,
                        parseInt(payBillAccountId, 10),
                        { payeeName: selectedBill.vendor || selectedBill.vendorName || null }
                      );
                      setShowPayBill(false);
                      setSelectedBill(null);
                      setPayBillAccountId('');
                      // Refresh bills list from finance context — reload page so
                      // the bill's new Paid status + paidAmount show through.
                      window.location.reload();
                    } catch (e) {
                      setPayBillError(e?.response?.data?.message || e?.message || 'Payment failed');
                    } finally {
                      setPayBillBusy(false);
                    }
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  {payBillBusy ? 'Posting…' : 'Generate Voucher & Process Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Detail Modal */}
      {showBillDetail && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Bill Details</h2>
                  <p className="text-sm text-red-100 mt-1">{selectedBill.billNo}</p>
                </div>
                <button
                  onClick={() => {
                    setShowBillDetail(false);
                    setSelectedBill(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border-2 ${
                selectedBill.status === 'Paid'
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedBill.status === 'Paid' ? (
                      <CheckCircle size={32} className="text-green-600" />
                    ) : (
                      <Clock size={32} className="text-yellow-600" />
                    )}
                    <div>
                      <h3 className={`text-lg font-bold ${
                        selectedBill.status === 'Paid' ? 'text-green-900' : 'text-yellow-900'
                      }`}>
                        {selectedBill.status === 'Paid' ? 'Payment Completed' : 'Payment Pending'}
                      </h3>
                      <p className={`text-sm ${
                        selectedBill.status === 'Paid' ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {selectedBill.status === 'Paid'
                          ? `Paid on ${selectedBill.paidDate}`
                          : `Due by ${selectedBill.due}`
                        }
                      </p>
                    </div>
                  </div>
                  {selectedBill.status !== 'Paid' && (
                    <button
                      onClick={() => {
                        setShowBillDetail(false);
                        setShowPayBill(true);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>

              {/* Vendor Information */}
              <div className="bg-ink-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-4 flex items-center gap-2">
                  <Building2 size={20} className="text-red-600" />
                  Vendor Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-ink-600">Vendor Name</p>
                    <p className="font-bold text-ink-900">{selectedBill.vendor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Category</p>
                    <p className="font-bold text-ink-900">{selectedBill.category}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Contact</p>
                    <p className="font-semibold text-ink-900">{selectedBill.vendorContact}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600">Email</p>
                    <p className="font-semibold text-ink-900">{selectedBill.vendorEmail}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-ink-600">Address</p>
                    <p className="font-semibold text-ink-900">{selectedBill.vendorAddress}</p>
                  </div>
                </div>
              </div>

              {/* Bill Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700 mb-1">Bill Received</p>
                  <p className="text-lg font-bold text-blue-900">{selectedBill.received}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4">
                  <p className="text-sm text-orange-700 mb-1">Payment Due</p>
                  <p className="text-lg font-bold text-orange-900">{selectedBill.due}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700 mb-1">Payment Terms</p>
                  <p className="text-lg font-bold text-purple-900">{selectedBill.paymentTerms}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4">
                  <p className="text-sm text-indigo-700 mb-1">Project</p>
                  <p className="text-lg font-bold text-indigo-900">{selectedBill.project}</p>
                </div>
              </div>

              {/* Description */}
              <div className="bg-ink-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-ink-900 mb-2">Description</h3>
                <p className="text-ink-700">{selectedBill.description}</p>
              </div>

              {/* Line Items */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="bg-ink-50 p-4 border-b border-ink-100">
                  <h3 className="text-lg font-bold text-ink-900 flex items-center gap-2">
                    <Receipt size={20} className="text-red-600" />
                    Line Items
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600">Unit Price</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {selectedBill.lineItems.map((item, index) => (
                      <tr key={index} className="hover:bg-ink-50">
                        <td className="px-4 py-3 text-sm text-ink-900">{item.description}</td>
                        <td className="px-4 py-3 text-sm text-right text-ink-600">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-right font-mono text-ink-600">
                          LKR {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-ink-900">
                          LKR {item.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-ink-50 border-t-2 border-ink-200">
                    <tr>
                      <td colSpan="3" className="px-4 py-4 text-right text-lg font-bold text-ink-900">
                        Total Amount
                      </td>
                      <td className="px-4 py-4 text-right text-2xl font-bold text-red-600">
                        LKR {selectedBill.amount.toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Information (if paid) */}
              {selectedBill.status === 'Paid' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                    <CheckCircle size={20} className="text-green-600" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-green-700">Payment Date</p>
                      <p className="font-bold text-green-900">{selectedBill.paidDate}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Payment Method</p>
                      <p className="font-bold text-green-900">{selectedBill.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-green-700">Reference</p>
                      <p className="font-bold text-green-900 font-mono">{selectedBill.paymentReference}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Information */}
              {selectedBill.approvedBy && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Check size={20} className="text-blue-600" />
                    <span className="text-sm text-blue-700">
                      Approved by <span className="font-bold">{selectedBill.approvedBy}</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedBill.notes && (
                <div className="bg-ink-50 rounded-xl p-4">
                  <p className="text-sm text-ink-600 mb-1">Notes</p>
                  <p className="text-ink-900">{selectedBill.notes}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowBillDetail(false);
                    setSelectedBill(null);
                  }}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Close
                </button>
                {selectedBill.status !== 'Paid' && (
                  <button
                    onClick={() => {
                      setShowBillDetail(false);
                      setShowPayBill(true);
                    }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold"
                  >
                    Process Payment
                  </button>
                )}
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                  Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showReceivePayment && selectedInvoice && (() => {
        const inv = selectedInvoice;
        const currency = (inv.currency || 'LKR').toUpperCase();
        const isForeign = currency !== 'LKR';
        const invoiceNo = inv.invoiceNumber || inv.invoiceNo || `#${inv.id}`;
        const client = inv.customerName || inv.client || inv.partner?.name || '—';
        const dueDate = inv.dueDate || inv.due || '—';
        const invoiceTotal = Number(inv.totalAmount ?? inv.originalAmount ?? inv.amount ?? 0);
        const balanceDue = Number(inv.balanceDue ?? invoiceTotal);
        const bookedRate = Number(inv.exchangeRate || 1);
        const received = parseFloat(paymentForm.originalAmount) || 0;
        const receiptRate = parseFloat(paymentForm.exchangeRate) || 0;
        const gainLoss = isForeign && received > 0 && receiptRate > 0
          ? Math.round((receiptRate - bookedRate) * received * 100) / 100
          : 0;
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Receive Payment</h2>
                  <p className="text-sm text-green-100 mt-1">{invoiceNo} — {client}</p>
                </div>
                <button
                  onClick={() => { setShowReceivePayment(false); setSelectedInvoice(null); }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Invoice Summary */}
              <div className="bg-ink-50 rounded-lg p-4 border border-ink-100">
                <h3 className="text-sm font-bold text-ink-900 mb-3">Invoice Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-ink-600">Invoice No:</span>
                    <span className="font-semibold text-ink-900 ml-2">{invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">Due Date:</span>
                    <span className="font-semibold text-ink-900 ml-2">{dueDate}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">Currency:</span>
                    <span className="font-semibold text-ink-900 ml-2">{currency}</span>
                  </div>
                  <div>
                    <span className="text-ink-600">Balance Due:</span>
                    <span className="font-semibold text-green-600 ml-2">
                      {getCurrencySymbol(currency)} {balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {isForeign && (
                    <div className="col-span-2">
                      <span className="text-ink-600">Invoiced at rate:</span>
                      <span className="font-semibold text-ink-900 ml-2">
                        {bookedRate.toLocaleString('en-US', { minimumFractionDigits: 4 })} LKR/{currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Amount Received ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.originalAmount}
                    onChange={(e) => onPaymentAmountChange('originalAmount', e.target.value)}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                {isForeign && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">
                        Sampath Bank O/D Buying Rate *
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        value={paymentForm.exchangeRate}
                        onChange={(e) => onPaymentAmountChange('exchangeRate', e.target.value)}
                        className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-lg"
                      />
                      <div className="flex items-center gap-2 mt-1">
                        {rateLoading && <span className="text-xs text-ink-500">Fetching today's rate…</span>}
                        {!rateLoading && rateInfo?.source === 'sampath-auto' && (
                          <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            Auto-filled from Sampath Bank{rateInfo.rateDate ? ` (${rateInfo.rateDate})` : ''}
                          </span>
                        )}
                        {!rateLoading && rateInfo?.stale && rateInfo?.source !== 'none' && (
                          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            Rate is from an earlier day — confirm before saving
                          </span>
                        )}
                        {!rateLoading && rateInfo?.source === 'none' && (
                          <span className="text-xs text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            No Sampath rate available — enter it manually
                          </span>
                        )}
                        <span className="text-xs text-ink-500">1 {currency} = rate × LKR</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-ink-700 mb-2">
                        Total LKR Received *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentForm.amountLKR}
                        onChange={(e) => onPaymentAmountChange('amountLKR', e.target.value)}
                        className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-bold text-lg"
                      />
                      <p className="text-xs text-ink-500 mt-1">
                        Enter the actual LKR credited by the bank — the rate updates to match.
                      </p>
                    </div>

                    {/* Realised exchange gain/loss preview */}
                    <div className={`rounded-lg p-3 border text-sm ${
                      gainLoss > 0 ? 'bg-green-50 border-green-200'
                      : gainLoss < 0 ? 'bg-red-50 border-red-200'
                      : 'bg-ink-50 border-ink-100'}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-ink-700 font-semibold">Exchange Gain / (Loss)</span>
                        <span className={`font-bold ${
                          gainLoss > 0 ? 'text-green-700'
                          : gainLoss < 0 ? 'text-red-700' : 'text-ink-700'}`}>
                          {gainLoss < 0 ? '(' : ''}LKR {Math.abs(gainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 })}{gainLoss < 0 ? ')' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-ink-500 mt-1">
                        Receipt rate {receiptRate ? receiptRate.toFixed(4) : '—'} vs. invoiced rate {bookedRate.toFixed(4)}, on {received.toLocaleString('en-US')} {currency}.
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Method</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Cash</option>
                    <option>Online</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Reference Number (Optional)</label>
                  <input
                    type="text"
                    value={paymentForm.referenceNumber}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, referenceNumber: e.target.value }))}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Bank reference / cheque number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Add any notes about this payment..."
                  />
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {paymentError}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowReceivePayment(false); setSelectedInvoice(null); }}
                  disabled={paymentBusy}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={submitInvoicePayment}
                  disabled={paymentBusy}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={18} />
                  {paymentBusy ? 'Saving…' : 'Confirm Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Create New Invoice</h2>
                  <p className="text-sm text-green-100 mt-1">Bill clients for services or grants</p>
                </div>
                <button
                  onClick={closeInvoiceModal}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor/Client Name *</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select donor/client</option>
                    {partners
                      .filter(p => p.status === 'Active')
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(partner => (
                        <option key={partner.id} value={partner.name}>
                          {partner.name} ({partner.category})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">From registered partners in Partners module</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Invoice Date *</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Due Date *</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Project *</label>
                  <select
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                    onChange={(e) => handleProposalSelection(e.target.value)}
                    value={selectedProposalForInvoice || ''}
                  >
                    <option value="">Select project</option>
                    {proposals
                      .filter(p => p.status === 'Approved' || p.status === 'Under Review')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map(proposal => (
                        <option key={proposal.id} value={proposal.id}>
                          {proposal.title} - {proposal.donor}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-green-600 mt-1">
                    {selectedProposalForInvoice
                      ? '✓ Budget lines auto-populated from selected proposal'
                      : 'Select a proposal to auto-populate budget line items'}
                  </p>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description</label>
                  <textarea
                    rows="3"
                    placeholder="Enter invoice description..."
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Line Items</h3>
                <div className="space-y-3">
                  {/* Header Row */}
                  <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-ink-600 mb-2">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Quantity</div>
                    <div className="col-span-3">Unit Price (LKR)</div>
                    <div className="col-span-1">Amount</div>
                  </div>

                  {/* Line Items */}
                  {invoiceLineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-6">
                        <input
                          type="text"
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', e.target.value)}
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                          min="1"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="Unit Price"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', e.target.value)}
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm"
                          min="0"
                        />
                      </div>
                      <div className="col-span-1 flex items-center justify-between">
                        <span className="text-xs font-semibold text-ink-600">
                          {formatCurrency(item.quantity * item.unitPrice, 'LKR')}
                        </span>
                        {invoiceLineItems.length > 1 && (
                          <button
                            onClick={() => removeLineItem(index)}
                            className="p-1 text-ink-400 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addLineItem}
                  className="mt-3 text-sm text-green-600 hover:text-green-700 font-semibold flex items-center gap-1"
                >
                  <Plus size={16} />
                  Add Line Item
                </button>
              </div>

              <div className="bg-ink-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-ink-600">Total Invoice Amount</p>
                    <p className="text-xs text-ink-500 mt-1">{invoiceLineItems.length} line item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(calculateInvoiceTotal(), 'LKR')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeInvoiceModal}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Record Expense</h2>
                  <p className="text-sm text-orange-100 mt-1">Track organizational expenses</p>
                </div>
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Expense Date *</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Amount (LKR) *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Expense Account *</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select expense account</option>
                    <option>Program Expenses</option>
                    <option>Salaries & Wages</option>
                    <option>Employee Benefits</option>
                    <option>Rent Expense</option>
                    <option>Utilities</option>
                    <option>Office Supplies</option>
                    <option>Travel & Transportation</option>
                    <option>Communications</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Project</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">General / Not project-specific</option>
                    <option>Child Protection Initiative</option>
                    <option>Education Program</option>
                    <option>Health & Nutrition</option>
                    <option>Refugee Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Payment Method *</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select payment method</option>
                    <option>Cash</option>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Credit Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Paid From *</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option value="">Select account</option>
                    <option>Cash in Hand</option>
                    <option>Commercial Bank</option>
                    <option>NDB</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="Enter vendor name"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                  <textarea
                    rows="3"
                    placeholder="Enter expense description..."
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Receipt / Reference Number</label>
                  <input
                    type="text"
                    placeholder="Enter receipt or reference number"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddExpense(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                  Record Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Journal Entry Modal */}
      {showAddJournalEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Create Journal Entry</h2>
                  <p className="text-sm text-blue-100 mt-1">Manual double-entry bookkeeping</p>
                </div>
                <button
                  onClick={() => setShowAddJournalEntry(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Entry Date *</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Reference Number</label>
                  <input
                    type="text"
                    placeholder="Auto-generated"
                    className="w-full px-4 py-3 bg-ink-100 border border-ink-200 rounded-lg"
                    disabled
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Description *</label>
                  <textarea
                    rows="2"
                    placeholder="Enter journal entry description..."
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Journal Lines</h3>

                <div className="bg-ink-50 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-12 gap-3 font-semibold text-sm text-ink-700 mb-3">
                    <div className="col-span-6">Account</div>
                    <div className="col-span-3 text-right">Debit</div>
                    <div className="col-span-3 text-right">Credit</div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <select className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm">
                          <option>Select account...</option>
                          <option>Cash in Hand</option>
                          <option>Bank Account - Commercial Bank</option>
                          <option>Bank Account - NDB</option>
                          <option>Accounts Receivable</option>
                          <option>Program Expenses</option>
                          <option>Grant Revenue - UNICEF</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm text-right"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-6">
                        <select className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm">
                          <option>Select account...</option>
                          <option>Cash in Hand</option>
                          <option>Bank Account - Commercial Bank</option>
                          <option>Bank Account - NDB</option>
                          <option>Accounts Receivable</option>
                          <option>Program Expenses</option>
                          <option>Grant Revenue - UNICEF</option>
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm text-right"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="mt-3 text-sm text-orange-600 hover:text-orange-700 font-semibold">
                    + Add Another Line
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 bg-ink-50 rounded-lg p-4">
                  <div className="text-center">
                    <p className="text-sm text-ink-600 mb-1">Total Debits</p>
                    <p className="text-2xl font-bold text-blue-600">LKR 0.00</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ink-600 mb-1">Total Credits</p>
                    <p className="text-2xl font-bold text-indigo-600">LKR 0.00</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-ink-600 mb-1">Difference</p>
                    <p className="text-2xl font-bold text-green-600">LKR 0.00</p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Debits must equal credits for a balanced journal entry.
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowAddJournalEntry(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                  Post Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Reconciliation Modal */}
      {showBankReconciliation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
                  <p className="text-sm text-purple-100 mt-1">Match bank statements with system records</p>
                </div>
                <button
                  onClick={() => setShowBankReconciliation(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Bank Account *</label>
                  <select className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500">
                    <option>Commercial Bank - Account 1234</option>
                    <option>NDB - Account 5678</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Statement Date *</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Statement Balance *</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 bg-ink-50 rounded-lg p-6">
                <div className="text-center">
                  <p className="text-sm text-ink-600 mb-1">System Balance</p>
                  <p className="text-2xl font-bold text-purple-600">LKR 45.0M</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-ink-600 mb-1">Statement Balance</p>
                  <p className="text-2xl font-bold text-pink-600">LKR 0.0M</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-ink-600 mb-1">Difference</p>
                  <p className="text-2xl font-bold text-orange-600">LKR 45.0M</p>
                </div>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Unreconciled Transactions</h3>

                <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-4 py-3 text-left">
                          <input type="checkbox" className="w-4 h-4" />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Description</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Type</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      <tr className="hover:bg-ink-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="w-4 h-4" />
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-600">2025-11-01</td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-900">UNICEF Grant Receipt</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Deposit</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-green-600">+LKR 15.0M</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>
                        </td>
                      </tr>
                      <tr className="hover:bg-ink-50">
                        <td className="px-4 py-3">
                          <input type="checkbox" className="w-4 h-4" />
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-600">2025-11-03</td>
                        <td className="px-4 py-3 text-sm font-semibold text-ink-900">Office Rent Payment</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Withdrawal</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-red-600">-LKR 2.4M</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Pending</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-between">
                <button
                  onClick={() => setShowBankReconciliation(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <div className="flex gap-3">
                  <button className="px-6 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-all font-semibold">
                    Mark Selected as Cleared
                  </button>
                  <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                    Complete Reconciliation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Detail View Modal */}
      {showAccountDetail && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Account Details</h2>
                  <p className="text-sm opacity-90 mt-1">{selectedAccount.code} - {selectedAccount.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowAccountDetail(false);
                    setSelectedAccount(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Information Card */}
              <div className="bg-ink-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-ink-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Account Code</p>
                    <p className="font-mono font-bold text-ink-900 bg-white px-3 py-2 rounded-lg border border-ink-100">{selectedAccount.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Account Type</p>
                    <p className="font-semibold text-ink-900">{selectedAccount.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Subtype</p>
                    <p className="font-semibold text-ink-900">{selectedAccount.subtype}</p>
                  </div>
                  <div>
                    <p className="text-sm text-ink-600 mb-1">Normal Balance</p>
                    <p className={`font-semibold ${selectedAccount.dr ? 'text-blue-600' : 'text-red-600'}`}>
                      {selectedAccount.dr ? 'Debit' : 'Credit'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Current Balance Card */}
              <div className="bg-ink-50 rounded-xl p-6 border border-green-200">
                <h3 className="text-lg font-bold text-ink-900 mb-2">Current Balance</h3>
                <p className="text-4xl font-bold text-green-600">
                  LKR {(selectedAccount.balance / 1000000).toFixed(2)}M
                </p>
                <p className="text-sm text-ink-600 mt-2">
                  As of {new Date().toLocaleDateString('en-GB')}
                </p>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <div className="bg-ink-50 border-b border-ink-100 p-4">
                  <h3 className="text-lg font-bold text-ink-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Reference</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600 uppercase tracking-wider">Description</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600 uppercase tracking-wider">Debit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600 uppercase tracking-wider">Credit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600 uppercase tracking-wider">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink-100">
                      {/* Sample transaction data */}
                      <tr className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-900">2025-11-07</td>
                        <td className="px-4 py-3 text-sm font-mono text-ink-600">JE-001</td>
                        <td className="px-4 py-3 text-sm text-ink-900">Grant Receipt - UNICEF</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {selectedAccount.dr ? 'LKR 15.0M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                          {!selectedAccount.dr ? 'LKR 15.0M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-ink-900">
                          LKR {(selectedAccount.balance / 1000000).toFixed(2)}M
                        </td>
                      </tr>
                      <tr className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-900">2025-11-05</td>
                        <td className="px-4 py-3 text-sm font-mono text-ink-600">PV-002</td>
                        <td className="px-4 py-3 text-sm text-ink-900">Payment to ABC Training</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {!selectedAccount.dr ? 'LKR 1.5M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                          {selectedAccount.dr ? 'LKR 1.5M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-ink-900">
                          LKR {((selectedAccount.balance - 1500000) / 1000000).toFixed(2)}M
                        </td>
                      </tr>
                      <tr className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 text-sm text-ink-900">2025-11-03</td>
                        <td className="px-4 py-3 text-sm font-mono text-ink-600">EXP-045</td>
                        <td className="px-4 py-3 text-sm text-ink-900">Office Supplies Purchase</td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                          {selectedAccount.type === 'Expense' ? 'LKR 0.45M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                          {selectedAccount.type === 'Asset' ? 'LKR 0.45M' : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold text-ink-900">
                          LKR {((selectedAccount.balance - 1950000) / 1000000).toFixed(2)}M
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Account Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">Total Debits (YTD)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    LKR {selectedAccount.dr ? (selectedAccount.balance / 1000000).toFixed(2) : '0.00'}M
                  </p>
                </div>
                <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                  <p className="text-sm text-red-600 mb-1">Total Credits (YTD)</p>
                  <p className="text-2xl font-bold text-red-600">
                    LKR {!selectedAccount.dr ? (selectedAccount.balance / 1000000).toFixed(2) : '0.00'}M
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <p className="text-sm text-purple-600 mb-1">Transaction Count</p>
                  <p className="text-2xl font-bold text-purple-600">3</p>
                </div>
              </div>
            </div>

            {/* Sticky Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => {
                  setShowAccountDetail(false);
                  setSelectedAccount(null);
                }}
                className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
              >
                Close
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center gap-2">
                  <Download size={18} />
                  Export Transactions
                </button>
                <button
                  onClick={() => {
                    setShowAccountDetail(false);
                    setShowEditAccount(true);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add New Account</h2>
                  <p className="text-sm opacity-90 mt-1">Create a new account in the chart of accounts</p>
                </div>
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Type <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">Select account type</option>
                  <option value="Asset">Asset</option>
                  <option value="Liability">Liability</option>
                  <option value="Equity">Equity</option>
                  <option value="Revenue">Revenue</option>
                  <option value="Expense">Expense</option>
                </select>
              </div>

              {/* Account Subtype */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Subtype <span className="text-red-500">*</span>
                </label>
                <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                  <option value="">Select subtype</option>
                  <optgroup label="Asset">
                    <option value="Current Assets">Current Assets</option>
                    <option value="Fixed Assets">Fixed Assets</option>
                    <option value="Other Assets">Other Assets</option>
                  </optgroup>
                  <optgroup label="Liability">
                    <option value="Current Liabilities">Current Liabilities</option>
                    <option value="Non-Current Liabilities">Non-Current Liabilities</option>
                  </optgroup>
                  <optgroup label="Equity">
                    <option value="Donor Equity">Donor Equity</option>
                    <option value="Equity">Equity</option>
                  </optgroup>
                  <optgroup label="Revenue">
                    <option value="Grants">Grants</option>
                    <option value="Donations">Donations</option>
                    <option value="Other Revenue">Other Revenue</option>
                  </optgroup>
                  <optgroup label="Expense">
                    <option value="Direct Costs">Direct Costs</option>
                    <option value="Personnel Costs">Personnel Costs</option>
                    <option value="Operating Expenses">Operating Expenses</option>
                    <option value="Non-Cash Expenses">Non-Cash Expenses</option>
                  </optgroup>
                </select>
              </div>

              {/* Account Code and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Account Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 5600"
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-mono"
                  />
                  <p className="text-xs text-ink-500 mt-1">Must be unique (4-digit recommended)</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Normal Balance <span className="text-red-500">*</span>
                  </label>
                  <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500">
                    <option value="">Select balance type</option>
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Marketing & Advertising"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Optional description of what this account tracks"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Opening Balance */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Opening Balance (LKR)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <p className="text-xs text-ink-500 mt-1">Leave blank or enter 0 for new accounts</p>
              </div>

              {/* Accounting Guide */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Account Type Guidelines
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>• <strong>Assets:</strong> Things you own (Cash, Bank, Equipment) - Debit balance</p>
                  <p>• <strong>Liabilities:</strong> Things you owe (Loans, Payables) - Credit balance</p>
                  <p>• <strong>Equity:</strong> Net worth (Donor Funds, Surplus) - Credit balance</p>
                  <p>• <strong>Revenue:</strong> Income (Grants, Donations) - Credit balance</p>
                  <p>• <strong>Expenses:</strong> Costs (Salaries, Rent, Supplies) - Debit balance</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowAddAccount(false)}
                className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Account Modal */}
      {showEditAccount && selectedAccount && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-6 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit Account</h2>
                  <p className="text-sm opacity-90 mt-1">{selectedAccount.code} - {selectedAccount.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditAccount(false);
                    setSelectedAccount(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Type (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Type
                </label>
                <input
                  type="text"
                  value={selectedAccount.type}
                  disabled
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg bg-ink-100 text-ink-600 cursor-not-allowed"
                />
                <p className="text-xs text-ink-500 mt-1">Account type cannot be changed</p>
              </div>

              {/* Account Subtype */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Subtype <span className="text-red-500">*</span>
                </label>
                <select
                  defaultValue={selectedAccount.subtype}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-500 focus:border-ink-500"
                >
                  {selectedAccount.type === 'Asset' && (
                    <>
                      <option value="Current Assets">Current Assets</option>
                      <option value="Fixed Assets">Fixed Assets</option>
                      <option value="Other Assets">Other Assets</option>
                    </>
                  )}
                  {selectedAccount.type === 'Liability' && (
                    <>
                      <option value="Current Liabilities">Current Liabilities</option>
                      <option value="Non-Current Liabilities">Non-Current Liabilities</option>
                    </>
                  )}
                  {selectedAccount.type === 'Equity' && (
                    <>
                      <option value="Donor Equity">Donor Equity</option>
                      <option value="Equity">Equity</option>
                    </>
                  )}
                  {selectedAccount.type === 'Revenue' && (
                    <>
                      <option value="Grants">Grants</option>
                      <option value="Donations">Donations</option>
                      <option value="Other Revenue">Other Revenue</option>
                    </>
                  )}
                  {selectedAccount.type === 'Expense' && (
                    <>
                      <option value="Direct Costs">Direct Costs</option>
                      <option value="Personnel Costs">Personnel Costs</option>
                      <option value="Operating Expenses">Operating Expenses</option>
                      <option value="Non-Cash Expenses">Non-Cash Expenses</option>
                    </>
                  )}
                </select>
              </div>

              {/* Account Code (read-only) and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Account Code
                  </label>
                  <input
                    type="text"
                    value={selectedAccount.code}
                    disabled
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg bg-ink-100 text-ink-600 cursor-not-allowed font-mono"
                  />
                  <p className="text-xs text-ink-500 mt-1">Account code cannot be changed</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">
                    Normal Balance
                  </label>
                  <input
                    type="text"
                    value={selectedAccount.dr ? 'Debit' : 'Credit'}
                    disabled
                    className="w-full px-4 py-2 border border-ink-200 rounded-lg bg-ink-100 text-ink-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Account Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  defaultValue={selectedAccount.name}
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-500 focus:border-ink-500"
                />
              </div>

              {/* Current Balance (read-only) */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Current Balance
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={`LKR ${(selectedAccount.balance / 1000000).toFixed(2)}M`}
                    disabled
                    className="flex-1 px-4 py-2 border border-ink-200 rounded-lg bg-ink-100 text-ink-900 font-bold cursor-not-allowed"
                  />
                  <span className={`px-4 py-2 rounded-lg font-semibold ${selectedAccount.dr ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {selectedAccount.dr ? 'DR' : 'CR'}
                  </span>
                </div>
                <p className="text-xs text-ink-500 mt-1">Balance is calculated from transactions</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description
                </label>
                <textarea
                  rows="3"
                  placeholder="Optional description of what this account tracks"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-ink-500 focus:border-ink-500 resize-none"
                />
              </div>

              {/* Warning Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Important Note
                </h4>
                <p className="text-sm text-yellow-800">
                  Changes to account details will not affect historical transactions. Account code, type, and normal balance cannot be modified to maintain accounting integrity.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => {
                  setShowEditAccount(false);
                  setSelectedAccount(null);
                }}
                className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold flex items-center gap-2">
                  <Trash2 size={18} />
                  Deactivate Account
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {showAddBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Add New Bill</h2>
                  <p className="text-sm opacity-90 mt-1">Record a new vendor bill or payable</p>
                </div>
                <button
                  onClick={() => setShowAddBill(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Vendor Information */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Vendor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Vendor Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter vendor name"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Vendor Contact
                    </label>
                    <input
                      type="text"
                      placeholder="+94 XX XXX XXXX"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Vendor Email
                    </label>
                    <input
                      type="email"
                      placeholder="vendor@example.com"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Vendor Address
                    </label>
                    <input
                      type="text"
                      placeholder="Enter vendor address"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Bill Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Bill Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., BILL-001"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Project <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                      <option value="">Select project</option>
                      <option value="General Operations">General Operations</option>
                      <option value="Child Protection Initiative">Child Protection Initiative</option>
                      <option value="Youth Skills Development">Youth Skills Development</option>
                      <option value="Orphan Care Program">Orphan Care Program</option>
                      <option value="Education Program">Education Program</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Bill Received Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Payment Terms
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500">
                      <option value="Due on Receipt">Due on Receipt</option>
                      <option value="Net 15 days">Net 15 days</option>
                      <option value="Net 30 days">Net 30 days</option>
                      <option value="Net 45 days">Net 45 days</option>
                      <option value="Net 60 days">Net 60 days</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Line Items</h3>
                <div className="border border-ink-100 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-ink-50 border-b border-ink-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-ink-600 uppercase">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-ink-600 uppercase w-24">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600 uppercase w-32">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-ink-600 uppercase w-32">Amount</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-ink-100">
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            placeholder="Item description"
                            className="w-full px-2 py-1 border border-ink-200 rounded text-sm focus:ring-2 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            placeholder="1"
                            className="w-full px-2 py-1 border border-ink-200 rounded text-sm text-center focus:ring-2 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            placeholder="0.00"
                            className="w-full px-2 py-1 border border-ink-200 rounded text-sm text-right focus:ring-2 focus:ring-red-500"
                          />
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-ink-900">
                          LKR 0.00
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-red-50 rounded transition-colors">
                            <Trash2 size={16} className="text-red-600" />
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button className="mt-3 text-sm text-red-600 hover:text-red-700 font-semibold flex items-center gap-1">
                  <Plus size={16} />
                  Add Line Item
                </button>
              </div>

              {/* Total Amount */}
              <div className="bg-ink-50 rounded-lg p-4 border border-ink-100">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-ink-900">Total Amount</span>
                  <span className="text-2xl font-bold text-red-600">LKR 0.00</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  rows="3"
                  placeholder="Add any additional notes about this bill"
                  className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>

              {/* Attachments */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Attachments
                </label>
                <input
                  type="file"
                  id="bill-attachment-upload"
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    if (files.length > 0) {
                      alert(`${files.length} file(s) selected: ${files.map(f => f.name).join(', ')}`);
                    }
                  }}
                />
                <label
                  htmlFor="bill-attachment-upload"
                  className="block border-2 border-dashed border-ink-300 rounded-lg p-6 text-center hover:border-red-400 hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Upload className="mx-auto text-ink-400 mb-2" size={32} />
                  <p className="text-sm text-ink-600">Click to upload bill documents</p>
                  <p className="text-xs text-ink-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowAddBill(false)}
                className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold">
                Create Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Report Builder Modal */}
      {showReportBuilder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Custom Financial Report Builder</h2>
                  <p className="text-sm opacity-90 mt-1">Build tailored financial reports with custom parameters</p>
                </div>
                <button
                  onClick={() => setShowReportBuilder(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Report Configuration */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Report Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Report Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Q4 2025 Financial Summary"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Report Type <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                      <option value="">Select report type</option>
                      <option value="Profit & Loss">Profit & Loss Statement</option>
                      <option value="Balance Sheet">Balance Sheet</option>
                      <option value="Cash Flow">Cash Flow Statement</option>
                      <option value="Budget vs Actual">Budget vs Actual</option>
                      <option value="General Ledger">General Ledger</option>
                      <option value="Trial Balance">Trial Balance</option>
                      <option value="Custom">Custom Report</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Output Format <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                      <option value="PDF">PDF Document</option>
                      <option value="Excel">Excel Spreadsheet</option>
                      <option value="CSV">CSV File</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Date Range</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Period <span className="text-red-500">*</span>
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                      <option value="custom">Custom Date Range</option>
                      <option value="today">Today</option>
                      <option value="this-week">This Week</option>
                      <option value="this-month">This Month</option>
                      <option value="this-quarter">This Quarter</option>
                      <option value="this-year">This Year</option>
                      <option value="last-month">Last Month</option>
                      <option value="last-quarter">Last Quarter</option>
                      <option value="last-year">Last Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Account Type
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                      <option value="all">All Account Types</option>
                      <option value="Asset">Assets Only</option>
                      <option value="Liability">Liabilities Only</option>
                      <option value="Equity">Equity Only</option>
                      <option value="Revenue">Revenue Only</option>
                      <option value="Expense">Expenses Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Project
                    </label>
                    <select className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500">
                      <option value="all">All Projects</option>
                      <option value="Child Protection Initiative">Child Protection Initiative</option>
                      <option value="Youth Skills Development">Youth Skills Development</option>
                      <option value="Orphan Care Program">Orphan Care Program</option>
                      <option value="Education Program">Education Program</option>
                      <option value="Emergency Response">Emergency Response</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Minimum Amount (LKR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Maximum Amount (LKR)
                    </label>
                    <input
                      type="number"
                      placeholder="No limit"
                      className="w-full px-4 py-2 border border-ink-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Display Options */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Display Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 border border-ink-100 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-ink-700">Include Account Balances</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-ink-100 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-ink-700">Show Transaction Details</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-ink-100 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-ink-700">Group by Project</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-ink-100 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-ink-700">Include Comparison with Previous Period</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-ink-100 rounded-lg hover:bg-amber-50 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-ink-700">Show Charts and Graphs</span>
                  </label>
                </div>
              </div>

              {/* Preview Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertCircle size={18} />
                  Report Generation
                </h4>
                <p className="text-sm text-blue-800">
                  Your custom report will be generated based on the current data in the system. Large reports may take a few moments to generate. You can save this configuration as a template for future use.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex items-center justify-between">
              <button
                onClick={() => setShowReportBuilder(false)}
                className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
              >
                Cancel
              </button>
              <div className="flex gap-3">
                <button className="px-6 py-2 bg-ink-600 text-white rounded-lg hover:bg-ink-700 transition-all font-semibold">
                  Save as Template
                </button>
                <button className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2">
                  <Download size={18} />
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showInvoiceDetail && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Invoice Details</h2>
                  <p className="text-sm text-green-100 mt-1">{selectedInvoice.invoiceNo}</p>
                </div>
                <button
                  onClick={() => {
                    setShowInvoiceDetail(false);
                    setSelectedInvoice(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border-2 ${
                selectedInvoice.status === 'Paid'
                  ? 'bg-green-50 border-green-200'
                  : selectedInvoice.status === 'Overdue'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedInvoice.status === 'Paid' ? (
                      <CheckCircle size={32} className="text-green-600" />
                    ) : selectedInvoice.status === 'Overdue' ? (
                      <XCircle size={32} className="text-red-600" />
                    ) : (
                      <Clock size={32} className="text-yellow-600" />
                    )}
                    <div>
                      <p className="text-lg font-bold text-ink-900">{selectedInvoice.status}</p>
                      <p className="text-sm text-ink-600">Invoice Status</p>
                    </div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                    selectedInvoice.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    selectedInvoice.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedInvoice.status}
                  </span>
                </div>
              </div>

              {/* Client & Project Information */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-ink-900 mb-4">Client Information</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-ink-600">Client Name</p>
                      <p className="font-bold text-ink-900">{selectedInvoice.client}</p>
                    </div>
                    <div>
                      <p className="text-sm text-ink-600">Project</p>
                      <p className="font-semibold text-ink-900">{selectedInvoice.project}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-ink-900 mb-4">Invoice Details</h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-ink-600">Invoice Number</p>
                      <p className="font-mono font-bold text-ink-900">{selectedInvoice.invoiceNo}</p>
                    </div>
                    <div>
                      <p className="text-sm text-ink-600">Issue Date</p>
                      <p className="font-semibold text-ink-900">{selectedInvoice.issued}</p>
                    </div>
                    <div>
                      <p className="text-sm text-ink-600">Due Date</p>
                      <p className="font-semibold text-ink-900">{selectedInvoice.due}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Amount Summary */}
              <div className="bg-ink-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-ink-600 mb-1">Invoice Amount</p>
                    {(() => {
                      const cur = (selectedInvoice.currency || 'LKR').toUpperCase();
                      const lkr = Number(selectedInvoice.amountLkr ?? selectedInvoice.amountLKR ?? selectedInvoice.totalAmount ?? selectedInvoice.amount ?? 0);
                      const orig = Number(selectedInvoice.originalAmount ?? selectedInvoice.totalAmount ?? selectedInvoice.amount ?? 0);
                      const rate = Number(selectedInvoice.exchangeRate ?? 1);
                      return cur === 'LKR' ? (
                        <p className="text-4xl font-bold text-green-600">
                          LKR {lkr.toLocaleString('en-US')}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-3xl font-bold text-green-600">
                            {getCurrencySymbol(cur)} {orig.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-ink-600">
                            <span className="font-semibold">@ {rate.toLocaleString('en-US', { minimumFractionDigits: 4 })} LKR/{cur}</span>
                            <span className="text-ink-400">•</span>
                            <span className="font-bold text-green-600">LKR {lkr.toLocaleString('en-US')}</span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <DollarSign size={64} className="text-green-300" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowInvoiceDetail(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Close
                </button>
                {(selectedInvoice.status === 'Pending' || selectedInvoice.status === 'Overdue') && (
                  <button
                    onClick={() => {
                      setShowInvoiceDetail(false);
                      setShowReceivePayment(true);
                    }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                  >
                    <DollarSign size={18} />
                    Receive Payment
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowInvoiceDetail(false);
                    setShowEditInvoice(true);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Edit size={18} />
                  Edit Invoice
                </button>
                <button
                  onClick={() => {
                    alert(`Sending invoice ${selectedInvoice.invoiceNo} to ${selectedInvoice.client}...`);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <Send size={18} />
                  Send Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {showEditInvoice && selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit Invoice</h2>
                  <p className="text-sm text-blue-100 mt-1">{selectedInvoice.invoiceNo}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditInvoice(false);
                    setSelectedInvoice(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Client Information Section */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Client Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Donor/Client Name *
                    </label>
                    <select
                      id="editInvoiceClient"
                      defaultValue={selectedInvoice.client}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select donor/client</option>
                      {partners
                        .filter(p => p.status === 'Active')
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(partner => (
                          <option key={partner.id} value={partner.name}>
                            {partner.name} ({partner.category})
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-ink-500 mt-1">From registered partners</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Project *
                    </label>
                    <select
                      id="editInvoiceProject"
                      defaultValue={selectedInvoice.project}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select project</option>
                      {proposals
                        .filter(p => p.status === 'Approved' || p.status === 'Under Review')
                        .sort((a, b) => a.title.localeCompare(b.title))
                        .map(proposal => (
                          <option key={proposal.id} value={proposal.title}>
                            {proposal.title} - {proposal.donor}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-ink-500 mt-1">From approved proposals</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details Section */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Invoice Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Invoice Number
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedInvoice.invoiceNo}
                      disabled
                      className="w-full px-4 py-3 bg-ink-100 border border-ink-200 rounded-lg font-mono"
                    />
                    <p className="text-xs text-ink-500 mt-1">Invoice number cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Amount (LKR) *
                    </label>
                    <input
                      id="editInvoiceAmount"
                      type="number"
                      defaultValue={selectedInvoice.amount}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Issue Date *
                    </label>
                    <input
                      id="editInvoiceIssued"
                      type="date"
                      defaultValue={selectedInvoice.issued}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      id="editInvoiceDue"
                      type="date"
                      defaultValue={selectedInvoice.due}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Status *
                    </label>
                    <select
                      id="editInvoiceStatus"
                      defaultValue={selectedInvoice.status}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Overdue">Overdue</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  id="editInvoiceNotes"
                  rows="3"
                  defaultValue={selectedInvoice.notes || ''}
                  placeholder="Add any notes about this invoice"
                  className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditInvoice(false);
                    setSelectedInvoice(null);
                  }}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Map UI form keys to the server's Invoice model fields.
                      // Sequelize silently drops unknown attributes, so the
                      // previous shape (client/project/amount/issued/due) only
                      // ever persisted status + notes.
                      const updates = {
                        customerName: document.getElementById('editInvoiceClient')?.value,
                        notes: document.getElementById('editInvoiceNotes')?.value,
                        totalAmount: parseFloat(document.getElementById('editInvoiceAmount')?.value) || 0,
                        invoiceDate: document.getElementById('editInvoiceIssued')?.value,
                        dueDate: document.getElementById('editInvoiceDue')?.value,
                        status: document.getElementById('editInvoiceStatus')?.value,
                      };
                      await updateInvoice(selectedInvoice.id, updates);
                      alert('Invoice updated successfully!');
                      setShowEditInvoice(false);
                      setSelectedInvoice(null);
                    } catch (error) {
                      alert('Failed to update invoice: ' + (error.message || 'Unknown error'));
                    }
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bill Modal */}
      {showEditBill && selectedBill && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Edit Bill</h2>
                  <p className="text-sm text-red-100 mt-1">{selectedBill.billNo}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditBill(false);
                    setSelectedBill(null);
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Vendor Information */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Vendor Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Vendor Name *
                    </label>
                    <input
                      id="editBillVendor"
                      type="text"
                      defaultValue={selectedBill.vendor}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Category *
                    </label>
                    <select
                      id="editBillCategory"
                      defaultValue={selectedBill.category}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option>Office Supplies</option>
                      <option>Transportation</option>
                      <option>Utilities</option>
                      <option>Equipment</option>
                      <option>Services</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bill Details */}
              <div>
                <h3 className="text-lg font-bold text-ink-900 mb-4">Bill Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Bill Number
                    </label>
                    <input
                      type="text"
                      defaultValue={selectedBill.billNo}
                      disabled
                      className="w-full px-4 py-3 bg-ink-100 border border-ink-200 rounded-lg font-mono"
                    />
                    <p className="text-xs text-ink-500 mt-1">Bill number cannot be changed</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Amount (LKR) *
                    </label>
                    <input
                      id="editBillAmount"
                      type="number"
                      defaultValue={selectedBill.amount}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Date Received *
                    </label>
                    <input
                      id="editBillReceived"
                      type="date"
                      defaultValue={selectedBill.received}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Due Date *
                    </label>
                    <input
                      id="editBillDue"
                      type="date"
                      defaultValue={selectedBill.due}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Status *
                    </label>
                    <select
                      id="editBillStatus"
                      defaultValue={selectedBill.status}
                      className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description/Notes */}
              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">
                  Description / Notes
                </label>
                <textarea
                  id="editBillNotes"
                  rows="3"
                  defaultValue={selectedBill.notes || ''}
                  placeholder="Add any notes about this bill"
                  className="w-full px-4 py-3 border border-ink-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowEditBill(false);
                    setSelectedBill(null);
                  }}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Map UI form keys to the server's Bill model fields.
                      // (Bill has no `category` column — drop it; if categorisation
                      // is needed it should be stored elsewhere.)
                      const updates = {
                        vendorName: document.getElementById('editBillVendor')?.value,
                        totalAmount: parseFloat(document.getElementById('editBillAmount')?.value) || 0,
                        billDate: document.getElementById('editBillReceived')?.value,
                        dueDate: document.getElementById('editBillDue')?.value,
                        status: document.getElementById('editBillStatus')?.value,
                        notes: document.getElementById('editBillNotes')?.value,
                      };
                      await updateBill(selectedBill.id, updates);
                      alert('Bill updated successfully!');
                      setShowEditBill(false);
                      setSelectedBill(null);
                    } catch (error) {
                      alert('Failed to update bill: ' + (error.message || 'Unknown error'));
                    }
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition-all font-semibold flex items-center gap-2"
                >
                  <CheckCircle size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Financial Report Modal */}
      {showReportModal && selectedReportType && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col report-modal-content">
            {/* Modal Header */}
            <div className="bg-orange-500 text-white p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{selectedReportType}</h2>
                <p className="text-orange-100 text-sm mt-1">Generated on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-orange-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div id="printable-report" className="flex-1 overflow-y-auto p-6">
              {selectedReportType === 'Profit & Loss Statement' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">Profit & Loss Statement</p>
                    <p className="text-sm text-ink-500">For the Period: January 1, 2025 - {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  <div className="border-b border-ink-100 pb-4">
                    <h4 className="font-bold text-ink-900 mb-3 text-lg">Revenue</h4>
                    {chartOfAccounts.filter(acc => acc.type === 'Revenue').map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">{acc.name}</span>
                        <span className="font-semibold text-green-600">LKR {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-green-50 px-2 rounded">
                      <span className="font-bold text-ink-900 text-lg">Total Revenue</span>
                      <span className="text-xl font-bold text-green-600">LKR {totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-b border-ink-100 pb-4">
                    <h4 className="font-bold text-ink-900 mb-3 text-lg">Expenses</h4>
                    {chartOfAccounts.filter(acc => acc.type === 'Expense').map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">{acc.name}</span>
                        <span className="font-semibold text-red-600">LKR {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-red-50 px-2 rounded">
                      <span className="font-bold text-ink-900 text-lg">Total Expenses</span>
                      <span className="text-xl font-bold text-red-600">LKR {totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-ink-50 p-6 rounded-xl border border-ink-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-h1 text-ink-900">Net Income</span>
                      <span className={`text-3xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        LKR {netIncome.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-600">Profit Margin:</span>
                      <span className="font-bold text-ink-900">{((netIncome / totalRevenue) * 100).toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedReportType === 'Balance Sheet' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">Balance Sheet</p>
                    <p className="text-sm text-ink-500">As of {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  <div className="border-b border-ink-100 pb-4">
                    <h4 className="font-bold text-ink-900 mb-3 text-lg">Assets</h4>
                    {chartOfAccounts.filter(acc => acc.type === 'Asset').map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">{acc.name}</span>
                        <span className="font-semibold text-blue-600">LKR {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-blue-50 px-2 rounded">
                      <span className="font-bold text-ink-900 text-lg">Total Assets</span>
                      <span className="text-xl font-bold text-blue-600">LKR {totalAssets.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-b border-ink-100 pb-4">
                    <h4 className="font-bold text-ink-900 mb-3 text-lg">Liabilities</h4>
                    {chartOfAccounts.filter(acc => acc.type === 'Liability').map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">{acc.name}</span>
                        <span className="font-semibold text-orange-600">LKR {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-orange-50 px-2 rounded">
                      <span className="font-bold text-ink-900 text-lg">Total Liabilities</span>
                      <span className="text-xl font-bold text-orange-600">LKR {totalLiabilities.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-b border-ink-100 pb-4">
                    <h4 className="font-bold text-ink-900 mb-3 text-lg">Equity</h4>
                    {chartOfAccounts.filter(acc => acc.type === 'Equity').map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">{acc.name}</span>
                        <span className="font-semibold text-purple-600">LKR {acc.balance.toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-purple-50 px-2 rounded">
                      <span className="font-bold text-ink-900 text-lg">Total Equity</span>
                      <span className="text-xl font-bold text-purple-600">LKR {totalEquity.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="bg-ink-50 p-6 rounded-xl border border-ink-200">
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-ink-900">Total Liabilities + Equity</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        LKR {(totalLiabilities + totalEquity).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-ink-600 mt-2">
                      {totalAssets === (totalLiabilities + totalEquity) ?
                        '✓ Balance Sheet is balanced' :
                        '⚠ Balance Sheet is not balanced'}
                    </p>
                  </div>
                </div>
              )}

              {selectedReportType === 'Trial Balance' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">Trial Balance</p>
                    <p className="text-sm text-ink-500">As of {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-ink-100 border-b-2 border-ink-200">
                          <th className="px-4 py-3 text-left font-bold text-ink-900">Account Code</th>
                          <th className="px-4 py-3 text-left font-bold text-ink-900">Account Name</th>
                          <th className="px-4 py-3 text-right font-bold text-ink-900">Debit</th>
                          <th className="px-4 py-3 text-right font-bold text-ink-900">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chartOfAccounts.map((acc) => (
                          <tr key={acc.id} className="border-b border-ink-100 hover:bg-ink-50">
                            <td className="px-4 py-2 text-sm font-mono text-ink-600">{acc.code}</td>
                            <td className="px-4 py-2 text-sm text-ink-700">{acc.name}</td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-ink-900">
                              {acc.dr ? `LKR ${acc.balance.toLocaleString()}` : '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-semibold text-ink-900">
                              {!acc.dr ? `LKR ${acc.balance.toLocaleString()}` : '-'}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-ink-100 border-t-2 border-ink-200 font-bold">
                          <td className="px-4 py-3" colSpan="2">
                            <span className="text-lg text-ink-900">Total</span>
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-green-600">
                            LKR {chartOfAccounts.filter(a => a.dr).reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-lg text-blue-600">
                            LKR {chartOfAccounts.filter(a => !a.dr).reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-semibold">
                      {chartOfAccounts.filter(a => a.dr).reduce((sum, a) => sum + a.balance, 0) ===
                       chartOfAccounts.filter(a => !a.dr).reduce((sum, a) => sum + a.balance, 0)
                        ? '✓ Trial Balance is balanced - Debits equal Credits'
                        : '⚠ Trial Balance is not balanced - Please review entries'}
                    </p>
                  </div>
                </div>
              )}

              {selectedReportType === 'General Ledger' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">General Ledger</p>
                    <p className="text-sm text-ink-500">For the Period: January 1, 2025 - {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  <div className="space-y-6">
                    {['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'].map((type) => (
                      <div key={type} className="border border-ink-100 rounded-lg overflow-hidden">
                        <div className="bg-ink-100 px-4 py-3 border-b border-ink-100">
                          <h4 className="font-bold text-ink-900">{type} Accounts</h4>
                        </div>
                        <div className="p-4">
                          {chartOfAccounts.filter(acc => acc.type === type).map((acc) => (
                            <div key={acc.id} className="mb-4 pb-4 border-b border-ink-100 last:border-b-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <span className="font-mono text-xs text-ink-500">{acc.code}</span>
                                  <h5 className="font-semibold text-ink-900">{acc.name}</h5>
                                  <p className="text-xs text-ink-600">{acc.subtype}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-ink-500">{acc.dr ? 'Debit' : 'Credit'} Balance</p>
                                  <p className="text-lg font-bold text-ink-900">LKR {acc.balance.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedReportType === 'Cash Flow Statement' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">Cash Flow Statement</p>
                    <p className="text-sm text-ink-500">For the Period: January 1, 2025 - {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  {/* Operating Activities */}
                  <div className="border border-ink-100 rounded-lg overflow-hidden">
                    <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                      <h4 className="font-bold text-blue-900">Cash Flow from Operating Activities</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">Net Income</span>
                        <span className="font-semibold text-ink-900">LKR {netIncome.toLocaleString()}</span>
                      </div>
                      <div className="ml-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between py-1 px-2">
                          <span className="text-ink-600">Add: Depreciation</span>
                          <span className="text-ink-900">
                            LKR {chartOfAccounts.find(a => a.name === 'Depreciation')?.balance.toLocaleString() || '0'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-1 px-2">
                          <span className="text-ink-600">Changes in Accounts Receivable</span>
                          <span className="text-red-600">LKR ({accountsReceivable.toLocaleString()})</span>
                        </div>
                        <div className="flex items-center justify-between py-1 px-2">
                          <span className="text-ink-600">Changes in Accounts Payable</span>
                          <span className="text-green-600">LKR {accountsPayable.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-blue-50 px-2 rounded font-semibold">
                        <span className="text-ink-900">Net Cash from Operating Activities</span>
                        <span className="text-blue-600">
                          LKR {(netIncome + (chartOfAccounts.find(a => a.name === 'Depreciation')?.balance || 0) - accountsReceivable + accountsPayable).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Investing Activities */}
                  <div className="border border-ink-100 rounded-lg overflow-hidden">
                    <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
                      <h4 className="font-bold text-purple-900">Cash Flow from Investing Activities</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">Purchase of Fixed Assets</span>
                        <span className="text-red-600">LKR (5,000,000)</span>
                      </div>
                      <div className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">Sale of Investments</span>
                        <span className="text-green-600">LKR 0</span>
                      </div>
                      <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-purple-50 px-2 rounded font-semibold">
                        <span className="text-ink-900">Net Cash from Investing Activities</span>
                        <span className="text-purple-600">LKR (5,000,000)</span>
                      </div>
                    </div>
                  </div>

                  {/* Financing Activities */}
                  <div className="border border-ink-100 rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                      <h4 className="font-bold text-green-900">Cash Flow from Financing Activities</h4>
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">Grants Received</span>
                        <span className="text-green-600">LKR {totalRevenue.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 hover:bg-ink-50 px-2 rounded">
                        <span className="text-ink-700">Loan Payments</span>
                        <span className="text-red-600">LKR (2,000,000)</span>
                      </div>
                      <div className="flex items-center justify-between py-3 mt-2 border-t-2 border-ink-200 bg-green-50 px-2 rounded font-semibold">
                        <span className="text-ink-900">Net Cash from Financing Activities</span>
                        <span className="text-green-600">LKR {(totalRevenue - 2000000).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Change in Cash */}
                  <div className="bg-ink-50 p-6 rounded-xl border border-ink-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-ink-900">Net Change in Cash</span>
                        <span className="text-2xl font-bold text-indigo-600">
                          LKR {(netIncome + (chartOfAccounts.find(a => a.name === 'Depreciation')?.balance || 0) - accountsReceivable + accountsPayable - 5000000 + totalRevenue - 2000000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-ink-600">Cash at Beginning of Period</span>
                        <span className="font-semibold text-ink-900">LKR 25,000,000</span>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t-2 border-indigo-300">
                        <span className="text-xl font-bold text-ink-900">Cash at End of Period</span>
                        <span className="text-2xl font-bold text-indigo-600">LKR {cashBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedReportType === 'Budget vs Actual' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-ink-900">GERSL Management</h3>
                    <p className="text-ink-600">Budget vs Actual Analysis</p>
                    <p className="text-sm text-ink-500">For the Period: January 1, 2025 - {new Date().toLocaleDateString('en-GB')}</p>
                  </div>

                  {/* Revenue Comparison */}
                  <div className="border border-ink-100 rounded-lg overflow-hidden">
                    <div className="bg-green-50 px-4 py-3 border-b border-green-200">
                      <h4 className="font-bold text-green-900">Revenue Budget vs Actual</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-ink-50 border-b border-ink-100">
                            <th className="px-4 py-3 text-left text-sm font-bold text-ink-900">Account</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Budget</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Actual</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Variance</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartOfAccounts.filter(acc => acc.type === 'Revenue').map((acc) => {
                            const budget = acc.balance * 1.1; // Assume budget is 10% higher
                            const variance = acc.balance - budget;
                            const percentVar = ((variance / budget) * 100).toFixed(1);
                            return (
                              <tr key={acc.id} className="border-b border-ink-100 hover:bg-ink-50">
                                <td className="px-4 py-2 text-sm text-ink-700">{acc.name}</td>
                                <td className="px-4 py-2 text-sm text-right text-ink-900">LKR {budget.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                <td className="px-4 py-2 text-sm text-right font-semibold text-ink-900">LKR {acc.balance.toLocaleString()}</td>
                                <td className={`px-4 py-2 text-sm text-right font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  LKR {variance.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                </td>
                                <td className={`px-4 py-2 text-sm text-right font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentVar}%
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-green-50 border-t-2 border-green-300 font-bold">
                            <td className="px-4 py-3 text-ink-900">Total Revenue</td>
                            <td className="px-4 py-3 text-right text-ink-900">LKR {(totalRevenue * 1.1).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td className="px-4 py-3 text-right text-green-600">LKR {totalRevenue.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-red-600">LKR {(totalRevenue - (totalRevenue * 1.1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td className="px-4 py-3 text-right text-red-600">-9.1%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense Comparison */}
                  <div className="border border-ink-100 rounded-lg overflow-hidden">
                    <div className="bg-red-50 px-4 py-3 border-b border-red-200">
                      <h4 className="font-bold text-red-900">Expense Budget vs Actual</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-ink-50 border-b border-ink-100">
                            <th className="px-4 py-3 text-left text-sm font-bold text-ink-900">Account</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Budget</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Actual</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">Variance</th>
                            <th className="px-4 py-3 text-right text-sm font-bold text-ink-900">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartOfAccounts.filter(acc => acc.type === 'Expense').map((acc) => {
                            const budget = acc.balance * 0.95; // Assume budget is 5% lower (good control)
                            const variance = budget - acc.balance; // For expenses, under budget is positive
                            const percentVar = ((variance / budget) * 100).toFixed(1);
                            return (
                              <tr key={acc.id} className="border-b border-ink-100 hover:bg-ink-50">
                                <td className="px-4 py-2 text-sm text-ink-700">{acc.name}</td>
                                <td className="px-4 py-2 text-sm text-right text-ink-900">LKR {budget.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                                <td className="px-4 py-2 text-sm text-right font-semibold text-ink-900">LKR {acc.balance.toLocaleString()}</td>
                                <td className={`px-4 py-2 text-sm text-right font-semibold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  LKR {variance.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                </td>
                                <td className={`px-4 py-2 text-sm text-right font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {percentVar}%
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-red-50 border-t-2 border-red-300 font-bold">
                            <td className="px-4 py-3 text-ink-900">Total Expenses</td>
                            <td className="px-4 py-3 text-right text-ink-900">LKR {(totalExpenses * 0.95).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td className="px-4 py-3 text-right text-red-600">LKR {totalExpenses.toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-red-600">LKR {((totalExpenses * 0.95) - totalExpenses).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td className="px-4 py-3 text-right text-red-600">-5.0%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-ink-50 p-6 rounded-xl border border-ink-200">
                    <h4 className="font-bold text-ink-900 mb-4 text-lg">Budget Performance Summary</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-ink-600 mb-1">Revenue Performance</p>
                        <p className="text-2xl font-bold text-red-600">-9.1%</p>
                        <p className="text-xs text-ink-500 mt-1">Below budget</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-ink-600 mb-1">Expense Control</p>
                        <p className="text-2xl font-bold text-red-600">-5.0%</p>
                        <p className="text-xs text-ink-500 mt-1">Over budget</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-ink-600 mb-1">Net Position</p>
                        <p className="text-2xl font-bold text-orange-600">-14.1%</p>
                        <p className="text-xs text-ink-500 mt-1">Below target</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-ink-100 p-4 bg-ink-50 flex items-center justify-between">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2 bg-white border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 font-semibold transition"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintPDF}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
                >
                  <Download size={18} />
                  Print PDF
                </button>
                <button
                  onClick={handleSaveAsPDF}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
                >
                  <FileText size={18} />
                  Save as PDF
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
                >
                  <FileText size={18} />
                  Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Grant Receivable Modal */}
      {showAddGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 p-6 text-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HandCoins size={24} />
                  <h2 className="text-2xl font-bold">Add Grant Receivable</h2>
                </div>
                <button onClick={() => setShowAddGrant(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addGrantReceivable({
                  donorName: formData.get('donorName'),
                  proposalId: formData.get('proposalId') ? parseInt(formData.get('proposalId')) : null,
                  projectCategory: formData.get('projectCategory'),
                  programmeArea: formData.get('programmeArea'),
                  pledgeAmount: parseFloat(formData.get('pledgeAmount')),
                  pledgeDate: formData.get('pledgeDate'),
                  expectedReceiptDate: formData.get('expectedReceiptDate'),
                  receivedAmount: parseFloat(formData.get('receivedAmount') || 0),
                  currency: formData.get('currency'),
                  notes: formData.get('notes')
                });
                setShowAddGrant(false);
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Donor Organization *</label>
                  <select
                    name="donorName"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select donor...</option>
                    {partners && partners.length > 0 ? (
                      partners.map(partner => (
                        <option key={partner.id} value={partner.name}>{partner.name}</option>
                      ))
                    ) : (
                      <>
                        <option value="UNICEF">UNICEF</option>
                        <option value="World Vision">World Vision</option>
                        <option value="Care International">Care International</option>
                        <option value="Tearfund">Tearfund</option>
                        <option value="Save the Children">Save the Children</option>
                        <option value="Oxfam">Oxfam</option>
                        <option value="Plan International">Plan International</option>
                        <option value="Other">Other</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Link to Proposal (Optional)</label>
                  <select
                    name="proposalId"
                    onChange={(e) => {
                      const proposalId = e.target.value;
                      if (proposalId && proposals) {
                        const proposal = proposals.find(p => p.id === parseInt(proposalId));
                        if (proposal) {
                          // Auto-fill programme area from proposal
                          const programmeAreaInput = e.target.form.querySelector('[name="programmeArea"]');
                          if (programmeAreaInput) {
                            programmeAreaInput.value = proposal.programmeArea || '';
                          }
                        }
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Not linked to proposal</option>
                    {proposals && proposals.length > 0 && proposals.map(proposal => (
                      <option key={proposal.id} value={proposal.id}>
                        {proposal.proposalCode} - {proposal.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-ink-500 mt-1">Link this grant to an approved proposal</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Project Category *</label>
                  <select
                    name="projectCategory"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select project category...</option>
                    <option value="Care for Clean Water">Care for Clean Water</option>
                    <option value="Care for Orphans">Care for Orphans</option>
                    <option value="Care for Education">Care for Education</option>
                    <option value="Sustainable Livelihoods">Sustainable Livelihoods</option>
                    <option value="Seasonal Projects">Seasonal Projects</option>
                    <option value="Emergency Projects">Emergency Projects</option>
                    <option value="Infrastructure for Community">Infrastructure for Community</option>
                    <option value="Care for Medical Support">Care for Medical Support</option>
                    <option value="Community Involvement Program">Community Involvement Program</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Programme Area *</label>
                  <select
                    name="programmeArea"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select programme area...</option>
                    <option value="Child Protection">Child Protection</option>
                    <option value="Education">Education</option>
                    <option value="Education & Technology">Education & Technology</option>
                    <option value="Health">Health</option>
                    <option value="Livelihoods">Livelihoods</option>
                    <option value="Water & Sanitation">Water & Sanitation</option>
                    <option value="Emergency Response">Emergency Response</option>
                    <option value="Community Development">Community Development</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Pledged Amount *</label>
                  <input
                    type="number"
                    name="pledgeAmount"
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Currency</label>
                  <select
                    name="currency"
                    defaultValue="LKR"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    {SUPPORTED_CURRENCIES.map(curr => (
                      <option key={curr.code} value={curr.code}>{curr.code} - {curr.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Pledge Date *</label>
                  <input
                    type="date"
                    name="pledgeDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Expected Receipt Date *</label>
                  <input
                    type="date"
                    name="expectedReceiptDate"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Amount Already Received (Optional)</label>
                <input
                  type="number"
                  name="receivedAmount"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                  placeholder="Additional notes about this grant..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowAddGrant(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold"
                >
                  Add Grant Receivable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grant Detail Modal */}
      {showGrantDetail && selectedGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy-900 p-6 text-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HandCoins size={24} />
                  <h2 className="text-2xl font-bold">Grant Receivable Details</h2>
                </div>
                <button onClick={() => setShowGrantDetail(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`inline-flex px-4 py-2 rounded-full text-sm font-bold ${
                  selectedGrant.status === 'Fully Received'
                    ? 'bg-green-100 text-green-700'
                    : selectedGrant.status === 'Partially Received'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-ink-100 text-ink-700'
                }`}>
                  {selectedGrant.status}
                </span>
              </div>

              {/* Donor & Project Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Donor Organization</p>
                  <p className="text-lg font-bold text-ink-900">{selectedGrant.donorName}</p>
                </div>
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Project Category</p>
                  <p className="text-lg font-bold text-ink-900">{selectedGrant.projectCategory || selectedGrant.projectName}</p>
                  <p className="text-xs text-ink-600 mt-1">{selectedGrant.programmeArea}</p>
                </div>
              </div>

              {/* Proposal Link */}
              {selectedGrant.proposalId && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-xs text-blue-700 mb-1">Linked Proposal</p>
                  <p className="text-sm font-bold text-blue-900">
                    {proposals?.find(p => p.id === selectedGrant.proposalId)?.proposalCode || `Proposal #${selectedGrant.proposalId}`}
                    {proposals?.find(p => p.id === selectedGrant.proposalId)?.title && ` - ${proposals.find(p => p.id === selectedGrant.proposalId).title}`}
                  </p>
                </div>
              )}

              {/* Financial Summary */}
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
                <h3 className="font-bold text-ink-900 mb-3">Financial Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Pledged Amount</p>
                    <p className="text-xl font-bold text-blue-600">
                      LKR {selectedGrant.pledgeAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Received</p>
                    <p className="text-xl font-bold text-green-600">
                      LKR {selectedGrant.receivedAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Outstanding</p>
                    <p className="text-xl font-bold text-orange-600">
                      LKR {(selectedGrant.pledgeAmount - selectedGrant.receivedAmount).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-600">Completion</span>
                    <span className="font-bold text-ink-900">
                      {((selectedGrant.receivedAmount / selectedGrant.pledgeAmount) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-ink-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedGrant.receivedAmount / selectedGrant.pledgeAmount) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Pledge Date</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {new Date(selectedGrant.pledgeDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Expected Receipt Date</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {new Date(selectedGrant.expectedReceiptDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedGrant.notes && (
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-2">Notes</p>
                  <p className="text-sm text-ink-900">{selectedGrant.notes}</p>
                </div>
              )}

              {/* Last Receipt Info */}
              {selectedGrant.lastReceiptDate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-xs text-green-700 mb-2">Last Receipt</p>
                  <p className="text-sm font-semibold text-green-900">
                    Date: {new Date(selectedGrant.lastReceiptDate).toLocaleDateString()}
                  </p>
                  {selectedGrant.lastReceiptNotes && (
                    <p className="text-sm text-green-800 mt-1">{selectedGrant.lastReceiptNotes}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                {selectedGrant.status !== 'Fully Received' && (
                  <button
                    onClick={() => {
                      setShowGrantDetail(false);
                      setShowRecordReceipt(true);
                    }}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
                  >
                    <DollarSign size={18} />
                    Record Receipt
                  </button>
                )}
                <button
                  onClick={() => setShowGrantDetail(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Receipt Modal */}
      {showRecordReceipt && selectedGrant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-xl w-full">
            <div className="bg-navy-900 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DollarSign size={24} />
                  <h2 className="text-2xl font-bold">Record Grant Receipt</h2>
                </div>
                <button onClick={() => setShowRecordReceipt(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const amount = parseFloat(formData.get('amount'));
                const receiptDate = formData.get('receiptDate');
                const notes = formData.get('notes');

                recordReceipt(selectedGrant.id, amount, receiptDate, notes);
                setShowRecordReceipt(false);
                setSelectedGrant(null);
              }}
              className="p-6 space-y-4"
            >
              {/* Grant Info */}
              <div className="bg-ink-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-ink-900 mb-2">{selectedGrant.donorName}</p>
                <p className="text-xs text-ink-600">{selectedGrant.projectName}</p>
                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-ink-100">
                  <div>
                    <p className="text-xs text-ink-600">Outstanding Amount</p>
                    <p className="text-lg font-bold text-orange-600">
                      LKR {(selectedGrant.pledgeAmount - selectedGrant.receivedAmount).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600">Already Received</p>
                    <p className="text-lg font-bold text-green-600">
                      LKR {selectedGrant.receivedAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Receipt Amount *</label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="0.01"
                  max={selectedGrant.pledgeAmount - selectedGrant.receivedAmount}
                  step="0.01"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  placeholder="0.00"
                />
                <p className="text-xs text-ink-500 mt-1">
                  Maximum: LKR {(selectedGrant.pledgeAmount - selectedGrant.receivedAmount).toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Receipt Date *</label>
                <input
                  type="date"
                  name="receiptDate"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  placeholder="Transaction reference, payment method, etc..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowRecordReceipt(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold"
                >
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Fixed Asset Modal */}
      {showAddAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-navy-900 p-6 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={24} />
                  <h2 className="text-2xl font-bold">Add Fixed Asset</h2>
                </div>
                <button onClick={() => setShowAddAsset(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);

                const assetData = {
                  assetCode: formData.get('assetCode'),
                  assetName: formData.get('assetName'),
                  assetType: formData.get('assetType'),
                  acquisitionDate: formData.get('acquisitionDate'),
                  cost: parseFloat(formData.get('cost')),
                  depreciationMethod: formData.get('depreciationMethod'),
                  depreciationRate: parseFloat(formData.get('depreciationRate')),
                  usefulLife: formData.get('usefulLife') ? parseInt(formData.get('usefulLife')) : null,
                  location: formData.get('location'),
                  condition: formData.get('condition'),
                  notes: formData.get('notes')
                };

                addFixedAsset(assetData);
                setShowAddAsset(false);
                e.target.reset();
              }}
              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Asset Code *</label>
                  <input
                    type="text"
                    name="assetCode"
                    required
                    placeholder="e.g., VEH-001, COMP-001"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Asset Type *</label>
                  <select
                    name="assetType"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select type...</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Office Equipment">Office Equipment</option>
                    <option value="IT Equipment">IT Equipment</option>
                    <option value="Equipment">Equipment</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Buildings">Buildings</option>
                    <option value="Land">Land</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Asset Name *</label>
                <input
                  type="text"
                  name="assetName"
                  required
                  placeholder="e.g., Toyota Hiace Van, Dell Laptop"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Acquisition Date *</label>
                  <input
                    type="date"
                    name="acquisitionDate"
                    required
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Cost (LKR) *</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Depreciation Method *</label>
                  <select
                    name="depreciationMethod"
                    required
                    onChange={(e) => {
                      const method = e.target.value;
                      const rateInput = e.target.form.querySelector('[name="depreciationRate"]');
                      const lifeInput = e.target.form.querySelector('[name="usefulLife"]');

                      if (method === 'Reducing Balance') {
                        rateInput.disabled = false;
                        lifeInput.disabled = true;
                        rateInput.value = '20';
                        lifeInput.value = '';
                      } else if (method === 'Straight Line') {
                        rateInput.disabled = true;
                        lifeInput.disabled = false;
                        rateInput.value = '';
                        lifeInput.value = '5';
                      } else {
                        rateInput.disabled = false;
                        lifeInput.disabled = false;
                        rateInput.value = '';
                        lifeInput.value = '';
                      }
                    }}
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select method...</option>
                    <option value="Reducing Balance">Reducing Balance (GERSL Standard 20%)</option>
                    <option value="Straight Line">Straight Line</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Depreciation Rate (%) *</label>
                  <input
                    type="number"
                    name="depreciationRate"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="20.00"
                    defaultValue="20"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-ink-500 mt-1">For Reducing Balance method</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Useful Life (Years)</label>
                <input
                  type="number"
                  name="usefulLife"
                  min="1"
                  placeholder="5"
                  disabled
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none disabled:bg-ink-100"
                />
                <p className="text-xs text-ink-500 mt-1">For Straight Line method</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    required
                    placeholder="e.g., Head Office, Regional Office"
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink-700 mb-2">Condition *</label>
                  <select
                    name="condition"
                    required
                    className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                  >
                    <option value="">Select condition...</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="w-full px-4 py-2 border-2 border-ink-100 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                  placeholder="Additional information about the asset..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowAddAsset(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold"
                >
                  Add Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Detail Modal */}
      {showAssetDetail && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-navy-900 p-6 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{selectedAsset.assetName}</h2>
                  <p className="text-indigo-100 text-sm">{selectedAsset.assetCode}</p>
                </div>
                <button onClick={() => setShowAssetDetail(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Asset Type & Status */}
              <div className="flex items-center justify-between pb-4 border-b border-ink-100">
                <span className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                  {selectedAsset.assetType}
                </span>
                <span className={`inline-flex px-3 py-1.5 rounded-full text-sm font-semibold ${
                  selectedAsset.condition === 'Excellent'
                    ? 'bg-green-100 text-green-700'
                    : selectedAsset.condition === 'Good'
                    ? 'bg-blue-100 text-blue-700'
                    : selectedAsset.condition === 'Fair'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {selectedAsset.condition} Condition
                </span>
              </div>

              {/* Financial Summary */}
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4">
                <h3 className="font-bold text-ink-900 mb-3">Financial Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Original Cost</p>
                    <p className="text-xl font-bold text-blue-600">
                      LKR {selectedAsset.cost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Accumulated Depreciation</p>
                    <p className="text-xl font-bold text-red-600">
                      LKR {selectedAsset.accumulatedDepreciation.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Written Down Value</p>
                    <p className="text-xl font-bold text-green-600">
                      LKR {selectedAsset.writtenDownValue.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-ink-600">Depreciation</span>
                    <span className="font-bold text-ink-900">
                      {((selectedAsset.accumulatedDepreciation / selectedAsset.cost) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-ink-200 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedAsset.accumulatedDepreciation / selectedAsset.cost) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Depreciation Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Depreciation Method</p>
                  <p className="text-sm font-semibold text-ink-900">{selectedAsset.depreciationMethod}</p>
                </div>
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Depreciation Rate</p>
                  <p className="text-sm font-semibold text-ink-900">{selectedAsset.depreciationRate}% per annum</p>
                </div>
              </div>

              {/* Dates & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Acquisition Date</p>
                  <p className="text-sm font-semibold text-ink-900">
                    {new Date(selectedAsset.acquisitionDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-1">Location</p>
                  <p className="text-sm font-semibold text-ink-900">{selectedAsset.location}</p>
                </div>
              </div>

              {/* Notes */}
              {selectedAsset.notes && (
                <div className="bg-ink-50 rounded-lg p-4">
                  <p className="text-xs text-ink-600 mb-2">Notes</p>
                  <p className="text-sm text-ink-900">{selectedAsset.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  onClick={() => {
                    setShowAssetDetail(false);
                    setShowDepreciationSchedule(true);
                  }}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
                >
                  <LineChart size={18} />
                  View Depreciation Schedule
                </button>
                <button
                  onClick={() => setShowAssetDetail(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Depreciation Schedule Modal */}
      {showDepreciationSchedule && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-pop max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-navy-900 p-6 text-white sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Depreciation Schedule</h2>
                  <p className="text-purple-100 text-sm">{selectedAsset.assetName} ({selectedAsset.assetCode})</p>
                </div>
                <button onClick={() => setShowDepreciationSchedule(false)} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 mb-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Original Cost</p>
                    <p className="text-lg font-bold text-purple-600">
                      LKR {selectedAsset.cost.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Method</p>
                    <p className="text-lg font-bold text-purple-600">{selectedAsset.depreciationMethod}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-600 mb-1">Rate</p>
                    <p className="text-lg font-bold text-purple-600">{selectedAsset.depreciationRate}% p.a.</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-ink-100 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-ink-700 uppercase">Year</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-700 uppercase">Opening Balance</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-700 uppercase">Depreciation</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-700 uppercase">Accumulated Depr.</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-ink-700 uppercase">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {getDepreciationSchedule(selectedAsset.id, 10).map((entry) => (
                      <tr key={entry.year} className="hover:bg-ink-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-ink-900">{entry.year}</td>
                        <td className="px-4 py-3 text-right text-ink-900">
                          LKR {entry.openingBalance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-red-600">
                          LKR {entry.depreciation.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          LKR {entry.accumulatedDepreciation.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600">
                          LKR {entry.closingBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
                <button
                  onClick={() => setShowDepreciationSchedule(false)}
                  className="px-6 py-2 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-50 transition font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Bank Account Modal */}
      {showAddBankAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg2 shadow-pop max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-navy-900 text-white p-5 rounded-t-lg2 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-lg">
                    <Wallet size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Add Bank Account</h2>
                    <p className="text-blue-100 text-sm">Create a new bank account</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAddBankAccount(false)}
                  className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Form */}
            <div className="p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  {/* Bank Name */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.bankName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, bankName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="e.g., Commercial Bank"
                    />
                  </div>

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Account Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={bankAccountForm.accountType}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountType: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                    >
                      <option value="Checking">Checking Account</option>
                      <option value="Savings">Savings Account</option>
                      <option value="Current">Current Account</option>
                      <option value="Fixed Deposit">Fixed Deposit</option>
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountNumber}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountNumber: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="e.g., 1234567890"
                    />
                  </div>

                  {/* Account Holder Name */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Account Holder Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.accountHolderName}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, accountHolderName: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="e.g., GERSL Organization"
                    />
                  </div>

                  {/* Branch Code */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Branch Code
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.branchCode}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, branchCode: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="e.g., 001"
                    />
                  </div>

                  {/* SWIFT Code */}
                  <div>
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      SWIFT Code
                    </label>
                    <input
                      type="text"
                      value={bankAccountForm.swiftCode}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, swiftCode: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="e.g., CCEYLKLX"
                    />
                  </div>

                  {/* Opening Balance */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-ink-700 mb-2">
                      Opening Balance (LKR)
                    </label>
                    <input
                      type="number"
                      value={bankAccountForm.openingBalance}
                      onChange={(e) => setBankAccountForm({ ...bankAccountForm, openingBalance: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-ink-100 rounded-lg focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition outline-none"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-ink-50 border-t border-ink-100 p-6 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={() => setShowAddBankAccount(false)}
                className="px-6 py-2.5 border border-ink-200 text-ink-700 rounded-lg hover:bg-ink-100 transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBankAccount}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:shadow-card transition font-semibold flex items-center gap-2"
              >
                <Plus size={18} />
                Add Bank Account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinancePage;
