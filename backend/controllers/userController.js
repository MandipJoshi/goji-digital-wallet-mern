const User = require("../model/userModel");
const bcrypt = require('bcrypt');
require("dotenv").config();
const jwt = require('jsonwebtoken');

// Create a new user
const createUser = async (req, res) => {
    try {
        const { full_name, email, phone, password } = req.body;

        // Check if email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "Email already registered" });
        }

        // Check if phone already exists
        const existingPhone = await User.findOne({ where: { phone } });
        if (existingPhone) {
            return res.status(409).json({ success: false, message: "Phone number already registered" });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await User.create({
            full_name,
            email,
            phone,
            password_hash: hashedPassword
        });

        return res.status(201).json({ success: true, user: { id: newUser.user_id, full_name: newUser.full_name, email: newUser.email, phone: newUser.phone } });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: "Account is suspended. Please contact support." });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.user_id, email: user.email },
            process.env.JWT_TOKEN,
            { expiresIn: '24h' }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone
            }
        });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Update password
const updatePassword = async (req, res) => {
    try {
        // Get user_id from JWT (set by auth middleware)
        const user_id = req.user.id;
        const { oldPassword, newPassword } = req.body;

        const user = await User.findOne({ where: { user_id } });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Old password is incorrect" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password_hash = hashedPassword;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    createUser,
    loginUser,
    updatePassword,
};