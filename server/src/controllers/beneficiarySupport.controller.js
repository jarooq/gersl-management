import sequelize from '../config/database.js';
import { QueryTypes } from 'sequelize';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

// Currencies the org is willing to record support in. Audit flagged that
// LKR was hard-coded; allow the few we actually transact in but reject
// arbitrary strings so reporting math stays sane.
const ALLOWED_SUPPORT_CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];

// ============================================
// GET ALL SUPPORT RECORDS
// ============================================
export const getAllSupport = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    beneficiaryId,
    projectId,
    partnerId,
    department,
    supportType,
    status,
    district,
    division,
    startDate,
    endDate
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const replacements = {};

  // Filters
  if (beneficiaryId) {
    conditions.push('bs.beneficiary_id = :beneficiaryId');
    replacements.beneficiaryId = beneficiaryId;
  }

  if (projectId) {
    conditions.push('bs.project_id = :projectId');
    replacements.projectId = projectId;
  }

  if (partnerId) {
    conditions.push('bs.partner_id = :partnerId');
    replacements.partnerId = partnerId;
  }

  if (department) {
    conditions.push('bs.department = :department');
    replacements.department = department;
  }

  if (supportType) {
    conditions.push('bs.support_type = :supportType');
    replacements.supportType = supportType;
  }

  if (status) {
    conditions.push('bs.status = :status');
    replacements.status = status;
  }

  if (district) {
    conditions.push('bs.support_district = :district');
    replacements.district = district;
  }

  if (division) {
    conditions.push('bs.support_division = :division');
    replacements.division = division;
  }

  if (startDate) {
    conditions.push('bs.support_date >= :startDate');
    replacements.startDate = startDate;
  }

  if (endDate) {
    conditions.push('bs.support_date <= :endDate');
    replacements.endDate = endDate;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM beneficiary_support bs
    ${whereClause}
  `;

  const [{ total }] = await sequelize.query(countQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  // Get support records
  const dataQuery = `
    SELECT
      bs.*,
      b.full_name as beneficiary_name,
      b.nic as beneficiary_nic,
      b.district as beneficiary_district,
      p.name as project_name,
      pt.name as partner_name,
      u.full_name as recorded_by_name
    FROM beneficiary_support bs
    INNER JOIN beneficiaries b ON bs.beneficiary_id = b.id
    LEFT JOIN projects p ON bs.project_id = p.id
    LEFT JOIN partners pt ON bs.partner_id = pt.id
    LEFT JOIN users u ON bs.recorded_by = u.id
    ${whereClause}
    ORDER BY bs.support_date DESC
    LIMIT :limit OFFSET :offset
  `;

  const supportRecords = await sequelize.query(dataQuery, {
    replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      supportRecords,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRecords: parseInt(total),
        limit: parseInt(limit)
      }
    }
  });
});

// ============================================
// GET SINGLE SUPPORT RECORD
// ============================================
export const getSupportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      bs.*,
      b.full_name as beneficiary_name,
      b.nic as beneficiary_nic,
      b.primary_phone as beneficiary_phone,
      b.district as beneficiary_district,
      b.division as beneficiary_division,
      p.name as project_name,
      p.description as project_description,
      pt.name as partner_name,
      pt.country as partner_country,
      u.full_name as recorded_by_name,
      u.email as recorded_by_email,
      u2.full_name as approved_by_name,
      u3.full_name as verified_by_name
    FROM beneficiary_support bs
    INNER JOIN beneficiaries b ON bs.beneficiary_id = b.id
    LEFT JOIN projects p ON bs.project_id = p.id
    LEFT JOIN partners pt ON bs.partner_id = pt.id
    LEFT JOIN users u ON bs.recorded_by = u.id
    LEFT JOIN users u2 ON bs.approved_by = u2.id
    LEFT JOIN users u3 ON bs.verified_by = u3.id
    WHERE bs.id = :id
  `;

  const [support] = await sequelize.query(query, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  if (!support) {
    throw new NotFoundError('Support record not found');
  }

  res.json({
    success: true,
    data: { support }
  });
});

