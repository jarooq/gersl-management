const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TaskComment = sequelize.define('TaskComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'task_id',
      references: {
        model: 'tasks',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    mentionedUsers: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      field: 'mentioned_users'
    },
    isEdited: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_edited'
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'task_comments',
    timestamps: true,
    underscored: true
  });

  TaskComment.associate = (models) => {
    TaskComment.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'Task'
    });

    TaskComment.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'User'
    });
  };

  return TaskComment;
};
