const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const Admin = sequelize.define('Admin', {
  admin_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  admin_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  admin_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  tableName: 'admins',
  timestamps: false
});

module.exports = Admin;