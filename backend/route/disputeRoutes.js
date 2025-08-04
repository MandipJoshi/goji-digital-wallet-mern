const express = require('express');
const router = express.Router();
const { createDispute, getUserDisputes, getDisputeById } = require('../controllers/disputeController');
const authenticate = require('../middleware/auth'); // Adjust path if needed

// Create a new dispute
router.post('/', authenticate, createDispute);

// Get all disputes for logged-in user
router.get('/', authenticate, getUserDisputes);

// Get a specific dispute by ID
router.get('/:id', authenticate, getDisputeById);

module.exports = router;