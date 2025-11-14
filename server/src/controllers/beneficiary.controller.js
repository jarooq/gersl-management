import sequelize from '../config/database.js';
import { Op, QueryTypes } from 'sequelize';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

// ============================================
// GET ALL BENEFICIARIES
// ============================================
export const getAllBeneficiaries = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    district,
    division,
    isVulnerable,
    isActive = 'true'
  } = req.query;

  const offset = (page - 1) * limit;
  const conditions = [];
  const replacements = {};

  // Search filter
  if (search) {
    conditions.push(`(
      b.full_name ILIKE :search OR
      b.nic ILIKE :search OR
      b.primary_phone ILIKE :search
    )`);
    replacements.search = `%${search}%`;
  }

  // District filter
  if (district) {
    conditions.push('b.district = :district');
    replacements.district = district;
  }

  // Division filter
  if (division) {
    conditions.push('b.division = :division');
    replacements.division = division;
  }

  // Vulnerability filter
  if (isVulnerable !== undefined && isVulnerable !== '') {
    conditions.push('b.is_vulnerable = :isVulnerable');
    replacements.isVulnerable = isVulnerable === 'true';
  }

  // Active status filter
  if (isActive !== undefined && isActive !== '') {
    conditions.push('b.is_active = :isActive');
    replacements.isActive = isActive === 'true';
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM beneficiaries b
    ${whereClause}
  `;

  const [{ total }] = await sequelize.query(countQuery, {
    replacements,
    type: QueryTypes.SELECT
  });

  // Get beneficiaries with support summary
  const dataQuery = `
    SELECT
      b.*,
      u.full_name as registered_by_name,
      COALESCE(support_summary.total_supports, 0) as total_supports,
      COALESCE(support_summary.completed_supports, 0) as completed_supports,
      COALESCE(support_summary.total_value, 0) as total_value,
      support_summary.last_support_date
    FROM beneficiaries b
    LEFT JOIN users u ON b.registered_by = u.id
    LEFT JOIN (
      SELECT
        beneficiary_id,
        COUNT(*) as total_supports,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_supports,
        SUM(actual_value) as total_value,
        MAX(support_date) as last_support_date
      FROM beneficiary_support
      GROUP BY beneficiary_id
    ) support_summary ON b.id = support_summary.beneficiary_id
    ${whereClause}
    ORDER BY b.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const beneficiaries = await sequelize.query(dataQuery, {
    replacements: { ...replacements, limit: parseInt(limit), offset: parseInt(offset) },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      beneficiaries,
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
// GET SINGLE BENEFICIARY BY ID
// ============================================
export const getBeneficiaryById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      b.*,
      u.full_name as registered_by_name,
      u.email as registered_by_email
    FROM beneficiaries b
    LEFT JOIN users u ON b.registered_by = u.id
    WHERE b.id = :id
  `;

  const [beneficiary] = await sequelize.query(query, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  if (!beneficiary) {
    throw new NotFoundError('Beneficiary not found');
  }

  // Get support history
  const supportQuery = `
    SELECT
      bs.*,
      p.name as project_name,
      pt.name as partner_name,
      u.full_name as recorded_by_name
    FROM beneficiary_support bs
    LEFT JOIN projects p ON bs.project_id = p.id
    LEFT JOIN partners pt ON bs.partner_id = pt.id
    LEFT JOIN users u ON bs.recorded_by = u.id
    WHERE bs.beneficiary_id = :id
    ORDER BY bs.support_date DESC
  `;

  const supportHistory = await sequelize.query(supportQuery, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  // Get documents
  const documentsQuery = `
    SELECT
      bd.*,
      u.full_name as uploaded_by_name
    FROM beneficiary_documents bd
    LEFT JOIN users u ON bd.uploaded_by = u.id
    WHERE bd.beneficiary_id = :id
    ORDER BY bd.upload_date DESC
  `;

  const documents = await sequelize.query(documentsQuery, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      beneficiary,
      supportHistory,
      documents
    }
  });
});

// ============================================
// CHECK DUPLICATE BY NIC
// ============================================
export const checkDuplicateByNIC = asyncHandler(async (req, res) => {
  const { nic } = req.query;

  if (!nic) {
    throw new BadRequestError('NIC is required');
  }

  const query = `
    SELECT
      b.*,
      u.full_name as registered_by_name,
      COALESCE(support_summary.total_supports, 0) as total_supports,
      COALESCE(support_summary.total_value, 0) as total_value,
      support_summary.last_support_date
    FROM beneficiaries b
    LEFT JOIN users u ON b.registered_by = u.id
    LEFT JOIN (
      SELECT
        beneficiary_id,
        COUNT(*) as total_supports,
        SUM(actual_value) as total_value,
        MAX(support_date) as last_support_date
      FROM beneficiary_support
      GROUP BY beneficiary_id
    ) support_summary ON b.id = support_summary.beneficiary_id
    WHERE b.nic = :nic
  `;

  const [existingBeneficiary] = await sequelize.query(query, {
    replacements: { nic },
    type: QueryTypes.SELECT
  });

  if (existingBeneficiary) {
    // Get recent support history
    const recentSupportQuery = `
      SELECT
        bs.support_date,
        bs.support_type,
        bs.support_description,
        bs.actual_value,
        p.name as project_name,
        pt.name as partner_name
      FROM beneficiary_support bs
      LEFT JOIN projects p ON bs.project_id = p.id
      LEFT JOIN partners pt ON bs.partner_id = pt.id
      WHERE bs.beneficiary_id = :beneficiaryId
      ORDER BY bs.support_date DESC
      LIMIT 5
    `;

    const recentSupport = await sequelize.query(recentSupportQuery, {
      replacements: { beneficiaryId: existingBeneficiary.id },
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        exists: true,
        beneficiary: existingBeneficiary,
        recentSupport
      }
    });
  } else {
    res.json({
      success: true,
      data: {
        exists: false
      }
    });
  }
});

// ============================================
// CREATE BENEFICIARY
// ============================================
export const createBeneficiary = asyncHandler(async (req, res) => {
  const beneficiaryData = req.body;
  const userId = req.user.id;

  // Check for duplicate NIC
  const duplicateCheck = await sequelize.query(
    'SELECT id FROM beneficiaries WHERE nic = :nic',
    {
      replacements: { nic: beneficiaryData.nic },
      type: QueryTypes.SELECT
    }
  );

  if (duplicateCheck.length > 0) {
    throw new BadRequestError('A beneficiary with this NIC already exists');
  }

  const query = `
    INSERT INTO beneficiaries (
      nic, full_name, name_with_initials, date_of_birth, gender,
      primary_phone, secondary_phone, email,
      address_line1, address_line2, city, district, division, province, postal_code,
      latitude, longitude,
      household_size, number_of_children, household_head_name, household_head_relation,
      income_level, employment_status, education_level,
      is_vulnerable, vulnerability_type, disability_details, special_needs,
      notes, profile_photo,
      registered_by, registered_date, is_active
    ) VALUES (
      :nic, :full_name, :name_with_initials, :date_of_birth, :gender,
      :primary_phone, :secondary_phone, :email,
      :address_line1, :address_line2, :city, :district, :division, :province, :postal_code,
      :latitude, :longitude,
      :household_size, :number_of_children, :household_head_name, :household_head_relation,
      :income_level, :employment_status, :education_level,
      :is_vulnerable, :vulnerability_type, :disability_details, :special_needs,
      :notes, :profile_photo,
      :registered_by, :registered_date, :is_active
    )
    RETURNING *
  `;

  const [beneficiary] = await sequelize.query(query, {
    replacements: {
      ...beneficiaryData,
      registered_by: userId,
      registered_date: beneficiaryData.registered_date || new Date(),
      is_active: beneficiaryData.is_active !== undefined ? beneficiaryData.is_active : true
    },
    type: QueryTypes.INSERT
  });

  res.status(201).json({
    success: true,
    message: 'Beneficiary registered successfully',
    data: { beneficiary }
  });
});

// ============================================
// UPDATE BENEFICIARY
// ============================================
export const updateBeneficiary = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const beneficiaryData = req.body;

  // Check if beneficiary exists
  const checkQuery = 'SELECT id FROM beneficiaries WHERE id = :id';
  const existing = await sequelize.query(checkQuery, {
    replacements: { id },
    type: QueryTypes.SELECT
  });

  if (existing.length === 0) {
    throw new NotFoundError('Beneficiary not found');
  }

  // Check for duplicate NIC if NIC is being updated
  if (beneficiaryData.nic) {
    const duplicateCheck = await sequelize.query(
      'SELECT id FROM beneficiaries WHERE nic = :nic AND id != :id',
      {
        replacements: { nic: beneficiaryData.nic, id },
        type: QueryTypes.SELECT
      }
    );

    if (duplicateCheck.length > 0) {
      throw new BadRequestError('A beneficiary with this NIC already exists');
    }
  }

  const updateFields = Object.keys(beneficiaryData)
    .filter(key => beneficiaryData[key] !== undefined)
    .map(key => `${key} = :${key}`)
    .join(', ');

  const query = `
    UPDATE beneficiaries
    SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
    WHERE id = :id
    RETURNING *
  `;

  const [beneficiary] = await sequelize.query(query, {
    replacements: { ...beneficiaryData, id },
    type: QueryTypes.UPDATE
  });

  res.json({
    success: true,
    message: 'Beneficiary updated successfully',
    data: { beneficiary }
  });
});

// ============================================
// DELETE BENEFICIARY
// ============================================
export const deleteBeneficiary = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const result = await sequelize.query(
    'DELETE FROM beneficiaries WHERE id = :id RETURNING id',
    {
      replacements: { id },
      type: QueryTypes.DELETE
    }
  );

  if (result[0].length === 0) {
    throw new NotFoundError('Beneficiary not found');
  }

  res.json({
    success: true,
    message: 'Beneficiary deleted successfully'
  });
});

// ============================================
// GET BENEFICIARY STATISTICS
// ============================================
export const getBeneficiaryStats = asyncHandler(async (req, res) => {
  const query = `
    SELECT
      COUNT(*) as total_beneficiaries,
      COUNT(CASE WHEN is_active = true THEN 1 END) as active_beneficiaries,
      COUNT(CASE WHEN is_vulnerable = true THEN 1 END) as vulnerable_beneficiaries,
      COUNT(DISTINCT district) as districts_covered,
      COUNT(DISTINCT division) as divisions_covered
    FROM beneficiaries
  `;

  const [stats] = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });

  // Get district-wise distribution
  const districtQuery = `
    SELECT
      district,
      COUNT(*) as count
    FROM beneficiaries
    WHERE is_active = true
    GROUP BY district
    ORDER BY count DESC
    LIMIT 10
  `;

  const districtStats = await sequelize.query(districtQuery, {
    type: QueryTypes.SELECT
  });

  // Get gender distribution
  const genderQuery = `
    SELECT
      gender,
      COUNT(*) as count
    FROM beneficiaries
    WHERE is_active = true AND gender IS NOT NULL
    GROUP BY gender
  `;

  const genderStats = await sequelize.query(genderQuery, {
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: {
      ...stats,
      districtStats,
      genderStats
    }
  });
});

// ============================================
// GET DISTRICTS LIST
// ============================================
export const getDistricts = asyncHandler(async (req, res) => {
  const query = `
    SELECT DISTINCT district
    FROM beneficiaries
    WHERE district IS NOT NULL
    ORDER BY district ASC
  `;

  const districts = await sequelize.query(query, {
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: { districts: districts.map(d => d.district) }
  });
});

// ============================================
// GET DS DIVISIONS BY DISTRICT
// ============================================
export const getDivisionsByDistrict = asyncHandler(async (req, res) => {
  const { district } = req.query;

  if (!district) {
    throw new BadRequestError('District is required');
  }

  const query = `
    SELECT DISTINCT ds_division
    FROM beneficiaries
    WHERE district = :district AND ds_division IS NOT NULL
    ORDER BY ds_division ASC
  `;

  const divisions = await sequelize.query(query, {
    replacements: { district },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: { divisions: divisions.map(d => d.ds_division) }
  });
});

// ============================================
// GET GN DIVISIONS BY DS DIVISION
// ============================================
export const getGNDivisionsByDSDivision = asyncHandler(async (req, res) => {
  const { ds_division } = req.query;

  if (!ds_division) {
    throw new BadRequestError('DS Division is required');
  }

  const query = `
    SELECT DISTINCT gn_division
    FROM beneficiaries
    WHERE ds_division = :ds_division AND gn_division IS NOT NULL
    ORDER BY gn_division ASC
  `;

  const gnDivisions = await sequelize.query(query, {
    replacements: { ds_division },
    type: QueryTypes.SELECT
  });

  res.json({
    success: true,
    data: { gn_divisions: gnDivisions.map(d => d.gn_division) }
  });
});

// ============================================
// BULK IMPORT
// ============================================

// @desc    Bulk import beneficiaries from Excel/CSV
// @route   POST /api/beneficiaries/bulk-import
// @access  Private (Create permission)
export const bulkImportBeneficiaries = asyncHandler(async (req, res) => {
  const { beneficiaries } = req.body;

  if (!Array.isArray(beneficiaries) || beneficiaries.length === 0) {
    throw new BadRequestError('No beneficiary data provided');
  }

  const results = {
    total: beneficiaries.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  const createdBeneficiaries = [];

  // Process each beneficiary
  for (let i = 0; i < beneficiaries.length; i++) {
    try {
      const beneficiaryData = beneficiaries[i];

      // Set default is_active if not specified
      if (beneficiaryData.is_active === undefined) {
        beneficiaryData.is_active = true;
      }

      // Set default is_vulnerable if not specified
      if (beneficiaryData.is_vulnerable === undefined) {
        beneficiaryData.is_vulnerable = false;
      }

      // Create beneficiary using raw SQL INSERT
      const query = `
        INSERT INTO beneficiaries (
          nic, full_name, age, gender, beneficiary_type, district,
          ds_division, gn_division, address, primary_phone, secondary_phone,
          email, household_size, monthly_income, notes, is_active, is_vulnerable,
          created_at, updated_at
        ) VALUES (
          :nic, :full_name, :age, :gender, :beneficiary_type, :district,
          :ds_division, :gn_division, :address, :primary_phone, :secondary_phone,
          :email, :household_size, :monthly_income, :notes, :is_active, :is_vulnerable,
          NOW(), NOW()
        ) RETURNING id
      `;

      const result = await sequelize.query(query, {
        replacements: {
          nic: beneficiaryData.nic,
          full_name: beneficiaryData.full_name,
          age: beneficiaryData.age,
          gender: beneficiaryData.gender,
          beneficiary_type: beneficiaryData.beneficiary_type,
          district: beneficiaryData.district,
          ds_division: beneficiaryData.ds_division,
          gn_division: beneficiaryData.gn_division || null,
          address: beneficiaryData.address || null,
          primary_phone: beneficiaryData.primary_phone || null,
          secondary_phone: beneficiaryData.secondary_phone || null,
          email: beneficiaryData.email || null,
          household_size: beneficiaryData.household_size || null,
          monthly_income: beneficiaryData.monthly_income || null,
          notes: beneficiaryData.notes || null,
          is_active: beneficiaryData.is_active,
          is_vulnerable: beneficiaryData.is_vulnerable
        },
        type: QueryTypes.INSERT
      });

      createdBeneficiaries.push(result[0][0].id);
      results.successful++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: i + 1,
        data: beneficiaries[i],
        error: error.message
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `Bulk import completed: ${results.successful} successful, ${results.failed} failed`,
    data: results
  });
});