// ============================================
// CREATE SUPPORT RECORD
// ============================================
export const createSupport = asyncHandler(async (req, res) => {
  const supportData = req.body;
  const userId = req.user.id;

  // Verify beneficiary exists AND, when the beneficiary is an orphan, that
  // the orphan record has cleared approval — auditors found we were funding
  // unapproved orphans which violates the donor agreement.
  const [beneficiary] = await sequelize.query(
    `SELECT b.id, b.beneficiary_type, b.orphan_id, o.approval_status AS orphan_approval_status
     FROM beneficiaries b
     LEFT JOIN orphans o ON o.id = b.orphan_id
     WHERE b.id = :beneficiaryId`,
    {
      replacements: { beneficiaryId: supportData.beneficiary_id },
      type: QueryTypes.SELECT
    }
  );

  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  if (
    beneficiary.beneficiary_type === 'Orphan' &&
    beneficiary.orphan_id &&
    beneficiary.orphan_approval_status !== 'Approved'
  ) {
    throw new BadRequestError(
      `Cannot record support: linked orphan (#${beneficiary.orphan_id}) is not in Approved status ` +
      `(currently "${beneficiary.orphan_approval_status || 'Pending'}"). Approve the orphan first.`
    );
  }

  // Currency validation — reject arbitrary 3-letter codes.
  if (supportData.currency && !ALLOWED_SUPPORT_CURRENCIES.includes(supportData.currency)) {
    throw new BadRequestError(`currency must be one of ${ALLOWED_SUPPORT_CURRENCIES.join(', ')}`);
  }

  // Numeric sanity — block negative amounts that would corrupt project rollups.
  for (const numField of ['estimated_value', 'actual_value', 'quantity', 'satisfaction_rating']) {
    if (supportData[numField] != null && supportData[numField] !== '') {
      const n = Number(supportData[numField]);
      if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestError(`${numField} must be a non-negative number`);
      }
    }
  }

  const query = `
    INSERT INTO beneficiary_support (
      beneficiary_id, project_id, department,
      support_type, support_category, support_description,
      quantity, unit, estimated_value, actual_value, currency,
      support_date, support_start_date, support_end_date,
      partner_id, donor_name, funding_source,
      support_location, support_district, support_division,
      status, completion_percentage,
      impact_notes, beneficiary_feedback, satisfaction_rating,
      documentation_url, photos, notes,
      recorded_by
    ) VALUES (
      :beneficiary_id, :project_id, :department,
      :support_type, :support_category, :support_description,
      :quantity, :unit, :estimated_value, :actual_value, :currency,
      :support_date, :support_start_date, :support_end_date,
      :partner_id, :donor_name, :funding_source,
      :support_location, :support_district, :support_division,
      :status, :completion_percentage,
      :impact_notes, :beneficiary_feedback, :satisfaction_rating,
      :documentation_url, :photos, :notes,
      :recorded_by
    )
    RETURNING *
  `;

  const [support] = await sequelize.query(query, {
    replacements: {
      ...supportData,
      photos: supportData.photos ? JSON.stringify(supportData.photos) : null,
      recorded_by: userId,
      status: supportData.status || 'Planned',
      completion_percentage: supportData.completion_percentage || 0,
      currency: supportData.currency || 'LKR'
    },
    type: QueryTypes.INSERT
  });

  res.status(201).json({
    success: true,
    message: 'Support record created successfully',
    data: { support }
  });
});

// ============================================
// UPDATE SUPPORT RECORD
// ============================================
export const updateSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const supportData = req.body;

  // Check if support record exists
  const checkQuery = 'SELECT id FROM beneficiary_support WHERE id = :id';
  const existing = await sequelize.query(checkQuery, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  if (existing.length === 0) {
    throw new NotFoundError('Support record not found');
  }

  // Handle photos JSON
  if (supportData.photos && typeof supportData.photos === 'object') {
    supportData.photos = JSON.stringify(supportData.photos);
  }

  const updateFields = Object.keys(supportData)
    .filter(key => supportData[key] !== undefined && key !== 'id')
    .map(key => `${key} = :${key}`)
    .join(', ');

  const query = `
    UPDATE beneficiary_support
    SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
    WHERE id = :id
    RETURNING *
  `;

  const [support] = await sequelize.query(query, {
    replacements: { ...supportData, id },
    type: QueryTypes.UPDATE
  });

  res.json({
    success: true,
    message: 'Support record updated successfully',
    data: { support }
  });
});

