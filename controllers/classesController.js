import classesService from '../services/classesService.js';
import selectionsService from '../services/selectionsService.js';

/**
 * Controller untuk manajemen data kelas
 */
class ClassesController {
  /**
   * Mendapatkan semua kelas
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllClasses(req, res) {
    try {
      const classes = await classesService.getAllClasses();
      return res.status(200).json({
        status: 'success',
        data: classes
      });
    } catch (error) {
      console.error('Error in getAllClasses controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data kelas'
      });
    }
  }
  
  /**
   * Mendapatkan kelas berdasarkan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getClassById(req, res) {
    try {
      const { id } = req.params;
      const kelas = await classesService.getClassById(id);
      
      if (!kelas) {
        return res.status(404).json({
          status: 'error',
          message: 'Kelas tidak ditemukan'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: kelas
      });
    } catch (error) {
      console.error('Error in getClassById controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data kelas'
      });
    }
  }
  
  /**
   * Membuat kelas baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createClass(req, res) {
    try {
      const { nama_kelas, selections_id } = req.body;
      
      // Validate required fields
      if (!nama_kelas || !selections_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama kelas dan rombel harus diisi'
        });
      }

      // Validate if selection exists
      const selection = await selectionsService.getSelectionById(selections_id);
      if (!selection) {
        return res.status(400).json({
          status: 'error',
          message: 'Rombel yang dipilih tidak valid'
        });
      }
      
      // Check if class name already exists in the same selection
      const exists = await classesService.checkClassNameExists(nama_kelas, selections_id);
      if (exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama kelas sudah ada dalam rombel yang sama'
        });
      }
      
      const userId = req.user.id;
      const classId = await classesService.createClass({ nama_kelas, selections_id }, userId);
      
      const newClass = await classesService.getClassById(classId);
      
      return res.status(201).json({
        status: 'success',
        message: 'Kelas berhasil dibuat',
        data: newClass
      });
    } catch (error) {
      console.error('Error in createClass controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat kelas'
      });
    }
  }
  
  /**
   * Memperbarui kelas yang sudah ada
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateClass(req, res) {
    try {
      const { id } = req.params;
      const { nama_kelas, selections_id } = req.body;
      
      // Validate required fields
      if (!nama_kelas || !selections_id) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama kelas dan rombel harus diisi'
        });
      }

      // Validate if selection exists
      const selection = await selectionsService.getSelectionById(selections_id);
      if (!selection) {
        return res.status(400).json({
          status: 'error',
          message: 'Rombel yang dipilih tidak valid'
        });
      }
      
      // Check if class exists
      const kelas = await classesService.getClassById(id);
      if (!kelas) {
        return res.status(404).json({
          status: 'error',
          message: 'Kelas tidak ditemukan'
        });
      }
      
      // Check if the new name already exists in the same selection (excluding current class)
      const exists = await classesService.checkClassNameExists(nama_kelas, selections_id, id);
      if (exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama kelas sudah ada dalam rombel yang sama'
        });
      }
      
      const userId = req.user.id;
      const success = await classesService.updateClass(id, { nama_kelas, selections_id }, userId);
      
      if (!success) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal mengupdate kelas'
        });
      }
      
      const updatedClass = await classesService.getClassById(id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Kelas berhasil diupdate',
        data: updatedClass
      });
    } catch (error) {
      console.error('Error in updateClass controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengupdate kelas'
      });
    }
  }
  
  /**
   * Menghapus kelas (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteClass(req, res) {
    try {
      const { id } = req.params;
      
      // Check if class exists
      const kelas = await classesService.getClassById(id);
      if (!kelas) {
        return res.status(404).json({
          status: 'error',
          message: 'Kelas tidak ditemukan'
        });
      }
      
      const userId = req.user.id;
      const success = await classesService.deleteClass(id, userId);
      
      if (!success) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal menghapus kelas'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Kelas berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteClass controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menghapus kelas'
      });
    }
  }
}

export default new ClassesController();