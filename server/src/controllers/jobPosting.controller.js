import { Op } from 'sequelize';
import { JobPosting, JobApplication, User } from '../models/index.js';
import { asyncHandler, NotFoundError } from '../middleware/error.middleware.js';

export const getAllJobPostings = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, employmentType } = req.query;
  const offset = (page - 1) * limit;
  const where = {};

  if (search) {
    where[Op.or] = [
      { jobCode: { [Op.iLike]: `%${search}%` } },
      { title: { [Op.iLike]: `%${search}%` } },
      { department: { [Op.iLike]: `%${search}%` } }
    ];
  }
  if (status) where.status = status;
  if (employmentType) where.employmentType = employmentType;

  const { count, rows: jobPostings } = await JobPosting.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['postedDate', 'DESC']],
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: JobApplication, as: 'applications', attributes: ['id', 'status'] }
    ]
  });

  res.json({
    success: true,
    data: {
      jobPostings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

export const getJobPostingById = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findByPk(req.params.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] },
      { model: JobApplication, as: 'applications', order: [['applicationDate', 'DESC']] }
    ]
  });

  if (!jobPosting) throw new NotFoundError('Job posting not found');
  res.json({ success: true, data: { jobPosting } });
});

export const createJobPosting = asyncHandler(async (req, res) => {
  const jobData = req.body;

  if (!jobData.jobCode) {
    const year = new Date().getFullYear();
    const count = await JobPosting.count();
    jobData.jobCode = `JOB-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  if (req.user) jobData.createdBy = req.user.id;

  const jobPosting = await JobPosting.create(jobData);
  res.status(201).json({ success: true, message: 'Job posting created successfully', data: { jobPosting } });
});

export const updateJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findByPk(req.params.id);
  if (!jobPosting) throw new NotFoundError('Job posting not found');

  await jobPosting.update(req.body);
  res.json({ success: true, message: 'Job posting updated successfully', data: { jobPosting } });
});

export const deleteJobPosting = asyncHandler(async (req, res) => {
  const jobPosting = await JobPosting.findByPk(req.params.id);
  if (!jobPosting) throw new NotFoundError('Job posting not found');

  await jobPosting.destroy();
  res.json({ success: true, message: 'Job posting deleted successfully' });
});

export const getJobPostingStats = asyncHandler(async (req, res) => {
  const total = await JobPosting.count();
  const open = await JobPosting.count({ where: { status: 'Open' } });
  const closed = await JobPosting.count({ where: { status: 'Closed' } });

  const totalApplications = await JobApplication.count();
  const pendingApplications = await JobApplication.count({ where: { status: 'Submitted' } });

  res.json({
    success: true,
    data: {
      total, open, closed,
      totalApplications,
      pendingApplications
    }
  });
});

// Job Application handlers
export const submitApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const applicationData = req.body;

  const jobPosting = await JobPosting.findByPk(id);
  if (!jobPosting) throw new NotFoundError('Job posting not found');

  if (jobPosting.status !== 'Open') {
    throw new ValidationError('Job posting is not open for applications');
  }

  applicationData.jobId = id;
  const application = await JobApplication.create(applicationData);

  res.status(201).json({ success: true, message: 'Application submitted successfully', data: { application } });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id, applicationId } = req.params;
  const { status, reviewNotes } = req.body;

  const application = await JobApplication.findOne({
    where: { id: applicationId, jobId: id }
  });

  if (!application) throw new NotFoundError('Application not found');

  await application.update({
    status,
    reviewNotes,
    reviewedBy: req.user?.id
  });

  res.json({ success: true, message: 'Application status updated successfully', data: { application } });
});
