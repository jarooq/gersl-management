// Renders a Purchase Order as standalone HTML for emailing to vendors and
// for the in-app preview/print/download flow. Plain string template — no
// PDF dependency yet (PDFKit/playwright is a separate decision).

const fmt = (amount, currency = 'LKR') => {
  if (amount == null) return '';
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return `${currency} ${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
};

const escape = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const renderPurchaseOrderHTML = (po, opts = {}) => {
  const orgName = opts.orgName || 'Global Ehsan Relief — Sri Lanka';
  const orgAddress = opts.orgAddress || '';
  const lines = po.lines || [];
  const tableRows = lines.length === 0
    ? `<tr><td colspan="5" style="padding:8px;color:#666;">No line items</td></tr>`
    : lines.map(l => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escape(l.itemDescription)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${escape(l.qty)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${escape(l.unit || '')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${escape(l.unitPrice)}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;">${escape(l.lineTotal)}</td>
        </tr>
      `).join('');

  const vendor = po.vendor || {};
  const vendorBlock = `
    <strong>${escape(vendor.vendorName || po.vendorName || '—')}</strong><br/>
    ${escape(vendor.contactPerson || po.vendorContact || '')}<br/>
    ${escape(vendor.email || '')}<br/>
    ${escape(vendor.phone || '')}<br/>
    ${escape(vendor.address || '')}
  `;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${escape(po.poNumber)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:24px;max-width:780px;margin:auto;}
  h1{margin:0 0 4px 0;font-size:20px;}
  table{border-collapse:collapse;width:100%;font-size:13px;}
  th{background:#f4f4f4;text-align:left;padding:8px;border-bottom:2px solid #ddd;}
  .muted{color:#666;font-size:12px;}
  .row{display:flex;justify-content:space-between;gap:24px;margin-top:16px;}
  .panel{flex:1;border:1px solid #eee;padding:12px;border-radius:6px;}
  .totals{margin-top:12px;width:280px;float:right;font-size:13px;}
  .totals td{padding:4px 8px;}
  .totals tr.total td{border-top:2px solid #333;font-weight:bold;}
</style></head>
<body>
  <header>
    <h1>${escape(orgName)}</h1>
    <div class="muted">${escape(orgAddress)}</div>
    <h2 style="margin-top:16px;">Purchase Order ${escape(po.poNumber)}</h2>
    <div class="muted">Issued: ${po.issuedAt ? new Date(po.issuedAt).toLocaleString() : '—'}</div>
  </header>

  <div class="row">
    <div class="panel">
      <div class="muted">Vendor</div>
      ${vendorBlock}
    </div>
    <div class="panel">
      <div class="muted">Delivery</div>
      <strong>By:</strong> ${po.deliveryDate ? new Date(po.deliveryDate).toLocaleDateString() : '—'}<br/>
      <strong>To:</strong> ${escape(po.deliveryAddress || '—')}<br/>
      <strong>Terms:</strong> ${escape(po.paymentTerms || '—')}
    </div>
  </div>

  <h3 style="margin-top:24px;">Items</h3>
  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align:right;">Qty</th>
        <th>Unit</th>
        <th style="text-align:right;">Unit Price</th>
        <th style="text-align:right;">Line Total</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>

  <table class="totals">
    <tr><td>Subtotal</td><td style="text-align:right;">${fmt(po.subtotal, po.currency)}</td></tr>
    <tr><td>Tax</td><td style="text-align:right;">${fmt(po.tax, po.currency)}</td></tr>
    <tr class="total"><td>Total</td><td style="text-align:right;">${fmt(po.totalAmount, po.currency)}</td></tr>
  </table>

  <div style="clear:both"></div>

  ${po.specialInstructions ? `<p style="margin-top:24px;"><strong>Special instructions:</strong> ${escape(po.specialInstructions)}</p>` : ''}

  <p style="margin-top:32px;font-size:12px;color:#666;">
    Reply to this email to acknowledge receipt of this purchase order.
  </p>
</body></html>`;
};
