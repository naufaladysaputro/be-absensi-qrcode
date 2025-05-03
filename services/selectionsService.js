import db from '../config/database.js';

/**
 * Service untuk manajemen data rombel (selections)
 */
class SelectionsService {
  /**
   * Mendapatkan semua data rombel
   * @returns {Promise<Array>} Array of selections
   */
  async getAllSelections() {
    try {
      const selections = await db.query('selections', 'select', {
        columns: 'id, nama_rombel, created_at, updated_at',
        orderBy: {
          column: 'nama_rombel',
          ascending: true
        }
      });
      
      return selections;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mendapatkan rombel berdasarkan ID
   * @param {number} id - ID rombel
   * @returns {Promise<Object>} Selection object atau null jika tidak ditemukan
   */
  async getSelectionById(id) {
    try {
      const selections = await db.query('selections', 'select', {
        columns: 'id, nama_rombel, created_at, updated_at',
        filters: { id }
      });
      
      return selections.length > 0 ? selections[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Membuat rombel baru
   * @param {Object} data - Data rombel yang akan dibuat
   * @param {number} userId - ID user yang membuat
   * @returns {Promise<Object>} Created selection dengan ID baru
   */
  async createSelection(data, userId) {
    try {
      const now = new Date().toISOString();
      const result = await db.query('selections', 'insert', {
        data: {
          nama_rombel: data.nama_rombel,
          modified_by: userId,
          created_at: now,
          updated_at: now
        }
      });
      
      return result[0].id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Memperbarui rombel yang sudah ada
   * @param {number} id - ID rombel yang akan diupdate
   * @param {Object} data - Data rombel yang akan diupdate
   * @param {number} userId - ID user yang mengupdate
   * @returns {Promise<Object>} Updated selection data
   */
  async updateSelection(id, data, userId) {
    try {
      const result = await db.query('selections', 'update', {
        data: {
          nama_rombel: data.nama_rombel,
          modified_by: userId,
          updated_at: new Date().toISOString()
        },
        filters: { id }
      });
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete rombel
   * @param {number} id - ID rombel yang akan dihapus
   * @param {number} userId - ID user yang menghapus
   * @returns {Promise<boolean>} true jika berhasil dihapus
   */
  async deleteSelection(id, userId) {
    try {
      const result = await db.query('selections', 'delete', {
        filters: { id }
      });
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if selection name exists
   * @param {string} nama - Name of the selection
   * @param {number} excludeId - ID of the selection to exclude (optional)
   * @returns {Promise<boolean>} true if the selection name exists
   */
  async checkSelectionNameExists(nama, excludeId = null) {
    try {
      const query = {
        columns: 'id',
        filters: { nama_rombel: nama }
      };
      
      const result = await db.query('selections', 'select', query);
      
      if (excludeId && result.length > 0) {
        return result.some(selection => selection.id !== excludeId);
      }
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default new SelectionsService();