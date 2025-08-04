const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads");
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext).replace(/\s/g, "_");
        const uniqueName = `${baseName}_${uuidv4()}${ext}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, callback) => {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/i)) {
        return callback(new Error('Invalid file format. Only PNG, JPEG and JPG are allowed.'), false);
    }
    callback(null, true);
};

const fileUpload = (fieldName) => multer({
    storage,
    fileFilter
}).single(fieldName);

module.exports = fileUpload;