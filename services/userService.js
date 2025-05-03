import supabase from '../config/supabase.js';
import bcrypt from 'bcrypt';

/**
 * Service untuk manajemen data user
 */
class UserService {
  /**
   * Mendapatkan semua user
   * @param {boolean} includeDeleted - Jika true, akan menyertakan user yang sudah dihapus (soft delete)
   * @returns {Promise<Object>} - Hasil pencarian user
   */
  async getAllUsers(includeDeleted = false) {
    try {
      console.log('Getting all users, includeDeleted:', includeDeleted);
      
      let query = supabase.from('users').select('id, username, email, role, created_at, updated_at');
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error getting users:', error);
        throw new Error(`Error mendapatkan data user: ${error.message}`);
      }
      
      console.log(`Found ${data?.length || 0} users`);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('getAllUsers error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Mendapatkan user berdasarkan ID
   * @param {number} userId - ID user yang dicari
   * @returns {Promise<Object>} - Data user
   */
  async getUserById(userId) {
    try {
      console.log('Getting user with ID:', userId);
      
      const { data, error } = await supabase
        .from('users')
        .select('id, username, email, role, created_at, updated_at')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();
        
      if (error) {
        console.error('Error getting user by ID:', error);
        if (error.code === 'PGRST116') {
          throw new Error('User tidak ditemukan');
        }
        throw new Error(`Error mendapatkan data user: ${error.message}`);
      }
      
      console.log('User found:', data?.username);
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('getUserById error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Memperbarui data user
   * @param {number} userId - ID user yang akan diupdate
   * @param {Object} userData - Data user yang akan diupdate
   * @returns {Promise<Object>} - Hasil update
   */
  async updateUser(userId, userData) {
    try {
      console.log('Updating user with ID:', userId);
      
      // Cek apakah user dengan ID tersebut ada
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();
        
      if (findError || !existingUser) {
        console.error('User not found for update:', findError);
        throw new Error('User tidak ditemukan');
      }
      
      // Siapkan data untuk update
      const updateData = {};
      
      // Update username jika ada
      if (userData.username) {
        // Cek apakah username sudah digunakan oleh user lain
        const { data: userWithSameUsername, error: findUsernameError } = await supabase
          .from('users')
          .select('id')
          .eq('username', userData.username)
          .neq('id', userId)
          .is('deleted_at', null)
          .single();
          
        if (userWithSameUsername) {
          throw new Error('Username sudah digunakan');
        }
        
        updateData.username = userData.username;
      }
      
      // Update email jika ada
      if (userData.email) {
        // Cek apakah email sudah digunakan oleh user lain
        const { data: userWithSameEmail, error: findEmailError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userData.email)
          .neq('id', userId)
          .is('deleted_at', null)
          .single();
          
        if (userWithSameEmail) {
          throw new Error('Email sudah digunakan');
        }
        
        updateData.email = userData.email;
      }
      
      // Update password jika ada
      if (userData.password) {
        // Hash password baru
        const saltRounds = 10;
        updateData.password = await bcrypt.hash(userData.password, saltRounds);
      }
      
      // Update role jika ada
      if (userData.role && ['admin', 'guru'].includes(userData.role)) {
        updateData.role = userData.role;
      }
      
      // Set updated_at
      updateData.updated_at = new Date().toISOString();
      
      // Lakukan update
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, username, email, role, created_at, updated_at')
        .single();
        
      if (error) {
        console.error('Error updating user:', error);
        throw new Error(`Error memperbarui data user: ${error.message}`);
      }
      
      console.log('User updated successfully');
      return {
        success: true,
        message: 'User berhasil diperbarui',
        data
      };
    } catch (error) {
      console.error('updateUser error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
  
  /**
   * Menghapus user (soft delete)
   * @param {number} userId - ID user yang akan dihapus
   * @returns {Promise<Object>} - Hasil penghapusan
   */
  async deleteUser(userId) {
    try {
      console.log('Deleting user with ID:', userId);
      
      // Cek apakah user dengan ID tersebut ada
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .is('deleted_at', null)
        .single();
        
      if (findError || !existingUser) {
        console.error('User not found for deletion:', findError);
        throw new Error('User tidak ditemukan');
      }
      
      // Lakukan soft delete dengan mengupdate deleted_at
      const { data, error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', userId);
        
      if (error) {
        console.error('Error deleting user:', error);
        throw new Error(`Error menghapus user: ${error.message}`);
      }
      
      console.log('User deleted successfully');
      return {
        success: true,
        message: 'User berhasil dihapus'
      };
    } catch (error) {
      console.error('deleteUser error:', error.message);
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default new UserService(); 