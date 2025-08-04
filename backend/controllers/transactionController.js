const { Op } = require('sequelize'); // Add this line
const Transaction = require('../model/transactionModel');
const Wallet = require('../model/walletModel');

// Create a new transaction (only from logged-in user's wallet)
const createTransaction = async (req, res) => {
  try {
    const { receiver_wallet_id, amount } = req.body;
    const userId = req.user.id;

    // Find sender's wallet (must belong to logged-in user)
    const senderWallet = await Wallet.findOne({ where: { user_id: userId } });
    if (!senderWallet) {
      return res.status(404).json({ success: false, message: 'Sender wallet not found.' });
    }

    // Prevent transaction if sender's wallet is frozen
    if (!senderWallet.is_active) {
      return res.status(403).json({ success: false, message: 'Your wallet is frozen. Transaction not allowed.' });
    }

    // Amount must be greater than 0
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than 0.' });
    }

    // Prevent sending to own wallet
    if (receiver_wallet_id == senderWallet.wallet_id) {
      return res.status(400).json({ success: false, message: 'Cannot send to your own wallet.' });
    }

    // Find receiver's wallet
    const receiverWallet = await Wallet.findByPk(receiver_wallet_id);
    if (!receiverWallet) {
      return res.status(404).json({ success: false, message: 'Receiver wallet not found.' });
    }

    // Check if sender has enough balance
    if (parseFloat(senderWallet.balance) < parseFloat(amount)) {
      return res.status(400).json({ success: false, message: 'Insufficient balance.' });
    }

    // Start transaction
    const result = await Transaction.sequelize.transaction(async (t) => {
      senderWallet.balance = parseFloat(senderWallet.balance) - parseFloat(amount);
      await senderWallet.save({ transaction: t });

      receiverWallet.balance = parseFloat(receiverWallet.balance) + parseFloat(amount);
      await receiverWallet.save({ transaction: t });

      const tx = await Transaction.create({
        sender_wallet_id: senderWallet.wallet_id,
        receiver_wallet_id,
        amount,
        status: 'completed'
      }, { transaction: t });

      return tx;
    });

    res.status(201).json({ success: true, transaction: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Transaction failed', error: error.message });
  }
};

// Get all transactions for logged-in user
const getAllTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const wallets = await Wallet.findAll({ where: { user_id: userId } });
    const walletIds = wallets.map(w => w.wallet_id);

    const transactions = await Transaction.findAll({
      where: {
        [Op.or]: [
          { sender_wallet_id: walletIds },
          { receiver_wallet_id: walletIds }
        ]
      }
    });

    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transactions', error: error.message });
  }
};

// Get transaction by ID (only if belongs to user)
const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const wallets = await Wallet.findAll({ where: { user_id: userId } });
    const walletIds = wallets.map(w => w.wallet_id);

    const transaction = await Transaction.findOne({
      where: {
        transaction_id: id,
        [Op.or]: [
          { sender_wallet_id: walletIds },
          { receiver_wallet_id: walletIds }
        ]
      }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction', error: error.message });
  }
};

module.exports = {
  createTransaction,
  getAllTransactions,
  getTransactionById
};