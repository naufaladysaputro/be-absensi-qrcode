import studentsService from "../services/studentsService.js";
import classesService from "../services/classesService.js";
import Student from '../models/Student.js';


/**
 * Controller untuk manajemen data siswa
 */
class StudentsController {
  /**
   * Mendapatkan semua siswa
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllStudents(req, res) {
    try {
      const { kelasId } = req.query; // ambil dari query parameter
      const students = await studentsService.getAllStudents(kelasId);

      return res.status(200).json({
        status: "success",
        data: students,
      });
    } catch (error) {
      console.error("Error in getAllStudents controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat mengambil data siswa",
      });
    }
  }

  /**
   * Mendapatkan siswa berdasarkan ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getStudentById(req, res) {
    try {
      const { id } = req.params;
      const student = await studentsService.getStudentById(id);

      if (!student) {
        return res.status(404).json({
          status: "error",
          message: "Siswa tidak ditemukan",
        });
      }

      return res.status(200).json({
        status: "success",
        data: student,
      });
    } catch (error) {
      console.error("Error in getStudentById controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat mengambil data siswa",
      });
    }
  }

  /**
   * Membuat siswa baru
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async createStudent(req, res) {
    try {
      const { nis, nama_siswa, jenis_kelamin, classes_id } = req.body;

      // Validate required fields
      if (!nis || !nama_siswa || !jenis_kelamin || !classes_id) {
        return res.status(400).json({
          status: "error",
          message: "Semua field harus diisi",
        });
      }

      // Validate jenis_kelamin enum
      if (!["Laki-laki", "Perempuan"].includes(jenis_kelamin)) {
        return res.status(400).json({
          status: "error",
          message: "Jenis kelamin harus Laki-laki atau Perempuan",
        });
      }

      // Validate if class exists and get its selection
      const kelas = await classesService.getClassById(classes_id);
      if (!kelas) {
        return res.status(400).json({
          status: "error",
          message: "Kelas yang dipilih tidak valid",
        });
      }

      // Get selections_id from the class
      const selections_id = kelas.selections_id;
      if (!selections_id) {
        return res.status(400).json({
          status: "error",
          message: "Kelas tidak memiliki rombel yang valid",
        });
      }

      // Check if NIS already exists
      const exists = await studentsService.checkNISExists(nis);
      if (exists) {
        return res.status(400).json({
          status: "error",
          message: "NIS sudah terdaftar",
        });
      }
      // const isUsed = await Student.isNISUsed(nis, id);
      // if (isUsed) {
      //   return res.status(400).json({
      //     status: "error",
      //     message: "NIS sudah terdaftar oleh siswa lain",
      //   });
      // }

      const userId = req.user.id;
      const studentId = await studentsService.createStudent(
        {
          nis,
          nama_siswa,
          jenis_kelamin,
          classes_id,
          selections_id,
        },
        userId
      );

      const newStudent = await studentsService.getStudentById(studentId);

      return res.status(201).json({
        status: "success",
        message: "Siswa berhasil ditambahkan",
        data: newStudent,
      });
    } catch (error) {
      console.error("Error in createStudent controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat menambahkan siswa",
      });
    }
  }

  /**
   * Memperbarui siswa yang sudah ada
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateStudent(req, res) {
    try {
      const { id } = req.params;
      const { nis, nama_siswa, jenis_kelamin, classes_id } = req.body;

      // Validate required fields
      if (!nis || !nama_siswa || !jenis_kelamin || !classes_id) {
        return res.status(400).json({
          status: "error",
          message: "Semua field harus diisi",
        });
      }

      // Validate jenis_kelamin enum
      if (!["Laki-laki", "Perempuan"].includes(jenis_kelamin)) {
        return res.status(400).json({
          status: "error",
          message: "Jenis kelamin harus Laki-laki atau Perempuan",
        });
      }

      // Check if student exists
      const student = await studentsService.getStudentById(id);
      if (!student) {
        return res.status(404).json({
          status: "error",
          message: "Siswa tidak ditemukan",
        });
      }

      // Validate if class exists and get its selection
      const kelas = await classesService.getClassById(classes_id);
      if (!kelas) {
        return res.status(400).json({
          status: "error",
          message: "Kelas yang dipilih tidak valid",
        });
      }

      // Get selections_id from the class
      const selections_id = kelas.selections_id;
      if (!selections_id) {
        return res.status(400).json({
          status: "error",
          message: "Kelas tidak memiliki rombel yang valid",
        });
      }

      // Check if the new NIS already exists (excluding current student)
      // const exists = await studentsService.checkNISExists(nis, id);
      // if (exists) {
      //   return res.status(400).json({
      //     status: "error",
      //     message: "NIS sudah terdaftar",
      //   });
      // }
      const isNisUsedByOther = await Student.isNISUsed(nis, id);
      if (isNisUsedByOther) {
        return res.status(400).json({
          status: "error",
          message: "NIS sudah terdaftar oleh siswa lain",
        });
      }


      const userId = req.user.id;
      const success = await studentsService.updateStudent(
        id,
        {
          nis,
          nama_siswa,
          jenis_kelamin,
          classes_id,
          selections_id,
        },
        userId
      );

      if (!success) {
        return res.status(500).json({
          status: "error",
          message: "Gagal mengupdate siswa",
        });
      }

      const updatedStudent = await studentsService.getStudentById(id);

      return res.status(200).json({
        status: "success",
        message: "Siswa berhasil diupdate",
        data: updatedStudent,
      });
    } catch (error) {
      console.error("Error in updateStudent controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat mengupdate siswa",
      });
    }
  }

  /**
   * Menghapus siswa (soft delete)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deleteStudent(req, res) {
    try {
      const { id } = req.params;

      // Check if student exists
      const student = await studentsService.getStudentById(id);
      if (!student) {
        return res.status(404).json({
          status: "error",
          message: "Siswa tidak ditemukan",
        });
      }

      const userId = req.user.id;
      const success = await studentsService.deleteStudent(id, userId);

      if (!success) {
        return res.status(500).json({
          status: "error",
          message: "Gagal menghapus siswa",
        });
      }

      return res.status(200).json({
        status: "success",
        message: "Siswa berhasil dihapus",
      });
    } catch (error) {
      console.error("Error in deleteStudent controller:", error);
      return res.status(500).json({
        status: "error",
        message: "Terjadi kesalahan saat menghapus siswa",
      });
    }
  }
}

export default new StudentsController();
