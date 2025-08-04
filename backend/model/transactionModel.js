const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const Wallet = require('./walletModel');

const Transaction = sequelize.define('Transaction', {
  transaction_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  sender_wallet_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'wallets',
      key: 'wallet_id'
    }
  },
  receiver_wallet_id: {
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
  status: {
    type: DataTypes.ENUM('completed', 'refunded'),
    defaultValue: 'completed'
  },
  transaction_time: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'transactions',
  timestamps: false
});

Transaction.belongsTo(Wallet, { as: 'SenderWallet', foreignKey: 'sender_wallet_id' });
Transaction.belongsTo(Wallet, { as: 'ReceiverWallet', foreignKey: 'receiver_wallet_id' });

module.exports = Transaction;