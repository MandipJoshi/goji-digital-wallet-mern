const User = require('../model/userModel');
const Wallet = require('../model/walletModel');
const Transaction = require('../model/transactionModel');
const KYC = require('../model/kycModel');
const Dispute = require('../model/disputeModel');
const AdminActivityLog = require('../model/adminActivityLogModel');
const Admin = require('../model/adminModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Suspend a user account (admin only)
const suspendUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.status = 'suspended';
        await user.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: 'suspend_user',
            target_type: 'user',
            target_id: user_id
        });

        return res.json({ success: true, message: "User account suspended" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Freeze a wallet (admin only)
const freezeWallet = async (req, res) => {
    try {
        const { wallet_id } = req.params;
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins
        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }
        wallet.is_active = false;
        await wallet.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: 'freeze_wallet',
            target_type: 'wallet',
            target_id: wallet_id
        });

        return res.json({ success: true, message: "Wallet frozen" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Unfreeze a wallet (admin only)
const unfreezeWallet = async (req, res) => {
    try {
        const { wallet_id } = req.params;
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins
        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }
        wallet.is_active = true;
        await wallet.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: 'unfreeze_wallet',
            target_type: 'wallet',
            target_id: wallet_id
        });

        return res.json({ success: true, message: "Wallet unfrozen" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// (Admin) Verify or reject KYC
const reviewKYC = async (req, res) => {
    try {
        const { kyc_id } = req.params;
        const { status } = req.body; // should be 'verified' or 'rejected'
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins

        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        const kyc = await KYC.findByPk(kyc_id);
        if (!kyc) {
            return res.status(404).json({ success: false, message: "KYC not found." });
        }

        kyc.status = status;
        if (status === 'verified') {
            kyc.verified_at = new Date();
        }
        await kyc.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: status === 'verified' ? 'verify_kyc' : 'reject_kyc',
            target_type: 'kyc',
            target_id: kyc_id
        });

        return res.json({ success: true, kyc });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// (Admin) Solve dispute
const solveDispute = async (req, res) => {
    try {
        const { dispute_id } = req.params;
        const { resolution } = req.body; // 'accepted' or 'rejected'
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins

        if (!['accepted', 'rejected'].includes(resolution)) {
            return res.status(400).json({ success: false, message: "Invalid resolution." });
        }

        const dispute = await Dispute.findByPk(dispute_id);
        if (!dispute) {
            return res.status(404).json({ success: false, message: "Dispute not found." });
        }
        if (dispute.status !== 'open' && dispute.status !== 'under_review') {
            return res.status(400).json({ success: false, message: "Dispute already resolved or rejected." });
        }

        const transaction = await Transaction.findByPk(dispute.transaction_id);
        if (!transaction) {
            return res.status(404).json({ success: false, message: "Transaction not found." });
        }

        const receiverWallet = await Wallet.findByPk(transaction.receiver_wallet_id);
        const senderWallet = await Wallet.findByPk(transaction.sender_wallet_id);

        if (!receiverWallet || !senderWallet) {
            return res.status(404).json({ success: false, message: "Wallet not found." });
        }

        const amount = parseFloat(transaction.amount);

        if (resolution === 'rejected') {
            // Release hold: move hold_balance back to receiver's main balance
            receiverWallet.hold_balance = parseFloat(receiverWallet.hold_balance) - amount;
            receiverWallet.balance = parseFloat(receiverWallet.balance) + amount;
            dispute.status = 'rejected';
        } else if (resolution === 'accepted') {
            // Deduct from receiver's hold_balance and main balance, add to sender's balance
            receiverWallet.hold_balance = parseFloat(receiverWallet.hold_balance) - amount;
            receiverWallet.balance = parseFloat(receiverWallet.balance); // Already deducted when dispute created
            senderWallet.balance = parseFloat(senderWallet.balance) + amount;
            dispute.status = 'resolved';
        }

        await receiverWallet.save();
        await senderWallet.save();
        await dispute.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: resolution === 'accepted' ? 'accept_dispute' : 'reject_dispute',
            target_type: 'dispute',
            target_id: dispute_id
        });

        return res.json({ success: true, dispute });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Get all users (admin only)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all wallets (admin only)
const getAllWallets = async (req, res) => {
    try {
        const wallets = await Wallet.findAll();
        res.json({ wallets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all KYC records (admin only)
const getAllKycs = async (req, res) => {
    try {
        const kycs = await KYC.findAll();
        res.json({ kycs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all disputes (admin only)
const getAllDisputes = async (req, res) => {
    try {
        const disputes = await Dispute.findAll();
        res.json({ disputes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Activate a user account (admin only)
const activateUser = async (req, res) => {
    try {
        const { user_id } = req.params;
        const admin_id = req.user.admin_id; // Make sure your auth middleware sets this for admins
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        user.status = 'active';
        await user.save();

        // Log activity
        await AdminActivityLog.create({
            admin_id,
            action: 'activate_user',
            target_type: 'user',
            target_id: user_id
        });

        return res.json({ success: true, message: "User account activated" });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

// Admin login
const adminLogin = async (req, res) => {
    try {
        const { admin_code, password } = req.body;
        const admin = await Admin.findOne({ where: { admin_code, is_active: true } });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found or inactive" });
        }
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        const token = jwt.sign(
            { admin_id: admin.admin_id, admin_code: admin.admin_code },
            process.env.JWT_TOKEN,
            { expiresIn: '30m' }
        );
        return res.status(200).json({
            success: true,
            message: 'Admin login successful',
            token,
            admin: {
                admin_id: admin.admin_id,
                admin_name: admin.admin_name,
                admin_code: admin.admin_code
            }
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    suspendUser,
    freezeWallet,
    unfreezeWallet,
    reviewKYC,
    solveDispute,
    getAllUsers,
    getAllWallets,
    getAllKycs,
    getAllDisputes,
    activateUser,
    adminLogin,
};