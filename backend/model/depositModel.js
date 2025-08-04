const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const Wallet = require('./walletModel');

const Deposit = sequelize.define('Deposit', {
  deposit_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  wallet_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'wallets',
      key: 'wallet_id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deposited_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  bank_reference: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'deposits',
  timestamps: false
});

Deposit.belongsTo(Wallet, { foreignKey: 'wallet_id' });

module.exports = Deposit;