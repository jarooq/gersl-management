import { AggregateDistribution, Task, Project, User } from '../models/index.js';
import { Op } from 'sequelize';

/**
 * Create aggregate distribution record
 * POST /api/tasks/:taskId/aggregate-distribution
 */
export const createAggregateDistribution = async (req, res) => {
  try {
    const { taskId } = req.params;
    const {
      distributionDate,
      distributionLocation,
      district,
      city,
      gnDivision,
      totalBeneficiaries,
      demographicBreakdown,
      itemsDistributed,
      cashAmount,
      photos,
      videos,
      mediaCoverageDetails,
      distributedBy,
      mediaTeamPresent,
      distributionType,
      partnerOrganizations,
      communityFeedback,
      challengesFaced,
      notes
    } = req.body;

    // Verify task exists
    const task = await Task.findByPk(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if aggregate distribution already exists for this task
    const existing = await AggregateDistribution.findOne({ where: { taskId } });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Aggregate distribution already exists for this task. Use PUT to update.'
      });
    }

    // Create aggregate distribution record
    const aggregateDistribution = await AggregateDistribution.create({
      taskId,
      projectId: task.projectId,
      distributionDate,
      distributionLocation,
      district,
      city,
      gnDivision,
      totalBeneficiaries,
      demographicBreakdown,
      itemsDistributed,
      cashAmount,
      photos,
      videos,
      mediaCoverageDetails,
      distributedBy: distributedBy || [],
      mediaTeamPresent: mediaTeamPresent || [],
      distributionType,
      partnerOrganizations,
      communityFeedback,
      challengesFaced,
      notes,
      createdBy: req.user?.id
    });

    // Fetch with associations
    const created = await AggregateDistribution.findByPk(aggregateDistribution.id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'taskType']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectCode', 'projectName']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Aggregate distribution created successfully',
      aggregateDistribution: created
    });
  } catch (error) {
    console.error('Error creating aggregate distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create aggregate distribution',
      error: error.message
    });
  }
};

/**
 * Get aggregate distribution for a task
 * GET /api/tasks/:taskId/aggregate-distribution
 */
export const getAggregateDistributionByTask = async (req, res) => {
  try {
    const { taskId } = req.params;

    const aggregateDistribution = await AggregateDistribution.findOne({
      where: { taskId },
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'taskType', 'distributionType', 'status']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectCode', 'projectName']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName', 'email']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    if (!aggregateDistribution) {
      return res.status(404).json({
        success: false,
        message: 'No aggregate distribution found for this task'
      });
    }

    res.json({
      success: true,
      aggregateDistribution
    });
  } catch (error) {
    console.error('Error fetching aggregate distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch aggregate distribution',
      error: error.message
    });
  }
};

/**
 * Update aggregate distribution
 * PUT /api/aggregate-distributions/:id
 */
export const updateAggregateDistribution = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const aggregateDistribution = await AggregateDistribution.findByPk(id);
    if (!aggregateDistribution) {
      return res.status(404).json({
        success: false,
        message: 'Aggregate distribution not found'
      });
    }

    await aggregateDistribution.update(updateData);

    // Fetch updated record with associations
    const updated = await AggregateDistribution.findByPk(id, {
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'taskType']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectCode', 'projectName']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Aggregate distribution updated successfully',
      aggregateDistribution: updated
    });
  } catch (error) {
    console.error('Error updating aggregate distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update aggregate distribution',
      error: error.message
    });
  }
};

/**
 * Verify aggregate distribution
 * PUT /api/aggregate-distributions/:id/verify
 */
export const verifyAggregateDistribution = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificationNotes } = req.body;

    const aggregateDistribution = await AggregateDistribution.findByPk(id);
    if (!aggregateDistribution) {
      return res.status(404).json({
        success: false,
        message: 'Aggregate distribution not found'
      });
    }

    await aggregateDistribution.update({
      verifiedBy: req.user?.id,
      verificationDate: new Date(),
      verificationNotes
    });

    const updated = await AggregateDistribution.findByPk(id, {
      include: [
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Aggregate distribution verified successfully',
      aggregateDistribution: updated
    });
  } catch (error) {
    console.error('Error verifying aggregate distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify aggregate distribution',
      error: error.message
    });
  }
};

/**
 * Get all aggregate distributions with filtering
 * GET /api/aggregate-distributions?projectId=1&district=Colombo&dateFrom=2024-01-01
 */
export const getAllAggregateDistributions = async (req, res) => {
  try {
    const { projectId, district, dateFrom, dateTo, verified } = req.query;

    const where = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (district) {
      where.district = district;
    }

    if (dateFrom || dateTo) {
      where.distributionDate = {};
      if (dateFrom) {
        where.distributionDate[Op.gte] = dateFrom;
      }
      if (dateTo) {
        where.distributionDate[Op.lte] = dateTo;
      }
    }

    if (verified !== undefined) {
      if (verified === 'true') {
        where.verifiedBy = { [Op.ne]: null };
      } else {
        where.verifiedBy = null;
      }
    }

    const aggregateDistributions = await AggregateDistribution.findAll({
      where,
      include: [
        {
          model: Task,
          as: 'task',
          attributes: ['id', 'title', 'taskType', 'status']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'projectCode', 'projectName']
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName']
        },
        {
          model: User,
          as: 'verifier',
          attributes: ['id', 'fullName']
        }
      ],
      order: [['distributionDate', 'DESC']]
    });

    // Calculate totals
    const totals = {
      totalDistributions: aggregateDistributions.length,
      totalBeneficiaries: aggregateDistributions.reduce((sum, d) => sum + (d.totalBeneficiaries || 0), 0),
      verified: aggregateDistributions.filter(d => d.verifiedBy).length,
      unverified: aggregateDistributions.filter(d => !d.verifiedBy).length
    };

    res.json({
      success: true,
      count: aggregateDistributions.length,
      totals,
      aggregateDistributions
    });
  } catch (error) {
    console.error('Error fetching aggregate distributions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch aggregate distributions',
      error: error.message
    });
  }
};

/**
 * Delete aggregate distribution
 * DELETE /api/aggregate-distributions/:id
 */
export const deleteAggregateDistribution = async (req, res) => {
  try {
    const { id } = req.params;

    const aggregateDistribution = await AggregateDistribution.findByPk(id);
    if (!aggregateDistribution) {
      return res.status(404).json({
        success: false,
        message: 'Aggregate distribution not found'
      });
    }

    // Don't allow deletion if verified
    if (aggregateDistribution.verifiedBy) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete verified aggregate distribution'
      });
    }

    await aggregateDistribution.destroy();

    res.json({
      success: true,
      message: 'Aggregate distribution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting aggregate distribution:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete aggregate distribution',
      error: error.message
    });
  }
};
