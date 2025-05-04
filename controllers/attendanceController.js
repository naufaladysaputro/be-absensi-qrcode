import attendanceService from '../services/attendanceService.js';

class AttendanceController {
  async scanQRCode(req, res) {
    try {
      const { unique_code } = req.body;
      
      if (!unique_code) {
        return res.status(400).json({
          success: false,
          message: 'QR Code harus disediakan'
        });
      }

      const result = await attendanceService.scanQRCode({ unique_code });
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error in scanQRCode:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat memproses QR Code'
      });
    }
  }

  async scanMasuk(req, res) {
    try {
      const { unique_code } = req.body;
      if (!unique_code) {
        return res.status(400).json({ success: false, message: 'QR Code harus disediakan' });
      }
  
      const result = await attendanceService.handleScanMasuk(unique_code);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error in scanMasuk:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }
  
  async scanPulang(req, res) {
    try {
      const { unique_code } = req.body;
      if (!unique_code) {
        return res.status(400).json({ success: false, message: 'QR Code harus disediakan' });
      }
  
      const result = await attendanceService.handleScanPulang(unique_code);
      return res.status(200).json({ success: true, ...result });
    } catch (error) {
      console.error('Error in scanPulang:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  async getStudentAttendance(req, res) {
    try {
      const { studentId } = req.params;
      const date = new Date(req.query.date || new Date());

      const attendance = await attendanceService.getStudentAttendance(studentId, date);

      return res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Error in getStudentAttendance controller:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data absensi'
      });
    }
  }

  async getClassAttendance(req, res) {
    try {
      const { classId } = req.params;
      const date = req.query.date ? new Date(req.query.date) : new Date();

      if (!classId) {
        return res.status(400).json({
          success: false,
          message: 'ID kelas harus disediakan'
        });
      }

      const attendanceData = await attendanceService.getAttendanceByClassAndDate(classId, date);

      return res.status(200).json({
        success: true,
        data: {
          tanggal: date.toISOString().split('T')[0],
          class_id: classId,
          attendance: attendanceData
        }
      });
    } catch (error) {
      console.error('Error in getClassAttendance:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data absensi kelas'
      });
    }
  }

  async updateAttendance(req, res) {
    try {
      const { id } = req.params;
      const { kehadiran, jam_masuk, jam_pulang, keterangan } = req.body;

      if (!kehadiran) {
        return res.status(400).json({
          success: false,
          message: 'Status kehadiran harus diisi'
        });
      }

      const attendance = await attendanceService.updateAttendance(id, {
        kehadiran,
        jam_masuk,
        jam_pulang,
        keterangan
      });

      return res.status(200).json({
        success: true,
        message: 'Data absensi berhasil diperbarui',
        data: attendance
      });
    } catch (error) {
      console.error('Error in updateAttendance:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat memperbarui data absensi'
      });
    }
  }
}

export default new AttendanceController();