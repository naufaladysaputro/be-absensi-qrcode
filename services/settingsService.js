import Settings from '../models/Settings.js';
import fs from 'fs/promises';
import path from 'path';

class SettingsService {
  async getSettings() {
    try {
      const settings = await Settings.findAll();
      return settings;
    } catch (error) {
      throw error;
    }
  }

  async createSettings(data, userId) {
    try {
      // Validate required fields
      if (!data.nama_sekolah || !data.tahun_ajaran) {
        throw new Error('Nama sekolah dan tahun ajaran harus diisi');
      }

      // Validate tahun_ajaran format (e.g., "2024/2025")
      const tahunAjaranRegex = /^\d{4}\/\d{4}$/;
      if (!tahunAjaranRegex.test(data.tahun_ajaran)) {
        throw new Error('Format tahun ajaran tidak valid (contoh: 2024/2025)');
      }

      const settings = await Settings.create(data, userId);
      return settings;
    } catch (error) {
      throw error;
    }
  }

  async updateSettings(id, data, userId) {
    try {
      // Validate required fields if provided
      if (data.tahun_ajaran) {
        const tahunAjaranRegex = /^\d{4}\/\d{4}$/;
        if (!tahunAjaranRegex.test(data.tahun_ajaran)) {
          throw new Error('Format tahun ajaran tidak valid (contoh: 2024/2025)');
        }
      }

      const settings = await Settings.update(id, data, userId);
      return settings;
    } catch (error) {
      throw error;
    }
  }

  async updateLogo(id, logoPath, userId) {
    try {
      // Get existing settings to get old logo path
      const settings = await Settings.findAll();
      
      // If settings has old logo, delete it
      if (settings?.logo_path) {
        try {
          const oldLogoPath = path.join(__dirname, '..', settings.logo_path);
          await fs.unlink(oldLogoPath);
        } catch (error) {
          console.error('Error deleting old logo:', error);
          // Continue even if deletion fails
        }
      }

      // Update settings with new logo path
      return await Settings.update(id, { logo_path: logoPath }, userId);
    } catch (error) {
      throw error;
    }
  }
}

export default new SettingsService();