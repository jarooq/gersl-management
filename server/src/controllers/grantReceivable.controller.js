import { Op } from 'sequelize';
import { GrantReceivable, GrantReceipt, Partner, Project, Proposal, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllGrantReceivables = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, donorId, projectId } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { grantCode: { [Op.iLike]: `%${search}%` } },
      { grantName: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (donorId) where.donorId = donorId;
  if (projectId) where.projectId = projectId;

  const { count, rows: grants } = await GrantReceivable.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['grantStartDate', 'DESC']],
    include: [
      { model: Partner, as: 'donor', attributes: ['id', 'name'] },
      { model: Project, as: 'project', attributes: ['id', 'name', 'projectCode'] },
      { model: Proposal, as: 'proposal', attributes: ['id', 'title'] },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: GrantReceipt, as: 'receipts', limit: 5, order: [['receiptDate', 'DESC']] }
    ]
  });

  res.json({
    success: true,
    data: {
      grants,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getGrantReceivableById = asyncHandler(async (req, res) => {
  const grant = await GrantReceivable.findByPk(req.params.id, {
    include: [
      { model: Partner, as: 'donor' },
      { model: Project, as: 'project' },
      { model: Proposal, as: 'proposal' },
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: GrantReceipt, as: 'receipts', order: [['receiptDate', 'DESC']] }
    ]
  });

  if (!grant) throw new NotFoundError('Grant receivable not found');
  res.json({ success: true, data: { grant } });
});

export const createGrantReceivable = asyncHandler(async (req, res) => {
  const grantData = req.body;

  if (!grantData.grantCode) {
    const year = new Date().getFullYear();
    const count = await GrantReceivable.count();
    grantData.grantCode = `GRT-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  grantData.balanceAmount = parseFloat(grantData.totalAmount) - parseFloat(grantData.receivedAmount || 0);
  if (req.user) grantData.createdBy = req.user.id;

  const grant = await GrantReceivable.create(grantData);
  res.status(201).json({ success: true, message: 'Grant receivable created successfully', data: { grant } });
});

export const updateGrantReceivable = asyncHandler(async (req, res) => {
  const grant = await GrantReceivable.findByPk(req.params.id);
  if (!grant) throw new NotFoundError('Grant receivable not found');

  const updateData = req.body;
  if (updateData.totalAmount !== undefined || updateData.receivedAmount !== undefined) {
    const totalAmount = updateData.totalAmount !== undefined ? updateData.totalAmount : grant.totalAmount;
    const receivedAmount = updateData.receivedAmount !== undefined ? updateData.receivedAmount : grant.receivedAmount;
    updateData.balanceAmount = parseFloat(totalAmount) - parseFloat(receivedAmount);

    if (updateData.balanceAmount === 0) updateData.status = 'Fully Received';
    else if (receivedAmount > 0) updateData.status = 'Partially Received';
  }

  await grant.update(updateData);
  res.json({ success: true, message: 'Grant receivable updated successfully', data: { grant } });
});

export const deleteGrantReceivable = asyncHandler(async (req, res) => {
  const grant = await GrantReceivable.findByPk(req.params.id);
  if (!grant) throw new NotFoundError('Grant receivable not found');

  await grant.destroy();
  res.json({ success: true, message: 'Grant receivable deleted successfully' });
});

export const recordGrantReceipt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const receiptData = req.body;

  const grant = await GrantReceivable.findByPk(id);
  if (!grant) throw new NotFoundError('Grant receivable not found');

  // Generate receipt code if not provided
  if (!receiptData.receiptCode) {
    const year = new Date().getFullYear();
    const count = await GrantReceipt.count();
    receiptData.receiptCode = `GR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  receiptData.grantId = id;
  if (req.user) receiptData.createdBy = req.user.id;

  const receipt = await GrantReceipt.create(receiptData);

  // Update grant received amount
  const newReceivedAmount = parseFloat(grant.receivedAmount) + parseFloat(receiptData.amount);
  const balanceAmount = parseFloat(grant.totalAmount) - newReceivedAmount;

  await grant.update({
    receivedAmount: newReceivedAmount,
    balanceAmount: balanceAmount,
    status: balanceAmount === 0 ? 'Fully Received' : 'Partially Received'
  });

  res.status(201).json({ success: true, message: 'Grant receipt recorded successfully', data: { receipt, grant } });
});
