import supabase from '../config/supabase.js';

class Schedule {
  static tableName = 'schedules';

  static async getAll() {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        classes:classes (
          id,
          nama_kelas
        ),
        user:users (
          id,
          username
        )
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        classes:classes (
          id,
          nama_kelas
        ),
        user:users (
          id,
          username
        )
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(scheduleData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...scheduleData,
        classes_id: parseInt(scheduleData.classes_id),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id, updates, modifiedBy) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        ...updates,
        classes_id: parseInt(updates.classes_id),
        modified_by: modifiedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async softDelete(id, modifiedBy) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        deleted_at: new Date().toISOString(),
        modified_by: modifiedBy
      })
      .eq('id', id)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export default Schedule;
