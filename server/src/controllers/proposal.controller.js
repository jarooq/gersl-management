import asyncHandler from 'express-async-handler';
import { Proposal, User, Project, Indicator, Approval, Notification } from '../models/index.js';
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import { DEPARTMENT_RESTRICTED_ROLES } from '../constants/roles.js';
import { assertProposalTransition } from '../utils/proposalStateMachine.js';
import { hasPermission, PERMISSIONS } from '../middleware/auth.middleware.js';

// Whitelist of currency codes the org transacts in. New entries should match
// the frontend CURRENCIES list (frontend/src/pages/ProposalsPage.jsx).
const ALLOWED_CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'];

// Programme types the proposal-to-order conversion knows how to handle.
const VALID_PROPOSAL_TYPES = ['WASH', 'IGP', 'Orphan', 'General', 'Mixed'];

// Validate proposalLineItems JSONB shape — each entry must look like
// { type, qty, unit } with numeric qty/unit. Returns sanitised array.
const sanitiseLineItems = (raw) => {
  if (raw == null) return null;
  if (!Array.isArray(raw)) {
    const err = new Error('proposalLineItems must be an array');
    err.statusCode = 400;
    throw err;
  }
  return raw.map((li, idx) => {
    const qty = Number(li.qty ?? li.quantity ?? 0);
    const unit = Number(li.unit ?? li.unitCost ?? 0);
    if (!Number.isFinite(qty) || qty < 0) {
      const err = new Error(`proposalLineItems[${idx}].qty must be a non-negative number`);
      err.statusCode = 400; throw err;
    }
    if (!Number.isFinite(unit) || unit < 0) {
      const err = new Error(`proposalLineItems[${idx}].unit must be a non-negative number`);
      err.statusCode = 400; throw err;
    }
    return { type: String(li.type || li.assetType || 'Other'), qty, unit };
  });
};

/**
 * @desc    Get all proposals
 * @route   GET /api/proposals
 * @access  Private
 */
export const getAllProposals = asyncHandler(async (req, res) => {
  const {
    status,
    priority,
    donor,
    programmeArea,
    limit = 100,
    offset = 0
  } = req.query;

  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (donor) where.donor = donor;
  if (programmeArea) where.programmeArea = programmeArea;

  // 🔒 DEPARTMENT-BASED ACCESS CONTROL
  // Project Officers can ONLY see proposals in their department
  // Managers, Directors, Admin, CEO can see ALL proposals
  const user = req.user;
  const userRole = user.role;
  const userDepartment = user.department;

  // If user is a Project Officer or restricted role, filter by their department
  if (DEPARTMENT_RESTRICTED_ROLES.includes(userRole) && userDepartment) {
    where.department = userDepartment;
  }

  const { count, rows: proposals } = await Proposal.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: Project,
        as: 'linkedProject',
        attributes: ['id', 'name', 'status']
      }
    ]
  });

  res.json({
    success: true,
    data: {
      proposals,
      count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }
  });
});

/**
 * @desc    Get single proposal by ID
 * @route   GET /api/proposals/:id
 * @access  Private
 */
export const getProposalById = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: Project,
        as: 'linkedProject',
        attributes: ['id', 'name', 'status', 'progress']
      }
    ]
  });

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  res.json({
    success: true,
    data: { proposal }
  });
});

/**
 * @desc    Create new proposal
 * @route   POST /api/proposals
 * @access  Private
 */
