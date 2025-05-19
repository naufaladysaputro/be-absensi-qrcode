import settingsService from '../services/settingsService.js';
import path from 'path';

class SettingsController {
  async getSettings(req, res) {
    try {
      const settings = await settingsService.getSettings();
      
      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Pengaturan belum dibuat'
        });
      }

      return res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('Error in getSettings:', error);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil pengaturan'
      });
    }
  }

  async createSettings(req, res) {
    try {
      const { nama_sekolah, tahun_ajaran } = req.body;
      const userId = req.user.id;
      let logo_path = null;

      // Handle logo upload if file exists
      if (req.file) {
        logo_path = `/uploads/logo/${path.basename(req.file.path)}`;
      }

      const settings = await settingsService.createSettings({
        nama_sekolah,
        tahun_ajaran,
        logo_path
      }, userId);

      return res.status(201).json({
        success: true,
        message: 'Pengaturan berhasil dibuat',
        data: settings
      });
    } catch (error) {
      console.error('Error in createSettings:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat membuat pengaturan'
      });
    }
  }

  async updateSettings(req, res) {
    try {
      const { id } = req.params;
      const { nama_sekolah, tahun_ajaran, jam_masuk } = req.body;
      const userId = req.user.id;
      let updateData = { nama_sekolah, tahun_ajaran, jam_masuk };

      // Handle logo upload if file exists
      if (req.file) {
        updateData.logo_path = `/uploads/logo/${path.basename(req.file.path)}`;
      }

      const settings = await settingsService.updateSettings(id, updateData, userId);

      if (!settings) {
        return res.status(404).json({
          success: false,
          message: 'Pengaturan tidak ditemukan'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pengaturan berhasil diperbarui',
        data: settings
      });
    } catch (error) {
      console.error('Error in updateSettings:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat memperbarui pengaturan'
      });
    }
  }

  async uploadLogo(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'File logo harus diunggah'
        });
      }

      const settingsId = req.params.id;
      const userId = req.user.id;
      
      // Get the file path relative to uploads directory
      const relativePath = `/uploads/logo/${path.basename(req.file.path)}`;

      // Update settings with new logo path
      const settings = await settingsService.updateLogo(settingsId, relativePath, userId);

      return res.status(200).json({
        success: true,
        message: 'Logo berhasil diperbarui',
        data: settings
      });
    } catch (error) {
      console.error('Error in uploadLogo:', error);
      return res.status(400).json({
        success: false,
        message: error.message || 'Terjadi kesalahan saat mengunggah logo'
      });
    }
  }
}

export default new SettingsController();