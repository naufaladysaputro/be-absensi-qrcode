import Settings from "../models/Settings.js";
import moment from "moment-timezone";
import Attendance from "../models/Attendance.js";
import Student from "../models/Student.js";

class AttendanceService {
  getCurrentWIBTime() {
    const nowWIB = moment().tz("Asia/Jakarta");
    return {
      currentDate: nowWIB.format("YYYY-MM-DD"),
      currentTime: nowWIB.format("HH:mm:ss"),
    };
  }

  async scanQRCode(data) {
    try {
      const { unique_code } = data;
      const student = await Student.findByQRCode(unique_code);
      if (!student) throw new Error("QR Code tidak valid");

      const { currentDate, currentTime } = this.getCurrentWIBTime();
      const today = moment().tz("Asia/Jakarta").startOf("day").toDate();

      const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

      if (!existingAttendance) {
        const attendance = await Attendance.create({
          students_id: student.id,
          classes_id: student.classes_id,
          tanggal: currentDate,
          jam_masuk: currentTime,
          jam_pulang: null,
          kehadiran: "Hadir",
        });

        return {
          message: "Jam masuk berhasil dicatat",
          attendance: {
            id: attendance.id,
            student_id: attendance.students_id,
            tanggal: attendance.tanggal,
            jam_masuk: attendance.jam_masuk,
            jam_pulang: attendance.jam_pulang,
          },
        };
      } else if (!existingAttendance.jam_pulang) {
        const attendance = await Attendance.update(existingAttendance.id, {
          jam_pulang: currentTime,
        });

        return {
          message: "Jam pulang berhasil dicatat",
          attendance: {
            id: attendance.id,
            student_id: attendance.students_id,
            tanggal: attendance.tanggal,
            jam_masuk: attendance.jam_masuk,
            jam_pulang: attendance.jam_pulang,
          },
        };
      } else {
        throw new Error("Siswa sudah melakukan absensi masuk dan pulang hari ini");
      }
    } catch (error) {
      throw error;
    }
  }

  async handleScanMasuk(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error("QR Code tidak valid");

    const { currentDate, currentTime } = this.getCurrentWIBTime();
    const today = moment().tz("Asia/Jakarta").toDate();
    const settings = await Settings.findAll();

    if (currentTime > settings.jam_masuk) throw new Error("Jam scan sudah lewat");

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

    if (existingAttendance[0]) {
      if (existingAttendance[0].jam_masuk && existingAttendance[0].jam_pulang) {
        throw new Error("Siswa sudah melakukan absensi masuk dan pulang hari ini");
      }
      if (existingAttendance[0].jam_masuk) {
        throw new Error("Siswa telah melakukan scan masuk hari ini");
      }
    }
    console.log(today, currentDate, currentTime, existingAttendance, student.id);
    console.log(typeof student.id, typeof student.classes_id);

    const attendance = await Attendance.create({
      students_id: student.id,
      classes_id: student.classes_id,
      tanggal: currentDate,
      jam_masuk: currentTime,
      jam_pulang: null,
      kehadiran: "Hadir",
    });

    return {
      message: "Jam masuk berhasil dicatat",
      attendance,
    };
  }

