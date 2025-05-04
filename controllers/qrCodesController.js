import qrCodesService from '../services/qrCodesService.js';
import studentsService from '../services/studentsService.js';

class QrCodesController {
  /**
   * Generate QR code for a student
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateQrCode(req, res) {
    try {
      const { student_id } = req.params;

      // Get student data
      const student = await studentsService.getStudentById(student_id);
      if (!student) {
        return res.status(404).json({
          status: 'error',
          message: 'Siswa tidak ditemukan'
        });
      }

      // Check if QR code already exists
      const existingQr = await qrCodesService.getQrCodeByStudentId(student_id);
      if (existingQr) {
        return res.status(400).json({
          status: 'error',
          message: 'QR Code untuk siswa ini sudah ada',
          data: existingQr
        });
      }

      // Generate QR code
      const userId = req.user.id;
      const qrCode = await qrCodesService.generateQrCode(student, userId);

      if (!qrCode) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal membuat QR Code'
        });
      }

      return res.status(201).json({
        status: 'success',
        message: 'QR Code berhasil dibuat',
        data: qrCode
      });
    } catch (error) {
      console.error('Error in generateQrCode controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat membuat QR Code',
        detail: error.message
      });
    }
  }

  /**
   * Get QR code by student ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getQrCode(req, res) {
    try {
      const { student_id } = req.params;

      // Get QR code data
      const qrCode = await qrCodesService.getQrCodeByStudentId(student_id);
      if (!qrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR Code tidak ditemukan'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: qrCode
      });
    } catch (error) {
      console.error('Error in getQrCode controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil QR Code',
        detail: error.message
      });
    }
  }

  /**
   * Menghapus QR code siswa
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteQrCode(req, res) {
    try {
      const { student_id } = req.params;

      // Check if QR code exists
      const existingQrCode = await qrCodesService.getQrCodeByStudentId(student_id);
      if (!existingQrCode) {
        return res.status(404).json({
          status: 'error',
          message: 'QR Code tidak ditemukan'
        });
      }

      const success = await qrCodesService.deleteQrCode(student_id);

      if (!success) {
        return res.status(500).json({
          status: 'error',
          message: 'Gagal menghapus QR Code'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'QR Code berhasil dihapus'
      });
    } catch (error) {
      console.error('Error in deleteQrCode controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat menghapus QR Code'
      });
    }
  }

  /**
   * Get all QR codes
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllQrCodes(req, res) {
    try {
      const qrCodes = await qrCodesService.getAllQrCodes();

      return res.status(200).json({
        status: 'success',
        data: qrCodes
      });
    } catch (error) {
      console.error('Error in getAllQrCodes controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil data QR Code',
        detail: error.message
      });
    }
  }

  /**
* Get QR codes by class ID
*/
  async getQrCodesByClassId(req, res) {
    try {
      const { class_id } = req.params;
      const qrCodes = await qrCodesService.getQrCodesByClassId(class_id);

      return res.status(200).json({
        status: 'success',
        data: qrCodes
      });
    } catch (error) {
      console.error('Error in getQrCodesByClassId controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat mengambil QR Code berdasarkan kelas',
        detail: error.message
      });
    }
  }

  /**
   * Generate QR codes for all students in a class
   */
  async generateQrCodesByClassId(req, res) {
    try {
      const { class_id } = req.params;
      const userId = req.user.id;

      const results = await qrCodesService.generateQrCodesForClass(class_id, userId);

      return res.status(201).json({
        status: 'success',
        message: `${results.generated.length} QR Code berhasil dibuat`,
        data: results
      });
    } catch (error) {
      console.error('Error in generateQrCodesByClassId controller:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Terjadi kesalahan saat generate QR Code massal',
        detail: error.message
      });
    }
  }
}

export default new QrCodesController();