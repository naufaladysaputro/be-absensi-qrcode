import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';
import fs from 'fs/promises';
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

  async generateQrCode(student, userId) {
    try {
      const unique_code = `${student.nis}_${Date.now()}`;
      const filename = `${student.nama_siswa.replace(/\s+/g, '_')}_${student.nis}.png`;
      const filepath = path.join(this.uploadDir, filename);

      // Buat QR code buffer (PNG)
      const qrBuffer = await QRCode.toBuffer(unique_code, {
        width: 300,
        margin: 1
      });

      // Setup canvas
      const canvasWidth = 400;
      const canvasHeight = 500;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext('2d');

      // Background putih
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Teks nama siswa
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 20px Arial';
      const nameText = student.nama_siswa || 'Nama Tidak Diketahui';
      const nisText = `NIS: ${student.nis || 'N/A'}`;

      const nameTextWidth = ctx.measureText(nameText).width;
      ctx.fillText(nameText, (canvasWidth - nameTextWidth) / 2, 50);

      ctx.font = '16px Arial';
      const nisTextWidth = ctx.measureText(nisText).width;
      ctx.fillText(nisText, (canvasWidth - nisTextWidth) / 2, 80);

      // Tempelkan QR Code
      const qrImage = await loadImage(qrBuffer);
      ctx.drawImage(qrImage, 50, 120, 300, 300);

      // Simpan sebagai PNG
      const outBuffer = canvas.toBuffer('image/png');
      await fs.writeFile(filepath, outBuffer);

      // Simpan data ke database
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

      const insertedData = Array.isArray(result) ? result[0] : result;
      return {
        ...insertedData,
        filepath
      };
    } catch (error) {
      console.error('Error generating QR PNG:', error);
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
      // Ambil ID siswa dalam kelas
      const studentsResult = await supabase
        .from('students')
        .select('id')
        .eq('classes_id', classId)
        .is('deleted_at', null);

      if (studentsResult.error) throw studentsResult.error;

      const studentIds = studentsResult.data.map(s => s.id);

      if (studentIds.length === 0) return [];

      // Ambil QR path hanya untuk siswa yang cocok
      const qrResult = await supabase
        .from('qr_codes_students')
        .select('qr_path')
        .in('students_id', studentIds);

      if (qrResult.error) throw qrResult.error;

      return qrResult.data;
    } catch (error) {
      console.error('Error getting QR paths by class ID:', error);
      throw error;
    }
  }

  /**
 * Generate or update QR codes for all students in a class
 */
  async generateOrUpdateQrCodesForClass(classId, userId) {
    try {
      const studentsResult = await supabase
        .from('students')
        .select('*')
        .eq('classes_id', classId)
        .is('deleted_at', null);

      if (studentsResult.error) throw studentsResult.error;

      const students = studentsResult.data;
      const created = [];
      const updated = [];
      const failed = [];

      for (const student of students) {
        try {
          const existing = await this.getQrCodeByStudentId(student.id);

          if (existing) {
            // Update: Hapus QR lama dan buat baru
            await this.deleteQrCode(student.id);
            const newQr = await this.generateQrCode(student, userId);
            updated.push(newQr);
          } else {
            // Create
            const newQr = await this.generateQrCode(student, userId);
            created.push(newQr);
          }
        } catch (err) {
          failed.push({ student, reason: err.message });
        }
      }

      return { created, updated, failed };
    } catch (error) {
      console.error('Error generating/updating QR codes for class:', error);
      throw error;
    }
  }
}

export default new QrCodesService();