// =============================================================================
// Cash Voucher PDF — printable A5 single-page voucher for any posted cash
// transaction. Used by accountants to attach a physical voucher to the
// receipt/invoice for audit. Auth: owner of the transaction OR any cash-role.
// =============================================================================

import PDFDocument from 'pdfkit';
import asyncHandler from 'express-async-handler';
import { CashAccount, CashTransaction, Expense, Payroll, SalaryAdvance, Bill, User } from '../models/index.js';

const CASH_ROLES = ['Admin', 'CEO', 'Finance Manager', 'Finance Officer', 'Accountant'];

export const renderCashVoucherPdf = asyncHandler(async (req, res) => {
  const tx = await CashTransaction.findByPk(req.params.id, {
    include: [
      { model: CashAccount, as: 'account' },
      { model: User, as: 'performer', attributes: ['id', 'fullName', 'role'] },
      { model: User, as: 'approver',  attributes: ['id', 'fullName', 'role'] },
    ],
  });
  if (!tx) return res.status(404).json({ success: false, message: 'Cash transaction not found' });

  // Authz — cash-team roles only.
  if (!CASH_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden — finance role required' });
  }

  // Resolve the linked source row (if any) so the voucher shows the originating
  // record, not just a generic Payment.
  let sourceLabel = null;
  if (tx.referenceType && tx.referenceId) {
    try {
      switch (tx.referenceType) {
        case 'Expense': {
          const e = await Expense.findByPk(tx.referenceId);
          if (e) sourceLabel = `Expense #${e.id} · ${e.category || ''} · ${e.description || ''}`;
          break;
        }
        case 'SalaryAdvance': {
          const sa = await SalaryAdvance.findByPk(tx.referenceId);
          if (sa) sourceLabel = `Salary Advance #${sa.id}${sa.reason ? ' · ' + sa.reason : ''}`;
          break;
        }
        case 'Bill': {
          const b = await Bill.findByPk(tx.referenceId);
          if (b) sourceLabel = `Bill ${b.billNumber} · ${b.vendorName || ''}`;
          break;
        }
        case 'Payroll': {
          const p = await Payroll.findByPk(tx.referenceId);
          if (p) sourceLabel = `Payroll ${p.payrollCode} · ${p.payPeriodStart} → ${p.payPeriodEnd}`;
          break;
        }
        default:
          sourceLabel = `${tx.referenceType} #${tx.referenceId}`;
      }
    } catch (_) { /* non-fatal */ }
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="voucher-${tx.voucherNo || tx.id}.pdf"`);

  const doc = new PDFDocument({ size: 'A5', margins: { top: 36, bottom: 36, left: 36, right: 36 } });
  doc.pipe(res);

  // ---- Header --------------------------------------------------------------
  doc.fontSize(16).fillColor('#0D1D3D').text('GLOBAL EHSAN RELIEF', { align: 'center' });
  doc.fontSize(9).fillColor('#666').text('Sri Lanka · NGO Management System', { align: 'center' });
  doc.moveDown(0.5);
  const voucherTitle = tx.direction === 'In' ? 'CASH RECEIPT VOUCHER' : 'CASH PAYMENT VOUCHER';
  doc.fontSize(13).fillColor('#000').text(voucherTitle, { align: 'center', underline: true });
  doc.moveDown(0.8);

  // ---- Voucher number + date strip ----------------------------------------
  doc.fontSize(10).fillColor('#000');
  const stripY = doc.y;
  doc.text(`Voucher No: ${tx.voucherNo || '—'}`, 36, stripY);
  doc.text(`Date: ${new Date(tx.occurredAt).toLocaleDateString('en-GB')}`,
           36, stripY, { align: 'right' });
  doc.moveDown(1);

  // ---- Body fields ---------------------------------------------------------
  const row = (label, value, opts = {}) => {
    doc.fontSize(9).fillColor('#666').text(label, { continued: false });
    doc.fontSize(11).fillColor('#000').text(value || '—', { ...opts });
    doc.moveDown(0.3);
  };

  row('Cash Account', `${tx.account?.name || ''} · ${tx.account?.type || ''}`);
  row('Type', tx.transactionType);
  row('Direction', tx.direction === 'In' ? 'Money In' : 'Money Out');
  row('Amount', `${tx.currency || 'LKR'} ${Number(tx.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
  if (tx.payeeName) row('Payee / Source', tx.payeeName);
  if (sourceLabel) row('Linked Record', sourceLabel);
  if (tx.description) row('Description', tx.description);
  if (tx.balanceAfter != null) {
    row('Balance after', `${tx.currency || 'LKR'} ${Number(tx.balanceAfter).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`);
  }
  if (tx.status) row('Status', tx.status);

  doc.moveDown(1.5);

  // ---- Signatures ----------------------------------------------------------
  // Two-up signature block: Prepared by / Approved by, with name + date.
  const sigY = doc.y;
  const colW = (doc.page.width - 72) / 2 - 10;

  doc.fontSize(9).fillColor('#666');
  doc.text('Prepared by', 36, sigY);
  doc.text('Approved by', 36 + colW + 20, sigY);

  doc.moveTo(36, sigY + 40).lineTo(36 + colW, sigY + 40).stroke('#000');
  doc.moveTo(36 + colW + 20, sigY + 40).lineTo(36 + colW + 20 + colW, sigY + 40).stroke('#000');

  doc.fontSize(8).fillColor('#000');
  doc.text(tx.performer?.fullName || '', 36, sigY + 44, { width: colW });
  doc.fontSize(7).fillColor('#666');
  doc.text(tx.performer?.role || '', 36, sigY + 56, { width: colW });

  doc.fontSize(8).fillColor('#000');
  doc.text(tx.approver?.fullName || '____________________', 36 + colW + 20, sigY + 44, { width: colW });
  doc.fontSize(7).fillColor('#666');
  doc.text(tx.approver?.role || '', 36 + colW + 20, sigY + 56, { width: colW });

  doc.fontSize(7).fillColor('#999');
  doc.text(`Generated: ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`, 36, doc.page.height - 50, { align: 'center', width: doc.page.width - 72 });

  doc.end();
});
