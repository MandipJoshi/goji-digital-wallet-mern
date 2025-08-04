const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const fileUpload = require('../middleware/multer');
const { submitKYC, getKYCStatus, reviewKYC, getKYCImage } = require('../controllers/kycController');

// User submits KYC with image upload (field name: 'document_image')
router.post('/', auth, fileUpload('document_image'), submitKYC);


// Get KYC status
router.get('/', auth, getKYCStatus);

// Get KYC image
router.get('/docimage', auth, getKYCImage);


module.exports = router;