const Deposit = require('../model/depositModel');
const Wallet = require('../model/walletModel');

// You can store allowed keys in .env or a config file
const BANK_API_KEYS = (process.env.BANK_API_KEYS);

const depositToWallet = async (req, res) => {
    const apiKey = req.headers['x-bank-api-key'];
    if (!BANK_API_KEYS.includes(apiKey)) {
        return res.status(403).json({ success: false, message: 'Forbidden: Invalid bank API key.' });
    }
    try {
        const { wallet_id, amount, bank_reference } = req.body;
        if (!wallet_id || !amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid wallet or amount.' });
        }
        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) {
            return res.status(404).json({ success: false, message: 'Wallet not found.' });
        }
        wallet.balance = parseFloat(wallet.balance) + parseFloat(amount);
        await wallet.save();

        const deposit = await Deposit.create({
            wallet_id,
            amount,
            bank_reference
        });

        return res.status(201).json({ success: true, deposit, wallet });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

const getDepositsForWallet = async (req, res) => {
    try {
        // Get wallet_id from params or from user's wallet
        const wallet_id = req.params.wallet_id || req.user.wallet_id;
        if (!wallet_id) {
            return res.status(400).json({ success: false, message: 'Wallet ID required.' });
        }
        const deposits = await Deposit.findAll({
            where: { wallet_id },
            order: [['deposited_at', 'DESC']]
        });
        return res.json({ success: true, deposits });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { depositToWallet, getDepositsForWallet };