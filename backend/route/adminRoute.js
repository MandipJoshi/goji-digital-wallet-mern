const express = require('express');
const router = express.Router();
const { suspendUser, freezeWallet, reviewKYC, solveDispute, getAllUsers, getAllWallets, getAllKycs, getAllDisputes, activateUser, unfreezeWallet, adminDeposit, adminLogin } = require('../controllers/adminController');
const auth  = require('../middleware/auth');

// Optionally, add an admin auth middleware here

// Admin login
router.post('/login', adminLogin);

// Suspend a user account
router.patch('/user/:user_id/suspend', auth, suspendUser);

// Freeze a wallet
router.patch('/wallet/:wallet_id/freeze', auth, freezeWallet);

// Unfreeze a wallet
router.patch('/wallet/:wallet_id/unfreeze', auth, unfreezeWallet);

// Review (verify/reject) KYC
router.patch('/kyc/:kyc_id/review', auth, reviewKYC);

// Solve a dispute (accept/reject)
router.post('/dispute/:dispute_id/solve', auth, solveDispute);

// List all users
router.get('/user/all', auth, getAllUsers);

// List all wallets
router.get('/wallet/all', auth, getAllWallets);

// List all KYC requests
router.get('/kyc/all', auth, getAllKycs);

// List all disputes
router.get('/dispute/all', auth, getAllDisputes);

// Activate a user account
router.patch('/user/:user_id/activate', auth, activateUser);

module.exports = router;