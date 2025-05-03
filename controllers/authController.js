import authService from '../services/authService.js';

/**
 * Controller untuk mengelola permintaan autentikasi
 */
class AuthController {
  /**
   * Handler untuk pendaftaran pengguna baru
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async register(req, res) {
    try {
      const { username, password, email, repeatPassword, role } = req.body;

      // Validasi input
      if (!username || !password || !email || !repeatPassword) {
        return res.status(400).json({
          success: false,
          message: 'Semua field harus diisi'
        });
      }

      if (password !== repeatPassword) {
        return res.status(400).json({
          success: false,
          message: 'Password dan konfirmasi password tidak cocok'
        });
      }

      // Validasi format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format email tidak valid'
        });
      }

      // Validasi password (minimal 6 karakter)
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password harus minimal 6 karakter'
        });
      }

      // Proses pendaftaran
      const result = await authService.register({ username, password, email, role });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(201).json(result);
    } catch (error) {
      console.error('Error in register:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Handler untuk login pengguna
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async login(req, res) {
    try {
      console.log('Login request received:', req.body.username);
      const { username, password } = req.body;

      // Validasi input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password harus diisi'
        });
      }

      // Proses login
      const result = await authService.login({ username, password });

      if (!result.success) {
        console.log('Login failed:', result.message);
        return res.status(401).json(result);
      }

      // Set token in cookies
      res.setHeader('Set-Cookie', `token=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`);

      console.log('Login successful for user:', username);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in login:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new AuthController(); 