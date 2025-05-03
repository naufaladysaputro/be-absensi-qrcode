import db from '../config/database.js';
import supabase from '../config/supabase.js';

class DashboardService {
  async getDashboardData() {
    try {
      const today = new Date();
      const currentDate = today.toISOString().split('T')[0];

      // Get total students count
      const { count: studentsCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Get today's attendance summary
      const { data: todayAttendance } = await supabase
        .from('attendences')
        .select('kehadiran')
        .eq('tanggal', currentDate);

      // Calculate attendance summary
      const attendanceSummary = {
        hadir: 0,
        sakit: 0,
        izin: 0,
        alfa: studentsCount || 0
      };

      todayAttendance?.forEach(record => {
        switch (record.kehadiran) {
          case 'Hadir':
            attendanceSummary.hadir++;
            attendanceSummary.alfa--;
            break;
          case 'Sakit':
            attendanceSummary.sakit++;
            attendanceSummary.alfa--;
            break;
          case 'Izin':
            attendanceSummary.izin++;
            attendanceSummary.alfa--;
            break;
        }
      });

      // Get weekly attendance data
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const { data: weeklyAttendance } = await supabase
        .from('attendences')
        .select('tanggal, kehadiran')
        .in('tanggal', dates)
        .eq('kehadiran', 'Hadir');

      const weeklyData = dates.map(date => ({
        tanggal: date,
        hadir: weeklyAttendance?.filter(record => record.tanggal === date).length || 0
      }));

      // Get total classes count
      const { count: classesCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      // Get total users count
      const { count: usersCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('deleted_at', null);

      return {
        tanggal: currentDate,
        siswa: {
          jumlah: studentsCount || 0,
          absensi_hari_ini: attendanceSummary,
          grafik_mingguan: weeklyData
        },
        kelas: {
          jumlah: classesCount || 0
        },
        petugas: {
          jumlah: usersCount || 0
        }
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      throw error;
    }
  }
}

export default new DashboardService();