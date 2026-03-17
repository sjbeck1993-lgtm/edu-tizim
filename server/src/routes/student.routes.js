const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, authorizeRole('STUDENT'), studentController.getStudentDashboardStats);

module.exports = router;
