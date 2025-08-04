const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  createTransaction,
  getAllTransactions,
  getTransactionById
} = require('../controllers/transactionController');

// All routes require authentication
router.post('/', auth, createTransaction);
router.get('/', auth, getAllTransactions);
router.get('/:id', auth, getTransactionById);

module.exports = router;