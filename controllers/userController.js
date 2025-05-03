import userService from '../services/userService.js';

/**
 * Controller untuk mengelola user
 */
class UserController {
  /**
   * Mendapatkan semua user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getAllUsers(req, res) {
    try {
      // Parameter untuk menentukan apakah menyertakan user yang dihapus
      const includeDeleted = req.query.includeDeleted === 'true';
      
      const result = await userService.getAllUsers(includeDeleted);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
  /**
   * Mendapatkan user berdasarkan ID
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }
      
      const result = await userService.getUserById(parseInt(id));
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in getUserById:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
  /**
   * Memperbarui data user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }
      
      if (Object.keys(userData).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada data yang diupdate'
        });
      }
      
      // Validasi data yang diupdate
      if (userData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Format email tidak valid'
          });
        }
      }
      
      if (userData.password) {
        if (userData.password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password harus minimal 6 karakter'
          });
        }
        
        // Jika password diupdate, pastikan ada repeatPassword
        if (!userData.repeatPassword || userData.password !== userData.repeatPassword) {
          return res.status(400).json({
            success: false,
            message: 'Password dan konfirmasi password tidak cocok'
          });
        }
        
        // Hapus repeatPassword dari data yang akan disimpan
        delete userData.repeatPassword;
      }
      
      const result = await userService.updateUser(parseInt(id), userData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in updateUser:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
  
  /**
   * Menghapus user
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'ID user tidak valid'
        });
      }
      
      const result = await userService.deleteUser(parseInt(id));
      
      if (!result.success) {
        return res.status(404).json(result);
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in deleteUser:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export default new UserController(); 