// ============================================
// DELETE SUPPORT RECORD
// ============================================
export const deleteSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sequelize.query(
    'DELETE FROM beneficiary_support WHERE id = :id RETURNING id',
    {
      replacements: { id },
      type: QueryTypes.DELETE
    }
  );

  if (result[0].length === 0) {
    throw new NotFoundError('Support record not found');
  }

  res.json({
    success: true,
    message: 'Support record deleted successfully'
  });
});

// ============================================
// GET SUPPORT STATISTICS
// ============================================
export const getSupportStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, district, department, supportType } = req.query;

  const conditions = [];
  const replacements = {};

  if (startDate) {
    conditions.push('support_date >= :startDate');
    replacements.startDate = startDate;
  }

  if (endDate) {
    conditions.push('support_date <= :endDate');
    replacements.endDate = endDate;
  }

  if (district) {
    conditions.push('support_district = :district');
    replacements.district = district;
  }

  if (department) {
    conditions.push('department = :department');
    replacements.department = department;
  }

  if (supportType) {
    conditions.push('support_type = :supportType');
    replacements.supportType = supportType;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const query = `
    SELECT
      COUNT(*) as total_support_records,
      COUNT(DISTINCT beneficiary_id) as unique_beneficiaries,
      COUNT(DISTINCT project_id) as projects_involved,
      COUNT(DISTINCT partner_id) as partners_involved,
      COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_supports,
      COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress_supports,
      COUNT(CASE WHEN status = 'Planned' THEN 1 END) as planned_supports,
      SUM(actual_value) as total_value_delivered,
      SUM(estimated_value) as total_value_estimated,
      AVG(satisfaction_rating) as average_satisfaction
    FROM beneficiary_support
    ${whereClause}
  `;

  const [stats] = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT
  });

  // Get support type distribution
  const typeQuery = `
    SELECT
      support_type,
      COUNT(*) as count,
      SUM(actual_value) as total_value
    FROM beneficiary_support
    ${whereClause}
    GROUP BY support_type
    ORDER BY count DESC
  `;

  const typeDistribution = await sequelize.query(typeQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  // Get district distribution
  const districtQuery = `
    SELECT
      support_district as district,
      COUNT(*) as count,
      SUM(actual_value) as total_value
    FROM beneficiary_support
    ${whereClause}
    AND support_district IS NOT NULL
    GROUP BY support_district
    ORDER BY count DESC
    LIMIT 10
  `;

  const districtDistribution = await sequelize.query(districtQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  // Get monthly trend (last 12 months)
  const trendQuery = `
    SELECT
      TO_CHAR(support_date, 'YYYY-MM') as month,
      COUNT(*) as count,
      SUM(actual_value) as total_value,
      COUNT(DISTINCT beneficiary_id) as unique_beneficiaries
    FROM beneficiary_support
    WHERE support_date >= CURRENT_DATE - INTERVAL '12 months'
    ${conditions.length > 0 ? 'AND ' + conditions.join(' AND ') : ''}
    GROUP BY TO_CHAR(support_date, 'YYYY-MM')
    ORDER BY month DESC
    LIMIT 12
  `;

  const monthlyTrend = await sequelize.query(trendQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      ...stats,
      typeDistribution,
      districtDistribution,
      monthlyTrend
    }
  });
});

