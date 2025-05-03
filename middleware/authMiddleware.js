import supabase from '../config/supabase.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Kunci rahasia untuk JWT (sama dengan service)
// PENTING: Ganti dengan nilai tetap di production
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_FOR_DEVELOPMENT_ONLY";
console.log('Auth Middleware menggunakan JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');

/**
 * Middleware untuk verifikasi token JWT
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const authMiddleware = async (req, res, next) => {
  try {
    console.log('====== AUTH MIDDLEWARE =======');
    console.log('Headers:', JSON.stringify(req.headers));
    
    // Ambil token dari header atau cookie
    let token;
    
    if (req.headers.authorization) {
      console.log('Authorization header found:', req.headers.authorization);
      
      // Fix untuk mengatasi duplikasi kata "Bearer"
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer Bearer ')) {
        // Kasus duplikasi Bearer
        token = authHeader.substring('Bearer Bearer '.length);
        console.log('Double Bearer detected, extracting token');
      } else if (authHeader.startsWith('Bearer ')) {
        // Kasus normal
        token = authHeader.substring('Bearer '.length);
        console.log('Normal Bearer format');
      } else {
        // Format lain 
        token = authHeader;
        console.log('Using raw Authorization header value');
      }
    } else if (req.cookies?.token) {
      token = req.cookies.token;
      console.log('Token from cookies');
    }
    
    console.log('Token diterima:', token ? `${token.substring(0, 20)}...` : 'Tidak ada token');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak ditemukan',
      });
    }

    // Verifikasi token JWT
    try {
      console.log('Mencoba verifikasi token dengan secret:', JWT_SECRET.substring(0, 5) + '...');
      const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
      console.log('Token valid. Decoded payload:', JSON.stringify(decoded));
      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      console.error('JWT error name:', jwtError.name);
      
      // Coba verifikasi dengan opsi lain
      try {
        // Coba dengan ignoreExpiration
        const decodedIgnoreExp = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        console.log('Token valid kecuali expiration:', JSON.stringify(decodedIgnoreExp));
        if (jwtError.name === 'TokenExpiredError') {
          return res.status(401).json({
            success: false,
            message: 'Akses ditolak. Token sudah kedaluwarsa',
          });
        }
      } catch (secondErr) {
        console.error('Verifikasi kedua juga gagal:', secondErr.message);
      }
      
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token tidak valid',
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Middleware untuk membatasi akses berdasarkan role
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {Function} Middleware function
 */
export const roleMiddleware = (roles) => {
  return async (req, res, next) => {
    try {
      // Cek role dari user yang didapat dari token JWT
      const userRole = req.user.role;
      console.log('Checking role:', userRole, 'Required roles:', roles);
      
      if (!userRole || !roles.includes(userRole)) {
        console.log('Access denied: role not allowed');
        return res.status(403).json({
          success: false,
          message: 'Akses ditolak. Anda tidak memiliki izin yang cukup',
        });
      }

      console.log('Role verified, access granted');
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
}; 