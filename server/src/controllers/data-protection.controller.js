import { DataProtectionRecord, User } from '../models/index.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { Op } from 'sequelize';

// ============================================
// GET ALL DATA PROTECTION RECORDS
// ============================================
export const getAllDataProtectionRecords = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, recordType, status } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (recordType) where.recordType = recordType;
  if (status) where.status = status;

  const { count, rows: records } = await DataProtectionRecord.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ],
    order: [['recordDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      records,
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
// GET DATA PROTECTION RECORD BY ID
// ============================================
export const getDataProtectionRecordById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await DataProtectionRecord.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  if (!record) {
    throw new NotFoundError('Data protection record not found');
  }

  res.json({
    success: true,
    data: { record }
  });
});

// ============================================
// CREATE DATA PROTECTION RECORD
// ============================================
export const createDataProtectionRecord = asyncHandler(async (req, res) => {
  const recordData = req.body;

  if (!recordData.recordType || !recordData.title || !recordData.recordDate) {
    throw new ValidationError('Record type, title, and date are required');
  }

  // Auto-generate record code
  if (!recordData.recordCode) {
    const typePrefix = {
      'Consent': 'CNT',
      'Data Access Request': 'DAR',
      'Data Breach': 'DBR',
      'Audit': 'AUD'
    };

    const prefix = typePrefix[recordData.recordType] || 'DPR';
    const year = new Date().getFullYear();
    const count = await DataProtectionRecord.count({ where: { recordType: recordData.recordType } });
    recordData.recordCode = `${prefix}-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Validate record type-specific required fields
  if (recordData.recordType === 'Data Access Request' && !recordData.requesterName) {
    throw new ValidationError('Requester name is required for Data Access Requests');
  }

  if (recordData.recordType === 'Data Breach' && !recordData.breachType) {
    throw new ValidationError('Breach type is required for Data Breach records');
  }

  if (req.user) {
    recordData.createdBy = req.user.id;
  }

  const record = await DataProtectionRecord.create(recordData);

  const createdRecord = await DataProtectionRecord.findByPk(record.id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Data protection record created successfully',
    data: { record: createdRecord }
  });
});

// ============================================
// UPDATE DATA PROTECTION RECORD
// ============================================
export const updateDataProtectionRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const record = await DataProtectionRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Data protection record not found');
  }

  // Auto-close if response/completion date is set
  if ((updates.responseDate || updates.completedDate) && record.status === 'Open') {
    updates.status = 'Closed';
  }

  await record.update(updates);

  const updatedRecord = await DataProtectionRecord.findByPk(id, {
    include: [
      { model: User, as: 'creator', attributes: ['id', 'fullName'] }
    ]
  });

  res.json({
    success: true,
    message: 'Data protection record updated successfully',
    data: { record: updatedRecord }
  });
});

// ============================================
// DELETE DATA PROTECTION RECORD
// ============================================
export const deleteDataProtectionRecord = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const record = await DataProtectionRecord.findByPk(id);
  if (!record) {
    throw new NotFoundError('Data protection record not found');
  }

  await record.destroy();

  res.json({
    success: true,
    message: 'Data protection record deleted successfully'
  });
});

// ============================================
// GET CONSENT RECORDS
// ============================================
export const getConsentRecords = asyncHandler(async (req, res) => {
  const { dataSubject, consentType } = req.query;

  const where = { recordType: 'Consent' };
  if (dataSubject) where.dataSubject = { [Op.iLike]: `%${dataSubject}%` };
  if (consentType) where.consentType = consentType;

  const records = await DataProtectionRecord.findAll({
    where,
    order: [['recordDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { records }
  });
});

// ============================================
// GET DATA ACCESS REQUESTS
// ============================================
export const getDataAccessRequests = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = { recordType: 'Data Access Request' };
  if (status) where.status = status;

  const requests = await DataProtectionRecord.findAll({
    where,
    order: [['requestDate', 'DESC']]
  });

  // Check for overdue requests
  const today = new Date();
  const overdueRequests = requests.filter(r => {
    if (r.responseDeadline && r.status === 'Open') {
      return new Date(r.responseDeadline) < today;
    }
    return false;
  });

  res.json({
    success: true,
    data: {
      requests,
      overdueCount: overdueRequests.length
    }
  });
});

// ============================================
// GET DATA BREACHES
// ============================================
export const getDataBreaches = asyncHandler(async (req, res) => {
  const { breachType, status } = req.query;

  const where = { recordType: 'Data Breach' };
  if (breachType) where.breachType = breachType;
  if (status) where.status = status;

  const breaches = await DataProtectionRecord.findAll({
    where,
    order: [['breachDate', 'DESC']]
  });

  res.json({
    success: true,
    data: { breaches }
  });
});

// ============================================
// GET AUDIT RECORDS
// ============================================
export const getAuditRecords = asyncHandler(async (req, res) => {
  const { auditor } = req.query;

  const where = { recordType: 'Audit' };
  if (auditor) where.auditor = { [Op.iLike]: `%${auditor}%` };

  const audits = await DataProtectionRecord.findAll({
    where,
    order: [['auditDate', 'DESC']]
  });

  // Get latest audit
  const latestAudit = audits.length > 0 ? audits[0] : null;

  res.json({
    success: true,
    data: {
      audits,
      latestAudit,
      nextAuditDue: latestAudit?.nextAuditDate || null
    }
  });
});

// ============================================
// GET DATA PROTECTION STATISTICS
// ============================================
export const getDataProtectionStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const where = {};
  if (startDate && endDate) {
    where.recordDate = {
      [Op.between]: [startDate, endDate]
    };
  }

  const total = await DataProtectionRecord.count({ where });

  // Count by record type
  const consentRecords = await DataProtectionRecord.count({ where: { ...where, recordType: 'Consent' } });
  const dataAccessRequests = await DataProtectionRecord.count({ where: { ...where, recordType: 'Data Access Request' } });
  const dataBreaches = await DataProtectionRecord.count({ where: { ...where, recordType: 'Data Breach' } });
  const audits = await DataProtectionRecord.count({ where: { ...where, recordType: 'Audit' } });

  // Count open vs closed
  const open = await DataProtectionRecord.count({ where: { ...where, status: 'Open' } });
  const closed = await DataProtectionRecord.count({ where: { ...where, status: 'Closed' } });

  // Active consents
  const activeConsents = await DataProtectionRecord.count({
    where: {
      ...where,
      recordType: 'Consent',
      consentGiven: true,
      consentWithdrawnDate: null
    }
  });

  // Overdue data access requests
  const today = new Date();
  const overdueRequests = await DataProtectionRecord.count({
    where: {
      ...where,
      recordType: 'Data Access Request',
      status: 'Open',
      responseDeadline: { [Op.lt]: today }
    }
  });

  // Breaches reported to authority
  const reportedBreaches = await DataProtectionRecord.count({
    where: {
      ...where,
      recordType: 'Data Breach',
      breachReportedToAuthority: true
    }
  });

  // Get latest audit
  const latestAudit = await DataProtectionRecord.findOne({
    where: { recordType: 'Audit' },
    order: [['auditDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      total,
      byType: {
        consentRecords,
        dataAccessRequests,
        dataBreaches,
        audits
      },
      byStatus: {
        open,
        closed
      },
      activeConsents,
      overdueRequests,
      reportedBreaches,
      lastAuditDate: latestAudit?.auditDate || null,
      nextAuditDate: latestAudit?.nextAuditDate || null
    }
  });
});
