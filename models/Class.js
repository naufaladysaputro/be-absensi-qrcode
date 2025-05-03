import supabase from '../config/supabase.js';

class Class {
  static tableName = 'classes';

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        selection:selections(*),
        students:students(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(classData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...classData,
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
        selection:selections(*),
        students:students(*)
      `);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findBySelectionId(selectionId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        selection:selections(*),
        students:students(*)
      `)
      .eq('selections_id', selectionId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  static async findByName(namaKelas, selectionId = null) {
    let query = supabase
      .from(this.tableName)
      .select('*')
      .eq('nama_kelas', namaKelas)
      .is('deleted_at', null);
    
    if (selectionId) {
      query = query.eq('selections_id', selectionId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export default Class;