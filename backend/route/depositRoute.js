const express = require('express');
const router = express.Router();
const { depositToWallet, getDepositsForWallet } = require('../controllers/depositController');
const auth = require('../middleware/auth');

// Bank deposit endpoint
router.post('/', depositToWallet);

// User deposit history (requires auth)
router.get('/history/:wallet_id', auth, getDepositsForWallet);

module.exports = router;