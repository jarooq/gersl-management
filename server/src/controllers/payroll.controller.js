import { Op } from 'sequelize';
import { Payroll, Staff, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllPayroll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, staffId, status, payPeriodStart, payPeriodEnd } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (staffId) where.staffId = staffId;
  if (status) where.status = status;
  if (payPeriodStart) where.payPeriodStart = { [Op.gte]: payPeriodStart };
  if (payPeriodEnd) where.payPeriodEnd = { [Op.lte]: payPeriodEnd };

  const { count, rows: payrolls } = await Payroll.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['payPeriodEnd', 'DESC']],
    include: [
      { model: Staff, as: 'staff', attributes: ['id', 'fullName'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'processor', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      payrolls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getPayrollById = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id, {
    include: [
      { model: Staff, as: 'staff' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'processor', attributes: ['id', 'fullName'] }
    ]
  });

  if (!payroll) throw new NotFoundError('Payroll not found');
  res.json({ success: true, data: { payroll } });
});

export const createPayroll = asyncHandler(async (req, res) => {
  const payrollData = req.body;

  if (!payrollData.payrollCode) {
    const year = new Date().getFullYear();
    const count = await Payroll.count();
    payrollData.payrollCode = `PAY-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Calculate gross and net pay
  const basicSalary = parseFloat(payrollData.basicSalary || 0);
  const allowances = parseFloat(payrollData.allowances || 0);
  const overtimeAmount = parseFloat(payrollData.overtimeAmount || 0);
  const bonuses = parseFloat(payrollData.bonuses || 0);
  const deductions = parseFloat(payrollData.deductions || 0);
  const taxDeduction = parseFloat(payrollData.taxDeduction || 0);
  const epfDeduction = parseFloat(payrollData.epfDeduction || 0);
  const etfDeduction = parseFloat(payrollData.etfDeduction || 0);

  payrollData.grossPay = basicSalary + allowances + overtimeAmount + bonuses;
  payrollData.netPay = payrollData.grossPay - deductions - taxDeduction - epfDeduction - etfDeduction;

  if (req.user) payrollData.createdBy = req.user.id;

  const payroll = await Payroll.create(payrollData);
  res.status(201).json({ success: true, message: 'Payroll created successfully', data: { payroll } });
});

export const updatePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) throw new NotFoundError('Payroll not found');

  const updateData = req.body;

  // Recalculate if any pay components changed
  if (updateData.basicSalary !== undefined || updateData.allowances !== undefined ||
      updateData.overtimeAmount !== undefined || updateData.bonuses !== undefined ||
      updateData.deductions !== undefined || updateData.taxDeduction !== undefined ||
      updateData.epfDeduction !== undefined || updateData.etfDeduction !== undefined) {

    const basicSalary = parseFloat(updateData.basicSalary !== undefined ? updateData.basicSalary : payroll.basicSalary);
    const allowances = parseFloat(updateData.allowances !== undefined ? updateData.allowances : payroll.allowances);
    const overtimeAmount = parseFloat(updateData.overtimeAmount !== undefined ? updateData.overtimeAmount : payroll.overtimeAmount);
    const bonuses = parseFloat(updateData.bonuses !== undefined ? updateData.bonuses : payroll.bonuses);
    const deductions = parseFloat(updateData.deductions !== undefined ? updateData.deductions : payroll.deductions);
    const taxDeduction = parseFloat(updateData.taxDeduction !== undefined ? updateData.taxDeduction : payroll.taxDeduction);
    const epfDeduction = parseFloat(updateData.epfDeduction !== undefined ? updateData.epfDeduction : payroll.epfDeduction);
    const etfDeduction = parseFloat(updateData.etfDeduction !== undefined ? updateData.etfDeduction : payroll.etfDeduction);

    updateData.grossPay = basicSalary + allowances + overtimeAmount + bonuses;
    updateData.netPay = updateData.grossPay - deductions - taxDeduction - epfDeduction - etfDeduction;
  }

  await payroll.update(updateData);
  res.json({ success: true, message: 'Payroll updated successfully', data: { payroll } });
});

export const processPayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) throw new NotFoundError('Payroll not found');

  await payroll.update({
    status: 'Processed',
    processedBy: req.user?.id,
    processedDate: new Date()
  });

  res.json({ success: true, message: 'Payroll processed successfully', data: { payroll } });
});

export const deletePayroll = asyncHandler(async (req, res) => {
  const payroll = await Payroll.findByPk(req.params.id);
  if (!payroll) throw new NotFoundError('Payroll not found');

  await payroll.destroy();
  res.json({ success: true, message: 'Payroll deleted successfully' });
});
