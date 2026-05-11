import PDFDocument from 'pdfkit';
import { CashAccount, CashTransaction, User } from '../models/index.js';
import { Op } from 'sequelize';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

const fmt = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeCsv = (s) => {
  if (s == null) return '';
  const str = String(s);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildPayload = async (account, fromDate, toDate) => {
  // Server-side opening balance: sum every Posted In/Out before the window.
  // We rebuild from openingBalance to avoid drift if currentBalance is touched
  // by an out-of-band fix. Pending/Rejected/Reversed rows are excluded.
  const priorRows = await CashTransaction.findAll({
    where: {
      cashAccountId: account.id,
      status: 'Posted',
      occurredAt: { [Op.lt]: fromDate }
    },
    attributes: ['direction', 'amount']
  });
  let opening = Number(account.openingBalance || 0);
  for (const r of priorRows) {
    opening += r.direction === 'In' ? Number(r.amount) : -Number(r.amount);
  }
  opening = Number(opening.toFixed(2));

  const rows = await CashTransaction.findAll({
    where: {
      cashAccountId: account.id,
      occurredAt: { [Op.gte]: fromDate, [Op.lte]: toDate }
    },
    include: [{ model: User, as: 'performer', attributes: ['id', 'fullName'] }],
    order: [['occurredAt', 'ASC'], ['id', 'ASC']]
  });

  // Walk rows and stamp running balance for Posted entries.
  let bal = opening;
  let totalReceipts = 0;
  let totalPayments = 0;
  const lines = rows.map(r => {
    const isPosted = r.status === 'Posted';
    const amount = Number(r.amount);
    if (isPosted) {
      if (r.direction === 'In')  { bal += amount; totalReceipts += amount; }
      else                       { bal -= amount; totalPayments += amount; }
    }
    return {
      id: r.id,
      date: r.occurredAt,
      voucherNo: r.voucherNo,
      transactionType: r.transactionType,
      direction: r.direction,
      status: r.status,
      particulars: r.description || r.payeeName || (r.referenceType ? `${r.referenceType}${r.referenceId ? ` #${r.referenceId}` : ''}` : ''),
      receipt: isPosted && r.direction === 'In'  ? amount : null,
      payment: isPosted && r.direction === 'Out' ? amount : null,
      runningBalance: isPosted ? Number(bal.toFixed(2)) : null,
      reference: r.referenceType ? { type: r.referenceType, id: r.referenceId } : null,
      performer: r.performer ? { id: r.performer.id, fullName: r.performer.fullName } : null
    };
  });

  return {
    account: {
      id: account.id,
      name: account.name,
      type: account.type,
      currency: account.currency,
      currentBalance: Number(account.currentBalance)
    },
    period: { from: fromDate.toISOString(), to: toDate.toISOString() },
    opening: Number(opening.toFixed(2)),
    closing: Number(bal.toFixed(2)),
    totals: {
      receipts: Number(totalReceipts.toFixed(2)),
      payments: Number(totalPayments.toFixed(2))
    },
    lines
  };
};

const renderHtml = (payload) => {
  const a = payload.account;
  const head = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cash Book — ${escapeHtml(a.name)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:20px;}
  h1{margin:0;font-size:18px;}
  .muted{color:#666;font-size:12px;}
  table{border-collapse:collapse;width:100%;font-size:12px;margin-top:12px;}
  th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;}
  th{background:#f4f4f4;}
  .num{text-align:right;font-variant-numeric:tabular-nums;}
  tr.pending td{color:#a16207;}
  tr.rejected td,tr.reversed td{color:#999;text-decoration:line-through;}
  tfoot td{border-top:2px solid #333;font-weight:bold;}
  .summary{margin-top:8px;font-size:12px;}
</style></head><body>
<h1>Cash Book — ${escapeHtml(a.name)}</h1>
<div class="muted">${a.type} · ${a.currency} · ${escapeHtml(new Date(payload.period.from).toLocaleDateString())} → ${escapeHtml(new Date(payload.period.to).toLocaleDateString())}</div>
<table>
  <thead>
    <tr>
      <th>Date</th><th>Voucher</th><th>Type</th><th>Particulars</th>
      <th class="num">Receipt</th><th class="num">Payment</th><th class="num">Balance</th>
    </tr>
  </thead>
  <tbody>
    <tr><td colspan="6"><em>Opening balance</em></td><td class="num">${fmt(payload.opening)}</td></tr>
    ${payload.lines.map(l => `
      <tr class="${l.status?.toLowerCase()}">
        <td>${escapeHtml(new Date(l.date).toLocaleDateString())}</td>
        <td>${escapeHtml(l.voucherNo || '')}</td>
        <td>${escapeHtml(l.transactionType)}</td>
        <td>${escapeHtml(l.particulars)}${l.status !== 'Posted' ? ` <em>(${l.status})</em>` : ''}</td>
        <td class="num">${l.receipt != null ? fmt(l.receipt) : ''}</td>
        <td class="num">${l.payment != null ? fmt(l.payment) : ''}</td>
        <td class="num">${l.runningBalance != null ? fmt(l.runningBalance) : ''}</td>
      </tr>`).join('')}
  </tbody>
  <tfoot>
    <tr>
      <td colspan="4" class="num">Period totals</td>
      <td class="num">${fmt(payload.totals.receipts)}</td>
      <td class="num">${fmt(payload.totals.payments)}</td>
      <td class="num">${fmt(payload.closing)}</td>
    </tr>
  </tfoot>
</table>
<p class="summary">Opening ${fmt(payload.opening)} + Receipts ${fmt(payload.totals.receipts)} − Payments ${fmt(payload.totals.payments)} = Closing ${fmt(payload.closing)}</p>
</body></html>`;
  return head;
};

const renderCsv = (payload) => {
  const header = ['Date', 'Voucher', 'Type', 'Particulars', 'Receipt', 'Payment', 'Balance', 'Status'];
  const rows = [header];
  rows.push(['', '', '', 'Opening balance', '', '', payload.opening, '']);
  for (const l of payload.lines) {
    rows.push([
      new Date(l.date).toISOString().slice(0, 10),
      l.voucherNo || '',
      l.transactionType,
      l.particulars || '',
      l.receipt != null ? l.receipt : '',
      l.payment != null ? l.payment : '',
      l.runningBalance != null ? l.runningBalance : '',
      l.status
    ]);
  }
  rows.push(['', '', '', 'Period totals', payload.totals.receipts, payload.totals.payments, payload.closing, '']);
  return rows.map(r => r.map(escapeCsv).join(',')).join('\n');
};

// PDF render — landscape A4 with a tabular ledger. Uses pdfkit (same lib as
// voucher / payslip / fuel-claim PDFs) so no new dependency.
const streamPdf = (res, payload) => {
  const a = payload.account;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `inline; filename="cashbook-${a.id}-${new Date(payload.period.from).toISOString().slice(0,10)}-${new Date(payload.period.to).toISOString().slice(0,10)}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margins: { top: 36, bottom: 36, left: 36, right: 36 } });
  doc.pipe(res);

  // Header
  doc.fontSize(15).fillColor('#0D1D3D').text('Cash Book', { align: 'left' });
  doc.fontSize(11).fillColor('#000').text(`${a.name} · ${a.type} · ${a.currency}`);
  doc.fontSize(9).fillColor('#666').text(
    `${new Date(payload.period.from).toLocaleDateString('en-GB')} → ${new Date(payload.period.to).toLocaleDateString('en-GB')}`
  );
  doc.moveDown(0.8);

  // Column geometry
  const pageW = doc.page.width - 72;
  const cols = [
    { key: 'date',     label: 'Date',        w: 65,  align: 'left'  },
    { key: 'voucher',  label: 'Voucher',     w: 70,  align: 'left'  },
    { key: 'type',     label: 'Type',        w: 60,  align: 'left'  },
    { key: 'parts',    label: 'Particulars', w: 0,   align: 'left'  }, // flexes
    { key: 'receipt',  label: 'Receipt',     w: 75,  align: 'right' },
    { key: 'payment',  label: 'Payment',     w: 75,  align: 'right' },
    { key: 'balance',  label: 'Balance',     w: 85,  align: 'right' },
  ];
  const fixed = cols.reduce((s, c) => s + c.w, 0);
  cols[3].w = pageW - fixed; // particulars takes the rest

  const drawRow = (vals, opts = {}) => {
    const y = doc.y;
    let x = 36;
    doc.fontSize(opts.bold ? 9 : 8.5).fillColor(opts.color || '#000');
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      const v = vals[i] ?? '';
      doc.text(String(v), x + 2, y + 2, { width: c.w - 4, align: c.align, ellipsis: true, lineBreak: false });
      x += c.w;
    }
    doc.y = y + 14;
    doc.moveTo(36, doc.y).lineTo(36 + pageW, doc.y).strokeColor('#eee').stroke();
  };

  // Header row
  drawRow(cols.map(c => c.label), { bold: true });

  // Opening balance row
  drawRow(['', '', '', 'Opening balance', '', '', fmt(payload.opening)], { color: '#444' });

  // Body
  for (const l of payload.lines) {
    if (doc.y > doc.page.height - 80) {
      doc.addPage();
    }
    const color = l.status === 'Posted' ? '#000' : '#999';
    drawRow([
      new Date(l.date).toLocaleDateString('en-GB'),
      l.voucherNo || '',
      l.transactionType,
      l.particulars + (l.status !== 'Posted' ? ` (${l.status})` : ''),
      l.receipt != null ? fmt(l.receipt) : '',
      l.payment != null ? fmt(l.payment) : '',
      l.runningBalance != null ? fmt(l.runningBalance) : '',
    ], { color });
  }

  // Totals row
  doc.moveDown(0.3);
  doc.moveTo(36, doc.y).lineTo(36 + pageW, doc.y).strokeColor('#333').stroke();
  drawRow(
    ['', '', '', 'Period totals', fmt(payload.totals.receipts), fmt(payload.totals.payments), fmt(payload.closing)],
    { bold: true, color: '#0D1D3D' }
  );

  // Summary line
  doc.moveDown(0.6);
  doc.fontSize(9).fillColor('#444').text(
    `Opening ${fmt(payload.opening)}  +  Receipts ${fmt(payload.totals.receipts)}  −  Payments ${fmt(payload.totals.payments)}  =  Closing ${fmt(payload.closing)}`
  );

  // Footer timestamp
  doc.fontSize(7).fillColor('#999').text(
    `Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
    36, doc.page.height - 36, { align: 'right', width: pageW }
  );

  doc.end();
};

export const getCashBookReport = asyncHandler(async (req, res) => {
  const account = await CashAccount.findByPk(req.params.id);
  if (!account) throw new NotFoundError('Cash account not found');

  const fromDate = req.query.from
    ? new Date(req.query.from)
    : (() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; })();
  const toDate = req.query.to ? new Date(req.query.to) : new Date();
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new BadRequestError('Invalid date range');
  }
  if (fromDate > toDate) {
    throw new BadRequestError('from must be <= to');
  }

  const payload = await buildPayload(account, fromDate, toDate);
  const format = String(req.query.format || 'json').toLowerCase();

  if (format === 'html') {
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(renderHtml(payload));
  }
  if (format === 'csv') {
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', `attachment; filename="cashbook-${account.id}-${new Date(payload.period.from).toISOString().slice(0,10)}-${new Date(payload.period.to).toISOString().slice(0,10)}.csv"`);
    return res.send(renderCsv(payload));
  }
  if (format === 'pdf') {
    return streamPdf(res, payload);
  }
  if (format !== 'json') {
    throw new BadRequestError('format must be one of: json, html, csv, pdf');
  }

  res.json({ success: true, data: payload });
});