export const createProposal = asyncHandler(async (req, res) => {
  const proposalData = req.body;

  // Required-field validation (audit found Postman could POST {} and succeed).
  if (!proposalData.title || String(proposalData.title).trim().length < 3) {
    res.status(400); throw new Error('title is required (min 3 characters)');
  }
  if (proposalData.budgetRequested != null) {
    const b = Number(proposalData.budgetRequested);
    if (!Number.isFinite(b) || b < 0) {
      res.status(400); throw new Error('budgetRequested must be a non-negative number');
    }
  }
  if (proposalData.proposalType && !VALID_PROPOSAL_TYPES.includes(proposalData.proposalType)) {
    res.status(400); throw new Error(`proposalType must be one of ${VALID_PROPOSAL_TYPES.join(', ')}`);
  }
  if (proposalData.budgetCurrency && !ALLOWED_CURRENCIES.includes(proposalData.budgetCurrency)) {
    res.status(400); throw new Error(`budgetCurrency must be one of ${ALLOWED_CURRENCIES.join(', ')}`);
  }
  // Sanitise JSONB structures so downstream arithmetic doesn't silently coerce.
  if (proposalData.proposalLineItems !== undefined) {
    proposalData.proposalLineItems = sanitiseLineItems(proposalData.proposalLineItems);
  }

  // New proposals always start in Draft regardless of what the client sends —
  // moving to other states must go through /status which enforces the SM.
  proposalData.status = 'Draft';

  // Set created by and submitted by from authenticated user
  proposalData.createdBy = req.user.id;
  proposalData.submittedBy = req.user.id;

  // Auto-generate proposal code if not provided
  if (!proposalData.proposalCode) {
    const year = new Date().getFullYear();
    const count = await Proposal.count({
      where: {
        proposalCode: {
          [Op.like]: `PROP-${year}-%`
        }
      }
    });
    proposalData.proposalCode = `PROP-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  // Set submission date if not provided
  if (!proposalData.submissionDate) {
    proposalData.submissionDate = new Date();
  }

  const proposal = await Proposal.create(proposalData);

  // Fetch with associations
  const fullProposal = await Proposal.findByPk(proposal.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      }
    ]
  });

  res.status(201).json({
    success: true,
    message: 'Proposal created successfully',
    data: { proposal: fullProposal }
  });
});

/**
 * @desc    Update proposal
 * @route   PUT /api/proposals/:id
 * @access  Private
 */
export const updateProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  const updatedData = { ...req.body };
  // Status moves are gated by the state machine — never accept them via the
  // generic update route. Use PATCH /:id/status which validates transitions.
  delete updatedData.status;
  // Conversion pointers are managed by /convert and /convert-to-order — never
  // let the client patch them in directly to fake a linked project.
  delete updatedData.linkedProjectId;
  delete updatedData.linkedProjectCode;
  delete updatedData.convertedToProjectDate;
  delete updatedData.convertedOrderId;
  delete updatedData.convertedOrderType;

  if (updatedData.proposalType && !VALID_PROPOSAL_TYPES.includes(updatedData.proposalType)) {
    res.status(400); throw new Error(`proposalType must be one of ${VALID_PROPOSAL_TYPES.join(', ')}`);
  }
  if (updatedData.budgetCurrency && !ALLOWED_CURRENCIES.includes(updatedData.budgetCurrency)) {
    res.status(400); throw new Error(`budgetCurrency must be one of ${ALLOWED_CURRENCIES.join(', ')}`);
  }
  if (updatedData.proposalLineItems !== undefined) {
    updatedData.proposalLineItems = sanitiseLineItems(updatedData.proposalLineItems);
  }

  updatedData.lastEditedBy = req.user.id;

  await proposal.update(updatedData);

  // Fetch with associations
  const updatedProposal = await Proposal.findByPk(proposal.id, {
    include: [
      {
        model: User,
        as: 'creator',
        attributes: ['id', 'username', 'fullName', 'email']
      },
      {
        model: User,
        as: 'editor',
        attributes: ['id', 'username', 'fullName', 'email']
      }
    ]
  });

  res.json({
    success: true,
    message: 'Proposal updated successfully',
    data: { proposal: updatedProposal }
  });
});

/**
 * @desc    Delete proposal
 * @route   DELETE /api/proposals/:id
 * @access  Private
 */
export const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  // Block delete if the proposal has already produced downstream work — the
  // linked project and any WASH/IGP order would be left with a dangling FK.
  if (proposal.linkedProjectId) {
    res.status(400);
    throw new Error(
      `Cannot delete: proposal is linked to project #${proposal.linkedProjectId}. ` +
      `Cancel the project first or contact Admin.`
    );
  }
  if (proposal.convertedOrderId) {
    res.status(400);
    throw new Error(
      `Cannot delete: proposal has been converted to ${proposal.convertedOrderType} order ` +
      `#${proposal.convertedOrderId}. Cancel the order first.`
    );
  }
  // Only allow deletion of early-stage proposals — submissions to donors are
  // part of the audit trail and must be retained as Rejected, not deleted.
  if (!['Draft', 'Rejected', 'Donor Rejected'].includes(proposal.status)) {
    res.status(400);
    throw new Error(
      `Cannot delete proposal in "${proposal.status}" status. ` +
      `Only Draft / Rejected / Donor Rejected proposals can be deleted.`
    );
  }

  await proposal.destroy(); // soft-delete once paranoid migration runs

  res.json({
    success: true,
    message: 'Proposal deleted successfully'
  });
});

