import { Op } from 'sequelize';
import { GrantReceipt, GrantReceivable, BankAccount, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL GRANT RECEIPTS
// ============================================
export const getAllGrantReceipts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, grantId, search } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { receiptCode: { [Op.iLike]: `%${search}%` } },
      { referenceNumber: { [Op.iLike]: `%${search}%` } }
    ];
  }

  if (grantId) where.grantId = grantId;

  const { count, rows: grantReceipts } = await GrantReceipt.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['receiptDate', 'DESC']],
    include: [
      {
        model: GrantReceivable,
        as: 'grant',
        attributes: ['id', 'grantCode', 'grantTitle', 'donorId', 'pledgeAmount']
      },
      {
        model: BankAccount,
        as: 'bankAccount',
        attributes: ['id', 'accountName', 'accountNumber', 'currency']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      grantReceipts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET GRANT RECEIPT BY ID
// ============================================
export const getGrantReceiptById = asyncHandler(async (req, res) => {
  const grantReceipt = await GrantReceipt.findByPk(req.params.id, {
    include: [
      {
        model: GrantReceivable,
        as: 'grant',
        include: [
          { model: User, as: 'creator', attributes: ['id', 'fullName'] }
        ]
      },
      {
        model: BankAccount,
        as: 'bankAccount'
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName', 'email']
      }
    ]
  });

  if (!grantReceipt) {
    throw new NotFoundError('Grant receipt not found');
  }

  res.json({
    success: true,
    data: { grantReceipt }
  });
});

// ============================================
// CREATE GRANT RECEIPT
// ============================================
export const createGrantReceipt = asyncHandler(async (req, res) => {
  const receiptData = req.body;

  // Generate receipt code if not provided
  if (!receiptData.receiptCode) {
    const year = new Date().getFullYear();
    const count = await GrantReceipt.count();
    receiptData.receiptCode = `GR-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  // Set creator
  if (req.user) {
    receiptData.createdBy = req.user.id;
  }

  // Verify grant exists
  const grant = await GrantReceivable.findByPk(receiptData.grantId);
  if (!grant) {
    throw new NotFoundError('Grant receivable not found');
  }

  const grantReceipt = await GrantReceipt.create(receiptData);

  // Update grant receivable with received amount
  const totalReceived = await GrantReceipt.sum('amount', {
    where: { grantId: receiptData.grantId }
  });

  await grant.update({
    receivedAmount: totalReceived || 0,
    status: totalReceived >= grant.pledgeAmount ? 'Fully Received' : 'Partially Received'
  });

  res.status(201).json({
    success: true,
    message: 'Grant receipt created successfully',
    data: { grantReceipt }
  });
});

// ============================================
// UPDATE GRANT RECEIPT
// ============================================
export const updateGrantReceipt = asyncHandler(async (req, res) => {
  const grantReceipt = await GrantReceipt.findByPk(req.params.id);

  if (!grantReceipt) {
    throw new NotFoundError('Grant receipt not found');
  }

  const oldGrant = grantReceipt.grantId;
  const oldAmount = grantReceipt.amount;

  await grantReceipt.update(req.body);

  // Recalculate grant receivable amounts
  const grant = await GrantReceivable.findByPk(grantReceipt.grantId);
  if (grant) {
    const totalReceived = await GrantReceipt.sum('amount', {
      where: { grantId: grantReceipt.grantId }
    });

    await grant.update({
      receivedAmount: totalReceived || 0,
      status: totalReceived >= grant.pledgeAmount ? 'Fully Received' : 'Partially Received'
    });
  }

  // If grant changed, update old grant too
  if (oldGrant !== grantReceipt.grantId) {
    const oldGrantObj = await GrantReceivable.findByPk(oldGrant);
    if (oldGrantObj) {
      const oldTotalReceived = await GrantReceipt.sum('amount', {
        where: { grantId: oldGrant }
      });
      await oldGrantObj.update({
        receivedAmount: oldTotalReceived || 0,
        status: oldTotalReceived >= oldGrantObj.pledgeAmount ? 'Fully Received' : 'Partially Received'
      });
    }
  }

  res.json({
    success: true,
    message: 'Grant receipt updated successfully',
    data: { grantReceipt }
  });
});

// ============================================
// DELETE GRANT RECEIPT
// ============================================
export const deleteGrantReceipt = asyncHandler(async (req, res) => {
  const grantReceipt = await GrantReceipt.findByPk(req.params.id);

  if (!grantReceipt) {
    throw new NotFoundError('Grant receipt not found');
  }

  const grantId = grantReceipt.grantId;
  await grantReceipt.destroy();

  // Recalculate grant receivable amounts
  const grant = await GrantReceivable.findByPk(grantId);
  if (grant) {
    const totalReceived = await GrantReceipt.sum('amount', {
      where: { grantId }
    });

    await grant.update({
      receivedAmount: totalReceived || 0,
      status: totalReceived >= grant.pledgeAmount ? 'Fully Received' :
              totalReceived > 0 ? 'Partially Received' : 'Pledged'
    });
  }

  res.json({
    success: true,
    message: 'Grant receipt deleted successfully'
  });
});

// ============================================
// GET GRANT RECEIPTS BY GRANT
// ============================================
export const getGrantReceiptsByGrant = asyncHandler(async (req, res) => {
  const { grantId } = req.params;

  const grantReceipts = await GrantReceipt.findAll({
    where: { grantId },
    order: [['receiptDate', 'DESC']],
    include: [
      {
        model: BankAccount,
        as: 'bankAccount',
        attributes: ['id', 'accountName', 'accountNumber', 'currency']
      },
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'fullName']
      }
    ]
  });

  // Calculate totals
  const totalReceived = grantReceipts.reduce((sum, receipt) => sum + parseFloat(receipt.amount), 0);

  res.json({
    success: true,
    data: {
      grantReceipts,
      summary: {
        totalReceipts: grantReceipts.length,
        totalReceived: totalReceived.toFixed(2)
      }
    }
  });
});
