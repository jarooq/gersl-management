import { Op } from 'sequelize';
import { Bill, Project, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllBills = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, projectId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { billNumber: { [Op.iLike]: `%${search}%` } },
      { vendorName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const { count, rows: bills } = await Bill.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['billDate', 'DESC']],
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      bills,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getBillById = asyncHandler(async (req, res) => {
  const bill = await Bill.findByPk(req.params.id, {
    include: [
      { model: Project, as: 'project' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!bill) throw new NotFoundError('Bill not found');
  res.json({ success: true, data: { bill } });
});

export const createBill = asyncHandler(async (req, res) => {
  const billData = req.body;

  if (!billData.billNumber) {
    const year = new Date().getFullYear();
    const count = await Bill.count();
    billData.billNumber = `BILL-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  billData.balanceDue = parseFloat(billData.totalAmount) - parseFloat(billData.paidAmount || 0);
  if (req.user) billData.createdBy = req.user.id;

  const bill = await Bill.create(billData);
  res.status(201).json({ success: true, message: 'Bill created successfully', data: { bill } });
});

export const updateBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findByPk(req.params.id);
  if (!bill) throw new NotFoundError('Bill not found');

  const updateData = req.body;
  if (updateData.totalAmount !== undefined || updateData.paidAmount !== undefined) {
    const totalAmount = updateData.totalAmount !== undefined ? updateData.totalAmount : bill.totalAmount;
    const paidAmount = updateData.paidAmount !== undefined ? updateData.paidAmount : bill.paidAmount;
    updateData.balanceDue = parseFloat(totalAmount) - parseFloat(paidAmount);

    if (updateData.balanceDue === 0) updateData.status = 'Paid';
    else if (paidAmount > 0) updateData.status = 'Partially Paid';
  }

  await bill.update(updateData);
  res.json({ success: true, message: 'Bill updated successfully', data: { bill } });
});

export const deleteBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findByPk(req.params.id);
  if (!bill) throw new NotFoundError('Bill not found');
  await bill.destroy();
  res.json({ success: true, message: 'Bill deleted successfully' });
});

export const getBillStats = asyncHandler(async (req, res) => {
  const total = await Bill.count();
  const draft = await Bill.count({ where: { status: 'Draft' } });
  const pending = await Bill.count({ where: { status: 'Pending' } });
  const paid = await Bill.count({ where: { status: 'Paid' } });
  const overdue = await Bill.count({
    where: {
      status: { [Op.notIn]: ['Paid', 'Cancelled'] },
      dueDate: { [Op.lt]: new Date() }
    }
  });

  const totalAmount = await Bill.sum('totalAmount') || 0;
  const totalPaid = await Bill.sum('paidAmount') || 0;
  const totalOutstanding = await Bill.sum('balanceDue', {
    where: { status: { [Op.notIn]: ['Paid', 'Cancelled'] } }
  }) || 0;

  res.json({
    success: true,
    data: {
      total, draft, pending, paid, overdue,
      totalAmount: parseFloat(totalAmount),
      totalPaid: parseFloat(totalPaid),
      totalOutstanding: parseFloat(totalOutstanding)
    }
  });
});
