import db from '../config/database.js';

/**
 * Service untuk manajemen data kelas
 */
class ClassesService {
  /**
   * Mendapatkan semua data kelas
   * @returns {Promise<Array>} Array of classes
   */
  async getAllClasses() {
    try {
      const classes = await db.query('classes', 'select', {
        columns: `
          id, 
          nama_kelas,
          selections_id,
          created_at,
          updated_at,
          selection:selections(id,nama_rombel),
          schedule:schedules(id,schedule_path,created_at,updated_at)
        `,
        orderBy: {
          column: 'nama_kelas',
          ascending: true
        }
      });
      
      return classes;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mendapatkan kelas berdasarkan ID
   * @param {number} id - ID kelas
   * @returns {Promise<Object>} Class object atau null jika tidak ditemukan
   */
  async getClassById(id) {
    try {
      const classes = await db.query('classes', 'select', {
        columns: `
          id, 
          nama_kelas,
          selections_id,
          created_at,
          updated_at,
          selection:selections(id,nama_rombel)
        `,
        filters: { id }
      });
      
      return classes.length > 0 ? classes[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Membuat kelas baru
   * @param {Object} data - Data kelas yang akan dibuat
   * @param {number} userId - ID user yang membuat
   * @returns {Promise<Object>} Created class dengan ID baru
   */
  async createClass(data, userId) {
    try {
      const now = new Date().toISOString();
      const result = await db.query('classes', 'insert', {
        data: {
          nama_kelas: data.nama_kelas,
          selections_id: data.selections_id,
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
   * Memperbarui kelas yang sudah ada
   * @param {number} id - ID kelas yang akan diupdate
   * @param {Object} data - Data kelas yang akan diupdate
   * @param {number} userId - ID user yang mengupdate
   * @returns {Promise<Object>} Updated class data
   */
  async updateClass(id, data, userId) {
    try {
      const result = await db.query('classes', 'update', {
        data: {
          nama_kelas: data.nama_kelas,
          selections_id: data.selections_id,
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
   * Soft delete kelas
   * @param {number} id - ID kelas yang akan dihapus
   * @param {number} userId - ID user yang menghapus
   * @returns {Promise<boolean>} true jika berhasil dihapus
   */
  async deleteClass(id, userId) {
    try {
      const result = await db.query('classes', 'delete', {
        filters: { id }
      });
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if class name exists in the same selection
   * @param {string} namaKelas - Name of the class
   * @param {number} selectionsId - ID of the selection
   * @param {number} excludeId - ID of the class to exclude (optional)
   * @returns {Promise<boolean>} true if the class name exists
   */
  async checkClassNameExists(namaKelas, selectionsId, excludeId = null) {
    try {
      const query = {
        columns: 'id',
        filters: { 
          nama_kelas: namaKelas,
          selections_id: selectionsId
        }
      };
      
      const result = await db.query('classes', 'select', query);
      
      if (excludeId && result.length > 0) {
        return result.some(kelas => kelas.id !== excludeId);
      }
      
      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }
}

export default new ClassesService();