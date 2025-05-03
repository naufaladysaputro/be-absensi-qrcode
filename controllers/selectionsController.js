import selectionsService from '../services/selectionsService.js';

/**
 * Controller untuk manajemen data rombel (selections)
 */
class SelectionsController {
  /**
   * Mendapatkan semua rombel
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllSelections(req, res) {
    try {
      const selections = await selectionsService.getAllSelections();
      return res.status(200).json({
        status: 'success',
        data: selections
      });
    } catch (error) {
      console.error('Error in getAllSelections controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data rombel'
      });
    }
  }
  
  /**
   * Mendapatkan rombel berdasarkan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSelectionById(req, res) {
    try {
      const { id } = req.params;
      const selection = await selectionsService.getSelectionById(id);
      
      if (!selection) {
        return res.status(404).json({
          status: 'error',
          message: 'Rombel tidak ditemukan'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: selection
      });
    } catch (error) {
      console.error('Error in getSelectionById controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data rombel'
      });
    }
  }
  
  /**
   * Membuat rombel baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createSelection(req, res) {
    try {
      const { nama_rombel } = req.body;
      
      // Validate required fields
      if (!nama_rombel) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama rombel harus diisi'
        });
      }
      
      // Check if selection name already exists
      const exists = await selectionsService.checkSelectionNameExists(nama_rombel);
      if (exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama rombel sudah ada'
        });
      }
      
      const userId = req.user.id;
      const selectionId = await selectionsService.createSelection({ nama_rombel }, userId);
      
      const newSelection = await selectionsService.getSelectionById(selectionId);
      
      return res.status(201).json({
        status: 'success',
        message: 'Rombel berhasil dibuat',
        data: newSelection
      });
    } catch (error) {
      console.error('Error in createSelection controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat rombel'
      });
    }
  }
  
  /**
   * Memperbarui rombel yang sudah ada
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateSelection(req, res) {
    try {
      const { id } = req.params;
      const { nama_rombel } = req.body;
      
      // Validate required fields
      if (!nama_rombel) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama rombel harus diisi'
        });
      }
      
      // Check if selection exists
      const selection = await selectionsService.getSelectionById(id);
      if (!selection) {
        return res.status(404).json({
          status: 'error',
          message: 'Rombel tidak ditemukan'
        });
      }
      
      // Check if the new name already exists (excluding current selection)
      const exists = await selectionsService.checkSelectionNameExists(nama_rombel, id);
      if (exists) {
        return res.status(400).json({
          status: 'error',
          message: 'Nama rombel sudah ada'
        });
      }
      
      const userId = req.user.id;
      const success = await selectionsService.updateSelection(id, { nama_rombel }, userId);
      
      if (!success) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal mengupdate rombel'
        });
      }
      
      const updatedSelection = await selectionsService.getSelectionById(id);
      
      return res.status(200).json({
        status: 'success',
        message: 'Rombel berhasil diupdate',
        data: updatedSelection
      });
    } catch (error) {
      console.error('Error in updateSelection controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengupdate rombel'
      });
    }
  }
  
  /**
   * Menghapus rombel (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteSelection(req, res) {
    try {
      const { id } = req.params;
      
      // Check if selection exists
      const selection = await selectionsService.getSelectionById(id);
      if (!selection) {
        return res.status(404).json({
          status: 'error',
          message: 'Rombel tidak ditemukan'
        });
      }
      
      const userId = req.user.id;
      const success = await selectionsService.deleteSelection(id, userId);
      
      if (!success) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal menghapus rombel'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        message: 'Rombel berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteSelection controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menghapus rombel'
      });
    }
  }
}

export default new SelectionsController();