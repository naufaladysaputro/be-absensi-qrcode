import PDFDocument from 'pdfkit';
import { Document, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import moment from 'moment-timezone';
import Student from '../models/Student.js';
import Attendance from '../models/Attendance.js';
import Settings from '../models/Settings.js';
import { fileURLToPath } from 'url';
import supabase from '../config/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ReportService {
  constructor() {
    // Buat direktori exports jika belum ada
    this.reportDir = path.join(__dirname, '../uploads/exports');
    fsp.mkdir(this.reportDir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') console.error('Error creating directory:', err);
    });
  }

  async generateReport(month, year, classId, format = 'pdf') {
    try {
      // Get settings data (logo & school name)
      const settings = await Settings.findAll();
      if (!settings) throw new Error('Pengaturan sekolah belum dibuat');

      // Get students data
      const students = await Student.findByClass(classId);
      if (!students || students.length === 0) {
        throw new Error('Tidak ada siswa di kelas ini');
      }

      // Get class name from first student
      const className = students[0].class.nama_kelas;

      // Calculate date range for the month
      const startDate = moment(`${year}-${month}-01`).startOf('month');
      const endDate = moment(startDate).endOf('month');
      const daysInMonth = endDate.date();

      // Get attendance data for all students in the class for the month
      const attendanceData = await this.getMonthlyAttendance(classId, startDate.toDate(), endDate.toDate());

      // Count gender
      const genderCount = this.countGender(students);

      // Generate report based on format
      if (format === 'pdf') {
        return await this.generatePDF(settings, students, attendanceData, {
          month: startDate.format('MMMM'),
          year,
          className,
          daysInMonth,
          genderCount
        });
      } else if (format === 'doc') {
        return await this.generateDOC(settings, students, attendanceData, {
          month: startDate.format('MMMM'),
          year,
          className,
          daysInMonth,
          genderCount
        });
      }
    } catch (error) {
      throw error;
    }
  }

  async getMonthlyAttendance(classId, startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('attendences')
        .select('*')
        .eq('classes_id', classId)
        .gte('tanggal', startDate.toISOString().split('T')[0])
        .lte('tanggal', endDate.toISOString().split('T')[0]);

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw error;
    }
  }

  countGender(students) {
    return students.reduce((acc, student) => {
      if (student.jenis_kelamin === 'Laki-laki') acc.male++;
      else if (student.jenis_kelamin === 'Perempuan') acc.female++;
      return acc;
    }, { male: 0, female: 0 });
  }

  async generatePDF(settings, students, attendanceData, reportInfo) {
    const doc = new PDFDocument({ 
      size: 'A4', 
      layout: 'landscape',
      margin: 20
    });

    const className = reportInfo.className.toLowerCase().replace(/\s+/g, '');
    const filename = `absensi-${reportInfo.month.toLowerCase()}-${className}.pdf`;
    const filepath = path.join(this.reportDir, filename);

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    // Set initial fonts
    doc.font('Helvetica');

    // Add logo dengan posisi yang lebih tepat
    if (settings.logo_path) {
      const logoPath = path.join(__dirname, '..', settings.logo_path);
      try {
        doc.image(logoPath, 30, 30, { width: 45 });
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }

    // Header text dengan spacing yang sesuai screenshot
    doc.fontSize(14)
	       .text('DAFTAR HADIR SISWA', 0, 30, { align: 'center' })
       .moveDown(0.3);

    
    doc.fontSize(12)
       .text('SD Negeri 02 Ujung Menteng', { align: 'center' })
       .moveDown(0.3);
    
    doc.text('TAHUN PELAJARAN 2024/2025', { align: 'center' })
       .moveDown(0.8);

    // Info bulan dan kelas dengan posisi yang tepat
    doc.fontSize(11)
              .text(`Bulan : ${reportInfo.month}`, 30, 95)
       .text(`Kelas : ${reportInfo.className} ${students[0].selection.nama_rombel}`, 30, 110);


    // Table settings dengan posisi yang disesuaikan
    const colWidths = {
            no: 20,
      nama: 110,
      day: 18,
      total: 20
    };
       const rowHeight = 16;
    let startX = 30;
    let startY = 135;


    // Generate dates array
    const dates = Array.from({ length: reportInfo.daysInMonth }, (_, i) => i + 1);
    
    // Generate day names with correct days
    const dayNames = dates.map(date => {
      const dayDate = moment(`${reportInfo.year}-${reportInfo.month}-${date}`, 'YYYY-MMMM-D');
      const dayName = dayDate.format('ddd');
      const dayMap = {
        'Mon': 'Se',
        'Tue': 'Sl',
        'Wed': 'Ra',
        'Thu': 'Ka',
        'Fri': 'Ju',
        'Sat': 'Sa',
        'Sun': 'Mi'
      };
      const mappedDay = dayMap[dayName];
      if (!mappedDay) {
        console.error(`Unknown day name: ${dayName}`);
        return dayName.substring(0, 2);
      }
      return mappedDay;
    });

    // Draw table headers
    let currentX = startX;
    let currentY = startY;

    // Draw first header row (Days)
    doc.fontSize(6);
    
    [
      { text: 'No', width: colWidths.no },
      { text: 'Nama', width: colWidths.nama }
    ].forEach(header => {
      doc.rect(currentX, currentY, header.width, rowHeight * 2).stroke();
      doc.text(header.text, currentX, currentY + rowHeight / 2 + 2, {
        width: header.width,
        align: 'center'
      });
      currentX += header.width;
    });

    dayNames.forEach((day, i) => {
      doc.rect(currentX, currentY, colWidths.day, rowHeight).stroke();
      doc.text(day, currentX, currentY + 4, {
        width: colWidths.day,
        align: 'center'
      });
      currentX += colWidths.day;
    });

    ['H', 'S', 'I', 'A'].forEach(header => {
      doc.rect(currentX, currentY, colWidths.total, rowHeight * 2).stroke();
      doc.text(header, currentX, currentY + rowHeight / 2 + 2, {
        width: colWidths.total,
        align: 'center'
      });
      currentX += colWidths.total;
    });

    currentX = startX + colWidths.no + colWidths.nama;
    currentY += rowHeight;

    dates.forEach(date => {
      doc.rect(currentX, currentY, colWidths.day, rowHeight).stroke();
      doc.text(date.toString().padStart(2, '0'), currentX, currentY + 4, {
        width: colWidths.day,
        align: 'center'
      });
      currentX += colWidths.day;
    });

    currentY += rowHeight;
    doc.fontSize(6);

    students.forEach((student, index) => {
      currentX = startX;
      const studentAttendance = this.processStudentAttendance(student, attendanceData, reportInfo.daysInMonth);

      doc.rect(currentX, currentY, colWidths.no, rowHeight).stroke();
      doc.text((index + 1).toString(), currentX, currentY + 4, {
        width: colWidths.no,
        align: 'center'
      });
      currentX += colWidths.no;

      doc.rect(currentX, currentY, colWidths.nama, rowHeight).stroke();
      doc.text(student.nama_siswa, currentX + 2, currentY + 4, {
        width: colWidths.nama - 4,
        align: 'left'
      });
      currentX += colWidths.nama;

      studentAttendance.daily.forEach(status => {
        doc.rect(currentX, currentY, colWidths.day, rowHeight).stroke();
        
        if (status === 'A') {
          doc.fillColor('#ff4d4d')
             .rect(currentX, currentY, colWidths.day, rowHeight)
             .fill()
             .strokeColor('#000000')
             .stroke();
          
          doc.fillColor('#ffffff');
        } else {
          doc.fillColor('#000000');
        }

        doc.text(status, currentX, currentY + 4, {
          width: colWidths.day,
          align: 'center'
        });
        
        doc.fillColor('#000000');
        currentX += colWidths.day;
      });

      ['H', 'S', 'I', 'A'].forEach(type => {
        doc.rect(currentX, currentY, colWidths.total, rowHeight).stroke();
        doc.text(studentAttendance.totals[type].toString(), currentX, currentY + 4, {
          width: colWidths.total,
          align: 'center'
        });
        currentX += colWidths.total;
      });

      currentY += rowHeight;
    });

    currentY += 15;
    doc.fontSize(8)
       .text('Keterangan:', 20, currentY)
       .text('H : Hadir', 35, currentY + 15)
       .text('S : Sakit', 35, currentY + 30)
       .text('I : Izin', 35, currentY + 45)
       .text('A : Alpa', 35, currentY + 60);

    doc.text(`Jumlah siswa: ${students.length}`, 20, currentY + 80)
       .text(`Laki-laki   : ${reportInfo.genderCount.male}`, 20, currentY + 90)
       .text(`Perempuan   : ${reportInfo.genderCount.female}`, 20, currentY + 100);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve({ filepath, filename }));
      stream.on('error', reject);
    });
  }

  async generateDOC(settings, students, attendanceData, reportInfo) {
    const filename = `attendance_${reportInfo.className}_${reportInfo.month}_${reportInfo.year}.docx`;
    const filepath = path.join(this.reportDir, filename);

    const doc = new Document();

    const buffer = await Packer.toBuffer(doc);
    await fsp.writeFile(filepath, buffer);

    return { filepath, filename };
  }

  processStudentAttendance(student, attendanceData, daysInMonth) {
    const result = {
      daily: Array(daysInMonth).fill('-'),
      totals: { H: 0, S: 0, I: 0, A: 0 }
    };

    attendanceData
      .filter(att => att.students_id === student.id)
      .forEach(att => {
        const day = new Date(att.tanggal).getDate() - 1;
        const status = this.getAttendanceCode(att.kehadiran);
        result.daily[day] = status;
        result.totals[status]++;
      });

    result.totals.A = daysInMonth - (result.totals.H + result.totals.S + result.totals.I);

    return result;
  }

  getAttendanceCode(kehadiran) {
    switch (kehadiran) {
      case 'Hadir': return 'H';
      case 'Sakit': return 'S';
      case 'Izin': return 'I';
      default: return 'A';
    }
  }
}

export default new ReportService();