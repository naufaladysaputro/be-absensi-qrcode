import PDFDocument from 'pdfkit';
import { Document, Packer } from 'docx';
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
    this.reportDir = path.join(__dirname, '../uploads/exports');
    fsp.mkdir(this.reportDir, { recursive: true }).catch(err => {
      if (err.code !== 'EEXIST') console.error('Error creating directory:', err);
    });
  }

  async generateReport(month, year, classId, format = 'pdf') {
    try {
      const settings = await Settings.findAll();
      if (!settings) throw new Error('Pengaturan sekolah belum dibuat');

      const students = await Student.findByClass(classId);
      if (!students || students.length === 0) {
        throw new Error('Tidak ada siswa di kelas ini');
      }

      const className = students[0].class.nama_kelas;
      const startDate = moment(`${year}-${month}-01`).startOf('month');
      const endDate = moment(startDate).endOf('month');
      const daysInMonth = endDate.date();
      const attendanceData = await this.getMonthlyAttendance(classId, startDate.toDate(), endDate.toDate());
      const genderCount = this.countGender(students);

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
    const { data, error } = await supabase
      .from('attendences')
      .select('*')
      .eq('classes_id', classId)
      .gte('tanggal', startDate.toISOString().split('T')[0])
      .lte('tanggal', endDate.toISOString().split('T')[0]);
    if (error) throw error;
    return data || [];
  }

  countGender(students) {
    return students.reduce((acc, student) => {
      if (student.jenis_kelamin === 'Laki-laki') acc.male++;
      else if (student.jenis_kelamin === 'Perempuan') acc.female++;
      return acc;
    }, { male: 0, female: 0 });
  }

  async generatePDF(settings, students, attendanceData, reportInfo) {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 20 });
    const className = reportInfo.className.toLowerCase().replace(/\s+/g, '');
    const filename = `absensi-${reportInfo.month.toLowerCase()}-${className}.pdf`;
    const filepath = path.join(this.reportDir, filename);
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);
    doc.font('Helvetica');

    if (settings.logo_path) {
      const logoPath = path.join(__dirname, '..', settings.logo_path);
      try {
        doc.image(logoPath, 30, 30, { width: 45 });
      } catch (error) {
        console.error('Error loading logo:', error);
      }
    }

    console.log('Logo Path:', settings.logo_path);

    // Judul utama
    doc.fontSize(16)
      .font('Helvetica-Bold')
      .text('DAFTAR HADIR SISWA', 0, 30, { align: 'center' });

    // Nama sekolah
    doc.fontSize(13)
      .font('Helvetica')
      .text('SD Negeri 02 Ujung Menteng', { align: 'center' });

    // Tahun ajaran
    doc.fontSize(12)
      .font('Helvetica')
      .text('TAHUN PELAJARAN 2024/2025', { align: 'center' });

    // Garis bawah kop
    doc.moveTo(30, 80).lineTo(800, 80).stroke();

    doc.font('Helvetica').fontSize(11).text(`Bulan : ${reportInfo.month}`, 30, 95).text(`Kelas : ${reportInfo.className} ${students[0].selection.nama_rombel}`, 30, 110);

    const colWidths = { no: 20, nama: 110, day: 18, total: 20 };
    const rowHeight = 16;
    const startX = 30;
    let currentY = 135;
    const dates = Array.from({ length: reportInfo.daysInMonth }, (_, i) => i + 1);
    const dayNames = dates.map(date => {
      const day = moment(`${reportInfo.year}-${reportInfo.month}-${date}`, 'YYYY-MMMM-D').format('ddd');
      return {
        'Mon': 'Sen',
        'Tue': 'Sel',
        'Wed': 'Rab',
        'Thu': 'Kam',
        'Fri': 'Jum',
        'Sat': 'Sab',
        'Sun': 'Min'
      }[day] || day;
    });

    const drawTableHeader = () => {
      let headerX = startX;
      let headerY = currentY;
      doc.fontSize(6);

      [{ text: 'No', width: colWidths.no }, { text: 'Nama', width: colWidths.nama }].forEach(header => {
        doc.rect(headerX, headerY, header.width, rowHeight * 2).stroke();
        doc.text(header.text, headerX, headerY + rowHeight / 2 + 2, {
          width: header.width,
          align: 'center'
        });
        headerX += header.width;
      });

      dayNames.forEach(day => {
        console.log(day);
        
        const isWeekend = (day === 'Jum' || day === 'Sab');
        doc.rect(headerX, headerY, colWidths.day, rowHeight).stroke();
        doc.text(day, headerX, headerY + 4, {
          width: colWidths.day,
          align: 'center'
        });
        // Jika Sabtu atau Minggu, tulis merah
        doc.fillColor(isWeekend ? '#ff4d4d' : '#000000');
        headerX += colWidths.day;
      });

      ['H', 'S', 'I', 'A'].forEach(type => {
        doc.rect(headerX, headerY, colWidths.total, rowHeight * 2).stroke();
        doc.text(type, headerX, headerY + rowHeight / 2 + 2, {
          width: colWidths.total,
          align: 'center'
        });
        headerX += colWidths.total;
      });

      currentY += rowHeight;
      let currentX = startX + colWidths.no + colWidths.nama;
      dates.forEach(date => {
        doc.rect(currentX, currentY, colWidths.day, rowHeight).stroke();
        doc.text(date.toString().padStart(2, '0'), currentX, currentY + 4, {
          width: colWidths.day,
          align: 'center'
        });
        currentX += colWidths.day;
      });

      currentY += rowHeight;
    };

    drawTableHeader();

    students.forEach((student, index) => {
      if (currentY + rowHeight > doc.page.height - 50) {
        doc.addPage();
        currentY = 30;
        drawTableHeader();
      }

      let currentX = startX;
      const attendance = this.processStudentAttendance(student, attendanceData, reportInfo.daysInMonth);

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

      attendance.daily.forEach(status => {
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
        doc.text(attendance.totals[type].toString(), currentX, currentY + 4, {
          width: colWidths.total,
          align: 'center'
        });
        currentX += colWidths.total;
      });

      currentY += rowHeight;
    });

    currentY += 15;
    doc.fontSize(9)
      .font('Helvetica-Bold')
      .text('Keterangan', 30, currentY)
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(8)
      .text('H : Hadir', { indent: 15 })
      .text('S : Sakit', { indent: 15 })
      .text('I : Izin', { indent: 15 })
      .text('A : Alpa', { indent: 15 });

    currentY = doc.y + 10;

    doc.fontSize(9)
      .font('Helvetica-Bold')
      .text('Rekapitulasi Siswa', 30, currentY)
      .moveDown(0.5);

    doc.font('Helvetica')
      .fontSize(8)
      .text(`Jumlah siswa  : ${students.length}`, { indent: 15 })
      .text(`Laki-laki     : ${reportInfo.genderCount.male}`, { indent: 15 })
      .text(`Perempuan     : ${reportInfo.genderCount.female}`, { indent: 15 });


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
