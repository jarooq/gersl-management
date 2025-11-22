import { TaskBeneficiary, Task, Beneficiary, User, BeneficiarySupport } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Get all beneficiaries for a specific task
 * GET /api/tasks/:taskId/beneficiaries
 */
export const getTaskBeneficiaries = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { selectionStatus } = req.query;

    const where = { taskId };

    if (selectionStatus) {
      where.selectionStatus = selectionStatus;
    }

    const taskBeneficiaries = await TaskBeneficiary.findAll({
      where,
      include: [
        {
          model: Beneficiary,
          as: 'beneficiary',
          attributes: [
            'id', 'fullName', 'nic', 'contactNumber',
            'district', 'city', 'gnDivision',
            'vulnerabilityScore', 'householdSize', 'monthlyIncome'
          ]
        },
        {
          model: User,
          as: 'selector',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: BeneficiarySupport,
          as: 'supportRecord',
          attributes: ['id', 'supportType', 'supportValue', 'dateProvided']
        }
      ],
      order: [['selectionDate', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: taskBeneficiaries.length,
      taskBeneficiaries
    });
  } catch (error) {
    console.error('Error fetching task beneficiaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch task beneficiaries',
      error: error.message
    });
  }
};

/**
 * Add beneficiary to task
 * POST /api/tasks/:taskId/beneficiaries
 */
export const addBeneficiaryToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      beneficiaryId,
      selectionStatus = 'Nominated',
      selectionNotes,
      selectionCriteria
    } = req.body;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Verify beneficiary exists
    const beneficiary = await Beneficiary.findByPk(beneficiaryId);
    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found'
      });
    }

    // Check if beneficiary is already added to this task
    const existing = await TaskBeneficiary.findOne({
      where: { taskId, beneficiaryId }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Beneficiary is already added to this task'
      });
    }

    // Create task beneficiary link
    const taskBeneficiary = await TaskBeneficiary.create({
      taskId,
      beneficiaryId,
      selectionStatus,
      selectionDate: new Date(),
      selectedBy: req.user?.id,
      selectionNotes,
      metadata: selectionCriteria ? { selectionCriteria } : null,
      createdBy: req.user?.id
    });

    // Fetch the created record with associations
    const created = await TaskBeneficiary.findByPk(taskBeneficiary.id, {
      include: [
        {
          model: Beneficiary,
          as: 'beneficiary',
          attributes: ['id', 'fullName', 'nic', 'contactNumber', 'district']
        },
        {
          model: User,
          as: 'selector',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Beneficiary added to task successfully',
      taskBeneficiary: created
    });
  } catch (error) {
    console.error('Error adding beneficiary to task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add beneficiary to task',
      error: error.message
    });
  }
};

/**
 * Add multiple beneficiaries to task (bulk)
 * POST /api/tasks/:taskId/beneficiaries/bulk
 */
export const addBeneficiariesToTaskBulk = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { beneficiaryIds, selectionStatus = 'Nominated', selectionNotes } = req.body;

    if (!beneficiaryIds || !Array.isArray(beneficiaryIds) || beneficiaryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'beneficiaryIds array is required'
      });
    }

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Filter out beneficiaries already added
    const existing = await TaskBeneficiary.findAll({
      where: { taskId, beneficiaryId: beneficiaryIds },
      attributes: ['beneficiaryId']
    });

    const existingIds = existing.map(tb => tb.beneficiaryId);
    const newBeneficiaryIds = beneficiaryIds.filter(id => !existingIds.includes(id));

    if (newBeneficiaryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All beneficiaries are already added to this task'
      });
    }

    // Create task beneficiary links
    const taskBeneficiaries = await TaskBeneficiary.bulkCreate(
      newBeneficiaryIds.map(beneficiaryId => ({
        taskId,
        beneficiaryId,
        selectionStatus,
        selectionDate: new Date(),
        selectedBy: req.user?.id,
        selectionNotes,
        createdBy: req.user?.id
      }))
    );

    res.status(201).json({
      success: true,
      message: `${taskBeneficiaries.length} beneficiaries added to task successfully`,
      count: taskBeneficiaries.length,
      skipped: existingIds.length
    });
  } catch (error) {
    console.error('Error adding beneficiaries to task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add beneficiaries to task',
      error: error.message
    });
  }
};

/**
 * Update beneficiary selection status
 * PUT /api/task-beneficiaries/:id/status
 */
