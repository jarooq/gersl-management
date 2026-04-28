import { Op } from 'sequelize';
import { Staff, User, EmploymentAgreement, ContractRenewal, Termination, Resignation } from '../models/index.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.middleware.js';
import sequelize from '../config/database.js';
import * as aiService from '../services/ai.service.js';

// ============================================
// EMPLOYMENT AGREEMENTS
// ============================================

/**
 * Generate and create employment agreement for staff
 * Integrates with staff creation workflow
 */
export const createEmploymentAgreement = asyncHandler(async (req, res) => {
  const {
    staffId,
    agreementType = 'Initial',
    contractType = 'Permanent',
    contractDuration,
    startDate,
    endDate,
    probationPeriod = 3,
    salary,
    workingHours = 8,
    workingDays = 5,
    annualLeave = 14,
    casualLeave = 7,
    sickLeave = 7,
    noticePeriod = 60
  } = req.body;

  // Validate staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Generate AI employment agreement
  const agreementContent = await aiService.generateEmploymentAgreement({
    staffName: staff.fullName,
    position: staff.position,
    department: staff.department,
    salary,
    employmentType: contractType,
    startDate,
    contractDuration,
    probationPeriod,
    workingHours,
    workingDays
  });

  // Create employment agreement
  const agreement = await EmploymentAgreement.create({
    staffId,
    agreementType,
    contractType,
    contractDuration,
    startDate,
    endDate,
    probationPeriod,
    salary,
    workingHours,
    workingDays,
    annualLeave,
    casualLeave,
    sickLeave,
    noticePeriod,
    documentContent: agreementContent,
    status: 'Draft'
  });

  res.status(201).json({
    success: true,
    message: 'Employment agreement generated successfully',
    data: { agreement }
  });
});

/**
 * Get all employment agreements with filtering
 */
export const getAllAgreements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, contractType, staffId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (contractType) where.contractType = contractType;
  if (staffId) where.staffId = staffId;

  const { count, rows: agreements } = await EmploymentAgreement.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'signer',
        attributes: ['id', 'fullName', 'role']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      agreements,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalRecords: count,
        limit: parseInt(limit)
      }
    }
  });
});

/**
 * Get single agreement by ID
 */
export const getAgreementById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const agreement = await EmploymentAgreement.findByPk(id, {
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'email']
      },
      {
        model: User,
        as: 'signer',
        attributes: ['id', 'fullName', 'role']
      }
    ]
  });

  if (!agreement) {
    throw new NotFoundError('Employment agreement not found');
  }

  res.json({
    success: true,
    data: { agreement }
  });
});

/**
 * Sign employment agreement
 */
export const signAgreement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const agreement = await EmploymentAgreement.findByPk(id);
  if (!agreement) {
    throw new NotFoundError('Employment agreement not found');
  }

  agreement.status = 'Active';
  agreement.signedDate = new Date();
  agreement.signedBy = userId;
  await agreement.save();

  res.json({
    success: true,
    message: 'Employment agreement signed successfully',
    data: { agreement }
  });
});

/**
 * Delete employment agreement
 */
export const deleteAgreement = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const agreement = await EmploymentAgreement.findByPk(id);
  if (!agreement) {
    throw new NotFoundError('Employment agreement not found');
  }

  // Only allow deletion of Draft agreements
  if (agreement.status !== 'Draft') {
    throw new BadRequestError('Only draft agreements can be deleted');
  }

  await agreement.destroy();

  res.json({
    success: true,
    message: 'Employment agreement deleted successfully'
  });
});

// ============================================
// CONTRACT RENEWALS
// ============================================

/**
 * Get expiring contracts (1 year tracking)
 */
export const getExpiringContracts = asyncHandler(async (req, res) => {
  const { daysAhead = 30 } = req.query;
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + parseInt(daysAhead));

  const expiringAgreements = await EmploymentAgreement.findAll({
    where: {
      contractType: 'Contract',
      endDate: {
        [Op.between]: [new Date(), futureDate]
      },
      status: 'Active'
    },
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'email']
      }
    ],
    order: [['endDate', 'ASC']]
  });

  res.json({
    success: true,
    data: {
      expiringContracts: expiringAgreements,
      count: expiringAgreements.length
    }
  });
});

/**
 * Create contract renewal
 */