  async handleScanPulang(unique_code) {
    const student = await Student.findByQRCode(unique_code);
    if (!student) throw new Error("QR Code tidak valid");

    const { currentTime } = this.getCurrentWIBTime();
    const today = moment().tz("Asia/Jakarta").toDate();

    const existingAttendance = await Attendance.findByStudentAndDate(student.id, today);

    if (!existingAttendance[0]) {
      throw new Error("Siswa belum melakukan scan masuk hari ini");
    }

    if (existingAttendance[0].jam_pulang) {
      throw new Error("Siswa sudah melakukan absensi masuk dan pulang hari ini");
    }

    const updatedAttendance = await Attendance.update(existingAttendance[0].id, {
      jam_pulang: currentTime,
    });

    return {
      message: "Jam pulang berhasil dicatat",
      attendance: updatedAttendance,
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
      // First get all students in the class
      const students = await Student.findByClass(classId);

      // Get attendance records for all students in this class for the given date
      const attendanceData = await Attendance.findByClassAndDate(classId, date);

      // Map student data with their attendance
      const result = students.map((student) => {
        const attendance = attendanceData.find((a) => a.students_id === student.id);
        console.log(attendance);
        return {
          id: student.id,
          nis: student.nis,
          nama_siswa: student.nama_siswa,
          jenis_kelamin: student.jenis_kelamin,
          attendance: attendance
            ? {
                id: attendance.id,
                tanggal: attendance.tanggal,
                jam_masuk: attendance.jam_masuk,
                jam_pulang: attendance.jam_pulang,
                kehadiran: attendance.kehadiran,
                keterangan: attendance.keterangan,
              }
            : {
                kehadiran: "Tanpa Keterangan",
                keterangan: null,
                jam_masuk: null,
                jam_pulang: null,
              },
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  async updateAttendance(attendanceId, updateData) {
    try {
      // Validate kehadiran enum
      const validKehadiran = ["Hadir", "Sakit", "Izin", "Alfa", "Tanpa Keterangan"];
      if (!validKehadiran.includes(updateData.kehadiran)) {
        throw new Error("Status kehadiran tidak valid");
      }

      // Validate time format if provided
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
      if (updateData.jam_masuk && !timeRegex.test(updateData.jam_masuk)) {
        throw new Error("Format jam masuk tidak valid");
      }
      if (updateData.jam_pulang && !timeRegex.test(updateData.jam_pulang)) {
        throw new Error("Format jam keluar tidak valid");
      }

      // Get existing attendance
      const existingAttendance = await Attendance.findById(attendanceId);
      if (!existingAttendance) {
        throw new Error("Data absensi tidak ditemukan");
      }
      console.log(existingAttendance);

      // Update attendance
      const attendance = await Attendance.updateAttendance(attendanceId, {
        kehadiran: updateData.kehadiran,
        jam_masuk: updateData.jam_masuk || null,
        jam_pulang: updateData.jam_pulang || null,
        keterangan: updateData.keterangan || null,
      });

      return attendance;
    } catch (error) {
      throw error;
    }
  }

  async updateAttendanceByStudentAndDate({ students_id, tanggal, kehadiran, jam_masuk, jam_pulang, keterangan }) {
    const validKehadiran = ["Hadir", "Sakit", "Izin", "Alfa", "Tanpa Keterangan"];
    if (!validKehadiran.includes(kehadiran)) {
      throw new Error("Status kehadiran tidak valid");
    }
    const attendanceDate = moment(tanggal).tz("Asia/Jakarta").format("YYYY-MM-DD");
    const existingAttendance = await Attendance.findByStudentAndDate(students_id, attendanceDate);

    if (!existingAttendance[0]) {
      // Ambil data student untuk mendapatkan classes_id
      const student = await Student.findById(students_id);
      if (!student) {
        throw new Error("Data siswa tidak ditemukan");
      }

      // Buat absensi baru jika belum ada
      const newAttendance = await Attendance.create({
        students_id,
        classes_id: student.classes_id,
        tanggal: attendanceDate,
        kehadiran,
        jam_masuk: jam_masuk || null,
        jam_pulang: jam_pulang || null,
        keterangan: keterangan || null,
      });

      return newAttendance;
    }

    console.log(existingAttendance[0].id)
    
    const updated = await Attendance.updateAttendance(existingAttendance[0].id, {
      kehadiran,
      jam_masuk: jam_masuk || null,
      jam_pulang: jam_pulang || null,
      keterangan: keterangan || null,
    });
    console.log(updated);
    

    return updated;
  }
}

export default new AttendanceService();
