import moment from 'moment-timezone';
import Attendance from '../models/Attendance.js';
import Student from '../models/Student.js';

class AttendanceService {
  getCurrentWIBTime() {
    const nowWIB = moment().tz('Asia/Jakarta');
    return {
      currentDate: nowWIB.format('YYYY-MM-DD'),
      currentTime: nowWIB.format('HH:mm:ss')
    };
  }

  async scanQRCode(data) {
    try {
      const { unique_code } = data;
      const student = await Student.findByQRCode(unique_code);
      if (!student) throw new Error('QR Code tidak valid');

      const { currentDate, currentTime } = this.getCurrentWIBTime();
      const today = moment().tz('Asia/Jakarta').startOf('day').toDate();

      const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

      if (!existingAttendance) {
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
          attendance: {
            id: attendance.id,
            student_id: attendance.students_id,
            tanggal: attendance.tanggal,
            jam_masuk: attendance.jam_masuk,
            jam_pulang: attendance.jam_pulang
          }
        };
      } else if (!existingAttendance.jam_pulang) {
        const attendance = await Attendance.update(existingAttendance.id, {
          jam_pulang: currentTime
        });

        return {
          message: "Jam pulang berhasil dicatat",
          attendance: {
            id: attendance.id,
            student_id: attendance.students_id,
            tanggal: attendance.tanggal,
            jam_masuk: attendance.jam_masuk,
            jam_pulang: attendance.jam_pulang
          }
        };
      } else {
        throw new Error('Siswa sudah melakukan absensi masuk dan pulang hari ini');
      }
    } catch (error) {
      throw error;
    }
  }

  async handleScanMasuk(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error('QR Code tidak valid');

    const { currentDate, currentTime } = this.getCurrentWIBTime();
    const today = moment().tz('Asia/Jakarta').startOf('day').toDate();

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

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

  async handleScanPulang(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error('QR Code tidak valid');

    const { currentTime } = this.getCurrentWIBTime();
    const today = moment().tz('Asia/Jakarta').startOf('day').toDate();

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

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

  async getStudentAttendance(studentId, date) {
    try {
      return await Attendance.findByStudentAndDate(studentId, date);
    } catch (error) {
      throw error;
    }
  }

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
