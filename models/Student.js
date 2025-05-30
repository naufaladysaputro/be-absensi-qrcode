import supabase from '../config/supabase.js';

class Student {
  static tableName = 'students';

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(studentData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...studentData,
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
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students(*)
      `);

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  static async findByNIS(nis) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students(*)
      `)
      .eq('nis', nis)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByClass(classId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students(*)
      `)
      .eq('classes_id', classId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  static async findBySelection(selectionId) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students(*)
      `)
      .eq('selections_id', selectionId)
      .is('deleted_at', null);

    if (error) throw error;
    return data;
  }

  static async findByQRCode(uniqueCode) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        class:classes(*),
        selection:selections(*),
        qr_code:qr_codes_students!inner(*)
      `)
      .eq('qr_code.unique_code', uniqueCode)
      .is('deleted_at', null)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
}

export default Student;