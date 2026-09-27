const express = require('express');
const router = express.Router();
const multer = require('multer');
const authController = require('../controllers/auth.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Avatar rasm suratlari diskka emas, bazaga (base64) saqlanadi — shuning
// uchun memoryStorage ishlatiladi, faylni diskka yozmaymiz.
const avatarUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error("Faqat rasm fayllari qabul qilinadi."));
        }
        cb(null, true);
    }
});

// POST /api/auth/login
router.post('/login', authController.login);

// GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, authController.getMe);

// PUT /api/auth/change-password (Protected Route)
router.put('/change-password', authenticateToken, authController.changePassword);

// multer xatolarini (noto'g'ri fayl turi, hajm chegarasi) aniq xabar bilan qaytarish
const handleAvatarUpload = (req, res, next) => {
    avatarUpload.single('avatar')(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Rasm yuklashda xatolik yuz berdi." });
        }
        next();
    });
};

// POST /api/auth/avatar — o'zining profil rasmini yuklaydi
router.post('/avatar', authenticateToken, handleAvatarUpload, authController.uploadAvatar);

// POST /api/auth/avatar/:userId — admin boshqa foydalanuvchi (o'quvchi/o'qituvchi) uchun yuklaydi
router.post('/avatar/:userId', authenticateToken, authorizeRole('ADMIN'), handleAvatarUpload, authController.uploadAvatar);

module.exports = router;
