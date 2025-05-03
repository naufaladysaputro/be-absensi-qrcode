import supabase from '../config/supabase.js';

class Attendance {
  static tableName = 'attendences';

  static async findById(id) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(attendanceData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{
        ...attendanceData,
        created_at: new Date().toISOString()
      }])
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

  static async updateAttendance(id, updateData) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({
        kehadiran: updateData.kehadiran,
        jam_masuk: updateData.jam_masuk,
        jam_pulang: updateData.jam_pulang,
        keterangan: updateData.keterangan,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
      .single();

    if (error) throw error;
    return data;
  }

  static async findByStudentAndDate(studentId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
      .eq('students_id', studentId)
      .eq('tanggal', date.toISOString().split('T')[0])
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async findByClassAndDate(classId, date) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(`
        *,
        student:students(*),
        class:classes(*)
      `)
      .eq('classes_id', classId)
      .eq('tanggal', date.toISOString().split('T')[0]);

    if (error) throw error;
    return data || [];
  }
}

export default Attendance;