/**
 * @desc    Update proposal status
 * @route   PATCH /api/proposals/:id/status
 * @access  Private
 */
export const updateProposalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  // State machine: validates the transition AND the requesting role's
  // permissions. Replaces the previous free-for-all where any user could
  // move Draft to "Donor Approved" in one PATCH. The required permission
  // per target state is defined in proposalStateMachine.js — admin can
  // re-wire which roles hold which perm via Settings → Roles.
  try {
    assertProposalTransition({
      fromStatus: proposal.status,
      toStatus: status,
      user: req.user,
    });
  } catch (err) {
    res.status(err.statusCode || 400);
    throw err;
  }

  proposal.status = status;
  proposal.lastEditedBy = req.user.id;
  // Stamp the approval/rejection trail so audit log doesn't have to crawl
  // separate AuditLog rows to answer "when did this get approved?".
  if (status === 'Approved' || status === 'Donor Approved') {
    proposal.approvedBy = req.user.id;
    proposal.approvalDate = new Date();
  } else if (status === 'Rejected' || status === 'Donor Rejected') {
    proposal.rejectedBy = req.user.id;
    proposal.rejectionDate = new Date();
  }
  await proposal.save();

  res.json({
    success: true,
    message: `Proposal status updated to ${status}`,
    data: { proposal }
  });
});

/**
 * @desc    Link proposal to project
 * @route   PATCH /api/proposals/:id/link-project
 * @access  Private
 */
export const linkProposalToProject = asyncHandler(async (req, res) => {
  const { projectId, projectCode } = req.body;
  const proposal = await Proposal.findByPk(req.params.id);

  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  proposal.linkedProjectId = projectId;
  proposal.linkedProjectCode = projectCode;
  proposal.convertedToProjectDate = new Date();
  proposal.lastEditedBy = req.user.id;
  await proposal.save();

  res.json({
    success: true,
    message: 'Proposal linked to project successfully',
    data: { proposal }
  });
});

/**
 * @desc    Get proposal statistics
 * @route   GET /api/proposals/stats
 * @access  Private
 */
export const getProposalStats = asyncHandler(async (req, res) => {
  const totalProposals = await Proposal.count();
  const draftProposals = await Proposal.count({ where: { status: 'Draft' } });
  const submittedProposals = await Proposal.count({
    where: {
      status: { [Op.in]: ['Submitted', 'Under Review'] }
    }
  });
  const approvedProposals = await Proposal.count({ where: { status: 'Approved' } });
  const rejectedProposals = await Proposal.count({ where: { status: 'Rejected' } });

  const budgetAgg = await Proposal.findAll({
    attributes: [
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.col('budget_requested')), 'totalBudgetRequested'],
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.literal('CASE WHEN status = \'Approved\' THEN budget_requested ELSE 0 END')), 'approvedBudget']
    ],
    raw: true
  });

  const beneficiariesAgg = await Proposal.findAll({
    attributes: [
      [Proposal.sequelize.fn('SUM', Proposal.sequelize.col('target_beneficiaries')), 'totalBeneficiaries']
    ],
    raw: true
  });

  const successRate = totalProposals > 0
    ? Math.round((approvedProposals / (approvedProposals + rejectedProposals || 1)) * 100)
    : 0;

  res.json({
    success: true,
    data: {
      totalProposals,
      draftProposals,
      submittedProposals,
      approvedProposals,
      rejectedProposals,
      totalBudgetRequested: parseFloat(budgetAgg[0]?.totalBudgetRequested || 0),
      approvedBudget: parseFloat(budgetAgg[0]?.approvedBudget || 0),
      totalBeneficiaries: parseInt(beneficiariesAgg[0]?.totalBeneficiaries || 0),
      successRate
    }
  });
});

