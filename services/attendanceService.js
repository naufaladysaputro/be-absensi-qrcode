import moment from 'moment-timezone';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

class AttendanceService {
  // Ambil waktu saat ini di zona WIB
  getCurrentWIBTime() {
    const nowWIB = moment().tz('Asia/Jakarta');
    return {
      currentDate: nowWIB.format('YYYY-MM-DD'),  // cocok untuk simpan ke DB
      currentTime: nowWIB.format('HH:mm:ss')
    };
  }

  // Scan QR Code umum (masuk/pulang otomatis)
  async scanQRCode(data) {
    try {
      const { unique_code } = data;
      const student = await Student.findByQRCode(unique_code);
      if (!student) throw new Error('QR Code tidak valid');

      const { currentDate, currentTime } = this.getCurrentWIBTime();

      const existingAttendance = await Attendance.findByStudentAndDate(student.id, currentDate);

      if (!existingAttendance) {
        // Belum absen => catat jam masuk
        const attendance = await Attendance.create({
          students_id: student.id,
          classes_id: student.classes_id,
          tanggal: currentDate,
          jam_masuk: currentTime,
          jam_pulang: null,
          kehadiran: 'Hadir'
        });

        return {
          message: "Jam masuk berhasil dicatat",
          attendance
        };
      } else if (!existingAttendance.jam_pulang) {
        // Sudah masuk tapi belum pulang => catat jam pulang
        const attendance = await Attendance.update(existingAttendance.id, {
          jam_pulang: currentTime
        });

        return {
          message: "Jam pulang berhasil dicatat",
          attendance
        };
      } else {
        throw new Error('Siswa sudah melakukan absensi masuk dan pulang hari ini');
      }
    } catch (error) {
      throw error;
    }
  }

  // Scan khusus masuk
  async handleScanMasuk(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error('QR Code tidak valid');

    const { currentDate, currentTime } = this.getCurrentWIBTime();

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, currentDate);

    if (existingAttendance) {
      if (existingAttendance.jam_masuk && existingAttendance.jam_pulang) {
        throw new Error('Siswa sudah melakukan absensi masuk dan pulang hari ini');
      }
      if (existingAttendance.jam_masuk) {
        throw new Error('Siswa telah melakukan scan masuk hari ini');
      }
    }

    const attendance = await Attendance.create({
      students_id: student.id,
      classes_id: student.classes_id,
      tanggal: currentDate,
      jam_masuk: currentTime,
      jam_pulang: null,
      kehadiran: 'Hadir'
    });

    return {
      message: 'Jam masuk berhasil dicatat',
      attendance
    };
  }

  // Scan khusus pulang
  async handleScanPulang(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error('QR Code tidak valid');

    const { currentDate, currentTime } = this.getCurrentWIBTime();

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, currentDate);

    if (!existingAttendance) {
      throw new Error('Siswa belum melakukan scan masuk hari ini');
    }

    if (existingAttendance.jam_pulang) {
      throw new Error('Siswa sudah melakukan absensi masuk dan pulang hari ini');
    }

    const updatedAttendance = await Attendance.update(existingAttendance.id, {
      jam_pulang: currentTime
    });

    return {
      message: 'Jam pulang berhasil dicatat',
      attendance: updatedAttendance
    };
  }

  // Ambil absensi siswa berdasarkan ID dan tanggal
  async getStudentAttendance(studentId, date) {
    try {
      return await Attendance.findByStudentAndDate(studentId, date);
    } catch (error) {
      throw error;
    }
  }

  // Ambil seluruh absensi kelas berdasarkan tanggal
  async getAttendanceByClassAndDate(classId, date) {
    try {
      const students = await Student.findByClass(classId);
      const attendanceData = await Attendance.findByClassAndDate(classId, date);

      const result = students.map(student => {
        const attendance = attendanceData.find(a => a.students_id === student.id);

        return {
          id: student.id,
          nis: student.nis,
          nama_siswa: student.nama_siswa,
          jenis_kelamin: student.jenis_kelamin,
          attendance: attendance ? {
            id: attendance.id,
            tanggal: attendance.tanggal,
            jam_masuk: attendance.jam_masuk,
            jam_pulang: attendance.jam_pulang,
            kehadiran: attendance.kehadiran,
            keterangan: attendance.keterangan
          } : {
            kehadiran: 'Tanpa Keterangan',
            keterangan: null,
            jam_masuk: null,
            jam_pulang: null
          }
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  // Admin update absensi manual
  async updateAttendance(attendanceId, updateData) {
    try {
      const validKehadiran = ['Hadir', 'Sakit', 'Izin', 'Tanpa Keterangan'];
      if (!validKehadiran.includes(updateData.kehadiran)) {
        throw new Error('Status kehadiran tidak valid');
      }

      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (updateData.jam_masuk && !timeRegex.test(updateData.jam_masuk)) {
        throw new Error('Format jam masuk tidak valid');
      }
      if (updateData.jam_pulang && !timeRegex.test(updateData.jam_pulang)) {
        throw new Error('Format jam keluar tidak valid');
      }

      const existingAttendance = await Attendance.findById(attendanceId);
      if (!existingAttendance) {
        throw new Error('Data absensi tidak ditemukan');
      }

      const attendance = await Attendance.updateAttendance(attendanceId, {
        kehadiran: updateData.kehadiran,
        jam_masuk: updateData.jam_masuk || null,
        jam_pulang: updateData.jam_pulang || null,
        keterangan: updateData.keterangan || null
      });

      return attendance;
    } catch (error) {
      throw error;
    }
  }
}

export default new AttendanceService();
