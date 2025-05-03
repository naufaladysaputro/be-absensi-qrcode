import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads/logo directory if it doesn't exist
const logoDir = path.join(__dirname, '../uploads/logo');
fs.mkdirSync(logoDir, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, logoDir);
  },
  filename: function (req, file, cb) {
    // Get file extension
    const ext = path.extname(file.originalname);
    // Create filename: logo_timestamp.ext
    cb(null, 'logo_' + Date.now() + ext);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar yang diperbolehkan'), false);
  }
};

// Create multer upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 2 // 2MB limit
  }
}).single('logo');

// Wrapper function to handle multer errors
const handleUpload = (req, res, next) => {
  upload(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      // A Multer error occurred when uploading
      return res.status(400).json({
        success: false,
        message: 'Error saat upload file: ' + err.message
      });
    } else if (err) {
      // An unknown error occurred when uploading
      return res.status(400).json({
        success: false,
        message: err.message || 'Terjadi kesalahan saat upload file'
      });
    }
    // Everything went fine
    next();
  });
};

export default handleUpload;