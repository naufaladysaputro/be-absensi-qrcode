import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to create upload middleware for different types
const createUploadMiddleware = (type) => {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.join(__dirname, `../uploads/${type}`);
  fs.mkdirSync(uploadDir, { recursive: true });

  // Configure storage
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      // Get file extension
      const ext = path.extname(file.originalname);
      // Create filename: type_timestamp.ext
      cb(null, `${type}_${Date.now()}${ext}`);
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

  // Create multer instance
  return multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 1024 * 1024 * 5 // 5MB limit
    }
  });
};

export default createUploadMiddleware;
