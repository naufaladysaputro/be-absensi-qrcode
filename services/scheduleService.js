import Schedule from "../models/Schedule.js";
import fs from "fs/promises";
import path from "path";

class ScheduleService {
  // Get all schedules
  async getAllSchedules() {
    try {
      return await Schedule.getAll();
    } catch (error) {
      throw new Error("Error getting schedules: " + error.message);
    }
  }

  // Get schedule by ID
  async getScheduleById(id) {
    try {
      const schedule = await Schedule.getById(id);
      if (!schedule) {
        throw new Error("Schedule not found");
      }
      return schedule;
    } catch (error) {
      throw new Error("Error getting schedule: " + error.message);
    }
  }

  // Create new schedule
  async createSchedule(scheduleData, file) {
    try {
      if (!file) {
        throw new Error("Schedule file is required");
      }

      const data = {
        classes_id: scheduleData.classes_id,
        schedule_path: file.filename,
        modified_by: scheduleData.userId,
      };

      return await Schedule.create(data);
    } catch (error) {
      // If error occurs, delete uploaded file
      if (file) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }
      throw new Error("Error creating schedule: " + error.message);
    }
  }

  // Update schedule
  async updateSchedule(id, scheduleData, file) {
    try {
      const existingSchedule = await Schedule.getById(id);
      if (!existingSchedule) {
        if (file) {
          await fs.unlink(file.path);
        }
        throw new Error("Schedule not found");
      }

      const data = {
        classes_id: scheduleData.classes_id || existingSchedule.classes_id,
        schedule_path: file ? file.filename : existingSchedule.schedule_path,
        modified_by: scheduleData.userId,
      };

      // If new file is uploaded, delete old file
      if (file && existingSchedule.schedule_path) {
        const oldFilePath = path.join("uploads", "schedules", existingSchedule.schedule_path);
        try {
          await fs.unlink(oldFilePath);
        } catch (unlinkError) {
          console.error("Error deleting old file:", unlinkError);
        }
      }

      return await Schedule.update(id, data);
    } catch (error) {
      // If error occurs, delete new uploaded file
      if (file) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }
      throw new Error("Error updating schedule: " + error.message);
    }
  }

async upsertSchedule(scheduleData, file) {
    try {
      console.log({ scheduleData, file });
      if (!file) {
        throw new Error('Schedule file is required');
      }

      // existingSchedule is now an array
      const existingSchedules = await Schedule.getByClassId(
        scheduleData.classes_id
      );

      const data = {
        classes_id: parseInt(scheduleData.classes_id),
        schedule_path: file.filename,
        modified_by: parseInt(scheduleData.userId),
      };
      console.log({ existingSchedules });

      if (Array.isArray(existingSchedules) && existingSchedules.length > 0) {
        // Update all existing schedules (or just the first, depending on requirements)
        for (const existingSchedule of existingSchedules) {
          // Hapus file lama
          if (existingSchedule.schedule_path) {
            const oldFilePath = path.join(
              'uploads',
              'schedules',
              existingSchedule.schedule_path
            );
            try {
              await fs.unlink(oldFilePath);
            } catch (unlinkError) {
              console.error('Error deleting old file:', unlinkError);
            }
          }
          // Update the schedule
          await Schedule.update(parseInt(existingSchedule.id), data);
        }
        // Return the updated schedules (or just the first, depending on requirements)
        return existingSchedules;
      } else {
        // Jika belum ada: create
        return await Schedule.create(data);
      }
    } catch (error) {
      // Hapus file baru jika terjadi error
      if (file) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
      throw new Error('Error saving schedule: ' + (error).message);
    }
  }

  // Delete schedule
  async deleteSchedule(id) {
    try {
      const schedule = await Schedule.delete(id);
      if (!schedule) {
        throw new Error("Schedule not found");
      }
      return schedule;
    } catch (error) {
      throw new Error("Error deleting schedule: " + error.message);
    }
  }
}

// const scheduleService = new ScheduleService();
export default new ScheduleService();
