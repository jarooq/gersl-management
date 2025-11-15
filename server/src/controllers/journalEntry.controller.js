import { Op } from 'sequelize';
import { JournalEntry, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

export const getAllJournalEntries = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { entryNumber: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;

  const { count, rows: entries } = await JournalEntry.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['entryDate', 'DESC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    data: {
      entries,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getJournalEntryById = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findByPk(req.params.id, {
    include: [{ model: User, as: 'creator', attributes: ['id', 'fullName'] }]
  });

  if (!entry) throw new NotFoundError('Journal entry not found');
  res.json({ success: true, data: { entry } });
});

export const createJournalEntry = asyncHandler(async (req, res) => {
  const entryData = req.body;

  // Validate that debit equals credit
  if (parseFloat(entryData.totalDebit) !== parseFloat(entryData.totalCredit)) {
    throw new ValidationError('Total debit must equal total credit');
  }

  if (!entryData.entryNumber) {
    const year = new Date().getFullYear();
    const count = await JournalEntry.count();
    entryData.entryNumber = `JE-${year}-${String(count + 1).padStart(5, '0')}`;
  }

  if (req.user) entryData.createdBy = req.user.id;

  const entry = await JournalEntry.create(entryData);
  res.status(201).json({ success: true, message: 'Journal entry created successfully', data: { entry } });
});

export const updateJournalEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findByPk(req.params.id);
  if (!entry) throw new NotFoundError('Journal entry not found');

  if (entry.status === 'Posted') {
    throw new ValidationError('Cannot update posted journal entry');
  }

  const updateData = req.body;
  if (updateData.totalDebit && updateData.totalCredit) {
    if (parseFloat(updateData.totalDebit) !== parseFloat(updateData.totalCredit)) {
      throw new ValidationError('Total debit must equal total credit');
    }
  }

  await entry.update(updateData);
  res.json({ success: true, message: 'Journal entry updated successfully', data: { entry } });
});

export const postJournalEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findByPk(req.params.id);
  if (!entry) throw new NotFoundError('Journal entry not found');

  if (parseFloat(entry.totalDebit) !== parseFloat(entry.totalCredit)) {
    throw new ValidationError('Cannot post entry: debit and credit amounts do not match');
  }

  await entry.update({
    status: 'Posted',
    postedDate: new Date()
  });

  res.json({ success: true, message: 'Journal entry posted successfully', data: { entry } });
});

export const deleteJournalEntry = asyncHandler(async (req, res) => {
  const entry = await JournalEntry.findByPk(req.params.id);
  if (!entry) throw new NotFoundError('Journal entry not found');

  if (entry.status === 'Posted') {
    throw new ValidationError('Cannot delete posted journal entry. Please reverse it instead.');
  }

  await entry.destroy();
  res.json({ success: true, message: 'Journal entry deleted successfully' });
});
