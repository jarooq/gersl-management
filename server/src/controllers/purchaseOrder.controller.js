import { Op } from 'sequelize';
import { PurchaseOrder, Project, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllPurchaseOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, projectId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { poNumber: { [Op.iLike]: `%${search}%` } },
      { vendorName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (projectId) where.projectId = projectId;

  const { count, rows: purchaseOrders } = await PurchaseOrder.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['requestDate', 'DESC']],
    include: [
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      purchaseOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getPurchaseOrderById = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id, {
    include: [
      { model: Project, as: 'project' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: User, as: 'approver', attributes: ['id', 'fullName'] }
    ]
  });

  if (!po) throw new NotFoundError('Purchase order not found');
  res.json({ success: true, data: { purchaseOrder: po } });
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const poData = req.body;

  if (!poData.poNumber) {
    const year = new Date().getFullYear();
    const count = await PurchaseOrder.count();
    poData.poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  if (req.user) poData.createdBy = req.user.id;

  const po = await PurchaseOrder.create(poData);
  res.status(201).json({ success: true, message: 'Purchase order created successfully', data: { purchaseOrder: po } });
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');

  await po.update(req.body);
  res.json({ success: true, message: 'Purchase order updated successfully', data: { purchaseOrder: po } });
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');
  await po.destroy();
  res.json({ success: true, message: 'Purchase order deleted successfully' });
});

export const approvePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findByPk(req.params.id);
  if (!po) throw new NotFoundError('Purchase order not found');

  await po.update({
    status: 'Approved',
    approvedBy: req.user?.id,
    approvalDate: new Date()
  });

  res.json({ success: true, message: 'Purchase order approved successfully', data: { purchaseOrder: po } });
});

export const getPurchaseOrderStats = asyncHandler(async (req, res) => {
  const total = await PurchaseOrder.count();
  const draft = await PurchaseOrder.count({ where: { status: 'Draft' } });
  const pending = await PurchaseOrder.count({ where: { status: 'Pending Approval' } });
  const approved = await PurchaseOrder.count({ where: { status: 'Approved' } });
  const completed = await PurchaseOrder.count({ where: { status: 'Completed' } });

  const totalAmount = await PurchaseOrder.sum('totalAmount') || 0;

  res.json({
    success: true,
    data: {
      total, draft, pending, approved, completed,
      totalAmount: parseFloat(totalAmount)
    }
  });
});
