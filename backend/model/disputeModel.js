const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const Transaction = require('./transactionModel');
const User = require('./userModel');

const Dispute = sequelize.define('Dispute', {
  dispute_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  transaction_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('open', 'under_review', 'resolved', 'rejected'),
    defaultValue: 'open'
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'disputes',
  timestamps: false
});

Dispute.belongsTo(Transaction, { foreignKey: 'transaction_id' });
Dispute.belongsTo(User, { foreignKey: 'user_id' });

module.exports = Dispute;