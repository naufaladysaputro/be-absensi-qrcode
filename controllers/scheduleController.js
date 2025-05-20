import  ScheduleService  from '../services/scheduleService.js';

// const ScheduleService = new ScheduleService();
const scheduleController = {// Get all schedules
    getAllSchedules: async (req, res) => {
        try {
            const schedules = await ScheduleService.getAllSchedules();
            res.json({
                status: 'success',
                data: schedules
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Get schedule by ID
    getScheduleById: async (req, res) => {
        try {
            const schedule = await ScheduleService.getScheduleById(req.params.id);
            res.json({
                status: 'success',
                data: schedule
            });
        } catch (error) {
            if (error.message === 'Schedule not found') {
                return res.status(404).json({
                    status: 'error',
                    message: error.message
                });
            }
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Create new schedule
    createSchedule: async (req, res) => {
        try {
            const scheduleData = {
                classes_id: req.body.classes_id,
                userId: req.user.id
            };

            const schedule = await ScheduleService.createSchedule(scheduleData, req.file);
            res.status(201).json({
                status: 'success',
                data: schedule
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Update schedule
    updateSchedule: async (req, res) => {
        try {
            const scheduleData = {
                classes_id: req.body.classes_id,
                userId: req.user.id
            };

            const schedule = await ScheduleService.updateSchedule(req.params.id, scheduleData, req.file);
            res.json({
                status: 'success',
                data: schedule
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'error',
                    message: error.message
                });
            }
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },

    // Upsert schedule (create if not exists, update if exists)
    upsertSchedule: async (req, res) => {
        try {
            const scheduleData = {
                classes_id: req.body.classes_id,
                userId: req.user.id
            };

            const schedule = await ScheduleService.upsertSchedule(scheduleData, req.file);
            res.status(200).json({
                status: 'success',
                data: schedule
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    },


    // Delete schedule
    deleteSchedule: async (req, res) => {
        try {
            await ScheduleService.deleteSchedule(req.params.id);
            res.json({
                status: 'success',
                message: 'Schedule deleted successfully'
            });
        } catch (error) {
            if (error.message.includes('not found')) {
                return res.status(404).json({
                    status: 'error',
                    message: error.message
                });
            }
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }
};

export default scheduleController;