export const updateSelectionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { selectionStatus, selectionNotes } = req.body;

    const validStatuses = ['Nominated', 'Screened', 'Verified', 'Approved', 'Rejected', 'Waitlist'];
    if (!validStatuses.includes(selectionStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid selection status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const taskBeneficiary = await TaskBeneficiary.findByPk(id);
    if (!taskBeneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Task beneficiary record not found'
      });
    }

    await taskBeneficiary.update({
      selectionStatus,
      selectionNotes: selectionNotes || taskBeneficiary.selectionNotes,
      selectedBy: req.user?.id,
      selectionDate: new Date()
    });

    const updated = await TaskBeneficiary.findByPk(id, {
      include: [
        {
          model: Beneficiary,
          as: 'beneficiary',
          attributes: ['id', 'fullName', 'nic']
        },
        {
          model: User,
          as: 'selector',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Selection status updated successfully',
      taskBeneficiary: updated
    });
  } catch (error) {
    console.error('Error updating selection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update selection status',
      error: error.message
    });
  }
};

/**
 * Mark support as received
 * PUT /api/task-beneficiaries/:id/receive
 */
export const markAsReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      receiptNumber,
      beneficiarySignature,
      verificationNotes,
      supportRecordId
    } = req.body;

    const taskBeneficiary = await TaskBeneficiary.findByPk(id);
    if (!taskBeneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Task beneficiary record not found'
      });
    }

    await taskBeneficiary.update({
      receivedSupport: true,
      receiptDate: new Date(),
      receiptNumber,
      beneficiarySignature,
      verifiedBy: req.user?.id,
      verificationNotes,
      supportRecordId: supportRecordId || taskBeneficiary.supportRecordId
    });

    const updated = await TaskBeneficiary.findByPk(id, {
      include: [
        {
          model: Beneficiary,
          as: 'beneficiary',
          attributes: ['id', 'fullName', 'nic']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName']
        },
        {
          model: BeneficiarySupport,
          as: 'supportRecord',
          attributes: ['id', 'supportType', 'supportValue']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Support receipt recorded successfully',
      taskBeneficiary: updated
    });
  } catch (error) {
    console.error('Error marking as received:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record support receipt',
      error: error.message
    });
  }
};

/**
 * Mark training attendance
 * PUT /api/task-beneficiaries/:id/attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      attended,
      attendancePercentage,
      attendanceDates,
      certificateIssued,
      certificateNumber,
      certificateIssuedDate,
      assessmentScore,
      assessmentNotes
    } = req.body;

    const taskBeneficiary = await TaskBeneficiary.findByPk(id);
    if (!taskBeneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Task beneficiary record not found'
      });
    }

    await taskBeneficiary.update({
      attended,
      attendancePercentage,
      attendanceDates,
      certificateIssued,
      certificateNumber,
      certificateIssuedDate,
      assessmentScore,
      assessmentNotes
    });

    const updated = await TaskBeneficiary.findByPk(id, {
      include: [
        {
          model: Beneficiary,
          as: 'beneficiary',
          attributes: ['id', 'fullName', 'nic']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Attendance recorded successfully',
      taskBeneficiary: updated
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record attendance',
      error: error.message
    });
  }
};

/**
 * Remove beneficiary from task
 * DELETE /api/task-beneficiaries/:id
 */
export const removeBeneficiaryFromTask = async (req, res) => {
  try {
    const { id } = req.params;

    const taskBeneficiary = await TaskBeneficiary.findByPk(id);
    if (!taskBeneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Task beneficiary record not found'
      });
    }

    // Don't allow deletion if support was already received
    if (taskBeneficiary.receivedSupport) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove beneficiary who has already received support'
      });
    }

    await taskBeneficiary.destroy();

    res.json({
      success: true,
      message: 'Beneficiary removed from task successfully'
    });
  } catch (error) {
    console.error('Error removing beneficiary from task:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove beneficiary from task',
      error: error.message
    });
  }
};

/**
 * Get beneficiary history across all tasks
 * GET /api/beneficiaries/:beneficiaryId/task-history
 */
export const getBeneficiaryTaskHistory = async (req, res) => {
  try {
    const { beneficiaryId } = req.params;

    const taskBeneficiaries = await TaskBeneficiary.findAll({
      where: { beneficiaryId },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'taskType', 'distributionType', 'status', 'distributionDate'],
          include: [
            {
              model: Project,
              as: 'project',
              attributes: ['id', 'projectCode', 'projectName']
            }
          ]
        },
        {
          model: User,
          as: 'selector',
          attributes: ['id', 'fullName']
        },
        {
          model: BeneficiarySupport,
          as: 'supportRecord',
          attributes: ['id', 'supportType', 'supportValue', 'dateProvided', 'description']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: taskBeneficiaries.length,
      history: taskBeneficiaries
    });
  } catch (error) {
    console.error('Error fetching beneficiary task history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiary task history',
      error: error.message
    });
  }
};
