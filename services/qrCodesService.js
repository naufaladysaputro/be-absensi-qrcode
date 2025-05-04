import QRCode from 'qrcode';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';
import supabase from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class QrCodesService {
  constructor() {
    // Create uploads directory if it doesn't exist
    this.uploadDir = path.join(__dirname, '../uploads/qrcodes');
    fs.mkdir(this.uploadDir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') console.error('Error creating directory:', err);
    });
  }

  /**
   * Generate QR code for a student
   * @param {Object} student - Student data
   * @param {number} userId - ID of user generating QR code
   * @returns {Promise<Object>} Generated QR code data
   */
  async generateQrCode(student, userId) {
    try {
      // Generate unique code
      const unique_code = `${student.nis}_${Date.now()}`;

      // Generate filename
      const filename = `${student.nama_siswa.replace(/\s+/g, '_')}_${student.nis}.png`;
      const filepath = path.join(this.uploadDir, filename);

      // QR Code options with larger size and styling
      const qrOptions = {
        type: 'png',
        width: 400,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        // Adding text below QR code using built-in renderText option
        renderOpts: {
          textMargin: 10,
          textSize: 32,
          text: student.nama_siswa
        }
      };

      // Generate QR code and save directly to file
      await QRCode.toFile(filepath, unique_code, qrOptions);

      // Save QR code data to database
      const result = await db.query('qr_codes_students', 'insert', {
        data: {
          students_id: student.id,
          unique_code,
          qr_path: `/uploads/qrcodes/${filename}`,
          generated_by: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      });

      if (!result) throw new Error('Gagal menyimpan data QR code');

      const insertedData = Array.isArray(result) ? result[0] : result;
      if (!insertedData) throw new Error('Gagal mendapatkan data QR code yang baru dibuat');

      return {
        ...insertedData,
        filepath
      };
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Get QR code by student ID
   * @param {number} studentId - Student ID
   * @returns {Promise<Object>} QR code data
   */
  async getQrCodeByStudentId(studentId) {
    try {
      const result = await db.query('qr_codes_students', 'select', {
        columns: '*',
        filters: { students_id: studentId }
      });

      // Mengembalikan null jika tidak ada data
      if (!result || !Array.isArray(result) || result.length === 0) {
        return null;
      }

      return result[0];
    } catch (error) {
      console.error('Error getting QR code:', error);
      throw error;
    }
  }

  /**
   * Delete QR code by student ID
   * @param {number} studentId - Student ID
   * @returns {Promise<boolean>} true if deleted successfully
   */
  async deleteQrCode(studentId) {
    try {
      // Get QR code data first to get the file path
      const qrCode = await this.getQrCodeByStudentId(studentId);
      if (!qrCode) {
        return false;
      }

      // Delete from database
      const result = await db.query('qr_codes_students', 'delete', {
        filters: { students_id: studentId }
      });

      // Delete file if exists
      if (qrCode.qr_path) {
        const filePath = path.join(__dirname, '..', qrCode.qr_path);
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.error('Error deleting QR code file:', error);
          // Continue even if file deletion fails
        }
      }

      return result && result.length > 0;
    } catch (error) {
      console.error('Error deleting QR code:', error);
      throw error;
    }
  }

  /**
   * Get all QR codes
   * @returns {Promise<Array>} Array of QR code data
   */
  async getAllQrCodes() {
    try {
      const result = await supabase
        .from('qr_codes_students')
        .select(`
          id,
          students_id,
          created_at,
          updated_at,
          unique_code,
          qr_path,
          generated_by,
          students (
            id,
            nis,
            nama_siswa,
            jenis_kelamin,
            classes (
              id,
              nama_kelas,
              selection:selections (
                id,
                nama_rombel
              )
            )
          )
        `);

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error getting all QR codes:', error);
      throw error;
    }
  }

  /**
* Get all QR codes by class ID
*/
  async getQrCodesByClassId(classId) {
    try {
      const result = await supabase
        .from('qr_codes_students')
        .select(`
        id,
        students_id,
        created_at,
        updated_at,
        unique_code,
        qr_path,
        generated_by,
        students (
          id,
          nis,
          nama_siswa,
          jenis_kelamin,
          classes (
            id,
            nama_kelas
          )
        )
      `)
        .eq('students.classes_id', classId);

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error getting QR codes by class ID:', error);
      throw error;
    }
  }

  /**
   * Generate QR codes for all students in a class
   */
  async generateQrCodesForClass(classId, userId) {
    try {
      // Get students in class
      const studentsResult = await supabase
        .from('students')
        .select('*')
        .eq('classes_id', classId)
        .is('deleted_at', null);

      if (studentsResult.error) throw studentsResult.error;

      const students = studentsResult.data;
      const generated = [];
      const skipped = [];

      for (const student of students) {
        const existing = await this.getQrCodeByStudentId(student.id);
        if (existing) {
          skipped.push({ student, reason: 'Already has QR code' });
          continue;
        }

        try {
          const qr = await this.generateQrCode(student, userId);
          generated.push(qr);
        } catch (err) {
          skipped.push({ student, reason: err.message });
        }
      }

      return { generated, skipped };
    } catch (error) {
      console.error('Error generating QR codes for class:', error);
      throw error;
    }
  }
}

export default new QrCodesService();