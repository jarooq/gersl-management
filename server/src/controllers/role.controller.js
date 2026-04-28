import sequelize from '../config/database.js';

// ============================================
// ROLES
// ============================================

// @desc    Get all roles
// @route   GET /api/roles
// @access  Private
export const getAllRoles = async (req, res) => {
  try {
    const roles = await sequelize.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.is_system_role,
        r.is_active,
        r.created_at,
        r.updated_at,
        COUNT(DISTINCT rp.permission_id) as permission_count,
        COUNT(DISTINCT u.id) as user_count,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', p.id,
            'permission_key', p.permission_key,
            'permission_name', p.permission_name,
            'module', p.module
          )
        ) FILTER (WHERE p.id IS NOT NULL) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      LEFT JOIN users u ON u.role::text = r.name
      GROUP BY r.id
      ORDER BY
        CASE WHEN r.is_system_role THEN 0 ELSE 1 END,
        r.name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      error: 'Failed to fetch roles',
      details: error.message
    });
  }
};

// @desc    Get role by ID
// @route   GET /api/roles/:id
// @access  Private
export const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await sequelize.query(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.is_system_role,
        r.is_active,
        r.created_at,
        r.updated_at,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', p.id,
            'permission_key', p.permission_key,
            'permission_name', p.permission_name,
            'module', p.module,
            'description', p.description
          )
        ) FILTER (WHERE p.id IS NOT NULL) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON rp.role_id = r.id
      LEFT JOIN permissions p ON p.id = rp.permission_id
      WHERE r.id = :roleId
      GROUP BY r.id
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!role || role.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({
      success: true,
      data: role[0]
    });
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({
      error: 'Failed to fetch role',
      details: error.message
    });
  }
};

// @desc    Create new role
// @route   POST /api/roles
// @access  Private (Admin only)
export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    // Check if role already exists
    const existingRole = await sequelize.query(`
      SELECT id FROM roles WHERE name = :name
    `, {
      replacements: { name: name.trim() },
      type: sequelize.QueryTypes.SELECT
    });

    if (existingRole.length > 0) {
      return res.status(400).json({ error: 'Role with this name already exists' });
    }

    // Insert new role
    const newRole = await sequelize.query(`
      INSERT INTO roles (name, description, is_system_role, is_active)
      VALUES (:name, :description, false, true)
      RETURNING id, name, description, is_system_role, is_active
    `, {
      replacements: {
        name: name.trim(),
        description: description || null
      },
      type: sequelize.QueryTypes.INSERT
    });

    const roleId = newRole[0][0].id;

    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const values = permissions.map(permId => `(${roleId}, ${permId})`).join(',');
      await sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: newRole[0][0]
    });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({
      error: 'Failed to create role',
      details: error.message
    });
  }
};

// @desc    Update role
// @route   PUT /api/roles/:id
// @access  Private (Admin only)
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions, is_active } = req.body;

    // Check if role exists
    const role = await sequelize.query(`
      SELECT id, is_system_role, name FROM roles WHERE id = :roleId
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!role || role.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Prevent editing system role name
    if (role[0].is_system_role && name && name !== role[0].name) {
      return res.status(403).json({ error: 'Cannot rename system roles' });
    }

    // Update role details
    await sequelize.query(`
      UPDATE roles
      SET
        name = COALESCE(:name, name),
        description = COALESCE(:description, description),
        is_active = COALESCE(:is_active, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :roleId
    `, {
      replacements: {
        roleId: id,
        name: name || null,
        description: description || null,
        is_active: is_active !== undefined ? is_active : null
      },
      type: sequelize.QueryTypes.UPDATE
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      // Remove existing permissions
      await sequelize.query(`
        DELETE FROM role_permissions WHERE role_id = :roleId
      `, {
        replacements: { roleId: id },
        type: sequelize.QueryTypes.DELETE
      });

      // Add new permissions
      if (permissions.length > 0) {
        const values = permissions.map(permId => `(${id}, ${permId})`).join(',');
        await sequelize.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES ${values}
          ON CONFLICT (role_id, permission_id) DO NOTHING
        `);
      }
    }

    res.json({
      success: true,
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({
      error: 'Failed to update role',
      details: error.message
    });
  }
};

// @desc    Delete role
// @route   DELETE /api/roles/:id
// @access  Private (Admin only)
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists and is not a system role
    const role = await sequelize.query(`
      SELECT id, is_system_role, name FROM roles WHERE id = :roleId
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!role || role.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role[0].is_system_role) {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    // Check if role is assigned to any users
    const usersWithRole = await sequelize.query(`
      SELECT COUNT(*) as count FROM users WHERE role = :roleName
    `, {
      replacements: { roleName: role[0].name },
      type: sequelize.QueryTypes.SELECT
    });

    if (parseInt(usersWithRole[0].count) > 0) {
      return res.status(400).json({
        error: `Cannot delete role. ${usersWithRole[0].count} user(s) are assigned to this role.`
      });
    }

    // Delete role (CASCADE will delete role_permissions)
    await sequelize.query(`
      DELETE FROM roles WHERE id = :roleId
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.DELETE
    });

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({
      error: 'Failed to delete role',
      details: error.message
    });
  }
};

