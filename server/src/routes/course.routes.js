const express = require('express');
const router = express.Router();
const courseController = require('../controllers/course.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');

// Hujjat/prezentatsiya fayllari ma'lumotlar bazasiga (base64) saqlanadi -
// Render'ning bepul tarifidagi disk har deployda tozalanadi. Video kabi
// katta fayllar uchun bu yaramaydi, shuning uchun video turi alohida
// havola (link) sifatida saqlanadi, fayl sifatida emas.
const materialUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024 }
});
const handleMaterialUpload = (req, res, next) => {
    materialUpload.single('file')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? "Fayl hajmi 8MB dan oshmasligi kerak."
                : (err.message || "Fayl yuklashda xatolik yuz berdi.");
            return res.status(400).json({ message });
        }
        next();
    });
};

// Allow// Admins and Teachers can view
router.get('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.getAllCourses);

// Only admins can create/update/delete courses and groups
router.post('/', authenticateToken, authorizeRole('ADMIN'), courseController.createCourse);
router.put('/:id', authenticateToken, authorizeRole('ADMIN'), courseController.updateCourse);
router.delete('/:id', authenticateToken, authorizeRole('ADMIN'), courseController.deleteCourse);
router.post('/groups', authenticateToken, authorizeRole('ADMIN'), courseController.createGroup);
router.put('/groups/:id', authenticateToken, authorizeRole('ADMIN'), courseController.updateGroup);
router.delete('/groups/:id', authenticateToken, authorizeRole('ADMIN'), courseController.deleteGroup);

// Materials
router.get('/materials/all', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.getMaterials);
router.post('/materials/upload', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), handleMaterialUpload, courseController.uploadMaterial);
router.delete('/materials/:id', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), courseController.deleteMaterial);

module.exports = router;
