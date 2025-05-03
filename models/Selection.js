import supabase from '../config/supabase.js';

class Selection {
  static tableName = 'selections';

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        classes:classes(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(selectionData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...selectionData,
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
      .is('deleted_at', null);

    if (error) throw error;
    return true;
  }

  static async findAll(includeDeleted = false) {
    let query = supabase
      .from(this.tableName)
      .select(`
        *,
        classes:classes(*)
      `);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findByName(namaRombel) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('nama_rombel', namaRombel)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export default Selection;