import reportService from '../services/reportService.js';
import path from 'path';

class ReportController {
  async generateReport(req, res) {
    try {
      const { month, year, classId, format = 'pdf' } = req.query;

      // Validate required parameters
      if (!month || !year || !classId) {
        return res.status(400).json({
          success: false,
          message: 'Bulan, tahun, dan kelas harus diisi'
        });
      }

      // Validate month and year format
      const monthNum = parseInt(month);
      const yearNum = parseInt(year);
      
      if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          success: false,
          message: 'Format bulan tidak valid (1-12)'
        });
      }

      if (isNaN(yearNum) || yearNum < 2000 || yearNum > 3000) {
        return res.status(400).json({
          success: false,
          message: 'Format tahun tidak valid'
        });
      }

      // Generate report
      const result = await reportService.generateReport(monthNum, yearNum, classId, format);

      // Return JSON response with URL
      return res.status(200).json({
        success: true,
        url: `/exports/${result.filename}`
      });
    } catch (error) {
      console.error('Error in generateReport:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat generate laporan'
      });
    }
  }
}

export default new ReportController();