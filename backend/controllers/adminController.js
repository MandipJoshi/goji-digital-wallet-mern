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
        const { user_id } = req.params;  // Get the user_id from request parameters
        const admin_id = req.user.admin_id;  // Get the admin_id from the request (set by auth middleware)
        
        // Find the user by user_id
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Change the user's status to 'suspended'
        user.status = 'suspended';
        await user.save();

        // Log the admin action
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
        const { wallet_id } = req.params;  // Get the wallet_id from request parameters
        const admin_id = req.user.admin_id;  // Get the admin_id from the request
        
        // Find the wallet by wallet_id
        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }
        
        // Set the wallet's status to inactive (frozen)
        wallet.is_active = false;
        await wallet.save();

        // Log the admin action
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
        const { wallet_id } = req.params;  // Get the wallet_id from request parameters
        const admin_id = req.user.admin_id;  // Get the admin_id from the request
        
        // Find the wallet by wallet_id
        const wallet = await Wallet.findByPk(wallet_id);
        if (!wallet) {
            return res.status(404).json({ success: false, message: "Wallet not found" });
        }
        
        // Set the wallet's status to active (unfrozen)
        wallet.is_active = true;
        await wallet.save();

        // Log the admin action
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
        const { kyc_id } = req.params;  // Get the kyc_id from request parameters
        const { status } = req.body;  // Status should be 'verified' or 'rejected'
        const admin_id = req.user.admin_id;  // Get the admin_id from the request
        
        // Validate the status
        if (!['verified', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status." });
        }

        // Find the KYC record by kyc_id
        const kyc = await KYC.findByPk(kyc_id);
        if (!kyc) {
            return res.status(404).json({ success: false, message: "KYC not found." });
        }

        // Update the KYC status
        kyc.status = status;
        if (status === 'verified') {
            kyc.verified_at = new Date();
        }
        await kyc.save();

        // Log the admin action
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
        const { dispute_id } = req.params;  // Get the dispute_id from request parameters
        const { resolution } = req.body;  // Resolution should be 'accepted' or 'rejected'
        const admin_id = req.user.admin_id;  // Get the admin_id from the request
        
        // Validate the resolution
        if (!['accepted', 'rejected'].includes(resolution)) {
            return res.status(400).json({ success: false, message: "Invalid resolution." });
        }

        // Find the dispute by dispute_id
        const dispute = await Dispute.findByPk(dispute_id);
        if (!dispute) {
            return res.status(404).json({ success: false, message: "Dispute not found." });
        }
        if (dispute.status !== 'open' && dispute.status !== 'under_review') {
            return res.status(400).json({ success: false, message: "Dispute already resolved or rejected." });
        }

        // Find the associated transaction and wallets
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

        // Resolve or reject the dispute based on the resolution
        if (resolution === 'rejected') {
            receiverWallet.hold_balance = parseFloat(receiverWallet.hold_balance) - amount;
            receiverWallet.balance = parseFloat(receiverWallet.balance) + amount;
            dispute.status = 'rejected';
        } else if (resolution === 'accepted') {
            receiverWallet.hold_balance = parseFloat(receiverWallet.hold_balance) - amount;
            receiverWallet.balance = parseFloat(receiverWallet.balance);
            senderWallet.balance = parseFloat(senderWallet.balance) + amount;
            dispute.status = 'resolved';
        }

        await receiverWallet.save();
        await senderWallet.save();
        await dispute.save();

        // Log the admin action
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
        // Fetch all users
        const users = await User.findAll();
        res.json({ users });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all wallets (admin only)
const getAllWallets = async (req, res) => {
    try {
        // Fetch all wallets
        const wallets = await Wallet.findAll();
        res.json({ wallets });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all KYC records (admin only)
const getAllKycs = async (req, res) => {
    try {
        // Fetch all KYC records
        const kycs = await KYC.findAll();
        res.json({ kycs });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Get all disputes (admin only)
const getAllDisputes = async (req, res) => {
    try {
        // Fetch all disputes
        const disputes = await Dispute.findAll();
        res.json({ disputes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// Activate a user account (admin only)
const activateUser = async (req, res) => {
    try {
        const { user_id } = req.params;  // Get the user_id from request parameters
        const admin_id = req.user.admin_id;  // Get the admin_id from the request
        
        // Find the user by user_id
        const user = await User.findByPk(user_id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        
        // Change the user's status to 'active'
        user.status = 'active';
        await user.save();

        // Log the admin action
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
        const { admin_code, password } = req.body;  // Get admin login credentials
        const admin = await Admin.findOne({ where: { admin_code, is_active: true } });
        if (!admin) {
            return res.status(404).json({ success: false, message: "Admin not found or inactive" });
        }
        
        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, admin.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
        
        // Generate a JWT token for the admin
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
