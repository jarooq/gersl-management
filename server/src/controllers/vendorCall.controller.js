import { Op } from 'sequelize';
import { VendorCall, VendorSubmission, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';

export const getAllVendorCalls = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, category } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { tenderCode: { [Op.iLike]: `%${search}%` } },
      { title: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (category) where.category = category;

  const { count, rows: vendorCalls } = await VendorCall.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['publishedDate', 'DESC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: VendorSubmission, as: 'submissions', attributes: ['id', 'status'] }
    ]
  });

  res.json({
    success: true,
    data: {
      vendorCalls,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getVendorCallById = asyncHandler(async (req, res) => {
  const vendorCall = await VendorCall.findByPk(req.params.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: VendorSubmission, as: 'submissions', order: [['submissionDate', 'DESC']] }
    ]
  });

  if (!vendorCall) throw new NotFoundError('Vendor call not found');
  res.json({ success: true, data: { vendorCall } });
});

export const createVendorCall = asyncHandler(async (req, res) => {
  const vendorCallData = req.body;

  if (!vendorCallData.tenderCode) {
    const year = new Date().getFullYear();
    const count = await VendorCall.count();
    vendorCallData.tenderCode = `TND-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  if (req.user) vendorCallData.createdBy = req.user.id;

  const vendorCall = await VendorCall.create(vendorCallData);
  res.status(201).json({ success: true, message: 'Vendor call created successfully', data: { vendorCall } });
});

export const updateVendorCall = asyncHandler(async (req, res) => {
  const vendorCall = await VendorCall.findByPk(req.params.id);
  if (!vendorCall) throw new NotFoundError('Vendor call not found');

  await vendorCall.update(req.body);
  res.json({ success: true, message: 'Vendor call updated successfully', data: { vendorCall } });
});

export const deleteVendorCall = asyncHandler(async (req, res) => {
  const vendorCall = await VendorCall.findByPk(req.params.id);
  if (!vendorCall) throw new NotFoundError('Vendor call not found');

  await vendorCall.destroy();
  res.json({ success: true, message: 'Vendor call deleted successfully' });
});

export const getVendorCallStats = asyncHandler(async (req, res) => {
  const total = await VendorCall.count();
  const open = await VendorCall.count({ where: { status: 'Open' } });
  const closed = await VendorCall.count({ where: { status: 'Closed' } });
  const awarded = await VendorCall.count({ where: { status: 'Awarded' } });

  const totalSubmissions = await VendorSubmission.count();
  const pendingSubmissions = await VendorSubmission.count({ where: { status: 'Submitted' } });

  res.json({
    success: true,
    data: {
      total, open, closed, awarded,
      totalSubmissions,
      pendingSubmissions
    }
  });
});

// Vendor Submission handlers
export const submitVendorProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const submissionData = req.body;

  const vendorCall = await VendorCall.findByPk(id);
  if (!vendorCall) throw new NotFoundError('Vendor call not found');

  if (vendorCall.status !== 'Open') {
    throw new ValidationError('Vendor call is not open for submissions');
  }

  if (new Date() > new Date(vendorCall.submissionDeadline)) {
    throw new ValidationError('Submission deadline has passed');
  }

  submissionData.vendorCallId = id;
  const submission = await VendorSubmission.create(submissionData);

  res.status(201).json({ success: true, message: 'Vendor proposal submitted successfully', data: { submission } });
});

export const updateSubmissionStatus = asyncHandler(async (req, res) => {
  const { id, submissionId } = req.params;
  const { status, reviewNotes } = req.body;

  const submission = await VendorSubmission.findOne({
    where: { id: submissionId, vendorCallId: id }
  });

  if (!submission) throw new NotFoundError('Submission not found');

  await submission.update({
    status,
    reviewNotes,
    reviewedBy: req.user?.id
  });

  // If status is Awarded, update vendor call
  if (status === 'Awarded') {
    const vendorCall = await VendorCall.findByPk(id);
    if (vendorCall) {
      await vendorCall.update({
        status: 'Awarded',
        awardedTo: submission.vendorName,
        awardAmount: submission.quotedAmount
      });
    }
  }

  res.json({ success: true, message: 'Submission status updated successfully', data: { submission } });
});
