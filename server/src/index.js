const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Xavfsizlik uchun majburiy: JWT_SECRET bo'lmasa server ishga tushmaydi.
// (Avval kodga "super_secret_key_123" degan standart qiymat yozilgan edi —
// bu token'larni istalgan kishi soxtalashtirishi mumkinligini anglatardi.)
if (!process.env.JWT_SECRET) {
    console.error(
        '❌ XATOLIK: JWT_SECRET muhit o\'zgaruvchisi topilmadi!\n' +
        'Iltimos, .env faylida (yoki Render/Vercel muhit sozlamalarida) uzun va tasodifiy JWT_SECRET qiymatini belgilang.\n' +
        'Xavfsizlik uchun server ishga tushirilmayapti.'
    );
    process.exit(1);
}

// Initialize Telegram Bot
require('./bot');

// Import and initialize Cron Jobs
const startSubscriptionCron = require('./cron/subscription.job');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS: ruxsat etilgan manbalar CORS_ORIGIN orqali sozlanadi (vergul bilan ajratilgan ro'yxat).
// Masalan: CORS_ORIGIN=https://mening-markazim.vercel.app,https://mymarkaz.uz
const allowedOrigins = (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

if (allowedOrigins.length === 0) {
    console.warn(
        '⚠️  DIQQAT: CORS_ORIGIN muhit o\'zgaruvchisi sozlanmagan — server hozircha barcha manbalardan so\'rovlarni qabul qilyapti.\n' +
        'Productionda xavfsizlik uchun CORS_ORIGIN ni frontend domeningizga o\'rnating.'
    );
}

app.use(helmet());
app.use(cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
}));

// Umumiy so'rovlar uchun cheklov (suiiste'moldan himoya)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', generalLimiter);

// Login uchun qattiqroq cheklov (brute-force hujumlardan himoya)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Juda ko'p urinish qildingiz. Iltimos, 15 daqiqadan so'ng qayta urinib ko'ring." },
});
app.use('/api/auth/login', loginLimiter);

app.use(express.json()); // Parses incoming JSON requests
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Basic Route for Testing
app.get('/', (req, res) => {
    res.json({ message: 'SmartCenter API is running successfully on Render!' });
});

// Import specific routes
const authRoutes = require('./routes/auth.routes');
const leadRoutes = require('./routes/lead.routes');
const hrRoutes = require('./routes/hr.routes');
const courseRoutes = require('./routes/course.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const paymentRoutes = require('./routes/payment.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const homeworkRoutes = require('./routes/homework.routes');
const studentRoutes = require('./routes/student.routes');
const studentsAdminRoutes = require('./routes/studentsAdmin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/student-profile', studentRoutes);
app.use('/api/students', studentsAdminRoutes);

// 404 — mavjud bo'lmagan manzillar uchun
app.use((req, res) => {
    res.status(404).json({ message: "So'ralgan manzil topilmadi." });
});

// Markaziy xato boshqaruvchisi (har qanday kutilmagan xatolik uchun so'nggi to'siq)
app.use((err, req, res, next) => {
    console.error('Kutilmagan server xatosi:', err);
    res.status(err.status || 500).json({ message: 'Serverda kutilmagan xatolik yuz berdi.' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
    startSubscriptionCron(); // Start the background daily checker
});