export const createContractRenewal = asyncHandler(async (req, res) => {
  const {
    staffId,
    previousAgreementId,
    currentContractEndDate,
    renewalStartDate,
    renewalEndDate,
    newContractDuration,
    previousSalary,
    newSalary,
    salaryIncrease,
    performanceHighlights
  } = req.body;

  const userId = req.user.id;

  // Validate staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Generate AI renewal letter
  const renewalLetter = await aiService.generateContractRenewal({
    staffName: staff.fullName,
    position: staff.position,
    currentContractEndDate,
    newContractDuration,
    newSalary,
    performanceHighlights
  });

  // Create renewal record
  const renewal = await ContractRenewal.create({
    staffId,
    previousAgreementId,
    currentContractEndDate,
    renewalStartDate,
    renewalEndDate,
    newContractDuration,
    previousSalary,
    newSalary,
    salaryIncrease,
    performanceHighlights,
    renewalLetter,
    status: 'Pending',
    requestedBy: userId
  });

  res.status(201).json({
    success: true,
    message: 'Contract renewal created successfully',
    data: { renewal }
  });
});

/**
 * Approve contract renewal
 */
export const approveContractRenewal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const renewal = await ContractRenewal.findByPk(id);
  if (!renewal) {
    throw new NotFoundError('Contract renewal not found');
  }

  const transaction = await sequelize.transaction();

  try {
    // Create new employment agreement
    const staff = await Staff.findByPk(renewal.staffId);

    const agreementContent = await aiService.generateEmploymentAgreement({
      staffName: staff.fullName,
      position: staff.position,
      department: staff.department,
      salary: renewal.newSalary,
      employmentType: 'Contract',
      startDate: renewal.renewalStartDate,
      contractDuration: renewal.newContractDuration
    });

    const newAgreement = await EmploymentAgreement.create({
      staffId: renewal.staffId,
      agreementType: 'Renewal',
      contractType: 'Contract',
      contractDuration: renewal.newContractDuration,
      startDate: renewal.renewalStartDate,
      endDate: renewal.renewalEndDate,
      salary: renewal.newSalary,
      documentContent: agreementContent,
      status: 'Active',
      signedDate: new Date(),
      signedBy: userId
    }, { transaction });

    // Update old agreement
    if (renewal.previousAgreementId) {
      await EmploymentAgreement.update(
        { status: 'Expired' },
        { where: { id: renewal.previousAgreementId }, transaction }
      );
    }

    // Update renewal record
    renewal.newAgreementId = newAgreement.id;
    renewal.status = 'Accepted';
    renewal.approvedBy = userId;
    renewal.approvedDate = new Date();
    await renewal.save({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Contract renewal approved successfully',
      data: { renewal, newAgreement }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// ============================================
// TERMINATIONS
// ============================================

/**
 * Create termination
 */
export const createTermination = asyncHandler(async (req, res) => {
  const {
    staffId,
    terminationType,
    terminationDate,
    noticeDate,
    noticePeriod,
    finalWorkingDay,
    reason,
    reasonCategory,
    leaveEncashment = 0,
    gratuityEligible = false
  } = req.body;

  const userId = req.user.id;

  // Validate staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Calculate leave encashment amount
  const leaveEncashmentAmount = (staff.salary / 30) * leaveEncashment;

  // Calculate gratuity (if eligible: 5 years service)
  let gratuityAmount = 0;
  if (gratuityEligible) {
    const joinDate = new Date(staff.joinDate);
    const years = (new Date() - joinDate) / (365 * 24 * 60 * 60 * 1000);
    if (years >= 5) {
      gratuityAmount = (staff.salary * years) / 2;
    }
  }

  // Calculate EPF/ETF final contributions
  const epfFinal = staff.salary * 0.20; // 8% employee + 12% employer
  const etfFinal = staff.salary * 0.03; // 3% employer

  const finalSettlement = parseFloat(leaveEncashmentAmount) +
                         parseFloat(gratuityAmount) +
                         parseFloat(epfFinal) +
                         parseFloat(etfFinal);

  // Generate AI termination letter
  const terminationLetter = await aiService.generateTerminationLetter({
    staffName: staff.fullName,
    position: staff.position,
    terminationDate,
    reason,
    noticePeriod,
    finalWorkingDay,
    gratuityPayable: gratuityEligible,
    leaveEncashment
  });

  // Create termination record
  const termination = await Termination.create({
    staffId,
    terminationType,
    terminationDate,
    noticeDate,
    noticePeriod,
    finalWorkingDay,
    reason,
    reasonCategory,
    leaveEncashment,
    leaveEncashmentAmount,
    gratuityEligible,
    gratuityAmount,
    epfFinalContribution: epfFinal,
    etfFinalContribution: etfFinal,
    finalSettlementAmount: finalSettlement,
    terminationLetter,
    status: 'Draft',
    initiatedBy: userId
  });

  res.status(201).json({
    success: true,
    message: 'Termination created successfully',
    data: { termination }
  });
});

/**
 * Approve termination
 */
export const approveTermination = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const termination = await Termination.findByPk(id, {
    include: [{ model: Staff, as: 'staff' }]
  });

  if (!termination) {
    throw new NotFoundError('Termination not found');
  }

  const transaction = await sequelize.transaction();

  try {
    // Update staff status
    await Staff.update(
      { status: 'Terminated' },
      { where: { id: termination.staffId }, transaction }
    );

    // Update all active agreements
    await EmploymentAgreement.update(
      { status: 'Terminated' },
      {
        where: {
          staffId: termination.staffId,
          status: 'Active'
        },
        transaction
      }
    );

    // Update termination
    termination.status = 'Approved';
    termination.approvedBy = userId;
    termination.approvedDate = new Date();
    await termination.save({ transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Termination approved successfully',
      data: { termination }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * Get all terminations
 */
export const getAllTerminations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, staffId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;

  const { count, rows: terminations } = await Termination.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'initiator',
        attributes: ['id', 'fullName', 'role']
      },
      {
        model: User,
        as: 'approver',
        attributes: ['id', 'fullName', 'role']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      terminations,
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
// RESIGNATIONS (2 months notice)
// ============================================

/**
 * Submit resignation
 */
export const submitResignation = asyncHandler(async (req, res) => {
  const {
    staffId,
    resignationDate,
    noticeRequirement = 60, // 2 months (60 days) per Sri Lankan law
    proposedLastDay,
    reason,
    reasonCategory,
    newEmployer,
    newPosition
  } = req.body;

  // Validate staff exists
  const staff = await Staff.findByPk(staffId);
  if (!staff) {
    throw new NotFoundError('Staff member not found');
  }

  // Calculate notice served
  const resignDate = new Date(resignationDate);
  const lastDay = new Date(proposedLastDay);
  const noticeServed = Math.floor((lastDay - resignDate) / (1000 * 60 * 60 * 24));

  if (noticeServed < noticeRequirement) {
    throw new BadRequestError(
      `Notice period must be at least ${noticeRequirement} days (2 months). You provided ${noticeServed} days.`
    );
  }

  // Create resignation
  const resignation = await Resignation.create({
    staffId,
    resignationDate,
    noticeRequirement,
    noticeServed,
    proposedLastDay,
    reason,
    reasonCategory,
    newEmployer,
    newPosition,
    status: 'Submitted'
  });

  res.status(201).json({
    success: true,
    message: 'Resignation submitted successfully',
    data: { resignation }
  });
});

/**
 * Accept resignation
 */
export const acceptResignation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { finalWorkingDay, acknowledgment } = req.body;
  const userId = req.user.id;

  const resignation = await Resignation.findByPk(id, {
    include: [{ model: Staff, as: 'staff' }]
  });

  if (!resignation) {
    throw new NotFoundError('Resignation not found');
  }

  // Generate AI acceptance letter
  const acceptanceLetter = await aiService.generateResignationAcceptance({
    staffName: resignation.staff.fullName,
    position: resignation.staff.position,
    resignationDate: resignation.resignationDate,
    noticeRequirement: resignation.noticeRequirement,
    finalWorkingDay,
    acknowledgment
  });

  // Update resignation
  resignation.finalWorkingDay = finalWorkingDay;
  resignation.acknowledgment = acknowledgment;
  resignation.acceptanceLetter = acceptanceLetter;
  resignation.status = 'Accepted';
  resignation.acceptedBy = userId;
  resignation.acceptedDate = new Date();
  await resignation.save();

  res.json({
    success: true,
    message: 'Resignation accepted successfully',
    data: { resignation }
  });
});

/**
 * Get all resignations
 */
export const getAllResignations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, staffId } = req.query;
  const offset = (page - 1) * limit;

  const where = {};
  if (status) where.status = status;
  if (staffId) where.staffId = staffId;

  const { count, rows: resignations } = await Resignation.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department']
      },
      {
        model: User,
        as: 'acceptor',
        attributes: ['id', 'fullName', 'role']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      resignations,
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
// JOB DESCRIPTION GENERATOR
// ============================================

/**
 * Generate job description with AI
 */
export const generateJobDescription = asyncHandler(async (req, res) => {
  const { position, department, level, responsibilities, qualifications } = req.body;

  if (!position || !department) {
    throw new BadRequestError('Position and department are required');
  }

  const jobDescription = await aiService.generateJobDescription({
    position,
    department,
    level,
    responsibilities,
    qualifications
  });

  res.json({
    success: true,
    message: 'Job description generated successfully',
    data: { jobDescription }
  });
});

// ============================================
// STAFF CREATION WITH AUTO AGREEMENT
// ============================================

/**
 * Enhanced staff creation with automatic employment agreement generation
 * Integrates with existing createStaff from hr.controller.js
 */
export const createStaffWithAgreement = asyncHandler(async (req, res) => {
  const {
    // Staff data
    fullName, email, phone, department, position, joiningDate,
    salary, employmentType, contractDuration,
    // User account data
    username, password, userRole = 'Staff', userStatus = 'Active',
    // Agreement options
    generateAgreement = true,
    probationPeriod = 3,
    contractEndDate
  } = req.body;

  if (!username || !password) {
    throw new BadRequestError('Username and password are required');
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Create user account
    const user = await User.create({
      username,
      email,
      password,
      fullName,
      phone,
      role: userRole,
      status: userStatus,
      department
    }, { transaction });

    // 2. Create staff record
    const staff = await Staff.create({
      fullName,
      email,
      phone,
      department,
      position,
      joinDate: joiningDate,
      salary,
      employmentType: employmentType || 'Full-Time',
      status: 'Active',
      userId: user.id
    }, { transaction });

    let agreement = null;

    // 3. Auto-generate employment agreement if requested
    if (generateAgreement) {
      const agreementContent = await aiService.generateEmploymentAgreement({
        staffName: fullName,
        position,
        department,
        salary,
        employmentType: employmentType || 'Permanent',
        startDate: joiningDate,
        contractDuration,
        probationPeriod
      });

      agreement = await EmploymentAgreement.create({
        staffId: staff.id,
        agreementType: 'Initial',
        contractType: employmentType || 'Permanent',
        contractDuration,
        startDate: joiningDate,
        endDate: contractEndDate,
        probationPeriod,
        salary,
        documentContent: agreementContent,
        status: 'Draft'
      }, { transaction });
    }

    await transaction.commit();

    // Fetch created staff with all relations
    const createdStaff = await Staff.findByPk(staff.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'email', 'status']
        },
        {
          model: EmploymentAgreement,
          as: 'agreements'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully with employment agreement',
      data: {
        staff: createdStaff,
        agreement,
        userCredentials: {
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

/**
 * Get my HR data (for logged-in employee)
 * Returns employment agreement, resignations, and contract renewals for the current user
 */
export const getMyHRData = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Find staff record linked to this user
  const staffRecord = await Staff.findOne({
    where: { userId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'fullName', 'email', 'role', 'department']
      }
    ]
  });

  if (!staffRecord) {
    return res.json({
      success: true,
      message: 'No staff record found for this user',
      data: {
        hasStaffRecord: false,
        staff: null,
        agreement: null,
        renewals: [],
        resignations: []
      }
    });
  }

  // Get active employment agreement
  const agreement = await EmploymentAgreement.findOne({
    where: {
      staffId: staffRecord.id,
      status: 'Active'
    },
    order: [['startDate', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position', 'department', 'salary']
      }
    ]
  });

  // Get contract renewals for this staff
  const renewals = await ContractRenewal.findAll({
    where: { staffId: staffRecord.id },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position']
      }
    ]
  });

  // Get resignations submitted by this staff
  const resignations = await Resignation.findAll({
    where: { staffId: staffRecord.id },
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: Staff,
        as: 'staff',
        attributes: ['id', 'fullName', 'position']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      hasStaffRecord: true,
      staff: staffRecord,
      agreement,
      renewals,
      resignations
    }
  });
});

export default {
  createEmploymentAgreement,
  getAllAgreements,
  getAgreementById,
  signAgreement,
  deleteAgreement,
  getExpiringContracts,
  createContractRenewal,
  approveContractRenewal,
  createTermination,
  approveTermination,
  getAllTerminations,
  submitResignation,
  acceptResignation,
  getAllResignations,
  generateJobDescription,
  createStaffWithAgreement,
  getMyHRData
};
