// Payslip PDF — single-page A4 summary of one Payroll record. Mirrors the
// fuel-claim PDF pattern: streams pdfkit output directly, no temp files.
//
// Authz: payroll owner (matched by staffId via Staff.userId), or Finance/HR
// roles. Payroll has no userId column — we derive ownership through Staff.

import PDFDocument from 'pdfkit';
import asyncHandler from 'express-async-handler';
import { Payroll, Staff, User } from '../models/index.js';

const FINANCE_ROLES = ['Admin', 'CEO', 'Finance Manager', 'HR Manager', 'Accountant'];

const fmtCurrency = (n) => {
  if (n == null) return '—';
  const num = Number(n);
  return `Rs ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

export const renderPayslipPdf = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id, {
    include: [{ model: Staff, as: 'staff', include: [{ model: User, as: 'user' }] }]
  });
  if (!payroll) return res.status(404).json({ success: false, message: 'not found' });

  // Owner OR Finance/HR.
  const ownerUserId = payroll.staff?.userId ?? null;
  const isOwner = ownerUserId != null && ownerUserId === req.user.id;
  if (!isOwner && !FINANCE_ROLES.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'forbidden' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="payslip-${payroll.payrollCode}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(res);

  // Header
  doc.fontSize(18).text('Payslip', { align: 'left' });
  doc.fontSize(10).fillColor('#666')
     .text(`${payroll.payrollCode} · Generated ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.fillColor('#000');

  // Staff
  const staff = payroll.staff;
  const fullName = staff?.user?.fullName ?? staff?.fullName ?? '—';
  doc.fontSize(12).text(`Employee:   ${fullName}`);
  if (staff?.designation) doc.text(`Designation: ${staff.designation}`);
  if (staff?.department)  doc.text(`Department:  ${staff.department}`);
  if (staff?.epfNumber)   doc.text(`EPF #:       ${staff.epfNumber}`);
  doc.moveDown(0.5);

  // Period
  doc.text(`Pay period: ${fmtDate(payroll.payPeriodStart)} – ${fmtDate(payroll.payPeriodEnd)}`);
  if (payroll.payDate) doc.text(`Pay date:   ${fmtDate(payroll.payDate)}`);
  doc.moveDown();

  // Earnings table
  doc.fontSize(13).text('Earnings', { underline: true });
  doc.fontSize(11);
  const earningRow = (label, value) => {
    const y = doc.y;
    doc.text(label, 48, y, { continued: false });
    doc.text(fmtCurrency(value), 0, y, { align: 'right' });
  };
  earningRow('Basic salary',  payroll.basicSalary);
  earningRow('Allowances',    payroll.allowances);
  earningRow('Overtime',      payroll.overtimeAmount);
  earningRow('Bonuses',       payroll.bonuses);
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold');
  earningRow('Gross pay',     payroll.grossPay);
  doc.font('Helvetica');
  doc.moveDown();

  // Deductions
  doc.fontSize(13).text('Deductions', { underline: true });
  doc.fontSize(11);
  earningRow('EPF (employee share)', payroll.epfDeduction);
  earningRow('ETF',                  payroll.etfDeduction);
  earningRow('PAYE / APIT',          payroll.taxDeduction);
  earningRow('Other deductions',     payroll.deductions);
  doc.moveDown();

  // Net pay
  doc.fontSize(14).font('Helvetica-Bold');
  earningRow('Net pay',   payroll.netPay);
  doc.font('Helvetica');
  doc.moveDown(2);

  // Payment + status
  doc.fontSize(11);
  doc.text(`Status:         ${payroll.status ?? 'Pending'}`);
  if (payroll.paymentMethod)    doc.text(`Payment method: ${payroll.paymentMethod}`);
  if (payroll.paymentReference) doc.text(`Reference:      ${payroll.paymentReference}`);

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text(
    'This is a computer-generated payslip; signature not required. ' +
    'For queries contact HR within 30 days of issue.',
    { align: 'left' }
  );

  doc.end();
});
