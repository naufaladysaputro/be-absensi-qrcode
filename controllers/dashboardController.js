import dashboardService from '../services/dashboardService.js';

class DashboardController {
  async getDashboard(req, res) {
    try {
      const dashboardData = await dashboardService.getDashboardData();
      
      return res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('Error in getDashboard:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil data dashboard'
      });
    }
  }
}

export default new DashboardController();