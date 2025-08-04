const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');
const User = require('./userModel');

const KYC = sequelize.define('KYC', {
  kyc_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'user_id'
    }
  },
  document_type: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  document_number: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  document_image_url: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('unverified', 'pending', 'verified', 'rejected'),
    defaultValue: 'unverified'
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'kyc',
  timestamps: false
});

KYC.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(KYC, { foreignKey: 'user_id' });

module.exports = KYC;