// @desc    Assign permissions to role
// @route   PUT /api/roles/:id/permissions
// @access  Private (Admin only)
export const assignPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_ids } = req.body;

    if (!permission_ids || !Array.isArray(permission_ids)) {
      return res.status(400).json({ error: 'Permission IDs array is required' });
    }

    // Check if role exists
    const role = await sequelize.query(`
      SELECT id FROM roles WHERE id = :roleId
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!role || role.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    // Remove existing permissions
    await sequelize.query(`
      DELETE FROM role_permissions WHERE role_id = :roleId
    `, {
      replacements: { roleId: id },
      type: sequelize.QueryTypes.DELETE
    });

    // Add new permissions
    if (permission_ids.length > 0) {
      const values = permission_ids.map(permId => `(${id}, ${permId})`).join(',');
      await sequelize.query(`
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ${values}
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `);
    }

    res.json({
      success: true,
      message: 'Permissions assigned successfully'
    });
  } catch (error) {
    console.error('Error assigning permissions:', error);
    res.status(500).json({
      error: 'Failed to assign permissions',
      details: error.message
    });
  }
};

// ============================================
// PERMISSIONS
// ============================================

// @desc    Get all permissions
// @route   GET /api/roles/permissions
// @access  Private
export const getAllPermissions = async (req, res) => {
  try {
    const permissions = await sequelize.query(`
      SELECT
        id,
        permission_key AS "permissionKey",
        permission_name AS "permissionName",
        module,
        description,
        created_at AS "createdAt"
      FROM permissions
      ORDER BY module, permission_name
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Group by module for easier display
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        permissions,
        grouped_permissions: groupedPermissions
      }
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      error: 'Failed to fetch permissions',
      details: error.message
    });
  }
};

// @desc    Create new permission
// @route   POST /api/roles/permissions
// @access  Private (Admin only)
export const createPermission = async (req, res) => {
  try {
    const { permission_name, permission_key, module, description } = req.body;

    if (!permission_name || !permission_key) {
      return res.status(400).json({ error: 'Permission name and key are required' });
    }

    // Check if permission already exists
    const existing = await sequelize.query(`
      SELECT id FROM permissions WHERE permission_key = :permission_key
    `, {
      replacements: { permission_key },
      type: sequelize.QueryTypes.SELECT
    });

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Permission with this key already exists' });
    }

    const permission = await sequelize.query(`
      INSERT INTO permissions (permission_key, permission_name, module, description)
      VALUES (:permission_key, :permission_name, :module, :description)
      RETURNING id, permission_key, permission_name, module, description
    `, {
      replacements: {
        permission_key,
        permission_name,
        module: module || 'Other',
        description: description || null
      },
      type: sequelize.QueryTypes.INSERT
    });

    res.status(201).json({
      success: true,
      data: permission[0][0]
    });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({
      error: 'Failed to create permission',
      details: error.message
    });
  }
};

// @desc    Update permission
// @route   PUT /api/roles/permissions/:id
// @access  Private (Admin only)
export const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { permission_name, permission_key, module, description } = req.body;

    // Check if permission exists
    const permission = await sequelize.query(`
      SELECT id FROM permissions WHERE id = :permId
    `, {
      replacements: { permId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!permission || permission.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await sequelize.query(`
      UPDATE permissions
      SET
        permission_name = COALESCE(:permission_name, permission_name),
        permission_key = COALESCE(:permission_key, permission_key),
        module = COALESCE(:module, module),
        description = COALESCE(:description, description)
      WHERE id = :permId
    `, {
      replacements: {
        permId: id,
        permission_name: permission_name || null,
        permission_key: permission_key || null,
        module: module || null,
        description: description || null
      },
      type: sequelize.QueryTypes.UPDATE
    });

    res.json({
      success: true,
      message: 'Permission updated successfully'
    });
  } catch (error) {
    console.error('Error updating permission:', error);
    res.status(500).json({
      error: 'Failed to update permission',
      details: error.message
    });
  }
};

// @desc    Delete permission
// @route   DELETE /api/roles/permissions/:id
// @access  Private (Admin only)
export const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const permission = await sequelize.query(`
      SELECT id FROM permissions WHERE id = :permId
    `, {
      replacements: { permId: id },
      type: sequelize.QueryTypes.SELECT
    });

    if (!permission || permission.length === 0) {
      return res.status(404).json({ error: 'Permission not found' });
    }

    await sequelize.query(`
      DELETE FROM permissions WHERE id = :permId
    `, {
      replacements: { permId: id },
      type: sequelize.QueryTypes.DELETE
    });

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting permission:', error);
    res.status(500).json({
      error: 'Failed to delete permission',
      details: error.message
    });
  }
};

// @desc    Get role statistics
// @route   GET /api/roles/stats
// @access  Private
export const getRoleStats = async (req, res) => {
  try {
    const totalRoles = await sequelize.query(`
      SELECT COUNT(*) as count FROM roles
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    const totalPermissions = await sequelize.query(`
      SELECT COUNT(*) as count FROM permissions
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    // Count users per role
    const rolesWithUserCount = await sequelize.query(`
      SELECT
        r.id,
        r.name as role_name,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON u.role::text = r.name
      GROUP BY r.id, r.name
      ORDER BY user_count DESC
    `, {
      type: sequelize.QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        total_roles: parseInt(totalRoles[0].count),
        total_permissions: parseInt(totalPermissions[0].count),
        roles_with_user_count: rolesWithUserCount
      }
    });
  } catch (error) {
    console.error('Error fetching role stats:', error);
    res.status(500).json({
      error: 'Failed to fetch role statistics',
      details: error.message
    });
  }
};
