const Wallet = require('../model/walletModel');
const KYC = require('../model/kycModel');

// Create a new wallet for the logged-in user
const createWallet = async (req, res) => {
    try {
        const userId = req.user.id;

        // Check KYC status
        const kyc = await KYC.findOne({ where: { user_id: userId, status: 'verified' } });
        if (!kyc) {
            return res.status(403).json({ success: false, message: "KYC verification required to create wallet." });
        }

        // Check if user already has a wallet
        const existingWallet = await Wallet.findOne({ where: { user_id: userId } });
        if (existingWallet) {
            return res.status(409).json({ success: false, message: "Wallet already exists for this user." });
        }

        // Create wallet
        const wallet = await Wallet.create({
            user_id: userId,
            balance: 0.00,
            is_active: true
        });

        return res.status(201).json({ success: true, wallet });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Fetch wallet for the logged-in user
const getWallet = async (req, res) => {
    try {
        const userId = req.user.id;
        const wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found." });
        }
        return res.json({ success: true, wallet });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = {
    createWallet,
    getWallet
};