import supabase from '../config/supabase.js';

class Settings {
  static tableName = 'settings';

  static async findAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async create(settingsData, userId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...settingsData,
        modified_by: userId,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates, userId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        modified_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default Settings;