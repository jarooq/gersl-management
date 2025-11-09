// GERSL Finance Data Cleaner
// Paste this entire file content into browser console

console.clear();
console.log('%c🗑️ GERSL FINANCE DATA CLEANER', 'background: #dc3545; color: white; font-size: 24px; padding: 15px; font-weight: bold; border-radius: 8px;');
console.log('%c Running cleanup...', 'color: #666; font-size: 14px; margin-top: 10px;');

const keysToDelete = [
  'gersl_expenses',
  'gersl_payroll',
  'gersl_budgets',
  'gersl_purchase_orders',
  'gersl_invoices',
  'gersl_bills',
  'gersl_chart_of_accounts',
  'gersl_journal_entries',
  'gersl_bank_transactions',
  'gersl_finance',
  'gersl_settings'
];

let clearedCount = 0;

keysToDelete.forEach(key => {
  const data = localStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      let info = '';

      if (Array.isArray(parsed)) {
        info = `(had ${parsed.length} items)`;
      } else if (typeof parsed === 'object') {
        info = `(had ${Object.keys(parsed).length} properties)`;
      }

      console.log(`%c✓ Clearing: ${key} ${info}`, 'color: #ff6b35; font-weight: bold; font-size: 13px;');
      clearedCount++;
    } catch (e) {
      console.log(`%c✓ Clearing: ${key}`, 'color: #ff6b35; font-weight: bold; font-size: 13px;');
      clearedCount++;
    }
  } else {
    console.log(`%c○ ${key} - already empty`, 'color: #28a745; font-size: 12px;');
  }

  localStorage.removeItem(key);
});

console.log('\n');
console.log(`%c✅ DONE! Cleared ${clearedCount} localStorage keys`, 'background: #28a745; color: white; font-size: 18px; padding: 12px; font-weight: bold; border-radius: 8px; margin-top: 10px;');
console.log('%c Page will reload in 2 seconds...', 'color: #666; font-size: 14px; margin-top: 5px;');

setTimeout(() => {
  window.location.reload();
}, 2000);