// ============================================
// GET BENEFICIARY SUPPORT HISTORY
// ============================================
export const getBeneficiarySupportHistory = asyncHandler(async (req, res) => {
  const { beneficiaryId } = req.params;

  // Verify beneficiary exists
  const beneficiaryCheck = await sequelize.query(
    'SELECT id, full_name, nic FROM beneficiaries WHERE id = :beneficiaryId',
    {
      replacements: { beneficiaryId },
      type: QueryTypes.SELECT
    }
  );

  if (beneficiaryCheck.length === 0) {
    throw new NotFoundError('Beneficiary not found');
  }

  const query = `
    SELECT
      bs.*,
      p.name as project_name,
      pt.name as partner_name,
      u.full_name as recorded_by_name
    FROM beneficiary_support bs
    LEFT JOIN projects p ON bs.project_id = p.id
    LEFT JOIN partners pt ON bs.partner_id = pt.id
    LEFT JOIN users u ON bs.recorded_by = u.id
    WHERE bs.beneficiary_id = :beneficiaryId
    ORDER BY bs.support_date DESC
  `;

  const supportHistory = await sequelize.query(query, {
    replacements: { beneficiaryId },
    type: QueryTypes.SELECT
  });

  // Get summary statistics
  const summaryQuery = `
    SELECT
      COUNT(*) as total_supports,
      COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed_supports,
      SUM(actual_value) as total_value_received,
      COUNT(DISTINCT project_id) as projects_count,
      COUNT(DISTINCT partner_id) as partners_count,
      MAX(support_date) as last_support_date,
      MIN(support_date) as first_support_date
    FROM beneficiary_support
    WHERE beneficiary_id = :beneficiaryId
  `;

  const [summary] = await sequelize.query(summaryQuery, {
    replacements: { beneficiaryId },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      beneficiary: beneficiaryCheck[0],
      summary,
      supportHistory
    }
  });
});

// ============================================
// GENERATE SUPPORT REPORT
// ============================================
export const generateSupportReport = asyncHandler(async (req, res) => {
  const { district, division, department, supportType, startDate, endDate, groupBy = 'beneficiary' } = req.query;

  const conditions = [];
  const replacements = {};

  if (district) {
    conditions.push('bs.support_district = :district');
    replacements.district = district;
  }

  if (division) {
    conditions.push('bs.support_division = :division');
    replacements.division = division;
  }

  if (department) {
    conditions.push('bs.department = :department');
    replacements.department = department;
  }

  if (supportType) {
    conditions.push('bs.support_type = :supportType');
    replacements.supportType = supportType;
  }

  if (startDate) {
    conditions.push('bs.support_date >= :startDate');
    replacements.startDate = startDate;
  }

  if (endDate) {
    conditions.push('bs.support_date <= :endDate');
    replacements.endDate = endDate;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  let groupByClause, selectClause;

  switch (groupBy) {
    case 'district':
      selectClause = 'bs.support_district as group_name';
      groupByClause = 'bs.support_district';
      break;
    case 'department':
      selectClause = 'bs.department as group_name';
      groupByClause = 'bs.department';
      break;
    case 'project':
      selectClause = 'p.name as group_name';
      groupByClause = 'p.name';
      break;
    case 'partner':
      selectClause = 'pt.name as group_name';
      groupByClause = 'pt.name';
      break;
    default:
      selectClause = 'b.full_name as group_name, b.nic as group_nic';
      groupByClause = 'b.full_name, b.nic';
  }

  const query = `
    SELECT
      ${selectClause},
      COUNT(bs.id) as total_supports,
      COUNT(DISTINCT bs.beneficiary_id) as beneficiaries_count,
      SUM(bs.actual_value) as total_value,
      COUNT(CASE WHEN bs.status = 'Completed' THEN 1 END) as completed_count,
      COUNT(CASE WHEN bs.status = 'In Progress' THEN 1 END) as in_progress_count,
      MIN(bs.support_date) as first_support_date,
      MAX(bs.support_date) as last_support_date
    FROM beneficiary_support bs
    INNER JOIN beneficiaries b ON bs.beneficiary_id = b.id
    LEFT JOIN projects p ON bs.project_id = p.id
    LEFT JOIN partners pt ON bs.partner_id = pt.id
    ${whereClause}
    GROUP BY ${groupByClause}
    ORDER BY total_value DESC
    LIMIT 100
  `;

  const reportData = await sequelize.query(query, {
    replacements,
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      reportData,
      filters: { district, division, department, supportType, startDate, endDate, groupBy }
    }
  });
});
