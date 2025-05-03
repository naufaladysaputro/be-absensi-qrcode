import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import fs from 'fs';
import path from 'path';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Manual environment variable loading
try {
  // Path ke file .env
  const envPath = resolve(__dirname, '.env');
  console.log(`Mencoba membaca file .env dari: ${envPath}`);
  
  if (fs.existsSync(envPath)) {
    console.log("File .env ditemukan!");
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    
    // Set process.env
    for (const key in envConfig) {
      process.env[key] = envConfig[key];
      console.log(`Loaded ${key}=${process.env[key] ? '[value loaded]' : '[failed]'}`);
    }
  } else {
    console.log("File .env tidak ditemukan!");
  }
} catch (error) {
  console.error("Error membaca file .env:", error);
}

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import selectionsRoutes from './routes/selectionsRoutes.js';
import classesRoutes from './routes/classesRoutes.js';
import studentsRoutes from './routes/studentsRoutes.js';
import qrCodesRoutes from './routes/qrCodesRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';

// Initialize express app
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/exports', express.static(path.join(__dirname, 'uploads/exports')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/selections', selectionsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/students', studentsRoutes);
app.use('/api/qrcodes', qrCodesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Absensi API is running' });
});

// Start server


if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`JWT Secret: ${process.env.JWT_SECRET ? 'Loaded' : 'Missing'}`);
    console.log(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'Missing'}`);
    console.log(`Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY ? 'Loaded' : 'Missing'}`);
  });
}
export const handler = serverless(app); // Ini penting untuk Vercel

export default app;