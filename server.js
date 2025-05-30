import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import path from 'path';
import serverless from 'serverless-http';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env only in development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
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
import scheduleRoutes from './routes/scheduleRoutes.js';

// Initialize express app
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  // credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Serve static files
app.use('/schedules', express.static(path.join(__dirname, 'uploads/schedules')));
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
app.use('/api/schedules', scheduleRoutes);

// Default route
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Absensi API is running' });
});

// Run server only in local development
if (process.env.NODE_ENV !== 'production') {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Export handler for Vercel
export const handler = serverless(app);
export default app;
