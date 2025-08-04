const multer = require('multer');  // Import multer for handling file uploads
const { v4: uuidv4 } = require('uuid');  // Import uuid to generate unique identifiers for filenames
const path = require('path');  // Import path module to handle file paths

// Set up storage configuration for file uploads
const storage = multer.diskStorage({
    // Define the destination directory for uploaded files
    destination: (req, file, cb) => {
        cb(null, "./uploads");  // Files will be stored in the 'uploads' folder
    },
    // Define the naming convention for uploaded files
    filename: (req, file, cb) => {
        // Extract the file extension from the original filename
        const ext = path.extname(file.originalname);
        
        // Get the base name of the file (without extension) and replace spaces with underscores
        const baseName = path.basename(file.originalname, ext).replace(/\s/g, "_");
        
        // Generate a unique name using the original base name, UUID, and the file extension
        const uniqueName = `${baseName}_${uuidv4()}${ext}`;
        
        // Set the final filename
        cb(null, uniqueName);
    }
});

// File filter to validate the file type
const fileFilter = (req, file, callback) => {
    // Only allow PNG, JPG, and JPEG file formats
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/i)) {
        return callback(new Error('Invalid file format. Only PNG, JPEG and JPG are allowed.'), false);  // Reject invalid file formats
    }
    callback(null, true);  // Allow the file if it's valid
};

// Create a function to handle file upload for a specific field name
const fileUpload = (fieldName) => multer({
    storage,  // Use the storage configuration defined earlier
    fileFilter  // Use the file filter to check the file type
}).single(fieldName);  // Handle a single file upload based on the specified field name

module.exports = fileUpload;  // Export the fileUpload function for use in other parts of the application