/**
 * @desc    Convert proposal to project atomically
 * @route   POST /api/proposals/:id/convert
 * @access  Private
 */
export const convertProposalToProject = asyncHandler(async (req, res) => {
  const proposalId = req.params.id;
  const { projectManagerId, approvalChain } = req.body;

  // Permission gate: converting a proposal opens a Project budget.
  // Replaces the previous hardcoded role list — admin can now re-wire who
  // holds PROPOSALS_CONVERT via Settings → Roles.
  if (!hasPermission(req.user, PERMISSIONS.PROPOSALS_CONVERT)) {
    res.status(403);
    throw new Error(`Your role (${req.user.role}) lacks the proposals:convert permission.`);
  }

  // Start transaction for atomic operation
  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch proposal with validations
    const proposal = await Proposal.findByPk(proposalId, { transaction });

    if (!proposal) {
      await transaction.rollback();
      res.status(404);
      throw new Error('Proposal not found');
    }

    // Validate proposal status - must be donor approved
    if (proposal.status !== 'Donor Approved') {
      await transaction.rollback();
      res.status(400);
      throw new Error(`Cannot convert proposal with status "${proposal.status}". Proposal must be "Donor Approved".`);
    }

    // Check if already converted
    if (proposal.linkedProjectId) {
      await transaction.rollback();
      res.status(400);
      throw new Error('Proposal has already been converted to a project');
    }

    // 2. Generate project code
    const year = new Date().getFullYear();
    const projectCount = await Project.count({
      where: {
        projectCode: {
          [Op.like]: `PROJ-${year}-%`
        }
      },
      transaction
    });
    const projectCode = `PROJ-${year}-${String(projectCount + 1).padStart(3, '0')}`;

    // 3. Create project using RAW SQL to bypass Sequelize field mapping issue
    const [projectResult] = await sequelize.query(`
      INSERT INTO projects (
        project_name,
        name,
        project_code,
        description,
        start_date,
        end_date,
        status,
        phase,
        budget,
        spent,
        funding_source,
        donor,
        programme_area,
        manager_id,
        location,
        target_beneficiaries,
        beneficiaries,
        progress,
        project_tier,
        sector_theme,
        problem_statement,
        proposed_solution,
        overall_goal,
        strategic_alignment,
        objectives,
        key_activities,
        results_framework,
        beneficiary_breakdown,
        theory_of_change,
        budget_breakdown,
        proposal_id,
        created_by,
        created_at,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, NOW(), NOW()
      )
      RETURNING id, project_name, project_code
    `, {
      bind: [
        proposal.title, // $1 - project_name
        proposal.title, // $2 - name
        projectCode, // $3
        proposal.summary || '', // $4
        proposal.startDate, // $5
        proposal.endDate, // $6
        'Planning', // $7
        'Initiation', // $8
        proposal.budgetRequested, // $9
        0, // $10 - spent
        proposal.donor, // $11
        proposal.donor, // $12
        proposal.programmeArea, // $13
        projectManagerId || req.user.id, // $14
        Array.isArray(proposal.district) ? proposal.district.join(', ') : '', // $15
        proposal.targetBeneficiaries, // $16
        0, // $17 - beneficiaries
        0, // $18 - progress
        proposal.projectTier, // $19
        proposal.sectorTheme, // $20
        proposal.problemStatement, // $21
        proposal.proposedSolution, // $22
        proposal.overallGoal, // $23
        proposal.strategicAlignment, // $24
        JSON.stringify(proposal.objectives || []), // $25
        JSON.stringify(proposal.keyActivities || []), // $26
        JSON.stringify(proposal.resultsFramework || []), // $27
        JSON.stringify(proposal.beneficiaryBreakdown || {}), // $28
        JSON.stringify(proposal.theoryOfChange || {}), // $29
        JSON.stringify(proposal.budgetBreakdown || {}), // $30
        proposal.id, // $31
        req.user.id // $32
      ],
      type: sequelize.QueryTypes.INSERT,
      transaction
    });

    const project = {
      id: projectResult[0].id,
      projectName: projectResult[0].project_name,
      projectCode: projectResult[0].project_code
    };

    // 4. Update proposal with project link
    await proposal.update({
      linkedProjectId: project.id,
      linkedProjectCode: projectCode,
      convertedToProjectDate: new Date(),
      lastEditedBy: req.user.id
    }, { transaction });

    // 5. Create MEAL indicators from results framework
    const resultsFramework = proposal.resultsFramework || [];
    const indicators = [];

    for (let i = 0; i < resultsFramework.length; i++) {
      const indicator = resultsFramework[i];
      if (indicator.name) {
        const indicatorCode = `${projectCode}-IND-${String(i + 1).padStart(3, '0')}`;

        const createdIndicator = await Indicator.create({
          projectId: project.id,
          code: indicatorCode,
          name: indicator.name || indicator.indicator,
          description: indicator.description || '',
          type: indicator.type || 'Output',
          category: indicator.category || '',
          unit: indicator.unit || 'Number',
          baseline: indicator.baseline || 0,
          target: indicator.target || 0,
          current: 0,
          status: 'On Track',
          frequency: indicator.frequency || 'Quarterly',
          dataSource: indicator.dataSource || indicator.meansOfVerification || '',
          collectionMethod: indicator.collectionMethod || '',
          responsiblePerson: indicator.responsiblePerson || '',
          disaggregation: indicator.disaggregation || {}
        }, { transaction });

        indicators.push(createdIndicator);
      }
    }

    // 6. Create approval workflow for project initiation (if approval chain provided)
    let approval = null;
    if (approvalChain && approvalChain.length > 0) {
      approval = await Approval.create({
        type: 'PROJECT_INITIATION',
        entityType: 'project',
        entityId: project.id,
        amount: project.budget,
        approvalChain,
        currentLevel: 0,
        status: 'pending',
        initiatedBy: req.user.id,
        initiatedAt: new Date(),
        metadata: {
          projectCode,
          projectName: project.projectName,
          proposalCode: proposal.proposalCode,
          convertedFrom: 'proposal'
        }
      }, { transaction });

      // Create notification for first approver
      const firstApprover = approvalChain[0];
      if (firstApprover.userId) {
        await Notification.create({
          userId: firstApprover.userId,
          type: 'approval_request',
          title: 'New Project Approval Required',
          message: `Project "${project.projectName}" (${projectCode}) requires your approval for initiation.`,
          relatedEntityType: 'approval',
          relatedEntityId: approval.id,
          priority: 'High',
          read: false,
          actionUrl: `/approvals/${approval.id}`,
          deliveryMethod: 'in_app',
          deliveredAt: new Date()
        }, { transaction });
      }
    }

    // 7. Create notification for project manager
    if (projectManagerId && projectManagerId !== req.user.id) {
      await Notification.create({
        userId: projectManagerId,
        type: 'project_assignment',
        title: 'New Project Assignment',
        message: `You have been assigned as project manager for "${project.projectName}" (${projectCode}).`,
        relatedEntityType: 'project',
        relatedEntityId: project.id,
        priority: 'High',
        read: false,
        actionUrl: `/projects/${project.id}`,
        deliveryMethod: 'in_app',
        deliveredAt: new Date()
      }, { transaction });
    }

    // Commit transaction - all operations successful
    await transaction.commit();

    // 8. Fetch full project with relationships (after transaction commit)
    let fullProject;
    try {
      fullProject = await Project.findByPk(project.id, {
        include: [
          {
            model: User,
            as: 'creator',
            attributes: ['id', 'username', 'fullName', 'email']
          }
        ]
      });
    } catch (fetchError) {
      // If fetch fails, use the basic project data we already have
      console.warn('Could not fetch full project details, using basic data:', fetchError.message);
      fullProject = project;
    }

    res.status(201).json({
      success: true,
      message: 'Proposal converted to project successfully',
      data: {
        project: fullProject,
        proposal,
        indicatorsCreated: indicators.length,
        approvalCreated: approval ? true : false,
        approvalId: approval?.id
      }
    });

  } catch (error) {
    // Rollback transaction only if it hasn't been committed
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('Error converting proposal to project:', error);
    throw error;
  }
});
