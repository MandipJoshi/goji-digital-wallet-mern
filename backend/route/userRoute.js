const express = require('express');
const router = express.Router();
const { createUser, loginUser, updatePassword } = require('../controllers/userController');
const auth = require('../middleware/auth');

// Register user
router.post('/register', createUser);

// Login user
router.post('/login', loginUser);

router.patch('/update-password', auth, updatePassword);

module.exports = router;