const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Get group students and their attendance status for today
router.get('/:groupId', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), attendanceController.getGroupAttendance);

// Save bulk attendance
router.post('/', authenticateToken, authorizeRole('ADMIN', 'TEACHER'), attendanceController.saveAttendance);

module.exports = router;
