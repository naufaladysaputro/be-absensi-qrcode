// middlewares/scheduleUploadHandler.js
const scheduleUploadHandler = (req, res, next) => {
    scheduleUpload.single('schedule')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                status: 'error',
                message: 'Error saat upload file: ' + err.message
            });
        } else if (err) {
            return res.status(400).json({
                status: 'error',
                message: err.message || 'Terjadi kesalahan saat upload file'
            });
        }
        next();
    });
};

module.exports = scheduleUploadHandler;
