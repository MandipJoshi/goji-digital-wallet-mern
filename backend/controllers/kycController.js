const KYC = require('../model/kycModel');
const path = require('path');
const fs = require('fs');

// Submit KYC with document image upload
const submitKYC = async (req, res) => {
    try {
        const userId = req.user.id;
        const { document_type, document_number } = req.body;
        // Get uploaded file path
        const document_image_url = req.file ? req.file.path : null;

        if (!document_image_url) {
            return res.status(400).json({ success: false, message: "Document image is required." });
        }

        // Check if KYC already exists for user
        const existingKYC = await KYC.findOne({ where: { user_id: userId } });
        if (existingKYC) {
            return res.status(409).json({ success: false, message: "KYC already submitted." });
        }

        const kyc = await KYC.create({
            user_id: userId,
            document_type,
            document_number,
            document_image_url,
            status: 'pending',
            submitted_at: new Date()
        });

        return res.status(201).json({ success: true, kyc });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Get KYC status for logged-in user
const getKYCStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const kyc = await KYC.findOne({ where: { user_id: userId } });
        if (!kyc) {
            return res.status(404).json({ success: false, message: "KYC not found." });
        }
        return res.json({ success: true, kyc });
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

// Get KYC image for logged-in user
const getKYCImage = async (req, res) => {
    try {
        const userId = req.user.id;
        const kyc = await KYC.findOne({ where: { user_id: userId } });
        if (!kyc || !kyc.document_image_url) {
            return res.status(404).json({ success: false, message: "KYC image not found." });
        }
        const imagePath = path.resolve(kyc.document_image_url);
        if (!fs.existsSync(imagePath)) {
            return res.status(404).json({ success: false, message: "File not found." });
        }
        res.sendFile(imagePath);
    } catch (error) {
        return res.status(400).json({ success: false, error: error.message });
    }
};

module.exports = {
    submitKYC,
    getKYCStatus,
    getKYCImage,
};