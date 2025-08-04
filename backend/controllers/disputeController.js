const Dispute = require('../model/disputeModel');
const Transaction = require('../model/transactionModel');
const Wallet = require('../model/walletModel');
const { Op } = require('sequelize');

// Create a new dispute for a transaction
const createDispute = async (req, res) => {
    try {
        const userId = req.user.id;
        const { transaction_id, reason } = req.body;

        // Get all wallet IDs for the user
        const wallets = await Wallet.findAll({ where: { user_id: userId } });
        const walletIds = wallets.map(w => w.wallet_id);

        // Check if transaction exists and belongs to user
        const transaction = await Transaction.findOne({
            where: {
                transaction_id,
                [Op.or]: [
                    { sender_wallet_id: walletIds },
                    { receiver_wallet_id: walletIds }
                ]
            }
        });
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaction not found or not accessible.' });
        }

        // Check if dispute already exists for this transaction
        const existingDispute = await Dispute.findOne({ where: { transaction_id } });
        if (existingDispute) {
            return res.status(409).json({ success: false, message: 'Dispute already exists for this transaction.' });
        }

        // Check if transaction is within 30 days
        const txDate = new Date(transaction.created_at);
        const now = new Date();
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30) {
            return res.status(400).json({ success: false, message: 'Dispute can only be created within 30 days of the transaction.' });
        }

        // Hold receiver's balance
        const receiverWallet = await Wallet.findByPk(transaction.receiver_wallet_id);
        if (!receiverWallet) {
            return res.status(404).json({ success: false, message: 'Receiver wallet not found.' });
        }

        // Allow balance to go negative if not enough funds
        receiverWallet.balance = parseFloat(receiverWallet.balance) - parseFloat(transaction.amount);
        receiverWallet.hold_balance = (parseFloat(receiverWallet.hold_balance) || 0) + parseFloat(transaction.amount);
        await receiverWallet.save();

        // Create dispute
        const dispute = await Dispute.create({
            transaction_id,
            user_id: userId,
            reason,
            status: 'open',
            created_at: new Date()
        });

        res.status(201).json({ success: true, dispute });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get all disputes for logged-in user
const getUserDisputes = async (req, res) => {
    try {
        const userId = req.user.id;
        const disputes = await Dispute.findAll({ where: { user_id: userId } });
        res.json({ success: true, disputes });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

// Get dispute by ID (only if belongs to user)
const getDisputeById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const dispute = await Dispute.findOne({ where: { dispute_id: id, user_id: userId } });
        if (!dispute) {
            return res.status(404).json({ success: false, message: 'Dispute not found.' });
        }
        res.json({ success: true, dispute });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    createDispute,
    getUserDisputes,
    getDisputeById
};