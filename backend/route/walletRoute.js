const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createWallet, getWallet } = require('../controllers/walletController');

// Create wallet (only for logged-in user)
router.post('/', auth, createWallet);
router.get('/', auth, getWallet); // <-- Add this line

module.exports = router;