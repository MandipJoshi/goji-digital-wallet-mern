const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const Admin = require('./adminModel');

const AdminActivityLog = sequelize.define('AdminActivityLog', {
  log_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admins',
      key: 'admin_id'
    }
  },
  action: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  target_type: {
    type: DataTypes.STRING(50), // e.g. 'user', 'wallet'
    allowNull: false
  },
  target_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'admin_activity_logs',
  timestamps: false
});

AdminActivityLog.belongsTo(Admin, { foreignKey: 'admin_id' });

module.exports = AdminActivityLog;