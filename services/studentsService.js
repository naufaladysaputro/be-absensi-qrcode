import db from "../config/database.js";
import qrCodesService from "./qrCodesService.js";
import supabase from "../config/supabase.js";

/**
 * Service untuk manajemen data siswa
 */
class StudentsService {
  /**
   * Mendapatkan semua data siswa
   * @returns {Promise<Array>} Array of students
   */
  async getAllStudents(kelasId) {
    try {
      let query = supabase
        .from("students")
        .select(
          `
        *,
        class:classes(id, nama_kelas),
        selection:selections(id, nama_rombel),
        qr_codes_students(qr_path)
      `
        )
        .order("nama_siswa", { ascending: true })
        .is("deleted_at", null); // jika kamu pakai soft delete

      if (kelasId) {
        query = query.eq("classes_id", parseInt(kelasId));
      }

      const { data, error } = await query;

      if (error) throw error;

      const students = data.map((student) => ({
        ...student,
        qr_path: student.qr_codes_students?.[0]?.qr_path || null,
        qr_codes_students: undefined,
      }));

      return students;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mendapatkan siswa berdasarkan ID
   * @param {number} id - ID siswa
   * @returns {Promise<Object>} Student object atau null jika tidak ditemukan
   */
  async getStudentById(id) {
    try {
      const students = await db.query("students", "select", {
        columns: `
          *,
          class:classes(id, nama_kelas),
          selection:selections(id, nama_rombel)
        `,
        filters: { id },
      });

      return students.length > 0 ? students[0] : null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Membuat siswa baru
   * @param {Object} data - Data siswa yang akan dibuat
   * @param {number} userId - ID user yang membuat
   * @returns {Promise<Object>} Created student dengan ID baru
   */
  async createStudent(data, userId) {
    try {
      const now = new Date().toISOString();
      const result = await db.query("students", "insert", {
        data: {
          nis: data.nis,
          nama_siswa: data.nama_siswa,
          jenis_kelamin: data.jenis_kelamin,
          classes_id: data.classes_id,
          selections_id: data.selections_id,
          modified_by: userId,
          created_at: now,
          updated_at: now,
        },
      });

      qrCodesService.generateQrCode(result[0], result[0].id);
      return result[0].id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Memperbarui siswa yang sudah ada
   * @param {number} id - ID siswa yang akan diupdate
   * @param {Object} data - Data siswa yang akan diupdate
   * @param {number} userId - ID user yang mengupdate
   * @returns {Promise<Object>} Updated student data
   */
  async updateStudent(id, data, userId) {
    try {
      const result = await db.query("students", "update", {
        data: {
          nis: data.nis,
          nama_siswa: data.nama_siswa,
          jenis_kelamin: data.jenis_kelamin,
          classes_id: data.classes_id,
          selections_id: data.selections_id,
          modified_by: userId,
          updated_at: new Date().toISOString(),
        },
        filters: { id },
      });

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Soft delete siswa
   * @param {number} id - ID siswa yang akan dihapus
   * @param {number} userId - ID user yang menghapus
   * @returns {Promise<boolean>} true jika berhasil dihapus
   */
  async deleteStudent(id, userId) {
    try {
      const result = await db.query("students", "delete", {
        filters: { id },
      });

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if NIS exists
   * @param {string} nis - NIS to check
   * @param {number} excludeId - ID of the student to exclude (optional)
   * @returns {Promise<boolean>} true if the NIS exists
   */
  async checkNISExists(nis, excludeId = null) {
    try {
      const query = {
        columns: "id",
        filters: { nis },
      };

      const result = await db.query("students", "select", query);

      if (excludeId && result.length > 0) {
        return result.some((student) => student.id !== excludeId);
      }

      return result.length > 0;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get students by class
   * @param {number} classId - ID of the class
   * @returns {Promise<Array>} Array of students in the class
   */
  async getStudentsByClass(classId) {
    try {
      const students = await db.query("students", "select", {
        columns: `
          *,
          class:classes(id, nama_kelas),
          selection:selections(id, nama_rombel)
        `,
        filters: { classes_id: classId },
      });

      return students;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get students by selection
   * @param {number} selectionId - ID of the selection
   * @returns {Promise<Array>} Array of students in the selection
   */
  async getStudentsBySelection(selectionId) {
    try {
      const students = await db.query("students", "select", {
        columns: `
          *,
          class:classes(id, nama_kelas),
          selection:selections(id, nama_rombel)
        `,
        filters: { selections_id: selectionId },
      });

      return students;
    } catch (error) {
      throw error;
    }
  }
}

export default new StudentsService();
