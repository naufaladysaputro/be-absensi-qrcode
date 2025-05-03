import supabase from '../config/supabase.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Secret key yang sama persis dengan middleware
const JWT_SECRET = process.env.JWT_SECRET || "SECRET_KEY_FOR_DEVELOPMENT_ONLY";

/**
 * Service untuk mengelola autentikasi pengguna
 */
class AuthService {
  constructor() {
    console.log('Auth Service menggunakan JWT_SECRET:', JWT_SECRET.substring(0, 5) + '...');
  }
  
  /**
   * Mendaftarkan pengguna baru
   * @param {Object} userData - Data pengguna yang akan didaftarkan
   * @param {string} userData.username - Username pengguna
   * @param {string} userData.password - Password pengguna
   * @param {string} userData.email - Email pengguna
   * @param {string} userData.role - Role pengguna (admin/guru)
   * @returns {Promise<Object>} - Hasil pendaftaran
   */
  async register(userData) {
    try {
      // Cek apakah username atau email sudah terdaftar
      const { data: existingUser, error: searchError } = await supabase
        .from('users')
        .select('username, email')
        .or(`username.eq."${userData.username}",email.eq."${userData.email}"`)
        .single();

      if (searchError && searchError.code !== 'PGRST116') {
        throw new Error(`Error mencari pengguna: ${searchError.message}`);
      }

      if (existingUser) {
        if (existingUser.username === userData.username) {
          throw new Error('Username sudah terdaftar');
        }
        if (existingUser.email === userData.email) {
          throw new Error('Email sudah terdaftar');
        }
      }

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Simpan pengguna baru ke database
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password: hashedPassword,
          role: userData.role || 'guru', // Default role: guru
        })
        .select('id, username, email, role, created_at')
        .single();

      if (error) {
        throw new Error(`Error mendaftarkan pengguna: ${error.message}`);
      }

      return {
        success: true,
        message: 'Pendaftaran berhasil',
        user: data
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Login pengguna
   * @param {Object} credentials - Kredensial login
   * @param {string} credentials.username - Username pengguna
   * @param {string} credentials.password - Password pengguna
   * @returns {Promise<Object>} - Hasil login
   */
  async login(credentials) {
    try {
      console.log(`Attempting login for user: ${credentials.username}`);
      
      // Cari pengguna berdasarkan username
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .maybeSingle();

      if (error) {
        console.error('Error mencari pengguna:', error);
        throw new Error(`Error login: ${error.message}`);
      }

      if (!user) {
        console.log('User tidak ditemukan di database');
        throw new Error('Username atau password salah');
      }

      console.log(`User ditemukan: ${user.username}, id: ${user.id}, role: ${user.role}`);

      // Verifikasi password
      console.log('Verifikasi password...');
      const passwordMatch = await bcrypt.compare(credentials.password, user.password);
      
      if (!passwordMatch) {
        console.log('Password tidak cocok');
        throw new Error('Username atau password salah');
      }
      
      console.log('Password cocok!');

      // Buat token JWT secara manual (tidak menggunakan Supabase Auth)
      const tokenPayload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 hari
      };
      
      // Buat JWT token
      const token = jwt.sign(tokenPayload, JWT_SECRET, { algorithm: 'HS256' });
      console.log('Token berhasil dibuat dengan algorithm HS256');
      console.log('Token awal:', token.substring(0, 20) + '...');

      // Hapus password dari objek user sebelum dikembalikan
      const { password, ...userWithoutPassword } = user;

      return {
        success: true,
        message: 'Login berhasil',
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Error dalam proses login:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default new AuthService(); 