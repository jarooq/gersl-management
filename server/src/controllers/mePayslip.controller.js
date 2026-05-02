// Self-service payslip access for mobile. The Payroll → Staff link uses
// staffId, and Staff has no userId column — so we resolve "my staff record"
// via email match against the authenticated User. If no Staff row exists for
// the user's email, returns an empty list (not an error — the user just has
// no payslip history).

import asyncHandler from 'express-async-handler';
import PDFDocument from 'pdfkit';
import { Payroll, Staff, User } from '../models/index.js';

const fmtCurrency = (n) => {
  if (n == null) return '—';
  return `Rs ${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return String(d); }
};

const findMyStaff = async (req) => {
  const email = req.user?.email?.toLowerCase();
  if (!email) return null;
  return Staff.findOne({ where: { email } });
};

// GET /api/me/payslips
export const listMine = asyncHandler(async (req, res) => {
  const staff = await findMyStaff(req);
  if (!staff) return res.json({ success: true, data: [] });
  const rows = await Payroll.findAll({
    where: { staffId: staff.id },
    order: [['payPeriodEnd', 'DESC']],
    attributes: [
      'id', 'payrollCode', 'payPeriodStart', 'payPeriodEnd',
      'payDate', 'grossPay', 'netPay', 'status'
    ]
  });
  res.json({ success: true, data: rows });
});

// GET /api/me/payslips/:id/pdf — same look as renderPayslipPdf but enforces
// that the payroll belongs to the authenticated user.
export const downloadMine = asyncHandler(async (req, res) => {
  const staff = await findMyStaff(req);
  if (!staff) return res.status(404).json({ success: false, message: 'no payslip on file' });
  const payroll = await Payroll.findOne({
    where: { id: req.params.id, staffId: staff.id },
    include: [{ model: Staff, as: 'staff' }]
  });
  if (!payroll) return res.status(404).json({ success: false, message: 'not found' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="payslip-${payroll.payrollCode}.pdf"`);

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(res);

  doc.fontSize(18).text('Payslip', { align: 'left' });
  doc.fontSize(10).fillColor('#666').text(`${payroll.payrollCode} · ${new Date().toLocaleDateString()}`);
  doc.moveDown();
  doc.fillColor('#000');

  doc.fontSize(12).text(`Employee:   ${staff.fullName}`);
  if (staff.position)   doc.text(`Position:    ${staff.position}`);
  if (staff.department) doc.text(`Department:  ${staff.department}`);
  doc.moveDown(0.5);

  doc.text(`Pay period: ${fmtDate(payroll.payPeriodStart)} – ${fmtDate(payroll.payPeriodEnd)}`);
  if (payroll.payDate) doc.text(`Pay date:   ${fmtDate(payroll.payDate)}`);
  doc.moveDown();

  const row = (label, value, bold = false) => {
    if (bold) doc.font('Helvetica-Bold');
    const y = doc.y;
    doc.text(label, 48, y);
    doc.text(fmtCurrency(value), 0, y, { align: 'right' });
    if (bold) doc.font('Helvetica');
  };

  doc.fontSize(13).text('Earnings', { underline: true });
  doc.fontSize(11);
  row('Basic salary',  payroll.basicSalary);
  row('Allowances',    payroll.allowances);
  row('Overtime',      payroll.overtimeAmount);
  row('Bonuses',       payroll.bonuses);
  doc.moveDown(0.3);
  row('Gross pay',     payroll.grossPay, true);
  doc.moveDown();

  doc.fontSize(13).text('Deductions', { underline: true });
  doc.fontSize(11);
  row('EPF (employee)',    payroll.epfDeduction);
  row('ETF',                payroll.etfDeduction);
  row('PAYE / APIT',        payroll.taxDeduction);
  row('Other deductions',   payroll.deductions);
  doc.moveDown();

  doc.fontSize(14);
  row('Net pay',  payroll.netPay, true);
  doc.fontSize(11);
  doc.moveDown(2);

  doc.text(`Status: ${payroll.status ?? 'Pending'}`);

  doc.moveDown(2);
  doc.fontSize(8).fillColor('#888').text(
    'Computer-generated payslip. For queries contact HR within 30 days of issue.'
  );
  doc.end();
});
