const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Telegram Bot
require('./bot');

// Import and initialize Cron Jobs
const startSubscriptionCron = require('./cron/subscription.job');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON requests
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Basic Route for Testing
app.get('/', (req, res) => {
    res.json({ message: 'SmartCenter API is running successfully!' });
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

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    startSubscriptionCron(); // Start the background daily checker
});
