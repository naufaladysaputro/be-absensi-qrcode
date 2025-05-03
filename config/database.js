import supabase from './supabase.js';

/**
 * Kelas untuk mengelola operasi database menggunakan Supabase
 */
class Database {
  // Daftar tabel yang memiliki soft delete
  softDeleteTables = ['users', 'students', 'classes', 'selections'];

  /**
   * Mengeksekusi query pada Supabase
   * @param {string} tableName - Nama tabel
   * @param {string} query - Jenis query (select, insert, update, delete)
   * @param {Object} options - Opsi query (columns, filters, data, etc.)
   * @returns {Promise} - Hasil query
   */
  async query(tableName, query, options = {}) {
    try {
      let result;
      
      switch (query) {
        case 'select':
          result = await this.select(tableName, options);
          break;
        case 'insert':
          result = await this.insert(tableName, options.data);
          break;
        case 'update':
          result = await this.update(tableName, options.data, options.filters);
          break;
        case 'delete':
          result = await this.delete(tableName, options.filters);
          break;
        default:
          throw new Error(`Query tidak valid: ${query}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error saat menjalankan query: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Melakukan SELECT pada tabel
   * @param {string} tableName - Nama tabel
   * @param {Object} options - Opsi query (columns, filters, etc.)
   * @returns {Promise} - Data hasil query
   */
  async select(tableName, options = {}) {
    let query = supabase.from(tableName).select(options.columns || '*');
    
    // Menerapkan filter jika ada
    if (options.filters) {
      for (const [column, value] of Object.entries(options.filters)) {
        if (value === null) {
          query = query.is(column, null);
        } else {
          query = query.eq(column, value);
        }
      }
    }
    
    // Menerapkan filter untuk deleted_at hanya jika tabel mendukung soft delete
    if (options.includeDeleted !== true && this.softDeleteTables.includes(tableName)) {
      query = query.is('deleted_at', null);
    }
    
    // Menerapkan ordering jika ada
    if (options.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  /**
   * Melakukan INSERT pada tabel
   * @param {string} tableName - Nama tabel
   * @param {Object} data - Data yang akan di-insert
   * @returns {Promise} - Data hasil insert
   */
  async insert(tableName, data) {
    const { data: result, error } = await supabase
      .from(tableName)
      .insert(data)
      .select();
    
    if (error) throw error;
    return result;
  }
  
  /**
   * Melakukan UPDATE pada tabel
   * @param {string} tableName - Nama tabel
   * @param {Object} data - Data yang akan di-update
   * @param {Object} filters - Filter untuk menentukan record yang di-update
   * @returns {Promise} - Data hasil update
   */
  async update(tableName, data, filters) {
    let query = supabase.from(tableName).update(data);
    
    // Menerapkan filter
    for (const [column, value] of Object.entries(filters)) {
      if (value === null) {
        query = query.is(column, null);
      } else {
        query = query.eq(column, value);
      }
    }
    
    // Untuk tabel dengan soft delete, tambahkan filter deleted_at
    if (this.softDeleteTables.includes(tableName)) {
      query = query.is('deleted_at', null);
    }
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    return result;
  }
  
  /**
   * Melakukan DELETE pada tabel
   * @param {string} tableName - Nama tabel
   * @param {Object} filters - Filter untuk menentukan record yang di-delete
   * @returns {Promise} - Hasil delete
   */
  async delete(tableName, filters) {
    let query;
    
    if (this.softDeleteTables.includes(tableName)) {
      // Soft delete untuk tabel yang mendukung
      const updateData = {
        deleted_at: new Date().toISOString(),
      };
      query = supabase.from(tableName).update(updateData);
    } else {
      // Hard delete untuk tabel yang tidak mendukung soft delete
      query = supabase.from(tableName).delete();
    }
    
    // Menerapkan filter
    for (const [column, value] of Object.entries(filters)) {
      if (value === null) {
        query = query.is(column, null);
      } else {
        query = query.eq(column, value);
      }
    }
    
    const { data: result, error } = await query.select();
    
    if (error) throw error;
    return result;
  }
}

// Cek koneksi ke Supabase
(async () => {
  try {
    const { data, error } = await supabase.from('selections').select('id').limit(1);
    if (error) throw error;
    console.log('Koneksi ke Supabase berhasil');
  } catch (error) {
    console.error('Error koneksi ke Supabase:', error.message);
  }
})();

export default new Database();