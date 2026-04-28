import sequelize from '../config/database.js';

// Get all coordinators with their stats
const getAllCoordinators = async (req, res) => {
  try {
    const coordinators = await sequelize.query(`
      SELECT
        u.id,
        u.full_name as name,
        u.email,
        u.phone,
        u.role as position,
        u.department,
        u.status,

        -- Orphan stats
        COUNT(DISTINCT o.id) as orphans_assigned,
        COUNT(DISTINCT CASE WHEN o.status = 'Active' THEN o.id END) as active_orphans,

        -- Visit stats (last 30 days)
        COUNT(DISTINCT vl.id) FILTER (WHERE vl.visit_date >= CURRENT_DATE - INTERVAL '30 days') as visits_last_30_days,

        -- Last visit
        MAX(vl.visit_date) as last_visit_date

      FROM users u
      LEFT JOIN orphans o ON o.coordinator_id = u.id
      LEFT JOIN orphan_visit_logs vl ON vl.orphan_id = o.id
      WHERE u.role = 'Orphan Coordinator'
        AND u.status = 'Active'
      GROUP BY u.id
      ORDER BY orphans_assigned DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json(coordinators);
  } catch (error) {
    console.error('Error fetching coordinators:', error);
    res.status(500).json({
      error: 'Failed to fetch coordinators',
      details: error.message
    });
  }
};

// Get single coordinator details
const getCoordinatorById = async (req, res) => {
  try {
    const { id } = req.params;

    const coordinator = await sequelize.query(`
      SELECT
        u.id,
        u.full_name as name,
        u.email,
        u.phone,
        u.role as position,
        u.department,
        u.status,
        u.created_at,

        -- Orphan counts
        COUNT(DISTINCT o.id) as total_orphans,
        COUNT(DISTINCT CASE WHEN o.status = 'Active' THEN o.id END) as active_orphans,

        -- Visit stats (all time)
        COUNT(DISTINCT vl.id) as total_visits,
        MAX(vl.visit_date) as last_visit_date

      FROM users u
      LEFT JOIN orphans o ON o.coordinator_id = u.id
      LEFT JOIN orphan_visit_logs vl ON vl.orphan_id = o.id
      WHERE u.id = :coordinatorId
      GROUP BY u.id
    `, {
      replacements: { coordinatorId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!coordinator || coordinator.length === 0) {
      return res.status(404).json({ error: 'Coordinator not found' });
    }

    res.json(coordinator[0]);
  } catch (error) {
    console.error('Error fetching coordinator:', error);
    res.status(500).json({
      error: 'Failed to fetch coordinator',
      details: error.message
    });
  }
};

// Get coordinator performance stats
const getCoordinatorStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'monthly' } = req.query;

    // Calculate date range based on period
    let dateFilter;
    switch (period) {
      case 'weekly':
        dateFilter = "CURRENT_DATE - INTERVAL '7 days'";
        break;
      case 'monthly':
        dateFilter = "CURRENT_DATE - INTERVAL '30 days'";
        break;
      case 'quarterly':
        dateFilter = "CURRENT_DATE - INTERVAL '90 days'";
        break;
      case 'yearly':
        dateFilter = "CURRENT_DATE - INTERVAL '365 days'";
        break;
      default:
        dateFilter = "CURRENT_DATE - INTERVAL '30 days'";
    }

    const stats = await sequelize.query(`
      SELECT
        -- Visit metrics
        COUNT(DISTINCT vl.id) as total_visits,
        COUNT(DISTINCT CASE WHEN vl.follow_up_required = true THEN vl.id END) as follow_ups_required,

        -- Performance calculations
        ROUND(
          CASE
            WHEN COUNT(DISTINCT vl.id) > 0
            THEN 100.00
            ELSE 0
          END, 2
        ) as visit_completion_rate

      FROM users u
      LEFT JOIN orphans o ON o.coordinator_id = u.id
      LEFT JOIN orphan_visit_logs vl ON vl.orphan_id = o.id
        AND vl.visit_date >= ${dateFilter}
      WHERE u.id = :coordinatorId
      GROUP BY u.id
    `, {
      replacements: { coordinatorId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!stats || stats.length === 0) {
      return res.json({
        total_visits: 0,
        follow_ups_required: 0,
        visit_completion_rate: 0
      });
    }

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching coordinator stats:', error);
    res.status(500).json({
      error: 'Failed to fetch coordinator stats',
      details: error.message
    });
  }
};

// Get orphans assigned to coordinator
const getAssignedOrphans = async (req, res) => {
  try {
    const { id } = req.params;

    const orphans = await sequelize.query(`
      SELECT
        o.id,
        o.full_name as name,
        o.age,
        o.gender,
        o.district,
        o.status,
        o.general_health_status as "healthStatus",
        o.last_visit_date as "lastVisitDate",
        o.next_visit_date,
        o.visit_frequency,

        -- Visit info
        COUNT(DISTINCT vl.id) as total_visits,
        MAX(vl.visit_date) as last_visit_date,

        -- Check if visit is overdue
        CASE
          WHEN o.next_visit_date < CURRENT_DATE THEN true
          ELSE false
        END as visit_overdue

      FROM orphans o
      LEFT JOIN orphan_visit_logs vl ON vl.orphan_id = o.id
      WHERE o.coordinator_id = :coordinatorId
      GROUP BY o.id
      ORDER BY
        CASE WHEN o.next_visit_date < CURRENT_DATE THEN 0 ELSE 1 END,
        o.next_visit_date ASC NULLS LAST
    `, {
      replacements: { coordinatorId: id },
      type: sequelize.QueryTypes.SELECT
    });

    res.json(orphans);
  } catch (error) {
    console.error('Error fetching assigned orphans:', error);
    res.status(500).json({
      error: 'Failed to fetch assigned orphans',
      details: error.message
    });
  }
};

// Assign orphan to coordinator
const assignOrphanToCoordinator = async (req, res) => {
  try {
    const { id } = req.params; // coordinator ID
    const { orphanId } = req.body;

    // Update orphan's coordinator
    await sequelize.query(`
      UPDATE orphans
      SET
        coordinator_id = :coordinatorId,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :orphanId
    `, {
      replacements: { coordinatorId: id, orphanId },
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'Orphan assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning orphan:', error);
    res.status(500).json({
      error: 'Failed to assign orphan',
      details: error.message
    });
  }
};

// Unassign orphan from coordinator
const unassignOrphan = async (req, res) => {
  try {
    const { id, orphanId } = req.params; // coordinator ID and orphan ID

    // Remove coordinator assignment
    await sequelize.query(`
      UPDATE orphans
      SET
        coordinator_id = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :orphanId AND coordinator_id = :coordinatorId
    `, {
      replacements: { coordinatorId: id, orphanId },
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'Orphan unassigned successfully'
    });
  } catch (error) {
    console.error('Error unassigning orphan:', error);
    res.status(500).json({
      error: 'Failed to unassign orphan',
      details: error.message
    });
  }
};

export {
  getAllCoordinators,
  getCoordinatorById,
  getCoordinatorStats,
  getAssignedOrphans,
  assignOrphanToCoordinator,
  unassignOrphan
};
