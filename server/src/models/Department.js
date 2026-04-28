import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Department = sequelize.define('Department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'from-blue-500 to-cyan-600'
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'departments',
    timestamps: true
  });

  return Department;
};
