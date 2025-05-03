import supabase from '../config/supabase.js';

class User {
  static tableName = 'users';

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByUsername(username) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('username', username)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByEmail(email) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(userData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([userData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDelete(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null);

    if (error) throw error;
    return true;
  }

  static async findAll(includeDeleted = false) {
    let query = supabase
      .from(this.tableName)
      .select('*');

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}

export default User;